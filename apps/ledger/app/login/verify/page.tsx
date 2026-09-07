/**
 * The page a magic-link email actually points at.
 *
 * It redeems nothing. Auth.js consumes a single-use token on a plain GET of
 * the callback URL, which means a browser prefetch, a mail or security
 * scanner, or a reload of the callback after it already worked can spend
 * the token before the person gets to use it — leaving them looking at
 * "that link has expired or was already used" while the token row has
 * quietly been redeemed by something else.
 *
 * So the email links here, and only the button below issues the consuming
 * request. Anything that opens this page speculatively costs nothing.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const token = first(params.token);
  const email = first(params.email);
  const callbackUrl = first(params.callbackUrl) ?? '/';

  const ready = Boolean(token && email);

  // Rebuilt rather than passed through, so only these three parameters can
  // reach the callback from a link someone else may have crafted.
  const target = new URLSearchParams();
  if (token) target.set('token', token);
  if (email) target.set('email', email);
  target.set('callbackUrl', callbackUrl);
  const callback = `/api/auth/callback/nodemailer?${target.toString()}`;

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

      <div className="bg-card border border-rule shadow-card rounded-panel px-6 py-6 max-w-md grid gap-5">
        <div>
          <h1 className="font-sans text-ink" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>
            {ready ? 'Finish signing in' : 'That link is incomplete'}
          </h1>
          <p className="font-sans text-mute mt-2" style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
            {ready
              ? `One tap to sign in as ${email}.`
              : 'It is missing part of its address, which usually means an email client shortened it. Ask for a new link and open it from the email directly.'}
          </p>
        </div>

        {ready ? (
          <a
            href={callback}
            rel="nofollow noreferrer"
            className="inline-flex items-center justify-center rounded-btn font-sans font-semibold bg-signal text-white shadow-blue hover:opacity-90 px-6 py-3"
            style={{ fontSize: '13.5px', minHeight: 44 }}
          >
            Sign in
          </a>
        ) : (
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-btn font-sans font-semibold bg-transparent text-ink border border-rule hover:border-signal px-6 py-3"
            style={{ fontSize: '13.5px', minHeight: 44 }}
          >
            Request a new link
          </a>
        )}

        <p className="font-sans text-mute" style={{ fontSize: 12, lineHeight: 1.5 }}>
          Opening this page does not use the link up — only the button does, so it still works if
          your email provider previewed it first.
        </p>
      </div>
    </main>
  );
}

/** Never cached or prerendered: it carries single-use parameters. */
export const dynamic = 'force-dynamic';
