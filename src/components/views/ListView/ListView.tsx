import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonBadge,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonNote,
} from "@ionic/react";
import { add } from "ionicons/icons";
import { db, type Task } from "../../../db/dexieDB";
import { useSyncDB } from "../../../hooks/useSyncDB";
import { cn } from "../../../lib/cn";

export default function ListView() {
  const { addTask, updateTask } = useSyncDB();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLIonInputElement>(null);

  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.toArray();
    return all.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  const toggleDone = (task: Task) => {
    updateTask(task.id, {
      status: task.status === "done" ? "active" : "done",
    });
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      projectId: 1,
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: "'Fraunces', serif" }}>
            All Tasks
          </IonTitle>
          <IonBadge slot="end" color="medium" style={{ marginRight: 16 }}>
            {tasks?.length ?? 0}
          </IonBadge>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          {tasks?.map((task) => (
            <IonItem
              key={task.id}
              className={task.status === "done" ? "opacity-60" : ""}
            >
              <IonCheckbox
                slot="start"
                checked={task.status === "done"}
                onIonChange={() => toggleDone(task)}
                color="danger"
              />
              <IonLabel>
                <h2
                  className={cn(
                    "text-[15px] font-medium",
                    task.status === "done" && "line-through text-[#9C9690]",
                  )}
                >
                  {task.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {task.dueDate && (
                    <IonNote
                      color={isOverdue(task.dueDate) ? "danger" : undefined}
                      className="text-[12px]"
                    >
                      {formatDate(task.dueDate)}
                    </IonNote>
                  )}
                  {task.tags?.map((tag) => (
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
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        {isAdding && (
          <div className="px-4 py-3">
            <IonInput
              ref={inputRef}
              value={newTitle}
              placeholder="Task title..."
              onIonInput={(e) => setNewTitle(e.detail.value ?? "")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTitle("");
                }
              }}
              autofocus
            />
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            color="danger"
            onClick={() => {
              setIsAdding(true);
              setTimeout(() => inputRef.current?.setFocus(), 100);
            }}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
}
