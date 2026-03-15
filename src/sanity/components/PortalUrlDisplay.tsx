import { useCallback, useState } from "react";
import { Stack, Text, TextInput, Button, Flex } from "@sanity/ui";
import { useFormValue, type StringInputProps } from "sanity";

const SITE_URL = "https://lasprezz.com";

export function PortalUrlDisplay(props: StringInputProps) {
  const { value = "" } = props;
  const portalEnabled = useFormValue(["portalEnabled"]) as boolean | undefined;
  const fullUrl = value ? `${SITE_URL}/portal/${value}` : "";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullUrl]);

  if (!value) {
    return (
      <Text size={1} muted>
        Token will be generated when you create this project.
      </Text>
    );
  }

  return (
    <Stack space={2}>
      <Flex gap={2} align="center">
        <TextInput value={fullUrl} readOnly style={{ flex: 1 }} />
        <Button
          text={copied ? "Copied!" : "Copy"}
          tone="primary"
          onClick={handleCopy}
        />
      </Flex>
      {!portalEnabled && (
        <Text size={1} muted>
          Enable &ldquo;Portal Enabled&rdquo; toggle to activate this link.
        </Text>
      )}
    </Stack>
  );
}
