import { create } from "zustand";

export type ViewMode = "list" | "kanban" | "swipe";

interface UISlice {
  currentView: ViewMode;
  isNavSidebarOpen: boolean;
  isMoeSidebarOpen: boolean;
  isCmdKOpen: boolean;
}

interface ContextSlice {
  activeProjectId: string | null;
  activeTaskIds: string[];
}

interface Actions {
  setCurrentView: (view: ViewMode) => void;
  toggleNavSidebar: () => void;
  toggleMoeSidebar: () => void;
  toggleCmdK: () => void;
  setActiveProject: (id: string | null) => void;
  setActiveTaskIds: (ids: string[]) => void;
}

export type StoreState = UISlice & ContextSlice & Actions;

export const useStore = create<StoreState>()((set) => ({
  // UI slice
  currentView: "list",
  isNavSidebarOpen: false,
  isMoeSidebarOpen: false,
  isCmdKOpen: false,

  // Context slice
  activeProjectId: null,
  activeTaskIds: [],

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  toggleNavSidebar: () =>
    set((s) => ({ isNavSidebarOpen: !s.isNavSidebarOpen })),
  toggleMoeSidebar: () =>
    set((s) => ({ isMoeSidebarOpen: !s.isMoeSidebarOpen })),
  toggleCmdK: () => set((s) => ({ isCmdKOpen: !s.isCmdKOpen })),
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveTaskIds: (ids) => set({ activeTaskIds: ids }),
}));
