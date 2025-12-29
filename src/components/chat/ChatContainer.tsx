// Main chat container component
import { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ThinkingIndicator } from './ThinkingIndicator';
import { useChatStore } from '@/stores/chatStore';
import { useToolStore } from '@/stores/toolStore';
import { Sparkles } from 'lucide-react';

export function ChatContainer() {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        activeConversationId,
        isGenerating,
        error,
        getActiveConversation,
        addMessage,
        setGenerating,
        setError,
        createConversation,
    } = useChatStore();

    const { currentToolCall } = useToolStore();

    const conversation = getActiveConversation();
    const messages = conversation?.messages ?? [];

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, isGenerating]);

    const handleSendMessage = async (content: string) => {
        // Create conversation if needed
        let convId = activeConversationId;
        if (!convId) {
            convId = createConversation();
        }

        // Add user message
        addMessage(convId, {
            role: 'user',
            content,
        });

        setGenerating(true);
        setError(null);

        try {
            // Import dynamically to avoid issues if API key not set
            const { createChat, sendMessage } = await import('@/lib/gemini/client');
            const { useToolStore } = await import('@/stores/toolStore');

            const enabledToolIds = useToolStore.getState().enabledToolIds;

            const chat = createChat({
                model: 'gemini-2.5-flash-lite',
                enabledToolIds,
            });

            const startTime = Date.now();

            const result = await sendMessage(chat, content, async (toolName, args) => {
                useToolStore.getState().setExecuting(true, { name: toolName, args });
            });

            const thinkingTime = Date.now() - startTime;

            // Add assistant response
            addMessage(convId, {
                role: 'assistant',
                content: result.text,
                metadata: {
                    thinkingTime,
                    toolName: result.toolCalls?.[0]?.name,
                    toolResults: result.toolCalls,
                },
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);

            // Add error message to chat
            addMessage(convId, {
                role: 'assistant',
                content: 'I encountered an error while processing your request. Please try again.',
                metadata: { error: errorMessage },
            });
        } finally {
            setGenerating(false);
            useToolStore.getState().setExecuting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {messages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="max-w-4xl mx-auto">
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

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="max-w-4xl mx-auto w-full">
                <MessageInput
                    onSend={handleSendMessage}
                    isGenerating={isGenerating}
                    error={error}
                />
            </div>
        </div>
    );
}

function EmptyState() {
    const suggestions = [
        'What can you help me with?',
        'Search the web for the latest AI news',
        'Explain quantum computing in simple terms',
        'Help me write a Python script',
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full px-4 py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-blue-500 flex items-center justify-center mb-6 shadow-lg glow">
                <Sparkles size={32} className="text-white" />
            </div>

            <h1 className="text-2xl font-bold text-dark-100 mb-2">
                AI Assistant
            </h1>

            <p className="text-dark-400 text-center max-w-md mb-8">
                I can search the web, answer questions, help with code, and conduct deep research on complex topics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        className="p-3 text-left text-sm text-dark-300 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-xl transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default ChatContainer;
