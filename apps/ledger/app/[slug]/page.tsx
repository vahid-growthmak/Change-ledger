import { computeTotals, currentPeriod } from '@growthmak/core';
import { db, requests as requestsTable } from '@growthmak/db';
import { eq } from 'drizzle-orm';
import { requireProjectAccess } from '@/lib/authz';
import { toChangeRequest, toProjectConfig } from '@/lib/serialize';
import { ButtonLink } from '@growthmak/ui';
import { AppHeader } from '@/components/AppHeader';
import { LedgerView } from '@/components/LedgerView';

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { project, session } = await requireProjectAccess(slug);

  const rows = await db.select().from(requestsTable).where(eq(requestsTable.projectId, project.id));
  const requests = rows
    .map(toChangeRequest)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first

  const fullProject = toProjectConfig(project);
  const period = fullProject.mode === 'retainer' ? currentPeriod() : null;
  // Cost is computed here, server-side, from the full project row (rateMinor
  // included) — only the resulting totals cross into the client bundle,
  // never the rate itself (M5, Constraints).
  const totals = computeTotals(requests, fullProject, period);
  // Neither the rate nor the contracted hours leave the server on their own:
  // contractedHours travels inside the team-only readout below, so a client
  // payload has no commercial figure in it at all.
  const {
    rateMinor: _rateMinor,
    contractedHours: _contractedHours,
    currency: _currency,
    ...publicProject
  } = fullProject;

  /**
   * The client surface deliberately carries no effort or money figures: no
   * hours, no cost, no contracted line. Enforced here rather than hidden in
   * the component, because anything handed to a Client Component is readable
   * in the page source — the same reasoning that keeps rateMinor server-side
   * (A4). Per-request hours are stripped too: a client who could read them
   * off each card could just add them up.
   */
  const isTeam = session.role === 'team';
  const readout = isTeam
    ? ({ kind: 'team', totals, contractedHours: fullProject.contractedHours, currency: fullProject.currency } as const)
    : ({ kind: 'client', requestCount: totals.requestCount, beyondCount: totals.beyondCount } as const);
  const visibleRequests = isTeam ? requests : requests.map((r) => ({ ...r, hours: null }));

  const periodLabel = period
    ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(period))
    : null;

  return (
    <main className="max-w-page mx-auto px-5 py-8 grid gap-6">
      <div>
        <AppHeader session={session} crumb={project.projectName} />

        {/*
          The title block. The console names what you are looking at, states
          its particulars in one card of cells beneath, and puts the two
          actions that act on the whole project alongside the title — so the
          page opens with what it is before it opens with what it counts.
        */}
        <div className="flex flex-wrap items-end justify-between gap-4 mt-6 mb-5">
          <div className="min-w-0">
            <h1 className="text-ink text-title font-extrabold tracking-tight min-w-0">
              {project.projectName}
            </h1>
            <p className="text-pencil text-body mt-1">{project.clientName}</p>
          </div>
          {session.role === 'team' ? (
            <div className="flex flex-wrap gap-3">
              <ButtonLink variant="ghost" href={`/${project.slug}/export`}>
                Export CSV
              </ButtonLink>
              <ButtonLink variant="ghost" href={`/${project.slug}/settings`}>
                Settings
              </ButtonLink>
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-3 bg-sheet rounded-card shadow-card overflow-hidden
          divide-x divide-y sm:divide-y-0 divide-rule">
          <div className="px-6 py-5 min-w-0">
            <dt className="text-pencil text-meta font-semibold">Client</dt>
            <dd className="text-ink text-body font-medium mt-1 truncate">{project.clientName}</dd>
          </div>
          <div className="px-6 py-5 min-w-0">
            <dt className="text-pencil text-meta font-semibold">Engagement</dt>
            <dd className="text-ink text-body font-medium mt-1 truncate">
              {project.mode === 'foundation' ? 'Foundation Build' : 'Growth Marketing'}
            </dd>
          </div>
          <div className="px-6 py-5 min-w-0">
            <dt className="text-pencil text-meta font-semibold">
              {periodLabel ? 'Period' : 'Reference'}
            </dt>
            <dd className="text-ink text-body font-medium mt-1 truncate tabular">
              {periodLabel ?? project.slug}
            </dd>
          </div>
        </dl>
      </div>

      <LedgerView
        projectId={project.id}
        slug={project.slug}
        project={publicProject}
        requests={visibleRequests}
        readout={readout}
        periodLabel={periodLabel}
        role={session.role}
      />
    </main>
  );
}
