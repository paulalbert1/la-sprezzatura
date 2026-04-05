/**
 * Custom Studio navbar that adds document type tabs.
 *
 * Renders the default Sanity navbar plus a row of tabs for quick
 * navigation between document types, reducing reliance on the
 * first sidebar pane.
 */

import { useEffect } from "react";
import { useRouter } from "sanity/router";
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

export function StudioNavbar(props: NavbarProps) {
  const { renderDefault } = props;
  const router = useRouter();

  // Force light mode — set Sanity's localStorage preference and
  // update the DOM scheme attribute on mount.
  useEffect(() => {
    try {
      // Sanity stores scheme preference in localStorage
      const studioKey = Object.keys(localStorage).find(
        (k) => k.includes("sanity") && k.includes("colorScheme"),
      );
      if (studioKey) {
        localStorage.setItem(studioKey, JSON.stringify("light"));
      }
      // Also try the standard key format
      localStorage.setItem("sanityStudio:ui:colorScheme", '"light"');

      // Force the data-scheme attribute on all elements that use it
      document.querySelectorAll("[data-scheme]").forEach((el) => {
        el.setAttribute("data-scheme", "light");
      });
      // Set on html element too
      document.documentElement.setAttribute("data-scheme", "light");
    } catch {
      // localStorage might be unavailable
    }
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
                  // Navigate to the document type list in the structure tool
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
