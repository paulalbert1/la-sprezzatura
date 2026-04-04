/**
 * ScaleToggle -- Week/Month segmented control for the Gantt timeline.
 *
 * Two @sanity/ui Buttons side by side: active button uses tone="primary",
 * inactive uses mode="ghost". Per UI-SPEC: no gap between buttons.
 */

import { Button, Flex } from "@sanity/ui";

interface ScaleToggleProps {
  view: "week" | "month";
  onViewChange: (view: "week" | "month") => void;
}

export function ScaleToggle({ view, onViewChange }: ScaleToggleProps) {
  return (
    <Flex gap={0}>
      <Button
        text="Week"
        tone={view === "week" ? "primary" : "default"}
        mode={view === "week" ? "default" : "ghost"}
        onClick={() => onViewChange("week")}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      <Button
        text="Month"
        tone={view === "month" ? "primary" : "default"}
        mode={view === "month" ? "default" : "ghost"}
        onClick={() => onViewChange("month")}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
      />
    </Flex>
  );
}
