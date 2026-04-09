import { useState, useEffect } from "react";

export interface ContactCardData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  preferredContact?: string;
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

  const profileHref = `/admin/${data.entityType}s/${data._id}`;

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
          {data.phone}
        </a>
      )}

      {/* Preferred contact (conditional) */}
      {data.preferredContact && (
        <div className="text-xs text-stone font-body mt-1">
          Prefers: {data.preferredContact}
        </div>
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
