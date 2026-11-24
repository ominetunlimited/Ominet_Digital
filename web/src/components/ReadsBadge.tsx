import { formatReads } from "@/lib/reads";

/** Eye icon plus read count, for bylines and cards. */
export default function ReadsBadge({ reads }: { reads?: number | null }) {
  if (reads === undefined || reads === null) return null;
  return (
    <span className="reads-badge" title={`${reads.toLocaleString("en-GB")} ${reads === 1 ? "read" : "reads"}`} aria-label={`${reads.toLocaleString("en-GB")} ${reads === 1 ? "read" : "reads"}`}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {formatReads(reads)}
    </span>
  );
}
