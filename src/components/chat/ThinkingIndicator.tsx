// Thinking indicator animation
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ThinkingIndicatorProps {
    message?: string;
    toolName?: string;
}

export function ThinkingIndicator({ message, toolName }: ThinkingIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4"
        >
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-blue-500 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-dark-300">
                    {/* Animated dots */}
                    <div className="thinking-dots">
                        <span />
                        <span />
                        <span />
                    </div>

                    <span className="text-sm">
                        {toolName ? (
                            <>
                                Using <span className="text-accent-primary font-medium">{toolName}</span>
                            </>
                        ) : (
                            message || 'Thinking...'
                        )}
                    </span>
                </div>

                {/* Optional progress bar for tools */}
                {toolName && (
                    <div className="w-48 h-1 bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-accent-primary to-blue-500"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default ThinkingIndicator;
