// Message bubble component
import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, AlertCircle, Clock, Globe, Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '@/types/chat';
import { formatDate } from '@/utils/helpers';

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const isTool = message.role === 'tool';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Tool result message
    if (isTool) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 px-4 py-2 my-2 mx-4 rounded-lg bg-dark-800/50 border border-dark-700"
            >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Globe size={14} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-400">
                            {message.metadata?.toolName || 'Tool Result'}
                        </span>
                    </div>
                    <div className="text-sm text-dark-300">
                        <MarkdownRenderer content={message.content} />
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`group flex gap-3 px-4 py-4 ${isUser ? 'bg-dark-800/30' : ''}`}
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center">
                        <User size={16} className="text-dark-300" />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-blue-500 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-dark-100 text-sm">
                        {isUser ? 'You' : 'Assistant'}
                    </span>
                    <span className="text-xs text-dark-500">
                        {formatDate(message.timestamp)}
                    </span>
                    {message.metadata?.thinkingTime && (
                        <span className="flex items-center gap-1 text-xs text-dark-500">
                            <Clock size={12} />
                            {(message.metadata.thinkingTime / 1000).toFixed(1)}s
                        </span>
                    )}
                </div>

                {/* Message content */}
                {isAssistant ? (
                    <MarkdownRenderer content={message.content} />
                ) : (
                    <p className="text-dark-200 whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                )}

                {/* Sources if available */}
                {message.metadata?.sources && message.metadata.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-dark-700">
                        <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">
                            Sources
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {message.metadata.sources.map((source, index) => (
                                <a
                                    key={index}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-dark-300 bg-dark-800 rounded-md hover:bg-dark-700 hover:text-white transition-colors"
                                >
                                    {source.favicon && (
                                        <img src={source.favicon} alt="" className="w-3 h-3" />
                                    )}
                                    <span className="truncate max-w-[150px]">{source.title}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {message.metadata?.error && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertCircle size={14} className="text-red-400" />
                        <span className="text-sm text-red-400">{message.metadata.error}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-white rounded transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check size={12} className="text-green-400" />
                                <span className="text-green-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={12} />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

export default MessageBubble;
