import * as React from 'react';
import { CONTROL_SM, Tag, type ScopeTone } from './primitives';

export interface RequestCardProps {
  refId: string;
  title: string;
  tone: ScopeTone;
  scopeLabel: string;
  /** Metadata line: type, layer, hours, status. */
  meta: React.ReactNode;
  detail?: string | null;
  link?: string | null;
  /**
   * For a request lifted from a meeting: what was actually said. Shown so
   * "I never asked for that" can be answered with the words from the call.
   */
  sourceQuote?: string | null;
  /**
   * Attachments to render (C8), already resolved to authenticated URLs by the
   * caller — this component never builds a storage URL itself.
   */
  attachments?: { key: string; name: string; contentType: string; url: string }[];
  /** "14 Aug, 9:12 pm CDT · 15 Aug, 7:42 am IST" */
  timestamps: string;
  /** Done / Won't do drop to 55% opacity — the count stays visibly intact. */
  dimmed?: boolean;
  /** Triage row, rendered below a hairline in the Growthmak view only. */
  triageSlot?: React.ReactNode;
}

/**
 * One entry in the log.
 *
 * Not its own card: entries are rows inside the log's card, divided by
 * hairlines, so a hundred requests read as one list rather than a hundred
 * floating objects. The reference leads as a soft chip — it is what a client
 * quotes on a call, so it has to be findable without becoming the headline —
 * the title is the headline, and the verdict is the chip on the right. The
 * verdict's colour appears only inside that chip; an entry never wears a
 * coloured edge, because the written label is what has to carry the meaning.
 */
export function RequestCard({
  refId,
  title,
  tone,
  scopeLabel,
  meta,
  detail,
  link,
  sourceQuote,
  attachments,
  timestamps,
  dimmed,
  triageSlot,
}: RequestCardProps) {
  return (
    <article
      className="px-5 py-5 sm:px-6 transition-colors duration-200 ease-soft hover:bg-stock/60"
      style={{ opacity: dimmed ? 0.55 : 1, animation: 'row-in 240ms var(--ease-out) both' }}
    >
      <div className="grid gap-x-4 gap-y-3" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <span className="inline-flex items-center rounded-sm bg-stock-2 text-pencil tabular
            font-semibold text-ref shrink-0 px-2 py-1 mt-0.5">
            {refId}
          </span>
          <div className="flex-1 min-w-[12rem]">
            <h3 className="text-ink text-entry font-semibold tracking-snug max-w-measure">
              {title}
            </h3>
          </div>
          <span className="shrink-0">
            <Tag tone={tone}>{scopeLabel}</Tag>
          </span>
        </div>

        <div className="text-pencil text-meta font-medium">{meta}</div>

        {detail ? <p className="text-ink text-body max-w-measure">{detail}</p> : null}

        {sourceQuote ? (
          <blockquote className="rounded-control bg-stock text-pencil px-4 py-3 text-body max-w-measure">
            {sourceQuote}
          </blockquote>
        ) : null}

        {attachments && attachments.length > 0 ? (
          <div className="flex flex-wrap items-start gap-3">
            {attachments.map((a) =>
              a.contentType.startsWith('image/') ? (
                <a
                  key={a.key}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={a.name}
                  className="block overflow-hidden rounded-control bg-stock-2 shadow-card
                    transition-shadow duration-200 ease-soft hover:shadow-raised"
                  style={{ width: 96, height: 96 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </a>
              ) : (
                <a
                  key={a.key}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-control border border-rule bg-stock
                    px-4 text-meta font-semibold text-ink hover:border-pencil-2 hover:bg-sheet
                    transition-colors duration-200 ease-soft"
                  style={{ minHeight: CONTROL_SM }}
                >
                  {a.name}
                </a>
              ),
            )}
          </div>
        ) : null}

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener nofollow noreferrer"
            className="text-signal font-medium underline text-meta break-all inline-block"
          >
            {link}
          </a>
        ) : null}

        <div className="text-pencil tabular text-label font-medium">{timestamps}</div>
      </div>

      {triageSlot ? <div className="mt-5 pt-5 border-t border-rule-soft">{triageSlot}</div> : null}
    </article>
  );
}
