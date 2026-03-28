import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
import { z } from "zod";

export const config = { runtime: "edge" };

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Moe, an AI task management assistant for the Hey Moe app. You help users manage tasks and projects. When users want to create tasks or spawn sub-agents for research/work, use the available tools. Be concise, friendly, and action-oriented. Always confirm what you did after using a tool.`;

const tools = {
  create_task: tool({
    description: "Creates a new task in the user's local database",
    inputSchema: z.object({
      title: z.string().describe("The task title"),
      projectId: z.string().optional().describe("Optional parent project ID"),
      status: z
        .enum(["active", "done", "dropped"])
        .default("active")
        .describe("Task status"),
    }),
    execute: async ({ title, status, projectId }) => ({
      action: "create_task",
      title,
      status,
      projectId,
    }),
  }),
  spawn_sub_agent: tool({
    description:
      "Dispatches a background agent to perform complex work like research, code generation, or project breakdown",
    inputSchema: z.object({
      taskType: z.enum(["research", "code_generation", "project_breakdown"]),
      entityId: z.string().describe("The ID of the task or project"),
      instructions: z.string().describe("Instructions for the sub-agent"),
    }),
    execute: async ({ taskType, entityId, instructions }) => ({
      action: "spawn_sub_agent",
      taskType,
      entityId,
      instructions,
      status: "simulated_complete",
    }),
  }),
};

export type ChatTools = typeof tools;

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
