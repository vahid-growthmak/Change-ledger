import 'server-only';
import { randomUUID } from 'node:crypto';
import { Files, type SignedUpload } from 'files-sdk';
import { neon } from 'files-sdk/neon';
import { MAX_ATTACHMENT_BYTES } from '@growthmak/core';

/**
 * Attachments (C8) live in a private Neon Object Storage bucket that branches
 * with the database, so a branch's rows and the files they reference stay in
 * step. Private is the point: an attachment is usually a screenshot of the
 * client's own site or dashboard, so reads go through an authenticated route
 * that presigns a short-lived URL — never an anonymous public object.
 *
 * The PRD specified Vercel Blob, written before Neon was in the stack. This
 * keeps it to one backend, one bill, and one credential system; swapping is a
 * one-line adapter change (`files-sdk/vercel-blob`) if that changes again.
 *
 * Bytes go browser → bucket, never through this app. A Vercel serverless
 * function caps its request body at 4.5MB, so proxying the upload put a
 * ceiling on attachments that no constant here could lift. The signed POST
 * form below carries the size and type limits into the bucket's own policy,
 * which is what enforces them — see `signAttachmentUpload`.
 */

const BUCKET = 'attachments';

/** How long a signed upload form stays usable. Long enough for a slow connection to finish 25MB. */
const UPLOAD_WINDOW_SECONDS = 15 * 60;

export { MAX_ATTACHMENT_BYTES, ALLOWED_ATTACHMENT_TYPES, isAllowedAttachmentType } from '@growthmak/core';

export interface AttachmentMeta {
  key: string;
  name: string;
  contentType: string;
  size: number;
}

function client() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_ENDPOINT_URL_S3) {
    throw new Error(
      'Attachments are not set up on the server. Run `neon deploy` to provision the bucket, then copy the AWS_* variables into apps/ledger/.env.local.',
    );
  }
  return new Files({ adapter: neon({ bucket: BUCKET }) });
}

/**
 * Mints a one-file, one-use upload form for the browser to post straight at
 * the bucket.
 *
 * The limits are not advisory. `maxSize` becomes a `content-length-range`
 * condition in the POST policy and `contentType` is bound into the signature,
 * so S3 rejects an oversized or mistyped body itself — the browser cannot talk
 * its way past either, and neither can anyone who gets hold of the form. The
 * default `minSize` of 1 rejects an empty upload, which the old proxy route
 * had to check by hand.
 *
 * Keys are namespaced by project and randomised, never derived from the
 * uploaded filename: a client-supplied name must not be able to steer where
 * the object lands or collide with another project's file. The signature
 * covers this exact key, so the form cannot be redirected at another object.
 */
export async function signAttachmentUpload(
  projectId: string,
  contentType: string,
): Promise<{ key: string; upload: SignedUpload }> {
  const extension = contentType === 'application/pdf' ? 'pdf' : contentType.split('/')[1] || 'bin';
  const key = `${projectId}/${randomUUID()}.${extension}`;

  const upload = await client().signedUploadUrl(key, {
    expiresIn: UPLOAD_WINDOW_SECONDS,
    contentType,
    maxSize: MAX_ATTACHMENT_BYTES,
  });

  return { key, upload };
}

/**
 * Reads back what actually landed in the bucket.
 *
 * The size and type recorded against a request come from here, not from what
 * the browser claimed — the browser is the one party in this flow we never
 * had to trust, and now don't have to. Returns null when there is no object,
 * which is how the confirm route tells a failed upload from a finished one.
 */
export async function statAttachment(key: string): Promise<{ contentType: string; size: number } | null> {
  try {
    const file = await client().head(key);
    return { contentType: file.type, size: file.size };
  } catch {
    return null;
  }
}

/** Short-lived presigned GET, handed out only after the caller's project access is checked. */
export async function attachmentUrl(key: string): Promise<string> {
  return client().url(key, { expiresIn: 300 });
}

/**
 * Guards against a key from one project being read through another's route.
 * The route already checks project membership; this makes the key itself
 * prove which project it belongs to.
 */
export function keyBelongsToProject(key: string, projectId: string): boolean {
  return key.startsWith(`${projectId}/`) && !key.includes('..');
}

/** Parses whatever is in the requests.attachments jsonb column into something typed. */
export function parseAttachments(raw: unknown): AttachmentMeta[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is AttachmentMeta =>
      !!a &&
      typeof a === 'object' &&
      typeof (a as AttachmentMeta).key === 'string' &&
      typeof (a as AttachmentMeta).name === 'string' &&
      typeof (a as AttachmentMeta).contentType === 'string' &&
      typeof (a as AttachmentMeta).size === 'number',
  );
}
