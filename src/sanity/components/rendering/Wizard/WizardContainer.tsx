import { useState, useCallback, useRef, useEffect } from "react";
import { Card, Flex, Stack, Text, Button, Dialog } from "@sanity/ui";
import { SparklesIcon, CheckmarkIcon } from "@sanity/icons";
import { useToolContext } from "../RenderingTool";
import { isWizardDirty, getStudioHeaders } from "../types";
import { GeneratingOverlay } from "../GeneratingOverlay";
import { StepSetup } from "./StepSetup";
import { StepUpload } from "./StepUpload";
import { StepClassify } from "./StepClassify";
import { StepDescribe } from "./StepDescribe";
import type { WizardData, WizardImage } from "../types";

const STEP_LABELS = ["Setup", "Upload", "Classify", "Describe"];

export function WizardContainer() {
  const { state, dispatch, refreshUsage, sanityUserId } = useToolContext();
  const { wizardData } = state;

  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const updateWizard = useCallback(
    (data: Partial<WizardData>) => {
      dispatch({ type: "UPDATE_WIZARD", data });
    },
    [dispatch],
  );

  const updateImages = useCallback(
    (imagesOrUpdater: WizardImage[] | ((prev: WizardImage[]) => WizardImage[])) => {
      if (typeof imagesOrUpdater === "function") {
        // Functional update -- read current state from wizardData
        const next = imagesOrUpdater(state.wizardData.images);
        dispatch({ type: "UPDATE_WIZARD", data: { images: next } });
      } else {
        dispatch({ type: "UPDATE_WIZARD", data: { images: imagesOrUpdater } });
      }
    },
    [dispatch, state.wizardData.images],
  );

  // -- Navigation --
  const canGoNext = (): boolean => {
    if (currentStep === 1) return wizardData.sessionTitle.trim().length > 0;
    if (currentStep === 4) return wizardData.description.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      // Skip Classify if no images
      if (currentStep === 2 && wizardData.images.length === 0) {
        setCurrentStep(4);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Skip Classify if no images (going back from Describe)
      if (currentStep === 4 && wizardData.images.length === 0) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleDiscard = () => {
    if (isWizardDirty(wizardData)) {
      setShowAbandonDialog(true);
    } else {
      dispatch({ type: "CLOSE_WIZARD" });
    }
  };

  const confirmDiscard = () => {
    setShowAbandonDialog(false);
    dispatch({ type: "CLOSE_WIZARD" });
  };

  // -- Generation --
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
        headers: getStudioHeaders(),
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

      // Poll for status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/rendering/status?sessionId=${encodeURIComponent(sessionId)}`,
            {
              headers: getStudioHeaders(),
              signal: controller.signal,
            },
          );
          const statusData = await statusRes.json();

          if (statusData.status === "complete") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsGenerating(false);
            dispatch({ type: "CLOSE_WIZARD" });
            dispatch({ type: "OPEN_SESSION", sessionId });
            refreshUsage();
          } else if (statusData.status === "error") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setGenerationError(
              statusData.latestRendering?.errorMessage ||
                "Generation failed. Please try again.",
            );
            setIsGenerating(false);
          }
        } catch (err: any) {
          if (err.name === "AbortError") return;
          // Keep polling on transient network errors
        }
      }, 2000);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setGenerationError(err.message || "Generation failed");
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

  // -- Stepper --
  const renderStepper = () => (
    <Flex align="center" justify="center" padding={4} gap={1}>
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const isFuture = stepNum > currentStep;

        return (
          <Flex key={label} align="center" gap={1}>
            {i > 0 && (
              <div
                style={{
                  width: 24,
                  height: 2,
                  background: isCompleted || isActive ? "#2276fc" : "#ccc",
                  margin: "0 4px",
                }}
              />
            )}
            <Flex
              align="center"
              gap={2}
              style={{ cursor: isCompleted ? "pointer" : "default" }}
              onClick={isCompleted ? () => setCurrentStep(stepNum) : undefined}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  background: isActive
                    ? "#2276fc"
                    : isCompleted
                      ? "#059669"
                      : "transparent",
                  color:
                    isActive || isCompleted ? "#fff" : "#999",
                  border: isFuture ? "2px solid #ccc" : "none",
                }}
              >
                {isCompleted ? (
                  <CheckmarkIcon style={{ fontSize: 14 }} />
                ) : (
                  stepNum
                )}
              </div>
              <Text
                size={1}
                muted={isFuture}
                weight={isActive ? "semibold" : "regular"}
              >
                {label}
              </Text>
            </Flex>
          </Flex>
        );
      })}
    </Flex>
  );

  // -- Step content --
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepSetup wizardData={wizardData} onChange={updateWizard} />;
      case 2:
        return (
          <StepUpload
            images={wizardData.images}
            onImagesChange={updateImages}
          />
        );
      case 3:
        return (
          <StepClassify
            images={wizardData.images}
            onImagesChange={updateImages}
          />
        );
      case 4:
        return (
          <StepDescribe
            description={wizardData.description}
            onChange={(desc) => updateWizard({ description: desc })}
            isGenerating={isGenerating}
            generationError={generationError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card height="fill" overflow="auto" sizing="border">
      {/* Stepper bar */}
      {renderStepper()}

      {/* Step content */}
      <Card padding={4}>
        {isGenerating ? (
          <GeneratingOverlay onCancel={handleCancelGeneration} />
        ) : (
          renderStep()
        )}
      </Card>

      {/* Navigation buttons */}
      {!isGenerating && (
        <Flex justify="space-between" padding={4}>
          {currentStep === 1 ? (
            <Button text="Discard Session" mode="ghost" onClick={handleDiscard} />
          ) : (
            <Button text="Back" mode="ghost" onClick={handleBack} />
          )}

          {currentStep < 4 ? (
            <Button
              text="Next"
              tone="primary"
              disabled={!canGoNext()}
              onClick={handleNext}
            />
          ) : (
            <Button
              text="Generate"
              tone="primary"
              icon={SparklesIcon}
              disabled={!canGoNext()}
              onClick={handleGenerate}
            />
          )}
        </Flex>
      )}

      {/* Abandon confirmation dialog */}
      {showAbandonDialog && (
        <Dialog
          header="Discard Session?"
          id="abandon-dialog"
          onClose={() => setShowAbandonDialog(false)}
          width={1}
        >
          <Card padding={4}>
            <Stack space={4}>
              <Text>Your uploads and settings will be lost.</Text>
              <Flex gap={2} justify="flex-end">
                <Button
                  text="Keep Editing"
                  mode="ghost"
                  onClick={() => setShowAbandonDialog(false)}
                />
                <Button
                  text="Discard"
                  tone="critical"
                  onClick={confirmDiscard}
                />
              </Flex>
            </Stack>
          </Card>
        </Dialog>
      )}
    </Card>
  );
}
