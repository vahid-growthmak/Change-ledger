import { db, projects } from '@growthmak/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { requireTeamPage } from '@/lib/authz';
import { toProjectConfig } from '@/lib/serialize';
import { AppHeader } from '@/components/AppHeader';
import { SettingsPanel } from '@/components/SettingsPanel';

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireTeamPage();

  const [project] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  if (!project) notFound();

  return (
    <main className="max-w-page mx-auto px-5 py-8 grid gap-6">
      <AppHeader session={session} crumb={`${project.projectName} / Settings`} />
      <SettingsPanel projectId={project.id} initial={toProjectConfig(project)} />
    </main>
  );
}
