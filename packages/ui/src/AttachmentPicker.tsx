'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './primitives';
import { FieldLabel, InlineError } from './fields';

export interface AttachmentMeta {
  key: string;
  name: string;
  contentType: string;
  size: number;
}

interface AttachmentPickerProps {
  /** Uploads one file and resolves with its stored metadata, or throws. */
  onUpload: (file: File) => Promise<AttachmentMeta>;
  attachments: AttachmentMeta[];
  onChange: (next: AttachmentMeta[]) => void;
  disabled?: boolean;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = 'image/png,image/jpeg,image/gif,image/webp,application/pdf';

function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Attach screenshots and PDFs to a request (C8).
 *
 * Paste is supported deliberately: the PRD calls direct paste-to-upload of a
 * screenshot the thing that "removes the last real reason to use WhatsApp
 * instead", so a client who just hit Cmd+Shift+4 can paste straight in.
 *
 * The size and type checks here are for immediate feedback only — the server
 * enforces the real limits.
 */
export function AttachmentPicker({ onUpload, attachments, onChange, disabled }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Listen for paste on the whole enclosing form, not just this control: a
  // client who has just taken a screenshot will paste while their cursor is
  // in the description box, which is exactly where they should be able to.
  const acceptRef = useRef<(files: File[]) => void>(() => {});
  useEffect(() => {
    const form = rootRef.current?.closest('form');
    if (!form || disabled) return;
    const handler = (event: Event) => {
      const files = Array.from((event as ClipboardEvent).clipboardData?.files ?? []);
      if (files.length === 0) return;
      event.preventDefault();
      acceptRef.current(files);
    };
    form.addEventListener('paste', handler);
    return () => form.removeEventListener('paste', handler);
  }, [disabled]);

  async function accept(files: File[]) {
    if (files.length === 0) return;
    setError(null);

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        setError(`"${file.name || 'That file'}" is over the 10MB limit.`);
        continue;
      }
      setBusy((n) => n + 1);
      try {
        const meta = await onUpload(file);
        onChange([...attachments, meta]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not attach that file.');
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  // Kept in a ref so the form-level paste listener always calls the current
  // closure (with up-to-date `attachments`) without re-binding on every keystroke.
  acceptRef.current = (files: File[]) => void accept(files);

  return (
    <div ref={rootRef}>
      <FieldLabel>Screenshots or documents</FieldLabel>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          void accept(Array.from(e.target.files ?? []));
          // Reset so picking the same file twice still fires a change.
          if (inputRef.current) inputRef.current.value = '';
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          small
          disabled={disabled || busy > 0}
          onClick={() => inputRef.current?.click()}
        >
          {busy > 0 ? `Attaching ${busy}…` : 'Attach a file'}
        </Button>
        <span className="font-sans text-mute" style={{ fontSize: 12 }}>
          or paste a screenshot · images and PDFs, up to 10MB
        </span>
      </div>

      <InlineError>{error}</InlineError>

      {attachments.length > 0 ? (
        <ul className="grid gap-2 mt-3">
          {attachments.map((a) => (
            <li
              key={a.key}
              className="flex items-center justify-between gap-3 border border-rule rounded-inline px-3 py-2"
            >
              <span className="font-mono text-ink truncate" style={{ fontSize: '10.5px' }}>
                {a.name}
                <span className="text-mute"> · {readableSize(a.size)}</span>
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(attachments.filter((x) => x.key !== a.key))}
                className="font-mono text-mute underline shrink-0"
                style={{ fontSize: 10.5 }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
