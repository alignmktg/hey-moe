import type { ReactNode } from "react";
import {
  List,
  LayoutGrid,
  Layers,
  MessageCircle,
  Menu,
  PanelLeftOpen,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import type { ViewMode } from "../../store/useStore";
import { cn } from "../../lib/cn";

const tabs: {
  view: ViewMode;
  icon: typeof List;
  label: string;
}[] = [
  { view: "list", icon: List, label: "List" },
  { view: "kanban", icon: LayoutGrid, label: "Kanban" },
  { view: "swipe", icon: Layers, label: "Swipe" },
  { view: "moe", icon: MessageCircle, label: "Moe" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { currentView, setCurrentView, toggleNavSidebar, isNavSidebarOpen } =
    useStore();

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-page-bg)]">
      {/* Top bar */}
      <header className="relative z-10 flex h-12 shrink-0 items-center justify-between bg-[var(--color-surface)] px-4 lg:px-6 pt-[env(safe-area-inset-top)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleNavSidebar}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[#F0EDE8] transition-colors"
            aria-label="Toggle sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
          <h1
            className="text-[20px] font-bold text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hey Moe
          </h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Desktop view tabs */}
          <div className="hidden lg:flex items-center gap-1">
            {tabs.map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors",
                  currentView === view
                    ? "bg-[#FEF2EE] text-[var(--color-accent)]"
                    : "text-[var(--color-text-tertiary)] hover:bg-[#F0EDE8]",
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={toggleNavSidebar}
            className="lg:hidden flex h-11 w-11 items-center justify-center text-[var(--color-text-tertiary)] active:text-[var(--color-text-secondary)]"
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex min-h-0 flex-1">
        {isNavSidebarOpen && (
          <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto" />
        )}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Bottom tab bar — mobile */}
      <nav className="lg:hidden flex shrink-0 items-center border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-1",
              currentView === view
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-tertiary)]",
            )}
            aria-label={label}
          >
            <Icon size={20} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
