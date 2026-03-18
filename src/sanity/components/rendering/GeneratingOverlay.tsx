import { useState, useEffect } from "react";
import { Stack, Spinner, Text, Button } from "@sanity/ui";

const STATUS_MESSAGES = [
  "Composing vision...",
  "Generating rendering...",
  "Almost there...",
];

interface GeneratingOverlayProps {
  onCancel?: () => void;
}

export function GeneratingOverlay({ onCancel }: GeneratingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Stack space={3} style={{ alignItems: "center", textAlign: "center", padding: 32 }}>
      <Spinner muted />
      <Text size={1} muted>
        {STATUS_MESSAGES[messageIndex]}
      </Text>
      {onCancel && (
        <Button text="Cancel Generation" mode="ghost" onClick={onCancel} />
      )}
    </Stack>
  );
}
