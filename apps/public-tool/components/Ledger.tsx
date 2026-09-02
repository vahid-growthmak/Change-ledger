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
  Button,
  Distribution,
  EmptyState,
  FilterChip,
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
        <div className="bg-card border border-rule shadow-card rounded-panel px-6 py-6 mt-6">
          <h1 className="font-sans text-ink" style={{ fontSize: 'clamp(21px, 3vw, 26px)', fontWeight: 600, letterSpacing: '-0.025em' }}>
            Set up your ledger
          </h1>
          <p className="font-sans text-mute mt-2 mb-5" style={{ fontSize: '13.5px', lineHeight: 1.55, maxWidth: 560 }}>
            Name the engagement, set the agreed hours and rate, and start logging every change request
            against them. Everything stays in this browser — nothing is sent anywhere.
          </p>
          <SettingsForm initial={null} onSave={(p) => { ledger.saveProject(p); showToast('Ledger ready'); }} />
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
        <div className="flex flex-wrap items-baseline gap-3 mt-4">
          <h1 className="font-sans text-ink" style={{ fontSize: 'clamp(21px, 3vw, 26px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
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
      </header>

      {/* Readout — the answer before the detail (M4, M6) */}
      <ReadoutRow>
        <ReadoutCell label="Requests logged" value={String(totals!.requestCount)} />
        <ReadoutCell label="Beyond scope" value={String(totals!.beyondCount)} breached={breached} />
        <ReadoutCell
          label="Extra hours"
          value={formatHours(totals!.beyondHours)}
          unit={hoursUnit(totals!.beyondHours)}
          breached={breached}
        />
        <ReadoutCell
          label="Additional cost"
          value={formatMoneyMinor(totals!.additionalCostMinor, project.currency)}
          breached={breached}
        />
      </ReadoutRow>

      {/* The meter (M1–M3) */}
      <section className="bg-card border border-rule shadow-card rounded-panel px-6 pt-6 pb-5" aria-label="Hours against agreement">
        <Meter
          contractedHours={project.contractedHours}
          inScopeHours={totals!.inScopeHours}
          pendingHours={totals!.pendingHours}
          beyondHours={totals!.beyondHours}
          scaleHours={scale}
          lineLabel={lineLabel}
          ariaLabel={`${formatHours(totals!.inScopeHours)} hours in scope, ${formatHours(totals!.pendingHours)} hours pending review, ${formatHours(totals!.beyondHours)} hours beyond scope, against ${formatHours(project.contractedHours)} agreed hours.`}
        />
        <MeterLegend pendingNote="Pending review — not yet counted either way" />
        {project.mode === 'retainer' ? (
          <p className="font-sans text-mute mt-3" style={{ fontSize: 13, lineHeight: 1.55 }}>
            The meter counts {periodLabel}. It resets each cycle; the full history stays in the list below.
          </p>
        ) : null}
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="group" aria-label="View">
          <FilterChip pressed={view === 'client'} onClick={() => { setView('client'); setSettingsOpen(false); }}>
            Client view
          </FilterChip>
          <FilterChip pressed={view === 'team'} onClick={() => setView('team')}>
            Growthmak view
          </FilterChip>
        </div>
        {view === 'team' ? (
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" small onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="ghost" small onClick={() => setSettingsOpen((o) => !o)}>
              {settingsOpen ? 'Close settings' : 'Settings'}
            </Button>
          </div>
        ) : null}
      </div>

      {view === 'team' && settingsOpen ? (
        <section className="bg-card border border-rule shadow-card rounded-panel px-6 py-6" aria-label="Project settings">
          <h2 className="font-sans text-ink mb-4" style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Project settings
          </h2>
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
            <Select
              aria-label="Kind of change"
              className="sm:ml-2"
              style={{ maxWidth: 180 }}
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
          </div>
          <TextInput
            aria-label="Search requests"
            placeholder="Search the log"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto"
            style={{ maxWidth: 240 }}
          />
        </section>
      ) : null}

      {/* The list */}
      <section aria-label="Change requests" className="grid gap-3">
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

      {view === 'team' ? <Distribution requests={requests} /> : null}

      <footer className="border-t border-rule pt-5 mt-2">
        <p className="font-sans text-mute" style={{ fontSize: 13, lineHeight: 1.55, maxWidth: 560 }}>
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
    <div className="border-b border-rule pb-3">
      <span className="font-mono uppercase text-signal-ink" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em' }}>
        Growthmak
      </span>
      <span className="font-mono uppercase text-mute" style={{ fontSize: 11, letterSpacing: '0.16em' }}>
        {' '}
        / Change Ledger
      </span>
    </div>
  );
}
