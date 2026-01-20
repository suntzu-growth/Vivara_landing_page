"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { SearchInput } from "@/components/search-input";
import { ResultsStream } from "@/components/results-stream";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const conversationRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateAssistantMessage = (content: string, streaming: boolean, results?: any[]) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: content || updated[updated.length - 1].content,
          isStreaming: streaming,
          results: results || updated[updated.length - 1].results
        };
        return updated;
      }
      return updated;
    });
    if (!streaming) setIsStreaming(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { TextConversation } = await import('@elevenlabs/client');
        const response = await fetch("/api/get-signed-url");
        const { signedUrl } = await response.json();

        const conv = await TextConversation.startSession({
          signedUrl,
          clientTools: {
            displayNewsResults: async ({ news, summary }: any) => {
              updateAssistantMessage(summary, false, news);
              return;
            },
            displayTextResponse: async ({ text }: any) => {
              updateAssistantMessage(text, false);
              return;
            }
          },
          onMessage: (m: any) => {
            const text = m.message || m.text || '';
            if (m.role === 'agent' || m.type === 'text') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  const base = last.content === 'Consultando...' ? '' : (last.content || '');
                  updated[updated.length - 1] = { ...last, content: base + text, isStreaming: true };
                }
                return updated;
              });
            }
            if (m.type === 'agent_response_end') setIsStreaming(false);
          }
        });
        conversationRef.current = conv;
      } catch (err) { console.error("Error inicializando Agente:", err); }
    };
    init();
    return () => { if (conversationRef.current) conversationRef.current.endSession(); };
  }, []);

  const handleSearch = async (q: string) => {
    if (!q || !conversationRef.current) return;
    setMessages(prev => [...prev, { role: 'user', content: q }, { role: 'assistant', content: 'Consultando...', isStreaming: true }]);
    setHasSearched(true);
    setIsStreaming(true);
    await conversationRef.current.sendUserMessage(q);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-20 pb-32">
        {!hasSearched ? (
          <div className="max-w-3xl mx-auto px-4"><SearchInput onSearch={handleSearch} /></div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 space-y-8">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex flex-col'}>
                {m.role === 'user' ? (
                  <div className="bg-gray-100 p-4 rounded-xl max-w-[80%]">{m.content}</div>
                ) : (
                  <ResultsStream isStreaming={!!m.isStreaming} results={m.results} text={m.content} />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        {hasSearched && (
          <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-md border-t">
            <div className="max-w-3xl mx-auto"><SearchInput onSearch={handleSearch} /></div>
          </div>
        )}
      </main>
    </div>
  );
}