import 'server-only';
import { auth } from '@/auth';
import { db, projectMembers, projects } from '@growthmak/db';
import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';

export interface AuthedSession {
  userId: string;
  role: 'team' | 'client';
  email: string;
}

/** Every protected page/action starts here — role is resolved server-side, never trusted from the client (A4). */
export async function requireSession(): Promise<AuthedSession> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return { userId: session.user.id, role: session.user.role, email: session.user.email ?? '' };
}

/**
 * For Server Actions: mutation is rejected unless the session role is
 * `team` (Layer 2 header). The UI never exposes these controls to a
 * client session, so reaching this throw means the boundary was bypassed
 * — a generic rejection is enough; it doesn't need to render anything.
 */
export async function requireTeam(): Promise<AuthedSession> {
  const session = await requireSession();
  if (session.role !== 'team') {
    throw new Error('Forbidden: this action requires the team role.');
  }
  return session;
}

/**
 * Resolves a project by slug and checks the session may access it.
 * A client who isn't a member gets 404, not 403 — a 403 would confirm
 * the project exists (Failure states table).
 */
export async function requireProjectAccess(slug: string) {
  const session = await requireSession();
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  if (!project) notFound();

  if (session.role === 'team') return { project, session };

  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, session.userId)))
    .limit(1);
  if (!membership) notFound();

  return { project, session };
}

/** Team-only pages 404 for a client rather than showing an access-denied page — same reasoning as above. */
export async function requireTeamPage(): Promise<AuthedSession> {
  const session = await requireSession();
  if (session.role !== 'team') notFound();
  return session;
}
