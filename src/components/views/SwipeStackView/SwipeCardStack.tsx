import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { db, type Task } from "../../../db/dexieDB";
import { useStore } from "../../../store/useStore";
import { useSyncDB } from "../../../hooks/useSyncDB";

const SWIPE_THRESHOLD = 100;

function SwipeCard({
  task,
  projectName,
  isTop,
  onSwipe,
}: {
  task: Task;
  projectName?: string;
  isTop: boolean;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.3]);
  const redOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.3, 0]);

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: isTop ? 2 : 1,
      }}
      initial={isTop ? { scale: 1, y: 0 } : { scale: 0.95, y: 10 }}
      animate={isTop ? { scale: 1, y: 0 } : { scale: 0.95, y: 10 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="relative w-full h-[60vh] bg-white rounded-2xl shadow-lg overflow-hidden touch-manipulation"
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD) {
            onSwipe("right");
          } else if (info.offset.x < -SWIPE_THRESHOLD) {
            onSwipe("left");
          }
        }}
        style={isTop ? { x, rotate } : undefined}
        animate={isTop ? undefined : { scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Green overlay (right swipe = done) */}
        {isTop && (
          <motion.div
            className="absolute inset-0 bg-green-400 rounded-2xl pointer-events-none"
            style={{ opacity: greenOpacity }}
          />
        )}
        {/* Red overlay (left swipe = defer) */}
        {isTop && (
          <motion.div
            className="absolute inset-0 bg-red-400 rounded-2xl pointer-events-none"
            style={{ opacity: redOpacity }}
          />
        )}

        {/* Swipe hint labels */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-6 right-6 px-3 py-1.5 rounded-lg border-2 border-green-500 pointer-events-none"
              style={{ opacity: greenOpacity }}
            >
              <span className="text-green-600 font-bold text-sm">DONE</span>
            </motion.div>
            <motion.div
              className="absolute top-6 left-6 px-3 py-1.5 rounded-lg border-2 border-red-500 pointer-events-none"
              style={{ opacity: redOpacity }}
            >
              <span className="text-red-600 font-bold text-sm">DEFER</span>
            </motion.div>
          </>
        )}

        <div className="relative z-10 flex flex-col h-full p-6 pt-14">
          <h2 className="text-2xl font-semibold text-gray-900 leading-tight">
            {task.title}
          </h2>
          {projectName && (
            <p className="mt-2 text-sm text-indigo-600">{projectName}</p>
          )}
          <div className="mt-auto space-y-3">
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Due
                </span>
                <span className="text-sm text-gray-900">
                  {formatDate(task.dueDate)}
                </span>
              </div>
            )}
            {task.deferDate && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Deferred
                </span>
                <span className="text-sm text-gray-900">
                  {formatDate(task.deferDate)}
                </span>
              </div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">
              Created {formatDate(task.createdAt)}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SwipeCardStack() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const { updateTask } = useSyncDB();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const allTasks = useLiveQuery(async () => {
    const collection = db.tasks.where("status").equals("active");
    const tasks = await collection.toArray();

    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => {
      if (activeProjectId && t.projectId !== Number(activeProjectId))
        return false;
      if (t.deferDate && t.deferDate > today) return false;
      return true;
    });
  }, [activeProjectId]);

  const projects = useLiveQuery(() => db.projects.toArray());

  const projectMap = new Map<number, string>();
  projects?.forEach((p) => projectMap.set(p.id, p.name));

  const remaining = allTasks?.filter((t) => !dismissedIds.has(t.id)) ?? [];
  const totalCount = allTasks?.length ?? 0;

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
    <div className="flex flex-col h-full px-4 pt-2">
      {/* Counter */}
      <div className="text-center mb-4">
        <span className="text-sm text-gray-400">
          {remaining.length} of {totalCount} remaining
        </span>
      </div>

      {/* Swipe hints */}
      {remaining.length > 0 && (
        <div className="flex justify-between px-2 mb-3">
          <span className="text-xs text-red-400">← Defer</span>
          <span className="text-xs text-green-500">Done →</span>
        </div>
      )}

      {/* Card stack */}
      <div className="relative flex-1">
        <AnimatePresence>
          {remaining.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center h-[60vh]"
            >
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-900">
                  No more tasks!
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  You're all caught up.
                </p>
              </div>
            </motion.div>
          ) : (
            remaining
              .slice(0, 2)
              .reverse()
              .map((task, i, arr) => (
                <SwipeCard
                  key={task.id}
                  task={task}
                  projectName={projectMap.get(task.projectId)}
                  isTop={i === arr.length - 1}
                  onSwipe={(dir) => handleSwipe(task, dir)}
                />
              ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
