import {
  LayoutDashboard,
  FolderKanban,
  Users,
  HardHat,
  Image,
  Palette,
  Settings,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Contractors", href: "/admin/contractors", icon: HardHat },
  { label: "Portfolio", href: "/admin/portfolio", icon: Image },
  { label: "Rendering Tool", href: "/admin/rendering", icon: Palette },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function isActive(currentPath: string, href: string): boolean {
  if (href === "/admin/dashboard") {
    return (
      currentPath === "/admin/dashboard" ||
      currentPath === "/admin" ||
      currentPath === "/admin/"
    );
  }
  return currentPath.startsWith(href);
}

export default function AdminNav({ currentPath, businessName }: { currentPath: string; businessName: string }) {
  return (
    <nav className="flex flex-col h-full">
      {/* Brand section - hotel stationery style. Padded to match nav items */}
      <div className="mb-6 pb-5 mx-6 border-b border-[#E8DDD0]">
        <p
          className="text-[12px] tracking-[0.14em] uppercase font-medium"
          style={{ color: "#2C2520", fontFamily: "var(--font-sans)" }}
        >
          {businessName}
        </p>
        <div className="w-7 h-px bg-[#9A7B4B] my-[5px]" />
        <p
          className="text-[10px] tracking-[0.16em] uppercase"
          style={{ color: "#9E8E80", fontFamily: "var(--font-sans)" }}
        >
          Linha Studio
        </p>
      </div>

      {/* Nav items - edge-to-edge, with inner padding to match brand */}
      <div className="flex flex-col">
        {navItems.map((item) => {
          const active = isActive(currentPath, item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={
                active
                  ? "px-6 py-2 flex items-center gap-3 text-sm"
                  : "px-6 py-2 flex items-center gap-3 text-sm transition-colors hover:bg-[#F5EDD8]/40"
              }
              style={{
                backgroundColor: active ? "#F5EDD8" : "transparent",
                color: active ? "#9A7B4B" : "#6B5E52",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.02em",
                borderLeft: active ? "1.5px solid #9A7B4B" : "1.5px solid transparent",
              }}
            >
              <Icon className="w-[14px] h-[14px]" />
              {item.label}
            </a>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="mt-auto" />

      {/* Logout button at bottom - edge-to-edge */}
      <a
        href="/admin/logout"
        className="px-6 py-2 flex items-center gap-3 text-sm transition-colors hover:bg-[#F5EDD8]/40"
        style={{
          color: "#9E8E80",
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.02em",
        }}
      >
        <LogOut className="w-[14px] h-[14px]" />
        Log out
      </a>
    </nav>
  );
}
