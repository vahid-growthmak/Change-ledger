/**
 * Attachment limits, shared by the browser and the server so the two can
 * never drift apart. They did once: the picker said 10MB, the route said
 * 10MB, and Vercel's 4.5MB request-body cap silently said something else
 * again. Uploads now go straight to the bucket, so this number is the
 * only ceiling in play — and it lives in exactly one place.
 */

/**
 * 25MB. Above the old 10MB because a full-page screencapture or a design
 * PDF routinely runs past it, and below anything that would make this a
 * place to park video — "a change request is not a file transfer"
 * (PRD Constraints) still holds, just with a more honest number.
 */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const MAX_ATTACHMENT_MB = Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024);

export const ALLOWED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

export function isAllowedAttachmentType(contentType: string): boolean {
  return (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(contentType);
}

/** Renders a byte count the way the picker and the error messages both want it. */
export function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * The signed form the browser posts a file to storage with.
 *
 * Structurally the same shape files-sdk returns, declared here so the client
 * component that consumes it doesn't have to import a server-side SDK.
 * `POST` is what a signed policy with a size limit produces; `PUT` is the
 * unbounded fallback, handled for completeness.
 */
export type SignedUpload =
  | { method: 'POST'; url: string; fields: Record<string, string> }
  | { method: 'PUT'; url: string; headers?: Record<string, string> };
