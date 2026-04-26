import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import ToastContainer, { useToast } from "../ui/ToastContainer";
import GeneralSection, {
  type GeneralValues,
} from "./GeneralSection";
import SocialLinksSection, {
  type SocialLinksValues,
} from "./SocialLinksSection";
import HeroSlideshowEditor, {
  type HeroSlide,
  type HeroSlideshowEditorHandle,
} from "./HeroSlideshowEditor";
import RenderingConfigSection, {
  type RenderingConfigValues,
} from "./RenderingConfigSection";
import TradesCatalogSection from "../TradesCatalogSection";
import ChecklistConfigSection from "../ChecklistConfigSection";
import WorkflowTemplatesSection from "../workflow/WorkflowTemplatesSection";

// Phase 34 Plan 03 — SettingsPage
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1 /admin/settings page
//   - .planning/phases/34-settings-and-studio-retirement/34-03-PLAN.md Task 3
//
// Root React island for the /admin/settings page. Owns the 4 collapsible
// sections, tracks dirty state, runs the Save flow (POST
// /api/admin/site-settings action=update), and renders the sticky footer
// with save button + error banner.

export interface SiteSettingsPayload {
  siteTitle: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  studioLocation: string;
  socialLinks: SocialLinksValues;
  heroSlideshow: HeroSlide[];
  renderingAllocation: number;
  renderingImageTypes: string[];
  renderingExcludedUsers: string[];
  // Phase 38 — Send Update sender config (SETT-10 / SETT-11)
  defaultFromEmail: string;
  defaultCcEmail: string;
  // Phase 40 — VEND-03
  trades: string[];
  // Phase 43 — TRAD-08
  contractorChecklistItems: string[];
  vendorChecklistItems: string[];
}

export interface WorkflowTemplateItem {
  _id: string;
  name: string;
  version: number;
  phases: Array<{ _key: string; id: string; name: string; order: number; execution: string; canOverlapWith: string[]; milestones: Array<{ _key: string; id: string; name: string; assignee: string; gate: string | null; optional: boolean; multiInstance: boolean; hardPrereqs: string[]; softPrereqs: string[]; defaultInstances: Array<{ _key: string; name: string }> }> }>;
  inUseCount: number;
}

export interface SettingsPageProps {
  initialSettings: SiteSettingsPayload;
  initialWorkflowTemplates?: WorkflowTemplateItem[];
  // Distinct trade names found on existing contractor records — surfaced in
  // the Trades settings section so legacy / ad-hoc trades are discoverable
  // even if they aren't in the curated catalog yet.
  inUseTrades?: string[];
}

function cloneInitial(s: SiteSettingsPayload): SiteSettingsPayload {
  return {
    ...s,
    socialLinks: { ...s.socialLinks },
    heroSlideshow: s.heroSlideshow.map((slide) => ({ ...slide })),
    renderingImageTypes: [...s.renderingImageTypes],
    renderingExcludedUsers: [...s.renderingExcludedUsers],
    trades: [...(s.trades ?? [])],
    contractorChecklistItems: [...(s.contractorChecklistItems ?? [])],
    vendorChecklistItems: [...(s.vendorChecklistItems ?? [])],
  };
}

