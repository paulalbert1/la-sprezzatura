import { useCallback, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import CollapsibleSection from "../ui/CollapsibleSection";
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
import StudioRetirementNotice from "./StudioRetirementNotice";
import TradesCatalogSection from "../TradesCatalogSection";

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
}

export interface SettingsPageProps {
  initialSettings: SiteSettingsPayload;
}

function cloneInitial(s: SiteSettingsPayload): SiteSettingsPayload {
  return {
    ...s,
    socialLinks: { ...s.socialLinks },
    heroSlideshow: s.heroSlideshow.map((slide) => ({ ...slide })),
    renderingImageTypes: [...s.renderingImageTypes],
    renderingExcludedUsers: [...s.renderingExcludedUsers],
    trades: [...(s.trades ?? [])],
  };
}

function SettingsPageInner({ initialSettings }: SettingsPageProps) {
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
      setDirty(false);
      show({ variant: "success", title: "Settings saved", duration: 3000 });
    } catch (err) {
      setErrorBanner("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [general, socialLinks, rendering, trades, heroValid, show]);

  const initialHeroSlides = useMemo<HeroSlide[]>(
    () => initialSettings.heroSlideshow ?? [],
    [initialSettings.heroSlideshow],
  );

  return (
    <div className="max-w-3xl" data-settings-page>
      <p
        className="mb-6"
        style={{ fontSize: "13px", color: "#6B5E52" }}
        data-settings-intro
      >
        Site-wide settings and rendering configuration.
      </p>

      <div className="flex flex-col" style={{ gap: "14px" }}>
        <CollapsibleSection title="General" defaultOpen>
          <GeneralSection values={general} onChange={handleGeneralChange} />
        </CollapsibleSection>

        <CollapsibleSection title="Social Links">
          <SocialLinksSection
            values={socialLinks}
            onChange={handleSocialChange}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Hero Slideshow">
          <HeroSlideshowEditor
            ref={heroRef}
            initialSlides={initialHeroSlides}
            onDirtyChange={handleHeroDirty}
            onValidChange={setHeroValid}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Rendering Configuration">
          <RenderingConfigSection
            values={rendering}
            onChange={handleRenderingChange}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Trades">
          <TradesCatalogSection trades={trades} onChange={handleTradesChange} />
        </CollapsibleSection>
      </div>

      <StudioRetirementNotice />

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
