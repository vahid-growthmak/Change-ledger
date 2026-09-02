'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MARKETS, minorUnitFactor, projectConfigSchema, type ProjectConfig } from '@growthmak/core';
import { Button, FieldLabel, FilterChip, InlineError, Select, TextInput } from '@growthmak/ui';
import { archiveProject, inviteMember, updateProject } from '@/lib/actions';

interface SettingsPanelProps {
  projectId: string;
  initial: ProjectConfig;
}

export function SettingsPanel({ projectId, initial }: SettingsPanelProps) {
  return (
    <div className="grid gap-6">
      <ProjectSettingsForm projectId={projectId} initial={initial} />
      <InviteForm projectId={projectId} />
      <ArchivePanel projectId={projectId} />
    </div>
  );
}

function ProjectSettingsForm({ projectId, initial }: SettingsPanelProps) {
  const [clientName, setClientName] = useState(initial.clientName);
  const [projectName, setProjectName] = useState(initial.projectName);
  const [mode, setMode] = useState<ProjectConfig['mode']>(initial.mode);
  const [hours, setHours] = useState(String(initial.contractedHours));
  const [marketCode, setMarketCode] = useState(MARKETS.find((m) => m.tz === initial.clientTz)?.code ?? 'US');
  const [rate, setRate] = useState(String(initial.rateMinor / minorUnitFactor(initial.currency)));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

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
      startedOn: initial.startedOn,
    };
    const parsed = projectConfigSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form, then try again.');
      return;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProject(projectId, parsed.data);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save.');
      }
    });
  }

  return (
    <section className="bg-card border border-rule shadow-card rounded-panel px-6 py-6">
      <h2 className="font-sans text-ink mb-4" style={{ fontSize: 15, fontWeight: 600 }}>
        Project settings
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <InlineError>{error}</InlineError>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="set-client">Client</FieldLabel>
            <TextInput id="set-client" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="set-project">Project</FieldLabel>
            <TextInput id="set-project" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
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
            <FieldLabel htmlFor="set-hours">{mode === 'foundation' ? 'Contracted hours' : 'Monthly capacity (hours)'}</FieldLabel>
            <TextInput id="set-hours" type="number" min={1} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
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
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save settings'}
          </Button>
          {saved ? (
            <span className="font-mono text-clear" style={{ fontSize: 12 }}>
              Saved
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function InviteForm({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInvited(null);
    startTransition(async () => {
      try {
        await inviteMember(projectId, email);
        setInvited(email);
        setEmail('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send the invite.');
      }
    });
  }

  return (
    <section className="bg-card border border-rule shadow-card rounded-panel px-6 py-6">
      <h2 className="font-sans text-ink mb-2" style={{ fontSize: 15, fontWeight: 600 }}>
        Invite a client
      </h2>
      <p className="font-sans text-mute mb-4" style={{ fontSize: 13, lineHeight: 1.55 }}>
        They sign in with this email using the magic link on the login page — no password, no
        registration.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <InlineError>{error}</InlineError>
        <div className="flex-1 min-w-[220px]">
          <FieldLabel htmlFor="invite-email">Email</FieldLabel>
          <TextInput
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="founder@client.com"
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Inviting…' : 'Invite'}
        </Button>
      </form>
      {invited ? (
        <p className="font-mono text-clear mt-3" style={{ fontSize: 12 }}>
          Invited {invited}
        </p>
      ) : null}
    </section>
  );
}

function ArchivePanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    if (!window.confirm('Archive this project? Its history stays intact, but it drops off the active list.')) {
      return;
    }
    startTransition(async () => {
      await archiveProject(projectId);
      router.push('/');
    });
  }

  return (
    <section className="border border-dashed border-rule rounded-panel px-6 py-6">
      <h2 className="font-sans text-ink mb-2" style={{ fontSize: 15, fontWeight: 600 }}>
        Archive project
      </h2>
      <p className="font-sans text-mute mb-4" style={{ fontSize: 13, lineHeight: 1.55 }}>
        Removes it from the active list. The full request history and audit trail are kept.
      </p>
      <Button type="button" variant="ghost" onClick={handleArchive} disabled={pending}>
        {pending ? 'Archiving…' : 'Archive this project'}
      </Button>
    </section>
  );
}
