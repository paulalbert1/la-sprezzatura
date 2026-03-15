export type StageKey =
  | "discovery"
  | "concept"
  | "design-development"
  | "procurement"
  | "installation"
  | "closeout";

export interface StageMeta {
  value: StageKey;
  title: string;
  description: string;
}

export const STAGES: StageMeta[] = [
  {
    value: "discovery",
    title: "Discovery",
    description:
      "We're learning about your space, lifestyle, and vision. This is where the conversation begins.",
  },
  {
    value: "concept",
    title: "Concept",
    description:
      "We're developing the design direction -- mood boards, color palettes, and initial concepts for your review.",
  },
  {
    value: "design-development",
    title: "Design Development",
    description:
      "The design is taking shape. Floor plans, elevations, and detailed specifications are being refined.",
  },
  {
    value: "procurement",
    title: "Procurement",
    description:
      "Materials, furniture, and fixtures are being sourced and ordered. Lead times are being coordinated.",
  },
  {
    value: "installation",
    title: "Installation",
    description:
      "Your space is being transformed. Contractors, artisans, and our team are bringing the design to life.",
  },
  {
    value: "closeout",
    title: "Closeout",
    description:
      "The project is complete. Final styling, photography, and your walkthrough are being scheduled.",
  },
];

export const STAGE_META: Record<StageKey, StageMeta> = Object.fromEntries(
  STAGES.map((s) => [s.value, s]),
) as Record<StageKey, StageMeta>;
