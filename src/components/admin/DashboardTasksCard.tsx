import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { isTaskOverdue } from "../../lib/dashboardUtils";

interface TaskItem {
  _key: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  projectId: string;
  projectTitle: string;
}

interface ProjectOption {
  _id: string;
  title: string;
}

interface Props {
  tasks: TaskItem[];
  projects: ProjectOption[];
}

export default function DashboardTasksCard({ tasks, projects }: Props) {
  const [localTasks, setLocalTasks] = useState<TaskItem[]>(tasks);
  const [filterProject, setFilterProject] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newProject, setNewProject] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  // Clear highlight after 1 second
  useEffect(() => {
    if (!justCreated) return;
    const timer = setTimeout(() => setJustCreated(null), 1000);
    return () => clearTimeout(timer);
  }, [justCreated]);

  // Filter tasks by project
  const filteredTasks = filterProject
    ? localTasks.filter((t) => t.projectId === filterProject)
    : localTasks;

  // Sort: overdue first → nearest due date → undated → completed at bottom
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (a.completed && b.completed) return 0;
    const aOverdue = isTaskOverdue(a);
    const bOverdue = isTaskOverdue(b);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    // Both same overdue status — sort by due date (nulls last)
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });

  const displayTasks = sortedTasks.slice(0, 8);

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
          projectId: task.projectId,
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
    const pid = newProject || filterProject || projects[0]?._id;
    if (!pid) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId: pid,
          description: desc,
          ...(newDueDate && { dueDate: newDueDate }),
        }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();

      // Add new task to local state at top of list
      const projectTitle =
        projects.find((p) => p._id === pid)?.title || "";
      const newTask: TaskItem = {
        _key: result.taskKey,
        description: desc,
        dueDate: newDueDate || null,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        projectId: pid,
        projectTitle,
      };
      setLocalTasks((prev) => [newTask, ...prev]);
      setJustCreated(result.taskKey);

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

  function formatTaskDate(dateStr: string | null): string {
    if (!dateStr) return "";
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-light/40 overflow-hidden">
      {/* Header with title, count, and filter */}
      <div className="px-5 py-3 border-b border-stone-light/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-charcoal" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.01em" }}>Tasks</h2>
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
            {localTasks.filter((t) => !t.completed).length}
          </span>
        </div>
        <select
          value={filterProject}
          onChange={(e) => {
            setFilterProject(e.target.value);
            setNewProject(e.target.value);
          }}
          className="text-xs font-body text-stone bg-transparent border border-stone-light/40 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-terracotta"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Task rows */}
      {displayTasks.length === 0 ? (
        <p className="text-sm text-stone text-center py-6">
          No tasks yet. Use the field below to create one.
        </p>
      ) : (
        <div>
          {displayTasks.map((task) => {
            const overdue = isTaskOverdue(task);
            const isNew = justCreated === task._key;
            return (
              <div
                key={task._key}
                className={`flex items-center gap-3 px-5 py-3 border-b border-stone-light/10 last:border-b-0 transition-colors duration-500 ${
                  isNew
                    ? "bg-terracotta/5"
                    : overdue && !task.completed
                      ? "bg-red-50"
                      : ""
                } ${task.completed ? "opacity-40" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task)}
                  aria-label={task.description}
                  className="w-4 h-4 rounded border-stone-light text-terracotta focus:ring-terracotta accent-terracotta shrink-0"
                />
                <a
                  href={`/admin/projects/${task.projectId}#tasks`}
                  className={`text-sm font-body flex-1 truncate ${
                    task.completed
                      ? "text-stone-light line-through"
                      : overdue
                        ? "text-red-600"
                        : "text-charcoal"
                  }`}
                >
                  {task.description}
                </a>
                <span className={`text-[11px] font-body shrink-0 ${overdue && !task.completed ? "text-red-500" : "text-stone-light"}`}>
                  {task.projectTitle}
                  {task.dueDate && <> &middot; {formatTaskDate(task.dueDate)}</>}
                  {overdue && !task.completed && <> &middot; overdue</>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick-add form */}
      <form
        onSubmit={handleCreate}
        className="flex items-center gap-2 px-5 py-3 border-t border-stone-light/10 bg-cream/50"
      >
        <svg
          className="w-3.5 h-3.5 text-stone-light shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        <input
          type="text"
          placeholder="Add a task..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          disabled={creating}
          className="flex-1 text-sm font-body text-charcoal bg-transparent outline-none placeholder:text-stone-light"
        />
        <select
          value={newProject || filterProject || projects[0]?._id || ""}
          onChange={(e) => setNewProject(e.target.value)}
          className="text-xs font-body text-stone bg-transparent border border-stone-light/40 rounded-md px-2 py-1 max-w-[130px] truncate shrink-0"
        >
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="text-xs font-body text-stone bg-transparent border border-stone-light/40 rounded-md px-2 py-1 w-[130px] shrink-0"
        />
      </form>

      {/* Inline error */}
      {error && (
        <div className="px-5 py-2 text-xs text-red-600 font-body">
          {error}
        </div>
      )}
    </div>
  );
}
