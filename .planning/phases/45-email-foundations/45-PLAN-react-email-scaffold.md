---
phase: 45-email-foundations
plan: react-email-scaffold
type: execute
wave: 2
depends_on: [foundation, tokens]
files_modified:
  - src/emails/_theme.ts
  - src/emails/__scaffold.tsx
  - src/emails/scaffold.test.ts
autonomous: true
requirements: [EMAIL-08]

must_haves:
  truths:
    - "`src/emails/_theme.ts` exports a typed `emailTailwindConfig` derived from `brandTokens` (D-06: mirrors values, not CSS vars)."
    - "`src/emails/__scaffold.tsx` is a pure JSX react-email component that uses every brand-token category at least once (color background, body/heading font, custom spacing)."
    - "`@react-email/render` renders `<Scaffold />` to deterministic HTML containing token-derived hex values (proving the brand-tokens → email-Tailwind pipeline)."
    - "A Vitest snapshot test pins the rendered HTML so any future drift is caught loud-fast."
  artifacts:
    - path: src/emails/_theme.ts
      provides: "TailwindConfig literal mirroring brandTokens for `<Tailwind config={...}>`."
      contains: "emailTailwindConfig"
    - path: src/emails/__scaffold.tsx
      provides: "Proof-of-pipeline react-email component."
      contains: "<Tailwind config={emailTailwindConfig}>"
    - path: src/emails/scaffold.test.ts
      provides: "Vitest snapshot + token-presence assertions on the rendered HTML."
      contains: "toMatchSnapshot"
  key_links:
    - from: src/emails/_theme.ts
      to: src/lib/brand-tokens.ts
      via: "direct import — value mirror per D-06"
      pattern: 'from "../lib/brand-tokens"'
    - from: src/emails/__scaffold.tsx
      to: src/emails/_theme.ts
      via: "<Tailwind config={emailTailwindConfig}>"
      pattern: "emailTailwindConfig"
    - from: src/emails/scaffold.test.ts
      to: src/emails/__scaffold.tsx
      via: "@react-email/render"
      pattern: "render\\(.*Scaffold"
---

<objective>
Stand up the react-email scaffold proving the EMAIL-08 pipeline end-to-end. Build the email Tailwind config that mirrors `brandTokens` (D-06), write a single proof-of-pipeline component that exercises every token category, and pin its rendered HTML with a Vitest snapshot.

Purpose: this is the "second consumer" of `brandTokens` — Tailwind portal CSS is one consumer, `@react-email/tailwind` is the other. Same source, two render targets, zero drift. Phase 46 builds the real Send Update + Work Order react-email components on this foundation.

Output: three new files under `src/emails/` plus a committed Vitest snapshot.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/45-email-foundations/45-CONTEXT.md
@.planning/phases/45-email-foundations/45-RESEARCH.md
@.planning/phases/45-email-foundations/45-PATTERNS.md
@.planning/phases/45-email-foundations/45-VALIDATION.md
@./CLAUDE.md
@src/lib/brand-tokens.ts
@src/lib/sendUpdate/emailTemplate.ts
@src/lib/sendUpdate/emailTemplate.test.ts

<interfaces>
<!-- Required exports from src/emails/_theme.ts -->

```typescript
import { pixelBasedPreset } from "@react-email/components";
import type { TailwindConfig } from "@react-email/tailwind";
import { brandTokens } from "../lib/brand-tokens";

export const emailTailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],   // mandatory per RESEARCH Pitfall 7
  theme: {
    extend: {
      colors: brandTokens.colors,
      fontFamily: {
        heading: brandTokens.fonts.heading.split(",").map((s) => s.trim()),
        body:    brandTokens.fonts.body.split(",").map((s) => s.trim()),
      },
      spacing: brandTokens.spacing,
    },
  },
};
```

<!-- Required shape of src/emails/__scaffold.tsx -->

```tsx
import { Body, Container, Head, Heading, Html, Tailwind, Text, Button } from "@react-email/components";
import { emailTailwindConfig } from "./_theme";

export interface ScaffoldProps {
  recipientName?: string;
}

export function Scaffold({ recipientName = "Sample Recipient" }: ScaffoldProps) {
  return (
    <Html lang="en">
      <Head />
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-cream font-body">
          <Container className="mx-auto max-w-xl py-10 px-5">
            <Heading className="text-2xl text-charcoal font-heading">
              Hello, {recipientName}
            </Heading>
            <Text className="text-base text-charcoal-light leading-7">
              Brand-token round-trip works.
            </Text>
            <Button href="https://lasprezz.com" className="bg-terracotta text-white px-6 py-3 no-underline">
              View
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default Scaffold;
```

