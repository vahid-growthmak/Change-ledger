import 'server-only';

/**
 * The absolute origin to put in outgoing email links.
 *
 * This exists because of a real bug: the invite email built its link as
 * `${process.env.NEXT_PUBLIC_APP_URL ?? fallback}/login`, and `??` only
 * falls back on null or undefined — not on an empty string. With the
 * variable present but blank in the deployment, the link became `/login`
 * with no host, which the recipient's mail client rendered as
 * `http:///login` and refused to open.
 *
 * So: treat blank as unset, require something that actually parses with a
 * host, and never silently fall back to localhost in production — a
 * localhost link in a client's inbox looks legitimate and goes nowhere,
 * which is worse than one that visibly fails.
 */
export function appOrigin(): string | null {
  const candidates = [
    // Already the canonical origin for auth, so it has to be right anyway.
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    // Vercel injects these; they carry no scheme.
    prefix(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    prefix(process.env.VERCEL_URL),
    process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3457',
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue; // the blank-string case that caused the bug
    try {
      const url = new URL(value);
      if (url.host) return url.origin;
    } catch {
      // Not a URL — try the next candidate rather than emailing something broken.
    }
  }
  return null;
}

function prefix(host: string | undefined): string | undefined {
  const value = host?.trim();
  return value ? `https://${value}` : undefined;
}
