import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface Props {
  title: string;
  projectId: string;
}

export default function EditableTitle({ title, projectId }: Props) {
  const [value, setValue] = useState(title);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-title", projectId, title: trimmed }),
      });
      if (!res.ok) throw new Error();
      setValue(trimmed);
      setEditing(false);
    } catch {
      setValue(title);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      setValue(title);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          disabled={saving}
          className="text-xl font-semibold text-charcoal bg-white border border-stone-light/30 rounded-md px-2 py-1 focus:border-stone-light focus:outline-none"
          style={{ fontFamily: "var(--font-body)" }}
        />
        {saving && <Loader2 className="w-4 h-4 animate-spin text-stone-light" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 text-left"
      aria-label="Edit project name"
    >
      <h1
        className="text-xl font-semibold text-charcoal"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {value}
      </h1>
      <Pencil className="w-3.5 h-3.5 text-stone-light opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