<!-- @react-email/render API used in the test -->
```typescript
import { render } from "@react-email/render";
const html: string = await render(<Scaffold />);   // returns Promise<string>
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create src/emails/_theme.ts (brandTokens → email Tailwind config)</name>
  <files>src/emails/_theme.ts</files>
  <read_first>
    - src/lib/brand-tokens.ts (the source of values being mirrored)
    - .planning/phases/45-email-foundations/45-CONTEXT.md (D-06: emails MIRROR values, do NOT reference CSS vars)
    - .planning/phases/45-email-foundations/45-RESEARCH.md "Pattern 2: react-email template with brand-tokens-mirrored Tailwind config" (lines 327-355)
    - .planning/phases/45-email-foundations/45-RESEARCH.md "Pitfall 7: pixelBasedPreset forgotten" (lines 646-654 — pixelBasedPreset is mandatory, first line of config)
    - .planning/phases/45-email-foundations/45-PATTERNS.md "src/emails/_theme.ts" section (analog: portalStages.ts named-export pattern)
  </read_first>
  <behavior>
    - `emailTailwindConfig.presets[0]` is `pixelBasedPreset` (Pitfall 7 — Outlook ignores `rem`).
    - `emailTailwindConfig.theme.extend.colors.cream === "#FAF8F5"` (mirror, not CSS var reference — D-06).
    - `emailTailwindConfig.theme.extend.colors.terracotta === "#C4836A"`.
    - `emailTailwindConfig.theme.extend.fontFamily.heading[0] === '"Cormorant Garamond"'` (split fallbacks).
    - `emailTailwindConfig.theme.extend.spacing.section === "8rem"`.
    - The file does NOT contain any `var(--color-` references (D-06: emails can't read CSS variables).
  </behavior>
  <action>
    Create `src/emails/_theme.ts` with the EXACT shape shown in the interfaces block. Header comment per PATTERNS.md "Header Comment Convention":

    ```typescript
    // src/emails/_theme.ts
    // Phase 45 -- react-email Tailwind config mirroring src/lib/brand-tokens.ts.
    //
    // D-06: emails do NOT reference CSS variables -- email clients (notably Outlook
    // and most webmail) don't load CSS custom properties. Values are inlined here
    // via direct import of the brandTokens literal.
    //
    // Pitfall 7 (RESEARCH.md): pixelBasedPreset MUST be present so Tailwind emits
    // pixel units instead of rem. Outlook desktop ignores rem and balloons type.

    import { pixelBasedPreset } from "@react-email/components";
    import type { TailwindConfig } from "@react-email/tailwind";
    import { brandTokens } from "../lib/brand-tokens";

    export const emailTailwindConfig: TailwindConfig = {
      presets: [pixelBasedPreset],
      theme: {
        extend: {
          colors: brandTokens.colors,
          fontFamily: {
            heading: brandTokens.fonts.heading.split(",").map((s) => s.trim()),
            body:    brandTokens.fonts.body.split(",").map((s) => s.trim()),
          },
          spacing: brandTokens.spacing,
        },
      },
    };
    ```

    Use double-hyphens (not em-dashes) in the prose comments per repo convention. No emojis.

    If `import type { TailwindConfig } from "@react-email/tailwind"` is not exported in the installed version, fall back to inlining the type:
    `import type { ComponentProps } from "react"; type TailwindConfig = NonNullable<ComponentProps<typeof import("@react-email/components").Tailwind>["config"]>;`
    Verify the import path actually exports the type before falling back — RESEARCH.md confirms `@react-email/tailwind@^2.0.7` is the right version.
  </action>
  <verify>
    <automated>npx tsc --noEmit src/emails/_theme.ts 2>&1 | tee /tmp/45-theme-tsc.log; ! grep -E "^src/emails/_theme.ts" /tmp/45-theme-tsc.log</automated>
  </verify>
  <acceptance_criteria>
    - `test -f src/emails/_theme.ts` exits 0.
    - `grep -c "^export const emailTailwindConfig" src/emails/_theme.ts` returns 1.
    - `grep -c "pixelBasedPreset" src/emails/_theme.ts` returns at least 2 (import + use in `presets:`).
    - `grep -c 'from "../lib/brand-tokens"' src/emails/_theme.ts` returns 1.
    - `grep -cE "var\\(--color-|var\\(--font-|var\\(--spacing-" src/emails/_theme.ts` returns 0 (D-06: no CSS var references).
    - `npx tsc --noEmit --module esnext --target esnext --moduleResolution bundler --jsx preserve --esModuleInterop src/emails/_theme.ts 2>&1 | grep -cE "^src/emails/_theme.ts.*error"` returns 0 (file type-checks).
  </acceptance_criteria>
  <done>The email Tailwind config is wired to brandTokens, includes `pixelBasedPreset`, and contains no CSS-var references. Type-checks cleanly against the installed `@react-email/tailwind` types.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create src/emails/__scaffold.tsx and src/emails/scaffold.test.ts (snapshot proves pipeline)</name>
  <files>src/emails/__scaffold.tsx, src/emails/scaffold.test.ts</files>
  <read_first>
    - src/emails/_theme.ts (Task 1 output)
    - src/lib/sendUpdate/emailTemplate.test.ts (lines 1-11 + 159-165 — analog snapshot pattern, file header convention)
    - .planning/phases/45-email-foundations/45-CONTEXT.md (D-13, D-14 — proof-of-pipeline, no real templates this phase)
    - .planning/phases/45-email-foundations/45-PATTERNS.md "src/emails/__scaffold.tsx" + "src/emails/__tests__/scaffold.test.ts" sections — note PATTERNS recommends co-located placement (`src/emails/scaffold.test.ts`, NOT `__tests__/`)
    - .planning/phases/45-email-foundations/45-RESEARCH.md "Pitfall 2" (Astro is not Next.js — `@react-email/render` works in Node without RSC issues)
  </read_first>
  <behavior>
    - `Scaffold` is a default-exported React function component.
    - `await render(<Scaffold />)` returns a `Promise<string>` of HTML. The string is non-empty and starts with `<!DOCTYPE html>` (or `<!doctype html>`).
    - The rendered HTML contains the literal hex `#FAF8F5` (or its lowercase `#faf8f5`) somewhere, proving `bg-cream` → `#FAF8F5` round-trip.
    - The rendered HTML contains the literal hex `#C4836A` (or `#c4836a`) somewhere, proving `bg-terracotta` round-trip.
    - The rendered HTML contains `Hello, Sample Recipient` (default prop value flowed through).
    - `expect(html).toMatchSnapshot()` creates `src/emails/__snapshots__/scaffold.test.ts.snap` on first run.
    - `npx vitest run src/emails/scaffold.test.ts` exits 0.
  </behavior>
  <action>
    Step 1 — Create `src/emails/__scaffold.tsx`. Copy the `<interfaces>` block component verbatim, with this header (PATTERNS.md "Header Comment Convention"):

    ```tsx
    // src/emails/__scaffold.tsx
    // Phase 45 -- react-email proof-of-pipeline component.
    //
    // Purpose: prove that brand tokens flow through `@react-email/tailwind`
    // into rendered HTML with literal hex values (D-06 mirror works end-to-end).
    // NOT used at runtime; replaced by real templates in Phase 46.
    //
    // The component intentionally exercises every brand-token category once:
    //   - color (bg-cream, bg-terracotta, text-charcoal, text-charcoal-light, text-white)
    //   - font (font-heading, font-body)
    //   - spacing (max-w-xl, py-10, px-5 — standard Tailwind; the brand-token spacing
    //     scale is not used in this scaffold since `--spacing-section: 8rem` is portal-
    //     only sizing. Phase 46 templates may use `m-section-sm` etc. as appropriate.)
    ```

    Then the component as in `<interfaces>`. Underscore-prefix filename (`__scaffold.tsx`) signals it is internal/proof, matches the existing `__mocks__/` and `__snapshots__/` Vitest conventions.

    Step 2 — Create `src/emails/scaffold.test.ts` (co-located, NOT `__tests__/` — PATTERNS.md recommends co-located test placement to match every other test in `src/lib/`):

    ```typescript
    // src/emails/scaffold.test.ts
    // Phase 45 -- proves brand-tokens -> @react-email/tailwind pipeline produces
    // deterministic HTML with the expected hex values inlined.

    import { describe, it, expect } from "vitest";
    import { render } from "@react-email/render";
    import { Scaffold } from "./__scaffold";

    describe("Scaffold (Phase 45 proof-of-pipeline)", () => {
      it("renders with bg-cream resolved to the brand-tokens hex", async () => {
        const html = await render(<Scaffold />);
        // brandTokens.colors.cream
        expect(html.toLowerCase()).toContain("#faf8f5");
      });

      it("renders with bg-terracotta resolved to the brand-tokens hex", async () => {
        const html = await render(<Scaffold />);
        // brandTokens.colors.terracotta
        expect(html.toLowerCase()).toContain("#c4836a");
      });

      it("uses the default recipient name when no prop is passed", async () => {
        const html = await render(<Scaffold />);
        expect(html).toContain("Hello, Sample Recipient");
      });

      it("renders deterministic HTML (snapshot)", async () => {
        const html = await render(<Scaffold />);
        expect(html).toMatchSnapshot();
      });
    });
    ```

    The first run of `vitest` will create `src/emails/__snapshots__/scaffold.test.ts.snap` with the captured HTML. Commit that snap file — it is the regression baseline for the pipeline.

    Step 3 — Run `npx vitest run src/emails/scaffold.test.ts`. Confirm green. If `@react-email/tailwind` emits non-deterministic class hashes or attribute ordering between runs, switch to a stricter assertion strategy: drop the snapshot in favor of three or four `toContain` checks that don't depend on attribute order. (Per RESEARCH "Pitfall 2 (NOT applicable to Astro)" the render path is deterministic in Node; this should not happen, but document the fallback.)

    Step 4 — Re-run a second time to confirm snapshot stability:
    `npx vitest run src/emails/scaffold.test.ts` (green twice in a row, no `1 obsolete snapshot` warnings).
  </action>
  <verify>
    <automated>npx vitest run src/emails/scaffold.test.ts --reporter=basic && npx vitest run src/emails/scaffold.test.ts --reporter=basic</automated>
  </verify>
  <acceptance_criteria>
    - `test -f src/emails/__scaffold.tsx` exits 0.
    - `test -f src/emails/scaffold.test.ts` exits 0 (co-located, NOT in `__tests__/`).
    - `test -f src/emails/__snapshots__/scaffold.test.ts.snap` exits 0 (snapshot committed).
    - `grep -c "^export function Scaffold\\|^export default" src/emails/__scaffold.tsx` returns at least 1.
    - `grep -c "<Tailwind config={emailTailwindConfig}>" src/emails/__scaffold.tsx` returns 1.
    - `grep -c 'from "./_theme"' src/emails/__scaffold.tsx` returns 1.
    - `grep -c "@react-email/render" src/emails/scaffold.test.ts` returns 1.
    - `grep -c "toMatchSnapshot" src/emails/scaffold.test.ts` returns at least 1.
    - `grep -c "FAF8F5\\|faf8f5" src/emails/__snapshots__/scaffold.test.ts.snap` returns at least 1 (token round-trip baked into snapshot).
    - `grep -c "C4836A\\|c4836a" src/emails/__snapshots__/scaffold.test.ts.snap` returns at least 1.
    - `npx vitest run src/emails/scaffold.test.ts --reporter=basic` exits 0 with at least 4 passing assertions.
    - Re-running `npx vitest run src/emails/scaffold.test.ts` a second time exits 0 with no "obsolete" or "missing" snapshot warnings.
  </acceptance_criteria>
  <done>The scaffold renders deterministic HTML containing the expected brand-token hex values; the snapshot file is committed; the test passes twice in a row, proving stability.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| `brand-tokens.ts` (TS) → `_theme.ts` (TS mirror) → email Tailwind compiler | All build-time / server-side. No untrusted input crosses these boundaries. |
| Component props → rendered HTML | React JSX auto-escapes children (T-V5-01 mitigation per RESEARCH "Security Domain"); Phase 45 uses no user input but the contract is documented for Phase 46 inheritance. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-V5-01 | Tampering / Information Disclosure | Scaffold component (and Phase 46+ inheritors) | mitigate | React JSX auto-escapes string children inside `<Text>`, `<Heading>`, etc. The scaffold's only prop (`recipientName`) is rendered via `{recipientName}` — escaping is automatic. No `dangerouslySetInnerHTML` is used or permitted. |
| T-V14-SCAF-01 | Spoofing | Email asset URLs (none in scaffold yet) | accept | Scaffold uses no image assets. Phase 46+ will hardcode URLs to `https://email-assets.lasprezz.com/...` per the asset-host plan; user-derived URLs are forbidden. |
</threat_model>

<verification>
- `npx vitest run src/emails/scaffold.test.ts` passes 4+ assertions.
- The committed snapshot contains `#faf8f5` and `#c4836a` — proving brandTokens flowed through `@react-email/tailwind` to inlined hex.
- No CSS-var references appear in `_theme.ts`.
- File placements follow the co-located convention (`scaffold.test.ts` next to `__scaffold.tsx`, not under `__tests__/`).
</verification>

<success_criteria>
1. `src/emails/_theme.ts` exports `emailTailwindConfig` with `pixelBasedPreset` and brandTokens-derived colors/fonts/spacing.
2. `src/emails/__scaffold.tsx` is a JSX component using brand-token Tailwind classes inside `<Tailwind config={emailTailwindConfig}>`.
3. `src/emails/scaffold.test.ts` asserts hex round-trip and pins HTML via `toMatchSnapshot()`.
4. `src/emails/__snapshots__/scaffold.test.ts.snap` is committed.
5. The test passes twice in a row, proving render determinism.
</success_criteria>

<output>
After completion, create `.planning/phases/45-email-foundations/45-react-email-scaffold-SUMMARY.md` per `$HOME/.claude/get-shit-done/templates/summary.md`. Capture: the snapshot file size + first 20 lines, the hex-string round-trip assertions, and a note that 45-PLAN-snapshot-harness will reuse `<Scaffold />` for the Playwright visual baseline.
</output>
