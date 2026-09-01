'use client';

import { useState } from 'react';
import {
  MARKETS,
  minorUnitFactor,
  projectConfigSchema,
  type ProjectConfig,
} from '@growthmak/core';
import { Button, FieldLabel, FilterChip, InlineError, Select, TextInput } from '@growthmak/ui';

interface SettingsFormProps {
  initial: ProjectConfig | null;
  onSave: (project: ProjectConfig) => void;
  onClearAll?: () => void;
}

/** Per-project configuration (O1–O3). Rate is visible here — Growthmak view only. */
export function SettingsForm({ initial, onSave, onClearAll }: SettingsFormProps) {
  const [clientName, setClientName] = useState(initial?.clientName ?? '');
  const [projectName, setProjectName] = useState(initial?.projectName ?? '');
  const [mode, setMode] = useState<ProjectConfig['mode']>(initial?.mode ?? 'foundation');
  const [hours, setHours] = useState(initial ? String(initial.contractedHours) : '60');
  const [marketCode, setMarketCode] = useState(
    initial ? MARKETS.find((m) => m.tz === initial.clientTz)?.code ?? 'US' : 'US',
  );
  const [rate, setRate] = useState(() => {
    if (!initial) return '45';
    const factor = minorUnitFactor(initial.currency);
    return String(initial.rateMinor / factor);
  });
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const market = MARKETS.find((m) => m.code === marketCode) ?? MARKETS[0];
    const rateNumber = Number(rate);
    if (!Number.isFinite(rateNumber) || rateNumber < 0) {
      setError('The rate needs to be a number.');
      return;
    }
    const candidate: ProjectConfig = {
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      mode,
      contractedHours: Number(hours),
      rateMinor: Math.round(rateNumber * minorUnitFactor(market.currency)),
      currency: market.currency,
      clientTz: market.tz,
      startedOn: initial?.startedOn ?? new Date().toISOString().slice(0, 10),
    };
    const parsed = projectConfigSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Could not save. Check the form, then try again.');
      return;
    }
    setError(null);
    onSave(candidate);
  }

  const hoursLabel = mode === 'foundation' ? 'Contracted hours' : 'Monthly capacity (hours)';
  const market = MARKETS.find((m) => m.code === marketCode) ?? MARKETS[0];

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <InlineError>{error}</InlineError>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="set-client">Client</FieldLabel>
          <TextInput id="set-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Dental" />
        </div>
        <div>
          <FieldLabel htmlFor="set-project">Project</FieldLabel>
          <TextInput id="set-project" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Website build" />
        </div>
      </div>
      <div>
        <FieldLabel>Engagement</FieldLabel>
        <div className="flex gap-3" role="group" aria-label="Engagement mode">
          <FilterChip pressed={mode === 'foundation'} onClick={() => setMode('foundation')}>
            Foundation Build — fixed scope
          </FilterChip>
          <FilterChip pressed={mode === 'retainer'} onClick={() => setMode('retainer')}>
            Growth Marketing — retainer
          </FilterChip>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="set-hours">{hoursLabel}</FieldLabel>
          <TextInput
            id="set-hours"
            type="number"
            min={1}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="set-market">Client market</FieldLabel>
          <Select id="set-market" value={marketCode} onChange={(e) => setMarketCode(e.target.value)}>
            {MARKETS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label} · {m.currency}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="set-rate">Hourly rate ({market.currency})</FieldLabel>
          <TextInput id="set-rate" type="number" min={0} step="any" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Save settings</Button>
        {onClearAll ? (
          <Button
            type="button"
            variant="ghost"
            small
            onClick={() => {
              if (window.confirm('Delete this ledger and every logged request from this browser? This cannot be undone.')) {
                onClearAll();
              }
            }}
          >
            Delete all data
          </Button>
        ) : null}
      </div>
      <p className="font-sans text-mute" style={{ fontSize: 13, lineHeight: 1.55 }}>
        Everything stays in this browser. The rate is shown only in the Growthmak view — the client sees the computed cost, not the working.
      </p>
    </form>
  );
}
