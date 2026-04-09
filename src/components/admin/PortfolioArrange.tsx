import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2 } from "lucide-react";

interface ArrangeItem {
  _id: string;
  title: string;
  portfolioTitle?: string;
  heroImage?: { asset?: { url: string } };
  portfolioImage?: { asset?: { url: string } } | null;
}

interface PortfolioArrangeProps {
  items: ArrangeItem[];
}

function SortableItem({
  item,
  index,
}: {
  item: ArrangeItem;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl =
    item.portfolioImage?.asset?.url || item.heroImage?.asset?.url;
  const displayName = item.portfolioTitle || item.title;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 px-5 py-3 bg-white rounded-xl border mb-2 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "shadow-lg opacity-90 border-terracotta/30"
          : "border-stone-light/40"
      }`}
    >
      {/* Drag handle */}
      <div
        className="text-stone-light shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </div>

      {/* Thumbnail */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className="w-12 h-12 rounded-md object-cover bg-cream shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-md bg-cream shrink-0" />
      )}

      {/* Project name */}
      <span className="text-sm font-medium font-body text-charcoal flex-1 truncate">
        {displayName}
      </span>

      {/* Position indicator */}
      <span className="text-[11px] text-stone-light font-body shrink-0">
        #{index + 1}
      </span>
    </div>
  );
}

export default function PortfolioArrange({ items }: PortfolioArrangeProps) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedItems((prev) => {
      const oldIndex = prev.findIndex((item) => item._id === active.id);
      const newIndex = prev.findIndex((item) => item._id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setHasChanges(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          items: orderedItems.map((item, index) => ({
            _id: item._id,
            portfolioOrder: index,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    setOrderedItems(items);
    setHasChanges(false);
  }

  return (
    <div>
      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-terracotta text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:bg-terracotta/50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Save Order
        </button>
        {hasChanges && (
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm text-stone hover:text-charcoal font-body transition-colors"
          >
            Discard Changes
          </button>
        )}
        {saved && (
          <span className="text-emerald-600 text-xs font-body">
            Portfolio order saved
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2 text-xs text-red-600 font-body bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedItems.map((item) => item._id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedItems.map((item, index) => (
            <SortableItem key={item._id} item={item} index={index} />
          ))}
        </SortableContext>
      </DndContext>

      {orderedItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-stone font-body">
            No portfolio projects to arrange. Add projects to the portfolio first.
          </p>
        </div>
      )}
    </div>
  );
}
