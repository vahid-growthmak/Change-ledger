/**
 * Postgres schema for the Client Ledger (Phase 2, apps/ledger).
 * Four tables. Money is integer minor units — never float.
 * Not used by the public tool, which persists to the browser only.
 */
import {
  bigserial,
  char,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const projectMode = pgEnum('project_mode', ['foundation', 'retainer']);
export const requestType = pgEnum('request_type', ['bug', 'design', 'content', 'feature', 'ads', 'other']);
export const growthLayer = pgEnum('growth_layer', ['foundation', 'traffic', 'conversion', 'operations', 'social_proof']);
export const scopeVerdict = pgEnum('scope_verdict', ['in_scope', 'beyond_scope', 'needs_quote']);
export const requestStatus = pgEnum('request_status', ['new', 'reviewed', 'in_progress', 'done', 'wont_do']);
export const userRole = pgEnum('user_role', ['team', 'client']);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  clientName: text('client_name').notNull(),
  projectName: text('project_name').notNull(),
  mode: projectMode('mode').notNull(),
  contractedHours: numeric('contracted_hours', { precision: 6, scale: 1 }).notNull(),
  rateMinor: integer('rate_minor').notNull(),
  currency: char('currency', { length: 3 }).notNull(),
  clientTz: text('client_tz').notNull(),
  startedOn: date('started_on').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  role: userRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const requests = pgTable(
  'requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    ref: text('ref').notNull(),
    title: text('title').notNull(),
    type: requestType('type').notNull(),
    location: text('location'),
    detail: text('detail'),
    link: text('link'),
    attachments: jsonb('attachments').default([]),
    layer: growthLayer('layer'), // null = untagged
    scope: scopeVerdict('scope'), // null = pending review (T6)
    hours: numeric('hours', { precision: 5, scale: 1 }),
    status: requestStatus('status').notNull().default('new'),
    period: date('period'), // retainer cycle, first of month
    requestedBy: uuid('requested_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (t) => [
    unique().on(t.projectId, t.ref),
    index('requests_project_scope_idx').on(t.projectId, t.scope),
    index('requests_project_status_idx').on(t.projectId, t.status),
    index('requests_project_period_idx').on(t.projectId, t.period),
  ],
);

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);

/** Append only — every triage change, retrievable months later (T7). */
export const auditTrail = pgTable('audit_trail', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  requestId: uuid('request_id')
    .notNull()
    .references(() => requests.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  field: text('field').notNull(),
  fromValue: text('from_value'),
  toValue: text('to_value'),
  at: timestamp('at', { withTimezone: true }).defaultNow(),
});
