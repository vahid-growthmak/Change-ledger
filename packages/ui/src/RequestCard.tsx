import * as React from 'react';
import { Tag, type ScopeTone } from './primitives';

export interface RequestCardProps {
  refId: string;
  title: string;
  tone: ScopeTone;
  scopeLabel: string;
  /** Mono metadata line: type, layer, hours, status. */
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
  /** Triage row, rendered below a dashed divider in the Growthmak view only. */
  triageSlot?: React.ReactNode;
}

const edgeColors: Record<ScopeTone, string> = {
  clear: 'var(--clear)',
  over: 'var(--over)',
  signal: 'var(--signal)',
  pending: 'var(--hatch-dark)',
};

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
      className="bg-card border border-rule rounded-card shadow-card px-5 py-4"
      style={{
        borderLeft: `3px solid ${edgeColors[tone]}`,
        opacity: dimmed ? 0.55 : 1,
        animation: 'card-rise 300ms ease',
      }}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-mute" style={{ fontSize: '10.5px', letterSpacing: '0.05em' }}>
          {refId}
        </span>
        <h3 className="font-sans text-ink flex-1 min-w-0" style={{ fontSize: '14.5px', fontWeight: 500, lineHeight: 1.4 }}>
          {title}
        </h3>
        <Tag tone={tone}>{scopeLabel}</Tag>
      </div>
      <div
        className="font-mono text-mute mt-2"
        style={{ fontSize: '10.5px', letterSpacing: '0.05em', lineHeight: 1.7 }}
      >
        {meta}
      </div>
      {detail ? (
        <p className="font-sans text-ink mt-2" style={{ fontSize: 13, lineHeight: 1.55 }}>
          {detail}
        </p>
      ) : null}
      {sourceQuote ? (
        <blockquote
          className="font-sans text-mute border-l-2 border-rule pl-3 mt-2"
          style={{ fontSize: 13, lineHeight: 1.55 }}
        >
          {sourceQuote}
        </blockquote>
      ) : null}
      {attachments && attachments.length > 0 ? (
        <div className="flex flex-wrap items-start gap-2 mt-3">
          {attachments.map((a) =>
            a.contentType.startsWith('image/') ? (
              <a
                key={a.key}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                title={a.name}
                className="block border border-rule rounded-inline overflow-hidden"
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
                className="inline-flex items-center border border-rule rounded-inline px-3 py-2 font-mono text-ink hover:border-signal"
                style={{ fontSize: '10.5px' }}
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
          className="text-signal font-sans underline mt-2 inline-block break-all"
          style={{ fontSize: 13 }}
        >
          {link}
        </a>
      ) : null}
      <div className="font-mono text-mute mt-3" style={{ fontSize: 10 }}>
        {timestamps}
      </div>
      {triageSlot ? <div className="mt-4 pt-4 border-t border-dashed border-rule">{triageSlot}</div> : null}
    </article>
  );
}
