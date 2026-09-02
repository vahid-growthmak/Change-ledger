import { signInWithDev, signInWithGoogle, signInWithMagicLink } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
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
      <div className="border-b border-rule pb-3 mb-6">
        <span
          className="font-mono uppercase text-signal-ink"
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em' }}
        >
          Growthmak
        </span>
        <span className="font-mono uppercase text-mute" style={{ fontSize: 11, letterSpacing: '0.16em' }}>
          {' '}
          / Change Ledger
        </span>
      </div>

      <div className="bg-card border border-rule shadow-card rounded-panel px-6 py-6 max-w-md grid gap-6">
        <div>
          <h1 className="font-sans text-ink" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>
            Sign in
          </h1>
          <p className="font-sans text-mute mt-2" style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
            Clients get a one-tap link by email. Growthmak signs in with a growthmak.com Google
            account.
          </p>
        </div>

        {error ? (
          <p className="text-over font-sans" style={{ fontSize: 13 }} role="alert">
            {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
          </p>
        ) : null}

        <form action={signInWithMagicLink} className="grid gap-3">
          <div>
            <label
              htmlFor="login-email"
              className="block font-mono uppercase text-mute mb-2"
              style={{ fontSize: '9.5px', letterSpacing: '0.12em' }}
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full rounded-input border border-rule bg-paper text-ink font-sans px-3 py-3 placeholder:text-mute focus:outline-none focus:border-signal focus:bg-card"
              style={{ fontSize: '13.5px', minHeight: 44 }}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-btn font-sans font-semibold bg-signal text-white shadow-blue hover:opacity-90 px-6 py-3"
            style={{ fontSize: '13.5px', minHeight: 44 }}
          >
            Email me a link
          </button>
        </form>

        <div className="flex items-center gap-3 text-mute font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: '0.12em' }}>
          <span className="h-px bg-rule flex-1" />
          or
          <span className="h-px bg-rule flex-1" />
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-btn font-sans font-semibold bg-transparent text-ink border border-rule hover:border-signal hover:text-signal-ink px-6 py-3"
            style={{ fontSize: '13.5px', minHeight: 44 }}
          >
            Continue with Google
          </button>
        </form>

        {isDev ? (
          <div className="border-t border-dashed border-rule pt-4 grid gap-2">
            <p className="font-mono uppercase text-mute" style={{ fontSize: 9.5, letterSpacing: '0.12em' }}>
              Dev sign-in — local only, disabled in production
            </p>
            <p className="font-sans text-mute" style={{ fontSize: 12, lineHeight: 1.5 }}>
              Any @growthmak.com address signs in as team; anything else signs in as client. First
              use of an email creates it.
            </p>
            <form action={signInWithDev} className="flex gap-2">
              <input
                id="dev-email"
                name="email"
                type="email"
                defaultValue="delivery@growthmak.com"
                className="flex-1 rounded-input border border-rule bg-paper text-ink font-mono px-3 py-2 focus:outline-none focus:border-signal focus:bg-card"
                style={{ fontSize: 12, minHeight: 40 }}
              />
              <button
                type="submit"
                className="rounded-btn border border-rule px-4 py-2 font-mono hover:border-signal"
                style={{ fontSize: 12, minHeight: 40 }}
              >
                Sign in
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </main>
  );
}
