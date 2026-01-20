"use client";

import { useEffect, useState } from "react";

export function ResultsStream({ isStreaming, results, text }: any) {
  const [displayedText, setDisplayedText] = useState(text || "");

  useEffect(() => {
    setDisplayedText(text || "");
  }, [text]);

  if (!isStreaming && !displayedText && (!results || results.length === 0)) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* TEXTO CON SALTOS DE LÍNEA RESPETADOS */}
      <div className="prose prose-lg font-serif text-gray-800 leading-relaxed whitespace-pre-wrap break-words italic md:not-italic">
        {displayedText === "Consultando..." ? (
          <span className="text-gray-400 animate-pulse">Buscando en Orain.eus...</span>
        ) : (
          displayedText
        )}
        {isStreaming && <span className="inline-block w-2 h-5 ml-1 bg-blue-600 animate-pulse" />}
      </div>

      {/* TARJETAS VISUALES ABAJO */}
      {!isStreaming && results && results.length > 0 && (
        <div className="grid gap-4 pt-6 border-t border-gray-100">
          {results.map((item: any, idx: number) => (
            <a 
              key={idx} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              {item.image && (
                <div className="md:w-40 h-32 flex-shrink-0 bg-gray-100">
                  <img src={item.image} className="w-full h-full object-cover" alt="" />
                </div>
              )}
              <div className="p-4 flex-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Orain.eus</span>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-700 line-clamp-2 mt-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.summary || item.title}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}