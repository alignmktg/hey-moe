import { CheckCircle, Zap, Wrench } from "lucide-react";

interface ApprovalCardProps {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

const toolConfig: Record<string, { icon: typeof CheckCircle; label: string }> =
  {
    create_task: { icon: CheckCircle, label: "Created Task" },
    spawn_sub_agent: { icon: Zap, label: "Spawned Sub-Agent" },
  };

function getDescription(
  toolName: string,
  args: Record<string, unknown>,
): string {
  switch (toolName) {
    case "create_task":
      return (args.title as string) ?? "New task";
    case "spawn_sub_agent":
      return `${args.taskType ?? "task"} for ${args.entityId ?? "entity"}`;
    default:
      return JSON.stringify(args).slice(0, 80);
  }
}

export function ApprovalCard({ toolName, args }: ApprovalCardProps) {
  const config = toolConfig[toolName] ?? {
    icon: Wrench,
    label: toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
  const Icon = config.icon;

  return (
    <div className="border-l-4 border-green-500 bg-green-50 rounded-lg p-3 my-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-sm font-medium text-gray-900">
          {config.label}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1 ml-6">
        {getDescription(toolName, args)}
      </p>
    </div>
  );
}
