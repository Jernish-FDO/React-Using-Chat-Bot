// Sidebar component with conversation history
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Trash2,
    PlusCircle,
    Search,
    ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ToolTogglePanel } from '@/components/tools/ToolTogglePanel';
import { useChatStore } from '@/stores/chatStore';
import { truncate } from '@/utils/helpers';
import type { Conversation } from '@/types/chat';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const {
        conversations,
        activeConversationId,
        setActiveConversation,
        createConversation,
        deleteConversation,
    } = useChatStore();

    const filteredConversations = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewChat = () => {
        const id = createConversation();
        setActiveConversation(id);
        onClose?.();
    };

    const handleSelectConversation = (id: string) => {
        setActiveConversation(id);
        onClose?.();
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteConversation(id);
    };

    // Group conversations by date
    const groupedConversations = groupByDate(filteredConversations);

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{ x: isOpen ? 0 : -280 }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                className="fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col bg-dark-900 border-r border-dark-700 shadow-2xl lg:shadow-none"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-dark-700 bg-dark-800/30">
                    <h2 className="font-bold text-white tracking-tight text-lg">Your Sessions</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors lg:hidden"
                            aria-label="Close Sidebar"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>

                {/* New chat button */}
                <div className="p-3">
                    <Button
                        onClick={handleNewChat}
                        leftIcon={<PlusCircle size={16} />}
                        className="w-full justify-center"
                    >
                        New Chat
                    </Button>
                </div>

                {/* Search */}
                <div className="px-3 pb-3">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-primary"
                        />
                    </div>
                </div>

                {/* Conversations list */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {Object.entries(groupedConversations).map(([group, convs]) => (
                        <div key={group} className="mb-4">
                            <h3 className="px-4 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider">
                                {group}
                            </h3>
                            <div className="space-y-0.5 px-2">
                                {convs.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        isActive={conv.id === activeConversationId}
                                        isHovered={conv.id === hoveredId}
                                        onSelect={() => handleSelectConversation(conv.id)}
                                        onDelete={(e) => handleDelete(e, conv.id)}
                                        onHover={(hovered) => setHoveredId(hovered ? conv.id : null)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredConversations.length === 0 && (
                        <div className="px-4 py-8 text-center text-dark-500 text-sm">
                            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                        </div>
                    )}
                </div>

                {/* Tool toggles */}
                <div className="p-3 border-t border-dark-700 overflow-y-auto max-h-[45vh] scrollbar-hide">
                    <ToolTogglePanel />
                </div>
            </motion.aside>
        </>
    );
}

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    isHovered: boolean;
    onSelect: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onHover: (hovered: boolean) => void;
}

function ConversationItem({
    conversation,
    isActive,
    isHovered,
    onSelect,
    onDelete,
    onHover,
}: ConversationItemProps) {
    // DOM Nesting Fix Applied: Changed from motion.button to motion.div
    return (
        <motion.div
            layout
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect()}
            className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
        transition-all group cursor-pointer border
        ${isActive
                    ? 'bg-accent-primary/20 border-accent-primary/30 text-white shadow-lg shadow-accent-primary/10'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-dark-200 border-transparent'
                }
      `}
        >
            <MessageSquare size={16} className="flex-shrink-0 text-dark-500" />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                    {truncate(conversation.title, 25)}
                </p>
                <p className="text-xs text-dark-500">
                    {conversation.messageCount} messages
                </p>
            </div>

            <AnimatePresence>
                {(isHovered || isActive) && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(e);
                        }}
                        className="p-1 text-dark-500 hover:text-red-400 rounded transition-colors"
                        title="Delete conversation"
                    >
                        <Trash2 size={14} />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Helper function to group conversations by date
function groupByDate(conversations: Conversation[]): Record<string, Conversation[]> {
    const groups: Record<string, Conversation[]> = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        'This Month': [],
        Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    conversations.forEach((conv) => {
        const date = new Date(conv.updatedAt);

        if (date >= today) {
            groups.Today.push(conv);
        } else if (date >= yesterday) {
            groups.Yesterday.push(conv);
        } else if (date >= weekAgo) {
            groups['This Week'].push(conv);
        } else if (date >= monthAgo) {
            groups['This Month'].push(conv);
        } else {
            groups.Older.push(conv);
        }
    });

    // Remove empty groups
    return Object.fromEntries(
        Object.entries(groups).filter(([, convs]) => convs.length > 0)
    );
}

export default Sidebar;
