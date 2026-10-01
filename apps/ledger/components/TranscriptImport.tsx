'use client';

import { useState, useTransition } from 'react';
import {
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  type ExtractedRequest,
  type RequestType,
} from '@growthmak/core';
import {
  Button,
  FieldLabel,
  InlineError,
  PanelLabel,
  Select,
  Tag,
  TextArea,
  TextInput,
} from '@growthmak/ui';
import { createRequestsFromTranscript, extractFromTranscript } from '@/lib/actions';

/** A candidate plus the reviewer's decisions about it. */
interface Candidate extends ExtractedRequest {
  keep: boolean;
}

export function TranscriptImport({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();

  function reset() {
    setTranscript('');
    setCandidates(null);
    setNotes('');
    setError(null);
    setDone(null);
  }

  function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    startExtract(async () => {
      try {
        const result = await extractFromTranscript(projectId, transcript);
        setCandidates(result.requests.map((r) => ({ ...r, keep: true })));
        setNotes(result.notes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read that transcript.');
      }
    });
  }

  function handleConfirm() {
    if (!candidates) return;
    const kept = candidates.filter((c) => c.keep);
    setError(null);
    startSave(async () => {
      try {
        const { created } = await createRequestsFromTranscript(
          projectId,
          kept.map(({ title, type, location, detail, quote }) => ({
            title,
            type,
            location,
            detail,
            quote,
          })),
        );
        setDone(created);
        setTranscript('');
        setCandidates(null);
        setNotes('');
        // Collapse back down: the work is finished, and the confirmation
        // lives in the collapsed state. Leaving a blank form open reads as
        // though nothing happened.
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not log those requests.');
      }
    });
  }

  function patch(index: number, changes: Partial<Candidate>) {
    setCandidates((cs) => cs && cs.map((c, i) => (i === index ? { ...c, ...changes } : c)));
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => setOpen(true)}>
          Log from a meeting transcript
        </Button>
        {done !== null ? (
          <span className="text-clear text-meta font-semibold">
            Logged {done} {done === 1 ? 'request' : 'requests'}
          </span>
        ) : null}
      </div>
    );
  }

  const keptCount = candidates?.filter((c) => c.keep).length ?? 0;

  return (
    <section
      className="bg-sheet rounded-card shadow-card px-6 py-6"
      aria-label="Log from a meeting transcript"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-ink text-head font-bold tracking-snug">Log from a meeting transcript</h2>
        <Button
          type="button"
          variant="quiet"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Close
        </Button>
      </div>

      <InlineError>{error}</InlineError>

      {candidates === null ? (
        <form onSubmit={handleExtract} className="mt-4 grid gap-4">
          <div>
            <FieldLabel htmlFor="transcript">Transcript</FieldLabel>
            <TextArea
              id="transcript"
              rows={10}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                'Paste the full transcript from your notetaker.\n\nClient: while you\'re in there, could we move the testimonials above the pricing table?\nGrowthmak: sure, noted.'
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={extracting || transcript.trim().length === 0}>
              {extracting ? 'Reading the transcript…' : 'Find change requests'}
            </Button>
          </div>
          <p className="text-pencil text-body max-w-measure">
            Nothing is logged from this step. You&apos;ll get a list to check and edit first —
            anything read wrongly is yours to fix or drop before it reaches the ledger.
          </p>
        </form>
      ) : (
        <div className="mt-4 grid gap-4">
          {notes ? (
            <div className="rounded-control bg-wash-signal px-5 py-4">
              <PanelLabel>Worth knowing</PanelLabel>
              <p className="text-ink text-body mt-1 max-w-measure">{notes}</p>
            </div>
          ) : null}

          {candidates.length === 0 ? (
            <div className="rounded-control bg-stock py-8 px-6 text-center">
              <p className="mx-auto text-pencil text-body" style={{ maxWidth: 400 }}>
                No change requests in that transcript. If you expected some, they may have been
                phrased as discussion rather than asks — check the text, or log them by hand.
              </p>
            </div>
          ) : (
            <>
              <PanelLabel>
                {candidates.length} found · {keptCount} selected to log
              </PanelLabel>
              <div className="grid gap-3">
                {candidates.map((c, i) => (
                  <article
                    key={i}
                    className="rounded-card bg-stock px-5 py-5 grid gap-4 transition-opacity duration-200 ease-soft"
                    style={{ opacity: c.keep ? 1 : 0.5 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-meta font-semibold text-pencil">
                        <input
                          type="checkbox"
                          checked={c.keep}
                          onChange={(e) => patch(i, { keep: e.target.checked })}
                          style={{ width: 16, height: 16 }}
                        />
                        Log this one
                      </label>
                      {c.confidence === 'low' ? (
                        <Tag tone="pending">Check this one</Tag>
                      ) : null}
                    </div>

                    <div>
                      <FieldLabel htmlFor={`t-title-${i}`}>What needs to change?</FieldLabel>
                      <TextInput
                        id={`t-title-${i}`}
                        value={c.title}
                        onChange={(e) => patch(i, { title: e.target.value })}
                        disabled={!c.keep}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor={`t-type-${i}`}>Kind of change</FieldLabel>
                        <Select
                          id={`t-type-${i}`}
                          value={c.type}
                          onChange={(e) => patch(i, { type: e.target.value as RequestType })}
                          disabled={!c.keep}
                        >
                          {REQUEST_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {REQUEST_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <FieldLabel htmlFor={`t-loc-${i}`}>Where</FieldLabel>
                        <TextInput
                          id={`t-loc-${i}`}
                          value={c.location}
                          onChange={(e) => patch(i, { location: e.target.value })}
                          placeholder="Not named on the call"
                          disabled={!c.keep}
                        />
                      </div>
                    </div>

                    {c.detail ? (
                      <div>
                        <FieldLabel htmlFor={`t-detail-${i}`}>Detail</FieldLabel>
                        <TextArea
                          id={`t-detail-${i}`}
                          rows={2}
                          value={c.detail}
                          onChange={(e) => patch(i, { detail: e.target.value })}
                          disabled={!c.keep}
                        />
                      </div>
                    ) : null}

                    {c.quote ? (
                      <div>
                        <PanelLabel>Said on the call</PanelLabel>
                        <blockquote className="rounded-control bg-sheet text-pencil text-body px-4 py-3 mt-1 max-w-measure">
                          {c.quote}
                        </blockquote>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {candidates.length > 0 ? (
              <Button type="button" onClick={handleConfirm} disabled={saving || keptCount === 0}>
                {saving
                  ? 'Logging…'
                  : `Log ${keptCount} ${keptCount === 1 ? 'request' : 'requests'}`}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
              Start over
            </Button>
          </div>
          {candidates.length > 0 ? (
            <p className="text-pencil text-body max-w-measure">
              These log as pending review, like any other request — finding them isn&apos;t triaging
              them.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
