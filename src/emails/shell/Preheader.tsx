// src/emails/shell/Preheader.tsx
// Phase 46 -- hidden preview-text primitive (D-13).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-13)
//
// Thin wrapper around @react-email/components <Preview> so the import surface
// stays internal to src/emails/shell/. Switch to a hand-rolled hidden-div recipe
// only if the merge-gate Outlook 2016/2019/365 spot-check shows leak-through.

import { Preview } from "@react-email/components";

export function Preheader({ children }: { children: string }) {
  return <Preview>{children}</Preview>;
}
