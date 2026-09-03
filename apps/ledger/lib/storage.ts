import 'server-only';
import { randomUUID } from 'node:crypto';
import { Files } from 'files-sdk';
import { neon } from 'files-sdk/neon';

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
 */

const BUCKET = 'attachments';

/** "A change request is not a file transfer" — PRD Constraints. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

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

export function isAllowedAttachmentType(contentType: string): boolean {
  return (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(contentType);
}

/**
 * Keys are namespaced by project and randomised, never derived from the
 * uploaded filename: a client-supplied name must not be able to steer where
 * the object lands or collide with another project's file.
 */
export async function putAttachment(
  projectId: string,
  file: { name: string; type: string; size: number; bytes: Buffer },
): Promise<AttachmentMeta> {
  const extension = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1] || 'bin';
  const key = `${projectId}/${randomUUID()}.${extension}`;

  await client().upload(key, file.bytes, { contentType: file.type });

  return {
    key,
    // Kept only for display. Truncated, and never used to build the key.
    name: file.name.slice(0, 120),
    contentType: file.type,
    size: file.size,
  };
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
