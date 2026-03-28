import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Calendar } from "lucide-react";
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

  const project = useLiveQuery(async () => {
    if (activeProjectId) {
      return db.projects.get(Number(activeProjectId));
    }
    return null;
  }, [activeProjectId]);

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

  const isOverdue = (iso?: string) => {
    if (!iso) return false;
    return new Date(iso) < new Date(new Date().toDateString());
  };

  const taskCount = tasks?.length ?? 0;

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-24">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-['Fraunces',serif] text-[18px] font-semibold text-[#1A1A1A]">
          {project ? project.name : "All Tasks"}
        </h2>
        <span className="text-[12px] font-medium text-[#6B6660] bg-[#F0EDE8] rounded-full px-2 py-0.5">
          {taskCount}
        </span>
      </div>

      {/* Task card container */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <AnimatePresence initial={false}>
          {tasks?.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div
                className={cn(
                  "flex items-center gap-3 h-[56px] px-4",
                  index > 0 && "border-t border-[#E8E5E1]",
                  activeTaskIds.includes(String(task.id)) && "bg-[#FEF2EE]",
                )}
                onClick={() => toggleSelect(task.id)}
              >
                {/* Custom checkbox */}
                <button
                  className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDone(task);
                  }}
                >
                  <div
                    className={cn(
                      "w-[20px] h-[20px] rounded-full border-[1.5px] flex items-center justify-center transition-colors",
                      task.status === "done"
                        ? "bg-[#E85D3A] border-[#E85D3A]"
                        : "border-[#D4D0CC] bg-transparent",
                    )}
                  >
                    {task.status === "done" && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[15px] font-['Inter',sans-serif] font-medium leading-snug truncate",
                      task.status === "done"
                        ? "line-through text-[#9C9690]"
                        : "text-[#1A1A1A]",
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.dueDate && (
                      <span
                        className={cn(
                          "text-[13px] font-['Inter',sans-serif] flex items-center gap-1",
                          isOverdue(task.dueDate)
                            ? "text-[#E85D3A]"
                            : "text-[#9C9690]",
                        )}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.tags?.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "text-[11px] tracking-wide px-2 py-0.5 rounded-full font-['Inter',sans-serif]",
                          tag.toLowerCase() === "urgent"
                            ? "bg-[#FEF2EE] text-[#E85D3A]"
                            : "bg-[#F0EDE8] text-[#6B6660]",
                        )}
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

        {/* Add task row */}
        {isAdding ? (
          <div className="border-t border-[#E8E5E1] px-4 h-[56px] flex items-center">
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
              className="flex-1 text-[15px] font-['Inter',sans-serif] font-medium text-[#1A1A1A] placeholder:text-[#9C9690] outline-none bg-transparent"
            />
          </div>
        ) : (
          <button
            className="w-full border-t border-dashed border-[#E8E5E1] px-4 h-[56px] flex items-center gap-2 text-[#E85D3A] text-[15px] font-['Inter',sans-serif] font-medium min-h-[44px] hover:bg-[#FEF2EE]/50 transition-colors"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
