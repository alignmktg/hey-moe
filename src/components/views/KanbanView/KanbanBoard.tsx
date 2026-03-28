import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
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

function SortableCard({
  task,
  projectName,
}: {
  task: Task;
  projectName?: string;
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

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={cn(
        "bg-white rounded-xl p-4 shadow-sm touch-manipulation",
        isDragging && "opacity-50 shadow-lg",
      )}
      {...attributes}
      {...listeners}
    >
      <p className="text-[15px] text-gray-900 leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 mt-2">
        {projectName && (
          <span className="text-xs text-gray-400">{projectName}</span>
        )}
        {task.dueDate && (
          <span className="text-xs text-gray-400">
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
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

  return (
    <div className="flex-shrink-0 w-[80vw] max-w-[320px] snap-center">
      <div className="flex items-center gap-2 mb-3 px-1">
        <h3 className="text-sm font-semibold text-gray-900">{column.label}</h3>
        <span className="text-xs text-gray-400">{tasks.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[120px]">
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              projectName={projectMap.get(task.projectId)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const { updateTask } = useSyncDB();

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
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
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 px-4 pt-2 pb-24 overflow-x-auto snap-x snap-mandatory h-full">
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
