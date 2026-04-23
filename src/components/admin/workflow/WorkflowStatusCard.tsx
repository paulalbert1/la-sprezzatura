// Phase 44 Plan 11 — WorkflowStatusCard
// Source of truth: .planning/phases/44-workflow-engine/44-UI-SPEC.md Surface 6
// Requirements: WF-08
//
// Dashboard card showing three at-a-glance workflow health signals:
//   - Awaiting client    (amber)
//   - Approaching dormancy  (amber)
//   - Blocked milestones    (muted warm)
//
// When hasAnyWorkflows=false: collapses to helper text + Settings link.
// When hasAnyWorkflows=true but all counts=0: rows render muted "0" spans (card stays visible).
// Counts > 0: entire row is an <a> link to the filtered projects list.

interface Props {
  awaitingClientCount: number;
  approachingDormancyCount: number;
  blockedMilestonesCount: number;
  hasAnyWorkflows: boolean;
}

const rows = (
  awaitingClientCount: number,
  approachingDormancyCount: number,
  blockedMilestonesCount: number,
) => [
  {
    label: "Awaiting client",
    count: awaitingClientCount,
    href: "/admin/projects?workflowStatus=awaiting_client",
    color: "#854F0B",
  },
  {
    label: "Approaching dormancy",
    count: approachingDormancyCount,
    href: "/admin/projects?workflowStatus=approaching_dormancy",
    color: "#854F0B",
  },
  {
    label: "Blocked milestones",
    count: blockedMilestonesCount,
    href: "/admin/projects?workflowStatus=blocked",
    color: "#6B5E52",
  },
];

export default function WorkflowStatusCard({
  awaitingClientCount,
  approachingDormancyCount,
  blockedMilestonesCount,
  hasAnyWorkflows,
}: Props) {
  return (
    <div
      style={{
        background: "#FFFEFB",
        border: "0.5px solid #E8DDD0",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Eyebrow header */}
      <div className="px-5 pt-[18px] pb-0">
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10.5px",
            fontWeight: 500,
            color: "#9E8E80",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          WORKFLOW STATUS
        </h2>
        <hr
          style={{
            border: "none",
            borderTop: "0.5px solid #E8DDD0",
            margin: 0,
          }}
        />
      </div>

      {!hasAnyWorkflows ? (
        /* Zero-state: no workflows exist at all */
        <div className="px-5 py-5">
          <p
            style={{
              fontSize: "13px",
              color: "#9E8E80",
              marginBottom: "10px",
            }}
          >
            No projects have workflows yet.
          </p>
          <a
            href="/admin/settings#workflow-templates"
            style={{
              fontSize: "13px",
              color: "#854F0B",
              textDecoration: "underline",
            }}
          >
            Create a template in Settings
          </a>
        </div>
      ) : (
        /* Count rows */
        <div>
          {rows(
            awaitingClientCount,
            approachingDormancyCount,
            blockedMilestonesCount,
          ).map(({ label, count, href, color }) => {
            const inner = (
              <>
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 400,
                    color: count > 0 ? color : "#9E8E80",
                    flex: 1,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: count > 0 ? color : "#C8BFB8",
                    minWidth: "20px",
                    textAlign: "right",
                  }}
                >
                  {count}
                </span>
              </>
            );

            const sharedStyle: React.CSSProperties = {
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              borderBottom: "0.5px solid #F2EDE8",
              textDecoration: "none",
            };

            return count > 0 ? (
              <a
                key={label}
                href={href}
                aria-label={`${label} ${count}`}
                style={{
                  ...sharedStyle,
                  cursor: "pointer",
                }}
                className="hover:bg-cream/30 transition-colors"
              >
                {inner}
              </a>
            ) : (
              <span key={label} style={sharedStyle}>
                {inner}
              </span>
            );
          })}

          {/* Footer link */}
          <div
            style={{
              padding: "10px 20px",
              borderTop: "0.5px solid #E8DDD0",
            }}
          >
            <a
              href="/admin/projects"
              style={{
                fontSize: "12px",
                color: "#854F0B",
                textDecoration: "none",
              }}
              className="hover:opacity-70 transition-opacity"
            >
              View all workflows →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
