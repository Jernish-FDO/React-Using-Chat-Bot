// Header component
import { motion } from 'framer-motion';
import {
    Sparkles,
    Menu,
    Settings,
    Sun,
    Moon,
    PlusCircle,
    LogIn,
    LogOut,
    User as UserIcon
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { useChatStore } from '@/stores/chatStore';
import { useUsageStore } from '@/stores/usageStore';
import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
    onToggleSidebar?: () => void;
    onToggleSettings?: () => void;
}

export function Header({ onToggleSidebar, onToggleSettings }: HeaderProps) {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const { createConversation, setActiveConversation } = useChatStore();
    const { getUsageStats } = useUsageStore();
    const { user, signOut, loading } = useAuthStore();

    const stats = getUsageStats();

    const handleNewChat = () => {
        const id = createConversation();
        setActiveConversation(id);
    };

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (!newMode) {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }
    };

    return (
        <header className="flex items-center justify-between h-14 px-4 border-b border-dark-700 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-30">
            {/* Left section */}
            <div className="flex items-center gap-2 md:gap-3">
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        aria-label="Toggle Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                )}

                <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewChat}>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-accent-primary to-brand-light flex items-center justify-center shadow-lg shadow-accent-primary/20">
                        <Sparkles size={16} className="text-white md:hidden" />
                        <Sparkles size={18} className="text-white hidden md:block" />
                    </div>
                    <span className="font-bold text-white hidden md:block tracking-tight text-lg">
                        Supercharge
                    </span>
                </div>
            </div>

            {/* Center section - Model selector (Responsive) */}
            <div className="flex-1 flex justify-center max-w-[200px] md:max-w-none">
                <ModelSelector />
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 md:gap-2">
                {/* Usage indicator - Hidden on mobile */}
                <Tooltip content={`API: ${stats.gemini.percent}% | Search: ${stats.tavily.percent}%`}>
                    <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-lg">
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

                {/* New chat button - Ghost on small desktop, Icon on mobile */}
                <Tooltip content="New Chat">
                    <button
                        onClick={handleNewChat}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors md:hidden"
                    >
                        <PlusCircle size={18} />
                    </button>
                </Tooltip>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewChat}
                    leftIcon={<PlusCircle size={16} />}
                    className="hidden md:flex"
                >
                    New Chat
                </Button>

                {/* Theme toggle */}
                <Tooltip content={isDarkMode ? 'Light mode' : 'Dark mode'}>
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </Tooltip>

                {/* Auth status */}
                {loading ? (
                    <div className="w-8 h-8 rounded-full bg-dark-700 animate-pulse" />
                ) : user ? (
                    <div className="flex items-center gap-1">
                        <Tooltip content={user.displayName || 'User'}>
                            <button className="w-8 h-8 rounded-full border border-dark-600 overflow-hidden hover:border-accent-primary transition-colors">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-dark-700 flex items-center justify-center text-dark-300">
                                        <UserIcon size={16} />
                                    </div>
                                )}
                            </button>
                        </Tooltip>
                        <button
                            onClick={() => signOut()}
                            className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors hidden sm:block"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : null}

                {/* Settings */}
                <Tooltip content="Settings">
                    <button
                        onClick={onToggleSettings}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                </Tooltip>

            </div>
        </header>
    );
}

export default Header;
