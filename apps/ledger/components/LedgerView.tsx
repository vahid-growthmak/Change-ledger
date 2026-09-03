'use client';

import { useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import {
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
  type ChangeRequest,
  type CreateRequestInput,
  type LedgerTotals,
  type ProjectConfig,
  type RequestType,
  type TriagePatch,
} from '@growthmak/core';
import {
  Distribution,
  EmptyState,
  FilterChip,
  Meter,
  MeterLegend,
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
import { createRequest, triageRequest } from '@/lib/actions';
import { TranscriptImport } from './TranscriptImport';

type ListFilter = 'all' | 'pending' | 'beyond' | 'open';

const toneFor = (scope: ChangeRequest['scope']): ScopeTone =>
  scope === 'in_scope' ? 'clear' : scope === 'beyond_scope' ? 'over' : scope === 'needs_quote' ? 'signal' : 'pending';

interface LedgerViewProps {
  projectId: string;
  project: Omit<ProjectConfig, 'rateMinor'>;
  requests: ChangeRequest[];
  totals: LedgerTotals;
  periodLabel: string | null;
  role: 'team' | 'client';
  currency: string;
}

export function LedgerView({ projectId, project, requests, totals, periodLabel, role, currency }: LedgerViewProps) {
  const [filter, setFilter] = useState<ListFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'' | RequestType>('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [triageError, setTriageError] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [optimisticRequests, applyOptimisticTriage] = useOptimistic(
    requests,
    (state, update: { id: string; patch: TriagePatch }) =>
      state.map((r) => (r.id === update.id ? { ...r, ...update.patch } : r)),
  );

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  async function handleCreate(input: CreateRequestInput) {
    await createRequest(projectId, input);
    showToast('Logged');
  }

  function handleTriage(id: string, patch: TriagePatch) {
    setTriageError((e) => ({ ...e, [id]: '' }));
    startTransition(async () => {
      applyOptimisticTriage({ id, patch });
      try {
        await triageRequest(id, patch);
      } catch (err) {
        setTriageError((e) => ({
          ...e,
          [id]: err instanceof Error ? err.message : 'Could not save. Check your connection, then try again.',
        }));
      }
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return optimisticRequests.filter((r) => {
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
  }, [optimisticRequests, filter, typeFilter, search]);

  const scale = meterScale(project.contractedHours, totals);
  const lineLabel =
    project.mode === 'foundation'
      ? `Contracted scope · ${formatHours(project.contractedHours)} ${hoursUnit(project.contractedHours)}`
      : `Monthly capacity · ${formatHours(project.contractedHours)} ${hoursUnit(project.contractedHours)}`;
  const breached = totals.beyondCount > 0;

  return (
    <div className="grid gap-6">
      <ReadoutRow>
        <ReadoutCell label="Requests logged" value={String(totals.requestCount)} />
        <ReadoutCell label="Beyond scope" value={String(totals.beyondCount)} breached={breached} />
        <ReadoutCell
          label="Extra hours"
          value={formatHours(totals.beyondHours)}
          unit={hoursUnit(totals.beyondHours)}
          breached={breached}
        />
        <ReadoutCell label="Additional cost" value={formatMoneyMinor(totals.additionalCostMinor, currency)} breached={breached} />
      </ReadoutRow>

      <section className="bg-card border border-rule shadow-card rounded-panel px-6 pt-6 pb-5" aria-label="Hours against agreement">
        <Meter
          contractedHours={project.contractedHours}
          inScopeHours={totals.inScopeHours}
          pendingHours={totals.pendingHours}
          beyondHours={totals.beyondHours}
          scaleHours={scale}
          lineLabel={lineLabel}
          ariaLabel={`${formatHours(totals.inScopeHours)} hours in scope, ${formatHours(totals.pendingHours)} hours pending review, ${formatHours(totals.beyondHours)} hours beyond scope, against ${formatHours(project.contractedHours)} agreed hours.`}
        />
        <MeterLegend pendingNote="Pending review — not yet counted either way" />
        {project.mode === 'retainer' ? (
          <p className="font-sans text-mute mt-3" style={{ fontSize: 13, lineHeight: 1.55 }}>
            The meter counts {periodLabel}. It resets each cycle; the full history stays in the list below.
          </p>
        ) : null}
      </section>

      <SubmitForm onSubmit={handleCreate} />

      {/* Team only: transcripts are a whole meeting's conversation, including
          things not meant for the client's side of the ledger. */}
      {role === 'team' ? <TranscriptImport projectId={projectId} /> : null}

      {optimisticRequests.length > 0 ? (
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

      <section aria-label="Change requests" className="grid gap-3">
        {optimisticRequests.length === 0 ? (
          <EmptyState>
            No changes logged yet. Every time something new is asked for, add it here. That&apos;s how
            the count stays honest for both sides.
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>
            Nothing matches these filters. {optimisticRequests.length}{' '}
            {optimisticRequests.length === 1 ? 'request exists' : 'requests exist'} — clear the filters or
            the search to see them all.
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
                    {r.source === 'transcript' ? ' · From meeting' : ''}
                  </>
                }
                sourceQuote={r.sourceQuote}
                detail={r.detail}
                link={r.link}
                timestamps={`${ts.client} · ${ts.india}`}
                dimmed={r.status === 'done' || r.status === 'wont_do'}
                triageSlot={
                  role === 'team' ? (
                    <>
                      <TriageRow request={r} onTriage={(patch) => handleTriage(r.id, patch)} />
                      {triageError[r.id] ? (
                        <p className="text-over font-sans mt-2" style={{ fontSize: 13 }} role="alert">
                          {triageError[r.id]}
                        </p>
                      ) : null}
                    </>
                  ) : undefined
                }
              />
            );
          })
        )}
      </section>

      {role === 'team' ? <Distribution requests={optimisticRequests} /> : null}

      <Toast message={toast} />
    </div>
  );
}
