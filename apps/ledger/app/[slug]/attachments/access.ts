import 'server-only';
import { db, projectMembers, projects } from '@growthmak/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Project access for the attachment fetch endpoints.
 *
 * `requireProjectAccess` in lib/authz is for pages — it calls notFound() and
 * redirect(), which render HTML. These routes are called by fetch() and have
 * to answer in JSON the picker can show, so the same rules are applied here
 * and returned rather than thrown.
 *
 * A client who isn't a member gets 404, not 403: a 403 would confirm the
 * project exists (Failure states).
 */
export async function projectForUpload(
  slug: string,
): Promise<{ projectId: string } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }) };
  }

  const [project] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  if (!project) {
    return { error: NextResponse.json({ error: 'Not found.' }, { status: 404 }) };
  }

  if (session.user.role !== 'team') {
    const [membership] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, session.user.id)))
      .limit(1);
    if (!membership) {
      return { error: NextResponse.json({ error: 'Not found.' }, { status: 404 }) };
    }
  }

  return { projectId: project.id };
}
