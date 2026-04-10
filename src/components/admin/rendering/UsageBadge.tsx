import { useEffect, useState } from "react";
import type { UsageData } from "../../../lib/rendering/types";

/**
 * Per-designer usage pill for /admin/rendering header and /admin/rendering/[sessionId] chat header.
 *
 * Port notes (33-02-PLAN.md, D-15 / D-16 / D-17):
 *   - Fetches GET /api/rendering/usage?sanityUserId={id} with x-studio-token header
 *     on mount. Studio token arrives as a prop from the Astro shell so the secret
 *     never lands in the client bundle via module evaluation (T-33-01 mitigation).
 *   - Three-tier luxury-theme styling from 33-UI-SPEC.md § Color "Usage badge thresholds":
 *       healthy (0-79%)   -> parchment background, gold text
 *       approaching (80-94%) -> amber-tinted parchment, deep amber text
 *       at-limit (95%+)   -> warm destructive background, destructive text
 *   - Copy: "Your usage {count} / {limit}" (D-16 exact), uppercased via CSS textTransform.
 *   - Non-interactive: no hover, no click, cursor-default.
 *   - Loading state: muted placeholder pill with same dimensions ("Your usage -- / --").
 *   - Error state: renders nothing (silent fail; does not crash the page).
 */

export interface BadgeStyle {
  bg: string;
  text: string;
  border: string;
}

/**
 * Resolve threshold styling for a given (count, limit) pair.
 * Exported for unit testing the threshold boundaries.
 */
export function getBadgeStyle(count: number, limit: number): BadgeStyle {
  const pct = limit > 0 ? (count / limit) * 100 : 0;
  if (pct >= 95) {
    // At / over limit: warm destructive
    return { bg: "#FBEEE8", text: "#9B3A2A", border: "#E8CFA0" };
  }
  if (pct >= 80) {
    // Approaching limit: amber-tinted parchment
    return { bg: "#FBF2E2", text: "#8A5E1A", border: "#E8CFA0" };
  }
  // Healthy: gold-light
  return { bg: "#F5EDD8", text: "#9A7B4B", border: "#E8D5A8" };
}

interface UsageBadgeProps {
  sanityUserId: string;
  studioToken: string;
}

export function UsageBadge({ sanityUserId, studioToken }: UsageBadgeProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsage() {
      if (!sanityUserId || !studioToken) {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
        return;
      }
      try {
        const url = `/api/rendering/usage?sanityUserId=${encodeURIComponent(sanityUserId)}`;
        const response = await fetch(url, {
          headers: { "x-studio-token": studioToken },
        });
        if (!response.ok) {
          if (!cancelled) {
            setLoading(false);
            setError(true);
          }
          return;
        }
        const data = (await response.json()) as UsageData;
        if (!cancelled) {
          setUsage(data);
          setLoading(false);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      }
    }

    fetchUsage();
    return () => {
      cancelled = true;
    };
  }, [sanityUserId, studioToken]);

  // Error state: silent fail
  if (error) return null;

  // Loading state: muted placeholder pill with same dimensions
  if (loading || !usage) {
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 cursor-default"
        style={{
          height: "28px",
          background: "#F3EDE3",
          color: "#9E8E80",
          border: "0.5px solid #E8DDD0",
          fontSize: "11.5px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontFamily: "var(--font-body)",
          whiteSpace: "nowrap",
        }}
        aria-label="Your usage loading"
      >
        Your usage -- / --
      </span>
    );
  }

  const style = getBadgeStyle(usage.count, usage.limit);

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 cursor-default"
      style={{
        height: "28px",
        background: style.bg,
        color: style.text,
        border: `0.5px solid ${style.border}`,
        fontSize: "11.5px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        fontFamily: "var(--font-body)",
        whiteSpace: "nowrap",
      }}
      aria-label={`Your usage ${usage.count} of ${usage.limit}`}
    >
      Your usage {usage.count} / {usage.limit}
    </span>
  );
}

export default UsageBadge;
