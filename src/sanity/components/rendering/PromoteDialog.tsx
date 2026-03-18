import { useState, useEffect } from "react";
import { useClient } from "sanity";
import { Dialog, Stack, Flex, Text, Button, TextInput, Spinner, Label, Select } from "@sanity/ui";
import { getImageServeUrl, getStudioHeaders } from "./types";
import type { RenderingOutput, ProjectOption } from "./types";
import { useToolContext } from "./RenderingTool";

interface PromoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rendering: RenderingOutput;
  renderingIndex: number;
  sessionId: string;
  projectId: string | null; // null for scratchpad sessions
  onPromoted: () => void; // callback to refresh session after promote
}

export function PromoteDialog({
  isOpen,
  onClose,
  rendering,
  renderingIndex,
  sessionId,
  projectId,
  onPromoted,
}: PromoteDialogProps) {
  const { sanityUserId } = useToolContext();
  const client = useClient({ apiVersion: "2024-01-01" });

  const [caption, setCaption] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const isScratchpad = !projectId;

  // Fetch projects for scratchpad sessions
  useEffect(() => {
    if (!isOpen || !isScratchpad) return;
    setLoadingProjects(true);
    client
      .fetch<ProjectOption[]>(
        `*[_type == "project"] | order(title asc) { _id, title }`,
      )
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [isOpen, isScratchpad, client]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCaption("");
      setError("");
      setSelectedProjectId("");
    }
  }, [isOpen]);

  async function handlePromote() {
    setPromoting(true);
    setError("");

    try {
      const effectiveProjectId = isScratchpad
        ? selectedProjectId
        : projectId;

      const res = await fetch("/api/rendering/promote", {
        method: "POST",
        headers: getStudioHeaders(),
        body: JSON.stringify({
          sessionId,
          renderingIndex,
          projectId: effectiveProjectId,
          caption,
          sanityUserId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setError(data.error || "Failed to promote rendering.");
        setPromoting(false);
        return;
      }

      onPromoted();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPromoting(false);
    }
  }

  if (!isOpen) return null;

  const canPromote = isScratchpad
    ? selectedProjectId !== "" && !promoting
    : !promoting;

  return (
    <Dialog
      header="Promote to Design Options"
      id="promote-dialog"
      onClose={onClose}
      width={1}
    >
      <Stack space={4} padding={4}>
        {/* Preview thumbnail */}
        {rendering.blobPathname && (
          <img
            src={getImageServeUrl(rendering.blobPathname, "studio")}
            alt="Rendering preview"
            style={{
              maxHeight: 200,
              borderRadius: 4,
              objectFit: "contain",
              width: "100%",
            }}
          />
        )}

        {/* Project picker -- required for scratchpad */}
        {isScratchpad && (
          <Stack space={2}>
            <Label size={1}>Link to Project</Label>
            {loadingProjects ? (
              <Spinner muted />
            ) : (
              <Select
                value={selectedProjectId}
                onChange={(e) =>
                  setSelectedProjectId(
                    (e.target as HTMLSelectElement).value,
                  )
                }
              >
                <option value="" disabled>
                  Select a project...
                </option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            )}
            <Text size={0} muted>
              Scratchpad renderings must be linked to a project to become
              Design Options.
            </Text>
          </Stack>
        )}

        {/* Caption field */}
        <Stack space={2}>
          <Label size={1}>Caption (optional)</Label>
          <TextInput
            placeholder="e.g., Contemporary living room with walnut accents"
            value={caption}
            onChange={(e) =>
              setCaption((e.target as HTMLInputElement).value)
            }
          />
        </Stack>

        {/* Error message */}
        {error && (
          <Text size={1} style={{ color: "var(--card-badge-critical-dot-color, #f03e2f)" }}>
            {error}
          </Text>
        )}

        {/* Action buttons */}
        <Flex gap={2}>
          <Button
            text={promoting ? "Promoting..." : "Promote"}
            tone="primary"
            onClick={handlePromote}
            disabled={!canPromote}
            icon={promoting ? Spinner : undefined}
          />
          <Button text="Keep Rendering" mode="ghost" onClick={onClose} />
        </Flex>
      </Stack>
    </Dialog>
  );
}
