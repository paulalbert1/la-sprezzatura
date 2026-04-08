import { useState, useRef } from "react";
import { format } from "date-fns";
import { Download, RefreshCw, FileText, Plus } from "lucide-react";
import {
  type Artifact,
  ARTIFACT_TYPES,
  ARTIFACT_LABELS,
  getCurrentVersion,
  getArtifactBadgeStyle,
} from "../../lib/artifactUtils";

interface ArtifactManagerProps {
  artifacts: Artifact[];
  projectId: string;
  projectTitle: string;
}

function normalizeArtifact(a: Artifact): Artifact {
  return {
    ...a,
    versions: a.versions || [],
    decisionLog: a.decisionLog || [],
    notes: a.notes || [],
  };
}

export default function ArtifactManager({
  artifacts: initialArtifacts,
  projectId,
}: ArtifactManagerProps) {
  // Group artifacts by type — each type can have multiple instances
  const [docsByType, setDocsByType] = useState<Record<string, Artifact[]>>(
    () => {
      const map: Record<string, Artifact[]> = {};
      for (const type of ARTIFACT_TYPES) {
        map[type] = (initialArtifacts || [])
          .filter((a) => a.artifactType === type)
          .map(normalizeArtifact);
      }
      return map;
    },
  );

  const [dragOver, setDragOver] = useState<string | null>(null); // "type" or "type:_key"
  const [uploading, setUploading] = useState<string | null>(null); // "type" or "type:_key"
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // uploadTarget: { type, artifactKey? } — if artifactKey present, it's a Replace
  const uploadTargetRef = useRef<{
    type: string;
    artifactKey?: string;
  } | null>(null);

  // --- Upload: new instance or new version ---
  async function uploadFile(
    typeKey: string,
    file: File,
    artifactKey?: string,
  ) {
    const loadingId = artifactKey ? `${typeKey}:${artifactKey}` : typeKey;
    setUploading(loadingId);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      if (artifactKey) {
        // Replace: new version on existing instance
        formData.append("action", "upload");
        formData.append("artifactKey", artifactKey);
        formData.append("note", "");
        const res = await fetch("/api/admin/artifact-version", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        setDocsByType((prev) => ({
          ...prev,
          [typeKey]: prev[typeKey].map((a) =>
            a._key === artifactKey
              ? {
                  ...a,
                  currentVersionKey: data.versionKey,
                  versions: [
                    ...a.versions,
                    {
                      _key: data.versionKey,
                      file: {
                        asset: {
                          url: data.assetUrl,
                          originalFilename: file.name,
                          mimeType: file.type,
                          size: file.size,
                        },
                      },
                      uploadedAt: new Date().toISOString(),
                    },
                  ],
                }
              : a,
          ),
        }));
      } else {
        // New instance
        formData.append("action", "add");
        formData.append("type", typeKey);
        formData.append("note", "");
        const res = await fetch("/api/admin/artifact-crud", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        const newArtifact: Artifact = {
          _key: data.artifactKey,
          artifactType: typeKey,
          currentVersionKey: data.versionKey,
          versions: [
            {
              _key: data.versionKey,
              file: {
                asset: {
                  url: data.assetUrl || "",
                  originalFilename: file.name,
                  mimeType: file.type,
                  size: file.size,
                },
              },
              uploadedAt: new Date().toISOString(),
            },
          ],
          decisionLog: [],
          notes: [],
        };

        setDocsByType((prev) => ({
          ...prev,
          [typeKey]: [...prev[typeKey], newArtifact],
        }));
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function triggerFilePicker(typeKey: string, artifactKey?: string) {
    uploadTargetRef.current = { type: typeKey, artifactKey };
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = uploadTargetRef.current;
    if (file && target) {
      uploadFile(target.type, file, target.artifactKey);
    }
    e.target.value = "";
  }

  function handleDrop(
    typeKey: string,
    e: React.DragEvent,
    artifactKey?: string,
  ) {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(typeKey, file, artifactKey);
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      <h2 className="text-2xl font-heading font-normal text-charcoal mb-8">
        Documents
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-xs text-red-600 font-body">{error}</p>
          <button
            type="button"
            className="text-xs text-red-600 underline font-body"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-6">
        {ARTIFACT_TYPES.map((typeKey) => {
          const instances = docsByType[typeKey] || [];
          const label = ARTIFACT_LABELS[typeKey] || typeKey;
          const isEmpty = instances.length === 0;
          const addDragId = typeKey;
          const isAddDragTarget = dragOver === addDragId;
          const isAddUploading = uploading === typeKey;

          return (
            <div key={typeKey}>
              {/* Type header */}
              <h3 className="text-xs uppercase tracking-widest text-stone font-body mb-3">
                {label}
              </h3>

              {/* Cards row */}
              <div className="flex flex-wrap gap-3">
                {/* Existing instance cards */}
                {instances.map((artifact) => {
                  const cv = getCurrentVersion(artifact);
                  const hasFile = !!cv?.file?.asset?.url;
                  const cardDragId = `${typeKey}:${artifact._key}`;
                  const isCardDrag = dragOver === cardDragId;
                  const isCardUploading = uploading === cardDragId;

                  return (
                    <div
                      key={artifact._key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(cardDragId);
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) =>
                        handleDrop(typeKey, e, artifact._key)
                      }
                      className={`rounded-xl border p-4 w-72 flex flex-col transition-all ${
                        isCardDrag
                          ? "border-2 border-dashed border-terracotta bg-terracotta/5"
                          : "border-stone-light/20 bg-white"
                      }`}
                    >
                      {isCardUploading ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw
                            size={18}
                            className="text-terracotta animate-spin"
                          />
                          <span className="text-xs text-stone font-body ml-2">
                            Uploading...
                          </span>
                        </div>
                      ) : hasFile ? (
                        <>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                              <FileText
                                size={16}
                                className="text-terracotta"
                              />
                            </div>
                            <a
                              href={cv!.file.asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-body text-terracotta hover:text-terracotta-light transition-colors truncate"
                            >
                              {cv!.file.asset.originalFilename || "Download"}
                            </a>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-stone-light font-body">
                              {artifact.versions.length} version
                              {artifact.versions.length !== 1 ? "s" : ""} ·{" "}
                              {format(
                                new Date(cv!.uploadedAt),
                                "MMM d, yyyy",
                              )}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="text-xs text-stone hover:text-charcoal font-body px-2 py-1 rounded-md hover:bg-stone-light/10 transition-colors"
                                onClick={() =>
                                  triggerFilePicker(typeKey, artifact._key)
                                }
                              >
                                Replace
                              </button>
                              <a
                                href={cv!.file.asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-stone hover:text-charcoal font-body px-2 py-1 rounded-md hover:bg-stone-light/10 transition-colors inline-flex items-center"
                              >
                                <Download size={13} />
                              </a>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center py-4 text-xs text-stone-light font-body">
                          No file
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add card — always visible */}
                <div
                  onClick={
                    !isAddUploading
                      ? () => triggerFilePicker(typeKey)
                      : undefined
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(addDragId);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(typeKey, e)}
                  className={`rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isAddDragTarget
                      ? "border-2 border-dashed border-terracotta bg-terracotta/5"
                      : "border-dashed border-stone-light/30 hover:border-stone-light/50"
                  } ${isEmpty ? "w-72 min-h-[88px]" : "w-28 min-h-[88px]"}`}
                >
                  {isAddUploading ? (
                    <RefreshCw
                      size={18}
                      className="text-terracotta animate-spin"
                    />
                  ) : isAddDragTarget ? (
                    <>
                      <span className="text-lg text-terracotta/50">↑</span>
                      <span className="text-xs text-stone font-body">
                        Drop here
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="text-stone-light/50" />
                      {isEmpty && (
                        <span className="text-xs text-stone-light font-body mt-1">
                          Click or drag to add
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
