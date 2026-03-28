import { db, type Task, type Project } from "../db/dexieDB";

export function useSyncDB() {
  const addTask = (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    return db.tasks.add({ ...data, createdAt: now, updatedAt: now } as Task);
  };

  const updateTask = (
    id: number,
    changes: Partial<Omit<Task, "id" | "createdAt">>,
  ) => {
    return db.tasks.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteTask = (id: number) => {
    return db.tasks.delete(id);
  };

  const addProject = (data: Omit<Project, "id" | "createdAt">) => {
    return db.projects.add({
      ...data,
      createdAt: new Date().toISOString(),
    } as Project);
  };

  const updateProject = (
    id: number,
    changes: Partial<Omit<Project, "id" | "createdAt">>,
  ) => {
    return db.projects.update(id, changes);
  };

  return { addTask, updateTask, deleteTask, addProject, updateProject };
}
