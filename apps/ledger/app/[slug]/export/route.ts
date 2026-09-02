import { toCsv } from '@growthmak/core';
import { db, requests as requestsTable } from '@growthmak/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { requireTeamPage } from '@/lib/authz';
import { toChangeRequest, toProjectConfig } from '@/lib/serialize';
import { projects } from '@growthmak/db';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  await requireTeamPage();
  const { slug } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  if (!project) notFound();

  const rows = await db.select().from(requestsTable).where(eq(requestsTable.projectId, project.id));
  const csv = toCsv(rows.map(toChangeRequest), toProjectConfig(project));

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="change-ledger-${project.slug}.csv"`,
    },
  });
}
