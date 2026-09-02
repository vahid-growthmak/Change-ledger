'use client';

import {
  GROWTH_LAYERS,
  GROWTH_LAYER_LABELS,
  PENDING_LABEL,
  REQUEST_STATUSES,
  SCOPE_LABELS,
  SCOPE_VERDICTS,
  STATUS_LABELS,
  type ChangeRequest,
  type TriagePatch,
} from '@growthmak/core';
import { FieldLabel, InlineSelect } from './fields';

interface TriageRowProps {
  request: ChangeRequest;
  onTriage: (patch: TriagePatch) => void;
}

/** Inline triage: scope, layer, hours, status (T1–T5). Team view only. */
export function TriageRow({ request, onTriage }: TriageRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div>
        <FieldLabel htmlFor={`scope-${request.id}`}>Scope</FieldLabel>
        <InlineSelect
          id={`scope-${request.id}`}
          className="w-full"
          value={request.scope ?? ''}
          onChange={(e) => onTriage({ scope: (e.target.value || null) as ChangeRequest['scope'] })}
        >
          <option value="">{PENDING_LABEL}</option>
          {SCOPE_VERDICTS.map((s) => (
            <option key={s} value={s}>
              {SCOPE_LABELS[s]}
            </option>
          ))}
        </InlineSelect>
      </div>
      <div>
        <FieldLabel htmlFor={`layer-${request.id}`}>Layer</FieldLabel>
        <InlineSelect
          id={`layer-${request.id}`}
          className="w-full"
          value={request.layer ?? ''}
          onChange={(e) => onTriage({ layer: (e.target.value || null) as ChangeRequest['layer'] })}
        >
          <option value="">Untagged</option>
          {GROWTH_LAYERS.map((l) => (
            <option key={l} value={l}>
              {GROWTH_LAYER_LABELS[l]}
            </option>
          ))}
        </InlineSelect>
      </div>
      <div>
        <FieldLabel htmlFor={`hours-${request.id}`}>Hours</FieldLabel>
        <input
          id={`hours-${request.id}`}
          type="number"
          min={0}
          step={0.5}
          value={request.hours ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') return onTriage({ hours: null });
            const n = Number(raw);
            if (Number.isFinite(n) && n >= 0) {
              onTriage({ hours: Math.round(n * 2) / 2 });
            }
          }}
          className="w-full rounded-inline border border-rule bg-paper text-ink font-mono px-2 py-1 focus:outline-none focus:border-signal focus:bg-card"
          style={{ fontSize: '10.5px', minHeight: 44 }}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`status-${request.id}`}>Status</FieldLabel>
        <InlineSelect
          id={`status-${request.id}`}
          className="w-full"
          value={request.status}
          onChange={(e) => onTriage({ status: e.target.value as ChangeRequest['status'] })}
        >
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </InlineSelect>
      </div>
    </div>
  );
}
