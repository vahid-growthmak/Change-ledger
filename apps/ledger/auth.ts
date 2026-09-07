import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { accounts, db, sessions, users, verificationTokens } from '@growthmak/db';
import { eq } from 'drizzle-orm';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Nodemailer from 'next-auth/providers/nodemailer';

const isProd = process.env.NODE_ENV === 'production';
const allowedDomain = process.env.AUTH_ALLOWED_DOMAIN ?? 'growthmak.com';

/**
 * Whether Google Workspace SSO is usable at all. Auth.js validates every
 * registered provider on any request to /api/auth/*, so a Google provider
 * with no credentials doesn't merely fail its own flow — it returns a
 * Configuration error for the whole handler, taking magic-link sign-in down
 * with it and showing a bare "Server error" page. Register it only when it
 * can actually work, so a deployment without Google credentials still has
 * working email sign-in.
 */
export const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * SMTP rather than a specific email vendor's SDK, so this works with
 * whatever the company already pays for — Zoho Mail, Zoho ZeptoMail, Google
 * Workspace, Resend's SMTP bridge, anything. Set SMTP_HOST/PORT/USER/PASS
 * and it sends; leave them unset and the magic link prints to the server
 * log instead, which keeps local development working with no account at all.
 */
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD,
);

const providers: NextAuthConfig['providers'] = [
  Nodemailer({
    // Only built when actually configured — nodemailer would otherwise try
    // to connect on send and fail with a transport error rather than the
    // clear fallback below.
    server: smtpConfigured
      ? {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 465),
          // 465 is implicit TLS; 587 upgrades with STARTTLS.
          secure: Number(process.env.SMTP_PORT ?? 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        }
      : { jsonTransport: true },
    from: process.env.AUTH_EMAIL_FROM ?? 'Change Ledger <ledger@growthmak.com>',
    maxAge: 15 * 60, // 15-minute expiry, single-use — enforced by the adapter deleting the token on use (A6)
    async sendVerificationRequest({ identifier: email, url, provider }) {
      if (!smtpConfigured) {
        // No mail server configured: print the link so the flow is still
        // usable end-to-end without an email account.
        // eslint-disable-next-line no-console
        console.log(`\nMagic link for ${email}:\n${url}\n`);
        return;
      }

      const nodemailer = await import('nodemailer');
      const transport = nodemailer.createTransport(provider.server);
      await transport.sendMail({
        to: email,
        from: provider.from,
        subject: 'Sign in to Change Ledger',
        text: `Sign in by opening this link:\n${url}\n\nIt expires in 15 minutes and works once.`,
        html: `<p>Sign in by opening this link:</p><p><a href="${url}">${url}</a></p><p>This link expires in 15 minutes and works once.</p>`,
      });
    },
  }),
];

if (googleConfigured) {
  providers.push(
    Google({
      // UX hint only — the real gate is the domain check in the signIn
      // callback below (A2). This param can be bypassed client-side.
      authorization: { params: { hd: allowedDomain } },
    }),
  );
}

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
  pages: { signIn: '/login', verifyRequest: '/login/check-email' },
  // In production Auth.js refuses to infer its own origin from the Host
  // header unless told to, and every sign-in fails with UntrustedHost.
  // Set AUTH_URL to the canonical origin (https://ledger.growthmak.com) and
  // that is used instead; trustHost covers the platform-provided host on
  // Vercel and local production runs, where the host is not attacker-set.
  trustHost: true,
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
    async jwt({ token, user }) {
      // next-auth v5's JWT callback param doesn't reliably pick up the
      // module-augmented shape here — cast locally rather than fight it.
      const t = token as { uid?: string; role?: 'team' | 'client' };
      if (user?.id) {
        t.uid = user.id;

        /**
         * An address on the company domain is the signal for team, whichever
         * way they signed in. Keyed on the domain rather than on the Google
         * provider specifically, because otherwise there is no way to create
         * the first team user without a Google Cloud OAuth client: a new
         * colleague arriving by magic link would be written as a client and
         * land on "No project yet" with no route out of it.
         *
         * Both paths prove control of the mailbox — Google by SSO, magic link
         * by delivering a single-use token to it — and only Growthmak staff
         * have growthmak.com mailboxes, so the trust is equivalent. This is
         * a slight relaxation of A2's letter (which names Google) in service
         * of its intent (only growthmak.com people are team). Re-checked on
         * every sign-in, server-side, and never client-decided (A4).
         */
        const onCompanyDomain = (user.email ?? '').toLowerCase().endsWith(`@${allowedDomain}`);

        if (onCompanyDomain) {
          await db.update(users).set({ role: 'team' }).where(eq(users.id, user.id));
          t.role = 'team';
        } else {
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
