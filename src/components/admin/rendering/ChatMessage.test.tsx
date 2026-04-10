import { describe, it } from "vitest";
// RNDR-03: Chat message bubble (admin)
// Source of truth: src/sanity/components/rendering/ChatMessage.tsx
// Port action: swap @sanity/ui Flex/Card/Text for Tailwind divs + luxury tokens;
// add role="system" variant and optional timestamp below each bubble per 33-UI-SPEC.md § 4.
describe("ChatMessage (admin)", () => {
  it.todo("role='user' renders a self-end bubble with bg-[#FFFEFB] border 0.5px #E8DDD0");
  it.todo("role='model' renders a self-start bubble with bg-[#F3EDE3] border 0.5px #D4C8B8");
  it.todo("role='system' renders transparent centered text in #9E8E80, no border");
  it.todo("timestamp is displayed below the bubble in 11.5px / #9E8E80");
  it.todo("user bubble renders attached images at 48px square below the text");
});
