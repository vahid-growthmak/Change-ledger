import Link from 'next/link';
import { signOutAction } from '@/lib/auth-actions';
import type { AuthedSession } from '@/lib/authz';

/**
 * The masthead, set as a document's printed header: the form's name on the
 * left, who is holding this copy of it on the right, and a single ink rule
 * closing the strip.
 *
 * The masthead is also the way back out. It used to read as a breadcrumb
 * while nothing in it was clickable, which left a team member on a project
 * page with no route to the project list short of editing the URL. Home
 * resolves per role: the list for team, their own project for a client.
 */
export function AppHeader({ session, crumb }: { session: AuthedSession; crumb?: string }) {
  return (
    <div className="border-b-2 border-rule-ink pb-2 mb-6 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
      <div className="min-w-0">
        <Link
          href="/"
          className="group inline-block font-narrow uppercase tracking-stamp"
          style={{ fontSize: 12 }}
          aria-label="Back to all projects"
        >
          <span className="text-ink font-bold group-hover:text-signal transition-colors duration-150">
            Growthmak
          </span>
          <span className="text-pencil"> Change Ledger</span>
        </Link>
        {crumb ? (
          // Current page: a label, not a link.
          <span className="font-narrow uppercase tracking-stamp text-pencil" style={{ fontSize: 12 }}>
            {' '}
            · {crumb}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-4">
        {/* Team only: a client has exactly one project, so "all projects" would
            just bounce them back to where they already are. */}
        {session.role === 'team' && crumb ? (
          <Link
            href="/"
            className="font-sans text-signal underline hover:text-ink transition-colors duration-150"
            style={{ fontSize: 12 }}
          >
            All projects
          </Link>
        ) : null}
        <form action={signOutAction} className="flex items-center gap-3">
          <span className="font-sans text-pencil" style={{ fontSize: 12 }}>
            {session.email}
          </span>
          <span className="font-narrow uppercase tracking-label text-pencil border border-rule px-1.5 py-0.5 text-label">
            {session.role}
          </span>
          <button
            type="submit"
            className="font-sans text-signal underline hover:text-ink transition-colors duration-150"
            style={{ fontSize: 12 }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
