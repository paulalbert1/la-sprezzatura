/**
 * Custom preview for schedule dependency items.
 *
 * Resolves "category:_key" strings to friendly names and detects
 * scheduling conflicts (predecessor ends after successor starts).
 */

import { useEffect, useState } from "react";
import { useClient, useFormValue } from "sanity";
import { Flex, Text, Box, Badge } from "@sanity/ui";
import { WarningOutlineIcon } from "@sanity/icons";

interface DependencyPreviewProps {
  source?: string;
  target?: string;
  linkType?: string;
}

const TYPE_LABELS: Record<string, string> = {
  e2s: "End \u2192 Start",
  s2s: "Start \u2192 Start",
  e2e: "End \u2192 End",
  s2e: "Start \u2192 End",
};

export function DependencyPreview(props: DependencyPreviewProps) {
  const { source, target, linkType } = props;
  const client = useClient({ apiVersion: "2024-01-01" });

  const contractors = useFormValue(["contractors"]) as
    | Array<{
        _key: string;
        contractor?: { _ref: string };
        startDate?: string;
        endDate?: string;
      }>
    | undefined;
  const milestones = useFormValue(["milestones"]) as
    | Array<{ _key: string; name?: string; date?: string }>
    | undefined;
  const procurementItems = useFormValue(["procurementItems"]) as
    | Array<{ _key: string; name?: string; installDate?: string }>
    | undefined;
  const customEvents = useFormValue(["customEvents"]) as
    | Array<{
        _key: string;
        name?: string;
        date?: string;
        endDate?: string;
      }>
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
      case "milestone":
        return milestones?.find((m) => m._key === key)?.name || "Unknown milestone";
      case "procurement":
        return procurementItems?.find((p) => p._key === key)?.name || "Unknown item";
      case "event":
        return customEvents?.find((e) => e._key === key)?.name || "Unknown event";
      default:
        return composedId;
    }
  }

  /** Get the end date of a schedule item (for conflict detection) */
  function getEndDate(composedId: string | undefined): Date | null {
    if (!composedId) return null;
    const [category, key] = composedId.split(":");
    if (!key) return null;

    let dateStr: string | undefined;
    switch (category) {
      case "contractor":
        dateStr = contractors?.find((c) => c._key === key)?.endDate
          || contractors?.find((c) => c._key === key)?.startDate;
        break;
      case "milestone":
        dateStr = milestones?.find((m) => m._key === key)?.date;
        break;
      case "procurement":
        dateStr = procurementItems?.find((p) => p._key === key)?.installDate;
        break;
      case "event":
        dateStr = customEvents?.find((e) => e._key === key)?.endDate
          || customEvents?.find((e) => e._key === key)?.date;
        break;
    }
    return dateStr ? new Date(dateStr + "T12:00:00") : null;
  }

  /** Get the start date of a schedule item */
  function getStartDate(composedId: string | undefined): Date | null {
    if (!composedId) return null;
    const [category, key] = composedId.split(":");
    if (!key) return null;

    let dateStr: string | undefined;
    switch (category) {
      case "contractor":
        dateStr = contractors?.find((c) => c._key === key)?.startDate;
        break;
      case "milestone":
        dateStr = milestones?.find((m) => m._key === key)?.date;
        break;
      case "procurement":
        dateStr = procurementItems?.find((p) => p._key === key)?.installDate;
        break;
      case "event":
        dateStr = customEvents?.find((e) => e._key === key)?.date;
        break;
    }
    return dateStr ? new Date(dateStr + "T12:00:00") : null;
  }

  const sourceName = resolveName(source);
  const targetName = resolveName(target);
  const typeLabel = TYPE_LABELS[linkType || "e2s"] || linkType;

  // Detect conflict: source end date > target start date
  const sourceEnd = getEndDate(source);
  const targetStart = getStartDate(target);
  const isConflict = sourceEnd && targetStart && sourceEnd.getTime() > targetStart.getTime();
  const overlapDays = isConflict
    ? Math.ceil((sourceEnd.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Box padding={2}>
      <Flex gap={2} align="center">
        {isConflict && (
          <Text size={1} style={{ color: "#DC2626", flexShrink: 0 }}>
            <WarningOutlineIcon />
          </Text>
        )}
        <Text size={1} weight="medium">
          {sourceName}
        </Text>
        <Text size={1} muted>
          {"\u2192"}
        </Text>
        <Text size={1} weight="medium">
          {targetName}
        </Text>
      </Flex>
      <Flex gap={2} align="center" style={{ marginTop: 4 }}>
        <Text size={0} muted>
          {typeLabel}
        </Text>
        {isConflict && (
          <Badge tone="critical" fontSize={0}>
            Conflict: {overlapDays}d overlap
          </Badge>
        )}
      </Flex>
    </Box>
  );
}
