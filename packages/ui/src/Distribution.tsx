import { GROWTH_LAYERS, GROWTH_LAYER_LABELS, REQUEST_TYPES, REQUEST_TYPE_LABELS, type ChangeRequest } from '@growthmak/core';
import { Sheet, SheetHead } from './primitives';

/**
 * A tally block. Bars are square and set in ink, because this chart answers
 * "where is the pressure", not "is this good or bad" — the semantic inks are
 * reserved for scope verdicts and may not be spent on a distribution.
 */
function TallyBlock({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Sheet className="flex-1 min-w-0">
      <SheetHead>{title}</SheetHead>
      <div className="divide-y divide-rule-soft">
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid items-center gap-3 px-5 py-2"
            style={{ gridTemplateColumns: 'minmax(0,104px) 1fr 3ch' }}
          >
            <span className="font-sans text-pencil truncate" style={{ fontSize: 12 }}>
              {r.label}
            </span>
            <span className="relative overflow-hidden bg-stock border border-rule-soft" style={{ height: 11 }}>
              {/* Scaled rather than resized: a tally bar has no minimum width to
                  preserve, so the transform is free and costs no layout. */}
              <span
                className="absolute inset-y-0 left-0 w-full bg-ink origin-left"
                style={{
                  transform: `scaleX(${r.count / max})`,
                  transition: 'transform 450ms var(--ease-meter)',
                }}
              />
            </span>
            <span className="font-mono text-ink tabular text-right" style={{ fontSize: 12 }}>
              {r.count}
            </span>
          </div>
        ))}
      </div>
    </Sheet>
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
    <section aria-label="Distribution" className="flex flex-col sm:flex-row gap-5">
      <TallyBlock title="By kind of change" rows={byType} />
      <TallyBlock title="By Growth Engine layer" rows={byLayer} />
    </section>
  );
}
