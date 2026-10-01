'use client';

import { useMemo, useRef, useState } from 'react';
import {
  computeTotals,
  currentPeriod,
  dualTimestamp,
  formatHours,
  formatMoneyMinor,
  GROWTH_LAYER_LABELS,
  hoursUnit,
  meterScale,
  PENDING_LABEL,
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  SCOPE_LABELS,
  STATUS_LABELS,
  toCsv,
  type ChangeRequest,
  type RequestType,
} from '@growthmak/core';
import {
  Badge,
  Button,
  Mark,
  Distribution,
  EmptyState,
  FilterChip,
  InkSheet,
  Sheet,
  SheetHead,
  Meter,
  MeterLegend,
  PanelLabel,
  ReadoutCell,
  ReadoutRow,
  RequestCard,
  Select,
  SubmitForm,
  TextInput,
  Toast,
  TriageRow,
  type ScopeTone,
} from '@growthmak/ui';
import { useLedger } from '@/lib/store';
import { SettingsForm } from './SettingsForm';

type View = 'client' | 'team';
type ListFilter = 'all' | 'pending' | 'beyond' | 'open';

const toneFor = (scope: ChangeRequest['scope']): ScopeTone =>
  scope === 'in_scope' ? 'clear' : scope === 'beyond_scope' ? 'over' : scope === 'needs_quote' ? 'signal' : 'pending';

