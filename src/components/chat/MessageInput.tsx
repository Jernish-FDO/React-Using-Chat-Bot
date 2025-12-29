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
        <div className="border-t border-dark-700 bg-dark-900/80 backdrop-blur-xl">
            {/* Error display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                            <AlertCircle size={14} className="text-red-400" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="p-4">
                <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-dark-800 border border-dark-600 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/50 transition-all">
                    {/* Sparkle icon */}
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 mb-0.5">
                        <Sparkles size={18} className="text-dark-500" />
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
                        className="flex-1 bg-transparent text-dark-100 placeholder-dark-500 resize-none outline-none text-sm py-2 max-h-[200px]"
                        style={{ scrollbarWidth: 'none' }}
                    />

                    {/* Send button */}
                    <motion.button
                        type="submit"
                        disabled={!canSend}
                        whileHover={{ scale: canSend ? 1.05 : 1 }}
                        whileTap={{ scale: canSend ? 0.95 : 1 }}
                        className={`
              flex-shrink-0 flex items-center justify-center w-8 h-8 mb-0.5 rounded-lg
              transition-all duration-200
              ${canSend
                                ? 'bg-accent-primary text-white hover:bg-accent-hover'
                                : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                            }
            `}
                    >
                        {isGenerating ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} />
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
