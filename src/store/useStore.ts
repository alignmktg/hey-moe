import { create } from "zustand";

export type ViewMode = "list" | "kanban" | "swipe" | "moe";

const VALID_VIEWS: ViewMode[] = ["list", "kanban", "swipe", "moe"];

function getInitialView(): ViewMode {
  const hash = window.location.hash.replace("#", "");
  if (VALID_VIEWS.includes(hash as ViewMode)) return hash as ViewMode;
  return "list";
}

interface UISlice {
  currentView: ViewMode;
  isNavSidebarOpen: boolean;
  isCmdKOpen: boolean;
}

interface ContextSlice {
  activeProjectId: string | null;
  activeTaskIds: string[];
}

interface Actions {
  setCurrentView: (view: ViewMode) => void;
  toggleNavSidebar: () => void;
  toggleCmdK: () => void;
  setActiveProject: (id: string | null) => void;
  setActiveTaskIds: (ids: string[]) => void;
}

interface DataSlice {
  dataMode: "demo" | "live";
}

export type StoreState = UISlice & ContextSlice & DataSlice & Actions;

export const useStore = create<StoreState>()((set) => ({
  // UI slice
  currentView: getInitialView(),
  isNavSidebarOpen: false,
  isCmdKOpen: false,

  // Context slice
  activeProjectId: null,
  activeTaskIds: [],

  // Data slice
  dataMode:
    (localStorage.getItem("hey-moe-data-mode") as "demo" | "live") ?? "demo",

  // Actions
  setCurrentView: (view) => {
    window.location.hash = view;
    set({ currentView: view });
  },
  toggleNavSidebar: () =>
    set((s) => ({ isNavSidebarOpen: !s.isNavSidebarOpen })),
  toggleCmdK: () => set((s) => ({ isCmdKOpen: !s.isCmdKOpen })),
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveTaskIds: (ids) => set({ activeTaskIds: ids }),
}));
