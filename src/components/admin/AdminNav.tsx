import {
  LayoutDashboard,
  FolderKanban,
  Users,
  HardHat,
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
      {/* Brand section */}
      <div className="mb-10">
        <p className="text-[15px] tracking-[0.12em] uppercase font-heading font-bold text-charcoal">
          {businessName}
        </p>
        <p className="text-[11px] tracking-[0.08em] uppercase font-heading text-stone-light mt-0.5">Linha Studio</p>
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
                  ? "text-terracotta bg-cream border-l-2 border-terracotta -ml-3 pl-5 pr-3 py-2 rounded-lg flex items-center gap-3 font-semibold text-sm font-body"
                  : "text-stone-light hover:text-charcoal hover:bg-cream/50 px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm font-body"
              }
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
