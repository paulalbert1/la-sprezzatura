import { Stack, Text, Card, Button } from "@sanity/ui";

interface StepDescribeProps {
  description: string;
  onChange: (description: string) => void;
  isGenerating: boolean;
  generationError: string | null;
}

export function StepDescribe({
  description,
  onChange,
  isGenerating,
  generationError,
}: StepDescribeProps) {
  return (
    <Stack space={4}>
      {/* Design Vision textarea */}
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Design Vision
        </Text>
        <textarea
          value={description}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the room you envision..."
          rows={6}
          disabled={isGenerating}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 4,
            border: "1px solid var(--card-border-color, #ccc)",
            background: "var(--card-bg-color, #fff)",
            color: "var(--card-fg-color, #333)",
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
        <Text size={0} muted>
          Describe the style, mood, colors, materials, and any specific elements you want.
        </Text>
      </Stack>

      {/* Generation error */}
      {generationError && (
        <Card tone="critical" padding={3} radius={2}>
          <Stack space={2}>
            <Text size={1}>{generationError}</Text>
            <Button text="Retry" mode="ghost" tone="critical" fontSize={1} />
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
