"use client";

import { useEffect, useState, useCallback } from 'react';
import { useConversation } from '@11labs/react';
import { ResultsStream } from '@/components/results-stream';

export default function EITBAssistant() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const conversation = useConversation({
    onMessage: (message: any) => {
      const text = message.message || message.text || '';
      if (!text) return;

      // Solo procesamos mensajes de texto del agente
      if (message.role === 'agent' || message.type === 'text') {
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.findLastIndex(m => m.role === 'assistant');
          
          if (lastIndex !== -1) {
            // CONCATENAMOS: Sumamos el nuevo texto al que ya teníamos
            const currentContent = updated[lastIndex].content === 'Consultando...' ? '' : updated[lastIndex].content;
            updated[lastIndex] = { 
              ...updated[lastIndex], 
              content: currentContent + text, 
              isStreaming: true 
            };
          }
          return updated;
        });
      }
    },
    onConnect: () => console.log('Conectado a ElevenLabs'),
    onDisconnect: () => setIsStreaming(false),
  });

  // FUNCIÓN CLAVE: Actualiza sin borrar el texto
  const updateAssistantMessage = useCallback((content: string, streaming: boolean, results?: any[]) => {
    setMessages(prev => {
      const updated = [...prev];
      const lastIndex = updated.findLastIndex(m => m.role === 'assistant');

      if (lastIndex !== -1) {
        updated[lastIndex] = {
          ...updated[lastIndex],
          // Mantenemos el content previo si no recibimos uno nuevo sustancial
          content: updated[lastIndex].content, 
          isStreaming: streaming,
          // Agregamos los resultados técnicos (noticias)
          results: results && results.length > 0 ? results : updated[lastIndex].results
        };
      }
      return updated;
    });
    if (!streaming) setIsStreaming(false);
  }, []);

  // Definición de la Herramienta (Client Tool)
  const clientTools = {
    displayNewsResults: async ({ news, summary }: any) => {
      console.log("Recibidas noticias:", news);
      updateAssistantMessage(summary, false, news);
      return "Resultados mostrados en pantalla";
    },
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-100' : 'bg-white shadow'}`}>
            {msg.role === 'assistant' ? (
              <ResultsStream 
                text={msg.content} 
                results={msg.results} 
                isStreaming={msg.isStreaming} 
              />
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        ))}
      </div>
      
      {/* Tu botón de conversación aquí */}
      <button 
        onClick={() => {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Consultando...', isStreaming: true }]);
          conversation.startSession({ agentId: 'TU_AGENT_ID', clientTools });
        }}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full"
      >
        Hablar con EITB
      </button>
    </main>
  );
}