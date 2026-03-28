import { AnimatePresence, motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { Inbox } from "lucide-react";
import { db } from "../../db/dexieDB";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/cn";

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
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={toggleNavSidebar}
          />

          {/* Panel */}
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white pt-[env(safe-area-inset-top)] shadow-lg"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="px-4 pb-2 pt-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Projects
              </h2>
            </div>

            <nav className="flex flex-col gap-0.5 px-2">
              <button
                onClick={() => select(null)}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                  activeProjectId === null
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-900",
                )}
              >
                <Inbox size={18} />
                All Tasks
              </button>

              {projects?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => select(String(p.id))}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                    activeProjectId === String(p.id)
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-900",
                  )}
                >
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
