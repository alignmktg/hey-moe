import { AnimatePresence, motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { Inbox, X } from "lucide-react";
import { db } from "../../db/dexieDB";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/cn";

const projectColors = [
  "#E85D3A",
  "#2D8C5F",
  "#6366F1",
  "#D97706",
  "#8B5CF6",
  "#EC4899",
  "#0EA5E9",
  "#14B8A6",
];

export function Sidebar() {
  const {
    isNavSidebarOpen,
    toggleNavSidebar,
    activeProjectId,
    setActiveProject,
  } = useStore();

  const projects = useLiveQuery(() =>
    db.projects.where("status").equals("active").toArray(),
  );

  const select = (id: string | null) => {
    setActiveProject(id);
    toggleNavSidebar();
  };

  return (
    <AnimatePresence>
      {isNavSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={toggleNavSidebar}
          />

          {/* Panel */}
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 w-72 rounded-r-2xl bg-[var(--color-surface)] pt-[env(safe-area-inset-top)] shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 pt-6">
              <h2
                className="text-lg font-semibold text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Projects
              </h2>
              <button
                onClick={toggleNavSidebar}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-tag-bg)]"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-0.5 px-3">
              {/* All Tasks */}
              <button
                onClick={() => select(null)}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors",
                  activeProjectId === null
                    ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-page-bg)]",
                )}
              >
                <Inbox size={18} />
                All Tasks
              </button>

              {/* Separator */}
              <div className="mx-3 my-2 border-t border-[var(--color-border)]" />

              {/* Project list */}
              {projects?.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => select(String(p.id))}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors",
                    activeProjectId === String(p.id)
                      ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-page-bg)]",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: projectColors[i % projectColors.length],
                    }}
                  />
                  {p.name}
                </button>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
