import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Circle, Plus } from "lucide-react";
import { db, type Task } from "../../../db/dexieDB";
import { useStore } from "../../../store/useStore";
import { useSyncDB } from "../../../hooks/useSyncDB";
import { cn } from "../../../lib/cn";

export default function ListView() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const { activeTaskIds, setActiveTaskIds } = useStore();
  const { addTask, updateTask } = useSyncDB();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = useLiveQuery(async () => {
    let collection = db.tasks.toCollection();
    if (activeProjectId) {
      collection = db.tasks.where("projectId").equals(Number(activeProjectId));
    }
    const all = await collection.toArray();
    return all.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [activeProjectId]);

  const toggleDone = (task: Task) => {
    updateTask(task.id, {
      status: task.status === "done" ? "active" : "done",
    });
  };

  const toggleSelect = (id: number) => {
    const idStr = String(id);
    setActiveTaskIds(
      activeTaskIds.includes(idStr)
        ? activeTaskIds.filter((t) => t !== idStr)
        : [...activeTaskIds, idStr],
    );
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      projectId: activeProjectId ? Number(activeProjectId) : 1,
      status: "active",
      tags: [],
    });
    setNewTitle("");
    setIsAdding(false);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full px-4 pt-2 pb-24">
      <AnimatePresence initial={false}>
        {tasks?.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={cn(
                "flex items-center gap-3 py-3 min-h-[44px]",
                activeTaskIds.includes(String(task.id)) &&
                  "bg-indigo-50 -mx-4 px-4 rounded-lg",
              )}
              onClick={() => toggleSelect(task.id)}
            >
              <button
                className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDone(task);
                }}
              >
                {task.status === "done" ? (
                  <Check className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[15px] leading-snug truncate",
                    task.status === "done"
                      ? "line-through text-gray-400"
                      : "text-gray-900",
                  )}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.dueDate && (
                    <span className="text-xs text-gray-400">
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isAdding ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={inputRef}
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewTitle("");
              }
            }}
            onBlur={() => {
              if (!newTitle.trim()) {
                setIsAdding(false);
                setNewTitle("");
              }
            }}
            placeholder="Task title…"
            className="flex-1 text-[15px] py-2.5 px-3 rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      ) : (
        <button
          className="mt-4 flex items-center gap-2 text-blue-500 text-[15px] min-h-[44px]"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-5 h-5" />
          Add task
        </button>
      )}
    </div>
  );
}
