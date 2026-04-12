import { useState } from "react";
import { RefreshCw } from "lucide-react";
import ContactCardWrapper from "./ContactCardWrapper";
import RegenerateLinkDialog from "./RegenerateLinkDialog";
import ToastContainer from "./ui/ToastContainer";

// Phase 34 Plan 05 Task 3 — ClientChipWithRegenerate
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md
//     § "3. Per-client PURL regenerate control" (lines 347-360)
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-22
//   - .planning/phases/34-settings-and-studio-retirement/34-RESEARCH.md § 7.1
//     (Option A — sibling wrapper, do NOT extend ContactCardWrapper's prop surface)
//
// Wraps the existing ContactCardWrapper chip with a trailing regenerate
// icon button. The button's click opens RegenerateLinkDialog (which posts
// to /api/admin/clients#regenerate-portal-token, shows a success toast
// with the new URL, and offers a copy-link affordance).
//
// Why this component owns a local ToastContainer: React context does not
// cross Astro island boundaries. The admin layout's global ToastContainer
// is a separate island, so the dialog's useToast() call would fail unless
// we host a provider inside THIS island. Matches the SendUpdateButton
// pattern from Plan 04.

export interface ClientChipWithRegenerateProps {
  client: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    preferredContact?: string;
  };
}

export default function ClientChipWithRegenerate({
  client,
}: ClientChipWithRegenerateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ToastContainer>
      <div
        className="inline-flex items-center"
        style={{ gap: "6px" }}
        data-client-chip-with-regenerate
      >
        {/*
          Existing chip layout — copied from the project detail page
          verbatim so the visual drift between contractors and clients
          stays minimal. The inline <span> holds the chip style tokens
          (padding 5x11, rounded-full, #FAF7F2 bg, #D4C8B8 border).
        */}
        <ContactCardWrapper
          entityId={client._id}
          entityType="client"
          name={client.name}
          href={`/admin/clients/${client._id}`}
          contactData={{
            _id: client._id,
            name: client.name,
            email: client.email || "",
            phone: client.phone || "",
            preferredContact: client.preferredContact || "",
            entityType: "client" as const,
          }}
          className="inline-flex items-center gap-[7px] px-[11px] py-[5px] rounded-full text-[12.5px] cursor-pointer"
        >
          <span
            style={{
              backgroundColor: "#FAF7F2",
              color: "#2C2520",
              border: "0.5px solid #D4C8B8",
              padding: "5px 11px",
              borderRadius: "20px",
            }}
          >
            {client.name}
          </span>
        </ContactCardWrapper>

        {/*
          Regenerate icon button — 24x24 tap target, vertical divider on
          the left (0.5px #D4C8B8 per UI-SPEC line 350), RefreshCw 12px
          lucide icon #9E8E80 default / #9A7B4B hover.

          stopPropagation prevents the click from reaching the underlying
          ContactCardWrapper and opening the hover card; preventDefault
          keeps any link-like behavior dormant. The button sits outside
          the ContactCardWrapper element tree so hover events on the card
          remain untouched.
        */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setDialogOpen(true);
          }}
          aria-label="Regenerate personal portal link"
          title="Regenerate personal portal link"
          className="inline-flex items-center justify-center transition-colors"
          style={{
            width: "24px",
            height: "24px",
            paddingLeft: "6px",
            color: "#9E8E80",
            background: "transparent",
            borderTop: "none",
            borderRight: "none",
            borderBottom: "none",
            borderLeft: "0.5px solid #D4C8B8",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#9A7B4B";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#9E8E80";
          }}
          data-regenerate-trigger
        >
          <RefreshCw size={12} aria-hidden="true" />
        </button>
      </div>

      <RegenerateLinkDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        client={{ _id: client._id, name: client.name }}
      />
    </ToastContainer>
  );
}
