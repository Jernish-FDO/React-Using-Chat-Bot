// Tool state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'search' | 'analysis' | 'utility';
    enabled: boolean;
    requiresApiKey?: boolean;
}

// Available tools configuration
export const AVAILABLE_TOOLS: Tool[] = [
    {
        id: 'web_search',
        name: 'Web Search',
        description: 'Search the internet for real-time information using Tavily',
        icon: 'search',
        category: 'search',
        enabled: true,
        requiresApiKey: true,
    },
    {
        id: 'get_current_time',
        name: 'Current Time',
        description: 'Get the current date and time in any timezone',
        icon: 'clock',
        category: 'utility',
        enabled: true,
    },
    {
        id: 'calculator',
        name: 'Calculator',
        description: 'Perform mathematical calculations',
        icon: 'calculator',
        category: 'utility',
        enabled: true,
    },
    {
        id: 'deep_research',
        name: 'Deep Research',
        description: 'Conduct multi-step research with iterative refinement',
        icon: 'microscope',
        category: 'analysis',
        enabled: true,
        requiresApiKey: true,
    },
];

interface ToolState {
    // State
    tools: Tool[];
    enabledToolIds: string[];
    isExecuting: boolean;
    currentToolCall: { name: string; args: Record<string, unknown> } | null;

    // Actions
    toggleTool: (toolId: string) => void;
    enableTool: (toolId: string) => void;
    disableTool: (toolId: string) => void;
    enableAll: () => void;
    disableAll: () => void;
    setExecuting: (executing: boolean, toolCall?: { name: string; args: Record<string, unknown> }) => void;

    // Getters
    isToolEnabled: (toolId: string) => boolean;
    getEnabledTools: () => Tool[];
    getToolById: (id: string) => Tool | undefined;
}

export const useToolStore = create<ToolState>()(
    persist(
        (set, get) => ({
            tools: AVAILABLE_TOOLS,
            enabledToolIds: AVAILABLE_TOOLS.filter(t => t.enabled).map(t => t.id),
            isExecuting: false,
            currentToolCall: null,

            toggleTool: (toolId) => {
                set((state) => ({
                    enabledToolIds: state.enabledToolIds.includes(toolId)
                        ? state.enabledToolIds.filter(id => id !== toolId)
                        : [...state.enabledToolIds, toolId],
                }));
            },

            enableTool: (toolId) => {
                set((state) => ({
                    enabledToolIds: state.enabledToolIds.includes(toolId)
                        ? state.enabledToolIds
                        : [...state.enabledToolIds, toolId],
                }));
            },

            disableTool: (toolId) => {
                set((state) => ({
                    enabledToolIds: state.enabledToolIds.filter(id => id !== toolId),
                }));
            },

            enableAll: () => {
                set({ enabledToolIds: AVAILABLE_TOOLS.map(t => t.id) });
            },

            disableAll: () => {
                set({ enabledToolIds: [] });
            },

            setExecuting: (executing, toolCall) => {
                set({
                    isExecuting: executing,
                    currentToolCall: executing ? (toolCall ?? null) : null,
                });
            },

            isToolEnabled: (toolId) => {
                return get().enabledToolIds.includes(toolId);
            },

            getEnabledTools: () => {
                const { tools, enabledToolIds } = get();
                return tools.filter(t => enabledToolIds.includes(t.id));
            },

            getToolById: (id) => {
                return get().tools.find(t => t.id === id);
            },
        }),
        {
            name: 'tool-preferences',
            partialize: (state) => ({
                enabledToolIds: state.enabledToolIds,
            }),
        }
    )
);
