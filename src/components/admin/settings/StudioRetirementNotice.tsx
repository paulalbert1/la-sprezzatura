// Phase 34 Plan 03 — StudioRetirementNotice
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1.5
//
// Inert info block rendered below the 4 collapsible sections on /admin/settings.
// Not collapsible, not interactive — exists so Paul / Liz have a visible
// confirmation that the Studio has been retired. Phase 34 D-01 reverses the
// Phase 33 coexistence decision and removes Studio entirely; this notice is
// the only UI surface for that change.

export default function StudioRetirementNotice() {
  return (
    <div
      className="mt-6"
      style={{
        fontSize: "13px",
        color: "#6B5E52",
        padding: "20px 0",
        lineHeight: 1.55,
        fontFamily: "var(--font-sans)",
      }}
      data-studio-retirement-notice
    >
      Sanity Studio has been retired. All site content is now managed through
      this admin app. The <code>/admin</code> route now loads the custom admin
      interface; the previous Studio UI is no longer accessible.
    </div>
  );
}
