import { z } from 'zod';
import {
  GROWTH_LAYERS,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  SCOPE_VERDICTS,
} from './types';

/**
 * Capture (C1–C4). The description is the single required field —
 * every other capture field is optional by requirement, not oversight.
 */
export const createRequestSchema = z.object({
  title: z.string().trim().min(1, 'Describe the change first — that is the one thing we need.').max(300),
  type: z.enum(REQUEST_TYPES as [string, ...string[]]).default('other'),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  detail: z.string().trim().max(4000).optional().or(z.literal('')),
  link: z
    .string()
    .trim()
    .url('That link does not look complete. Paste the full URL, starting with https://')
    .optional()
    .or(z.literal('')),
});

/** Triage (T1–T4). Half-hour increments enforced here, both sides. */
export const triageSchema = z.object({
  scope: z.enum(SCOPE_VERDICTS as [string, ...string[]]).nullable(),
  layer: z.enum(GROWTH_LAYERS as [string, ...string[]]).nullable(),
  hours: z
    .number()
    .min(0)
    .max(999)
    .multipleOf(0.5, 'Hours are estimated in half-hour steps.')
    .nullable(),
  status: z.enum(REQUEST_STATUSES as [string, ...string[]]),
});

export const projectConfigSchema = z.object({
  clientName: z.string().trim().min(1, 'Name the client.'),
  projectName: z.string().trim().min(1, 'Name the project.'),
  mode: z.enum(['foundation', 'retainer']),
  contractedHours: z.number().positive('Contracted hours must be above zero.'),
  rateMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  clientTz: z.string().min(1),
  startedOn: z.string(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type TriageInput = z.infer<typeof triageSchema>;
