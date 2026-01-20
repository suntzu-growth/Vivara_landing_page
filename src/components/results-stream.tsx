"use client";

import React from 'react';

interface NewsItem {
  title: string;
  url: string;
  image?: string;
  summary?: string;
}

interface ResultsStreamProps {
  isStreaming: boolean;
  results?: NewsItem[];
  text: string;
}

export function ResultsStream({ isStreaming, results, text }: ResultsStreamProps) {
  if (!isStreaming && !text && (!results || results.length === 0)) return null;

  return (
    <div className="w-full space-y-6">
      {/* SECCIÓN DE TEXTO: whitespace-pre-wrap es vital para los saltos de línea */}
      <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap break-words font-sans">
        {text === "Consultando..." ? (
          <span className="text-gray-400 italic animate-pulse">Buscando en Orain.eus...</span>
        ) : (
          text
        )}
        {isStreaming && (
          <span className="inline-block w-2 h-5 ml-1 bg-blue-600 animate-pulse align-middle" />
        )}
      </div>

      {/* SECCIÓN DE TARJETAS: Solo se muestran si hay resultados en el array */}
      {results && results.length > 0 && (
        <div className="grid gap-4 pt-6 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {results.map((item, idx) => (
            <a 
              key={idx} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all border-l-4 hover:border-l-blue-600"
            >
              {item.image && (
                <div className="md:w-32 h-24 flex-shrink-0 bg-gray-100">
                  <img 
                    src={item.image} 
                    className="w-full h-full object-cover" 
                    alt={item.title} 
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
              <div className="p-3 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Orain.eus</span>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-700 text-sm line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.summary}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}