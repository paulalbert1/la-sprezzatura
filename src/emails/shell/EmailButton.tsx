// src/emails/shell/EmailButton.tsx
// Phase 46 -- pill CTA button (D-3).
// Phase 46-04 -- adds terracotta variant for SendUpdate (D-19).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-3)
//   .planning/phases/46-send-update-work-order-migration/46-04-CONTEXT.md (D-19)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (EmailButton.tsx)
//
// Mirrors the legacy gold-pill CTA spec from src/lib/workOrder/emailTemplate.ts
// line 49. Uses inline style={{ borderRadius: "2px" }} (longhand) instead of
// any Tailwind border-radius shorthand class -- EMAIL-07 explicitly forbids the
// shorthand form. Wraps @react-email/components <Button> so Outlook VML
// fallback is handled by the primitive.
//
// Variant default is "gold" -- preserves WorkOrder render byte-identical.
// SendUpdate (46-04) opts in with variant="terracotta" (#C4836A on cream-ivory).

import type { ReactNode } from "react";
import { Button } from "@react-email/components";

const VARIANT_COLORS = {
  gold: { bg: "#9A7B4B", fg: "#FAF7F2" },         // existing -- WorkOrder default
  terracotta: { bg: "#C4836A", fg: "#FAF8F5" },   // 46-04 D-19 -- SendUpdate
} as const;

export type EmailButtonVariant = keyof typeof VARIANT_COLORS;

export interface EmailButtonProps {
  href: string;
  variant?: EmailButtonVariant;
  children: ReactNode;
}

export function EmailButton({ href, variant = "gold", children }: EmailButtonProps) {
  const colors = VARIANT_COLORS[variant];
  return (
    <Button
      href={href}
      className={`cta-${variant}`}
      style={{
        display: "inline-block",
        backgroundColor: colors.bg,
        color: colors.fg,
        paddingTop: 13.6,
        paddingBottom: 13.6,
        paddingLeft: 32,
        paddingRight: 32,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        textDecoration: "none",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: "2px",   // longhand only -- Phase 46 D-3 / EMAIL-07
      }}
    >
      {children}
    </Button>
  );
}
