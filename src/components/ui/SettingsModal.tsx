import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Save, Settings2, Key, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useApiKeyStore, type APIKeys } from '@/stores/apiKeyStore';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
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
        onClose();
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-dark-700 bg-dark-800/50">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-accent-primary/10">
                                        <Settings2 size={20} className="text-accent-primary" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Settings</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex p-1 bg-dark-800 rounded-xl border border-dark-700">
                                <button
                                    onClick={() => setActiveTab('model')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'model' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
                                >
                                    <Settings2 size={16} />
                                    Model
                                </button>
                                <button
                                    onClick={() => setActiveTab('keys')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'keys' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
                                >
                                    <Key size={16} />
                                    API Keys
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                            {activeTab === 'model' ? (
                                <div className="space-y-6">
                                    {/* System Prompt */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-dark-100 block ml-1">
                                            System Instruction
                                        </label>
                                        <textarea
                                            value={localPrompt}
                                            onChange={(e) => setLocalPrompt(e.target.value)}
                                            placeholder="You are a helpful AI assistant..."
                                            className="w-full h-32 px-4 py-3 bg-dark-800 border border-dark-700 rounded-2xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all resize-none shadow-inner"
                                        />
                                        <p className="text-xs text-dark-500 ml-1">
                                            Custom instructions for the AI's behavior.
                                        </p>
                                    </div>

                                    {/* Sliders */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-dark-100 ml-1">Temperature</label>
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
                                            <div className="flex justify-between text-[10px] text-dark-500 uppercase font-medium tracking-wider">
                                                <span>Precise</span>
                                                <span>Balanced</span>
                                                <span>Creative</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-dark-100 ml-1">Top-P</label>
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
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4">
                                        <p className="text-xs text-blue-300">
                                            API keys are stored securely in your private Firestore document and are only used for your own requests.
                                        </p>
                                    </div>

                                    {[
                                        { id: 'gemini', label: 'Gemini API Key', placeholder: 'AI7zaSy...' },
                                        { id: 'tavily', label: 'Tavily API Key', placeholder: 'tvly-...' },
                                        { id: 'weather', label: 'Weather (OpenWeather) Key', placeholder: 'API key...' },
                                        { id: 'groq', label: 'Groq API Key', placeholder: 'gsk_...' },
                                    ].map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label className="text-sm font-semibold text-dark-100 ml-1">{field.label}</label>
                                            <div className="relative group">
                                                <input
                                                    type={showKeys[field.id] ? 'text' : 'password'}
                                                    value={localKeys[field.id as keyof typeof localKeys] || ''}
                                                    onChange={(e) => setLocalKeys(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-sm text-dark-100 placeholder-dark-600 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-inner outline-none pr-10"
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
                        <div className="px-6 py-4 border-t border-dark-700 bg-dark-800/30 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                leftIcon={<RotateCcw size={16} />}
                                className="text-dark-400 hover:text-white"
                            >
                                Reset {activeTab === 'model' ? 'Settings' : 'Fields'}
                            </Button>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onClose}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    leftIcon={<Save size={16} />}
                                    className="rounded-xl shadow-lg shadow-accent-primary/20"
                                >
                                    Save Config
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
