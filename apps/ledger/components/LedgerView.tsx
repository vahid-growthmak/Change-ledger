'use client';

import { useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import {
  dualTimestamp,
  formatHours,
  formatMoneyMinor,
  GROWTH_LAYER_LABELS,
  hoursUnit,
  MAX_ATTACHMENT_MB,
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
  type SignedUpload,
  type TriagePatch,
} from '@growthmak/core';
import {
  Distribution,
  EmptyState,
  type AttachmentMeta,
  FilterChip,
  Meter,
  MeterLegend,
  ReadoutCell,
  ReadoutRow,
  RequestCard,
  Sheet,
  SheetHead,
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

/**
 * What each role is allowed to see, decided on the server. A client payload
 * carries counts only — no hours, no cost, no contracted line — so there is
 * nothing commercial to find in the page source, not merely nothing on
 * screen.
 */
export type LedgerReadout =
  | { kind: 'team'; totals: LedgerTotals; contractedHours: number; currency: string }
  | { kind: 'client'; requestCount: number; beyondCount: number };

interface LedgerViewProps {
  projectId: string;
  /** Needed to build the authenticated attachment routes. */
  slug: string;
  project: Omit<ProjectConfig, 'rateMinor' | 'contractedHours' | 'currency'>;
  requests: ChangeRequest[];
  readout: LedgerReadout;
  periodLabel: string | null;
  role: 'team' | 'client';
}

export function LedgerView({ projectId, slug, project, requests, readout, periodLabel, role }: LedgerViewProps) {
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

  async function handleCreate(input: CreateRequestInput, attachments: AttachmentMeta[]) {
    await createRequest(projectId, input, attachments);
    showToast('Logged');
  }

  async function readError(response: Response, fallback: string): Promise<string> {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return payload?.error ?? fallback;
  }

  /**
   * Uploads a file straight to the bucket, in three steps: ask our server to
   * sign a one-file form, post the bytes to storage with it, then have the
   * server read back what landed.
   *
   * The bytes deliberately do not pass through the app. A Vercel serverless
   * function refuses a request body over 4.5MB, which capped attachments well
   * below the limit the UI advertised. Size and type are still enforced
   * server-side — they are baked into the signed form's policy, so storage
   * itself does the rejecting.
   */
  async function handleUpload(file: File): Promise<AttachmentMeta> {
    const signed = await fetch(`/${slug}/attachments/sign`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentType: file.type, size: file.size }),
    });
    if (!signed.ok) throw new Error(await readError(signed, 'Could not attach that file.'));
    const { key, upload } = (await signed.json()) as { key: string; upload: SignedUpload };

    let stored: Response;
    try {
      if (upload.method === 'POST') {
        const form = new FormData();
        // The policy fields have to precede the file: S3 stops reading the
        // multipart body at `file` and ignores anything after it.
        for (const [name, value] of Object.entries(upload.fields)) form.append(name, value);
        form.append('file', file);
        stored = await fetch(upload.url, { method: 'POST', body: form });
      } else {
        stored = await fetch(upload.url, { method: 'PUT', headers: upload.headers, body: file });
      }
    } catch {
      // A cross-origin failure lands here with nothing readable attached, so
      // this covers a dropped connection and a missing bucket CORS rule alike.
      throw new Error('Could not reach storage. Check your connection, then try again.');
    }
    if (!stored.ok) {
      throw new Error(
        stored.status === 403
          ? `That file is over the ${MAX_ATTACHMENT_MB}MB limit.`
          : 'Could not store that file. Nothing was attached; try again.',
      );
    }

    const confirmed = await fetch(`/${slug}/attachments/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, name: file.name || 'attachment' }),
    });
    if (!confirmed.ok) throw new Error(await readError(confirmed, 'Could not attach that file.'));
    return (await confirmed.json()) as AttachmentMeta;
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

  const breached = readout.kind === 'team' ? readout.totals.beyondCount > 0 : readout.beyondCount > 0;

  return (
    <div className="grid gap-6">
      {readout.kind === 'team' ? (
        <ReadoutRow>
          <ReadoutCell label="Requests logged" value={String(readout.totals.requestCount)} />
          <ReadoutCell label="Beyond scope" value={String(readout.totals.beyondCount)} breached={breached} />
          <ReadoutCell
            label="Extra hours"
            value={formatHours(readout.totals.beyondHours)}
            unit={hoursUnit(readout.totals.beyondHours)}
            breached={breached}
          />
          <ReadoutCell
            label="Additional cost"
            value={formatMoneyMinor(readout.totals.additionalCostMinor, readout.currency)}
            breached={breached}
          />
        </ReadoutRow>
      ) : (
        <ReadoutRow>
          <ReadoutCell label="Requests logged" value={String(readout.requestCount)} />
          <ReadoutCell label="Beyond scope" value={String(readout.beyondCount)} breached={breached} />
        </ReadoutRow>
      )}

      {/* The meter is an hours-against-the-agreement instrument, so it only
          exists where hours and the contracted line do. Without them there is
          no scale and no reference — a bar with neither would say nothing. */}
      {readout.kind === 'team' ? (
        <Sheet>
          <SheetHead>Hours against agreement</SheetHead>
          <section className="px-5 pt-7 pb-5" aria-label="Hours against agreement">
          <Meter
            contractedHours={readout.contractedHours}
            inScopeHours={readout.totals.inScopeHours}
            pendingHours={readout.totals.pendingHours}
            beyondHours={readout.totals.beyondHours}
            scaleHours={meterScale(readout.contractedHours, readout.totals)}
            lineLabel={
              project.mode === 'foundation'
                ? `Contracted scope · ${formatHours(readout.contractedHours)} ${hoursUnit(readout.contractedHours)}`
                : `Monthly capacity · ${formatHours(readout.contractedHours)} ${hoursUnit(readout.contractedHours)}`
            }
            ariaLabel={`${formatHours(readout.totals.inScopeHours)} hours in scope, ${formatHours(readout.totals.pendingHours)} hours pending review, ${formatHours(readout.totals.beyondHours)} hours beyond scope, against ${formatHours(readout.contractedHours)} agreed hours.`}
          />
          <MeterLegend pendingNote="Pending review — not yet counted either way" />
          {project.mode === 'retainer' ? (
            <p className="font-sans text-pencil mt-3" style={{ fontSize: 13, lineHeight: 1.55 }}>
              The meter counts {periodLabel}. It resets each cycle; the full history stays in the list below.
            </p>
          ) : null}
          </section>
        </Sheet>
      ) : null}

      <SubmitForm onSubmit={handleCreate} onUploadAttachment={handleUpload} />

      {/* Team only: transcripts are a whole meeting's conversation, including
          things not meant for the client's side of the ledger. */}
      {role === 'team' ? <TranscriptImport projectId={projectId} /> : null}

      {optimisticRequests.length > 0 ? (
        <section aria-label="Filters" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center">
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
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-none sm:flex-nowrap sm:ml-auto">
            <Select
              aria-label="Kind of change"
              className="flex-1 min-w-0 sm:flex-none"
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
            <TextInput
              aria-label="Search requests"
              placeholder="Search the log"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 sm:flex-none"
              style={{ maxWidth: 240 }}
            />
          </div>
        </section>
      ) : null}

      <Sheet>
        <SheetHead
          right={
            <span className="font-mono text-pencil tabular" style={{ fontSize: 11 }}>
              {filtered.length === optimisticRequests.length
                ? `${optimisticRequests.length}`
                : `${filtered.length} / ${optimisticRequests.length}`}
            </span>
          }
        >
          The log
        </SheetHead>
        <section aria-label="Change requests" className="divide-y divide-rule">
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
                attachments={r.attachments.map((a) => ({
                  ...a,
                  // Authenticated route, not a storage URL: access is checked
                  // per request and the presigned link is short-lived.
                  url: `/${slug}/attachments/${a.key.split('/').map(encodeURIComponent).join('/')}`,
                }))}
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
      </Sheet>

      {role === 'team' ? <Distribution requests={optimisticRequests} /> : null}

      <Toast message={toast} />
    </div>
  );
}
