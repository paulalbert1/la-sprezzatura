import { useFormValue, type NumberInputProps } from "sanity";
import { Card, Text } from "@sanity/ui";

/** Pure formatting logic -- exported for unit testing */
export function formatNetPrice(
  retailPrice: number | undefined,
  clientCost: number | undefined,
): { text: string; isEmpty: boolean } {
  if (!retailPrice && !clientCost) {
    return { text: "", isEmpty: true };
  }
  const netCents = (retailPrice ?? 0) - (clientCost ?? 0);
  const isNegative = netCents < 0;
  const formatted = `Net: ${isNegative ? "-" : ""}$${(Math.abs(netCents) / 100).toFixed(2)}`;
  return { text: formatted, isEmpty: false };
}

export function NetPriceDisplay(props: NumberInputProps) {
  const parentPath = props.path.slice(0, -1);
  const retailPrice = useFormValue([...parentPath, "retailPrice"]) as number | undefined;
  const clientCost = useFormValue([...parentPath, "clientCost"]) as number | undefined;

  const { text, isEmpty } = formatNetPrice(retailPrice, clientCost);

  if (isEmpty) {
    return (
      <Card padding={3} radius={2} tone="default">
        <Text size={1} muted>
          Enter retail price and client cost to see net price
        </Text>
      </Card>
    );
  }

  return (
    <Card padding={3} radius={2} tone="default">
      <Text size={2} weight="medium">
        {text}
      </Text>
    </Card>
  );
}
