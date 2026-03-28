import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Calendar } from "lucide-react";
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
  index,
}: {
  task: Task;
  projectName?: string;
  isDoneColumn?: boolean;
  index: number;
}) {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow mb-3",
            "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
            snapshot.isDragging &&
              "shadow-[0_8px_24px_rgba(0,0,0,0.12)] scale-[1.02] rotate-[1deg]",
            isDoneColumn && "opacity-70",
          )}
        >
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
      )}
    </Draggable>
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

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[120px] rounded-lg transition-colors",
              snapshot.isDraggingOver &&
                "bg-[#E85D3A]/5 ring-2 ring-dashed ring-[#E85D3A]/20",
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                projectName={projectMap.get(task.projectId)}
                isDoneColumn={!isActive}
                index={index}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="rounded-xl border-2 border-dashed border-[#E85D3A]/30 h-[80px] flex items-center justify-center">
                <span className="text-[13px] text-[#9C9690] font-['Inter',sans-serif]">
                  No tasks
                </span>
              </div>
            )}
          </div>
        )}
      </Droppable>
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

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination || !tasks) return;

    const taskId = Number(draggableId);
    const newStatus = destination.droppableId as ColumnStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      updateTask(taskId, { status: newStatus });
    }
  };

  if (!tasks) return null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 px-4 pt-4 pb-24 h-full overflow-x-auto snap-x snap-mandatory overscroll-none lg:px-8 lg:pt-6 lg:snap-none lg:justify-center">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={grouped[col.id]}
            projectMap={projectMap}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
