import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
} from "@ionic/react";
import { ArrowUp, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { executeToolCall } from "../../../agents/moeService";
import { ApprovalCard } from "../../chat/ApprovalCard";

const suggestions = [
  "Create a task",
  "Help me prioritize",
  "Break down a project",
];

const MAX_TEXTAREA_HEIGHT = 160;

export default function MoeView() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, []);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
    el.style.overflowY =
      el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: "'Fraunces', serif" }}>Moe</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="px-4 py-5 lg:px-8 lg:max-w-[700px] lg:mx-auto lg:w-full min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full -mt-8">
              <div className="w-14 h-14 rounded-full bg-[#E85D3A] flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-['Fraunces',serif] text-[24px] font-semibold text-[#1A1A1A] mb-2">
                Hey! I'm Moe
              </h2>
              <p className="text-[15px] text-[#6B6660] text-center max-w-[320px] mb-8 leading-relaxed">
                Your AI task assistant. Ask me to create tasks, break down
                projects, or help prioritize your work.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage({ text: s })}
                    className="rounded-full border border-[#E8E5E1] px-5 py-2.5 text-[14px] text-[#1A1A1A] hover:bg-[#FAFAF8] active:bg-[#F0EDE8] transition-colors"
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
                  <div key={message.id} className={sameSender ? "!mt-1" : ""}>
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
                                  ? "bg-[#1A1A1A] text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]"
                                  : "bg-[#F5F3EF] text-[#1A1A1A] rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%]"
                              }
                            >
                              {message.role === "assistant" ? (
                                <div className="text-[14px] leading-relaxed prose prose-sm prose-stone max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:bg-[#E8E5E1] [&_code]:px-1 [&_code]:rounded [&_pre]:bg-[#1A1A1A] [&_pre]:text-white [&_pre]:rounded-lg [&_pre]:p-3">
                                  <Markdown>{part.text}</Markdown>
                                </div>
                              ) : (
                                <p className="text-[14px] whitespace-pre-wrap leading-relaxed">
                                  {part.text}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (part.type.startsWith("tool-")) {
                        const toolPart = part as Record<string, unknown>;
                        const toolName = (part.type as string).replace(
                          "tool-",
                          "",
                        );
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="max-w-[85%]"
                          >
                            <ApprovalCard
                              toolName={toolName}
                              args={
                                (toolPart.input as Record<string, unknown>) ??
                                {}
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
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="px-3 py-2 lg:max-w-[700px] lg:mx-auto">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Moe..."
                rows={1}
                className="flex-1 rounded-xl bg-[#FAFAF8] border border-[#E8E5E1] px-4 py-2.5 text-[14px] text-[#1A1A1A] placeholder:text-[#9C9690] focus:outline-none focus:ring-2 focus:ring-[#E85D3A]/10 focus:border-[#E85D3A] min-h-[44px] resize-none leading-relaxed"
                style={{ overflowY: "hidden" }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-[#E85D3A] text-white disabled:opacity-30 disabled:pointer-events-none transition-opacity shrink-0 mb-[1px]"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </form>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}
