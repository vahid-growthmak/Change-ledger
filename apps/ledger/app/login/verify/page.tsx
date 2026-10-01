import { ButtonLink, Mark } from '@growthmak/ui';

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
      <div className="flex items-center gap-3 mb-8">
        <Mark />
        <span>
          <span className="block text-ink text-head font-bold tracking-snug">Change Ledger</span>
          <span className="block text-pencil text-meta font-medium">Growthmak</span>
        </span>
      </div>

      <div className="bg-sheet rounded-card shadow-card px-6 py-6 max-w-md grid gap-5">
        <div>
          <h1 className="text-ink text-title font-extrabold tracking-tight">
            {ready ? 'Finish signing in' : 'That link is incomplete'}
          </h1>
          <p className="text-pencil text-body mt-2">
            {ready
              ? `One tap to sign in as ${email}.`
              : 'It is missing part of its address, which usually means an email client shortened it. Ask for a new link and open it from the email directly.'}
          </p>
        </div>

        {ready ? (
          <ButtonLink href={callback} rel="nofollow noreferrer" className="w-full">
            Sign in
          </ButtonLink>
        ) : (
          <ButtonLink href="/login" variant="ghost" className="w-full">
            Request a new link
          </ButtonLink>
        )}

        <p className="text-pencil text-meta">
          Opening this page does not use the link up — only the button does, so it still works if
          your email provider previewed it first.
        </p>
      </div>
    </main>
  );
}

/** Never cached or prerendered: it carries single-use parameters. */
export const dynamic = 'force-dynamic';
