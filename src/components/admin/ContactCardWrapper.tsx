import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import ContactCardPopover, {
  type ContactCardData,
} from "./ContactCardPopover";

// Module-level singleton: only one contact card popover can be open at a time.
// When a new card opens, it calls the previous card's close fn.
let activeCloseFn: (() => void) | null = null;

interface ContactCardWrapperProps {
  entityId: string;
  entityType: "client" | "contractor";
  name: string;
  href?: string;
  className?: string;
  contactData?: ContactCardData;
  children: ReactNode;
}

export default function ContactCardWrapper({
  entityId,
  entityType,
  name,
  href,
  className,
  contactData,
  children,
}: ContactCardWrapperProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [flipped, setFlipped] = useState<{
    vertical?: boolean;
    horizontal?: boolean;
  }>({});
  const [data, setData] = useState<ContactCardData | null>(
    contactData || null,
  );

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const cacheRef = useRef<Map<string, ContactCardData>>(new Map());
  const fetchingRef = useRef(false);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const flipVertical = viewportHeight - rect.bottom < 300;
    const flipHorizontal = viewportWidth - rect.left < 300;

    setFlipped({ vertical: flipVertical, horizontal: flipHorizontal });

    const top = flipVertical
      ? rect.top + window.scrollY - 8
      : rect.bottom + window.scrollY + 8;
    const left = flipHorizontal
      ? rect.right + window.scrollX
      : rect.left + window.scrollX;

    setPosition({ top, left });
  }, []);

  const fetchData = useCallback(async () => {
    // If we already have contact data (pre-populated), skip fetch
    if (contactData) {
      setData(contactData);
      return;
    }

    // Check cache
    const cached = cacheRef.current.get(entityId);
    if (cached) {
      setData(cached);
      return;
    }

    // Avoid duplicate fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(name)}`,
      );
      if (!res.ok) return;
      const results = await res.json();

      // Find the matching entity by _id
      const allEntities = [
        ...(results.clients || []).map((c: any) => ({
          ...c,
          entityType: "client" as const,
        })),
        ...(results.contractors || []).map((c: any) => ({
          ...c,
          entityType: "contractor" as const,
        })),
      ];

      const match = allEntities.find(
        (e: ContactCardData) => e._id === entityId,
      );
      if (match) {
        const cardData: ContactCardData = {
          _id: match._id,
          name: match.name,
          email: match.email || "",
          phone: match.phone || "",
          entityType: match.entityType,
        };
        cacheRef.current.set(entityId, cardData);
        setData(cardData);
      }
    } catch {
      // Silently fail -- popover simply won't appear
    } finally {
      fetchingRef.current = false;
    }
  }, [entityId, name, contactData]);

  const closePopover = useCallback(() => {
    setVisible(false);
    if (activeCloseFn === closePopover) {
      activeCloseFn = null;
    }
  }, []);

  const showPopover = useCallback(() => {
    // Close any other open popover first -- only one at a time
    if (activeCloseFn && activeCloseFn !== closePopover) {
      activeCloseFn();
    }
    activeCloseFn = closePopover;
    computePosition();
    setVisible(true);
  }, [computePosition, closePopover]);

  // Clean up singleton ref if component unmounts while active
  useEffect(() => {
    return () => {
      if (activeCloseFn === closePopover) {
        activeCloseFn = null;
      }
    };
  }, [closePopover]);

  const handleMouseEnter = useCallback(() => {
    // Cancel any pending dismiss
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    // Start 300ms hover delay
    hoverTimerRef.current = setTimeout(async () => {
      await fetchData();
      showPopover();
    }, 300);
  }, [fetchData, showPopover]);

  const handleMouseLeave = useCallback(() => {
    // Cancel hover timer if mouse leaves before 300ms
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Start 150ms grace period for dismiss
    dismissTimerRef.current = setTimeout(() => {
      closePopover();
    }, 150);
  }, [closePopover]);

  const handlePopoverMouseEnter = useCallback(() => {
    // Cancel dismiss if mouse enters the popover
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const handlePopoverMouseLeave = useCallback(() => {
    // Start dismiss timer when leaving popover
    dismissTimerRef.current = setTimeout(() => {
      closePopover();
    }, 150);
  }, [closePopover]);

  const Tag = href ? "a" : "span";
  const tagProps = href ? { href } : {};

  return (
    <>
      <Tag
        {...tagProps}
        ref={triggerRef as any}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Tag>
      {visible &&
        data &&
        createPortal(
          <div
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <ContactCardPopover
              data={data}
              position={position}
              flipped={flipped}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
