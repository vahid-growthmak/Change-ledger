'use server';

import {
  createRequestSchema,
  makeRef,
  periodForInsert,
  projectConfigSchema,
  transcriptCommitSchema,
  triageSchema,
  type TriagePatch,
} from '@growthmak/core';
import { auditTrail, db, projectMembers, projects, requests, users } from '@growthmak/db';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireSession, requireTeam } from './authz';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function assertProjectMember(userId: string, role: 'team' | 'client', projectId: string) {
  if (role === 'team') return;
  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  if (!membership) throw new Error('Not a member of this project.');
}

/** C1–C8: any project member — team or client — can log a request. */
export async function createRequest(projectId: string, rawInput: unknown) {
  const session = await requireSession();
  await assertProjectMember(session.userId, session.role, projectId);

  const input = createRequestSchema.parse(rawInput);
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found.');

  // Ref generated in the same transaction as the insert, against a
  // per-project count, so two simultaneous submissions cannot collide.
  await db.transaction(async (tx) => {
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(requests)
      .where(eq(requests.projectId, projectId));

    await tx.insert(requests).values({
      projectId,
      ref: makeRef(count),
      title: input.title,
      type: input.type as (typeof requests.$inferInsert)['type'],
      location: input.location || null,
      detail: input.detail || null,
      link: input.link || null,
      scope: null, // pending review — never a verdict by default (T6)
      layer: null,
      hours: null,
      status: 'new',
      source: 'direct',
      period: periodForInsert(project.mode),
      requestedBy: session.userId,
    });
  });

  revalidatePath(`/${project.slug}`);
}

/**
 * Reads a meeting transcript and returns candidate requests. Team only, and
 * deliberately writes nothing: the caller reviews and confirms via
 * createRequestsFromTranscript below. Splitting extract from commit is the
 * whole safety property — an LLM's reading of a call should never become a
 * billable line item without a person agreeing to it first.
 */
export async function extractFromTranscript(projectId: string, transcript: unknown) {
  await requireTeam();

  if (typeof transcript !== 'string') throw new Error('Paste the transcript text.');

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found.');

  const { extractRequestsFromTranscript } = await import('./transcript');
  const { extraction, usage } = await extractRequestsFromTranscript(transcript, {
    clientName: project.clientName,
    projectName: project.projectName,
    mode: project.mode,
  });

  return { ...extraction, usage };
}

/**
 * Commits the candidates a team member kept, after any edits they made.
 * Each lands as a normal pending-review request (T6) carrying its
 * provenance and the quote it came from.
 */
export async function createRequestsFromTranscript(projectId: string, rawItems: unknown) {
  const session = await requireTeam();

  const items = transcriptCommitSchema.parse(rawItems);
  if (items.length === 0) return { created: 0 };

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found.');

  // One transaction for the batch: refs are allocated off a single count, so
  // a confirmed set of five lands as five consecutive refs with no collision.
  await db.transaction(async (tx) => {
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(requests)
      .where(eq(requests.projectId, projectId));

    await tx.insert(requests).values(
      items.map((item, index) => ({
        projectId,
        ref: makeRef(count + index),
        title: item.title,
        type: item.type as (typeof requests.$inferInsert)['type'],
        location: item.location || null,
        detail: item.detail || null,
        link: null,
        scope: null, // still pending review — extraction is not triage (T6)
        layer: null,
        hours: null,
        status: 'new' as const,
        source: 'transcript' as const,
        sourceQuote: item.quote || null,
        period: periodForInsert(project.mode),
        // The team member who confirmed it. The client said it on the call,
        // but only this person's judgement put it in the ledger.
        requestedBy: session.userId,
      })),
    );
  });

  revalidatePath(`/${project.slug}`);
  return { created: items.length };
}

