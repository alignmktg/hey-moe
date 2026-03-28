import { useEffect } from "react";
import { useStore } from "../store/useStore";
import type { ViewMode } from "../store/useStore";

const viewKeys: Record<string, ViewMode> = {
  "1": "list",
  "2": "kanban",
  "3": "swipe",
  "4": "moe",
};

export function useKeyboardShortcuts() {
  const { toggleCmdK, setCurrentView } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (mod && e.key === "k") {
        e.preventDefault();
        toggleCmdK();
        return;
      }

      if (mod && e.key === "m") {
        e.preventDefault();
        setCurrentView("moe");
        return;
      }

      if (!isInput && viewKeys[e.key]) {
        e.preventDefault();
        setCurrentView(viewKeys[e.key]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCmdK, setCurrentView]);
}
