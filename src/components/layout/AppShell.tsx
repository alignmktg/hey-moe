import type { ReactNode } from "react";
import { List, LayoutGrid, Layers, MessageCircle, Menu } from "lucide-react";
import { useStore } from "../../store/useStore";
import type { ViewMode } from "../../store/useStore";
import { cn } from "../../lib/cn";

const tabs: { view: ViewMode; icon: typeof List; label: string }[] = [
  { view: "list", icon: List, label: "List" },
  { view: "kanban", icon: LayoutGrid, label: "Kanban" },
  { view: "swipe", icon: Layers, label: "Swipe" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { currentView, setCurrentView, toggleNavSidebar, toggleMoeSidebar } =
    useStore();

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--color-page-bg)]">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between bg-[var(--color-surface)] px-4 pt-[env(safe-area-inset-top)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h1
          className="text-[20px] font-bold text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Hey Moe
        </h1>
        <button
          onClick={toggleNavSidebar}
          className="flex h-11 w-11 items-center justify-center text-[var(--color-text-tertiary)] active:text-[var(--color-text-secondary)]"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Content */}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>

      {/* Bottom tab bar */}
      <nav className="flex shrink-0 items-center border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]">
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
        <button
          onClick={toggleMoeSidebar}
          className="flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[var(--color-text-tertiary)]"
          aria-label="Open Moe"
        >
          <MessageCircle size={20} />
          <span className="text-[11px] font-medium">Moe</span>
        </button>
      </nav>
    </div>
  );
}
