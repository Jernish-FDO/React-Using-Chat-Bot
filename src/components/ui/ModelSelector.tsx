import { useSettingsStore, AVAILABLE_MODELS, type AIProvider } from '@/stores/settingsStore';
import { ChevronDown, Sparkles, Zap, Brain, Cpu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ModelSelector() {
    const { provider, modelId, setProvider, setModelId } = useSettingsStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentModel = AVAILABLE_MODELS.find(m => m.id === modelId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (p: AIProvider) => {
        if (p === 'gemini') return <Sparkles size={16} className="text-blue-400" />;
        return <Cpu size={16} className="text-purple-400" />;
    };

    const getModelIcon = (id: string) => {
        if (id.includes('flash')) return <Zap size={14} className="text-yellow-400" />;
        if (id.includes('llama')) return <Brain size={14} className="text-green-400" />;
        return <Cpu size={14} className="text-gray-400" />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg transition-colors group"
            >
                {getIcon(provider)}
                <span className="text-sm font-medium text-dark-100 hidden sm:inline">
                    {currentModel?.name || 'Select Model'}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-dark-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden glass"
                    >
                        <div className="p-3 border-b border-dark-700">
                            <div className="flex p-1 bg-dark-900 rounded-xl border border-dark-700">
                                <button
                                    onClick={() => setProvider('gemini')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${provider === 'gemini'
                                        ? 'bg-dark-700 text-white shadow-sm'
                                        : 'text-dark-400 hover:text-dark-200'
                                        }`}
                                >
                                    <Sparkles size={12} /> Gemini
                                </button>
                                <button
                                    onClick={() => setProvider('groq')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${provider === 'groq'
                                        ? 'bg-dark-700 text-white shadow-sm'
                                        : 'text-dark-400 hover:text-dark-200'
                                        }`}
                                >
                                    <Cpu size={12} /> Groq
                                </button>
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto p-1">
                            {AVAILABLE_MODELS.filter(m => m.provider === provider).map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setModelId(model.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex flex-col items-start p-2 rounded-lg transition-colors mb-1 last:mb-0 ${modelId === model.id
                                        ? 'bg-blue-500/10 border border-blue-500/20'
                                        : 'hover:bg-dark-700 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {getModelIcon(model.id)}
                                        <span className={`text-sm font-medium ${modelId === model.id ? 'text-blue-400' : 'text-dark-100'}`}>
                                            {model.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-dark-400 text-left line-clamp-1">
                                        {model.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
