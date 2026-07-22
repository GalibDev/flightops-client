"use client";

import { Bot, LoaderCircle, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const welcome: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm your FlightOps assistant. Ask me about flights, fares, baggage, or booking. বাংলা বা English—দুইভাবেই বলতে পারেন।",
};

const suggestions = ["Find flights from Dhaka", "How do I book?", "Baggage allowance"];

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
              <span className="grid size-10 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25"><Bot size={22} /></span>
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

      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close AI assistant" : "Open AI assistant"} className="group ml-auto flex size-15 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-1 hover:bg-blue-700">
        {open ? <X size={25} /> : <span className="relative"><MessageCircle size={27} /><Sparkles className="absolute -right-2 -top-2 text-amber-300" size={14} /></span>}
      </button>
    </div>
  );
}
