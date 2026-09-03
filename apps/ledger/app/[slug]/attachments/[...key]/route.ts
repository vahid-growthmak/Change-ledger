import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { requireProjectAccess } from '@/lib/authz';
import { attachmentUrl, keyBelongsToProject } from '@/lib/storage';

/**
 * Serves one attachment to someone allowed to see it.
 *
 * The bucket is private, so this checks project access, then redirects to a
 * short-lived presigned URL rather than proxying the bytes — the browser
 * fetches from Neon directly, and the object is never anonymously readable.
 *
 * requireProjectAccess 404s a client who isn't a member, and the key must
 * also carry the project's own prefix, so a key from one project cannot be
 * read through another project's route.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; key: string[] }> },
) {
  const { slug, key } = await params;
  const { project } = await requireProjectAccess(slug);

  const objectKey = key.map(decodeURIComponent).join('/');
  if (!keyBelongsToProject(objectKey, project.id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let url: string;
  try {
    url = await attachmentUrl(objectKey);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[attachments] could not presign:', err);
    return NextResponse.json({ error: 'Could not open that attachment.' }, { status: 500 });
  }

  redirect(url);
}

export const runtime = 'nodejs';
