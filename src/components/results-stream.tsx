"use client";

import { useEffect, useState } from "react";

export function ResultsStream({ isStreaming, results, text }: any) {
    const [displayedText, setDisplayedText] = useState(text || "");
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setDisplayedText(text || "");
        // Solo mostramos los resultados cuando el streaming del texto termina
        if (!isStreaming && results && results.length > 0) {
            setShowResults(true);
        }
    }, [isStreaming, text, results]);

    if (!isStreaming && !displayedText && (!results || results.length === 0)) return null;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Texto del Asistente */}
            <div className="prose prose-lg font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
                {displayedText === "Consultando..." ? (
                    <span className="text-gray-400 italic animate-pulse">Buscando información...</span>
                ) : displayedText}
                {isStreaming && <span className="inline-block w-2 h-5 ml-1 bg-blue-600 animate-pulse" />}
            </div>

            {/* Tarjetas de Previa con Enlace Redireccionable */}
            {showResults && (
                <div className="space-y-4 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid gap-4">
                        {results.map((item: any, idx: number) => (
                            <a 
                                key={idx} 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex flex-col md:flex-row bg-[#f8f9fb] border border-gray-200 rounded-xl overflow-hidden hover:bg-white hover:shadow-lg hover:border-blue-400 transition-all duration-300"
                            >
                                {item.image && (
                                    <div className="md:w-48 h-32 flex-shrink-0 bg-gray-200">
                                        <img 
                                            src={item.image} 
                                            alt="" 
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                        />
                                    </div>
                                )}
                                <div className="p-4 flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Orain.eus</div>
                                    <h3 className="font-bold text-gray-900 mt-1 line-clamp-2 group-hover:underline">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-1">{item.url}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}