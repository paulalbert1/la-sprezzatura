import { useState } from "react";
import { format } from "date-fns";
import {
  Upload,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Pencil,
  MessageSquare,
  Bell,
  Upload as UploadIcon,
  Check,
  Clock,
} from "lucide-react";
import {
  type Artifact,
  type ArtifactVersion,
  type DecisionLogEntry,
  ARTIFACT_TYPES,
  ARTIFACT_LABELS,
  getArtifactLabel,
  getCurrentVersion,
  isContractSigned,
  getArtifactBadgeStyle,
} from "../../lib/artifactUtils";

// Shared CSS class constants (per UI-SPEC)
const inputClasses =
  "w-full px-4 py-3 bg-cream-dark border border-stone-light/30 rounded-lg text-sm font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors";
const selectClasses = inputClasses + " appearance-none";
const labelClasses =
  "text-xs uppercase tracking-widest text-stone font-body mb-2 block";
const ctaClasses =
  "bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 rounded-lg hover:bg-terracotta-light transition-colors inline-flex items-center gap-2";
const secondaryBtnClasses =
  "text-sm text-stone hover:text-charcoal font-body transition-colors cursor-pointer";

interface ArtifactManagerProps {
  artifacts: Artifact[];
  projectId: string;
  projectTitle: string;
}

// Decision log action label mapping
function getActionLabel(entry: DecisionLogEntry): string {
  const name = entry.clientName || "Client";
  switch (entry.action) {
    case "approved":
      return `${name} approved version`;
    case "changes-requested":
      return `${name} requested changes`;
    case "note-added":
      return `${name} added a note`;
    case "version-uploaded":
      return "New version uploaded";
    case "notification-sent":
      return "Notification sent";
    case "tier-selected":
      return `${name} selected investment tier`;
    default:
      return entry.action;
  }
}

// Decision log icon mapping
function getActionIcon(action: string) {
  switch (action) {
    case "approved":
      return <CheckCircle size={14} className="text-emerald-700 shrink-0" />;
    case "changes-requested":
      return <Pencil size={14} className="text-stone shrink-0" />;
    case "note-added":
      return <MessageSquare size={14} className="text-stone shrink-0" />;
    case "version-uploaded":
      return <Upload size={14} className="text-stone shrink-0" />;
    case "notification-sent":
      return <Bell size={14} className="text-stone shrink-0" />;
    case "tier-selected":
      return <Check size={14} className="text-stone shrink-0" />;
    default:
      return <Clock size={14} className="text-stone shrink-0" />;
  }
}

