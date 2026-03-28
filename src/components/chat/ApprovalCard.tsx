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
    <div className="relative border border-[#E8E5E1] bg-white rounded-xl p-3 my-1 overflow-hidden max-h-14">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E85D3A] rounded-l-xl" />
      <div className="flex items-center gap-2 ml-1">
        <Icon className="w-4 h-4 text-[#E85D3A] shrink-0" />
        <span className="text-[13px] font-semibold text-[#1A1A1A]">
          {config.label}
        </span>
      </div>
      <p className="text-[13px] text-[#6B6660] mt-0.5 ml-7 truncate">
        {getDescription(toolName, args)}
      </p>
    </div>
  );
}
