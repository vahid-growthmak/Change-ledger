export type ProjectMode = 'foundation' | 'retainer';
export type RequestType = 'bug' | 'design' | 'content' | 'feature' | 'ads' | 'other';
export type GrowthLayer = 'foundation' | 'traffic' | 'conversion' | 'operations' | 'social_proof';
export type ScopeVerdict = 'in_scope' | 'beyond_scope' | 'needs_quote';
export type RequestStatus = 'new' | 'reviewed' | 'in_progress' | 'done' | 'wont_do';

export interface ProjectConfig {
  clientName: string;
  projectName: string;
  mode: ProjectMode;
  /** Contracted hours (foundation) or monthly capacity (retainer). */
  contractedHours: number;
  /** Hourly rate in integer minor units — 4500 = $45.00. Never a float. */
  rateMinor: number;
  currency: string;
  /** IANA timezone of the client's market, e.g. America/Chicago. */
  clientTz: string;
  startedOn: string;
}

export interface ChangeRequest {
  id: string;
  /** Per-project sequential human-readable ID: GM-001. */
  ref: string;
  title: string;
  type: RequestType;
  location: string | null;
  detail: string | null;
  link: string | null;
  /** null = untagged. */
  layer: GrowthLayer | null;
  /** null = pending review — never defaults to a verdict (T6). */
  scope: ScopeVerdict | null;
  /** Effort estimate in hours, half-hour increments. null = not yet estimated. */
  hours: number | null;
  status: RequestStatus;
  /** Retainer cycle as YYYY-MM-01; null on fixed-scope projects. */
  period: string | null;
  /** UTC ISO timestamp. */
  createdAt: string;
  updatedAt: string | null;
}

/** The four inline-editable triage fields (T1–T4), partial for a single-field update. */
export interface TriagePatch {
  scope?: ChangeRequest['scope'];
  layer?: ChangeRequest['layer'];
  hours?: ChangeRequest['hours'];
  status?: ChangeRequest['status'];
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  bug: 'Bug',
  design: 'Design change',
  content: 'Content',
  feature: 'New feature',
  ads: 'Ads & creative',
  other: 'Other',
};

export const GROWTH_LAYER_LABELS: Record<GrowthLayer, string> = {
  foundation: 'Foundation',
  traffic: 'Traffic',
  conversion: 'Conversion',
  operations: 'Operations',
  social_proof: 'Social proof',
};

export const SCOPE_LABELS: Record<ScopeVerdict, string> = {
  in_scope: 'In scope',
  beyond_scope: 'Beyond scope',
  needs_quote: 'Needs quote',
};

/** The label an unset verdict renders as — never "In scope" by default (T6). */
export const PENDING_LABEL = 'Pending review';

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  in_progress: 'In progress',
  done: 'Done',
  wont_do: "Won't do",
};

export const REQUEST_TYPES = Object.keys(REQUEST_TYPE_LABELS) as RequestType[];
export const GROWTH_LAYERS = Object.keys(GROWTH_LAYER_LABELS) as GrowthLayer[];
export const SCOPE_VERDICTS = Object.keys(SCOPE_LABELS) as ScopeVerdict[];
export const REQUEST_STATUSES = Object.keys(STATUS_LABELS) as RequestStatus[];

export interface Market {
  code: string;
  label: string;
  tz: string;
  currency: string;
}

/** The nine markets Growthmak serves (O3). */
export const MARKETS: Market[] = [
  { code: 'US', label: 'United States', tz: 'America/Chicago', currency: 'USD' },
  { code: 'CA', label: 'Canada', tz: 'America/Toronto', currency: 'CAD' },
  { code: 'GB', label: 'United Kingdom', tz: 'Europe/London', currency: 'GBP' },
  { code: 'AU', label: 'Australia', tz: 'Australia/Sydney', currency: 'AUD' },
  { code: 'NZ', label: 'New Zealand', tz: 'Pacific/Auckland', currency: 'NZD' },
  { code: 'AE', label: 'UAE', tz: 'Asia/Dubai', currency: 'AED' },
  { code: 'SA', label: 'Saudi Arabia', tz: 'Asia/Riyadh', currency: 'SAR' },
  { code: 'QA', label: 'Qatar', tz: 'Asia/Qatar', currency: 'QAR' },
  { code: 'KW', label: 'Kuwait', tz: 'Asia/Kuwait', currency: 'KWD' },
  { code: 'IN', label: 'India', tz: 'Asia/Kolkata', currency: 'INR' },
];

export const INDIA_TZ = 'Asia/Kolkata';
