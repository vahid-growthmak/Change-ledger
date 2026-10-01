import { GROWTH_LAYERS, GROWTH_LAYER_LABELS, REQUEST_TYPES, REQUEST_TYPE_LABELS, type ChangeRequest } from '@growthmak/core';
import { Sheet, SheetHead } from './primitives';

/**
 * A tally block. Bars are set in ink, because this chart answers "where is the
 * pressure", not "is this good or bad" — the semantic colours are reserved for
 * scope verdicts and may not be spent on a distribution.
 */
function TallyBlock({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Sheet className="flex-1 min-w-0">
      <SheetHead>{title}</SheetHead>
      <div className="px-6 pb-6 grid gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid items-center gap-4"
            style={{ gridTemplateColumns: 'minmax(0,116px) 1fr 3ch' }}
          >
            <span className="text-pencil text-meta font-medium truncate">{r.label}</span>
            <span className="relative overflow-hidden rounded-full bg-stock-2" style={{ height: 10 }}>
              {/* Scaled rather than resized: a tally bar has no minimum width to
                  preserve, so the transform is free and costs no layout. */}
              <span
                className="absolute inset-y-0 left-0 w-full rounded-full bg-ink origin-left"
                style={{
                  transform: `scaleX(${r.count / max})`,
                  transition: 'transform 500ms var(--ease-out)',
                }}
              />
            </span>
            <span className="text-ink text-meta font-semibold tabular text-right">{r.count}</span>
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
