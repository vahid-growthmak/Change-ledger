'use client';

import { useState } from 'react';
import { createRequestSchema, REQUEST_TYPES, REQUEST_TYPE_LABELS, type CreateRequestInput } from '@growthmak/core';
import { Button } from './primitives';
import { FieldLabel, InlineError, Select, TextArea, TextInput } from './fields';
import { AttachmentPicker, type AttachmentMeta } from './AttachmentPicker';

interface SubmitFormProps {
  /** May throw (e.g. a failed Server Action) — the form stays filled in and shows the error inline. */
  onSubmit: (input: CreateRequestInput, attachments: AttachmentMeta[]) => void | Promise<void>;
  /**
   * Uploads one file and resolves with its stored metadata. Omit to hide the
   * attachment control entirely — the public tool has no backend to upload
   * to, so there it simply isn't offered.
   */
  onUploadAttachment?: (file: File) => Promise<AttachmentMeta>;
}

const blank = { title: '', type: 'other', location: '', detail: '', link: '' };

export function SubmitForm({ onSubmit, onUploadAttachment }: SubmitFormProps) {
  const [values, setValues] = useState(blank);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (field: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createRequestSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Could not save. Check the form, then try again.');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onSubmit(parsed.data, attachments);
      // Only clear on success — a failed submit keeps the input, nothing is lost (Failure states).
      setValues(blank);
      setAttachments([]);
      setMoreOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Check your connection, then try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bg-card border border-rule shadow-card rounded-panel px-6 py-6" aria-label="Log a change request">
      <h2 className="font-sans text-ink" style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
        Log a change request
      </h2>
      <InlineError>{error}</InlineError>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
        <div>
          <FieldLabel htmlFor="cr-title">What needs to change?</FieldLabel>
          <TextInput
            id="cr-title"
            value={values.title}
            onChange={set('title')}
            placeholder="Move the testimonial video above the pricing table"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="cr-type">Kind of change</FieldLabel>
            <Select id="cr-type" value={values.type} onChange={set('type')}>
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {REQUEST_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="cr-location">Where — page, campaign, or asset</FieldLabel>
            <TextInput
              id="cr-location"
              value={values.location}
              onChange={set('location')}
              placeholder="Homepage / hero section"
              autoComplete="off"
            />
          </div>
        </div>
        {moreOpen ? (
          <>
            <div>
              <FieldLabel htmlFor="cr-detail">Anything else that helps</FieldLabel>
              <TextArea
                id="cr-detail"
                rows={3}
                value={values.detail}
                onChange={set('detail')}
                placeholder="The video matters more than the pricing for first-time visitors."
              />
            </div>
            <div>
              <FieldLabel htmlFor="cr-link">Link — screenshot, doc, or page</FieldLabel>
              <TextInput
                id="cr-link"
                type="url"
                value={values.link}
                onChange={set('link')}
                placeholder="https://www.loom.com/share/…"
                autoComplete="off"
              />
            </div>
          </>
        ) : null}

        {/* Not hidden behind the disclosure: pasting a screenshot is the thing
            that removes the reason to use WhatsApp instead (C8), and a control
            nobody can find doesn't do that. */}
        {onUploadAttachment ? (
          <AttachmentPicker
            onUpload={onUploadAttachment}
            attachments={attachments}
            onChange={setAttachments}
            disabled={pending}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Logging…' : 'Log this request'}
          </Button>
          <Button type="button" variant="ghost" small onClick={() => setMoreOpen((o) => !o)}>
            {moreOpen ? 'Hide extra detail' : 'Add detail or a link'}
          </Button>
        </div>
      </form>
      <p className="font-sans text-mute mt-3" style={{ fontSize: 13, lineHeight: 1.55 }}>
        One line is enough. The description is the only thing required.
      </p>
    </section>
  );
}
