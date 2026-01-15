"use client";

import { useState, useCallback, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { Header } from "@/components/header";
import { SearchHero } from "@/components/search-hero";
import { SearchInput } from "@/components/search-input";
import { QuestionMarquee } from "@/components/question-marquee";
import { TopicSelector } from "@/components/topic-selector";
import { ResultsStream } from "@/components/results-stream";
import { Footer } from "@/components/footer";

import { ScheduleParser } from "@/lib/schedule-parser";
import { scheduleData } from "@/data/schedule-loader"; // We'll create a loader to get text
import { SIMULATED_ANSWERS } from "@/data/simulated-answers";

export default function Home() {
  const [hasSearched, setHasSearched] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAgentEnabled, setIsAgentEnabled] = useState(false);

  // Chat History State
  interface Message {
    role: 'user' | 'assistant';
    content?: string;
    results?: any[];
    isStreaming?: boolean;
    directAnswer?: string;
  }
  const [messages, setMessages] = useState<Message[]>([]);

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Agent Connected');
      setIsAgentEnabled(true);
    },
    onDisconnect: () => {
      console.log('Agent Disconnected');
      setIsAgentEnabled(false);
    },
    onMessage: (message: any) => {
      console.log('Agent Message:', message);
      const text = message.message || message.text || (typeof message === 'string' ? message : null);

      if (text) {
        // Filter out common "Idle" messages if they annoy the user
        // This is a heuristic; ideally config should be changed in ElevenLabs dash
        const ignoredPhrases = ["estás ahí", "are you still there", "sigues ahí"];
        const lowerText = text.toLowerCase();
        if (ignoredPhrases.some(phrase => lowerText.includes(phrase))) {
          return;
        }

        setMessages(prev => {
          // Check if the last message is an assistant placeholder (streaming)
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
            // Replace placeholder
            return [...prev.slice(0, -1), { role: 'assistant', content: text, isStreaming: false }];
          }
          return [...prev, { role: 'assistant', content: text, isStreaming: false }];
        });
        setIsStreaming(false);
      }
    },
    onError: (error) => {
      console.error('Agent Error:', error);
      setIsStreaming(false);
    },
  });

  // Auto-connect on mount
  useEffect(() => {
    const connectAgent = async () => {
      try {
        const response = await fetch("/api/get-signed-url");
        if (!response.ok) throw new Error("Failed to get auth");
        const { signedUrl } = await response.json();

        // Start session
        await conversation.startSession({
          signedUrl,
        });

        // Disable Microphone: Since we can't easily prevent the SDK from requesting it
        // (it's built for voice), we can try to mute the input immediately.
        // NOTE: To fully remove the "Recording" indicator, we would need to manually 
        // manage the connection or use a text-only client, but the React SDK wraps this.
        // We will trust the User that 'text only' is sufficient.

        // Mute audio output for text-only experience
        conversation.setVolume({ volume: 0 });
      } catch (err) {
        console.error("Failed to auto-connect agent:", err);
      }
    };

    // Slight delay to ensure hydration
    const timer = setTimeout(() => {
      connectAgent();
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Run once on mount


  const handleSearch = async (query?: string, isCategorySelection: boolean = false) => {
    // 1. Add User Message
    // If it's a category selection, we show the category name as the user message
    const userMsg: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);

    setHasSearched(true);
    setIsStreaming(true);

    // 2. Add Assistant Placeholder (to show typing indicator)
    setMessages(prev => [...prev, { role: 'assistant', isStreaming: true }]);

    if (conversation.status === 'connected') {
      // Agent Mode
      try {
        if (isCategorySelection && query) {
          // Special handling for categories: Prompt the agent to ask the user
          await conversation.sendUserMessage(`El usuario ha seleccionado la categoría: "${query}". Pregúntale amablemente qué quiere saber específicamente sobre esta sección.`);
        } else {
          // Normal search
          await conversation.sendUserMessage(query || "");
        }
        // Response handled in onMessage
      } catch (err) {
        console.error("Agent send error:", err);
        setIsStreaming(false);
      }
    } else {
      // Legacy/Simulation Mode (Fallback if agent fails to connect)
      setTimeout(() => {
        let assistantMsg: Message = { role: 'assistant', isStreaming: true };

        if (query && SIMULATED_ANSWERS[query]) {
          assistantMsg = { role: 'assistant', directAnswer: SIMULATED_ANSWERS[query], isStreaming: false };
        } else {
          const parser = new ScheduleParser(scheduleData);
          const results = parser.search(query || "");
          assistantMsg = { role: 'assistant', results: results, isStreaming: false };
        }

        setMessages(prev => {
          const history = prev.slice(0, -1);
          return [...history, assistantMsg];
        });
        setIsStreaming(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-eitb-blue/20 selection:text-eitb-blue flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col relative pt-16">
        {/* Initial Hero - Hidden after search */}
        <div className={`transition-all duration-700 ease-in-out flex flex-col items-center w-full ${hasSearched ? "hidden" : "pt-12"}`}>
          <SearchHero />

          {/* Agent Status Indicator (Optional, subtle) */}
          <div className="mb-4 h-6">
            {conversation.status === 'connected' && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 animate-in fade-in">
                ● Agente Conectado
              </span>
            )}
          </div>

          <div className="w-full my-8">
            <QuestionMarquee onQuestionClick={(q) => handleSearch(q, false)} />
            <TopicSelector onSelect={(topic) => handleSearch(topic, true)} className="mt-8" />
          </div>

          <div className="w-full px-4 mb-12">
            <SearchInput onSearch={(q) => handleSearch(q, false)} />
          </div>
        </div>

        {/* Chat Stream */}
        {hasSearched && (
          <div className="container mx-auto px-4 pb-32 flex flex-col space-y-8">
            {messages.map((msg, idx) => (
              <div key={idx} className={`w-full ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                {msg.role === 'user' ? (
                  <div className="bg-gray-100 text-gray-800 px-6 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-lg">
                    {msg.content === 'noticias' ? 'News' :  // Use standard capitalization/labels if needed, or keeping explicit
                      msg.content?.charAt(0).toUpperCase() + msg.content!.slice(1)}
                  </div>
                ) : (
                  <ResultsStream
                    isStreaming={!!msg.isStreaming}
                    results={msg.results}
                    directAnswer={msg.directAnswer || msg.content}
                    text={msg.content}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sticky Input for Chat */}
        {hasSearched && (
          <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 pb-8 z-50">
            <div className="container mx-auto max-w-3xl">
              <SearchInput onSearch={(q) => handleSearch(q, false)} />
            </div>
          </div>
        )}
      </main>

      {!hasSearched && <Footer />}
    </div>
  );
}
