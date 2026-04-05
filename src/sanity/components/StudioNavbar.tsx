/**
 * Custom Studio navbar that adds document type tabs and forces light mode.
 *
 * Renders the default Sanity navbar plus a row of tabs for quick
 * navigation between document types. Also hides the first structure
 * pane (Content type list) via DOM manipulation since the tabs
 * provide the same navigation.
 */

import { useEffect } from "react";
import { Flex, Button, Card } from "@sanity/ui";
import {
  DocumentsIcon,
  UsersIcon,
  CogIcon,
  ComponentIcon,
  UlistIcon,
} from "@sanity/icons";

interface NavbarProps {
  renderDefault: (props: NavbarProps) => React.JSX.Element;
}

const DOC_TYPES = [
  { id: "project", title: "Projects", icon: DocumentsIcon, path: "/structure/project" },
  { id: "client", title: "Clients", icon: UsersIcon, path: "/structure/client" },
  { id: "contractor", title: "Contractors", icon: ComponentIcon, path: "/structure/contractor" },
  { id: "service", title: "Services", icon: UlistIcon, path: "/structure/service" },
  { id: "siteSettings", title: "Settings", icon: CogIcon, path: "/structure/siteSettings" },
] as const;

/**
 * Find and hide the first structure pane (Content type list).
 * Walks the DOM looking for pane elements — the first pane contains
 * "Content" and the type list which is now handled by navbar tabs.
 */
function hideFirstPane() {
  // Strategy 1: Find by data-pane-index
  const pane0 = document.querySelector('[data-pane-index="0"]');
  if (pane0) {
    (pane0 as HTMLElement).style.display = "none";
    // Also hide the divider after it
    const next = pane0.nextElementSibling;
    if (next) (next as HTMLElement).style.display = "none";
    return;
  }

  // Strategy 2: Find by pane header text "Content"
  const headers = document.querySelectorAll("h2, [data-testid='pane-header']");
  for (const header of headers) {
    if (header.textContent?.trim() === "Content") {
      // Walk up to find the pane container
      let el: HTMLElement | null = header as HTMLElement;
      for (let i = 0; i < 10 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        // Check if this looks like a pane (has a certain width, is a direct child of the layout)
        const style = window.getComputedStyle(el);
        if (style.display === "flex" || el.getAttribute("data-pane-index") !== null) {
          el.style.display = "none";
          const next = el.nextElementSibling;
          if (next) (next as HTMLElement).style.display = "none";
          return;
        }
      }
    }
  }

  // Strategy 3: Log DOM structure for debugging (visible in browser console)
  const allPanes = document.querySelectorAll("[data-pane-index]");
  if (allPanes.length === 0) {
    console.log("[StudioNavbar] No pane-index elements found. Pane attributes in DOM:",
      Array.from(document.querySelectorAll("[data-testid]"))
        .map(el => el.getAttribute("data-testid"))
        .filter(t => t?.includes("pane"))
    );
  }
}

export function StudioNavbar(props: NavbarProps) {
  const { renderDefault } = props;

  useEffect(() => {
    // Force light mode
    try {
      // Find and set Sanity's color scheme localStorage key
      for (const key of Object.keys(localStorage)) {
        if (key.toLowerCase().includes("colorscheme") || key.toLowerCase().includes("color-scheme")) {
          localStorage.setItem(key, JSON.stringify("light"));
        }
      }
      localStorage.setItem("sanityStudio:ui:colorScheme", '"light"');

      // Force data-scheme="light" on all elements
      document.querySelectorAll("[data-scheme]").forEach((el) => {
        el.setAttribute("data-scheme", "light");
      });
      document.documentElement.setAttribute("data-scheme", "light");
    } catch {
      // localStorage might be unavailable
    }

    // Hide first pane — retry a few times since SVAR renders async
    const timers = [
      setTimeout(hideFirstPane, 100),
      setTimeout(hideFirstPane, 500),
      setTimeout(hideFirstPane, 1500),
    ];

    // Also observe DOM changes to re-hide if pane is re-rendered
    const observer = new MutationObserver(() => hideFirstPane());
    observer.observe(document.body, { childList: true, subtree: true });
    // Stop observing after 5 seconds to avoid performance issues
    const stopTimer = setTimeout(() => observer.disconnect(), 5000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(stopTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <div>
      {renderDefault(props)}
      <Card
        padding={1}
        paddingLeft={3}
        paddingRight={3}
        borderBottom
        style={{ backgroundColor: "var(--card-bg-color)" }}
      >
        <Flex gap={1} align="center">
          {DOC_TYPES.map((type) => {
            const isActive = typeof window !== "undefined" &&
              window.location.pathname.includes(type.path);

            return (
              <Button
                key={type.id}
                icon={type.icon}
                text={type.title}
                mode={isActive ? "default" : "bleed"}
                tone={isActive ? "primary" : "default"}
                fontSize={1}
                padding={2}
                onClick={() => {
                  window.location.href = `/admin/structure/${type.id}`;
                }}
              />
            );
          })}
        </Flex>
      </Card>
    </div>
  );
}
