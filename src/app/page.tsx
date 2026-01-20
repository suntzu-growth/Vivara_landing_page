"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { SearchHero } from "@/components/search-hero";
import { SearchInput } from "@/components/search-input";
import { QuestionMarquee } from "@/components/question-marquee";
import { TopicSelector } from "@/components/topic-selector";
import { ResultsStream } from "@/components/results-stream";
import { Footer } from "@/components/footer";

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  results?: any[];
  isStreaming?: boolean;
  type?: string;
}

export default function Home() {
  const [hasSearched, setHasSearched] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const conversationRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático al final de la conversación
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Función para actualizar el mensaje de la IA de forma reactiva
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
    const initAgent = async () => {
      try {
        setAgentStatus('connecting');
        const { TextConversation } = await import('@elevenlabs/client');

        const response = await fetch("/api/get-signed-url");
        const { signedUrl } = await response.json();

        const conversation = await TextConversation.startSession({
          signedUrl,
          clientTools: {
            // Herramienta para cuando el Especialista encuentra noticias
            displayNewsResults: async ({ news, summary }: any) => {
              updateAssistantMessage(summary, false, news);
              return;
            },
            // Herramienta general para respuestas de texto
            displayTextResponse: async ({ text }: any) => {
              updateAssistantMessage(text, false);
              return;
            }
          },
          onMessage: (message: any) => {
            const text = message.message || message.text || '';
            if (!text) return;

            // Manejo de streaming de texto del agente
            if (message.role === 'agent' || message.type === 'text') {
               setMessages(prev => {
                 const updated = [...prev];
                 const last = updated[updated.length - 1];
                 if (last && last.role === 'assistant') {
                    const currentContent = last.content === 'Consultando...' ? '' : (last.content || '');
                    updated[updated.length - 1] = { 
                      ...last, 
                      content: currentContent + text,
                      isStreaming: true 
                    };
                 }
                 return updated;
               });
            }

            if (message.type === 'agent_response_end') {
              setIsStreaming(false);
            }
          },
          onDisconnect: () => setAgentStatus('disconnected')
        });

        conversationRef.current = conversation;
        setAgentStatus('connected');
      } catch (err) {
        console.error("Error al conectar con ElevenLabs:", err);
        setAgentStatus('disconnected');
      }
    };

    initAgent();
    return () => { if (conversationRef.current) conversationRef.current.endSession(); };
  }, []);

  const handleSearch = async (query?: string) => {
    if (!query || agentStatus !== 'connected') return;

    // Añadimos mensaje del usuario y placeholder del asistente
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: query }, 
      { role: 'assistant', content: 'Consultando...', isStreaming: true }
    ]);
    
    setHasSearched(true);
    setIsStreaming(true);

    try {
      await conversationRef.current.sendUserMessage(query);
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-blue-100">
      <Header />
      
      <main className="flex-1 flex flex-col pt-16 relative">
        {!hasSearched ? (
          <div className="flex flex-col items-center w-full pt-12 animate-in fade-in duration-1000">
            <SearchHero />
            <QuestionMarquee onQuestionClick={handleSearch} />
            <TopicSelector onSelect={(t) => handleSearch(`Noticias de ${t}`)} className="mt-8" />
            <div className="w-full px-4 mb-20 max-w-3xl">
                <SearchInput onSearch={handleSearch} />
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 pb-40 max-w-4xl pt-8 space-y-12">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn(
                "w-full flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                {msg.role === 'user' ? (
                  <div className="bg-gray-100 text-gray-800 px-6 py-4 rounded-2xl max-w-[85%] text-lg font-medium shadow-sm border border-gray-200">
                    {msg.content}
                  </div>
                ) : (
                  <ResultsStream 
                    isStreaming={!!msg.isStreaming} 
                    results={msg.results} 
                    text={msg.content} 
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* Barra de búsqueda fija cuando ya hay resultados */}
        {hasSearched && (
          <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 p-6 z-50">
            <div className="container mx-auto max-w-3xl">
              <SearchInput onSearch={handleSearch} />
            </div>
          </div>
        )}
      </main>

      {!hasSearched && <Footer />}
    </div>
  );
}