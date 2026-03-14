import Cal from "@calcom/embed-react";

interface Props {
  calLink?: string;
}

export default function CalBooking({
  calLink = "lasprezzatura/consultation",
}: Props) {
  return (
    <Cal
      calLink={calLink}
      style={{ width: "100%", height: "100%", overflow: "auto" }}
      config={{
        layout: "month_view",
        theme: "light",
      }}
    />
  );
}
