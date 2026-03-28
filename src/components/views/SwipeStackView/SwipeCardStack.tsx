import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { db, type Task } from "../../../db/dexieDB";
import { useSyncDB } from "../../../hooks/useSyncDB";

const SWIPE_THRESHOLD = 120;

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SwipeCard({
  task,
  projectName,
  stackIndex,
  onSwipe,
}: {
  task: Task;
  projectName?: string;
  stackIndex: number;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const isTop = stackIndex === 0;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.15]);
  const redOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.15, 0]);
  const doneLabel = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const deferLabel = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const stackScale = 1 - stackIndex * 0.04;
  const stackY = stackIndex * 8;
  const stackOpacity = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.6 : 0.3;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-6"
      style={{ zIndex: 10 - stackIndex }}
      initial={{ scale: stackScale, y: stackY, opacity: stackOpacity }}
      animate={{ scale: stackScale, y: stackY, opacity: stackOpacity }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="relative w-full max-w-[360px] bg-white rounded-2xl overflow-hidden select-none shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{
          aspectRatio: "3 / 4",
          x: isTop ? x : undefined,
          rotate: isTop ? rotate : undefined,
        }}
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
          else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#E85D3A] to-[#F0845D]" />

        {isTop && (
          <>
            <motion.div
              className="absolute inset-0 bg-green-500/10 pointer-events-none flex items-center justify-center"
              style={{ opacity: greenOpacity }}
            >
              <motion.span
                className="text-lg font-semibold text-green-600"
                style={{ opacity: doneLabel }}
              >
                DONE
              </motion.span>
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-red-500/10 pointer-events-none flex items-center justify-center"
              style={{ opacity: redOpacity }}
            >
              <motion.span
                className="text-lg font-semibold text-[#E85D3A]"
                style={{ opacity: deferLabel }}
              >
                DEFER
              </motion.span>
            </motion.div>
          </>
        )}

        <div className="relative z-10 flex flex-col h-[calc(100%-4px)] p-6">
          <div className="flex-1" />
          <div className="text-center">
            <h2
              className="text-[22px] font-semibold leading-tight mb-3"
              style={{ fontFamily: "'Fraunces', serif", color: "#1A1A1A" }}
            >
              {task.title}
            </h2>
            {projectName && (
              <p className="text-[13px] mb-6" style={{ color: "#E85D3A" }}>
                {projectName}
              </p>
            )}
          </div>
          <div className="flex-1" />
          <div className="pt-4 flex flex-col items-center gap-2 border-t border-[#E8E5E1]">
            {task.dueDate && (
              <p className="text-[13px] text-[#6B6660]">
                Due {formatDate(task.dueDate)}
              </p>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#FEF2EE] text-[#E85D3A]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[12px] text-[#9C9690]">
              Created {formatDate(task.createdAt)}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SwipeCardStack() {
  const { updateTask } = useSyncDB();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const allTasks = useLiveQuery(async () => {
    const tasks = await db.tasks.where("status").equals("active").toArray();
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => !t.deferDate || t.deferDate <= today);
  });

  const projects = useLiveQuery(() => db.projects.toArray());
  const projectMap = new Map<number, string>();
  projects?.forEach((p) => projectMap.set(p.id, p.name));

  const remaining = allTasks?.filter((t) => !dismissedIds.has(t.id)) ?? [];
  const totalCount = allTasks?.length ?? 0;
  const currentIndex = totalCount - remaining.length + 1;

  const handleSwipe = useCallback(
    (task: Task, direction: "left" | "right") => {
      setDismissedIds((prev) => new Set(prev).add(task.id));
      if (direction === "right") {
        updateTask(task.id, { status: "done" });
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateTask(task.id, {
          deferDate: tomorrow.toISOString().split("T")[0],
        });
      }
    },
    [updateTask],
  );

  if (!allTasks) return null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: "'Fraunces', serif" }}>Swipe</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen scrollY={false}>
        <div className="flex flex-col h-full px-4 py-4">
          {remaining.length > 0 && (
            <>
              <div className="text-center mb-2 text-[14px] text-[#9C9690]">
                {currentIndex} of {totalCount}
              </div>
              <div className="flex justify-between px-4 mb-3 text-[11px] uppercase tracking-widest text-[#9C9690]">
                <span>&larr; Defer</span>
                <span>Done &rarr;</span>
              </div>
            </>
          )}
          <div className="relative flex-1">
            <AnimatePresence>
              {remaining.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center">
                    <h3
                      className="text-[20px] font-semibold mb-2"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      All caught up!
                    </h3>
                    <p className="text-[14px] text-[#9C9690]">
                      No tasks to triage
                    </p>
                  </div>
                </motion.div>
              ) : (
                remaining
                  .slice(0, 3)
                  .map((task, i) => (
                    <SwipeCard
                      key={task.id}
                      task={task}
                      projectName={projectMap.get(task.projectId)}
                      stackIndex={i}
                      onSwipe={(dir) => handleSwipe(task, dir)}
                    />
                  ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
