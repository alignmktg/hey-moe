import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { Search } from "lucide-react";
import { db } from "../../db/dexieDB";
import { useStore } from "../../store/useStore";
import type { ViewMode } from "../../store/useStore";
import { cn } from "../../lib/cn";

const viewCommands: { label: string; view: ViewMode }[] = [
  { label: "Switch to List", view: "list" },
  { label: "Switch to Kanban", view: "kanban" },
  { label: "Switch to Swipe", view: "swipe" },
];

export function CmdKModal() {
  const {
    isCmdKOpen,
    toggleCmdK,
    setCurrentView,
    activeTaskIds,
    setActiveTaskIds,
  } = useStore();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = useLiveQuery(
    () =>
      query.trim()
        ? db.tasks
            .filter((t) =>
              t.title.toLowerCase().includes(query.trim().toLowerCase()),
            )
            .toArray()
        : db.tasks.toArray(),
    [query],
  );

  useEffect(() => {
    if (isCmdKOpen) {
      requestAnimationFrame(() => {
        setQuery("");
        inputRef.current?.focus();
      });
    }
  }, [isCmdKOpen]);

  const close = () => toggleCmdK();

  const selectTask = (id: number) => {
    const idStr = String(id);
    if (!activeTaskIds.includes(idStr)) {
      setActiveTaskIds([...activeTaskIds, idStr]);
    }
    close();
  };

  const switchView = (view: ViewMode) => {
    setCurrentView(view);
    close();
  };

  const filteredCommands = viewCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {isCmdKOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-[12vh] z-50 mx-auto max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onKeyDown={(e) => e.key === "Escape" && close()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Search size={18} className="shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks or commands..."
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="border-t border-gray-100" />

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2">
              {/* View commands */}
              {filteredCommands.length > 0 && (
                <div className="px-3 pb-1">
                  <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Commands
                  </p>
                  {filteredCommands.map((c) => (
                    <button
                      key={c.view}
                      onClick={() => switchView(c.view)}
                      className="flex h-11 w-full items-center rounded-lg px-3 text-sm text-gray-900 hover:bg-gray-50"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {tasks && tasks.length > 0 && (
                <div className="px-3 pt-1">
                  <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Tasks
                  </p>
                  {tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => selectTask(t.id)}
                      className={cn(
                        "flex h-11 w-full items-center rounded-lg px-3 text-sm",
                        activeTaskIds.includes(String(t.id))
                          ? "text-indigo-600"
                          : "text-gray-900",
                        "hover:bg-gray-50",
                      )}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}

              {tasks?.length === 0 && filteredCommands.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-400">
                  No results
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
