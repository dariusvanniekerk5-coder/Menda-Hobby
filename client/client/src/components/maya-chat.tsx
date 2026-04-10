import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "How much does plumbing cost?",
  "How does escrow work?",
  "What services do you offer?",
  "How do I become a provider?",
];

export default function MayaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm MAYA, your MENDA assistant 👋 I can help with service estimates, booking questions, how escrow works, and more. What can I help you with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggested, setShowSuggested] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    setShowSuggested(false);
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment, or contact our support team." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          open ? "bg-[#111111] rotate-0" : "bg-[#F4C430] hover:scale-110"
        )}
        aria-label="Chat with MAYA"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-[#111111]" />}
        {!open && messages.length === 1 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-black">1</span>
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-[380px] h-[480px] bg-white rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-[#111111] px-5 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#F4C430] flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-[#111111]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm">MAYA</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">MENDA AI Assistant</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-white/50">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  msg.role === "user" ? "bg-[#F4C430]" : "bg-[#111111]"
                )}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5 text-[#111111]" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className={cn(
                  "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#F4C430] text-[#111111] rounded-tr-sm font-medium"
                    : "bg-[#F7F7F7] text-[#111111] rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#111111] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-[#F7F7F7] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111]/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111]/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111111]/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSuggested && messages.length === 1 && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Suggested questions</p>
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs bg-white border border-border rounded-xl px-3 py-2.5 hover:border-[#F4C430] hover:bg-[#F4C430]/5 transition-colors font-medium text-[#111111]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-border px-3 py-3 flex gap-2 items-center bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask MAYA anything..."
              className="flex-1 text-sm bg-[#F7F7F7] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#F4C430] border border-transparent font-medium placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                input.trim() && !loading ? "bg-[#F4C430] hover:bg-[#111111] hover:text-white text-[#111111]" : "bg-[#F7F7F7] text-muted-foreground"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-center py-1.5 bg-white border-t border-border/30">
            <p className="text-[9px] text-muted-foreground">MAYA gives estimates only — not professional quotes</p>
          </div>
        </div>
      )}
    </>
  );
}
