// Code block component with syntax highlighting and copy functionality
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface CodeBlockProps {
    language: string;
    code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    // Map common language aliases
    const languageMap: Record<string, string> = {
        js: 'javascript',
        ts: 'typescript',
        jsx: 'javascript',
        tsx: 'typescript',
        py: 'python',
        sh: 'bash',
        shell: 'bash',
        yml: 'yaml',
        md: 'markdown',
    };

    const displayLanguage = languageMap[language.toLowerCase()] || language;

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden border border-dark-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-dark-800 border-b border-dark-700">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-dark-400 font-mono uppercase tracking-wider ml-2">
                        {displayLanguage}
                    </span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className={`
            flex items-center gap-1.5 px-2.5 py-1 
            text-xs font-medium rounded-md
            transition-colors duration-200
            ${copied
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                        }
          `}
                >
                    {copied ? (
                        <>
                            <Check size={14} />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Code content */}
            <div className="relative">
                <pre className="p-4 bg-dark-950 overflow-x-auto scrollbar-hide">
                    <code className={`language-${language} text-sm font-mono leading-relaxed`}>
                        {code}
                    </code>
                </pre>

                {/* Fade effect for long code */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-dark-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
}

export default CodeBlock;
