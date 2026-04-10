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
      {/* Brand section - hotel stationery style */}
      <div className="mb-10 pb-5 border-b border-[#E8DDD0]">
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

      {/* Nav items */}
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(currentPath, item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={
                active
                  ? "bg-[#F5EDD8] px-3 py-2 rounded-lg flex items-center gap-3 text-sm"
                  : "hover:bg-[#F5EDD8]/50 px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm"
              }
              style={{
                color: active ? "#9A7B4B" : "#6B5E52",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.02em",
              }}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </a>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="mt-auto" />

      {/* Logout button at bottom */}
      <a
        href="/admin/logout"
        className="text-stone hover:text-charcoal hover:bg-cream/50 px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm font-body"
      >
        <LogOut className="w-5 h-5" />
        Log out
      </a>
    </nav>
  );
}
