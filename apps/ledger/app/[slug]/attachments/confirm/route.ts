import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAllowedAttachmentType } from '@growthmak/core';
import { keyBelongsToProject, statAttachment } from '@/lib/storage';
import { projectForUpload } from '../access';

/**
 * Closes the loop after a direct upload: confirms the object really landed
 * and returns the metadata that gets stored against the request.
 *
 * Size and content type are read back from the bucket rather than taken from
 * the browser. The bucket already refused anything oversized or mistyped, so
 * this is about the record being accurate — a request should not display
 * "2 MB" next to a file that is nothing of the sort.
 */
const confirmRequestSchema = z.object({
  key: z.string().min(1).max(300),
  name: z.string().max(200),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await projectForUpload(slug);
  if ('error' in access) return access.error;

  const parsed = confirmRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 });
  }
  const { key, name } = parsed.data;

  // The key was minted for this project a moment ago; a key naming any other
  // project is not something a well-behaved client can produce.
  if (!keyBelongsToProject(key, access.projectId)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const stored = await statAttachment(key);
  if (!stored) {
    return NextResponse.json(
      { error: 'That upload did not finish. Nothing was attached; try again.' },
      { status: 404 },
    );
  }

  // The signature bound the type, so a mismatch here means something stranger
  // than a slow connection happened. Refuse rather than record it.
  if (!isAllowedAttachmentType(stored.contentType)) {
    return NextResponse.json({ error: 'That file type is not accepted.' }, { status: 415 });
  }

  return NextResponse.json({
    key,
    // Kept only for display. Truncated, and never used to build the key.
    name: name.slice(0, 120) || 'attachment',
    contentType: stored.contentType,
    size: stored.size,
  });
}

export const runtime = 'nodejs';
