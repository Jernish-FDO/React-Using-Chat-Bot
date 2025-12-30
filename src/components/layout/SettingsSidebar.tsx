import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    RotateCcw,
    Save,
    Settings2,
    Key,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useApiKeyStore, type APIKeys } from '@/stores/apiKeyStore';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface SettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
    const [activeTab, setActiveTab] = useState<'model' | 'keys'>('model');
    const {
        systemPrompt,
        temperature,
        topP,
        setSystemPrompt,
        setTemperature,
        setTopP,
        resetToDefaults
    } = useSettingsStore();

    const { keys, setKey } = useApiKeyStore();

    const [localPrompt, setLocalPrompt] = useState(systemPrompt);
    const [localTemp, setLocalTemp] = useState(temperature);
    const [localTopP, setLocalTopP] = useState(topP);
    const [localKeys, setLocalKeys] = useState(keys);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const handleSave = () => {
        if (activeTab === 'model') {
            setSystemPrompt(localPrompt);
            setTemperature(localTemp);
            setTopP(localTopP);
        } else {
            (Object.entries(localKeys) as [keyof APIKeys, string][]).forEach(([provider, key]) => {
                setKey(provider, key || '');
            });
        }
        // Keep it open? Or close? Sidebar usually stays or closes on explicit 'X'. 
        // I'll keep it open for multi-edit, but provide feedback.
    };

    const handleReset = () => {
        if (activeTab === 'model') {
            resetToDefaults();
            setLocalPrompt('');
            setLocalTemp(0.7);
            setLocalTopP(0.95);
        }
    };

    const toggleKeyVisibility = (provider: string) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    />

                    <motion.aside
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[350px] bg-dark-900 border-l border-dark-700 z-50 flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-dark-700 bg-dark-800/30">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-accent-primary/10">
                                        <Settings2 size={20} className="text-accent-primary" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">AI Settings</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Mini Tabs */}
                            <div className="flex p-1 bg-dark-800 rounded-2xl border border-dark-700">
                                <button
                                    onClick={() => setActiveTab('model')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${activeTab === 'model' ? 'bg-dark-700 text-white shadow-lg' : 'text-dark-400 hover:text-dark-200'}`}
                                >
                                    <Sparkles size={14} />
                                    Behavior
                                </button>
                                <button
                                    onClick={() => setActiveTab('keys')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${activeTab === 'keys' ? 'bg-dark-700 text-white shadow-lg' : 'text-dark-400 hover:text-dark-200'}`}
                                >
                                    <Key size={14} />
                                    API Keys
                                </button>
                            </div>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                            {activeTab === 'model' ? (
                                <>
                                    {/* System Prompt Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1 h-4 bg-accent-primary rounded-full" />
                                            <label className="text-sm font-bold text-dark-100 uppercase tracking-wider">
                                                System Identity
                                            </label>
                                        </div>
                                        <textarea
                                            value={localPrompt}
                                            onChange={(e) => setLocalPrompt(e.target.value)}
                                            placeholder="Example: You are a creative writer who uses poetic language..."
                                            className="w-full h-40 px-4 py-3 bg-dark-800 border border-dark-700 rounded-2xl text-sm text-dark-100 placeholder-dark-600 focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all resize-none shadow-inner glass-hover"
                                        />
                                        <p className="text-[11px] text-dark-500 leading-relaxed px-1">
                                            Define the AI's role, tone, and knowledge constraints. This affects every response.
                                        </p>
                                    </div>

                                    {/* Intelligence Controls */}
                                    <div className="space-y-6 pt-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-4 bg-blue-500 rounded-full" />
                                            <label className="text-sm font-bold text-dark-100 uppercase tracking-wider">
                                                Intelligence
                                            </label>
                                        </div>

                                        {/* Temperature */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-dark-200">Temperature</span>
                                                    <span className="text-[10px] text-dark-500">Creativity vs Precision</span>
                                                </div>
                                                <span className="px-2 py-1 bg-accent-primary/10 text-accent-primary text-xs font-mono rounded-lg border border-accent-primary/20">
                                                    {localTemp.toFixed(1)}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={localTemp}
                                                onChange={(e) => setLocalTemp(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-dark-700 rounded-full appearance-none cursor-pointer accent-accent-primary"
                                            />
                                        </div>

                                        {/* Top-P */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-dark-200">Top-P</span>
                                                    <span className="text-[10px] text-dark-500">Diversity of Choice</span>
                                                </div>
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-mono rounded-lg border border-blue-500/20">
                                                    {localTopP.toFixed(2)}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={localTopP}
                                                onChange={(e) => setLocalTopP(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-dark-700 rounded-full appearance-none cursor-pointer accent-accent-primary"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-accent-primary/5 border border-accent-primary/10 rounded-2xl">
                                        <p className="text-[11px] text-dark-400 leading-relaxed italic">
                                            Your keys are stored locally and synced to your private Firebase vault.
                                        </p>
                                    </div>

                                    {[
                                        { id: 'gemini', label: 'Gemini AI', placeholder: 'Key starting with AIza...' },
                                        { id: 'tavily', label: 'Tavily Search', placeholder: 'tvly-...' },
                                        { id: 'weather', label: 'OpenWeather', placeholder: 'xxxx-xxxx...' },
                                        { id: 'groq', label: 'Groq Cloud', placeholder: 'gsk_...' },
                                    ].map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label className="text-xs font-bold text-dark-400 uppercase tracking-widest ml-1">{field.label}</label>
                                            <div className="relative group">
                                                <input
                                                    type={showKeys[field.id] ? 'text' : 'password'}
                                                    value={localKeys[field.id as keyof APIKeys] || ''}
                                                    onChange={(e) => setLocalKeys(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-2xl text-sm text-dark-100 placeholder-dark-600 focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner outline-none pr-10"
                                                />
                                                <button
                                                    onClick={() => toggleKeyVisibility(field.id)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                                                    type="button"
                                                >
                                                    {showKeys[field.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-dark-700 bg-dark-800/30 space-y-3">
                            <Button
                                onClick={handleSave}
                                className="w-full shadow-xl shadow-accent-primary/20 rounded-2xl h-12"
                                leftIcon={<Save size={18} />}
                            >
                                Apply Changes
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                className="w-full text-dark-500 hover:text-white"
                                leftIcon={<RotateCcw size={16} />}
                            >
                                Reset to Default
                            </Button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
