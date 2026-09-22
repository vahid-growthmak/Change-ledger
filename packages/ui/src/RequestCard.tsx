import * as React from 'react';
import { Tag, type ScopeTone } from './primitives';

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
  /** Triage row, rendered below a rule in the Growthmak view only. */
  triageSlot?: React.ReactNode;
}

/**
 * One entry in the manifest.
 *
 * Not a card: entries tile hairline to hairline and the log's own rules divide
 * them, so a hundred requests read as one document rather than a hundred
 * floating objects. The reference is the headline — it is what a client quotes
 * on a call — and the verdict is stamped to its right. The verdict's ink
 * appears only inside that stamp; an entry never wears a coloured edge,
 * because the written label is what has to carry the meaning.
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
      className="px-4 py-4 sm:px-5 transition-colors duration-150 hover:bg-stock-2/40"
      style={{ opacity: dimmed ? 0.55 : 1, animation: 'entry-file 220ms var(--ease-stamp) both' }}
    >
      <div className="grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
          {/* The number as headline: machine-assigned, so Courier, and set at
              the scale of the thing people actually refer to. */}
          <span
            className="font-mono text-ink tabular shrink-0 text-ref"
            style={{ letterSpacing: '-0.01em' }}
          >
            {refId}
          </span>
          <div className="flex-1 min-w-[12rem]">
            <h3 className="font-sans text-ink text-entry max-w-measure" style={{ fontWeight: 500 }}>
              {title}
            </h3>
          </div>
          <span className="shrink-0">
            <Tag tone={tone}>{scopeLabel}</Tag>
          </span>
        </div>

        <div className="font-sans text-pencil text-meta" style={{ lineHeight: 1.7 }}>
          {meta}
        </div>

        {detail ? (
          <p className="font-sans text-ink text-body max-w-measure">{detail}</p>
        ) : null}

        {sourceQuote ? (
          <blockquote className="font-sans text-pencil border-l border-rule pl-3 text-body max-w-measure">
            {sourceQuote}
          </blockquote>
        ) : null}

        {attachments && attachments.length > 0 ? (
          <div className="flex flex-wrap items-start gap-2">
            {attachments.map((a) =>
              a.contentType.startsWith('image/') ? (
                <a
                  key={a.key}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={a.name}
                  className="block border border-rule hover:border-ink transition-colors duration-150"
                  style={{ width: 92, height: 92 }}
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
                  className="inline-flex items-center border border-rule px-3 py-2 font-sans text-meta
                    text-ink hover:border-ink transition-colors duration-150"
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
            className="text-signal font-sans underline text-meta break-all inline-block"
          >
            {link}
          </a>
        ) : null}

        {/* Machine-assigned, so Courier. */}
        <div className="font-mono text-pencil tabular" style={{ fontSize: 11 }}>
          {timestamps}
        </div>
      </div>

      {triageSlot ? <div className="mt-4 pt-4 border-t border-rule-soft">{triageSlot}</div> : null}
    </article>
  );
}
