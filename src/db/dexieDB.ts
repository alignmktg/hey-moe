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

// Demo/live mode: stored in localStorage
const DATA_MODE_KEY = "hey-moe-data-mode";

export function getDataMode(): "demo" | "live" {
  return (localStorage.getItem(DATA_MODE_KEY) as "demo" | "live") ?? "demo";
}

export async function setDataMode(mode: "demo" | "live") {
  localStorage.setItem(DATA_MODE_KEY, mode);
  await db.delete();
  window.location.reload();
}

// Seed demo data from Matt's real Linear projects
db.on("populate", (tx) => {
  if (getDataMode() === "live") return;

  const now = new Date().toISOString();
  const d = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split("T")[0];
  };

  // Real projects from Linear
  tx.table("projects").bulkAdd([
    // id: 1
    {
      name: "X-Ray / AI Mirror",
      type: "milestone",
      status: "active",
      createdAt: now,
    },
    // id: 2
    {
      name: "BWAI Platform",
      type: "milestone",
      status: "active",
      createdAt: now,
    },
    // id: 3
    {
      name: "GTM & Launch",
      type: "area",
      status: "active",
      createdAt: now,
    },
    // id: 4
    {
      name: "Client Ops",
      type: "area",
      status: "active",
      createdAt: now,
    },
    // id: 5
    {
      name: "Personal / Hey Moe",
      type: "area",
      status: "active",
      createdAt: now,
    },
  ]);

  tx.table("tasks").bulkAdd([
    // X-Ray / AI Mirror — active
    {
      title: "Fix rabbit hole interview issue (V9 prompt)",
      projectId: 1,
      status: "done",
      tags: ["product"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Get letter prompt into live X-Ray site for Lizzy",
      projectId: 1,
      status: "done",
      tags: ["product"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Discuss experience variants — leader vs IC tracks",
      projectId: 1,
      status: "active",
      tags: ["strategy"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Ship X-Ray report for UC Berkeley Haas",
      projectId: 1,
      status: "active",
      tags: ["urgent", "client"],
      dueDate: d(5),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Build V2 Intelligence Report product plan",
      projectId: 1,
      status: "active",
      tags: ["product"],
      createdAt: now,
      updatedAt: now,
    },

    // BWAI Platform
    {
      title: "Set up MCP servers (Jam.dev, integrations)",
      projectId: 2,
      status: "active",
      tags: ["urgent", "dev"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "BWAI platform evolution — architecture review",
      projectId: 2,
      status: "active",
      tags: ["dev"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Configure and share Leadership Pipeline",
      projectId: 2,
      status: "done",
      tags: ["product"],
      createdAt: now,
      updatedAt: now,
    },

    // GTM & Launch
    {
      title: "AI Intelligence Report — 30-day launch campaign",
      projectId: 3,
      status: "active",
      tags: ["urgent", "marketing"],
      dueDate: d(7),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "AI Momentum landing page updates",
      projectId: 3,
      status: "active",
      tags: ["marketing"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "MoPS x BWAI dinner series logistics",
      projectId: 3,
      status: "active",
      tags: ["events"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Nish speaking engagement applications",
      projectId: 3,
      status: "active",
      tags: ["marketing"],
      deferDate: d(3),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "BYU lecture prep",
      projectId: 3,
      status: "active",
      tags: [],
      dueDate: d(10),
      deferDate: d(5),
      createdAt: now,
      updatedAt: now,
    },

    // Client Ops
    {
      title: "Pleora — X-Ray pricing follow-up with Kerry",
      projectId: 4,
      status: "active",
      tags: ["urgent", "client"],
      dueDate: d(3),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Sysco — prep for C-suite AI transformation meeting",
      projectId: 4,
      status: "active",
      tags: ["client"],
      dueDate: d(60),
      deferDate: d(30),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Endava — push intro call with CTO",
      projectId: 4,
      status: "active",
      tags: ["client"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "HLX / Magic Mirror — meeting with Sean + CEO",
      projectId: 4,
      status: "active",
      tags: ["client"],
      dueDate: d(7),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Ancestry — AI session for monthly program",
      projectId: 4,
      status: "active",
      tags: ["client"],
      deferDate: d(14),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Workday engagement wrap-up",
      projectId: 4,
      status: "done",
      tags: ["client"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Synchrony — final deliverables",
      projectId: 4,
      status: "done",
      tags: ["client"],
      createdAt: now,
      updatedAt: now,
    },

    // Personal / Hey Moe
    {
      title: "Hey Moe — design overhaul and deploy",
      projectId: 5,
      status: "active",
      tags: ["dev"],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Review Backboard AI Memory tool",
      projectId: 5,
      status: "active",
      tags: [],
      deferDate: d(30),
      createdAt: now,
      updatedAt: now,
    },
  ]);
});

export { db };
