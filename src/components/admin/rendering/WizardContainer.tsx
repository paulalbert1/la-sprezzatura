import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Sparkles } from "lucide-react";
import type { WizardData, WizardImage, ProjectOption } from "../../../lib/rendering/types";
import { INITIAL_WIZARD_DATA, isWizardDirty } from "../../../lib/rendering/types";
import { GeneratingOverlay } from "./GeneratingOverlay";
import { StepSetup } from "./StepSetup";
import StepUpload from "./StepUpload";
import { StepClassify } from "./StepClassify";
import { StepDescribe } from "./StepDescribe";

const STEP_LABELS = ["Setup", "Upload", "Classify", "Describe"] as const;

interface WizardContainerProps {
  projects: ProjectOption[];
  sanityUserId: string;
  studioToken: string;
  prefilledProjectId?: string;
}

/**
 * 4-step rendering wizard orchestrator for the /admin/rendering/new route.
 *
 * Port notes (D-13 verbatim-port rule from 33-CONTEXT.md):
 *   - maxVisitedStep + currentStep state: ported from Studio WizardContainer.tsx lines 19-21
 *   - canGoNext / handleNext / handleBack / isClassifyDisabled skip-logic: ported from lines 57-86
 *   - Stepper render (isActive / isVisited / isClassifyDisabled / isClickable): ported from lines 196-280
 *   - Generate + polling flow: ported from lines 102-183
 * Only colors and layout primitives were swapped to Tailwind + admin luxury tokens
 * per 33-UI-SPEC.md § "3. WizardContainer + 4 step screens".
 *
 * studioToken is passed as a prop (not read from import.meta.env) so the secret
 * never lands in the client bundle via module evaluation — T-33-01 mitigation.
 */
