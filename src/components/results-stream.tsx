"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ResultsStreamProps {
    isStreaming: boolean;
    results?: any[];
    text?: string; 
    directAnswer?: string;
}

export function ResultsStream({ isStreaming, results, text, directAnswer }: ResultsStreamProps) {
    const [displayedText, setDisplayedText] = useState(text || "");
    const [isFinished, setIsFinished] = useState(!isStreaming);

    // Mantenemos tu lógica de texto base por defecto
    let fullText = text || directAnswer || "";
    if (!fullText && !isStreaming) {
        fullText = "EITB (Euskal Irrati Telebista) es el grupo de comunicación público del País Vasco...";
    }

    useEffect(() => {
        if (isStreaming) {
            setIsFinished(false);
            setDisplayedText(text || "");
        } else {
            setDisplayedText(text || directAnswer || fullText);
            setIsFinished(true);
        }
    }, [isStreaming, text, directAnswer, fullText]);

    // No renderizar nada si no hay contenido relevante
    if (!isStreaming && !displayedText && (!results || results.length === 0)) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* SECCIÓN 1: INTRODUCCIÓN DEL ESPECIALISTA (IA) */}
            <div className="prose prose-lg prose-gray max-w-none">
                <div className="font-serif text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                    {displayedText === "Consultando..." ? (
                        <div className="flex items-center gap-2 text-gray-400 italic">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            Analizando noticias a fondo...
                        </div>
                    ) : (
                        displayedText
                    )}
                    {isStreaming && (
                        <span className="inline-block w-2 h-5 ml-1 align-middle bg-eitb-blue animate-pulse" />
                    )}
                </div>
            </div>

            {/* SECCIÓN 2: TARJETAS DE RESULTADOS (ENLACES) */}
            {isFinished && results && results.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-gray-100 mt-4 animate-in fade-in slide-in-from-top-2 duration-700">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            Noticias destacadas en Orain.eus
                        </h4>
                    </div>
                    
                    <div className="grid gap-3">
                        {results.slice(0, 5).map((item, idx) => (
                            <a 
                                key={idx} 
                                href={item.url || "#"} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex justify-between items-center"
                            >
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-eitb-blue uppercase tracking-wider">
                                            {item.source || 'Orain.eus'}
                                        </span>
                                        {item.category && (
                                            <span className="text-[10px] text-gray-400 uppercase">
                                                • {item.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-serif font-medium text-gray-900 group-hover:text-eitb-blue leading-snug transition-colors">
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
                                        {item.summary}
                                    </div>
                                </div>
                                <div className="text-gray-300 group-hover:text-eitb-blue transform group-hover:translate-x-1 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN 3: FOOTER Y FEEDBACK (TU LÓGICA ORIGINAL) */}
            {isFinished && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-8">
                    <div className="flex gap-1">
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-green-600 transition-colors" title="Útil">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors" title="No útil">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                        </button>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">Iturriak / Fuentes</span>
                        <div className="flex gap-2">
                            <span className="text-[10px] text-eitb-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Orain.eus</span>
                            <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">EITB Media</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}