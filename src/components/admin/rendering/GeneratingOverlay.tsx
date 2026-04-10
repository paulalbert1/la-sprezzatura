import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STATUS_MESSAGES = [
  "Composing vision...",
  "Generating rendering...",
  "Almost there...",
];

interface GeneratingOverlayProps {
  onCancel?: () => void;
}

/**
 * Full-card overlay shown while a rendering is being generated.
 *
 * Ported from src/sanity/components/rendering/GeneratingOverlay.tsx and reskinned
 * to the admin luxury theme per 33-UI-SPEC.md § "Step 4: Describe":
 *   - bg `#FFFEFB` at 80% opacity
 *   - centered Loader2 icon at 32px `#9A7B4B`
 *   - text "Generating rendering..." at 14px `#2C2520`
 *
 * The parent WizardContainer renders this absolutely positioned inside the step
 * content card (which is `relative`). No @sanity/ui imports.
 */
export function GeneratingOverlay({ onCancel }: GeneratingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute inset-0 rounded-xl flex flex-col items-center justify-center"
      style={{ background: "rgba(255,254,251,0.80)" }}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 text-[#9A7B4B] animate-spin mb-2" />
      <p className="text-sm text-[#2C2520]">{STATUS_MESSAGES[messageIndex]}</p>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-sm text-[#6B5E52] px-4 py-2 rounded-lg transition-colors hover:bg-[#F3EDE3]"
        >
          Cancel generation
        </button>
      )}
    </div>
  );
}
