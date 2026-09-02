import { signOutAction } from '@/lib/auth-actions';
import type { AuthedSession } from '@/lib/authz';

export function AppHeader({ session, crumb }: { session: AuthedSession; crumb?: string }) {
  return (
    <div className="border-b border-rule pb-3 mb-6 flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <span
          className="font-mono uppercase text-signal-ink"
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em' }}
        >
          Growthmak
        </span>
        <span className="font-mono uppercase text-mute" style={{ fontSize: 11, letterSpacing: '0.16em' }}>
          {' '}
          / Change Ledger{crumb ? ` / ${crumb}` : ''}
        </span>
      </div>
      <form action={signOutAction} className="flex items-center gap-3">
        <span className="font-mono text-mute" style={{ fontSize: 11 }}>
          {session.email} · {session.role}
        </span>
        <button type="submit" className="font-mono text-signal-ink underline" style={{ fontSize: 11 }}>
          Sign out
        </button>
      </form>
    </div>
  );
}
