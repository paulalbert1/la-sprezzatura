import { useState, useEffect } from "react";
import { useClient } from "sanity";
import { Stack, Text, Button, Flex } from "@sanity/ui";
import type { WizardData, ProjectOption } from "../types";

interface StepSetupProps {
  wizardData: WizardData;
  onChange: (data: Partial<WizardData>) => void;
}

export function StepSetup({ wizardData, onChange }: StepSetupProps) {
  const client = useClient({ apiVersion: "2025-12-15" });
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    client
      .fetch<ProjectOption[]>(`*[_type == "project"] | order(title asc) { _id, title }`)
      .then(setProjects)
      .catch((err) => console.error("[StepSetup] Failed to fetch projects:", err));
  }, [client]);

  const aspectRatios: WizardData["aspectRatio"][] = ["16:9", "1:1", "4:3"];

  return (
    <Stack space={4}>
      {/* Session Title -- required */}
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Session Title
        </Text>
        <input
          type="text"
          value={wizardData.sessionTitle}
          onChange={(e) => onChange({ sessionTitle: e.target.value })}
          placeholder="e.g., Master Bedroom Contemporary"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 4,
            border: "1px solid var(--card-border-color, #ccc)",
            background: "var(--card-bg-color, #fff)",
            color: "var(--card-fg-color, #333)",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      </Stack>

      {/* Project -- optional */}
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Project
        </Text>
        <select
          value={wizardData.projectId || ""}
          onChange={(e) =>
            onChange({ projectId: e.target.value || null })
          }
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
          <option value="">None (Scratchpad)</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </Stack>

      {/* Aspect Ratio -- default 16:9 */}
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Aspect Ratio
        </Text>
        <Flex gap={2}>
          {aspectRatios.map((ratio) => (
            <Button
              key={ratio}
              text={ratio}
              mode={wizardData.aspectRatio === ratio ? "default" : "ghost"}
              tone={wizardData.aspectRatio === ratio ? "primary" : "default"}
              onClick={() => onChange({ aspectRatio: ratio })}
            />
          ))}
        </Flex>
      </Stack>

      {/* Style Preset -- optional */}
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Style Preset
        </Text>
        <input
          type="text"
          value={wizardData.stylePreset}
          onChange={(e) => onChange({ stylePreset: e.target.value })}
          placeholder="e.g., Scandinavian minimalist, Art Deco warm"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 4,
            border: "1px solid var(--card-border-color, #ccc)",
            background: "var(--card-bg-color, #fff)",
            color: "var(--card-fg-color, #333)",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      </Stack>
    </Stack>
  );
}
