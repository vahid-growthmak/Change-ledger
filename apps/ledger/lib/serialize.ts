import type { ChangeRequest, ProjectConfig } from '@growthmak/core';
import type { projects, requests } from '@growthmak/db';
import type { InferSelectModel } from 'drizzle-orm';
import { parseAttachments } from './storage';

type RequestRow = InferSelectModel<typeof requests>;
type ProjectRow = InferSelectModel<typeof projects>;

/** Drizzle returns `numeric` as strings and `timestamp` as Date — core wants numbers and ISO strings. */
export function toChangeRequest(row: RequestRow): ChangeRequest {
  return {
    id: row.id,
    ref: row.ref,
    title: row.title,
    type: row.type,
    location: row.location,
    detail: row.detail,
    link: row.link,
    layer: row.layer,
    scope: row.scope,
    hours: row.hours === null ? null : Number(row.hours),
    status: row.status,
    source: row.source,
    sourceQuote: row.sourceQuote,
    attachments: parseAttachments(row.attachments),
    period: row.period,
    createdAt: (row.createdAt ?? new Date()).toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

export function toProjectConfig(row: ProjectRow): ProjectConfig {
  return {
    clientName: row.clientName,
    projectName: row.projectName,
    mode: row.mode,
    contractedHours: Number(row.contractedHours),
    rateMinor: row.rateMinor,
    currency: row.currency,
    clientTz: row.clientTz,
    startedOn: row.startedOn,
  };
}
