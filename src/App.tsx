import { lazy, Suspense } from "react";
import { useStore } from "./store/useStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { AppShell } from "./components/layout/AppShell";
import { Sidebar } from "./components/layout/Sidebar";
import { CmdKModal } from "./components/layout/CmdKModal";

const ListView = lazy(() => import("./components/views/ListView/ListView"));
const KanbanBoard = lazy(
  () => import("./components/views/KanbanView/KanbanBoard"),
);
const SwipeCardStack = lazy(
  () => import("./components/views/SwipeStackView/SwipeCardStack"),
);
const MoeView = lazy(() => import("./components/views/MoeView/MoeView"));

const views = {
  list: ListView,
  kanban: KanbanBoard,
  swipe: SwipeCardStack,
  moe: MoeView,
} as const;

function App() {
  useKeyboardShortcuts();
  const currentView = useStore((s) => s.currentView);
  const ActiveView = views[currentView];

  return (
    <>
      <AppShell>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-gray-400 text-sm">
              Loading...
            </div>
          }
        >
          <ActiveView />
        </Suspense>
      </AppShell>

      <Sidebar />
      <CmdKModal />
    </>
  );
}

export default App;
