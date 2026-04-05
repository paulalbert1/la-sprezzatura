/**
 * Custom preview for schedule dependency items.
 *
 * Resolves "category:_key" strings to friendly names by reading the
 * parent document's arrays via useFormValue and resolving contractor
 * references via GROQ.
 */

import { useEffect, useState } from "react";
import { useClient, useFormValue } from "sanity";
import { Flex, Text, Box } from "@sanity/ui";

interface DependencyPreviewProps {
  source?: string;
  target?: string;
  linkType?: string;
}

const TYPE_LABELS: Record<string, string> = {
  e2s: "End → Start",
  s2s: "Start → Start",
  e2e: "End → End",
  s2e: "Start → End",
};

export function DependencyPreview(props: DependencyPreviewProps) {
  const { source, target, linkType } = props;
  const client = useClient({ apiVersion: "2024-01-01" });

  const contractors = useFormValue(["contractors"]) as
    | Array<{ _key: string; contractor?: { _ref: string } }>
    | undefined;
  const milestones = useFormValue(["milestones"]) as
    | Array<{ _key: string; name?: string }>
    | undefined;
  const procurementItems = useFormValue(["procurementItems"]) as
    | Array<{ _key: string; name?: string }>
    | undefined;
  const customEvents = useFormValue(["customEvents"]) as
    | Array<{ _key: string; name?: string }>
    | undefined;

  const [contractorNames, setContractorNames] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!contractors?.length) return;
    const refs = contractors
      .map((c) => c.contractor?._ref)
      .filter(Boolean) as string[];
    if (!refs.length) return;

    client
      .fetch(`*[_id in $refs]{ _id, name, company }`, { refs })
      .then(
        (docs: Array<{ _id: string; name: string; company: string }>) => {
          const map: Record<string, string> = {};
          for (const doc of docs) {
            map[doc._id] = doc.company
              ? `${doc.name} (${doc.company})`
              : doc.name;
          }
          setContractorNames(map);
        },
      );
  }, [client, contractors]);

  function resolveName(composedId: string | undefined): string {
    if (!composedId) return "Not set";
    const [category, key] = composedId.split(":");
    if (!key) return composedId;

    switch (category) {
      case "contractor": {
        const item = contractors?.find((c) => c._key === key);
        if (!item) return "Unknown contractor";
        const refId = item.contractor?._ref;
        return contractorNames[refId || ""] || "Loading...";
      }
      case "milestone": {
        const item = milestones?.find((m) => m._key === key);
        return item?.name || "Unknown milestone";
      }
      case "procurement": {
        const item = procurementItems?.find((p) => p._key === key);
        return item?.name || "Unknown item";
      }
      case "event": {
        const item = customEvents?.find((e) => e._key === key);
        return item?.name || "Unknown event";
      }
      default:
        return composedId;
    }
  }

  const sourceName = resolveName(source);
  const targetName = resolveName(target);
  const typeLabel = TYPE_LABELS[linkType || "e2s"] || linkType;

  return (
    <Box padding={2}>
      <Flex gap={2} align="center">
        <Text size={1} weight="medium">
          {sourceName}
        </Text>
        <Text size={1} muted>
          →
        </Text>
        <Text size={1} weight="medium">
          {targetName}
        </Text>
      </Flex>
      <Text size={0} muted style={{ marginTop: 4 }}>
        {typeLabel}
      </Text>
    </Box>
  );
}
