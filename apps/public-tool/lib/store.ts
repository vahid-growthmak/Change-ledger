'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  makeRef,
  periodForInsert,
  type ChangeRequest,
  type CreateRequestInput,
  type ProjectConfig,
  type TriagePatch,
} from '@growthmak/core';

const STORAGE_KEY = 'growthmak-change-ledger-v1';

interface PersistedState {
  version: 1;
  project: ProjectConfig | null;
  requests: ChangeRequest[];
  /** Monotonic — refs are never reused, mirroring the per-project counter in Postgres. */
  refCounter: number;
}

const emptyState: PersistedState = { version: 1, project: null, requests: [], refCounter: 0 };

function load(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.version !== 1) return emptyState;
    return { ...emptyState, ...parsed };
  } catch {
    return emptyState;
  }
}

export function useLedger() {
  const [state, setState] = useState<PersistedState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    setState(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked — the in-memory session still works.
    }
  }, [state, loaded]);

  const saveProject = useCallback((project: ProjectConfig) => {
    setState((s) => ({ ...s, project }));
  }, []);

  const addRequest = useCallback((input: CreateRequestInput): ChangeRequest | null => {
    let created: ChangeRequest | null = null;
    setState((s) => {
      if (!s.project) return s;
      const now = new Date();
      created = {
        id: crypto.randomUUID(),
        ref: makeRef(s.refCounter),
        title: input.title,
        type: input.type as ChangeRequest['type'],
        location: input.location || null,
        detail: input.detail || null,
        link: input.link || null,
        layer: null,
        scope: null, // pending review — never a verdict by default (T6)
        hours: null,
        status: 'new',
        // The public tool has no backend, so no transcript import — everything
        // here is typed in directly.
        source: 'direct',
        sourceQuote: null,
        // No backend here, so nothing to upload to — the public tool offers
        // the link field only.
        attachments: [],
        period: periodForInsert(s.project.mode, now),
        createdAt: now.toISOString(),
        updatedAt: null,
      };
      return { ...s, refCounter: s.refCounter + 1, requests: [created, ...s.requests] };
    });
    return created;
  }, []);

  const triageRequest = useCallback((id: string, patch: TriagePatch) => {
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
      ),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState(emptyState);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    loaded,
    project: state.project,
    requests: state.requests,
    saveProject,
    addRequest,
    triageRequest,
    clearAll,
  };
}