/** T1–T5, T7: team only. Every changed field is written to the audit trail. */
export async function triageRequest(requestId: string, rawPatch: unknown) {
  const session = await requireTeam();
  const patch = triageSchema.partial().parse(rawPatch) as TriagePatch;

  const [before] = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
  if (!before) throw new Error('Request not found.');

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const changedFields: Array<[string, unknown, unknown]> = [];

  for (const field of ['scope', 'layer', 'hours', 'status'] as const) {
    if (field in patch) {
      const nextValue = patch[field];
      const prevValue = before[field];
      if (String(prevValue ?? '') !== String(nextValue ?? '')) {
        changedFields.push([field, prevValue, nextValue]);
      }
      updates[field] = field === 'hours' && nextValue !== null ? String(nextValue) : nextValue;
    }
  }

  if (changedFields.length === 0) return;

  await db.transaction(async (tx) => {
    await tx.update(requests).set(updates).where(eq(requests.id, requestId));
    for (const [field, fromValue, toValue] of changedFields) {
      await tx.insert(auditTrail).values({
        requestId,
        actorId: session.userId,
        field,
        fromValue: fromValue === null || fromValue === undefined ? null : String(fromValue),
        toValue: toValue === null || toValue === undefined ? null : String(toValue),
      });
    }
  });

  const [project] = await db.select().from(projects).where(eq(projects.id, before.projectId)).limit(1);
  if (project) revalidatePath(`/${project.slug}`);
}

/** O1–O3: team only. */
export async function updateProject(projectId: string, rawInput: unknown) {
  await requireTeam();
  const input = projectConfigSchema.parse(rawInput);

  await db
    .update(projects)
    .set({
      clientName: input.clientName,
      projectName: input.projectName,
      mode: input.mode,
      contractedHours: String(input.contractedHours),
      rateMinor: input.rateMinor,
      currency: input.currency,
      clientTz: input.clientTz,
    })
    .where(eq(projects.id, projectId));

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (project) revalidatePath(`/${project.slug}`);
}

/** A5: team only. Creates the client user if new, adds them to the project. */
export async function inviteMember(projectId: string, rawEmail: string) {
  await requireTeam();
  const email = rawEmail.toLowerCase().trim();
  if (!email || !email.includes('@')) throw new Error('Enter a valid email address.');

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found.');

  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    [user] = await db.insert(users).values({ email, role: 'client', name: email.split('@')[0] }).returning();
  }

  const [existingMembership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
    .limit(1);
  if (!existingMembership) {
    await db.insert(projectMembers).values({ projectId, userId: user.id });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3457';
      await resend.emails.send({
        from: process.env.AUTH_EMAIL_FROM ?? 'Change Ledger <ledger@growthmak.com>',
        to: email,
        subject: `You've been added to ${project.projectName}`,
        html: `<p>Growthmak added you to the Change Ledger for <strong>${project.projectName}</strong>.</p><p><a href="${appUrl}/login">Sign in</a> with this email address to view it.</p>`,
      });
    } catch (err) {
      // Best-effort — the membership already exists even if the email fails.
      // eslint-disable-next-line no-console
      console.error('inviteMember: failed to send invite email', err);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`\nInvited ${email} to ${project.slug} — no RESEND_API_KEY set, no email sent.\n`);
  }

  revalidatePath(`/${project.slug}/settings`);
}

/** Team only. Soft-deletes the project without touching its request history. */
export async function archiveProject(projectId: string) {
  await requireTeam();
  await db.update(projects).set({ archivedAt: new Date() }).where(eq(projects.id, projectId));
  revalidatePath('/');
}

/**
 * Not one of the PRD's five named actions — the PRD assumes projects are
 * provisioned at kickoff (Phase 4), outside the app. Something has to
 * create the first project to test against, so this exists as the
 * minimal team-only path to do that.
 */
export async function createProject(rawInput: unknown) {
  await requireTeam();
  const input = projectConfigSchema.parse(rawInput);

  const base = slugify(`${input.clientName}-${input.projectName}`) || 'project';
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const [existing] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
    if (!existing) break;
    slug = `${base}-${i}`;
  }

  const [created] = await db
    .insert(projects)
    .values({
      slug,
      clientName: input.clientName,
      projectName: input.projectName,
      mode: input.mode,
      contractedHours: String(input.contractedHours),
      rateMinor: input.rateMinor,
      currency: input.currency,
      clientTz: input.clientTz,
      startedOn: input.startedOn,
    })
    .returning();

  revalidatePath('/');
  return created.slug;
}
