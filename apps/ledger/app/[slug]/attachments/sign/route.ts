import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
  isAllowedAttachmentType,
  readableSize,
} from '@growthmak/core';
import { signAttachmentUpload } from '@/lib/storage';
import { projectForUpload } from '../access';

/**
 * Hands back a signed form the browser posts the file straight to the bucket
 * with. Open to any member of the project, team or client — a client pasting
 * a screenshot instead of sending it over WhatsApp is the entire point of C8.
 *
 * The checks here are for a fast, readable refusal before the bytes move.
 * They are not the enforcement: the signed form carries the size and type
 * into the bucket's own policy, so a caller who lies about `size` here just
 * gets rejected by S3 a moment later instead.
 */
const signRequestSchema = z.object({
  contentType: z.string().max(100),
  size: z.number().int().nonnegative(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await projectForUpload(slug);
  if ('error' in access) return access.error;

  const parsed = signRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 });
  }
  const { contentType, size } = parsed.data;

  if (size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      {
        error: `That file is ${readableSize(size)}. The limit is ${MAX_ATTACHMENT_MB}MB — a change request is not a file transfer.`,
      },
      { status: 413 },
    );
  }
  if (!isAllowedAttachmentType(contentType)) {
    return NextResponse.json(
      {
        error: `${contentType || 'That file type'} is not accepted. Attach an image (PNG, JPEG, GIF, WebP) or a PDF.`,
      },
      { status: 415 },
    );
  }

  try {
    const { key, upload } = await signAttachmentUpload(access.projectId, contentType);
    return NextResponse.json({ key, upload });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[attachments] could not sign upload:', err);
    return NextResponse.json(
      { error: 'Could not start that upload. Nothing was attached; try again.' },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';
