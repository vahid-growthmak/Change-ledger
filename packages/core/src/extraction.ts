/**
 * The shape of a transcript extraction.
 *
 * Deliberately written against `zod/v4` (shipped inside zod 3.25 as a
 * subpath) rather than the v3 API the rest of this package uses: the
 * Anthropic SDK's `zodOutputFormat` helper takes a v4 schema, and one
 * schema that both constrains the model's output and validates what comes
 * back beats two definitions that can drift apart. The version split is
 * confined to this file on purpose — no schema crosses between here and
 * `schemas.ts`.
 */
import { z } from 'zod/v4';
import { REQUEST_TYPES } from './types';

/**
 * One change request Claude found in a meeting transcript.
 *
 * Nothing described here is written to the ledger directly: these are
 * candidates a team member reviews, edits, and confirms. An extraction that
 * became a billable line item with nobody looking at it would be exactly
 * the gotcha this tool exists to prevent.
 *
 * Every field is required and non-nullable — structured outputs are
 * strictest that way, and "no value" is expressed as an empty string so the
 * model never has to choose between a null and a guess.
 */
export const extractedRequestSchema = z.object({
  title: z
    .string()
    .describe('The change, in one plain-language line, phrased as the client would recognise it.'),
  type: z
    .enum(REQUEST_TYPES as [string, ...string[]])
    .describe(
      'bug = something is broken. design = look or layout. content = copy or media. feature = new capability. ads = paid media or creative. other = anything else.',
    ),
  location: z
    .string()
    .describe('The page, campaign, or asset named in the transcript. Empty string if none was named — never guess one.'),
  detail: z
    .string()
    .describe('Context that would help whoever does the work. Empty string if the transcript adds none.'),
  quote: z
    .string()
    .describe('The verbatim excerpt where this was asked for. Must appear in the transcript, copied exactly.'),
  confidence: z
    .enum(['high', 'low'])
    .describe(
      'high = unmistakably a request to change something. low = arguably just discussion or thinking aloud, so the reviewer should look closely.',
    ),
});

export const transcriptExtractionSchema = z.object({
  requests: z
    .array(extractedRequestSchema)
    .describe('Every change request in the transcript. An empty array is a valid, correct answer.'),
  notes: z
    .string()
    .describe(
      'What the reviewer should know: ambiguity, requests that sounded withdrawn later, decisions that were not requests. Empty string if there is nothing worth saying.',
    ),
});

export type ExtractedRequest = z.infer<typeof extractedRequestSchema>;
export type TranscriptExtraction = z.infer<typeof transcriptExtractionSchema>;
