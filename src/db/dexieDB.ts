import Dexie, { type EntityTable } from "dexie";

export interface Task {
  id: number;
  title: string;
  projectId: number;
  status: "active" | "done";
  deferDate?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  type: "milestone" | "area";
  status: "active" | "archived";
  createdAt: string;
}

export interface Canvas {
  id: number;
  entityId: number;
  content: string;
  lastAgentUpdate: string;
}

export interface Artifact {
  id: number;
  entityId: number;
  type: string;
  content: string;
  generatedBy: string;
}

const db = new Dexie("HeyMoeDB") as Dexie & {
  tasks: EntityTable<Task, "id">;
  projects: EntityTable<Project, "id">;
  canvas: EntityTable<Canvas, "id">;
  artifacts: EntityTable<Artifact, "id">;
};

db.version(1).stores({
  tasks:
    "++id, title, projectId, status, deferDate, dueDate, tags, createdAt, updatedAt",
  projects: "++id, name, type, status, createdAt",
  canvas: "++id, entityId, content, lastAgentUpdate",
  artifacts: "++id, entityId, type, content, generatedBy",
});

db.on("populate", (tx) => {
  const now = new Date().toISOString();

  tx.table("projects").bulkAdd([
    {
      name: "Product Launch",
      type: "milestone",
      status: "active",
      createdAt: now,
    },
    { name: "Personal", type: "area", status: "active", createdAt: now },
  ]);

  tx.table("tasks").bulkAdd([
    {
      title: "Finalize pricing tiers",
      projectId: 1,
      status: "active",
      tags: ["urgent"],
      dueDate: "2026-04-01",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Write launch blog post",
      projectId: 1,
      status: "active",
      tags: ["design"],
      deferDate: "2026-03-30",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Set up analytics dashboard",
      projectId: 1,
      status: "done",
      tags: ["dev"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Create onboarding email sequence",
      projectId: 1,
      status: "active",
      tags: ["design", "urgent"],
      dueDate: "2026-04-03",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "QA pass on checkout flow",
      projectId: 1,
      status: "active",
      tags: ["dev"],
      deferDate: "2026-03-29",
      dueDate: "2026-04-02",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Coordinate press kit with PR agency",
      projectId: 1,
      status: "done",
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Book dentist appointment",
      projectId: 2,
      status: "active",
      tags: [],
      dueDate: "2026-04-10",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Research new standing desk",
      projectId: 2,
      status: "active",
      tags: [],
      deferDate: "2026-04-05",
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Renew gym membership",
      projectId: 2,
      status: "done",
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Plan weekend trip to coast",
      projectId: 2,
      status: "active",
      tags: ["urgent"],
      dueDate: "2026-04-04",
      createdAt: now,
      updatedAt: now,
    },
  ]);
});

export { db };
