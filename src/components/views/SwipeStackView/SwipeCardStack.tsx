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

const SWIPE_THRESHOLD = 120;

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E85D3A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
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

  // Drag feedback: green overlay (right/done)
  const greenOverlayOpacity = useTransform(
    x,
    [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
    [0, 0.04, 0.12],
  );
  const greenGlowAlpha = useTransform(
    x,
    [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
    [0, 0.1, 0.3],
  );

  // Drag feedback: coral overlay (left/defer)
  const coralOverlayOpacity = useTransform(
    x,
    [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
    [0.12, 0.04, 0],
  );
  const coralGlowAlpha = useTransform(
    x,
    [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
    [0.3, 0.1, 0],
  );

  // Label opacity
  const doneLabelOpacity = useTransform(
    x,
    [0, SWIPE_THRESHOLD * 0.4, SWIPE_THRESHOLD],
    [0, 0.3, 1],
  );
  const deferLabelOpacity = useTransform(
    x,
    [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.4, 0],
    [1, 0.3, 0],
  );

  // Dynamic box-shadow based on drag
  const boxShadow = useTransform(() => {
    const xVal = x.get();
    const baseShadow = "0 4px 20px rgba(0,0,0,0.08)";
    if (xVal > 10) {
      const alpha = Math.min(greenGlowAlpha.get(), 0.3);
      return `${baseShadow}, 0 0 0 3px rgba(45, 140, 95, ${alpha})`;
    }
    if (xVal < -10) {
      const alpha = Math.min(coralGlowAlpha.get(), 0.3);
      return `${baseShadow}, 0 0 0 3px rgba(232, 93, 58, ${alpha})`;
    }
    return baseShadow;
  });

  // Stack positioning
  const stackScale = 1 - stackIndex * 0.04;
  const stackY = stackIndex * 8;
  const stackOpacity = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.6 : 0.3;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 10 - stackIndex }}
      initial={{ scale: stackScale, y: stackY, opacity: stackOpacity }}
      animate={{ scale: stackScale, y: stackY, opacity: stackOpacity }}
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="relative w-full max-w-[360px] bg-white rounded-2xl overflow-hidden touch-manipulation select-none"
        style={{
          aspectRatio: "3 / 4",
          boxShadow: isTop ? boxShadow : "0 4px 20px rgba(0,0,0,0.08)",
          x: isTop ? x : undefined,
          rotate: isTop ? rotate : undefined,
        }}
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
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Coral gradient accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[#E85D3A] to-[#F0845D] rounded-t-2xl" />

        {/* DONE overlay */}
        {isTop && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center z-20"
            style={{
              backgroundColor: "rgba(45, 140, 95, 0.1)",
              opacity: greenOverlayOpacity,
            }}
          >
            <motion.div
              className="flex flex-col items-center gap-2"
              style={{ opacity: doneLabelOpacity }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D8C5F"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span
                className="text-lg font-semibold tracking-wide"
                style={{ color: "#2D8C5F" }}
              >
                DONE
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* DEFER overlay */}
        {isTop && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center z-20"
            style={{
              backgroundColor: "rgba(232, 93, 58, 0.1)",
              opacity: coralOverlayOpacity,
            }}
          >
            <motion.div
              className="flex flex-col items-center gap-2"
              style={{ opacity: deferLabelOpacity }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E85D3A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span
                className="text-lg font-semibold tracking-wide"
                style={{ color: "#E85D3A" }}
              >
                DEFER
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Card content */}
        <div className="relative z-10 flex flex-col h-[calc(100%-4px)] p-6">
          {/* Spacer to push content toward center */}
          <div className="flex-1" />

          {/* Title + project */}
          <div className="text-center">
            <h2
              className="text-[22px] font-semibold leading-tight mb-3"
              style={{
                fontFamily: "'Fraunces', serif",
                color: "#1A1A1A",
              }}
            >
              {task.title}
            </h2>
            {projectName && (
              <p
                className="text-[13px] mb-6"
                style={{ fontFamily: "'Inter', sans-serif", color: "#E85D3A" }}
              >
                {projectName}
              </p>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Metadata section */}
          <div
            className="pt-4 flex flex-col items-center gap-2"
            style={{ borderTop: "1px solid #E8E5E1" }}
          >
            {task.dueDate && (
              <div
                className="flex items-center gap-1.5 text-[13px]"
                style={{ color: "#6B6660" }}
              >
                <CalendarIcon />
                <span>Due {formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.deferDate && (
              <div
                className="flex items-center gap-1.5 text-[13px]"
                style={{ color: "#6B6660" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Deferred until {formatDate(task.deferDate)}</span>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[12px] px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "#FEF2EE",
                      color: "#E85D3A",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[12px] mt-1" style={{ color: "#9C9690" }}>
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
    <div
      className="flex flex-col h-full px-4 py-4"
      style={{ backgroundColor: "#FAFAF8" }}
    >
      {/* Counter */}
      {remaining.length > 0 && (
        <div className="text-center mb-2">
          <span
            className="text-[14px]"
            style={{ fontFamily: "'Inter', sans-serif", color: "#9C9690" }}
          >
            {currentIndex} of {totalCount}
          </span>
        </div>
      )}

      {/* Swipe hint labels */}
      {remaining.length > 0 && (
        <div className="flex justify-between px-4 mb-3">
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: "#9C9690" }}
          >
            &larr; Defer
          </span>
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: "#9C9690" }}
          >
            Done &rarr;
          </span>
        </div>
      )}

      {/* Card stack area */}
      <div className="relative flex-1">
        <AnimatePresence>
          {remaining.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <CheckCircleIcon />
                <div className="text-center">
                  <h3
                    className="text-[20px] font-semibold mb-2"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      color: "#1A1A1A",
                    }}
                  >
                    All caught up!
                  </h3>
                  <p className="text-[14px]" style={{ color: "#9C9690" }}>
                    No tasks to triage
                  </p>
                </div>
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
  );
}
