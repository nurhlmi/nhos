export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"] as const;
export type Severity = (typeof SEVERITIES)[number];
/** UNSCORED: NVD has not published a CVSS score yet (e.g. "Awaiting Analysis"). */
export type SeverityOrUnscored = Severity | "UNSCORED";

export type CveSummary = {
  id: string;
  description: string;
  published: string;
  lastModified: string;
  status: string;
  cvssVersion: string | null;
  cvssScore: number | null;
  severity: SeverityOrUnscored;
  /** True if the CVE is in CISA's Known Exploited Vulnerabilities catalog. */
  kev: boolean;
  kevDueDate: string | null;
};

export type AffectedProduct = { vendor: string; product: string; source: "cna" | "cpe" };

export type CveReference = { url: string; source: string; tags: string[] };

export type CveDetail = CveSummary & {
  vectorString: string | null;
  attackVector: string | null;
  attackComplexity: string | null;
  privilegesRequired: string | null;
  userInteraction: string | null;
  exploitabilityScore: number | null;
  impactScore: number | null;
  metricSource: string | null;
  weaknesses: string[];
  affected: AffectedProduct[];
  references: CveReference[];
  kevInfo: {
    dateAdded: string | null;
    dueDate: string | null;
    requiredAction: string | null;
    vulnerabilityName: string | null;
  } | null;
};

export type KevEntry = {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
  cwes?: string[];
};

export type CveSearchParams = {
  page: number;
  pageSize: number;
  q?: string;
  vendor?: string;
  product?: string;
  severity?: Severity;
  from?: string;
  to?: string;
  minScore?: number;
};

export type CveOverview = {
  windowDays: number;
  total: number;
  critical: number;
  high: number;
  latest: CveSummary[];
  kevAddedLast30Days: number;
};
