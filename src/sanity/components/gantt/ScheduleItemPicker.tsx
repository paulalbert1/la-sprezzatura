/**
 * Custom Sanity input component for picking a schedule item.
 *
 * Reads the parent document's contractors, milestones, procurementItems,
 * and customEvents arrays to build a dropdown of all items with friendly labels.
 * Stores the value as "category:_key" (e.g., "milestone:mil-da01").
 *
 * Contractors require a GROQ lookup since the name lives on the referenced
 * contractor document, not the array item itself.
 */

import { useCallback, useEffect, useState } from "react";
import { set, unset, useClient, useFormValue } from "sanity";
import { Select, Stack, Text } from "@sanity/ui";
import type { StringInputProps } from "sanity";

interface ScheduleOption {
  value: string;
  label: string;
}

export function ScheduleItemPicker(props: StringInputProps) {
  const { onChange, value, elementProps } = props;
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

  // Resolve contractor names from references
  useEffect(() => {
    if (!contractors?.length) return;
    const refs = contractors
      .map((c) => c.contractor?._ref)
      .filter(Boolean) as string[];
    if (!refs.length) return;

    const query = `*[_id in $refs]{ _id, name, company }`;
    client.fetch(query, { refs }).then((docs: Array<{ _id: string; name: string; company: string }>) => {
      const map: Record<string, string> = {};
      for (const doc of docs) {
        map[doc._id] = doc.company
          ? `${doc.name} (${doc.company})`
          : doc.name;
      }
      setContractorNames(map);
    });
  }, [client, contractors]);

  // Build flat option list
  const options: ScheduleOption[] = [];

  for (const c of contractors || []) {
    const refId = c.contractor?._ref;
    const name = refId ? contractorNames[refId] : undefined;
    options.push({
      value: `contractor:${c._key}`,
      label: `Contractor: ${name || `(key: ${c._key})`}`,
    });
  }
  for (const m of milestones || []) {
    options.push({
      value: `milestone:${m._key}`,
      label: `Milestone: ${m.name || "(unnamed)"}`,
    });
  }
  for (const p of procurementItems || []) {
    options.push({
      value: `procurement:${p._key}`,
      label: `Procurement: ${p.name || "(unnamed)"}`,
    });
  }
  for (const e of customEvents || []) {
    options.push({
      value: `event:${e._key}`,
      label: `Event: ${e.name || "(unnamed)"}`,
    });
  }

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const val = event.currentTarget.value;
      onChange(val ? set(val) : unset());
    },
    [onChange],
  );

  return (
    <Stack space={2}>
      <Select {...elementProps} value={value || ""} onChange={handleChange}>
        <option value="">— Select item —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      {value && (
        <Text size={0} muted>
          {options.find((o) => o.value === value)?.label || value}
        </Text>
      )}
    </Stack>
  );
}
