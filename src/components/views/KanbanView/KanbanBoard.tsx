import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItemSliding,
  IonItem,
  IonLabel,
  IonItemOptions,
  IonItemOption,
  IonList,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { db, type Task } from "../../../db/dexieDB";
import { useSyncDB } from "../../../hooks/useSyncDB";
import { cn } from "../../../lib/cn";
import { useState } from "react";

const PROJECT_COLORS = [
  "#E85D3A",
  "#2D8C5F",
  "#6366F1",
  "#D97706",
  "#8B5CF6",
  "#EC4899",
];

function getProjectColor(id: number) {
  return PROJECT_COLORS[id % PROJECT_COLORS.length];
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

export default function KanbanBoard() {
  const { updateTask } = useSyncDB();
  const [column, setColumn] = useState<"active" | "done">("active");

  const tasks = useLiveQuery(() => db.tasks.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());

  const projectMap = useMemo(() => {
    const m = new Map<number, string>();
    projects?.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = { active: [], done: [] };
    tasks?.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  const currentTasks = grouped[column] ?? [];

  const moveTask = (task: Task) => {
    updateTask(task.id, {
      status: task.status === "active" ? "done" : "active",
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: "'Fraunces', serif" }}>
            Kanban
          </IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={column}
            onIonChange={(e) => setColumn(e.detail.value as "active" | "done")}
          >
            <IonSegmentButton value="active">
              Active ({grouped.active?.length ?? 0})
            </IonSegmentButton>
            <IonSegmentButton value="done">
              Done ({grouped.done?.length ?? 0})
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          {currentTasks.map((task) => (
            <IonItemSliding key={task.id}>
              <IonItem className={column === "done" ? "opacity-60" : ""}>
                <div
                  slot="start"
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getProjectColor(task.projectId) }}
                />
                <IonLabel>
                  <h2
                    className={cn(
                      "text-[15px] font-medium",
                      column === "done" && "line-through text-[#9C9690]",
                    )}
                  >
                    {task.title}
                  </h2>
                  <p className="text-[12px] text-[#6B6660]">
                    {projectMap.get(task.projectId)}
                    {task.dueDate && (
                      <span
                        className={
                          isOverdue(task.dueDate)
                            ? "text-[#E85D3A] ml-2"
                            : " ml-2"
                        }
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </p>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full",
                            tag === "urgent"
                              ? "bg-[#FEF2EE] text-[#E85D3A]"
                              : "bg-[#F0EDE8] text-[#6B6660]",
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </IonLabel>
              </IonItem>

              <IonItemOptions side="end">
                <IonItemOption
                  color={column === "active" ? "success" : "medium"}
                  onClick={() => moveTask(task)}
                >
                  {column === "active" ? "Done" : "Reopen"}
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}

          {currentTasks.length === 0 && (
            <div className="flex items-center justify-center h-40 text-[#9C9690] text-[14px]">
              No {column} tasks
            </div>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
}
