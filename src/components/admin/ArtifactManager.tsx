import { useState, useRef } from "react";
import { format } from "date-fns";
import { Download, RefreshCw, FileText } from "lucide-react";
import {
  type Artifact,
  type ArtifactVersion,
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

export default function ArtifactManager({
  artifacts: initialArtifacts,
  projectId,
}: ArtifactManagerProps) {
  const [docs, setDocs] = useState<Record<string, Artifact | null>>(() => {
    const map: Record<string, Artifact | null> = {};
    for (const type of ARTIFACT_TYPES) {
      const found = (initialArtifacts || []).find(
        (a) => a.artifactType === type,
      );
      map[type] = found
        ? { ...found, versions: found.versions || [], decisionLog: found.decisionLog || [], notes: found.notes || [] }
        : null;
    }
    return map;
  });

  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  async function uploadFile(typeKey: string, file: File) {
    setUploading(typeKey);
    setError(null);

    const existing = docs[typeKey];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      if (existing) {
        // Replace: upload new version to existing artifact
        formData.append("action", "upload");
        formData.append("artifactKey", existing._key);
        formData.append("note", "");
        const res = await fetch("/api/admin/artifact-version", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        setDocs((prev) => ({
          ...prev,
          [typeKey]: {
            ...existing,
            currentVersionKey: data.versionKey,
            versions: [
              ...existing.versions,
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
          },
        }));
      } else {
        // New: create artifact with first file
        formData.append("action", "add");
        formData.append("type", typeKey);
        formData.append("note", "");
        const res = await fetch("/api/admin/artifact-crud", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        setDocs((prev) => ({
          ...prev,
          [typeKey]: {
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
          },
        }));
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function handleCardClick(typeKey: string) {
    uploadTargetRef.current = typeKey;
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = uploadTargetRef.current;
    if (file && target) {
      uploadFile(target, file);
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(typeKey: string, e: React.DragEvent) {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(typeKey, file);
  }

  return (
    <div>
      {/* Hidden file input shared by all cards */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ARTIFACT_TYPES.map((typeKey) => {
          const artifact = docs[typeKey];
          const currentVersion = artifact ? getCurrentVersion(artifact) : null;
          const hasFile = !!currentVersion?.file?.asset?.url;
          const isDragTarget = dragOver === typeKey;
          const isUploading = uploading === typeKey;
          const label = ARTIFACT_LABELS[typeKey] || typeKey;

          return (
            <div
              key={typeKey}
              onClick={!hasFile && !isUploading ? () => handleCardClick(typeKey) : undefined}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(typeKey);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(typeKey, e)}
              className={`rounded-xl border transition-all min-h-[120px] flex flex-col ${
                isDragTarget
                  ? "border-2 border-dashed border-terracotta bg-terracotta/5"
                  : "border-stone-light/20 bg-white"
              } ${!hasFile && !isUploading ? "cursor-pointer hover:border-stone-light/40" : ""} p-5`}
            >
              {/* Type badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold tracking-wide border ${
                    hasFile
                      ? `${getArtifactBadgeStyle(typeKey)} border-current/20`
                      : "bg-stone-light/10 text-stone-light border-stone-light/20"
                  }`}
                >
                  {label}
                </span>
              </div>

              {isUploading ? (
                /* Uploading state */
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={20} className="text-terracotta animate-spin" />
                  <span className="text-xs text-stone font-body">Uploading...</span>
                </div>
              ) : hasFile ? (
                /* File exists */
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-terracotta" />
                    </div>
                    <a
                      href={currentVersion!.file.asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-body text-terracotta hover:text-terracotta-light transition-colors truncate"
                    >
                      {currentVersion!.file.asset.originalFilename || "Download"}
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-stone-light font-body">
                      {artifact!.versions.length} version
                      {artifact!.versions.length !== 1 ? "s" : ""} · Updated{" "}
                      {format(new Date(currentVersion!.uploadedAt), "MMM d, yyyy")}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="text-xs text-stone hover:text-charcoal font-body px-2 py-1 rounded-md hover:bg-stone-light/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(typeKey);
                        }}
                      >
                        Replace
                      </button>
                      <a
                        href={currentVersion!.file.asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-stone hover:text-charcoal font-body px-2 py-1 rounded-md hover:bg-stone-light/10 transition-colors inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              ) : isDragTarget ? (
                /* Drop target active */
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <span className="text-lg text-terracotta/50">↑</span>
                  <span className="text-xs text-stone font-body">Drop file here</span>
                </div>
              ) : (
                /* Empty — click to upload */
                <div className="flex-1 flex flex-col items-center justify-center gap-1">
                  <span className="text-xl text-stone-light/50">+</span>
                  <span className="text-xs text-stone-light font-body">Click or drag to add</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