function SettingsPageInner({ initialSettings, initialWorkflowTemplates = [], inUseTrades = [] }: SettingsPageProps) {
  const [general, setGeneral] = useState<GeneralValues>({
    siteTitle: initialSettings.siteTitle ?? "",
    tagline: initialSettings.tagline ?? "",
    contactEmail: initialSettings.contactEmail ?? "",
    contactPhone: initialSettings.contactPhone ?? "",
    studioLocation: initialSettings.studioLocation ?? "",
    defaultFromEmail: initialSettings.defaultFromEmail ?? "",
    defaultCcEmail: initialSettings.defaultCcEmail ?? "",
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinksValues>({
    instagram: initialSettings.socialLinks?.instagram ?? "",
    pinterest: initialSettings.socialLinks?.pinterest ?? "",
    houzz: initialSettings.socialLinks?.houzz ?? "",
  });
  const [rendering, setRendering] = useState<RenderingConfigValues>({
    renderingAllocation: initialSettings.renderingAllocation ?? 50,
    renderingImageTypes: initialSettings.renderingImageTypes ?? [],
    renderingExcludedUsers: initialSettings.renderingExcludedUsers ?? [],
  });
  const [trades, setTrades] = useState<string[]>(initialSettings.trades ?? []);
  const [contractorChecklistItems, setContractorChecklistItems] = useState<
    string[]
  >(initialSettings.contractorChecklistItems ?? []);
  const [vendorChecklistItems, setVendorChecklistItems] = useState<string[]>(
    initialSettings.vendorChecklistItems ?? [],
  );
  const [inUseDocTypes, setInUseDocTypes] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [heroValid, setHeroValid] = useState<boolean>(true);
  const heroRef = useRef<HeroSlideshowEditorHandle>(null);
  const { show } = useToast();

  const markDirty = useCallback(() => {
    setDirty(true);
    setErrorBanner(null);
  }, []);

  // Phase 43 TRAD-08 — load in-use docType set for ChecklistConfigSection's
  // D-15 delete guard. Non-blocking: if the fetch fails, the guard falls open
  // (delete stays enabled) which is preferable to a visible loading state.
  useEffect(() => {
    fetch("/api/admin/site-settings?action=inUseDocTypes")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("inUseDocTypes fetch failed")),
      )
      .then((data: { types?: string[] }) => {
        setInUseDocTypes(
          new Set(
            (data.types ?? []).filter(
              (t): t is string => typeof t === "string" && t.length > 0,
            ),
          ),
        );
      })
      .catch(() => {
        // non-blocking
      });
  }, []);

  const handleGeneralChange = useCallback(
    (next: GeneralValues) => {
      setGeneral(next);
      markDirty();
    },
    [markDirty],
  );

  const handleSocialChange = useCallback(
    (next: SocialLinksValues) => {
      setSocialLinks(next);
      markDirty();
    },
    [markDirty],
  );

  const handleRenderingChange = useCallback(
    (next: RenderingConfigValues) => {
      setRendering(next);
      markDirty();
    },
    [markDirty],
  );

  const handleTradesChange = useCallback(
    (next: string[]) => {
      setTrades(next);
      markDirty();
    },
    [markDirty],
  );

  const handleContractorChecklistChange = useCallback(
    (next: string[]) => {
      setContractorChecklistItems(next);
      markDirty();
    },
    [markDirty],
  );

  const handleVendorChecklistChange = useCallback(
    (next: string[]) => {
      setVendorChecklistItems(next);
      markDirty();
    },
    [markDirty],
  );

  const handleHeroDirty = useCallback(
    (d: boolean) => {
      if (d) markDirty();
    },
    [markDirty],
  );

  const handleCancel = useCallback(() => {
    const reset = cloneInitial(initialSettings);
    setGeneral({
      siteTitle: reset.siteTitle ?? "",
      tagline: reset.tagline ?? "",
      contactEmail: reset.contactEmail ?? "",
      contactPhone: reset.contactPhone ?? "",
      studioLocation: reset.studioLocation ?? "",
      defaultFromEmail: reset.defaultFromEmail ?? "",
      defaultCcEmail: reset.defaultCcEmail ?? "",
    });
    setSocialLinks({ ...reset.socialLinks });
    setRendering({
      renderingAllocation: reset.renderingAllocation,
      renderingImageTypes: [...reset.renderingImageTypes],
      renderingExcludedUsers: [...reset.renderingExcludedUsers],
    });
    setTrades([...(reset.trades ?? [])]);
    setContractorChecklistItems([...(reset.contractorChecklistItems ?? [])]);
    setVendorChecklistItems([...(reset.vendorChecklistItems ?? [])]);
    setDirty(false);
    setErrorBanner(null);
  }, [initialSettings]);

  const handleSave = useCallback(async () => {
    if (!heroValid) {
      setErrorBanner("Add alt text to every hero image before saving.");
      return;
    }
    setSaving(true);
    setErrorBanner(null);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          general,
          socialLinks,
          renderingAllocation: rendering.renderingAllocation,
          renderingImageTypes: rendering.renderingImageTypes,
          renderingExcludedUsers: rendering.renderingExcludedUsers,
        }),
      });
      if (!response.ok) {
        throw new Error("Save failed");
      }
      const tradesResponse = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateTrades", trades }),
      });
      if (!tradesResponse.ok) {
        throw new Error("Could not save. Check your connection and try again.");
      }
      const contractorChecklistResponse = await fetch(
        "/api/admin/site-settings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateContractorChecklistItems",
            contractorChecklistItems,
          }),
        },
      );
      if (!contractorChecklistResponse.ok) {
        throw new Error("Could not save. Check your connection and try again.");
      }
      const vendorChecklistResponse = await fetch(
        "/api/admin/site-settings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateVendorChecklistItems",
            vendorChecklistItems,
          }),
        },
      );
      if (!vendorChecklistResponse.ok) {
        throw new Error("Could not save. Check your connection and try again.");
      }
      setDirty(false);
      show({ variant: "success", title: "Settings saved", duration: 3000 });
    } catch (err) {
      setErrorBanner("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    general,
    socialLinks,
    rendering,
    trades,
    contractorChecklistItems,
    vendorChecklistItems,
    heroValid,
    show,
  ]);

  const initialHeroSlides = useMemo<HeroSlide[]>(
    () => initialSettings.heroSlideshow ?? [],
    [initialSettings.heroSlideshow],
  );

  // Sub-nav: each section has a stable id used in the URL hash for deep
  // linking (e.g. /admin/settings#workflow-templates). All sections stay
  // mounted so per-section editor state survives nav switches; we just
  // hide the inactive ones with display:none.
  const sections = [
    { id: "general", label: "General" },
    { id: "social-links", label: "Social links" },
    { id: "hero-slideshow", label: "Hero slideshow" },
    { id: "rendering", label: "Rendering" },
    { id: "trades", label: "Trades" },
    { id: "contractor-checklist", label: "Contractor checklist" },
    { id: "vendor-checklist", label: "Vendor checklist" },
    { id: "workflow-templates", label: "Workflow templates" },
  ] as const;
  type SectionId = (typeof sections)[number]["id"];

  const initialActive: SectionId = (() => {
    if (typeof window === "undefined") return "general";
    const hash = window.location.hash.replace("#", "");
    return (sections.find((s) => s.id === hash)?.id ?? "general") as SectionId;
  })();
  const [active, setActive] = useState<SectionId>(initialActive);

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      const match = sections.find((s) => s.id === hash);
      if (match) setActive(match.id as SectionId);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function selectSection(id: SectionId) {
    setActive(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  const activeLabel = sections.find((s) => s.id === active)?.label ?? "";

  return (
    <div data-settings-page>
      <p
        className="mb-6"
        style={{ fontSize: "13px", color: "#6B5E52" }}
        data-settings-intro
      >
        Site-wide settings and rendering configuration.
      </p>

      <div className="flex gap-8">
        {/* Sub-nav rail */}
        <nav
          className="shrink-0"
          aria-label="Settings sections"
          style={{ width: "180px" }}
        >
          <ul className="flex flex-col" style={{ gap: "1px" }}>
            {sections.map((s) => {
              const isActive = s.id === active;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => selectSection(s.id as SectionId)}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: isActive ? "#5C4F3D" : "#8A7E6E",
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? "#F5EFE6" : "transparent",
                      borderLeft: isActive
                        ? "2px solid #9A7B4B"
                        : "2px solid transparent",
                      borderRadius: "0 6px 6px 0",
                      padding: "7px 12px",
                      cursor: "pointer",
                      transition:
                        "color 150ms ease, background-color 150ms ease, border-color 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#5C4F3D";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#8A7E6E";
                      }
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0 max-w-3xl">
          <div
            style={{
              backgroundColor: "#FFFEFB",
              border: "0.5px solid #E8DDD0",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div className="card-header flex items-center justify-between gap-3 px-5 h-[42px]">
              <h2 className="card-header-label">{activeLabel}</h2>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <div style={{ display: active === "general" ? "block" : "none" }}>
                <GeneralSection values={general} onChange={handleGeneralChange} />
              </div>
              <div style={{ display: active === "social-links" ? "block" : "none" }}>
                <SocialLinksSection
                  values={socialLinks}
                  onChange={handleSocialChange}
                />
              </div>
              <div style={{ display: active === "hero-slideshow" ? "block" : "none" }}>
                <HeroSlideshowEditor
                  ref={heroRef}
                  initialSlides={initialHeroSlides}
                  onDirtyChange={handleHeroDirty}
                  onValidChange={setHeroValid}
                />
              </div>
              <div style={{ display: active === "rendering" ? "block" : "none" }}>
                <RenderingConfigSection
                  values={rendering}
                  onChange={handleRenderingChange}
                />
              </div>
              <div style={{ display: active === "trades" ? "block" : "none" }}>
                <TradesCatalogSection
                  trades={trades}
                  onChange={handleTradesChange}
                  inUseTrades={inUseTrades}
                />
              </div>
              <div style={{ display: active === "contractor-checklist" ? "block" : "none" }}>
                <ChecklistConfigSection
                  items={contractorChecklistItems}
                  inUseTypes={inUseDocTypes}
                  variant="contractor"
                  onChange={handleContractorChecklistChange}
                />
              </div>
              <div style={{ display: active === "vendor-checklist" ? "block" : "none" }}>
                <ChecklistConfigSection
                  items={vendorChecklistItems}
                  inUseTypes={inUseDocTypes}
                  variant="vendor"
                  onChange={handleVendorChecklistChange}
                />
              </div>
              <div style={{ display: active === "workflow-templates" ? "block" : "none" }}>
                <p className="text-sm font-body text-stone" style={{ marginBottom: "16px", fontSize: "13px", color: "#6B5E52" }}>
                  Reusable process definitions you can apply to projects. Each template defines phases, milestones, gates, and default contractors. Edit or duplicate an existing template, or create a new one from scratch.
                </p>
                <WorkflowTemplatesSection templates={initialWorkflowTemplates} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div
        className="sticky bottom-0 mt-8 flex items-center justify-between"
        style={{
          backgroundColor: "#FFFEFB",
          borderTop: "0.5px solid #E8DDD0",
          padding: "16px 24px",
          borderRadius: "0 0 10px 10px",
        }}
        data-settings-footer
      >
        <div className="flex items-center min-h-[24px]">
          {errorBanner ? (
            <div
              role="alert"
              data-settings-error-banner
              style={{
                fontSize: "13px",
                color: "#9B3A2A",
                backgroundColor: "#FBEEE8",
                borderRadius: "8px",
                padding: "6px 12px",
              }}
            >
              {errorBanner}
            </div>
          ) : dirty ? (
            <span
              data-settings-dirty-indicator
              style={{ fontSize: "11.5px", color: "#6B5E52" }}
            >
              Unsaved changes
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving || !dirty}
            data-settings-cancel
            style={{
              fontSize: "13px",
              color: "#6B5E52",
              background: "transparent",
              border: "none",
              padding: "6px 14px",
              cursor: saving || !dirty ? "not-allowed" : "pointer",
              opacity: saving || !dirty ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-settings-save
            className="inline-flex items-center gap-2"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#FFFEFB",
              backgroundColor: saving ? "#C4A97A" : "#9A7B4B",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Root export wraps the inner component in a ToastContainer so useToast()
// calls inside any section resolve to a live provider. The global
// ToastContainer in AdminLayout.astro is a sibling — this local one lets
// SettingsPage own its own toast lifecycle without reaching into the Astro
// layout, which matters for tests that mount the component in isolation.
export default function SettingsPage(props: SettingsPageProps) {
  return (
    <ToastContainer>
      <SettingsPageInner {...props} />
    </ToastContainer>
  );
}


