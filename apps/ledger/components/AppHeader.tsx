import Link from 'next/link';
import { signOutAction } from '@/lib/auth-actions';
import type { AuthedSession } from '@/lib/authz';

export function AppHeader({ session, crumb }: { session: AuthedSession; crumb?: string }) {
  return (
    <div className="border-b border-rule pb-3 mb-6 flex flex-wrap items-baseline justify-between gap-3">
      {/*
        The masthead is the way back out. It read as a breadcrumb but nothing
        in it was clickable, which left a team member on a project page with
        no route to the project list short of editing the URL. Home resolves
        per role: the list for team, their own project for a client.
      */}
      <div className="min-w-0">
        <Link href="/" className="group inline-block" aria-label="Back to all projects">
          <span
            className="font-mono uppercase text-signal-ink group-hover:underline"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em' }}
          >
            Growthmak
          </span>
          <span
            className="font-mono uppercase text-mute group-hover:text-ink"
            style={{ fontSize: 11, letterSpacing: '0.16em' }}
          >
            {' '}
            / Change Ledger
          </span>
        </Link>
        {crumb ? (
          // Current page: a label, not a link.
          <span className="font-mono uppercase text-mute" style={{ fontSize: 11, letterSpacing: '0.16em' }}>
            {' '}
            / {crumb}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        {/* Team only: a client has exactly one project, so "all projects" would
            just bounce them back to where they already are. */}
        {session.role === 'team' && crumb ? (
          <Link href="/" className="font-mono text-signal-ink underline" style={{ fontSize: 11 }}>
            All projects
          </Link>
        ) : null}
        <form action={signOutAction} className="flex items-center gap-3">
          <span className="font-mono text-mute" style={{ fontSize: 11 }}>
            {session.email} · {session.role}
          </span>
          <button type="submit" className="font-mono text-signal-ink underline" style={{ fontSize: 11 }}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
