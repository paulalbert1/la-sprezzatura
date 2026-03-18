import { Badge } from "@sanity/ui";

interface UsageBadgeProps {
  count: number;
  limit: number;
  compact?: boolean;
}

export function UsageBadge({ count, limit, compact = false }: UsageBadgeProps) {
  const percentage = limit > 0 ? (count / limit) * 100 : 0;
  const label = `${count}/${limit} this month`;

  // Color thresholds: green <80%, amber 80-95%, red >=95%
  if (percentage >= 95) {
    return <Badge tone="critical" fontSize={compact ? 0 : 1}>{label}</Badge>;
  }
  if (percentage >= 80) {
    return (
      <Badge fontSize={compact ? 0 : 1} style={{ backgroundColor: "#D97706", color: "#FFFFFF" }}>
        {label}
      </Badge>
    );
  }
  return (
    <Badge fontSize={compact ? 0 : 1} style={{ backgroundColor: "#059669", color: "#FFFFFF" }}>
      {label}
    </Badge>
  );
}
