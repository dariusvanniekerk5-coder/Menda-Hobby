import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const WELCOME = "Hi there! 👋 I'm Menda's assistant. I can help with service cost estimates, how our platform works, booking questions, and general home maintenance advice. What can I help you with?";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text }]);
    setLoading(true);
    try {
      const history = messages.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: data.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: "I'm having trouble connecting. Please try again or email support@menda.co.za." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#F4C430] text-[#111111] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform" aria-label="Chat">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[340px] sm:w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#F4C430]/20">
          <div className="bg-[#111111] px-5 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#F4C430] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-tight">Menda Assistant</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F7F7]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "assistant" ? "bg-[#111111]" : "bg-[#F4C430]"}`}>
                  {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-[#F4C430]" /> : <User className="w-3.5 h-3.5 text-[#111111]" />}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${msg.role === "assistant" ? "bg-white text-[#111111] shadow-sm rounded-tl-sm" : "bg-[#F4C430] text-[#111111] rounded-tr-sm"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#111111] flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-[#F4C430]" /></div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  {[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-[#111111]/30 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 bg-white border-t border-[#F4C430]/10 flex gap-2 flex-shrink-0">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}} placeholder="Ask me anything..." disabled={loading} className="flex-1 bg-[#F7F7F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none placeholder:text-[#111111]/30 disabled:opacity-50" />
            <button onClick={send} disabled={!input.trim() || loading} className="w-10 h-10 rounded-xl bg-[#F4C430] text-[#111111] flex items-center justify-center disabled:opacity-40 hover:bg-[#111111] hover:text-[#F4C430] transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
