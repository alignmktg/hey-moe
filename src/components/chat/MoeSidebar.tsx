import { type FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUp } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useStore } from "../../store/useStore";
import { executeToolCall } from "../../agents/moeService";
import { ApprovalCard } from "./ApprovalCard";

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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Moe</h2>
              <button
                onClick={toggle}
                className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-8">
                  Ask Moe anything
                </p>
              )}

              {messages.map((message) => (
                <div key={message.id}>
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
                                ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%]"
                                : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[85%]"
                            }
                          >
                            <p className="text-sm whitespace-pre-wrap">
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
                        <div key={`${message.id}-${i}`} className="max-w-[85%]">
                          <ApprovalCard
                            toolName={toolName}
                            args={
                              (toolPart.input as Record<string, unknown>) ?? {}
                            }
                            result={toolPart.output ?? null}
                          />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                    <div className="flex gap-1 items-center h-5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-4 py-3 pb-[env(safe-area-inset-bottom,12px)]">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Moe..."
                  className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-indigo-600 text-white disabled:opacity-40 disabled:pointer-events-none transition-opacity shrink-0"
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
