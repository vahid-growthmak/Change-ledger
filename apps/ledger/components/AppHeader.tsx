import Link from 'next/link';
import { Badge, Button, Mark } from '@growthmak/ui';
import { signOutAction } from '@/lib/auth-actions';
import type { AuthedSession } from '@/lib/authz';

/**
 * The masthead, set as the console's top panel: a white bar lifted off the
 * ground like every other surface, with the mark and where you are on the
 * left, and who is holding this copy on the right.
 *
 * The masthead is also the way back out. It used to read as a breadcrumb
 * while nothing in it was clickable, which left a team member on a project
 * page with no route to the project list short of editing the URL. Home
 * resolves per role: the list for team, their own project for a client.
 */
export function AppHeader({ session, crumb }: { session: AuthedSession; crumb?: string }) {
  return (
    <header className="bg-sheet rounded-card shadow-card px-5 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-4">
      <Link
        href="/"
        className="group flex items-center gap-3 min-w-0 rounded-control"
        aria-label="Back to all projects"
      >
        <Mark />
        <span className="min-w-0">
          <span className="block text-ink text-head font-bold tracking-snug truncate">
            Change Ledger
          </span>
          {/* The crumb stays the quiet second line rather than the headline:
              the project page already sets its own name as the h1 directly
              below, and two 17px statements of the same words read as a
              mistake. On Settings, which has no h1, this is the only thing
              naming the page. */}
          <span className="block text-pencil text-meta font-medium truncate">
            {crumb ?? 'Growthmak'}
          </span>
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        {/* Team only: a client has exactly one project, so "all projects" would
            just bounce them back to where they already are. */}
        {session.role === 'team' && crumb ? (
          <Link
            href="/"
            className="rounded-control text-meta font-semibold text-signal hover:text-ink
              transition-colors duration-200 ease-soft"
          >
            All projects
          </Link>
        ) : null}
        <form action={signOutAction} className="flex items-center gap-3">
          <span className="text-pencil text-meta font-medium hidden sm:inline">{session.email}</span>
          <span className="capitalize">
            <Badge>{session.role}</Badge>
          </span>
          <Button type="submit" variant="quiet">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

