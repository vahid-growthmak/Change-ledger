'use client';

import {
  GROWTH_LAYERS,
  GROWTH_LAYER_LABELS,
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  type ChangeRequest,
} from '@growthmak/core';
import { PanelLabel } from '@growthmak/ui';

function BarBox({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="bg-card border border-rule shadow-card rounded-panel px-5 py-4 flex-1 min-w-0">
      <PanelLabel>{title}</PanelLabel>
      <div className="grid gap-2 mt-3">
        {rows.map((r) => (
          <div key={r.label} className="grid items-center gap-3" style={{ gridTemplateColumns: '110px 1fr 2ch' }}>
            <span className="font-mono text-mute truncate" style={{ fontSize: '10.5px', letterSpacing: '0.05em' }}>
              {r.label}
            </span>
            <span className="relative rounded-fill bg-paper border border-rule overflow-hidden" style={{ height: 10 }}>
              <span
                className="absolute inset-y-0 left-0 bg-ink"
                style={{ width: `${(r.count / max) * 100}%`, transition: 'width 450ms var(--ease-meter)' }}
              />
            </span>
            <span className="font-mono text-ink tabular-nums text-right" style={{ fontSize: '10.5px' }}>
              {r.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The Signal layer (O6): where the change pressure actually sits.
 * Read at each monthly review, not left to accumulate.
 */
export function Distribution({ requests }: { requests: ChangeRequest[] }) {
  if (requests.length === 0) return null;

  const byType = REQUEST_TYPES.map((t) => ({
    label: REQUEST_TYPE_LABELS[t],
    count: requests.filter((r) => r.type === t).length,
  }));
  const untagged = requests.filter((r) => r.layer === null).length;
  const byLayer = [
    ...GROWTH_LAYERS.map((l) => ({
      label: GROWTH_LAYER_LABELS[l],
      count: requests.filter((r) => r.layer === l).length,
    })),
    { label: 'Untagged', count: untagged },
  ];

  return (
    <section aria-label="Distribution" className="flex flex-col sm:flex-row gap-4">
      <BarBox title="By kind of change" rows={byType} />
      <BarBox title="By Growth Engine layer" rows={byLayer} />
    </section>
  );
}
