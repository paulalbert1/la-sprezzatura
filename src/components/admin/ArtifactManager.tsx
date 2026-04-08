import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  FileText,
  ChevronDown,
  Download,
  RefreshCw,
  Plus,
} from "lucide-react";
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

function normalizeArtifact(a: Artifact): Artifact {
  return {
    ...a,
    versions: a.versions || [],
    decisionLog: a.decisionLog || [],
    notes: a.notes || [],
  };
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Version Row (inside expanded history) ---
function VersionRow({
  ver,
  isCurrent,
  isLast,
}: {
  ver: ArtifactVersion;
  isCurrent: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 hover:bg-cream transition-colors ${
        !isLast ? "border-b border-stone-light/10" : ""
      }`}
    >
      <span
        className={`text-[10px] font-bold font-body px-1.5 py-0.5 rounded min-w-[28px] text-center ${
          isCurrent ? "text-charcoal bg-stone-light/15" : "text-stone-light"
        }`}
      >
        v{ver._key?.slice(0, 3) || "?"}
      </span>
      <FileText size={14} className="text-stone-light shrink-0" />
      <span
        className={`flex-1 text-xs font-body truncate ${
          isCurrent ? "text-stone" : "text-stone-light"
        }`}
      >
        {ver.file?.asset?.originalFilename || "File"}
      </span>
      <span className="text-[11px] text-stone-light font-body shrink-0">
        {formatFileSize(ver.file?.asset?.size || 0)}
      </span>
      <span className="text-[11px] text-stone-light font-body shrink-0 min-w-[72px]">
        {format(new Date(ver.uploadedAt), "MMM d, yyyy")}
      </span>
      {ver.file?.asset?.url && (
        <a
          href={ver.file.asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-light hover:text-stone transition-colors shrink-0"
        >
          <Download size={13} />
        </a>
      )}
    </div>
  );
}

// --- Document Row (single instance within a bucket) ---
function DocRow({
  artifact,
  typeKey,
  projectId,
  onUploadVersion,
  onRename,
}: {
  artifact: Artifact;
  typeKey: string;
  projectId: string;
  onUploadVersion: (artifactKey: string) => void;
  onRename: (artifactKey: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(artifact.customTypeName || "");
  const cv = getCurrentVersion(artifact);
  const hasFile = !!cv?.file?.asset?.url;
  const olderVersions = artifact.versions.length > 1;
  const displayName =
    artifact.customTypeName ||
    cv?.file?.asset?.originalFilename ||
    ARTIFACT_LABELS[typeKey] || "Untitled";

  function handleSaveName() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== artifact.customTypeName) {
      onRename(artifact._key, trimmed);
    }
    setEditing(false);
  }

  return (
    <div className="border-b border-stone-light/10 last:border-b-0">
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-cream-dark/50 transition-colors group"
        onClick={() => olderVersions && setExpanded(!expanded)}
      >
        <FileText size={16} className="text-stone-light shrink-0" />
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              type="text"
              className="text-sm font-medium font-body text-charcoal bg-transparent border-b border-terracotta outline-none w-full py-0"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") setEditing(false);
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div
              className="text-sm font-medium font-body text-charcoal truncate hover:text-terracotta transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setEditName(artifact.customTypeName || "");
                setEditing(true);
              }}
              title="Click to rename"
            >
              {displayName}
            </div>
          )}
          <div className="text-[11px] text-stone-light font-body">
            {hasFile ? (
              <>
                {cv!.file.asset.originalFilename} · v{artifact.versions.length} ·{" "}
                {format(new Date(cv!.uploadedAt), "MMM d, yyyy")}
              </>
            ) : (
              "No file uploaded"
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="text-[11px] text-stone font-body px-2.5 py-1 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onUploadVersion(artifact._key);
            }}
          >
            Upload new version
          </button>
          {hasFile && (
            <a
              href={cv!.file.asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone font-body px-2 py-1 border border-stone-light/20 rounded-md hover:bg-stone-light/10 transition-colors inline-flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={13} />
            </a>
          )}
        </div>

        {/* Version count + chevron */}
        {olderVersions && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-light font-body">
              {artifact.versions.length}v
            </span>
            <ChevronDown
              size={14}
              className={`text-stone-light transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Version history panel */}
      {expanded && olderVersions && (
        <div className="mx-4 mb-3 rounded-lg border border-stone-light/10 bg-cream-dark/30 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-stone-light font-body uppercase tracking-wider border-b border-stone-light/10">
            Version History
          </div>
          {[...artifact.versions]
            .sort(
              (a, b) =>
                new Date(b.uploadedAt).getTime() -
                new Date(a.uploadedAt).getTime(),
            )
            .map((ver, i) => (
              <VersionRow
                key={ver._key}
                ver={ver}
                isCurrent={i === 0}
                isLast={i === artifact.versions.length - 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// --- Type Bucket ---
function TypeBucket({
  typeKey,
  label,
  instances,
  projectId,
  dragOver,
  uploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddNew,
  onUploadVersion,
  onRename,
}: {
  typeKey: string;
  label: string;
  instances: Artifact[];
  projectId: string;
  dragOver: boolean;
  uploading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onAddNew: () => void;
  onUploadVersion: (artifactKey: string) => void;
  onRename: (artifactKey: string, name: string) => void;
}) {
  const count = instances.length;
  const [expanded, setExpanded] = useState(count > 0);
  const latestDate =
    count > 0
      ? instances
          .flatMap((a) => a.versions)
          .sort(
            (a, b) =>
              new Date(b.uploadedAt).getTime() -
              new Date(a.uploadedAt).getTime(),
          )[0]?.uploadedAt
      : null;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`rounded-xl border overflow-hidden transition-all bg-white ${
        dragOver
          ? "border-2 border-dashed border-terracotta"
          : "border-stone-light/20"
      }`}
    >
      {/* Bucket header */}
      <div
        className={`flex items-center gap-3 px-5 py-4 cursor-pointer select-none ${
          expanded && count > 0 ? "border-b border-stone-light/10" : ""
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold tracking-wide ${getArtifactBadgeStyle(typeKey)}`}
        >
          {label}
        </span>
        <span className="flex-1" />
        <span className="text-xs text-stone-light font-body">
          {count === 0
            ? "No documents"
            : `${count} document${count !== 1 ? "s" : ""}`}
        </span>
        {latestDate && (
          <span className="text-[11px] text-stone-light/60 font-body">
            · {format(new Date(latestDate), "MMM d, yyyy")}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-stone-light transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Document list + add button */}
      {expanded && (
        <div>
          {instances.map((artifact) => (
            <DocRow
              key={artifact._key}
              artifact={artifact}
              typeKey={typeKey}
              projectId={projectId}
              onUploadVersion={onUploadVersion}
              onRename={onRename}
            />
          ))}

          {/* Add new document */}
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <RefreshCw size={14} className="text-terracotta animate-spin" />
              <span className="text-xs text-stone font-body">Uploading...</span>
            </div>
          ) : (
            <div
              className={`flex items-center justify-center gap-1.5 cursor-pointer text-stone-light hover:text-stone transition-colors font-body text-xs ${
                count > 0 ? "py-3" : "py-6"
              }`}
              onClick={onAddNew}
            >
              <Plus size={14} strokeWidth={1.5} />
              <span>Add {label.toLowerCase()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export default function ArtifactManager({
  artifacts: initialArtifacts,
  projectId,
}: ArtifactManagerProps) {
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

  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{
    type: string;
    artifactKey?: string;
  } | null>(null);

  const totalDocs = Object.values(docsByType).flat().length;
  const totalVersions = Object.values(docsByType)
    .flat()
    .reduce((sum, a) => sum + a.versions.length, 0);

  async function uploadFile(
    typeKey: string,
    file: File,
    artifactKey?: string,
  ) {
    setUploading(artifactKey ? `${typeKey}:${artifactKey}` : typeKey);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      if (artifactKey) {
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
        formData.append("action", "add");
        formData.append("type", typeKey);
        formData.append("note", "");
        const res = await fetch("/api/admin/artifact-crud", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        setDocsByType((prev) => ({
          ...prev,
          [typeKey]: [
            ...prev[typeKey],
            {
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
          ],
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
    if (file && target) uploadFile(target.type, file, target.artifactKey);
    e.target.value = "";
  }

  function handleDrop(typeKey: string, e: React.DragEvent) {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(typeKey, file);
  }

  async function handleRename(artifactKey: string, name: string) {
    // Find which type this artifact belongs to
    const typeKey = Object.keys(docsByType).find((t) =>
      docsByType[t].some((a) => a._key === artifactKey),
    );
    if (!typeKey) return;

    // Optimistic update
    setDocsByType((prev) => ({
      ...prev,
      [typeKey]: prev[typeKey].map((a) =>
        a._key === artifactKey ? { ...a, customTypeName: name } : a,
      ),
    }));

    // Save to Sanity
    try {
      const res = await fetch("/api/admin/artifact-crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          projectId,
          artifactKey,
          customTypeName: name,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Rename failed");
      }
    } catch (err: any) {
      setError(err.message || "Rename failed");
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="flex justify-between items-baseline mb-8">
        <h2 className="text-2xl font-heading font-normal text-charcoal">
          Documents
        </h2>
        {totalDocs > 0 && (
          <span className="text-xs text-stone-light font-body">
            {totalDocs} document{totalDocs !== 1 ? "s" : ""} · {totalVersions}{" "}
            total version{totalVersions !== 1 ? "s" : ""}
          </span>
        )}
      </div>

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

      <div className="flex flex-col gap-4">
        {ARTIFACT_TYPES.map((typeKey) => (
          <TypeBucket
            key={typeKey}
            typeKey={typeKey}
            label={ARTIFACT_LABELS[typeKey] || typeKey}
            instances={docsByType[typeKey] || []}
            projectId={projectId}
            dragOver={dragOver === typeKey}
            uploading={uploading === typeKey}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(typeKey);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(typeKey, e)}
            onAddNew={() => triggerFilePicker(typeKey)}
            onUploadVersion={(artifactKey) =>
              triggerFilePicker(typeKey, artifactKey)
            }
            onRename={handleRename}
          />
        ))}
      </div>
    </div>
  );
}
