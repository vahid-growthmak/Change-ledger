import { db, projectMembers, projects } from '@growthmak/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MAX_ATTACHMENT_BYTES, isAllowedAttachmentType, putAttachment } from '@/lib/storage';

/**
 * Uploads one attachment and returns its metadata. Open to any member of the
 * project, team or client — a client pasting a screenshot instead of sending
 * it over WhatsApp is the entire point of C8.
 *
 * Size and type are enforced here, server-side. The browser also checks, but
 * only so the person gets told immediately; this is the check that counts.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { slug } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  // 404 rather than 403 for a project the caller can't see — a 403 would
  // confirm it exists (Failure states).
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  if (session.user.role !== 'team') {
    const [membership] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, session.user.id)))
      .limit(1);
    if (!membership) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const candidate = form.get('file');
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: 'No file was attached.' }, { status: 400 });

  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      {
        error: `That file is ${Math.round(file.size / 1024 / 1024)}MB. The limit is ${Math.round(
          MAX_ATTACHMENT_BYTES / 1024 / 1024,
        )}MB — a change request is not a file transfer.`,
      },
      { status: 413 },
    );
  }
  if (!isAllowedAttachmentType(file.type)) {
    return NextResponse.json(
      {
        error: `${file.type || 'That file type'} is not accepted. Attach an image (PNG, JPEG, GIF, WebP) or a PDF.`,
      },
      { status: 415 },
    );
  }

  try {
    const meta = await putAttachment(project.id, {
      name: file.name || 'attachment',
      type: file.type,
      size: file.size,
      bytes: Buffer.from(await file.arrayBuffer()),
    });
    return NextResponse.json(meta);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[attachments] upload failed:', err);
    return NextResponse.json(
      { error: 'Could not store that file. Nothing was attached; try again.' },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';
