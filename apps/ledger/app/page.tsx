import { requireSession } from '@/lib/authz';
import { db, projectMembers, projects } from '@growthmak/db';
import { and, eq, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { NewProjectForm } from '@/components/NewProjectForm';

export default async function HomePage() {
  const session = await requireSession();

  if (session.role === 'client') {
    const [membership] = await db
      .select({ slug: projects.slug })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(and(eq(projectMembers.userId, session.userId), isNull(projects.archivedAt)))
      .limit(1);

    if (membership) redirect(`/${membership.slug}`);

    return (
      <main className="max-w-page mx-auto px-5 py-8">
        <AppHeader session={session} />
        <div className="border border-dashed border-rule rounded-panel py-8 px-6 text-center">
          <p className="mx-auto text-mute font-sans" style={{ maxWidth: 400, fontSize: '13.5px', lineHeight: 1.55 }}>
            No project yet. Ask your Growthmak contact to add you — you'll land here automatically
            once they do.
          </p>
        </div>
      </main>
    );
  }

  const allProjects = await db.select().from(projects).orderBy(projects.createdAt);
  const active = allProjects.filter((p) => !p.archivedAt);
  const archived = allProjects.filter((p) => p.archivedAt);

  return (
    <main className="max-w-page mx-auto px-5 py-8 grid gap-6">
      <AppHeader session={session} />

      <section aria-label="Projects" className="bg-card border border-rule shadow-card rounded-panel overflow-hidden">
        {active.length === 0 ? (
          <p className="font-sans text-mute px-6 py-6" style={{ fontSize: '13.5px' }}>
            No projects yet — create the first one below.
          </p>
        ) : (
          <table className="w-full" style={{ fontSize: '13.5px' }}>
            <tbody>
              {active.map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-0">
                  <td className="px-6 py-4">
                    <a href={`/${p.slug}`} className="font-sans text-ink font-medium hover:text-signal-ink">
                      {p.projectName}
                    </a>
                    <div className="font-mono text-mute" style={{ fontSize: 11 }}>
                      {p.clientName}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono uppercase text-mute text-right" style={{ fontSize: 10.5, letterSpacing: '0.08em' }}>
                    {p.mode === 'foundation' ? 'Foundation Build' : 'Growth Marketing'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {archived.length > 0 ? (
        <section aria-label="Archived projects">
          <p className="font-mono uppercase text-mute mb-2" style={{ fontSize: 9.5, letterSpacing: '0.12em' }}>
            Archived
          </p>
          <ul className="grid gap-1">
            {archived.map((p) => (
              <li key={p.id} className="font-sans text-mute" style={{ fontSize: 13 }}>
                {p.projectName} — {p.clientName}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="bg-card border border-rule shadow-card rounded-panel px-6 py-6">
        <h2 className="font-sans text-ink mb-4" style={{ fontSize: 15, fontWeight: 600 }}>
          New project
        </h2>
        <NewProjectForm />
      </section>
    </main>
  );
}
