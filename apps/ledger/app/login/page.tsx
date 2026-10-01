import { Button, FieldLabel, Mark, TextInput } from '@growthmak/ui';
import { googleConfigured } from '@/auth';
import { signInWithDev, signInWithGoogle, signInWithMagicLink } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  // Auth.js raises this when its own config can't be built at all — in
  // practice a missing AUTH_SECRET, or a provider registered without its
  // credentials. Naming the likely cause beats "check the server logs",
  // which is all the default error page offers.
  Configuration:
    'Sign-in is not configured on the server. AUTH_SECRET is most likely missing from the deployment environment — the server log names the exact cause.',
  AccessDenied: `That Google account isn't on the growthmak.com workspace — team sign-in is restricted to it. Clients should use the email link instead.`,
  Verification: 'That link has expired or was already used. Request a new one below.',
  Default: 'Could not sign in. Check your connection, then try again.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <main className="max-w-page mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Mark />
        <span>
          <span className="block text-ink text-head font-bold tracking-snug">Change Ledger</span>
          <span className="block text-pencil text-meta font-medium">Growthmak</span>
        </span>
      </div>

      <div className="bg-sheet rounded-card shadow-card px-6 py-6 max-w-md grid gap-6">
        <div>
          <h1 className="text-ink text-title font-extrabold tracking-tight">Sign in</h1>
          <p className="text-pencil text-body mt-2">
            {googleConfigured
              ? 'Clients get a one-tap link by email. Growthmak signs in with a growthmak.com Google account.'
              : 'Sign in with a one-tap link by email.'}
          </p>
        </div>

        {error ? (
          <p className="text-over text-body font-medium" role="alert">
            {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
          </p>
        ) : null}

        <form action={signInWithMagicLink} className="grid gap-3">
          <div>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <TextInput
              id="login-email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="w-full">
            Email me a link
          </Button>
        </form>

        {/* Only offered when it can actually work — a button that returns a
            server error is worse than no button. */}
        {googleConfigured ? (
          <>
            <div className="flex items-center gap-4 text-pencil text-meta font-semibold">
              <span className="h-px bg-rule flex-1" />
              or
              <span className="h-px bg-rule flex-1" />
            </div>

            <form action={signInWithGoogle}>
              <Button type="submit" variant="ghost" className="w-full">
                Continue with Google
              </Button>
            </form>
          </>
        ) : null}

        {isDev ? (
          <div className="border-t border-rule pt-5 grid gap-2">
            <p className="text-pencil text-meta font-semibold">
              Dev sign-in — local only, disabled in production
            </p>
            <p className="text-pencil text-meta">
              Any @growthmak.com address signs in as team; anything else signs in as client. First
              use of an email creates it.
            </p>
            <form action={signInWithDev} className="flex gap-2">
              <TextInput
                id="dev-email"
                name="email"
                type="email"
                defaultValue="delivery@growthmak.com"
                className="flex-1 min-w-0"
              />
              <Button type="submit" variant="ghost">
                Sign in
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </main>
  );
}
