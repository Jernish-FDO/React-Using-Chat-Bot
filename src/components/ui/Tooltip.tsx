// Tooltip component
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: string;
    children: ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export function Tooltip({ content, children, side = 'top', delay = 300 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        const id = setTimeout(() => setIsVisible(true), delay);
        setTimeoutId(id);
    };

    const handleMouseLeave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        setIsVisible(false);
    };

    const positions = {
        top: '-translate-x-1/2 -translate-y-full left-1/2 -top-2',
        bottom: '-translate-x-1/2 translate-y-full left-1/2 -bottom-2',
        left: '-translate-x-full -translate-y-1/2 -left-2 top-1/2',
        right: 'translate-x-full -translate-y-1/2 -right-2 top-1/2',
    };

    const origins = {
        top: 'origin-bottom',
        bottom: 'origin-top',
        left: 'origin-right',
        right: 'origin-left',
    };

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`
              absolute z-50 px-2 py-1
              text-xs text-white bg-dark-700 rounded-md shadow-lg
              whitespace-nowrap pointer-events-none
              border border-dark-600
              ${positions[side]}
              ${origins[side]}
            `}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Tooltip;
