import { computeTotals, currentPeriod } from '@growthmak/core';
import { db, requests as requestsTable } from '@growthmak/db';
import { eq } from 'drizzle-orm';
import { requireProjectAccess } from '@/lib/authz';
import { toChangeRequest, toProjectConfig } from '@/lib/serialize';
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
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-sans text-ink" style={{ fontSize: 'clamp(21px, 3vw, 26px)', fontWeight: 600, letterSpacing: '-0.025em' }}>
              {project.projectName}
            </h1>
            <span className="font-sans text-mute" style={{ fontSize: '14.5px' }}>
              {project.clientName}
            </span>
            <span className="font-mono uppercase text-mute" style={{ fontSize: '9.5px', letterSpacing: '0.13em' }}>
              {project.mode === 'foundation' ? 'Foundation Build' : 'Growth Marketing'}
              {periodLabel ? ` · ${periodLabel}` : ''}
            </span>
          </div>
          {session.role === 'team' ? (
            <div className="flex gap-2">
              <a
                href={`/${project.slug}/export`}
                className="inline-flex items-center rounded-btn font-sans font-semibold bg-transparent text-ink border border-rule hover:border-signal hover:text-signal-ink px-4 py-2"
                style={{ fontSize: 12, minHeight: 44 }}
              >
                Export CSV
              </a>
              <a
                href={`/${project.slug}/settings`}
                className="inline-flex items-center rounded-btn font-sans font-semibold bg-transparent text-ink border border-rule hover:border-signal hover:text-signal-ink px-4 py-2"
                style={{ fontSize: 12, minHeight: 44 }}
              >
                Settings
              </a>
            </div>
          ) : null}
        </div>
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
