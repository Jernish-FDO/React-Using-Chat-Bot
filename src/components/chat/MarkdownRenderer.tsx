// Markdown renderer component with full formatting support
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CodeBlock } from './CodeBlock';
import { ExternalLink } from 'lucide-react';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    const components: Components = {
        // Custom code block rendering
        code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            // Check if this is a code block (has language or multiple lines)
            const isCodeBlock = language || codeContent.includes('\n');

            if (isCodeBlock) {
                return (
                    <CodeBlock
                        language={language || 'text'}
                        code={codeContent}
                    />
                );
            }

            return (
                <code
                    className="px-1.5 py-0.5 bg-dark-700 text-accent-primary rounded text-sm font-mono"
                    {...props}
                >
                    {children}
                </code>
            );
        },

        // Table with horizontal scroll
        table({ children }) {
            return (
                <div className="overflow-x-auto my-4 rounded-lg border border-dark-700">
                    <table className="min-w-full divide-y divide-dark-700">
                        {children}
                    </table>
                </div>
            );
        },

        thead({ children }) {
            return <thead className="bg-dark-800">{children}</thead>;
        },

        th({ children }) {
            return (
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-200 uppercase tracking-wider">
                    {children}
                </th>
            );
        },

        td({ children }) {
            return (
                <td className="px-4 py-3 text-sm text-dark-300 border-t border-dark-700">
                    {children}
                </td>
            );
        },

        // Links with external icon
        a({ href, children }) {
            const isExternal = href?.startsWith('http');
            return (
                <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                    {children}
                    {isExternal && <ExternalLink size={12} className="inline-block" />}
                </a>
            );
        },

        // Blockquotes
        blockquote({ children }) {
            return (
                <blockquote className="border-l-4 border-accent-primary/50 pl-4 my-4 italic text-dark-300 bg-dark-800/50 py-2 pr-4 rounded-r-lg">
                    {children}
                </blockquote>
            );
        },

        // Lists
        ul({ children }) {
            return (
                <ul className="list-disc list-inside my-3 space-y-1 text-dark-200">
                    {children}
                </ul>
            );
        },

        ol({ children }) {
            return (
                <ol className="list-decimal list-inside my-3 space-y-1 text-dark-200">
                    {children}
                </ol>
            );
        },

        li({ children }) {
            return <li className="text-dark-200 leading-relaxed">{children}</li>;
        },

        // Headings
        h1({ children }) {
            return (
                <h1 className="text-2xl font-bold text-dark-100 mt-6 mb-3 first:mt-0 pb-2 border-b border-dark-700">
                    {children}
                </h1>
            );
        },

        h2({ children }) {
            return (
                <h2 className="text-xl font-semibold text-dark-100 mt-5 mb-2 first:mt-0">
                    {children}
                </h2>
            );
        },

        h3({ children }) {
            return (
                <h3 className="text-lg font-semibold text-dark-100 mt-4 mb-2 first:mt-0">
                    {children}
                </h3>
            );
        },

        h4({ children }) {
            return (
                <h4 className="text-base font-semibold text-dark-200 mt-3 mb-1 first:mt-0">
                    {children}
                </h4>
            );
        },

        // Paragraphs
        p({ children }) {
            return <p className="text-dark-200 leading-relaxed my-3">{children}</p>;
        },

        // Horizontal rule
        hr() {
            return <hr className="my-6 border-dark-700" />;
        },

        // Images
        img({ src, alt }) {
            return (
                <img
                    src={src}
                    alt={alt || ''}
                    className="max-w-full h-auto rounded-lg my-4 border border-dark-700"
                    loading="lazy"
                />
            );
        },

        // Strong/Bold
        strong({ children }) {
            return <strong className="font-semibold text-dark-100">{children}</strong>;
        },

        // Emphasis/Italic
        em({ children }) {
            return <em className="italic text-dark-200">{children}</em>;
        },
    };

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownRenderer;
