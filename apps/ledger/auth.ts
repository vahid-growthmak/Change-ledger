import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { accounts, db, sessions, users, verificationTokens } from '@growthmak/db';
import { eq } from 'drizzle-orm';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';

const isProd = process.env.NODE_ENV === 'production';
const allowedDomain = process.env.AUTH_ALLOWED_DOMAIN ?? 'growthmak.com';

const providers: NextAuthConfig['providers'] = [
  Google({
    // UX hint only — the real gate is the domain check in the signIn
    // callback below (A2). This param can be bypassed client-side.
    authorization: { params: { hd: allowedDomain } },
  }),
  Resend({
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.AUTH_EMAIL_FROM ?? 'Change Ledger <ledger@growthmak.com>',
    maxAge: 15 * 60, // 15-minute expiry, single-use — enforced by the adapter deleting the token on use (A6)
    async sendVerificationRequest({ identifier: email, url, provider }) {
      if (!process.env.RESEND_API_KEY) {
        // No email service configured: print the link so the flow is
        // still testable end-to-end without a live Resend account.
        // eslint-disable-next-line no-console
        console.log(`\nMagic link for ${email}:\n${url}\n`);
        return;
      }
      const { Resend: ResendClient } = await import('resend');
      const resend = new ResendClient(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: provider.from as string,
        to: email,
        subject: 'Sign in to Change Ledger',
        html: `<p>Sign in by opening this link:</p><p><a href="${url}">${url}</a></p><p>This link expires in 15 minutes and works once.</p>`,
      });
      if (error) throw new Error(`Resend error: ${error.message}`);
    },
  }),
];

// Never ships to production — a same-tab convenience login for exercising
// both roles without live Google/Resend credentials during local testing.
if (!isProd) {
  providers.push(
    Credentials({
      id: 'dev',
      name: 'Dev sign-in (local only)',
      credentials: { email: { label: 'Email', type: 'text' } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
          .toLowerCase()
          .trim();
        if (!email) return null;

        const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing) return { id: existing.id, email: existing.email, name: existing.name };

        const role = email.endsWith(`@${allowedDomain}`) ? 'team' : 'client';
        const [created] = await db
          .insert(users)
          .values({ email, role, name: email.split('@')[0] })
          .returning();
        return { id: created.id, email: created.email, name: created.name };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Sessions expire after 30 days (A6). Database session rows go unused
  // under 'jwt' — the adapter is still required for the Email provider's
  // verification tokens and for persisting Google-linked accounts.
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers,
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email ?? '';
        if (!email.toLowerCase().endsWith(`@${allowedDomain}`)) {
          return false; // A2 — the actual server-side enforcement, not just the hd hint
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // next-auth v5's JWT callback param doesn't reliably pick up the
      // module-augmented shape here — cast locally rather than fight it.
      const t = token as { uid?: string; role?: 'team' | 'client' };
      if (user?.id) {
        t.uid = user.id;
        if (account?.provider === 'google') {
          // Google + growthmak.com domain is the one authoritative signal
          // for team membership — confirm it every sign-in (A4).
          await db.update(users).set({ role: 'team' }).where(eq(users.id, user.id));
          t.role = 'team';
        } else {
          // Magic link and dev sign-in: role was decided at user creation
          // (default 'client', or by domain in the dev provider above) —
          // just read it back, never re-derive it from the provider.
          const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
          t.role = row?.role ?? 'client';
        }
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as { uid?: string; role?: 'team' | 'client' };
      if (session.user && t.uid) {
        session.user.id = t.uid;
        session.user.role = t.role ?? 'client';
      }
      return session;
    },
  },
});
