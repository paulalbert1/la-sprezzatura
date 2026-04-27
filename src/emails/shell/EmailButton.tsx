// src/emails/shell/EmailButton.tsx
// Phase 46 -- gold-pill CTA button (D-3).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-3)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (EmailButton.tsx)
//
// Mirrors the legacy gold-pill CTA spec from src/lib/workOrder/emailTemplate.ts
// line 49. Uses inline style={{ borderRadius: "2px" }} (longhand) instead of
// any Tailwind border-radius shorthand class -- EMAIL-07 explicitly forbids the
// shorthand form. Wraps @react-email/components <Button> so Outlook VML
// fallback is handled by the primitive.

import type { ReactNode } from "react";
import { Button } from "@react-email/components";

export interface EmailButtonProps {
  href: string;
  children: ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      className="bg-gold text-ivory px-[32px] py-[13.6px] tracking-[0.14em] uppercase no-underline text-[11px] font-semibold"
      style={{ borderRadius: "2px" }}
    >
      {children}
    </Button>
  );
}
