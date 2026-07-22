"use client";

import { LoaderCircle, Plane, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const welcome: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm your FlightOps assistant. Ask me about flights, fares, baggage, or booking. বাংলা বা English—দুইভাবেই বলতে পারেন।",
};

const suggestions = ["Find flights from Dhaka", "How do I book?", "Baggage allowance"];

function FlightOpsAIMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`ai-logo relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50 to-blue-200 text-blue-700 shadow-lg ring-1 ring-white/70 ${compact ? "size-10" : "size-15"}`}>
      <span className="absolute -left-3 top-1/2 h-px w-20 -rotate-45 bg-blue-400/35" />
      <Plane className="relative -rotate-12" size={compact ? 21 : 27} strokeWidth={2.35} />
      <Sparkles className="absolute right-1.5 top-1.5 text-amber-500" size={compact ? 10 : 13} strokeWidth={2.5} />
      {!compact && <span className="absolute bottom-1.5 right-2 rounded bg-blue-700 px-1 text-[8px] font-black leading-3 tracking-wide text-white">AI</span>}
    </span>
  );
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages, loading]);

  async function sendMessage(content: string) {
    const clean = content.trim();
    if (!clean || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: clean }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not reach the assistant.");
      setMessages((current) => [...current, { role: "assistant", content: result.data.content }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Sorry, I couldn't respond. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="fixed bottom-5 right-4 z-[70] sm:bottom-7 sm:right-7">
      {open && (
        <section
          aria-label="FlightOps AI assistant"
          className="mb-3 flex h-[min(610px,calc(100vh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <FlightOpsAIMark compact />
              <div><h2 className="font-extrabold">FlightOps AI</h2><p className="flex items-center gap-1 text-xs text-blue-100"><span className="size-2 rounded-full bg-emerald-300" /> Online assistant</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="grid size-9 place-items-center rounded-xl hover:bg-white/15"><X size={20} /></button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">{suggestion}</button>)}
              </div>
            )}
            {loading && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Thinking…</div></div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} disabled={loading} aria-label="Message FlightOps AI" placeholder="Ask about your journey…" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
              <button type="submit" disabled={loading || !input.trim()} aria-label="Send message" className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} /></button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">AI can make mistakes. Confirm important flight details.</p>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close AI assistant" : "Open AI assistant"} className={`ai-launcher group relative ml-auto flex size-16 items-center justify-center rounded-[22px] shadow-xl shadow-blue-600/25 transition hover:scale-105 ${open ? "bg-slate-900 text-white" : "bg-blue-600"}`}>
        {!open && <span className="absolute inset-0 rounded-[22px] ring-1 ring-blue-400/30" />}
        {open ? <X size={25} /> : <FlightOpsAIMark />}
      </button>
    </div>
  );
}
