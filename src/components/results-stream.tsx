"use client";

import { useState, useEffect, useRef } from "react";

// Función simple para convertir Markdown básico a HTML
function parseMarkdown(text: string): string {
  if (!text) return '';

  return text
    // Negritas: **texto** → <strong>texto</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Enlaces: [texto](url) → <a href="url">texto</a>
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-red-600 hover:underline">$1</a>')
    // Emojis de enlaces: 🔗 → mantener
    .replace(/🔗/g, '🔗');
}

export function ResultsStream({ isStreaming, results, text }: any) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // ✅ Ref para el interval

  const currentTypedTextRef = useRef(''); // ✅ Ref para seguir el progreso del tipado real

  useEffect(() => {
    // ✅ CRÍTICO: Limpiar el interval anterior SIEMPRE que text cambie
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Si no hay texto o es "Consultando...", no hacer streaming
    if (!text || text === 'Consultando...') {
      setDisplayedText(text || '');
      currentTypedTextRef.current = text || '';
      setIsTyping(false);
      return;
    }

    // ✅ Detectar si el texto es una extensión para no resetear la animación
    const isExtension = text.startsWith(currentTypedTextRef.current) && currentTypedTextRef.current.length > 0;

    if (!isExtension) {
      setDisplayedText('');
      currentTypedTextRef.current = '';
      // Si el texto es corto, mostrar completo
      if (text.length < 50) {
        setDisplayedText(text);
        currentTypedTextRef.current = text;
        setIsTyping(false);
        return;
      }
    }

    // Streaming simulado: mostrar el texto progresivamente
    setIsTyping(true);
    let currentIndex = currentTypedTextRef.current.length;

    // Velocidad adaptativa
    const speed = text.length > 500 ? 10 : 20;

    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        const nextSpace = text.indexOf(' ', currentIndex + 1);
        const nextIndex = nextSpace === -1 ? text.length : nextSpace + 1;

        const newText = text.substring(0, nextIndex);
        setDisplayedText(newText);
        currentTypedTextRef.current = newText;
        currentIndex = nextIndex;
      } else {
        setIsTyping(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    // Cleanup: cancelar interval cuando el componente se desmonte o text cambie
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text]);

  const htmlContent = parseMarkdown(displayedText);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Texto con soporte para Markdown */}
      <div
        className="text-inherit text-lg leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ whiteSpace: 'pre-wrap' }}
      />

      {/* Cursor parpadeante mientras escribe */}
      {(isStreaming || isTyping) && (
        <span className="inline-block w-2 h-5 ml-1 bg-red-600 animate-pulse" />
      )}

      {/* Tarjetas Visuales (Metadata + Link) */}
      {/* Solo mostrar cuando termine de escribir el texto */}
      {!isTyping && results && results.length > 0 && (
        <div className="grid gap-4 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {results.map((item: any, idx: number) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col md:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Galería de Imágenes (hasta 3) */}
              {(item.images && item.images.length > 0) ? (
                <div className="md:w-64 flex-shrink-0 bg-gray-100 flex flex-col gap-1 p-1">
                  <div className="flex-1 h-32 overflow-hidden rounded-lg">
                    <img
                      src={item.images[0]}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      alt={`${item.title} - Principal`}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  {item.images.length > 1 && (
                    <div className="flex gap-1 h-12">
                      {item.images.slice(1, 3).map((imgUrl: string, i: number) => (
                        <div key={i} className="flex-1 overflow-hidden rounded-md">
                          <img
                            src={imgUrl}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                            alt={`${item.title} - Miniatura ${i + 1}`}
                            onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : item.image ? (
                <div className="md:w-48 h-32 flex-shrink-0 bg-gray-100">
                  <img
                    src={item.image}
                    className="w-full h-full object-cover"
                    alt={item.title || 'Propiedad'}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ) : null}

              <div className="p-4 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                    VIVLA
                  </span>
                  {item.category && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      {item.category}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-red-700 line-clamp-2 mt-1 transition-colors">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                )}
                <div className="mt-4 flex items-center text-xs font-semibold text-red-600 group-hover:gap-2 transition-all">
                  Ver detalles
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}