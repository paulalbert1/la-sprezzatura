import { useState } from "react";
import { format, parseISO } from "date-fns";
import { isTaskOverdue } from "../../lib/dashboardUtils";

interface Item {
  _key: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface Props {
  items: Item[];
  projectId: string;
}

export default function ClientActionItemsList({ items, projectId }: Props) {
  const [local, setLocal] = useState<Item[]>(items);
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleToggle(item: Item) {
    const nextCompleted = !item.completed;
    setLocal((prev) =>
      prev.map((i) =>
        i._key === item._key
          ? {
              ...i,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : null,
            }
          : i,
      ),
    );
    try {
      const res = await fetch("/api/admin/client-action-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          projectId,
          itemKey: item._key,
          completed: nextCompleted,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLocal((prev) =>
        prev.map((i) =>
          i._key === item._key
            ? { ...i, completed: item.completed, completedAt: item.completedAt }
            : i,
        ),
      );
      flashError("Could not update action item.");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const desc = newDescription.trim();
    if (!desc) {
      flashError("Description is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/client-action-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId,
          description: desc,
          ...(newDueDate && { dueDate: newDueDate }),
        }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setLocal((prev) => [
        {
          _key: result.itemKey,
          description: desc,
          dueDate: newDueDate || null,
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewDescription("");
      setNewDueDate("");
    } catch {
      flashError("Could not create action item.");
    } finally {
      setCreating(false);
    }
  }

  function flashError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  }

  const cardStyle = {
    backgroundColor: "#FFFEFB",
    border: "0.5px solid #E8DDD0",
    borderRadius: "10px",
    padding: "18px 20px",
  } as const;

  const titleStyle = {
    fontFamily: "var(--font-sans)",
    fontSize: "10.5px",
    fontWeight: 500,
    color: "#9E8E80",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  };

  return (
    <div id="client-action-items" style={cardStyle}>
      <div
        className="flex items-center justify-between mb-[14px] pb-[10px]"
        style={{ borderBottom: "0.5px solid #E8DDD0" }}
      >
        <h2 style={titleStyle}>Client Action Items</h2>
      </div>

      {local.length === 0 ? (
        <p
          className="py-4 text-center"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12.5px",
            color: "#9E8E80",
          }}
        >
          No action items yet.
        </p>
      ) : (
        <div>
          {local.map((item) => {
            const overdue = isTaskOverdue(item);
            const labelColor = item.completed
              ? "#9E8E80"
              : overdue
                ? "#9B3A2A"
                : "#2C2520";
            const dateColor =
              overdue && !item.completed ? "#9B3A2A" : "#9E8E80";
            return (
              <div
                key={item._key}
                className="flex items-center gap-[10px] py-[7px]"
                style={{ borderBottom: "0.5px solid #E8DDD0" }}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggle(item)}
                  aria-label={item.description}
                  className="shrink-0 cursor-pointer"
                  style={{
                    width: "14px",
                    height: "14px",
                    accentColor: "#9A7B4B",
                  }}
                />
                <span
                  className="flex-1"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "12.5px",
                    color: labelColor,
                    textDecoration: item.completed ? "line-through" : "none",
                  }}
                >
                  {item.description}
                </span>
                {item.dueDate && (
                  <span
                    className="shrink-0 tabular-nums"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11.5px",
                      color: dateColor,
                      fontWeight: overdue && !item.completed ? 500 : 400,
                    }}
                  >
                    {format(parseISO(item.dueDate), "MMM d")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="flex items-center gap-2 pt-[8px]"
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "#9E8E80",
          }}
        >
          +
        </span>
        <input
          type="text"
          placeholder="Add an action item"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          disabled={creating}
          className="flex-1 bg-transparent outline-none"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "#2C2520",
          }}
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="rounded-md px-2 py-1"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            color: "#6B5E52",
            backgroundColor: "transparent",
            border: "0.5px solid #E8DDD0",
          }}
        />
      </form>

      {error && (
        <div
          className="mt-2"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            color: "#9B3A2A",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
