import { requireSession } from '@/lib/authz';
import { db, projectMembers, projects } from '@growthmak/db';
import { and, eq, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@growthmak/ui';
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
        <div className="bg-sheet rounded-card shadow-card py-10 px-6 text-center mt-6">
          <p className="mx-auto text-pencil text-body" style={{ maxWidth: 400 }}>
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

      <section aria-label="Projects" className="bg-sheet rounded-card shadow-card overflow-hidden">
        {active.length === 0 ? (
          <p className="text-pencil text-body px-6 py-6">No projects yet — create the first one below.</p>
        ) : (
          <table className="w-full">
            <tbody className="divide-y divide-rule-soft">
              {active.map((p) => (
                <tr key={p.id} className="transition-colors duration-200 ease-soft hover:bg-stock/60">
                  <td className="px-6 py-5">
                    <a
                      href={`/${p.slug}`}
                      className="text-ink text-entry font-semibold tracking-snug hover:text-signal
                        transition-colors duration-200 ease-soft"
                    >
                      {p.projectName}
                    </a>
                    <div className="text-pencil text-meta font-medium mt-0.5">{p.clientName}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Badge>{p.mode === 'foundation' ? 'Foundation Build' : 'Growth Marketing'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {archived.length > 0 ? (
        <section aria-label="Archived projects">
          <p className="text-pencil text-meta font-semibold mb-3">Archived</p>
          <ul className="grid gap-1">
            {archived.map((p) => (
              <li key={p.id} className="text-pencil text-body">
                {p.projectName} — {p.clientName}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="bg-sheet rounded-card shadow-card px-6 py-6">
        <h2 className="text-ink text-head font-bold tracking-snug mb-5">New project</h2>
        <NewProjectForm />
      </section>
    </main>
  );
}
