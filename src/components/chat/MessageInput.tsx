// Message input component
import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface MessageInputProps {
    onSend: (message: string) => void;
    isGenerating: boolean;
    disabled?: boolean;
    placeholder?: string;
    error?: string | null;
}

export function MessageInput({
    onSend,
    isGenerating,
    disabled = false,
    placeholder = 'Send a message...',
    error,
}: MessageInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isGenerating && !disabled) {
            onSend(input.trim());
            setInput('');
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const canSend = input.trim().length > 0 && !isGenerating && !disabled;

    return (
        <div className="bg-transparent">
            {/* Error display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border-b border-red-500/20">
                            <AlertCircle size={16} className="text-red-400" />
                            <span className="text-sm font-medium text-red-400">{error}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="px-4 pb-2 pt-2 md:px-6 md:pb-3 md:pt-4 bg-transparent outline-none">
                <div className="relative flex items-end gap-2 md:gap-3 p-2 md:p-3 rounded-[1.5rem] md:rounded-[2rem] bg-dark-800/80 border border-dark-700 focus-within:border-accent-primary focus-within:ring-4 focus-within:ring-accent-primary/10 transition-all shadow-2xl glass-hover">
                    {/* Sparkle icon */}
                    <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 md:w-10 md:h-10 mb-0.5 rounded-xl md:rounded-2xl bg-accent-primary/5">
                        <Sparkles size={18} className="text-accent-primary animate-pulse" />
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent text-dark-100 placeholder-dark-500 resize-none outline-none font-medium py-2.5 max-h-[200px]"
                        style={{ scrollbarWidth: 'none' }}
                    />

                    {/* Send button */}
                    <motion.button
                        type="submit"
                        disabled={!canSend}
                        whileHover={{ scale: canSend ? 1.05 : 1 }}
                        whileTap={{ scale: canSend ? 0.95 : 1 }}
                        className={`
              flex-shrink-0 flex items-center justify-center w-10 h-10 mb-0.5 rounded-2xl
              transition-all duration-300 shadow-lg
              ${canSend
                                ? 'bg-gradient-to-br from-accent-primary to-accent-hover text-white shadow-accent-primary/25'
                                : 'bg-dark-700 text-dark-500 cursor-not-allowed opacity-50'
                            }
            `}
                    >
                        {isGenerating ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} className={canSend ? "translate-x-0.5 -translate-y-0.5" : ""} />
                        )}
                    </motion.button>
                </div>

                {/* Helper text */}
                <p className="text-xs text-dark-500 mt-2 text-center">
                    Press <kbd className="px-1 py-0.5 bg-dark-700 rounded text-dark-400">Enter</kbd> to send,{' '}
                    <kbd className="px-1 py-0.5 bg-dark-700 rounded text-dark-400">Shift + Enter</kbd> for new line
                </p>
            </form>
        </div>
    );
}

export default MessageInput;
