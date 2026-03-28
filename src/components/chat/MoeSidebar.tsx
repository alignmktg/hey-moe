import { type FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUp, Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useStore } from "../../store/useStore";
import { executeToolCall } from "../../agents/moeService";
import { ApprovalCard } from "./ApprovalCard";

const suggestions = [
  "Create a task",
  "Help me prioritize",
  "Break down a project",
];

export default function MoeSidebar() {
  const isOpen = useStore((s) => s.isMoeSidebarOpen);
  const toggle = useStore((s) => s.toggleMoeSidebar);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Execute tool calls client-side against Dexie
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (
          part.type === "tool-create_task" &&
          part.state === "output-available"
        ) {
          const output = part.output as Record<string, unknown>;
          if (output.action === "create_task") {
            executeToolCall("create_task", output);
          }
        }
      }
    }
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    sendMessage({ text });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={toggle}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col bg-white w-screen"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E5E1]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#E85D3A]" />
                <h2 className="font-['Fraunces',serif] text-[18px] font-semibold text-[#1A1A1A]">
                  Moe
                </h2>
              </div>
              <button
                onClick={toggle}
                className="p-2 -mr-2 rounded-lg text-[#6B6660] hover:bg-[#F0EDE8] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full -mt-8">
                  <div className="w-12 h-12 rounded-full bg-[#E85D3A] flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-['Fraunces',serif] text-[20px] font-semibold text-[#1A1A1A] mb-2">
                    Hey! I'm Moe
                  </h3>
                  <p className="text-[14px] text-[#6B6660] text-center max-w-[260px] mb-6 leading-relaxed">
                    Your AI task assistant. Ask me to create tasks, break down
                    projects, or help prioritize your work.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="rounded-full border border-[#E8E5E1] px-4 py-2 text-[13px] text-[#1A1A1A] hover:bg-[#FAFAF8] active:bg-[#F0EDE8] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, msgIdx) => {
                    const prevMessage = messages[msgIdx - 1];
                    const sameSender =
                      prevMessage && prevMessage.role === message.role;

                    return (
                      <div
                        key={message.id}
                        className={sameSender ? "!mt-1" : ""}
                      >
                        {message.parts.map((part, i) => {
                          if (part.type === "text" && part.text) {
                            return (
                              <div
                                key={`${message.id}-${i}`}
                                className={
                                  message.role === "user"
                                    ? "flex justify-end"
                                    : "flex justify-start"
                                }
                              >
                                <div
                                  className={
                                    message.role === "user"
                                      ? "bg-[#1A1A1A] text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]"
                                      : "bg-[#F5F3EF] text-[#1A1A1A] rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]"
                                  }
                                >
                                  <p className="text-[14px] whitespace-pre-wrap leading-relaxed">
                                    {part.text}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // Tool parts (tool-create_task, tool-spawn_sub_agent)
                          if (part.type.startsWith("tool-")) {
                            const toolPart = part as Record<string, unknown>;
                            const toolName = (part.type as string).replace(
                              "tool-",
                              "",
                            );
                            return (
                              <div
                                key={`${message.id}-${i}`}
                                className="max-w-[80%]"
                              >
                                <ApprovalCard
                                  toolName={toolName}
                                  args={
                                    (toolPart.input as Record<
                                      string,
                                      unknown
                                    >) ?? {}
                                  }
                                  result={toolPart.output ?? null}
                                />
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    );
                  })}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#F5F3EF] rounded-2xl rounded-bl-md px-4 py-2.5">
                        <div className="flex gap-1.5 items-center h-5">
                          <span className="w-1.5 h-1.5 bg-[#9C9690] rounded-full animate-pulse" />
                          <span className="w-1.5 h-1.5 bg-[#9C9690] rounded-full animate-pulse [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-[#9C9690] rounded-full animate-pulse [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[#E8E5E1] bg-white px-4 py-3 pb-[env(safe-area-inset-bottom,12px)]">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Moe..."
                  className="flex-1 rounded-xl bg-[#FAFAF8] border-0 px-4 py-2.5 text-[14px] text-[#1A1A1A] placeholder:text-[#9C9690] focus:outline-none focus:ring-2 focus:ring-[#E85D3A]/10 min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-[#E85D3A] text-white disabled:opacity-30 disabled:pointer-events-none transition-opacity shrink-0"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