export function Ledger() {
  const ledger = useLedger();
  const [view, setView] = useState<View>('client');
  const [filter, setFilter] = useState<ListFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'' | RequestType>('');
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const { project, requests } = ledger;
  const period = project?.mode === 'retainer' ? currentPeriod() : null;

  const totals = useMemo(
    () => (project ? computeTotals(requests, project, period) : null),
    [project, requests, period],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter === 'pending' && r.scope !== null) return false;
      if (filter === 'beyond' && r.scope !== 'beyond_scope') return false;
      if (filter === 'open' && (r.status === 'done' || r.status === 'wont_do')) return false;
      if (typeFilter && r.type !== typeFilter) return false;
      if (q) {
        const hay = [r.ref, r.title, r.location ?? '', r.detail ?? ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [requests, filter, typeFilter, search]);

  if (!ledger.loaded) return null;

  // First run: the ledger needs its terms before it can count against them.
  if (!project) {
    return (
      <main className="max-w-page mx-auto px-5 py-8">
        <Masthead />
        <div className="mt-8" style={{ maxWidth: 720 }}>
          <h1 className="text-ink text-title font-extrabold tracking-tight">Set up your ledger</h1>
          <p className="text-pencil text-body mt-2 max-w-measure">
            Name the engagement, set the agreed hours and rate, and start logging every change request
            against them. Everything stays in this browser — nothing is sent anywhere.
          </p>
          <div className="bg-sheet rounded-card shadow-card px-6 py-6 mt-6">
            <SettingsForm initial={null} onSave={(p) => { ledger.saveProject(p); showToast('Ledger ready'); }} />
          </div>
        </div>
      </main>
    );
  }

  const scale = meterScale(project.contractedHours, totals!);
  const contractedUnit = hoursUnit(project.contractedHours);
  const lineLabel =
    project.mode === 'foundation'
      ? `Contracted scope · ${formatHours(project.contractedHours)} ${contractedUnit}`
      : `Monthly capacity · ${formatHours(project.contractedHours)} ${contractedUnit}`;
  const breached = totals!.beyondCount > 0;
  const periodLabel = period
    ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(period))
    : null;

  function exportCsv() {
    const csv = toCsv(requests, project!);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-ledger-${project!.projectName.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported');
  }

  return (
    <main className="max-w-page mx-auto px-5 py-8 grid gap-6">
      <header>
        <Masthead />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6">
          <h1 className="text-ink text-title font-extrabold tracking-tight">{project.projectName}</h1>
          <span className="text-pencil text-body">{project.clientName}</span>
          <Badge>
            {project.mode === 'foundation' ? 'Foundation Build' : 'Growth Marketing'}
            {periodLabel ? ` · ${periodLabel}` : ''}
          </Badge>
        </div>
      </header>

      {/* Readout — the answer before the detail (M4, M6) */}
      <ReadoutRow>
        <ReadoutCell icon="requests" label="Requests logged" value={String(totals!.requestCount)} />
        <ReadoutCell icon="beyond" label="Beyond scope" value={String(totals!.beyondCount)} breached={breached} />
        <ReadoutCell
          icon="hours"
          label="Extra hours"
          value={formatHours(totals!.beyondHours)}
          unit={hoursUnit(totals!.beyondHours)}
          breached={breached}
        />
        <ReadoutCell
          icon="cost"
          label="Additional cost"
          value={formatMoneyMinor(totals!.additionalCostMinor, project.currency)}
          breached={breached}
        />
      </ReadoutRow>

      {/* The meter (M1–M3) */}
      <InkSheet className="on-ink">
        <SheetHead onInk>Hours against agreement</SheetHead>
        <section className="px-6 pt-2 pb-6" aria-label="Hours against agreement">
        <Meter
          tone="ink"
          contractedHours={project.contractedHours}
          inScopeHours={totals!.inScopeHours}
          pendingHours={totals!.pendingHours}
          beyondHours={totals!.beyondHours}
          scaleHours={scale}
          lineLabel={lineLabel}
          ariaLabel={`${formatHours(totals!.inScopeHours)} hours in scope, ${formatHours(totals!.pendingHours)} hours pending review, ${formatHours(totals!.beyondHours)} hours beyond scope, against ${formatHours(project.contractedHours)} agreed hours.`}
        />
        <MeterLegend tone="ink" pendingNote="Pending review — not yet counted either way" />
        {project.mode === 'retainer' ? (
          <p className="text-on-ink-soft text-meta mt-4 max-w-measure">
            The meter counts {periodLabel}. It resets each cycle; the full history stays in the list below.
          </p>
        ) : null}
        </section>
      </InkSheet>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="View">
          <FilterChip pressed={view === 'client'} onClick={() => { setView('client'); setSettingsOpen(false); }}>
            Client view
          </FilterChip>
          <FilterChip pressed={view === 'team'} onClick={() => setView('team')}>
            Growthmak view
          </FilterChip>
        </div>
        {view === 'team' ? (
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="ghost" onClick={() => setSettingsOpen((o) => !o)}>
              {settingsOpen ? 'Close settings' : 'Settings'}
            </Button>
          </div>
        ) : null}
      </div>

      {view === 'team' && settingsOpen ? (
        <section className="bg-sheet rounded-card shadow-card px-6 py-6" aria-label="Project settings">
          <h2 className="text-ink text-head font-bold tracking-snug mb-5">Project settings</h2>
          <SettingsForm
            initial={project}
            onSave={(p) => {
              ledger.saveProject(p);
              setSettingsOpen(false);
              showToast('Saved');
            }}
            onClearAll={() => {
              ledger.clearAll();
              setSettingsOpen(false);
            }}
          />
        </section>
      ) : null}

      <SubmitForm
        onSubmit={(input) => {
          ledger.addRequest(input);
          showToast('Logged');
        }}
      />

      {/* Filters (O4) */}
      {requests.length > 0 ? (
        <section aria-label="Filters" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip pressed={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </FilterChip>
            <FilterChip pressed={filter === 'pending'} onClick={() => setFilter('pending')}>
              Pending review
            </FilterChip>
            <FilterChip pressed={filter === 'beyond'} onClick={() => setFilter('beyond')}>
              Beyond scope
            </FilterChip>
            <FilterChip pressed={filter === 'open'} onClick={() => setFilter('open')}>
              Still open
            </FilterChip>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-nowrap sm:ml-auto">
            <Select
              aria-label="Kind of change"
              className="flex-1 min-w-0 sm:flex-none"
              style={{ width: 180, maxWidth: '100%' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as '' | RequestType)}
            >
              <option value="">Every kind</option>
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {REQUEST_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
            <TextInput
              aria-label="Search requests"
              placeholder="Search the log"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 sm:flex-none"
              style={{ width: 240, maxWidth: '100%' }}
            />
          </div>
        </section>
      ) : null}

      {/* The list */}
      <Sheet>
        <SheetHead
          right={
            <span className="text-pencil text-meta font-semibold tabular">
              {filtered.length === requests.length ? `${requests.length}` : `${filtered.length} / ${requests.length}`}
            </span>
          }
        >
          The log
        </SheetHead>
        <section aria-label="Change requests" className="divide-y divide-rule">
        {requests.length === 0 ? (
          <EmptyState>
            No changes logged yet. Every time something new is asked for, add it here. That&apos;s how
            the count stays honest for both sides.
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>
            Nothing matches these filters. {requests.length}{' '}
            {requests.length === 1 ? 'request exists' : 'requests exist'} — clear the filters or the
            search to see them all.
          </EmptyState>
        ) : (
          filtered.map((r) => {
            const ts = dualTimestamp(r.createdAt, project.clientTz);
            return (
              <RequestCard
                key={r.id}
                refId={r.ref}
                title={r.title}
                tone={toneFor(r.scope)}
                scopeLabel={r.scope ? SCOPE_LABELS[r.scope] : PENDING_LABEL}
                meta={
                  <>
                    {REQUEST_TYPE_LABELS[r.type]}
                    {r.location ? ` · ${r.location}` : ''}
                    {r.layer ? ` · ${GROWTH_LAYER_LABELS[r.layer]}` : ''}
                    {r.hours !== null ? ` · ${formatHours(r.hours)} ${hoursUnit(r.hours)}` : ''}
                    {` · ${STATUS_LABELS[r.status]}`}
                  </>
                }
                detail={r.detail}
                link={r.link}
                timestamps={`${ts.client} · ${ts.india}`}
                dimmed={r.status === 'done' || r.status === 'wont_do'}
                triageSlot={
                  view === 'team' ? (
                    <TriageRow request={r} onTriage={(patch) => ledger.triageRequest(r.id, patch)} />
                  ) : undefined
                }
              />
            );
          })
        )}
        </section>
      </Sheet>

      {view === 'team' ? <Distribution requests={requests} /> : null}

      <footer className="border-t border-rule pt-6 mt-2">
        <p className="text-pencil text-body" style={{ maxWidth: 560 }}>
          This ledger lives in your browser only — nothing you type leaves it. It is the free version
          of the shared ledger Growthmak runs with every client engagement.
        </p>
      </footer>

      <Toast message={toast} />
    </main>
  );
}

function Masthead() {
  return (
    <div className="flex items-center gap-3">
      <Mark />
      <span>
        <span className="block text-ink text-head font-bold tracking-snug">Change Ledger</span>
        <span className="block text-pencil text-meta font-medium">Growthmak</span>
      </span>
    </div>
  );
}
