import { db } from "../db/dexieDB";
import type { ToolCallResult } from "./toolSchemas";

interface CreateTaskArgs {
  title: string;
  projectId?: string;
  status: "active" | "done" | "dropped";
}

interface SpawnSubAgentArgs {
  taskType: "research" | "code_generation" | "project_breakdown";
  entityId: string;
  instructions: string;
}

export async function executeToolCall(
  toolName: string,
  args: unknown,
): Promise<ToolCallResult> {
  try {
    switch (toolName) {
      case "create_task":
        return await handleCreateTask(args as CreateTaskArgs);
      case "spawn_sub_agent":
        return handleSpawnSubAgent(args as SpawnSubAgentArgs);
      default:
        return { error: true, message: `Unknown tool: ${toolName}` };
    }
  } catch {
    return {
      error: true,
      message: "System Error: Payload malformed. Please retry the generation.",
    };
  }
}

async function handleCreateTask(args: CreateTaskArgs): Promise<ToolCallResult> {
  if (!args.title || !args.status) {
    return {
      error: true,
      message: "System Error: Payload malformed. Please retry the generation.",
    };
  }

  const now = new Date().toISOString();
  const id = await db.tasks.add({
    title: args.title,
    projectId: args.projectId ? Number(args.projectId) : 0,
    status: args.status === "dropped" ? "done" : args.status,
    tags: [],
    createdAt: now,
    updatedAt: now,
  });

  return {
    success: true,
    message: `Task "${args.title}" created`,
    result: { id, title: args.title, status: args.status },
  };
}

function handleSpawnSubAgent(args: SpawnSubAgentArgs): ToolCallResult {
  if (!args.taskType || !args.entityId || !args.instructions) {
    return {
      error: true,
      message: "System Error: Payload malformed. Please retry the generation.",
    };
  }

  console.log(
    `[Moe] Sub-agent dispatched: ${args.taskType} for entity ${args.entityId}`,
    { instructions: args.instructions },
  );

  return {
    success: true,
    message: `Sub-agent dispatched for ${args.taskType} on entity ${args.entityId}`,
    result: {
      taskType: args.taskType,
      entityId: args.entityId,
      status: "simulated_complete",
      output: `[PoC] Simulated ${args.taskType} result for entity ${args.entityId}`,
    },
  };
}
