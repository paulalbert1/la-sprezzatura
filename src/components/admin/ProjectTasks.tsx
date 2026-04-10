import { useState } from "react";
import { format, parseISO } from "date-fns";
import { isTaskOverdue } from "../../lib/dashboardUtils";

interface TaskItem {
  _key: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface Props {
  tasks: TaskItem[];
  projectId: string;
}

export default function ProjectTasks({ tasks, projectId }: Props) {
  const [localTasks, setLocalTasks] = useState<TaskItem[]>(tasks);
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleToggle(task: TaskItem) {
    const newCompleted = !task.completed;
    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) =>
        t._key === task._key
          ? {
              ...t,
              completed: newCompleted,
              completedAt: newCompleted ? new Date().toISOString() : null,
            }
          : t,
      ),
    );

    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          projectId,
          taskKey: task._key,
          completed: newCompleted,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert optimistic update
      setLocalTasks((prev) =>
        prev.map((t) =>
          t._key === task._key
            ? {
                ...t,
                completed: task.completed,
                completedAt: task.completedAt,
              }
            : t,
        ),
      );
      setError("Could not update task. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const desc = newDescription.trim();
    if (!desc) {
      setError("Task description is required");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/tasks", {
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

      // Add new task to local state at top of list
      setLocalTasks((prev) => [
        {
          _key: result.taskKey,
          description: desc,
          dueDate: newDueDate || null,
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Clear form
      setNewDescription("");
      setNewDueDate("");
    } catch {
      setError("Could not create task. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setCreating(false);
    }
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
    <div id="tasks" style={cardStyle}>
      <div
        className="flex items-center justify-between mb-[14px] pb-[10px]"
        style={{ borderBottom: "0.5px solid #E8DDD0" }}
      >
        <h2 style={titleStyle}>Tasks</h2>
      </div>

      {localTasks.length === 0 ? (
        <p
          className="py-4 text-center"
          style={{ fontFamily: "var(--font-sans)", fontSize: "12.5px", color: "#9E8E80" }}
        >
          No tasks yet. Use the field below to create one.
        </p>
      ) : (
        <div>
          {localTasks.map((task) => {
            const overdue = isTaskOverdue(task);
            const labelColor = task.completed
              ? "#9E8E80"
              : overdue
                ? "#9B3A2A"
                : "#2C2520";
            const dateColor = overdue && !task.completed ? "#9B3A2A" : "#9E8E80";

            return (
              <div
                key={task._key}
                className="flex items-center gap-[10px] py-[7px]"
                style={{ borderBottom: "0.5px solid #E8DDD0" }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task)}
                  aria-label={task.description}
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
                    textDecoration: task.completed ? "line-through" : "none",
                  }}
                >
                  {task.description}
                </span>
                {task.dueDate && (
                  <span
                    className="shrink-0 tabular-nums"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11.5px",
                      color: dateColor,
                      fontWeight: overdue && !task.completed ? 500 : 400,
                    }}
                  >
                    {format(parseISO(task.dueDate), "MMM d")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick-add form */}
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
          placeholder="Add a task"
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
