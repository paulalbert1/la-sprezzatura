import { useState } from "react";
import { GripVertical, X } from "lucide-react";

interface PortfolioProject {
  _id: string;
  title: string;
  heroImage?: { asset?: { url: string; metadata?: { lqip: string } } };
  showInPortfolio: boolean;
  portfolioTitle?: string;
  portfolioImage?: { asset?: { url: string; metadata?: { lqip: string } } } | null;
}

interface PortfolioGridProps {
  projects: PortfolioProject[];
}

export default function PortfolioGrid({ projects }: PortfolioGridProps) {
  const [localProjects, setLocalProjects] = useState<PortfolioProject[]>(projects);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portfolioProjects = localProjects.filter((p) => p.showInPortfolio);
  const availableProjects = localProjects.filter((p) => !p.showInPortfolio);

  async function handleToggle(projectId: string, currentState: boolean) {
    const newState = !currentState;

    // Optimistic update
    setLocalProjects((prev) =>
      prev.map((p) =>
        p._id === projectId ? { ...p, showInPortfolio: newState } : p,
      ),
    );

    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          projectId,
          showInPortfolio: newState,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setLocalProjects((prev) =>
        prev.map((p) =>
          p._id === projectId ? { ...p, showInPortfolio: currentState } : p,
        ),
      );
      setError("Could not save changes. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  }

  async function handleAddToPortfolio(projectId: string) {
    // Optimistic update
    setLocalProjects((prev) =>
      prev.map((p) =>
        p._id === projectId ? { ...p, showInPortfolio: true } : p,
      ),
    );
    setShowPicker(false);

    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          projectId,
          showInPortfolio: true,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setLocalProjects((prev) =>
        prev.map((p) =>
          p._id === projectId ? { ...p, showInPortfolio: false } : p,
        ),
      );
      setError("Could not save changes. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  }

  function getImageUrl(project: PortfolioProject): string | undefined {
    return (
      project.portfolioImage?.asset?.url || project.heroImage?.asset?.url
    );
  }

  function getLqip(project: PortfolioProject): string | undefined {
    return (
      project.portfolioImage?.asset?.metadata?.lqip ||
      project.heroImage?.asset?.metadata?.lqip
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div />
        <div className="flex items-center gap-3">
          {portfolioProjects.length >= 2 && (
            <a
              href="/admin/portfolio/arrange"
              className="flex items-center gap-1.5 text-sm text-stone border border-stone-light/40 rounded-lg px-4 py-2 hover:bg-cream transition-colors font-body"
            >
              <GripVertical size={14} />
              Arrange Order
            </a>
          )}
          {availableProjects.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="bg-terracotta text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body"
            >
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-2 text-xs text-red-600 font-body bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Portfolio grid */}
      {portfolioProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-stone font-body">No portfolio projects yet</p>
          <p className="text-sm text-stone font-body mt-1">
            Add completed projects to showcase your work on the public site.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {portfolioProjects.map((project) => {
            const imageUrl = getImageUrl(project);
            const lqip = getLqip(project);
            const displayName = project.portfolioTitle || project.title;

            return (
              <div
                key={project._id}
                className="bg-white rounded-xl border border-stone-light/40 overflow-hidden"
              >
                {/* Thumbnail */}
                <div
                  className="w-full aspect-[4/3] bg-cream relative"
                  style={lqip ? { backgroundImage: `url(${lqip})`, backgroundSize: "cover" } : undefined}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  <p className="text-sm font-semibold font-body text-charcoal truncate">
                    {displayName}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Toggle switch */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={project.showInPortfolio}
                        aria-label={`Toggle ${displayName} portfolio visibility`}
                        onClick={() => handleToggle(project._id, project.showInPortfolio)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          project.showInPortfolio ? "bg-terracotta" : "bg-stone-light/30"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                            project.showInPortfolio ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-stone font-body">
                        {project.showInPortfolio ? "Live" : "Off"}
                      </span>
                    </div>

                    {/* Edit link */}
                    <a
                      href={`/admin/portfolio/${project._id}/edit`}
                      className="text-xs text-terracotta hover:underline font-body"
                    >
                      Edit
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Picker Modal */}
      {showPicker && (
        <div
          className="fixed inset-0 bg-charcoal/40 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPicker(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-[480px] max-h-[70vh] overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-stone-light/20 flex items-center justify-between">
              <span className="text-sm font-semibold font-body text-charcoal">
                Add to Portfolio
              </span>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-stone hover:text-charcoal transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Project list */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {availableProjects.length === 0 ? (
                <p className="text-sm text-stone text-center py-8 font-body">
                  All completed projects are already in the portfolio
                </p>
              ) : (
                availableProjects.map((project) => {
                  const imageUrl = project.heroImage?.asset?.url;
                  return (
                    <button
                      key={project._id}
                      type="button"
                      onClick={() => handleAddToPortfolio(project._id)}
                      className="w-full flex items-center gap-3 px-6 py-3 hover:bg-cream cursor-pointer border-b border-stone-light/10 last:border-b-0 text-left transition-colors"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={project.title}
                          className="w-10 h-10 rounded-md object-cover bg-cream shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-cream shrink-0" />
                      )}
                      <span className="text-sm font-body text-charcoal">
                        {project.title}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
