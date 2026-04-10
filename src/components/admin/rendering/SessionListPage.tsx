import { useMemo, useState } from "react";
import { Sparkles, User } from "lucide-react";
import type { RenderingSession } from "../../../lib/rendering/types";
import { UsageBadge } from "./UsageBadge";

/**
 * Session list page for /admin/rendering.
 *
 * Port notes (33-02-PLAN.md + 33-UI-SPEC.md § 1, § 2, § 6, § 7):
 *   - Receives ALL tenant sessions pre-fetched server-side via
 *     RENDERING_SESSIONS_TENANT_QUERY (D-07); client-side filters only.
 *   - Project filter dropdown + "Mine" filter chip narrow the visible rows.
 *   - Ownership stamp per row: 'by You' / 'by {displayName}' / 'by Unknown
 *     designer' (D-09 + copywriting contract).
 *   - Row click navigates to /admin/rendering/{sessionId} (chat view) when the
 *     session has at least one rendering, otherwise to /admin/rendering/{sessionId}/wizard
 *     (D-06 draft resume).
 *   - Thumbnails are served via /api/blob-serve with admin session cookie auth
 *     (T-33-02 accepted control); fallback is parchment square with Sparkles.
 *   - UsageBadge sits in the right cluster of the page header (D-15 placement only).
 *
 * studioToken arrives as a prop from the Astro shell so the secret never lands
 * in the client bundle via module-level evaluation (T-33-01 mitigation). This
 * file intentionally contains zero server-env reads; the Astro shell owns all
 * secret reads and forwards them as string props.
 */

export interface TenantAdmin {
  email: string;
  name: string;
  sanityUserId: string;
}

export interface ProjectOption {
  _id: string;
  title: string;
}

interface SessionListPageProps {
  sessions: RenderingSession[];
  projects: ProjectOption[];
  sanityUserId: string;
  studioToken: string;
  tenantAdmins: TenantAdmin[];
  prefilledProjectId?: string;
}

// --- Pure helpers (exported for unit tests) ---

export function filterSessions(
  sessions: RenderingSession[],
  projectFilter: string,
  isMine: boolean,
  sanityUserId: string,
): RenderingSession[] {
  return sessions
    .filter((s) => !projectFilter || s.project?._id === projectFilter)
    .filter((s) => !isMine || s.createdBy === sanityUserId);
}

export function getOwnerDisplayName(
  createdBy: string,
  sanityUserId: string,
  tenantAdmins: TenantAdmin[],
): string {
  if (createdBy === sanityUserId) return "You";
  const admin = tenantAdmins.find((a) => a.sanityUserId === createdBy);
  return admin?.name ?? "Unknown designer";
}

export type EmptyStateKind = "populated" | "no-sessions" | "no-mine";

export function resolveEmptyState(
  filteredCount: number,
  isMine: boolean,
): EmptyStateKind {
  if (filteredCount > 0) return "populated";
  return isMine ? "no-mine" : "no-sessions";
}

