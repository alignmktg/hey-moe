import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { db, type Task } from "../../../db/dexieDB";
import { useStore } from "../../../store/useStore";
import { useSyncDB } from "../../../hooks/useSyncDB";
import { cn } from "../../../lib/cn";

type ColumnStatus = Task["status"];

const COLUMNS: { id: ColumnStatus; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "done", label: "Done" },
];

const PROJECT_COLORS = [
  "#E85D3A",
  "#2D8C5F",
  "#6366F1",
  "#D97706",
  "#8B5CF6",
  "#EC4899",
];

function getProjectColor(projectId: number): string {
  return PROJECT_COLORS[projectId % PROJECT_COLORS.length];
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(iso?: string) {
  if (!iso) return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

function TaskCard({
  task,
  projectName,
  isDoneColumn,
  isSelected,
  onSelect,
  onMove,
}: {
  task: Task;
  projectName?: string;
  isDoneColumn?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onMove: () => void;
}) {
  const targetLabel = isDoneColumn ? "Move to Active" : "Mark Done";
  const TargetIcon = isDoneColumn ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all",
        isDoneColumn && "opacity-70",
        isSelected &&
          "ring-2 ring-[#E85D3A] shadow-[0_2px_8px_rgba(232,93,58,0.15)]",
      )}
    >
      <button className="w-full text-left p-4" onClick={onSelect}>
        <p
          className={cn(
            "text-[14px] font-['Inter',sans-serif] font-semibold leading-snug text-[#1A1A1A]",
            isDoneColumn && "line-through text-[#9C9690]",
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-3 mt-2.5">
          {projectName && (
            <span className="flex items-center gap-1.5 text-[12px] font-['Inter',sans-serif] text-[#6B6660]">
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ backgroundColor: getProjectColor(task.projectId) }}
              />
              {projectName}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-[12px] font-['Inter',sans-serif]",
                isOverdue(task.dueDate) ? "text-[#E85D3A]" : "text-[#6B6660]",
              )}
            >
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {task.tags.map((tag) => (
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
        )}
      </button>

      {/* Move action — shown when selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E8E5E1] px-4 py-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove();
                }}
                className={cn(
                  "flex items-center justify-center gap-2 w-full h-9 rounded-lg text-[13px] font-medium transition-colors",
                  isDoneColumn
                    ? "bg-[#FAFAF8] text-[#6B6660] hover:bg-[#F0EDE8] active:bg-[#E8E5E1]"
                    : "bg-[#FEF2EE] text-[#E85D3A] hover:bg-[#FCDDD3] active:bg-[#E85D3A] active:text-white",
                )}
              >
                <TargetIcon size={14} />
                {targetLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Column({
  column,
  tasks,
  projectMap,
  selectedId,
  onSelect,
  onMove,
}: {
  column: { id: ColumnStatus; label: string };
  tasks: Task[];
  projectMap: Map<number, string>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onMove: (task: Task) => void;
}) {
  const isActive = column.id === "active";

  return (
    <div
      className={cn(
        "flex-shrink-0 w-[80vw] max-w-[320px] snap-start rounded-xl p-3 lg:w-[380px] lg:max-w-[380px] lg:flex-shrink",
        isActive ? "bg-[#FAFAF8]" : "bg-[#F5F3EF]",
      )}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        {isActive && (
          <span className="w-[8px] h-[8px] rounded-full bg-[#E85D3A] flex-shrink-0" />
        )}
        <h3 className="text-[13px] font-['Inter',sans-serif] font-semibold uppercase tracking-wide text-[#6B6660]">
          {column.label}
        </h3>
        <span className="text-[12px] font-medium text-[#9C9690] bg-white rounded-full px-2 py-0.5 min-w-[24px] text-center">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectName={projectMap.get(task.projectId)}
              isDoneColumn={!isActive}
              isSelected={selectedId === task.id}
              onSelect={() => onSelect(task.id)}
              onMove={() => onMove(task)}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-[#E85D3A]/30 h-[80px] flex items-center justify-center">
            <span className="text-[13px] text-[#9C9690] font-['Inter',sans-serif]">
              No tasks
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const { updateTask } = useSyncDB();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const tasks = useLiveQuery(async () => {
    if (activeProjectId) {
      return db.tasks
        .where("projectId")
        .equals(Number(activeProjectId))
        .toArray();
    }
    return db.tasks.toArray();
  }, [activeProjectId]);

  const projects = useLiveQuery(() => db.projects.toArray());

  const projectMap = useMemo(() => {
    const m = new Map<number, string>();
    projects?.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const grouped = useMemo(() => {
    const map: Record<ColumnStatus, Task[]> = { active: [], done: [] };
    tasks?.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  const handleSelect = (id: number) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleMove = (task: Task) => {
    const newStatus = task.status === "active" ? "done" : "active";
    setSelectedId(null);
    updateTask(task.id, { status: newStatus });
  };

  if (!tasks) return null;

  return (
    <div className="flex gap-4 px-4 pt-4 pb-24 h-full overflow-x-auto snap-x snap-mandatory overscroll-none lg:px-8 lg:pt-6 lg:snap-none lg:justify-center">
      {COLUMNS.map((col) => (
        <Column
          key={col.id}
          column={col}
          tasks={grouped[col.id]}
          projectMap={projectMap}
          selectedId={selectedId}
          onSelect={handleSelect}
          onMove={handleMove}
        />
      ))}
    </div>
  );
}
