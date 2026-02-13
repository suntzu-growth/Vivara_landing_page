"use client";

import { cn } from "@/lib/utils";

const TOPICS = [
    { id: "chamberi", label: "Chamberí", query: "Chamberí", disabled: false },
    { id: "salamanca", label: "Salamanca", query: "Salamanca", disabled: false },
    { id: "retiro", label: "Retiro", query: "Retiro", disabled: false },
    { id: "pozuelo", label: "Pozuelo", query: "Pozuelo", disabled: false },
];

interface TopicSelectorProps {
    onSelect: (topic: string) => void;
    className?: string;
}

export function TopicSelector({ onSelect, className }: TopicSelectorProps) {
    return (
        <div className={cn("flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200", className)}>
            {TOPICS.map((topic) => (
                <button
                    key={topic.id}
                    onClick={() => !topic.disabled && onSelect(topic.query)}
                    disabled={topic.disabled}
                    className={cn(
                        "px-4 py-2 border rounded-full text-sm font-medium transition-all shadow-sm",
                        // Estilos para botón habilitado (Noticias y Deportes)
                        !topic.disabled && "bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600 hover:bg-red-50 cursor-pointer",
                        // Estilos para botones deshabilitados (TV y Radio)
                        topic.disabled && "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60 grayscale"
                    )}
                >
                    {topic.label}
                </button>
            ))}
        </div>
    );
}