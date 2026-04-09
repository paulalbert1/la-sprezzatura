import { useState, useRef } from "react";
import { X } from "lucide-react";

interface PortfolioEditFormProps {
  project: {
    _id: string;
    title: string;
    portfolioTitle?: string;
    portfolioDescription?: string;
    portfolioImage?: { asset?: { url: string } } | null;
    heroImage?: { asset?: { url: string } };
    portfolioRoomTags?: string[];
  };
}

export default function PortfolioEditForm({ project }: PortfolioEditFormProps) {
  const [portfolioTitle, setPortfolioTitle] = useState(project.portfolioTitle || "");
  const [description, setDescription] = useState(project.portfolioDescription || "");
  const [roomTags, setRoomTags] = useState<string[]>(project.portfolioRoomTags || []);
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState(
    project.portfolioImage?.asset?.url || project.heroImage?.asset?.url || "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const descriptionError = description.length > 500 ? "Description must be under 500 characters" : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (descriptionError) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          projectId: project._id,
          portfolioTitle: portfolioTitle || undefined,
          portfolioDescription: description || undefined,
          portfolioRoomTags: roomTags,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "upload-image");
      formData.append("projectId", project._id);

      const uploadRes = await fetch("/api/admin/portfolio", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error();
      const uploadData = await uploadRes.json();

      if (uploadData.imageAssetId) {
        // Now update the project with the new image asset
        const updateRes = await fetch("/api/admin/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            projectId: project._id,
            imageAssetId: uploadData.imageAssetId,
          }),
        });
        if (!updateRes.ok) throw new Error();
      }

      // Update preview with the uploaded image URL
      if (uploadData.url) {
        setImageUrl(uploadData.url);
      }
    } catch {
      setError("File upload failed. Check file size and try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !roomTags.includes(tag)) {
        setRoomTags([...roomTags, tag]);
      }
      setTagInput("");
    }
  }

  function handleRemoveTag(tag: string) {
    setRoomTags(roomTags.filter((t) => t !== tag));
  }

  async function handleRemoveFromPortfolio() {
    setRemoving(true);
    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          projectId: project._id,
        }),
      });
      if (!res.ok) throw new Error();
      window.location.href = "/admin/portfolio";
    } catch {
      setError("Could not save changes. Please try again.");
      setRemoving(false);
      setShowRemoveConfirm(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-stone-light/40 p-6">
        {/* Display Title */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block font-body">
            Display Title (optional)
          </label>
          <input
            type="text"
            value={portfolioTitle}
            onChange={(e) => setPortfolioTitle(e.target.value)}
            placeholder={project.title}
            className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
          />
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block font-body">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`text-sm font-body text-charcoal bg-white border rounded-lg px-3 py-2 w-full min-h-[100px] resize-y focus:ring-1 outline-none ${
              descriptionError
                ? "border-red-500 ring-1 ring-red-500"
                : "border-stone-light/40 focus:ring-terracotta focus:border-terracotta"
            }`}
          />
          <div className="flex justify-between mt-1">
            {descriptionError && (
              <span className="text-xs text-red-600 font-body">{descriptionError}</span>
            )}
            <span className="text-xs text-stone-light font-body ml-auto">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block font-body">
            Featured Image
          </label>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Portfolio featured image"
              className="w-full max-w-sm aspect-[4/3] rounded-lg object-cover bg-cream mb-3"
            />
          ) : (
            <div className="w-full max-w-sm aspect-[4/3] rounded-lg bg-cream mb-3 flex items-center justify-center">
              <span className="text-sm text-stone font-body">No image</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-terracotta border border-terracotta/30 rounded-lg px-3 py-1.5 hover:bg-terracotta/5 transition-colors font-body disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Change Image"}
          </button>
        </div>

        {/* Room Tags */}
        <div className="mb-6">
          <label className="text-[11px] font-semibold text-stone uppercase tracking-wider mb-1 block font-body">
            Room Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {roomTags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-body bg-cream-dark text-charcoal px-2 py-1 rounded-full inline-flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-stone hover:text-charcoal"
                  aria-label={`Remove ${tag}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter"
            className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
          />
        </div>

        {/* Save button and feedback */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !!descriptionError}
            className="bg-terracotta text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:bg-terracotta/50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && (
            <span className="text-emerald-600 text-xs font-body">Saved</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 text-xs text-red-600 font-body">{error}</div>
        )}
      </form>

      {/* Remove from Portfolio */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowRemoveConfirm(true)}
          className="text-sm text-red-600 hover:text-red-700 font-body"
        >
          Remove from Portfolio
        </button>
      </div>

      {/* Remove confirmation dialog */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-charcoal/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
            <h3 className="text-sm font-semibold font-body text-charcoal mb-2">
              Remove from Portfolio
            </h3>
            <p className="text-sm text-stone font-body mb-6">
              Remove {project.portfolioTitle || project.title} from the public portfolio? The project and its portfolio settings will be preserved.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="text-sm text-stone hover:text-charcoal px-4 py-2 rounded-lg border border-stone-light/40 font-body"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveFromPortfolio}
                disabled={removing}
                className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-body disabled:opacity-50"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
