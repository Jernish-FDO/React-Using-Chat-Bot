import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ThinkingIndicator } from './ThinkingIndicator';
import { useChatStore } from '@/stores/chatStore';
import { useToolStore } from '@/stores/toolStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Sparkles } from 'lucide-react';
import { createChat, sendMessage as sendGeminiMessage } from '@/lib/gemini/client';
import { sendMessage as sendGroqMessage } from '@/lib/groq/client';

export function ChatContainer() {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversationId = useChatStore(state => state.activeConversationId);
    const isGenerating = useChatStore(state => state.isGenerating);
    const error = useChatStore(state => state.error);
    const conversation = useChatStore(state =>
        state.conversations.find(c => c.id === state.activeConversationId)
    );

    const {
        addMessage,
        setGenerating,
        setError,
        createConversation,
    } = useChatStore();

    const currentToolCall = useToolStore(state => state.currentToolCall);
    const enabledToolIds = useToolStore(state => state.enabledToolIds);
    const { provider, modelId } = useSettingsStore();

    const messages = conversation?.messages ?? [];

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, isGenerating]);

    const handleSendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // Create conversation if needed
        let convId = activeConversationId;
        if (!convId) {
            convId = createConversation();
        }

        console.log('Sending message to', provider, 'model:', modelId);

        // Add user message
        addMessage(convId, {
            role: 'user',
            content,
        });

        setGenerating(true);
        setError(null);

        try {
            let result;
            const startTime = Date.now();

            if (provider === 'gemini') {
                const chat = createChat({
                    model: modelId as any,
                    enabledToolIds,
                });

                result = await sendGeminiMessage(chat, content, async (toolName, args) => {
                    useToolStore.getState().setExecuting(true, { name: toolName, args });
                });
            } else {
                // Groq path
                const messages_history = messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content
                }));
                // Combine history with CURRENT message (which was just added to state, so it might be in messages already)
                // To be safe and avoid duplicates, we use the content passed to handleSendMessage
                const messages_context = [...messages_history, { role: 'user' as const, content }];

                const groqResult = await sendGroqMessage(messages_context, modelId);
                result = {
                    text: groqResult.text,
                    toolCalls: [],
                    finishReason: groqResult.finishReason
                };
            }

            const thinkingTime = Date.now() - startTime;

            // Add assistant response
            addMessage(convId, {
                role: 'assistant',
                content: result.text || 'I received an empty response from the AI.',
                metadata: {
                    thinkingTime,
                    toolName: result.toolCalls?.[0]?.name,
                    toolResults: result.toolCalls,
                },
            });
        } catch (err: unknown) {
            console.error('Chat Error:', err);
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);

            // Add error message to chat
            addMessage(convId, {
                role: 'assistant',
                content: `Error: ${errorMessage}. Please check your API keys and internet connection.`,
                metadata: { error: errorMessage },
            });
        } finally {
            setGenerating(false);
            useToolStore.getState().setExecuting(false);
        }
    }, [activeConversationId, provider, modelId, enabledToolIds, messages.length, addMessage, createConversation, setError, setGenerating]);

    return (
        <div className="flex flex-col h-full bg-bg-app">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
                {messages.length === 0 ? (
                    <EmptyState onSuggestionClick={handleSendMessage} />
                ) : (
                    <div className="max-w-4xl mx-auto w-full py-8">
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                            />
                        ))}

                        <AnimatePresence>
                            {isGenerating && (
                                <ThinkingIndicator
                                    toolName={currentToolCall?.name}
                                />
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="w-full mt-auto">
                <div className="max-w-4xl mx-auto w-full">
                    <MessageInput
                        onSend={handleSendMessage}
                        isGenerating={isGenerating}
                        error={error}
                    />
                </div>
            </div>
        </div>
    );
}

interface EmptyStateProps {
    onSuggestionClick: (content: string) => void;
}

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
    const suggestions = [
        'What can you help me with?',
        'Search the web for the latest AI news',
        'Explain quantum computing in simple terms',
        'Help me write a Python script',
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-full py-12 md:py-20 px-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-accent-primary via-accent-hover to-brand-light flex items-center justify-center mb-6 md:mb-8 shadow-2xl shadow-accent-primary/20 animate-float"
            >
                <Sparkles size={32} className="text-white md:size-40" />
            </motion.div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight text-center">
                Supercharge AI
            </h1>

            <p className="text-dark-300 text-center max-w-md mb-8 md:mb-12 text-base md:text-lg font-medium opacity-80">
                The most advanced AI assistant for search, code, and deep research.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl w-full">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="p-4 text-left text-sm font-medium text-dark-200 bg-dark-800/40 hover:bg-dark-700/60 border border-dark-700 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] glass group"
                    >
                        <span className="group-hover:text-white transition-colors">
                            {suggestion}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default ChatContainer;