export default function WizardContainer({
  projects,
  sanityUserId,
  studioToken,
  prefilledProjectId,
}: WizardContainerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    ...INITIAL_WIZARD_DATA,
    projectId: prefilledProjectId ?? null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount (ported from Studio lines 29-34)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const updateWizard = useCallback((data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  }, []);

  const updateImages = useCallback(
    (
      imagesOrUpdater: WizardImage[] | ((prev: WizardImage[]) => WizardImage[]),
    ) => {
      setWizardData((prev) => ({
        ...prev,
        images:
          typeof imagesOrUpdater === "function"
            ? imagesOrUpdater(prev.images)
            : imagesOrUpdater,
      }));
    },
    [],
  );

  // -- Navigation -- (ported verbatim from Studio lines 57-86)
  const canGoNext = (): boolean => {
    if (currentStep === 1) return wizardData.sessionTitle.trim().length > 0;
    if (currentStep === 4) return wizardData.description.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      let nextStep: number;
      // Skip Classify if no images (Studio line 67)
      if (currentStep === 2 && wizardData.images.length === 0) {
        nextStep = 4;
      } else {
        nextStep = currentStep + 1;
      }
      setCurrentStep(nextStep);
      setMaxVisitedStep((prev) => Math.max(prev, nextStep));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Skip Classify if no images going back (Studio line 80)
      if (currentStep === 4 && wizardData.images.length === 0) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleDiscard = () => {
    if (isWizardDirty(wizardData)) {
      setShowDiscardModal(true);
    } else {
      window.location.href = "/admin/rendering";
    }
  };

  const confirmDiscard = () => {
    setShowDiscardModal(false);
    window.location.href = "/admin/rendering";
  };

  // -- Generation -- (ported from Studio lines 102-183; studioToken injected as prop)
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const body = {
        sessionTitle: wizardData.sessionTitle,
        projectId: wizardData.projectId || undefined,
        aspectRatio: wizardData.aspectRatio,
        stylePreset: wizardData.stylePreset || undefined,
        description: wizardData.description,
        images: wizardData.images
          .filter((img) => img.blobPathname && !img.error)
          .map((img) => ({
            blobPathname: img.blobPathname,
            imageType: img.imageType,
            location: img.location || undefined,
            notes: img.notes || undefined,
            copyExact: img.copyExact,
          })),
        sanityUserId,
      };

      const res = await fetch("/api/rendering/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-studio-token": studioToken,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerationError(data.error || "Generation failed");
        setIsGenerating(false);
        return;
      }

      const { sessionId } = data;

      // Poll /api/rendering/status every 2s
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/rendering/status?sessionId=${encodeURIComponent(sessionId)}`,
            {
              headers: { "x-studio-token": studioToken },
              signal: controller.signal,
            },
          );
          const statusData = await statusRes.json();

          if (statusData.status === "complete") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsGenerating(false);
            window.location.href = `/admin/rendering/${sessionId}`;
          } else if (statusData.status === "error") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setGenerationError(
              statusData.latestRendering?.errorMessage ||
                "Generation failed. Please try again.",
            );
            setIsGenerating(false);
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") return;
          // Keep polling on transient network errors
        }
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setGenerationError(
        err instanceof Error ? err.message : "Generation failed",
      );
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    abortControllerRef.current = null;
    setIsGenerating(false);
  };

  // -- Stepper render -- (ported from Studio lines 196-280; admin colors swapped in)
  const hasImages = wizardData.images.length > 0;
  const isClassifyDisabledGlobal = !hasImages;

  const renderStepper = () => (
    <div className="flex items-center justify-center pt-8 pb-6">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isVisited = stepNum <= maxVisitedStep;
        const isCompleted = isVisited && !isActive;
        const isDisabled = stepNum === 3 && isClassifyDisabledGlobal;
        const isClickable = isVisited && !isActive && !isDisabled;

        // Connector between previous step and this one
        const connector =
          i > 0 ? (
            <div
              aria-hidden="true"
              style={{
                width: 48,
                height: 2,
                margin: "0 4px",
                background:
                  stepNum <= maxVisitedStep ? "#9A7B4B" : "#D4C8B8",
              }}
            />
          ) : null;

        // Circle visual: 24px
        const circleBase: React.CSSProperties = {
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11.5,
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          padding: 0,
          lineHeight: 1,
        };
        const circleStyle: React.CSSProperties = isActive
          ? {
              ...circleBase,
              background: "#9A7B4B",
              color: "#FFFFFF",
              border: "none",
            }
          : isCompleted
            ? {
                ...circleBase,
                background: "#9A7B4B",
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
              }
            : isDisabled
              ? {
                  ...circleBase,
                  background: "#F3EDE3",
                  color: "#9E8E80",
                  border: "1.5px solid #D4C8B8",
                  opacity: 0.6,
                }
              : {
                  ...circleBase,
                  background: "#F3EDE3",
                  color: "#9E8E80",
                  border: "1.5px solid #D4C8B8",
                };

        const circleContent = isCompleted ? (
          <Check className="w-3 h-3 text-white" aria-hidden="true" />
        ) : (
          stepNum
        );

        // Clickable circles are <button>; others are <div aria-disabled="true">
        const circleEl = isClickable ? (
          <button
            type="button"
            onClick={() => setCurrentStep(stepNum)}
            aria-label={`Go to step ${stepNum}: ${label}`}
            style={circleStyle}
          >
            {circleContent}
          </button>
        ) : (
          <div
            aria-disabled={!isActive ? "true" : undefined}
            aria-current={isActive ? "step" : undefined}
            style={circleStyle}
          >
            {circleContent}
          </div>
        );

        return (
          <div key={label} className="flex items-center">
            {connector}
            <div className="flex items-center gap-2 ml-2">
              {circleEl}
              <span
                className="text-[13px]"
                style={{
                  color: isActive
                    ? "#2C2520"
                    : isClickable
                      ? "#6B5E52"
                      : "#9E8E80",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // -- Step content --
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepSetup
            wizardData={wizardData}
            onChange={updateWizard}
            projects={projects}
          />
        );
      case 2:
        return (
          <StepUpload images={wizardData.images} onChange={updateImages} />
        );
      case 3:
        return (
          <StepClassify images={wizardData.images} onChange={updateImages} />
        );
      case 4:
        return (
          <StepDescribe
            wizardData={wizardData}
            onChange={updateWizard}
            isGenerating={isGenerating}
          />
        );
      default:
        return null;
    }
  };

  // -- Footer buttons -- step-specific labels (RNDR-06 / UI-SPEC § footer)
  const renderFooter = () => {
    const leftButton =
      currentStep === 1 ? (
        <button
          type="button"
          onClick={handleDiscard}
          className="text-sm text-[#9E8E80] hover:text-[#9B3A2A] px-4 py-2 rounded-lg transition-colors"
        >
          Discard session
        </button>
      ) : (
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-[#6B5E52] px-4 py-2 rounded-lg transition-colors hover:bg-[#F3EDE3]"
        >
          Back
        </button>
      );

    const primaryClass =
      "bg-[#9A7B4B] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#8A6D40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center";

    let rightButton: React.ReactNode;
    if (currentStep === 1) {
      rightButton = (
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext()}
          className={primaryClass}
        >
          Next: Upload
        </button>
      );
    } else if (currentStep === 2) {
      rightButton = (
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext()}
          className={primaryClass}
        >
          Next: Classify
        </button>
      );
    } else if (currentStep === 3) {
      rightButton = (
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext()}
          className={primaryClass}
        >
          Next: Describe
        </button>
      );
    } else {
      rightButton = (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGoNext() || isGenerating}
          className={primaryClass}
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          Generate
        </button>
      );
    }

    return (
      <div className="flex justify-between mt-6">
        {leftButton}
        {rightButton}
      </div>
    );
  };

  return (
    <div className="max-w-[720px] pt-4 pb-8">
      {/* Step indicator bar */}
      {renderStepper()}

      {/* Step content card */}
      <div
        className="relative bg-[#FFFEFB] border border-[#E8DDD0] rounded-xl p-6"
        style={{ minHeight: "420px" }}
      >
        {renderStep()}
        {generationError && !isGenerating && (
          <div className="mt-4 bg-[#FBEEE8] text-[#9B3A2A] text-sm px-4 py-3 rounded-lg">
            {generationError}
          </div>
        )}
        {isGenerating && (
          <GeneratingOverlay onCancel={handleCancelGeneration} />
        )}
      </div>

      {/* Footer buttons */}
      {!isGenerating && renderFooter()}

      {/* Discard confirmation modal */}
      {showDiscardModal && (
        <div
          className="fixed inset-0 bg-[#2C2520]/40 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(2px)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-dialog-title"
        >
          <div className="bg-[#FFFEFB] border border-[#E8DDD0] rounded-xl shadow-xl px-6 py-6 max-w-[420px]">
            <p
              id="discard-dialog-title"
              className="text-[13px] font-semibold text-[#2C2520] mb-2"
            >
              Discard session?
            </p>
            <p className="text-sm text-[#6B5E52] mb-6">
              Your uploads and settings will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 text-sm text-[#6B5E52] hover:bg-[#F3EDE3] rounded-lg transition-colors"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="bg-[#9B3A2A] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#802F22] transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
