// Tool toggle panel component
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Clock,
    Calculator,
    Microscope,
    ChevronDown,
    AlertCircle,
    type LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToolStore, type Tool } from '@/stores/toolStore';

const iconMap: Record<string, LucideIcon> = {
    search: Search,
    clock: Clock,
    calculator: Calculator,
    microscope: Microscope,
};

interface ToolTogglePanelProps {
    compact?: boolean;
}

export function ToolTogglePanel({ compact = false }: ToolTogglePanelProps) {
    const [isExpanded, setIsExpanded] = useState(!compact);
    const { tools, enabledToolIds, toggleTool, enableAll, disableAll } = useToolStore();

    const enabledCount = enabledToolIds.length;
    const totalCount = tools.length;

    const groupedTools = {
        search: tools.filter(t => t.category === 'search'),
        analysis: tools.filter(t => t.category === 'analysis'),
        utility: tools.filter(t => t.category === 'utility'),
    };

    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg transition-colors"
                >
                    <span>Tools ({enabledCount}/{totalCount})</span>
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-2 w-72 p-3 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50"
                        >
                            <ToolList
                                tools={tools}
                                enabledToolIds={enabledToolIds}
                                onToggle={toggleTool}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="p-4 bg-dark-800/50 border border-dark-700 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-dark-100">Tools</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={enableAll}
                        className="text-xs text-dark-400 hover:text-accent-primary transition-colors"
                    >
                        Enable All
                    </button>
                    <span className="text-dark-600">|</span>
                    <button
                        onClick={disableAll}
                        className="text-xs text-dark-400 hover:text-red-400 transition-colors"
                    >
                        Disable All
                    </button>
                </div>
            </div>

            {/* Tool groups */}
            <div className="space-y-4">
                {Object.entries(groupedTools).map(([category, categoryTools]) => (
                    categoryTools.length > 0 && (
                        <div key={category}>
                            <h4 className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">
                                {category}
                            </h4>
                            <div className="space-y-2">
                                {categoryTools.map((tool) => (
                                    <ToolItem
                                        key={tool.id}
                                        tool={tool}
                                        isEnabled={enabledToolIds.includes(tool.id)}
                                        onToggle={() => toggleTool(tool.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

interface ToolListProps {
    tools: Tool[];
    enabledToolIds: string[];
    onToggle: (id: string) => void;
}

function ToolList({ tools, enabledToolIds, onToggle }: ToolListProps) {
    return (
        <div className="space-y-2">
            {tools.map((tool) => (
                <ToolItem
                    key={tool.id}
                    tool={tool}
                    isEnabled={enabledToolIds.includes(tool.id)}
                    onToggle={() => onToggle(tool.id)}
                />
            ))}
        </div>
    );
}

interface ToolItemProps {
    tool: Tool;
    isEnabled: boolean;
    onToggle: () => void;
}

function ToolItem({ tool, isEnabled, onToggle }: ToolItemProps) {
    const Icon = iconMap[tool.icon] || Search;
    const isConfigured = !tool.requiresApiKey || checkApiKey(tool.id);

    return (
        <div
            className={`
        flex items-center gap-3 p-2 rounded-lg transition-colors
        ${isEnabled ? 'bg-dark-700/50' : 'hover:bg-dark-700/30'}
      `}
        >
            <div
                className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          ${isEnabled ? 'bg-accent-primary/20 text-accent-primary' : 'bg-dark-700 text-dark-400'}
        `}
            >
                <Icon size={16} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isEnabled ? 'text-dark-100' : 'text-dark-300'}`}>
                        {tool.name}
                    </span>
                    {tool.requiresApiKey && !isConfigured && (
                        <Tooltip content="API key required">
                            <AlertCircle size={14} className="text-yellow-500" />
                        </Tooltip>
                    )}
                </div>
                <p className="text-xs text-dark-500 truncate">{tool.description}</p>
            </div>

            <Toggle
                checked={isEnabled}
                onChange={onToggle}
                size="sm"
                disabled={tool.requiresApiKey && !isConfigured}
            />
        </div>
    );
}

// Helper to check if required API keys are configured
function checkApiKey(toolId: string): boolean {
    const keyMap: Record<string, string> = {
        web_search: 'VITE_TAVILY_API_KEY',
        deep_research: 'VITE_TAVILY_API_KEY',
    };

    const envKey = keyMap[toolId];
    if (!envKey) return true;

    return !!import.meta.env[envKey];
}

export default ToolTogglePanel;
