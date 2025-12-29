// Header component
import { motion } from 'framer-motion';
import {
    Sparkles,
    Menu,
    Settings,
    Sun,
    Moon,
    ChevronDown,
    PlusCircle
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { useChatStore } from '@/stores/chatStore';
import { useUsageStore } from '@/stores/usageStore';

interface HeaderProps {
    onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const { createConversation, setActiveConversation } = useChatStore();
    const { getUsageStats } = useUsageStore();

    const stats = getUsageStats();

    const handleNewChat = () => {
        const id = createConversation();
        setActiveConversation(id);
    };

    return (
        <header className="flex items-center justify-between h-14 px-4 border-b border-dark-700 bg-dark-900/80 backdrop-blur-xl">
            {/* Left section */}
            <div className="flex items-center gap-3">
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors lg:hidden"
                    >
                        <Menu size={20} />
                    </button>
                )}

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-blue-500 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <span className="font-semibold text-dark-100 hidden sm:block">
                        AI Assistant
                    </span>
                </div>
            </div>

            {/* Center section - Model selector (optional) */}
            <div className="hidden md:flex items-center">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                    <span>Gemini 2.5 Flash Lite</span>
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">
                {/* Usage indicator */}
                <Tooltip content={`API: ${stats.gemini.percent}% | Search: ${stats.tavily.percent}%`}>
                    <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg">
                        <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-accent-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.gemini.percent}%` }}
                            />
                        </div>
                        <span className="text-xs text-dark-500">{stats.gemini.percent}%</span>
                    </div>
                </Tooltip>

                {/* New chat button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewChat}
                    leftIcon={<PlusCircle size={16} />}
                    className="hidden sm:flex"
                >
                    New Chat
                </Button>

                {/* Theme toggle */}
                <Tooltip content={isDarkMode ? 'Light mode' : 'Dark mode'}>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </Tooltip>

                {/* Settings */}
                <Tooltip content="Settings">
                    <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                        <Settings size={18} />
                    </button>
                </Tooltip>
            </div>
        </header>
    );
}

export default Header;
