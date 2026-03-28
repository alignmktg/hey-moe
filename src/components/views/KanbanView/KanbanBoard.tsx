import { useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { Calendar, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

function SortableCard({
  task,
  projectName,
  isDoneColumn,
}: {
  task: Task;
  projectName?: string;
  isDoneColumn?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={cn(
        "bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow relative",
        "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        isDragging &&
          "opacity-50 shadow-[0_4px_12px_rgba(0,0,0,0.12)] scale-[1.02]",
        isDoneColumn && "opacity-70",
      )}
      {...attributes}
    >
      <div className="flex">
        {/* Drag handle */}
        <div
          className="flex items-center justify-center w-10 shrink-0 cursor-grab active:cursor-grabbing text-[#9C9690] hover:text-[#6B6660] touch-none"
          {...listeners}
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 py-3.5 pr-4">
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
        </div>
      </div>
    </motion.div>
  );
}

function Column({
  column,
  tasks,
  projectMap,
}: {
  column: { id: ColumnStatus; label: string };
  tasks: Task[];
  projectMap: Map<number, string>;
}) {
  const taskIds = tasks.map((t) => t.id);
  const isActive = column.id === "active";

  return (
    <div
      className={cn(
        "flex-shrink-0 w-[80vw] max-w-[320px] snap-start rounded-xl p-3 lg:w-[380px] lg:max-w-[380px] lg:flex-shrink",
        isActive ? "bg-[#FAFAF8]" : "bg-[#F5F3EF]",
      )}
    >
      {/* Column header */}
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

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 min-h-[120px]">
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              projectName={projectMap.get(task.projectId)}
              isDoneColumn={!isActive}
            />
          ))}
          {tasks.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-[#E85D3A]/30 h-[80px] flex items-center justify-center">
              <span className="text-[13px] text-[#9C9690] font-['Inter',sans-serif]">
                Drop here
              </span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const { updateTask } = useSyncDB();
  const [isDragging, setIsDragging] = useState(false);

  // Live query for tasks — but freeze during drag to prevent teleporting
  const liveTasks = useLiveQuery(async () => {
    if (activeProjectId) {
      return db.tasks
        .where("projectId")
        .equals(Number(activeProjectId))
        .toArray();
    }
    return db.tasks.toArray();
  }, [activeProjectId]);

  const frozenTasksRef = useRef<Task[] | null>(null);

  // When drag starts, snapshot the current tasks. When drag ends, clear snapshot.
  const tasks =
    isDragging && frozenTasksRef.current ? frozenTasksRef.current : liveTasks;

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  const handleDragStart = () => {
    // Freeze current task state so live queries don't cause teleporting
    frozenTasksRef.current = liveTasks ? [...liveTasks] : null;
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    frozenTasksRef.current = null;
    setIsDragging(false);
    const { active, over } = event;
    if (!over || !tasks) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Determine target column by finding which column the "over" item belongs to
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && overTask.status !== draggedTask.status) {
      updateTask(draggedTask.id, { status: overTask.status });
    }
  };

  if (!tasks) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        frozenTasksRef.current = null;
        setIsDragging(false);
      }}
    >
      <div
        className={cn(
          "flex gap-4 px-4 pt-4 pb-24 h-full lg:px-8 lg:pt-6 lg:snap-none lg:justify-center overscroll-none",
          isDragging
            ? "overflow-hidden"
            : "overflow-x-auto snap-x snap-mandatory",
        )}
      >
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={grouped[col.id]}
            projectMap={projectMap}
          />
        ))}
      </div>
    </DndContext>
  );
}
