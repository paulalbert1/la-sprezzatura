import { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { isTaskOverdue, getDaysOverdue } from "../../lib/dashboardUtils";

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
  // "studio" → /api/admin/tasks (default), "client" → /api/admin/client-action-items.
  // Drives the card title and the API endpoint used for create/toggle.
  kind?: "studio" | "client";
}

export default function DashboardTasksCard({ tasks, projects, kind = "studio" }: Props) {
  const apiPath =
    kind === "client" ? "/api/admin/client-action-items" : "/api/admin/tasks";
  // The two endpoints use different request field names ("taskKey" vs
  // "itemKey") for the array element identifier. Pick the matching one for
  // both create-response parsing and toggle requests.
  const keyField = kind === "client" ? "itemKey" : "taskKey";
  const cardTitle = kind === "client" ? "Tasks — Client" : "Tasks — Designer";
  const addLabel = kind === "client" ? "Add action item" : "Add task";
  const placeholder =
    kind === "client" ? "Add an action item..." : "Add a task...";
  const emptyCopy =
    kind === "client"
      ? "No client action items yet. Use the field below to create one."
      : "No tasks yet. Use the field below to create one.";
  const [localTasks, setLocalTasks] = useState<TaskItem[]>(tasks);
  const [filterProject, setFilterProject] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newProject, setNewProject] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  // Phase 35-05 (DASH-21/22): hide completed by default; useState only, reload resets.
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const addInputRef = useRef<HTMLInputElement>(null);

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

  // Phase 35-05: partition for the hide-completed toggle.
  const activeTasks = sortedTasks.filter((t) => !t.completed);
  const completedTasks = sortedTasks.filter((t) => t.completed);
  // Cap (.slice(0, 8)) is applied to the COMBINED list after the showCompleted
  // filter, so completed rows may push active rows off the visible list when
  // revealed — per UI-SPEC "show the full set on demand".
  const visibleTasks = showCompleted
    ? [...activeTasks, ...completedTasks].slice(0, 8)
    : activeTasks.slice(0, 8);

  function handleAddTaskClick() {
    // Focus the existing quick-add input at the form footer.
    addInputRef.current?.focus();
    // scrollIntoView is not implemented in jsdom; guard so tests stay quiet.
    if (typeof addInputRef.current?.scrollIntoView === "function") {
      addInputRef.current.scrollIntoView({ block: "nearest" });
    }
  }

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
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          projectId: task.projectId,
          [keyField]: task._key,
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
      const res = await fetch(apiPath, {
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
        _key: result[keyField],
        description: desc,
        dueDate: newDueDate || null,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        projectId: pid,
        projectTitle,
      };
      setLocalTasks((prev) => [newTask, ...prev]);
      setJustCreated(result[keyField]);

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
      {/* Header — see global.css .card-header for tokens. */}
      <div className="card-header flex items-center justify-between gap-3 px-5 h-[42px]">
        <h2 className="card-header-label">{cardTitle}</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterProject}
            onChange={(e) => {
              setFilterProject(e.target.value);
              setNewProject(e.target.value);
            }}
            className="card-header-select"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddTaskClick}
            className="card-header-btn"
          >
            <Plus size={14} />
            {addLabel}
          </button>
        </div>
      </div>

      {/* Task rows */}
      {visibleTasks.length === 0 ? (
        <p className="text-sm text-stone text-center py-6">{emptyCopy}</p>
      ) : (
        <div>
          {visibleTasks.map((task) => {
            const overdue = isTaskOverdue(task);
            const daysLate =
              overdue && task.dueDate ? getDaysOverdue(task.dueDate) : 0;
            // Tier severity: critical (>7d) = red, warning (1–7d) = amber, neutral otherwise.
            // This prevents the "everything is on fire" look when several rows are
            // all just a day or two late.
            const severity =
              !overdue || task.completed
                ? "none"
                : daysLate > 7
                  ? "critical"
                  : "warning";
            const isNew = justCreated === task._key;
            const titleColor =
              task.completed
                ? "text-stone-light line-through"
                : severity === "critical"
                  ? "text-red-600"
                  : severity === "warning"
                    ? "text-amber-700"
                    : "text-charcoal";
            const metaColor =
              severity === "critical"
                ? "text-red-500"
                : severity === "warning"
                  ? "text-amber-600"
                  : "text-stone-light";
            return (
              <div
                key={task._key}
                className={`flex items-center gap-3 px-5 py-3 border-b border-stone-light/10 last:border-b-0 transition-colors duration-500 ${
                  isNew ? "bg-terracotta/5" : ""
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
                  className={`text-sm font-body flex-1 truncate ${titleColor}`}
                >
                  {task.description}
                </a>
                <span className={`text-[11px] font-body shrink-0 ${metaColor}`}>
                  {task.projectTitle}
                  {task.dueDate && <> &middot; {formatTaskDate(task.dueDate)}</>}
                  {overdue && !task.completed && (
                    <> &middot; {daysLate}d overdue</>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick-add form (retained; header CTA focuses this input) */}
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
          ref={addInputRef}
          type="text"
          placeholder={placeholder}
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

      {/* Reveal link (DASH-22) — only when completed tasks exist */}
      {completedTasks.length > 0 && (
        <div className="border-t border-stone-light/10 text-center py-3">
          <button
            type="button"
            onClick={() => setShowCompleted((s) => !s)}
            className="text-[13px] font-body text-stone hover:text-charcoal hover:underline underline-offset-2 bg-transparent border-0 cursor-pointer"
          >
            {showCompleted
              ? "Hide completed"
              : `Show completed (${completedTasks.length})`}
          </button>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <div className="px-5 py-2 text-xs text-red-600 font-body">
          {error}
        </div>
      )}
    </div>
  );
}
