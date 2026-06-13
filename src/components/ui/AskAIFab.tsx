"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "esg-chat-history";

// Helper function to render text with clean bolding instead of displaying raw ** markdown symbols.
function renderMessageContent(content: string) {
  if (!content) return "";
  const parts = content.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-extrabold text-[#064e3b]">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export function AskAIFab() {
  const { locale, L } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const accumulatedRef = useRef("");

  // Determine currentPage, selectedCompany, and compareCompanies based on active path
  let currentPage = "home";
  if (pathname === "/compare") {
    currentPage = "company-compare";
  } else if (pathname === "/companies") {
    currentPage = "company-list";
  } else if (pathname === "/glosarium") {
    currentPage = "glossary";
  } else if (pathname.startsWith("/companies/")) {
    currentPage = pathname.endsWith("/score") ? "company-score" : "company-detail";
  }

  let selectedCompany: string | null = null;
  if (currentPage === "company-detail" || currentPage === "company-score") {
    const parts = pathname.split("/");
    if (parts.length >= 3) {
      selectedCompany = parts[2].toUpperCase();
    }
  }

  let compareCompanies: string[] = [];
  if (currentPage === "company-compare") {
    const tickersParam = searchParams.get("tickers");
    if (tickersParam) {
      compareCompanies = tickersParam.split(",").map((t) => t.trim().toUpperCase());
    }
  }

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored messages", e);
      }
    }
  }, []);

  // Auto scroll to bottom when messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);

    // Save history immediately to sessionStorage
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));

    // Append a placeholder for the bot stream response
    const tempBotMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, tempBotMessage]);

    try {
      // Limit history to the last 10 messages (including current user message) to keep prompt optimized
      const historyToSend = updatedMessages.slice(-10);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale,
          currentPage,
          selectedCompany: selectedCompany || (compareCompanies.length > 0 ? compareCompanies[0] : null),
          compareCompanies,
          conversationHistory: historyToSend,
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to communicate with AI Assistant";
        try {
          const errJson = await response.json();
          errMsg = errJson.error || errMsg;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream reader available");

      accumulatedRef.current = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last chunk if it is not a complete line
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === "data: [DONE]") continue;

          if (cleanLine.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(cleanLine.slice(6));
              const content = parsed.choices?.[0]?.delta?.content || "";
              accumulatedRef.current += content;

              // Stream message content update in state
              setMessages((prev) => {
                const copy = [...prev];
                if (copy.length > 0) {
                  copy[copy.length - 1] = { role: "assistant", content: accumulatedRef.current };
                }
                return copy;
              });
            } catch {
              // Ignore JSON parse errors for incomplete chunk lines
            }
          }
        }
      }

      // Save completed stream to message history
      setMessages((prev) => {
        const final = [...prev];
        if (final.length > 0) {
          final[final.length - 1] = { role: "assistant", content: accumulatedRef.current };
        }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(final));
        return final;
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Error contacting AI Assistant";
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[copy.length - 1] = {
            role: "assistant",
            content: locale === "id"
              ? `Maaf, terjadi kesalahan: ${errorMessage}. Pastikan DEEPSEEK_API_KEY dikonfigurasi di file .env proyek.`
              : `Sorry, an error occurred: ${errorMessage}. Make sure DEEPSEEK_API_KEY is configured in your project's .env file.`,
          };
        }
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm(locale === "id" ? "Hapus riwayat obrolan?" : "Clear chat history?")) {
      setMessages([]);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const quickPrompts = locale === "id"
    ? [
        "Apa itu kerangka kerja GRI 14?",
        "Mengapa penilaian ESG penting bagi investor?",
        "Bagaimana cara membandingkan kinerja emiten?",
      ]
    : [
        "What is the GRI 14 framework?",
        "Why is ESG assessment important for investors?",
        "How do I compare issuer performance?",
      ];

  return (
    <>
      {/* Dynamic Keyframe Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes chatDotBlink {
              0%, 100% { opacity: 0.3; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.1); }
            }
            .chat-dot {
              animation: chatDotBlink 1.4s infinite both;
            }
            .chat-dot:nth-child(2) {
              animation-delay: 0.2s;
            }
            .chat-dot:nth-child(3) {
              animation-delay: 0.4s;
            }
            @keyframes slideInUp {
              from { transform: translateY(20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
            .animate-slide-in-up {
              animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `,
        }}
      />

      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[24px] right-[24px] sm:bottom-[24px] sm:right-[24px] z-50 flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 px-4.5 py-3.5 text-white shadow-xl border border-emerald-800/40 hover:border-emerald-600/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer select-none group"
          aria-label={L.askAi}
        >
          <svg className="h-5.5 w-5.5 text-amber-300 group-hover:rotate-12 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 group-hover:text-white transition-colors">{L.askAi}</span>
        </button>
      )}

      {/* Stateful Chat Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-[24px] sm:right-[24px] w-full sm:w-[380px] h-full sm:h-[530px] sm:max-h-[85vh] z-50 flex flex-col bg-white sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl overflow-hidden animate-slide-in-up">
          {/* Header Panel */}
          <div className="h-14 px-4 bg-white flex items-center justify-between border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-[10px]">
              <Image
                src="/logo-esg-checker.png"
                alt="ESG Checker Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
              <h3 className="font-semibold text-sm text-[#0F1B33]">
                {locale === "id" ? "Panduan ESG" : "ESG Guide"}
              </h3>
            </div>

            <div className="flex items-center gap-1">
              {/* Reset obrolan */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition duration-200 cursor-pointer"
                  title={locale === "id" ? "Hapus percakapan" : "Clear conversation"}
                  aria-label={locale === "id" ? "Hapus percakapan" : "Clear conversation"}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {/* Close panel */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition duration-200 cursor-pointer"
                title={locale === "id" ? "Tutup" : "Close"}
                aria-label={locale === "id" ? "Tutup" : "Close"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 flex flex-col">
            {/* System initial message */}
            <div className="bg-slate-100/80 border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none p-3 text-xs leading-relaxed font-medium max-w-[85%] self-start shadow-sm">
              {locale === "id"
                ? "Halo! Saya Asisten AI ESG Checker. Tanyakan kepada saya tentang penilaian ESG, standar pelaporan GRI 14, pilar lingkungan, sosial, atau tata kelola emiten IDX."
                : "Hello! I am the ESG Checker AI Assistant. Ask me anything about ESG assessments, GRI 14 reporting standards, or the environmental, social, and governance pillars of IDX issuers."}
            </div>

            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-semibold shadow-sm ${
                    isUser
                      ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-tr-none self-end text-left"
                      : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-none self-start text-left"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {renderMessageContent(msg.content)}
                </div>
              );
            })}

            {/* Streaming / Loading dots */}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex items-center gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none max-w-[65px] self-start shadow-sm">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full chat-dot" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full chat-dot" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full chat-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel (only if there are no custom user queries yet) */}
          {messages.length === 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-150 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {locale === "id" ? "Pertanyaan Populer" : "Popular Prompts"}
              </span>
              <div className="flex flex-col gap-1">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left text-[11px] font-semibold text-slate-600 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg px-2.5 py-1.5 transition shadow-sm cursor-pointer line-clamp-1"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Footer */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={locale === "id" ? "Ketik pesan..." : "Type a message..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={isLoading}
              className="flex-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition disabled:opacity-50 font-medium"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className="w-9 h-9 shrink-0 flex items-center justify-center bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl shadow-sm hover:shadow active:scale-95 disabled:scale-100 disabled:opacity-40 transition cursor-pointer"
            >
              <svg className="w-4.5 h-4.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
