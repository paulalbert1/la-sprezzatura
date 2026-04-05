/**
 * Custom Studio navbar that adds document type tabs.
 *
 * Renders the default Sanity navbar plus a row of tabs for quick
 * navigation between document types, reducing reliance on the
 * first sidebar pane.
 */

import { useRouter } from "sanity/router";
import { Flex, Button, Card } from "@sanity/ui";
import {
  DocumentsIcon,
  UsersIcon,
  CogIcon,
  ComponentIcon,
  UlistIcon,
} from "@sanity/icons";
import type { ComponentType } from "react";

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
  const currentPath = router.state?._searchParams?.toString() || "";

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