export function formatRelativeTime(isoDate: string, now: number = Date.now()): string {
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

// --- Component ---

export default function SessionListPage({
  sessions,
  projects,
  sanityUserId,
  studioToken,
  tenantAdmins,
  prefilledProjectId = "",
}: SessionListPageProps) {
  const [selectedProject, setSelectedProject] = useState<string>(prefilledProjectId);
  const [isMine, setIsMine] = useState<boolean>(false);

  const filteredSessions = useMemo(
    () => filterSessions(sessions, selectedProject, isMine, sanityUserId),
    [sessions, selectedProject, isMine, sanityUserId],
  );

  const emptyState = resolveEmptyState(filteredSessions.length, isMine);

  const newSessionHref = selectedProject
    ? `/admin/rendering/new?project=${encodeURIComponent(selectedProject)}`
    : prefilledProjectId
      ? `/admin/rendering/new?project=${encodeURIComponent(prefilledProjectId)}`
      : "/admin/rendering/new";

  function handleRowClick(session: RenderingSession) {
    const hasRendering = session.renderings && session.renderings.length > 0;
    const target = hasRendering
      ? `/admin/rendering/${session._id}`
      : `/admin/rendering/${session._id}/wizard`;
    window.location.href = target;
  }

  function toggleMine() {
    setIsMine((prev) => !prev);
  }

  function handleMineKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      toggleMine();
    }
  }

  return (
    <div>
      {/* Page header (UI-SPEC § 1) */}
      <div
        className="flex items-center justify-between py-5 mb-4"
        style={{ borderBottom: "0.5px solid #E8DDD0" }}
      >
        {/* Left cluster: Project filter + Mine chip */}
        <div className="flex items-center gap-3">
          <select
            className="luxury-input"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            aria-label="Project filter"
            style={{ minWidth: "220px" }}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            role="switch" aria-checked={isMine}
            aria-label="Filter to sessions created by you"
            onClick={toggleMine}
            onKeyDown={handleMineKeyDown}
            className={
              isMine
                ? "inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors"
                : "inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-[#F3EDE3]"
            }
            // Mine chip active state palette: bg #F5EDD8 / text #9A7B4B / 0.5px #9A7B4B border (UI-SPEC § 6)
            style={
              isMine
                ? {
                    background: "#F5EDD8",
                    color: "#9A7B4B",
                    border: "0.5px solid #9A7B4B",
                  }
                : {
                    background: "transparent",
                    color: "#6B5E52",
                    border: "0.5px solid #D4C8B8",
                  }
            }
          >
            <User className="w-[14px] h-[14px] mr-1" />
            Mine
          </button>
        </div>

        {/* Right cluster: UsageBadge + New session */}
        <div className="flex items-center gap-3">
          <UsageBadge sanityUserId={sanityUserId} studioToken={studioToken} />
          <a
            href={newSessionHref}
            className="bg-[#9A7B4B] text-white px-4 py-2 rounded-lg text-sm font-semibold font-body hover:bg-[#8A6D40] transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            New session
          </a>
        </div>
      </div>

      {/* Session list container */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#FFFEFB", border: "0.5px solid #E8DDD0" }}
      >
        {emptyState === "no-sessions" && (
          <div className="py-12 text-center px-6">
            <div
              className="mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{
                width: "56px",
                height: "56px",
                background: "#F3EDE3",
                border: "0.5px solid #E8DDD0",
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color: "#9E8E80" }} />
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#2C2520",
                fontFamily: "var(--font-body)",
              }}
            >
              No rendering sessions yet
            </div>
            <div
              className="mt-1 mb-5"
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "#6B5E52",
                fontFamily: "var(--font-body)",
              }}
            >
              Start your first AI rendering to explore design directions.
            </div>
            <a
              href={newSessionHref}
              className="inline-flex items-center gap-1.5 bg-[#9A7B4B] text-white px-4 py-2 rounded-lg text-sm font-semibold font-body hover:bg-[#8A6D40] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              New session
            </a>
          </div>
        )}

        {emptyState === "no-mine" && (
          <div className="py-12 text-center px-6">
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#2C2520",
                fontFamily: "var(--font-body)",
              }}
            >
              No sessions by you
            </div>
            <div
              className="mt-1 mb-5"
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "#6B5E52",
                fontFamily: "var(--font-body)",
              }}
            >
              You haven't created any rendering sessions yet.
            </div>
            <button
              type="button"
              onClick={() => setIsMine(false)}
              className="text-sm font-semibold hover:underline"
              style={{ color: "#9A7B4B", fontFamily: "var(--font-body)" }}
            >
              Show all sessions
            </button>
          </div>
        )}

        {emptyState === "populated" && (
          <div>
            {filteredSessions.map((session, idx) => {
              const ownerName = getOwnerDisplayName(
                session.createdBy,
                sanityUserId,
                tenantAdmins,
              );
              const isLast = idx === filteredSessions.length - 1;
              const thumbnail = session.renderings?.[0]?.blobPathname;
              const renderingCount = session.renderings?.length ?? 0;
              const projectTitle = session.project?.title ?? "No project";

              return (
                <button
                  key={session._id}
                  type="button"
                  onClick={() => handleRowClick(session)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F3EDE3]"
                  style={{
                    background: "#FFFEFB",
                    borderBottom: isLast ? "none" : "0.5px solid #E8DDD0",
                  }}
                >
                  {/* Thumbnail */}
                  {thumbnail ? (
                    <img
                      src={`/api/blob-serve?path=${encodeURIComponent(thumbnail)}`}
                      alt={session.sessionTitle}
                      className="w-12 h-12 rounded-md object-cover"
                      style={{ border: "0.5px solid #E8DDD0", flexShrink: 0 }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-md flex items-center justify-center"
                      style={{
                        background: "#F3EDE3",
                        border: "0.5px solid #E8DDD0",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles
                        className="w-[18px] h-[18px]"
                        style={{ color: "#9E8E80" }}
                      />
                    </div>
                  )}

                  {/* Content column */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#2C2520",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {session.sessionTitle || "Untitled session"}
                    </div>
                    <div
                      className="truncate"
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 400,
                        color: "#6B5E52",
                        fontFamily: "var(--font-body)",
                        marginTop: "2px",
                      }}
                    >
                      {projectTitle}
                      <span> -- </span>
                      <span style={{ color: "#9E8E80", fontStyle: "italic" }}>
                        by {ownerName}
                      </span>
                    </div>
                  </div>

                  {/* Right meta cluster */}
                  <div
                    className="flex flex-col items-end gap-1 text-right"
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 400,
                      color: "#9E8E80",
                      fontFamily: "var(--font-body)",
                      flexShrink: 0,
                    }}
                  >
                    <span>
                      {renderingCount} rendering{renderingCount === 1 ? "" : "s"}
                    </span>
                    <span>{formatRelativeTime(session.createdAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