export default function ArtifactManager({
  artifacts: initialArtifacts,
  projectId,
  projectTitle,
}: ArtifactManagerProps) {
  const [items, setItems] = useState<Artifact[]>(
    (initialArtifacts || []).map((a) => ({
      ...a,
      versions: a.versions || [],
      decisionLog: a.decisionLog || [],
      notes: a.notes || [],
    })),
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{
    key: string;
    label: string;
  } | null>(null);

  // Upload state per expanded card
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState("");

  // Signed file upload state
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSigned, setUploadingSigned] = useState(false);

  // Add form state
  const [addType, setAddType] = useState<string>(ARTIFACT_TYPES[0]);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addNote, setAddNote] = useState("");
  const [adding, setAdding] = useState(false);

  // --- Upload Version ---
  async function handleUploadVersion(artifactKey: string) {
    if (!uploadFile) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("action", "upload");
    formData.append("file", uploadFile);
    formData.append("projectId", projectId);
    formData.append("artifactKey", artifactKey);
    formData.append("note", uploadNote);

    try {
      const res = await fetch("/api/admin/artifact-version", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Optimistically update state
      setItems((prev) =>
        prev.map((item) => {
          if (item._key !== artifactKey) return item;
          const newVersion: ArtifactVersion = {
            _key: data.versionKey,
            file: {
              asset: {
                url: data.assetUrl,
                originalFilename: uploadFile.name,
                mimeType: uploadFile.type,
                size: uploadFile.size,
              },
            },
            uploadedAt: new Date().toISOString(),
            note: uploadNote || undefined,
          };
          return {
            ...item,
            versions: [...item.versions, newVersion],
            currentVersionKey: data.versionKey,
            decisionLog: [
              ...item.decisionLog,
              {
                _key: crypto.randomUUID().slice(0, 8),
                action: "version-uploaded" as const,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }),
      );
      setUploadFile(null);
      setUploadNote("");
    } catch (err: any) {
      setError(err.message || "Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  // --- Upload Signed File ---
  async function handleUploadSigned(artifactKey: string) {
    if (!signedFile) return;
    setUploadingSigned(true);
    setError(null);

    const formData = new FormData();
    formData.append("action", "upload-signed");
    formData.append("file", signedFile);
    formData.append("projectId", projectId);
    formData.append("artifactKey", artifactKey);

    try {
      const res = await fetch("/api/admin/artifact-version", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setItems((prev) =>
        prev.map((item) => {
          if (item._key !== artifactKey) return item;
          return {
            ...item,
            signedFile: {
              asset: {
                url: data.assetUrl,
                originalFilename: signedFile.name,
              },
            },
          };
        }),
      );
      setSignedFile(null);
    } catch (err: any) {
      setError(err.message || "Upload failed. Check your connection and try again.");
    } finally {
      setUploadingSigned(false);
    }
  }

  // --- Set as Current ---
  async function handleSetCurrent(artifactKey: string, versionKey: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== artifactKey) return item;
        return { ...item, currentVersionKey: versionKey };
      }),
    );

    try {
      const res = await fetch("/api/admin/artifact-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-current",
          projectId,
          artifactKey,
          versionKey,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set current version");
      }
    } catch (err: any) {
      // Revert on failure -- refetch would be better but keep it simple
      setError(err.message || "Could not save changes. Check your connection and try again.");
    }
  }

  // --- Add Artifact ---
  async function handleAddArtifact() {
    if (!addFile) return;
    setAdding(true);
    setError(null);

    const formData = new FormData();
    formData.append("action", "add");
    formData.append("projectId", projectId);
    formData.append("type", addType);
    formData.append("file", addFile);
    formData.append("note", addNote);

    try {
      const res = await fetch("/api/admin/artifact-crud", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add artifact");

      const newArtifact: Artifact = {
        _key: data.artifactKey,
        artifactType: addType,
        currentVersionKey: data.versionKey,
        versions: [
          {
            _key: data.versionKey,
            file: {
              asset: {
                url: "",
                originalFilename: addFile.name,
                mimeType: addFile.type,
                size: addFile.size,
              },
            },
            uploadedAt: new Date().toISOString(),
            note: addNote || undefined,
          },
        ],
        decisionLog: [
          {
            _key: crypto.randomUUID().slice(0, 8),
            action: "version-uploaded" as const,
            timestamp: new Date().toISOString(),
          },
        ],
        notes: [],
      };

      setItems((prev) => [...prev, newArtifact]);
      setShowAddForm(false);
      setAddFile(null);
      setAddNote("");
      setAddType(ARTIFACT_TYPES[0]);
    } catch (err: any) {
      setError(err.message || "Failed to add artifact.");
    } finally {
      setAdding(false);
    }
  }

  // --- Remove Artifact ---
  async function handleRemoveArtifact() {
    if (!confirmRemove) return;

    try {
      const res = await fetch("/api/admin/artifact-crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          projectId,
          artifactKey: confirmRemove.key,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove artifact");
      }

      setItems((prev) => prev.filter((item) => item._key !== confirmRemove.key));
      if (expandedKey === confirmRemove.key) setExpandedKey(null);
      setConfirmRemove(null);
    } catch (err: any) {
      setError(err.message || "Failed to remove artifact.");
    }
  }

  // --- Render ---
  return (
    <div>
      {/* Page heading with Add Artifact button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-normal text-charcoal">
          Artifacts
        </h2>
        <button
          type="button"
          className={ctaClasses}
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} /> Add Artifact
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 font-body">{error}</p>
          <button
            type="button"
            className="text-xs text-red-600 underline mt-1 font-body"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Artifact Form */}
      {showAddForm && (
        <div className="bg-cream-dark border border-stone-light/20 rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold font-body text-charcoal mb-4">
            Add New Artifact
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Type</label>
              <select
                className={selectClasses}
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
              >
                {ARTIFACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ARTIFACT_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>File</label>
              <label className="border-2 border-dashed border-stone-light/30 rounded-lg p-4 text-center hover:border-terracotta/50 transition-colors block cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                />
                <Upload size={24} className="text-stone-light mx-auto mb-2" />
                <span className="text-xs text-stone font-body">
                  {addFile ? addFile.name : "Click or drag to upload a file"}
                </span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={ctaClasses}
                disabled={!addFile || adding}
                onClick={handleAddArtifact}
              >
                {adding ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                className={secondaryBtnClasses}
                onClick={() => {
                  setShowAddForm(false);
                  setAddFile(null);
                  setAddNote("");
                  setAddType(ARTIFACT_TYPES[0]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <h3 className="text-sm font-semibold font-body text-charcoal">
            No artifacts yet
          </h3>
          <p className="text-sm text-stone font-body mt-2">
            Add your first artifact to start managing project documents.
          </p>
          <button
            type="button"
            className={`${ctaClasses} mt-4`}
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={16} /> Add Artifact
          </button>
        </div>
      )}

      {/* Card Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const currentVersion = getCurrentVersion(item);
            const isExpanded = expandedKey === item._key;
            const isProposal = item.artifactType === "proposal";

            return (
              <div
                key={item._key}
                className={`bg-cream-dark border border-stone-light/20 rounded-lg transition-colors ${
                  isProposal ? "md:col-span-2" : ""
                } ${isExpanded ? "p-6" : "p-4 cursor-pointer hover:border-stone-light/40"}`}
              >
                {/* Card Header */}
                <div
                  className="flex items-center justify-between"
                  onClick={() =>
                    isExpanded
                      ? setExpandedKey(null)
                      : setExpandedKey(item._key)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs tracking-wide ${getArtifactBadgeStyle(item.artifactType)}`}
                    >
                      {getArtifactLabel(
                        item.artifactType,
                        item.customTypeName,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded && (
                      <button
                        type="button"
                        className="text-stone-light hover:text-red-600 transition-colors"
                        aria-label="Remove artifact"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmRemove({
                            key: item._key,
                            label: getArtifactLabel(
                              item.artifactType,
                              item.customTypeName,
                            ),
                          });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-stone-light" />
                    ) : (
                      <ChevronDown size={16} className="text-stone-light" />
                    )}
                  </div>
                </div>

                {/* Collapsed Content */}
                {!isExpanded && (
                  <>
                    <p className="text-sm font-body text-charcoal mt-2 truncate">
                      {currentVersion?.file?.asset?.originalFilename ||
                        "No file"}
                    </p>
                    <p className="text-xs text-stone font-body mt-1">
                      {item.versions.length} version
                      {item.versions.length !== 1 ? "s" : ""} - Updated{" "}
                      {format(
                        new Date(currentVersion?.uploadedAt || Date.now()),
                        "MMM d, yyyy",
                      )}
                    </p>
                  </>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4">
                    {/* Upload Section */}
                    <div className="border-b border-stone-light/20 pb-4 mb-4">
                      <label className="border-2 border-dashed border-stone-light/30 rounded-lg p-4 text-center hover:border-terracotta/50 transition-colors block cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            setUploadFile(e.target.files?.[0] || null)
                          }
                        />
                        <Upload
                          size={24}
                          className="text-stone-light mx-auto mb-2"
                        />
                        <span className="text-xs text-stone font-body">
                          {uploadFile
                            ? uploadFile.name
                            : "Click or drag to upload a file"}
                        </span>
                      </label>
                      <div className="flex items-center gap-3 mt-3">
                        <input
                          type="text"
                          placeholder="Optional note"
                          className={inputClasses}
                          value={uploadNote}
                          onChange={(e) => setUploadNote(e.target.value)}
                        />
                        <button
                          type="button"
                          className={`${ctaClasses} shrink-0 ${uploading ? "animate-pulse" : ""}`}
                          disabled={!uploadFile || uploading}
                          onClick={() => handleUploadVersion(item._key)}
                        >
                          {uploading ? "Uploading..." : "Upload Version"}
                        </button>
                      </div>
                    </div>

                    {/* Contract Signed File Upload */}
                    {item.artifactType === "contract" && (
                      <div className="border-b border-stone-light/20 pb-4 mb-4">
                        <h4 className="text-xs uppercase tracking-widest text-stone font-body mb-3">
                          Upload Signed Contract
                        </h4>
                        {isContractSigned(item) && (
                          <p className="text-xs text-emerald-700 font-body mb-2">
                            Signed contract uploaded:{" "}
                            {item.signedFile?.asset?.originalFilename ||
                              "File"}
                          </p>
                        )}
                        <label className="border-2 border-dashed border-stone-light/30 rounded-lg p-4 text-center hover:border-terracotta/50 transition-colors block cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              setSignedFile(e.target.files?.[0] || null)
                            }
                          />
                          <Upload
                            size={24}
                            className="text-stone-light mx-auto mb-2"
                          />
                          <span className="text-xs text-stone font-body">
                            {signedFile
                              ? signedFile.name
                              : "Click or drag to upload signed contract"}
                          </span>
                        </label>
                        {signedFile && (
                          <button
                            type="button"
                            className={`${ctaClasses} mt-3 ${uploadingSigned ? "animate-pulse" : ""}`}
                            disabled={uploadingSigned}
                            onClick={() => handleUploadSigned(item._key)}
                          >
                            {uploadingSigned
                              ? "Uploading..."
                              : "Upload Signed Contract"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Version History */}
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-widest text-stone font-body mb-3">
                        Version History
                      </h4>
                      {[...item.versions]
                        .sort(
                          (a, b) =>
                            new Date(b.uploadedAt).getTime() -
                            new Date(a.uploadedAt).getTime(),
                        )
                        .map((version) => {
                          const isCurrent =
                            version._key === item.currentVersionKey ||
                            (!item.currentVersionKey &&
                              version ===
                                item.versions[item.versions.length - 1]);

                          return (
                            <div
                              key={version._key}
                              className={
                                isCurrent
                                  ? "border-l-4 border-l-terracotta pl-3"
                                  : "opacity-60 pl-3"
                              }
                            >
                              <p className="text-sm font-body text-charcoal truncate">
                                {version.file?.asset?.originalFilename ||
                                  "File"}
                              </p>
                              <p className="text-xs text-stone font-body">
                                {format(
                                  new Date(version.uploadedAt),
                                  "MMM d, yyyy",
                                )}
                              </p>
                              {version.note && (
                                <p className="text-xs text-stone font-body italic">
                                  {version.note}
                                </p>
                              )}
                              {!isCurrent && (
                                <button
                                  type="button"
                                  className="text-xs text-terracotta hover:text-terracotta-light font-body transition-colors mt-1"
                                  onClick={() =>
                                    handleSetCurrent(item._key, version._key)
                                  }
                                >
                                  Set as Current
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Decision Log Timeline */}
                    {item.decisionLog && item.decisionLog.length > 0 && (
                      <div className="border-t border-stone-light/20 pt-4 mt-4">
                        <h4 className="text-xs uppercase tracking-widest text-stone font-body mb-3">
                          Activity Log
                        </h4>
                        <div className="space-y-2">
                          {[...item.decisionLog]
                            .sort(
                              (a, b) =>
                                new Date(b.timestamp).getTime() -
                                new Date(a.timestamp).getTime(),
                            )
                            .map((entry) => (
                              <div
                                key={entry._key}
                                className="flex items-start gap-2"
                              >
                                {getActionIcon(entry.action)}
                                <div>
                                  <p className="text-xs font-body">
                                    {getActionLabel(entry)}
                                    <span className="text-xs text-stone-light font-body ml-1">
                                      {format(
                                        new Date(entry.timestamp),
                                        "MMM d, yyyy 'at' h:mm a",
                                      )}
                                    </span>
                                  </p>
                                  {entry.feedback && (
                                    <p className="text-xs text-stone font-body mt-1 pl-2 border-l-2 border-stone-light/20">
                                      {entry.feedback}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Remove Artifact Confirmation Dialog */}
      {confirmRemove && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setConfirmRemove(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-auto">
              <h3 className="text-sm font-semibold font-body text-charcoal">
                Remove {confirmRemove.label}?
              </h3>
              <p className="text-sm text-stone font-body mt-2">
                This artifact and all its versions will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  className={secondaryBtnClasses}
                  onClick={() => setConfirmRemove(null)}
                >
                  Keep Artifact
                </button>
                <button
                  type="button"
                  className="bg-red-600 text-white text-xs uppercase tracking-widest font-body px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  onClick={handleRemoveArtifact}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
