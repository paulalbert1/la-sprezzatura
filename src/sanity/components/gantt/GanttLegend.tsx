/**
 * GanttLegend -- Contractor color legend for the Gantt chart.
 *
 * Horizontal flex of contractor swatches (16x16px rounded square + name).
 * Only renders when contractors array is non-empty.
 * Per UI-SPEC: heading "Contractors" shown above swatches.
 */

import { Flex, Text } from "@sanity/ui";
import { getContractorColor } from "./lib/ganttColors";
import type { ResolvedContractor } from "./lib/ganttTypes";

interface GanttLegendProps {
  contractors: ResolvedContractor[];
}

export function GanttLegend({ contractors }: GanttLegendProps) {
  if (!contractors || contractors.length === 0) return null;

  return (
    <Flex align="center" gap={3} wrap="wrap">
      <Text size={0} weight="semibold" style={{ marginRight: 4 }}>
        Contractors
      </Text>
      {contractors.map((contractor, index) => {
        const name = contractor.contractor?.name || "Unknown";
        const color = getContractorColor(index);

        return (
          <Flex key={contractor._key} align="center" gap={1}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: color,
                flexShrink: 0,
              }}
            />
            <Text size={0}>{name}</Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
