import { useState } from "react";
import { Trash2, Loader2, Check, X } from "lucide-react";
import { formatTrade } from "../../lib/trades";
import { relationshipLabel } from "../../lib/relationshipLabel";
import TradeChecklist from "./TradeChecklist";

interface EntityDetailFormProps {
  entityType: "client" | "contractor";
  entity: Record<string, any> | null;
  isNew?: boolean;
  tradeCatalog?: string[]; // Phase 40 VEND-03: plain string list from siteSettings
  checklistItems?: string[]; // Phase 43 TRAD-06: relationship-scoped checklist labels
}

interface FieldError {
  name?: string;
  email?: string;
  trades?: string;
  relationship?: string;
  notes?: string;
}

const TRADE_OPTIONS = [
  "electrician",
  "plumber",
  "painter",
  "general-contractor",
  "custom-millwork",
  "flooring",
  "hvac",
  "tile-stone",
  "cabinetry",
  "window-treatments",
  "other",
];

const TRADE_LABELS: Record<string, string> = {
  electrician: "Electrician",
  plumber: "Plumber",
  painter: "Painter",
  "general-contractor": "General Contractor",
  "custom-millwork": "Custom Millwork",
  flooring: "Flooring",
  hvac: "HVAC",
  "tile-stone": "Tile & Stone",
  cabinetry: "Cabinetry",
  "window-treatments": "Window Treatments",
  other: "Other",
};

