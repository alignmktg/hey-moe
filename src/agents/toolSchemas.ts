export const TOOL_SCHEMAS = {
  create_task: {
    name: "create_task",
    description: "Creates a new task in the local database.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "The task title" },
        projectId: {
          type: "string",
          description: "Optional ID of the parent project",
        },
        status: {
          type: "string",
          enum: ["active", "done", "dropped"],
        },
      },
      required: ["title", "status"],
    },
  },
  spawn_sub_agent: {
    name: "spawn_sub_agent",
    description: "Dispatches a background agent to perform complex work.",
    parameters: {
      type: "object",
      properties: {
        taskType: {
          type: "string",
          enum: ["research", "code_generation", "project_breakdown"],
        },
        entityId: {
          type: "string",
          description: "The ID of the task or project this work belongs to",
        },
        instructions: {
          type: "string",
          description: "Explicit instructions for the sub-agent",
        },
      },
      required: ["taskType", "entityId", "instructions"],
    },
  },
} as const;

export interface ToolCallResult {
  success?: boolean;
  error?: boolean;
  message: string;
  result?: unknown;
}
