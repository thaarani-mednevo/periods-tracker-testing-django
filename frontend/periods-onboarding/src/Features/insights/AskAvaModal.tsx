import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ApiError } from "../../services/api/client";
import { askAva } from "../../services/insights";

interface Message {
  role: "user" | "ava";
  text: string;
}

const SUGGESTIONS = ["Why do I feel tired in this phase?", "What helps with cramps?", "Why can my cycle length change?"];

export function AskAvaModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setText("");
    setError(null);
    setBusy(true);
    try {
      const { answer } = await askAva(question);
      setMessages((m) => [...m, { role: "ava", text: answer }]);
    } catch (err) {
      const e = err as ApiError;
      setError(e.status === 429 ? "You've asked a lot of questions. Please try again later." : e.message || "Ava isn't available right now.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-3 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ava-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-blush-300 bg-white shadow-glass"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line p-4">
          <div>
            <h2 id="ava-title" className="text-heading font-semibold text-ink">Ask Ava</h2>
            <p className="text-caption text-ink-muted">Cycle and wellness questions. Not medical advice.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-ink-muted hover:bg-blush-50">
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-[160px] flex-1 overflow-y-auto p-4" aria-live="polite">
          {messages.length === 0 && (
            <div>
              <p className="text-body text-ink-muted">Ask about your phase, common symptoms or everyday self-care.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-blush-300 bg-white px-3.5 py-1.5 text-body-sm font-semibold text-ink-muted hover:bg-blush-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <ul className="grid gap-3">
            {messages.map((m, i) => (
              <li
                key={i}
                className={`max-w-[88%] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-body ${
                  m.role === "user" ? "justify-self-end bg-rose text-white" : "justify-self-start bg-blush-50 text-ink"
                }`}
              >
                {m.text}
              </li>
            ))}
            {busy && <li className="justify-self-start rounded-[18px] bg-blush-50 px-4 py-2.5 text-body text-ink-muted">Thinking…</li>}
          </ul>
          {error && <p role="alert" className="mt-3 text-body-sm font-semibold text-rose-ink">{error}</p>}
          <div ref={endRef} />
        </div>

        <div className="flex items-end gap-2 border-t border-line p-3">
          <textarea
            ref={inputRef}
            value={text}
            maxLength={500}
            rows={2}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(text);
              }
            }}
            placeholder="Type your question…"
            aria-label="Your question"
            className="min-w-0 flex-1 resize-none rounded-[14px] border border-line bg-white px-3.5 py-2.5 text-body text-ink"
          />
          <button
            type="button"
            onClick={() => send(text)}
            disabled={busy || !text.trim()}
            aria-label="Send"
            className="rounded-full bg-rose p-3 text-white disabled:opacity-50"
          >
            <Send className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