export default function EntityDetailForm({
  entityType,
  entity,
  isNew = false,
  tradeCatalog,
  checklistItems,
}: EntityDetailFormProps) {
  const isCreateMode = isNew || !entity;

  // Client fields
  const [name, setName] = useState(entity?.name || "");
  const [email, setEmail] = useState(entity?.email || "");
  const [phone, setPhone] = useState(entity?.phone || "");
  const [street, setStreet] = useState(entity?.address?.street || "");
  const [city, setCity] = useState(entity?.address?.city || "");
  const [state, setState] = useState(entity?.address?.state || "");
  const [zip, setZip] = useState(entity?.address?.zip || "");
  const [notes, setNotes] = useState(entity?.notes || "");

  // Contractor fields
  const [company, setCompany] = useState(entity?.company || "");
  const [relationship, setRelationship] = useState<string>(
    (entity as any)?.relationship || "",
  );
  const [trades, setTrades] = useState<string[]>(entity?.trades || []);
  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function validate(): boolean {
    const newErrors: FieldError = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (entityType === "contractor" && trades.length === 0) {
      newErrors.trades = "Select at least one trade";
    }

    if (entityType === "contractor" && !relationship) {
      newErrors.relationship = "Select a relationship before saving";
    }

    if (notes.length > 2000) {
      newErrors.notes = "Notes must be under 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setServerError(null);

    const payload: Record<string, any> = {
      action: isCreateMode ? "create" : "update",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    if (!isCreateMode && entity?._id) {
      payload[`${entityType}Id`] = entity._id;
    }

    if (entityType === "client") {
      payload.address = {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
      };
      payload.notes = notes;
    } else {
      payload.company = company.trim();
      payload.trades = trades;
      payload.relationship = relationship || null;
      // Phase 40 VEND-04: include address for contractor saves
      payload.address = {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
      };
    }

    try {
      const res = await fetch(`/api/admin/${entityType}s`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save changes. Please try again.");
      }

      const result = await res.json();

      const createdId = result[`${entityType}Id`] ?? result._id;
      if (isCreateMode && createdId) {
        window.location.href = entityType === "contractor"
          ? `/admin/trades/${createdId}`
          : `/admin/${entityType}s/${createdId}`;
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setServerError(err.message || "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function removeTrade(trade: string) {
    setTrades((prev) => prev.filter((t) => t !== trade));
  }

  function addTrade(trade: string) {
    if (!trades.includes(trade)) {
      setTrades((prev) => [...prev, trade]);
    }
  }

  const catalogOptions = tradeCatalog && tradeCatalog.length > 0 ? tradeCatalog : TRADE_OPTIONS;
  const availableTrades = catalogOptions.filter((t) => !trades.includes(t));

  return (
    <>
      {/* Server error banner */}
      {serverError && (
        <div className="bg-red-50 border border-red-200/30 rounded-xl px-4 py-3 mb-4 text-sm text-red-900 font-body">
          {serverError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-light/40 p-6">
        {/* Form fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`text-sm font-body text-charcoal bg-white border rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none ${
                errors.name ? "ring-1 ring-red-500 border-red-500" : "border-stone-light/40"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`text-sm font-body text-charcoal bg-white border rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none ${
                errors.email ? "ring-1 ring-red-500 border-red-500" : "border-stone-light/40"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
            />
          </div>

          {/* Address — rendered for both client and contractor (Phase 40 VEND-04) */}
          <div>
            <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
              Address
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
              />
              <div className="grid grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="col-span-5 text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="col-span-3 text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="col-span-4 text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
                />
              </div>
            </div>
          </div>

          {/* Client-specific fields */}
          {entityType === "client" && (
            <>
              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private notes about this client..."
                  maxLength={2000}
                  className={`text-sm font-body text-charcoal bg-white border rounded-lg px-3 py-2 w-full min-h-[80px] resize-y focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none ${
                    errors.notes
                      ? "ring-1 ring-red-500 border-red-500"
                      : "border-stone-light/40"
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.notes && (
                    <p className="text-xs text-red-600">{errors.notes}</p>
                  )}
                  <p className="text-xs text-stone-light ml-auto">
                    {notes.length}/2000
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Contractor-specific fields */}
          {entityType === "contractor" && (
            <>
              {/* Company */}
              <div>
                <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
                />
              </div>

              {/* Relationship — Phase 42 TRAD-02 radio group */}
              <div>
                <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
                  Relationship *
                </label>
                <p className="text-xs text-stone-muted font-body mb-2">
                  Required — determines display name and document checklist
                </p>
                <div className="flex gap-3">
                  {[
                    {
                      value: "contractor",
                      label: "Contractor",
                      desc: "Licensed trade performing installation or construction work",
                    },
                    {
                      value: "vendor",
                      label: "Vendor",
                      desc: "Supplier, showroom, or material source",
                    },
                  ].map((opt) => {
                    const selected = relationship === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex-1 cursor-pointer border rounded-lg px-3 py-2 transition-colors ${
                          selected
                            ? "border-terracotta bg-terracotta/5"
                            : "border-stone-light/40 hover:border-stone-light"
                        } ${
                          errors.relationship
                            ? "ring-1 ring-red-500 border-red-500"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="relationship"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setRelationship(opt.value)}
                          className="sr-only"
                        />
                        <div className="text-sm font-semibold text-charcoal font-body">
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-stone font-body mt-0.5">
                          {opt.desc}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.relationship && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.relationship}
                  </p>
                )}
              </div>

              {/* Trades */}
              <div>
                <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block">
                  Trades *
                </label>
                {/* Selected trades pills */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {trades.map((trade) => (
                    <span
                      key={trade}
                      className="text-xs font-body bg-cream-dark text-charcoal px-2 py-1 rounded-full inline-flex items-center gap-1"
                    >
                      {formatTrade(trade)}
                      <button
                        type="button"
                        onClick={() => removeTrade(trade)}
                        className="text-stone hover:text-charcoal"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {/* Add trade dropdown */}
                {availableTrades.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addTrade(e.target.value);
                    }}
                    className={`text-sm font-body text-charcoal bg-white border rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none ${
                      errors.trades
                        ? "ring-1 ring-red-500 border-red-500"
                        : "border-stone-light/40"
                    }`}
                  >
                    <option value="">Add a trade...</option>
                    {availableTrades.map((trade) => (
                      <option key={trade} value={trade}>
                        {formatTrade(trade)}
                      </option>
                    ))}
                  </select>
                )}
                {errors.trades && (
                  <p className="text-xs text-red-600 mt-1">{errors.trades}</p>
                )}
              </div>

            </>
          )}
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-terracotta text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors disabled:bg-terracotta/50 disabled:cursor-not-allowed inline-flex items-center gap-2 font-body"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isCreateMode ? "Create" : "Save"
            )}
          </button>
          {saved && (
            <span className="text-emerald-600 text-xs font-body inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Documents — separate card so uploads are visually distinct from the
          form's Save action. Hidden entirely when no checklist is configured. */}
      {!isCreateMode && entityType === "contractor" && (checklistItems?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-stone-light/40 p-6 mt-4">
          <TradeChecklist
            contractorId={entity!._id}
            checklistItems={checklistItems ?? []}
            initialDocuments={(entity?.documents ?? []) as Parameters<typeof TradeChecklist>[0]["initialDocuments"]}
            relationship={(entity as any)?.relationship ?? null}
          />
        </div>
      )}

      {/* Danger zone — destructive action moved out of the top-right of the
          form card to reduce mis-click risk. */}
      {!isCreateMode && (
        <div className="mt-6 pt-6 border-t border-stone-light/40 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="text-sm text-stone hover:text-red-600 transition-colors inline-flex items-center gap-1.5 font-body"
          >
            <Trash2 className="w-4 h-4" />
            Delete {entityType === "client" ? "Client" : relationshipLabel(relationship)}
          </button>
        </div>
      )}

      {/* Delete confirm dialog rendered via sibling component */}
      {showDeleteDialog && (
        <DeleteInlineDialog
          entityType={entityType}
          entityName={entity?.name || ""}
          entityId={entity?._id || ""}
          relationship={relationship}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}

/**
 * Inline delete confirmation dialog.
 * Checks for linked projects and blocks delete if references exist.
 */
function DeleteInlineDialog({
  entityType,
  entityName,
  entityId,
  relationship,
  onClose,
}: {
  entityType: "client" | "contractor";
  entityName: string;
  entityId: string;
  relationship?: string;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/${entityType}s`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", _id: entityId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          alert(data.error);
        }
        setDeleting(false);
        return;
      }

      window.location.href = entityType === "contractor"
        ? "/admin/trades"
        : `/admin/${entityType}s`;
    } catch {
      alert("Could not delete. Please try again.");
      setDeleting(false);
    }
  }

  const deleteLabel =
    entityType === "client" ? "Client" : relationshipLabel(relationship);

  return (
    <div className="fixed inset-0 bg-charcoal/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold font-body text-charcoal">
            Delete {deleteLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone hover:text-charcoal"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-stone font-body mb-6">
          Are you sure you want to delete {entityName || "this record"}? This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-stone hover:text-charcoal px-4 py-2 rounded-lg border border-stone-light/40 font-body"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg inline-flex items-center gap-2 font-body disabled:opacity-50"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete {deleteLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
