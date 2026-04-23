import { useState, useEffect } from "react";
import { formatPhone } from "../../lib/format";
import { relationshipLabel } from "../../lib/relationshipLabel";

export interface ContactCardData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string | null;
  entityType: "client" | "contractor";
}

interface ContactCardPopoverProps {
  data: ContactCardData;
  position: { top: number; left: number };
  flipped?: { vertical?: boolean; horizontal?: boolean };
}

export default function ContactCardPopover({
  data,
  position,
  flipped,
}: ContactCardPopoverProps) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Trigger fade-in on mount
    const raf = requestAnimationFrame(() => setOpacity(1));
    return () => cancelAnimationFrame(raf);
  }, []);

  const profileHref = data.entityType === "contractor"
    ? `/admin/trades/${data._id}`
    : `/admin/${data.entityType}s/${data._id}`;

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-stone-light/30 p-4 w-72"
      style={{
        top: position.top,
        left: position.left,
        opacity,
        transition: "opacity 150ms ease-out",
        ...(flipped?.horizontal ? { transform: "translateX(-100%)" } : {}),
      }}
    >
      {/* Name */}
      <div className="text-sm font-semibold text-charcoal font-body">
        {data.name}
      </div>

      {/* Relationship label — Phase 42 TRAD-03 */}
      {data.entityType === "contractor" && (
        <p className="text-[11px] text-stone font-body mt-0.5">
          {relationshipLabel(data.relationship)}
        </p>
      )}

      {/* Email */}
      <a
        href={`mailto:${data.email}`}
        className="text-xs text-terracotta font-body hover:underline block mt-1"
      >
        {data.email}
      </a>

      {/* Phone (conditional) */}
      {data.phone && (
        <a
          href={`tel:${data.phone}`}
          className="text-xs text-stone font-body hover:underline block mt-1"
        >
          {formatPhone(data.phone)}
        </a>
      )}

      {/* Divider */}
      <div className="border-t border-stone-light/20 my-2" />

      {/* View full profile link */}
      <a
        href={profileHref}
        className="text-xs text-terracotta font-body hover:underline mt-2 block"
      >
        View full profile
      </a>
    </div>
  );
}
