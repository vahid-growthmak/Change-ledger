'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MARKETS, minorUnitFactor, projectConfigSchema, type ProjectConfig } from '@growthmak/core';
import { Button, FilterChip, Select, TextInput, InlineError, FieldLabel } from '@growthmak/ui';
import { createProject } from '@/lib/actions';

export function NewProjectForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [mode, setMode] = useState<ProjectConfig['mode']>('foundation');
  const [hours, setHours] = useState('60');
  const [marketCode, setMarketCode] = useState('US');
  const [rate, setRate] = useState('45');
  const [error, setError] = useState<string | null>(null);

  const market = MARKETS.find((m) => m.code === marketCode) ?? MARKETS[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rateNumber = Number(rate);
    const candidate = {
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      mode,
      contractedHours: Number(hours),
      rateMinor: Math.round(rateNumber * minorUnitFactor(market.currency)),
      currency: market.currency,
      clientTz: market.tz,
      startedOn: new Date().toISOString().slice(0, 10),
    };
    const parsed = projectConfigSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form, then try again.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const slug = await createProject(parsed.data);
        router.push(`/${slug}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create the project.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <InlineError>{error}</InlineError>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="np-client">Client</FieldLabel>
          <TextInput id="np-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Dental" required />
        </div>
        <div>
          <FieldLabel htmlFor="np-project">Project</FieldLabel>
          <TextInput id="np-project" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Website build" required />
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
          <FieldLabel htmlFor="np-hours">{mode === 'foundation' ? 'Contracted hours' : 'Monthly capacity (hours)'}</FieldLabel>
          <TextInput id="np-hours" type="number" min={1} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <div>
          <FieldLabel htmlFor="np-market">Client market</FieldLabel>
          <Select id="np-market" value={marketCode} onChange={(e) => setMarketCode(e.target.value)}>
            {MARKETS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label} · {m.currency}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="np-rate">Hourly rate ({market.currency})</FieldLabel>
          <TextInput id="np-rate" type="number" min={0} step="any" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
