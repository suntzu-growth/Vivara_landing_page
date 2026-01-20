"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ResultsStreamProps {
    isStreaming: boolean;
    results?: any[];
    text?: string; 
}

export function ResultsStream({ isStreaming, results, text }: ResultsStreamProps) {
    const [displayedText, setDisplayedText] = useState(text || "");
    const [isFinished, setIsFinished] = useState(!isStreaming);

    useEffect(() => {
        if (isStreaming) {
            setIsFinished(false);
            setDisplayedText(text || "");
        } else {
            setDisplayedText(text || "");
            setIsFinished(true);
        }
    }, [isStreaming, text]);

    if (!isStreaming && !displayedText && (!results || results.length === 0)) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-6 p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* TEXTO DEL ASISTENTE */}
            <div className="prose prose-lg prose-gray max-w-none">
                <div className="font-serif text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                    {displayedText === "Consultando..." ? (
                        <span className="text-gray-400 italic animate-pulse">Obteniendo noticias...</span>
                    ) : (
                        displayedText
                    )}
                    {isStreaming && <span className="inline-block w-2 h-5 ml-1 bg-blue-600 animate-pulse" />}
                </div>
            </div>

            {/* LISTADO DE NOTICIAS (ESTILO PREVIA DE CHAT) */}
            {isFinished && results && results.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Enlaces de Orain.eus</h4>
                    <div className="flex flex-col gap-4">
                        {results.map((item, idx) => (
                            <a 
                                key={idx} 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex flex-col md:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                            >
                                {item.image && (
                                    <div className="w-full md:w-40 h-32 md:h-auto flex-shrink-0 relative overflow-hidden bg-gray-50">
                                        <img 
                                            src={item.image} 
                                            alt="" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        />
                                    </div>
                                )}
                                <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-1">{item.source}</span>
                                    <h3 className="font-serif font-bold text-gray-900 leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                        {item.summary}
                                    </p>
                                </div>
                                <div className="hidden md:flex items-center px-4 text-gray-200 group-hover:text-blue-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}