import { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";
import { Card, Flex, Stack, Text, Button, Spinner } from "@sanity/ui";
import { AddIcon, SparklesIcon } from "@sanity/icons";
import { useToolContext } from "./RenderingTool";
import { UsageBadge } from "./UsageBadge";
import { SessionCard } from "./SessionCard";
import { RENDERING_SESSIONS_BY_CREATOR_QUERY } from "../../queries";
import type { SessionListItem } from "./types";

export function SessionList() {
  const { state, dispatch, usage, sanityUserId } = useToolContext();
  const client = useClient({ apiVersion: "2025-12-15" });

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const fetchSessions = useCallback(async () => {
    if (!sanityUserId) return;
    try {
      setLoading(true);
      const data = await client.fetch(RENDERING_SESSIONS_BY_CREATOR_QUERY, {
        sanityUserId,
      });
      setSessions(data || []);
    } catch (err) {
      console.error("[SessionList] Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [client, sanityUserId]);

  // Fetch on mount and when returning to list view
  useEffect(() => {
    if (state.activeView === "list") {
      fetchSessions();
    }
  }, [state.activeView, fetchSessions]);

  // Unique project names from sessions
  const projectNames = Array.from(
    new Set(
      sessions
        .filter((s) => s.project?.title)
        .map((s) => s.project!.title),
    ),
  ).sort();

  // Client-side filter
  const filteredSessions =
    projectFilter === "all"
      ? sessions
      : projectFilter === "scratchpad"
        ? sessions.filter((s) => !s.project)
        : sessions.filter((s) => s.project?.title === projectFilter);

  if (loading) {
    return (
      <Card padding={4}>
        <Flex align="center" justify="center" style={{ minHeight: 200 }}>
          <Spinner muted />
        </Flex>
      </Card>
    );
  }

  return (
    <Card padding={4}>
      <Flex align="center" justify="space-between">
        <Button
          icon={AddIcon}
          text="New Session"
          tone="primary"
          onClick={() => dispatch({ type: "OPEN_WIZARD" })}
        />
        {usage && <UsageBadge count={usage.count} limit={usage.limit} />}
      </Flex>

      {sessions.length > 0 && (
        <Card marginTop={3}>
          {/* eslint-disable-next-line jsx-a11y/no-onchange */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid var(--card-border-color, #ccc)",
              background: "var(--card-bg-color, #fff)",
              color: "var(--card-fg-color, #333)",
              fontSize: 14,
            }}
          >
            <option value="all">All Projects</option>
            <option value="scratchpad">Scratchpad</option>
            {projectNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Card>
      )}

      {filteredSessions.length === 0 && sessions.length === 0 ? (
        <Card padding={5} tone="transparent" style={{ marginTop: 16 }}>
          <Stack space={3} style={{ alignItems: "center", textAlign: "center" }}>
            <SparklesIcon style={{ fontSize: 48, opacity: 0.3 }} />
            <Text size={2} align="center">
              No rendering sessions yet
            </Text>
            <Text size={1} muted align="center">
              Create your first session to start generating design renderings.
            </Text>
            <Button
              text="Create Session"
              tone="primary"
              onClick={() => dispatch({ type: "OPEN_WIZARD" })}
            />
          </Stack>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card padding={5} tone="transparent" style={{ marginTop: 16 }}>
          <Stack space={3} style={{ alignItems: "center", textAlign: "center" }}>
            <Text size={1} muted align="center">
              No sessions match the current filter.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack space={3} marginTop={4}>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              onClick={() => dispatch({ type: "OPEN_SESSION", sessionId: session._id })}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
}
