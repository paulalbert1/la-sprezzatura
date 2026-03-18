import { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";
import { Card, Flex, Stack, Grid, Text, Button, TextInput, Select, Spinner } from "@sanity/ui";
import { ImageIcon, HeartIcon, EllipsisHorizontalIcon } from "@sanity/icons";
import { getImageServeUrl, getStudioHeaders } from "./types";
import type { ProjectOption } from "./types";
import { useToolContext } from "./RenderingTool";

interface DesignOptionItem {
  _id: string;
  blobPathname: string;
  caption: string;
  sortOrder: number;
  promotedAt: string;
  project?: { _id: string; title: string } | null;
  sourceSession?: { _id: string } | null;
  sourceRenderingIndex?: number;
  reactions: Array<{
    _key: string;
    clientId: string;
    type: "favorite" | "comment";
    text?: string;
    createdAt: string;
  }>;
}

const DESIGN_OPTIONS_ALL_QUERY = `
  *[_type == "designOption"] | order(promotedAt desc) {
    _id,
    blobPathname,
    caption,
    sortOrder,
    promotedAt,
    project-> { _id, title },
    sourceSession-> { _id },
    sourceRenderingIndex,
    reactions[] { _key, clientId, type, text, createdAt }
  }
`;

export function DesignOptionsTab() {
  const { sanityUserId } = useToolContext();
  const client = useClient({ apiVersion: "2024-01-01" });

  const [options, setOptions] = useState<DesignOptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editingCaptionValue, setEditingCaptionValue] = useState("");
  const [unpromoting, setUnpromoting] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      const data = await client.fetch<DesignOptionItem[]>(
        DESIGN_OPTIONS_ALL_QUERY,
      );
      setOptions(data || []);
    } catch (err) {
      console.error("[DesignOptionsTab] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Derive unique projects for filter dropdown
  const projectsMap = new Map<string, string>();
  for (const opt of options) {
    if (opt.project?._id && opt.project?.title) {
      projectsMap.set(opt.project._id, opt.project.title);
    }
  }
  const projectFilters: ProjectOption[] = Array.from(projectsMap.entries()).map(
    ([_id, title]) => ({ _id, title }),
  );

  // Apply filter
  const filteredOptions = filterProjectId
    ? options.filter((o) => o.project?._id === filterProjectId)
    : options;

  // Caption editing
  function startEditCaption(optionId: string, currentCaption: string) {
    setEditingCaptionId(optionId);
    setEditingCaptionValue(currentCaption || "");
  }

  async function saveCaption(optionId: string) {
    try {
      await client.patch(optionId).set({ caption: editingCaptionValue }).commit();
      setOptions((prev) =>
        prev.map((o) =>
          o._id === optionId ? { ...o, caption: editingCaptionValue } : o,
        ),
      );
    } catch (err) {
      console.error("[DesignOptionsTab] Caption save error:", err);
    }
    setEditingCaptionId(null);
  }

  // Unpromote
  async function handleUnpromote(option: DesignOptionItem) {
    if (!option.sourceSession?._id || option.sourceRenderingIndex === undefined) return;
    setUnpromoting(option._id);

    try {
      const res = await fetch("/api/rendering/promote", {
        method: "POST",
        headers: getStudioHeaders(),
        body: JSON.stringify({
          sessionId: option.sourceSession._id,
          renderingIndex: option.sourceRenderingIndex,
          unpromote: true,
          sanityUserId,
        }),
      });
      if (res.ok) {
        await fetchOptions();
      }
    } catch {
      // Silently fail
    } finally {
      setUnpromoting(null);
    }
  }

  if (loading) {
    return (
      <Card
        padding={5}
        display="flex"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Spinner muted />
      </Card>
    );
  }

  return (
    <Card padding={4}>
      {/* Header */}
      <Flex align="center" justify="space-between">
        <Text size={3} weight="semibold">
          Design Options
        </Text>
        {projectFilters.length > 0 && (
          <Select
            value={filterProjectId}
            onChange={(e) =>
              setFilterProjectId((e.target as HTMLSelectElement).value)
            }
            style={{ maxWidth: 240 }}
          >
            <option value="">All Projects</option>
            {projectFilters.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </Select>
        )}
      </Flex>

      {/* Grid or Empty state */}
      {filteredOptions.length === 0 ? (
        <Card padding={5} tone="transparent" style={{ marginTop: 16 }}>
          <Stack
            space={3}
            style={{ alignItems: "center", textAlign: "center" }}
          >
            <ImageIcon style={{ fontSize: 48, opacity: 0.3 }} />
            <Text size={2} align="center">
              No design options yet
            </Text>
            <Text size={1} muted align="center">
              Promote renderings from your sessions to make them visible to
              clients.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Grid columns={[1, 2, 3]} gap={3} style={{ marginTop: 16 }}>
          {filteredOptions.map((option) => {
            const favoriteCount = (option.reactions || []).filter(
              (r) => r.type === "favorite",
            ).length;
            const commentCount = (option.reactions || []).filter(
              (r) => r.type === "comment",
            ).length;
            const isEditingCaption = editingCaptionId === option._id;
            const isUnpromoting = unpromoting === option._id;

            return (
              <Card
                key={option._id}
                padding={3}
                radius={2}
                border
                shadow={1}
              >
                <img
                  src={getImageServeUrl(option.blobPathname, "studio")}
                  alt={option.caption || "Design option"}
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
                <Stack space={2} style={{ marginTop: 8 }}>
                  {/* Caption -- click to edit */}
                  {isEditingCaption ? (
                    <TextInput
                      value={editingCaptionValue}
                      onChange={(e) =>
                        setEditingCaptionValue(
                          (e.target as HTMLInputElement).value,
                        )
                      }
                      onBlur={() => saveCaption(option._id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveCaption(option._id);
                        if (e.key === "Escape") setEditingCaptionId(null);
                      }}
                      fontSize={1}
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() =>
                        startEditCaption(option._id, option.caption)
                      }
                      style={{ cursor: "pointer" }}
                      title="Click to edit caption"
                    >
                      {option.caption ? (
                        <Text size={1}>{option.caption}</Text>
                      ) : (
                        <Text size={1} muted style={{ fontStyle: "italic" }}>
                          No caption
                        </Text>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <Flex gap={3}>
                    <Flex align="center" gap={1}>
                      <HeartIcon style={{ fontSize: 14 }} />
                      <Text size={0}>{favoriteCount}</Text>
                    </Flex>
                    <Flex align="center" gap={1}>
                      <EllipsisHorizontalIcon style={{ fontSize: 14 }} />
                      <Text size={0}>{commentCount}</Text>
                    </Flex>
                  </Flex>

                  {/* Project name */}
                  {option.project?.title && (
                    <Text size={0} muted>
                      {option.project.title}
                    </Text>
                  )}

                  {/* Unpromote button */}
                  <Button
                    text="Unpromote"
                    mode="ghost"
                    tone="critical"
                    fontSize={0}
                    onClick={() => handleUnpromote(option)}
                    disabled={isUnpromoting}
                  />
                  {isUnpromoting && <Spinner muted />}
                </Stack>
              </Card>
            );
          })}
        </Grid>
      )}
    </Card>
  );
}
