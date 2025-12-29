// Tool definitions for Gemini function calling
import { searchWeb } from '@/lib/tavily/client';
import type { FunctionDeclaration } from '@/types/tools';

// Function declarations for Gemini
export const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
    {
        name: 'web_search',
        description: 'Search the web for current, real-time information on any topic. Use this when you need up-to-date information, news, facts that may have changed since your training, or when the user asks about current events.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to look up. Be specific and include relevant keywords.',
                },
                search_depth: {
                    type: 'string',
                    description: 'How thorough the search should be. Use "basic" for quick factual lookups, "advanced" for comprehensive research.',
                    enum: ['basic', 'advanced'],
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_current_time',
        description: 'Get the current date and time. Use this when the user asks about the current time, date, or when you need to know the current date for context.',
        parameters: {
            type: 'object',
            properties: {
                timezone: {
                    type: 'string',
                    description: 'IANA timezone name (e.g., "America/New_York", "Europe/London", "Asia/Tokyo"). If not specified, uses the user\'s local timezone.',
                },
            },
            required: [],
        },
    },
    {
        name: 'calculate',
        description: 'Perform mathematical calculations. Use this for any arithmetic, including complex expressions with parentheses and order of operations.',
        parameters: {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: 'The mathematical expression to evaluate (e.g., "2 + 2 * 3", "sqrt(16) + 10", "(100 - 20) / 4").',
                },
            },
            required: ['expression'],
        },
    },
];

// Tool execution handlers
export async function executeToolCall(
    name: string,
    args: Record<string, unknown>
): Promise<unknown> {
    switch (name) {
        case 'web_search':
            return executeWebSearch(args);
        case 'get_current_time':
            return executeGetCurrentTime(args);
        case 'calculate':
            return executeCalculate(args);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

async function executeWebSearch(args: Record<string, unknown>): Promise<unknown> {
    const query = args.query as string;
    const searchDepth = (args.search_depth as 'basic' | 'advanced') || 'basic';

    try {
        const results = await searchWeb(query, { searchDepth, maxResults: 5 });
        return {
            success: true,
            query: results.query,
            answer: results.answer,
            results: results.results.map(r => ({
                title: r.title,
                url: r.url,
                content: r.content.slice(0, 500),
                score: r.score,
            })),
            response_time: results.response_time,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Search failed',
        };
    }
}

function executeGetCurrentTime(args: Record<string, unknown>): unknown {
    const timezone = (args.timezone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });

        return {
            success: true,
            datetime: formatter.format(now),
            timezone,
            timestamp: now.getTime(),
            iso: now.toISOString(),
        };
    } catch (error) {
        return {
            success: false,
            error: `Invalid timezone: ${timezone}`,
        };
    }
}

function executeCalculate(args: Record<string, unknown>): unknown {
    const expression = args.expression as string;

    // Sanitize: only allow safe mathematical characters
    const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/gi, '');

    // Replace some common math functions
    const processed = sanitized
        .replace(/\^/g, '**') // Power operator
        .replace(/sqrt\s*\(/gi, 'Math.sqrt(')
        .replace(/abs\s*\(/gi, 'Math.abs(')
        .replace(/sin\s*\(/gi, 'Math.sin(')
        .replace(/cos\s*\(/gi, 'Math.cos(')
        .replace(/tan\s*\(/gi, 'Math.tan(')
        .replace(/log\s*\(/gi, 'Math.log10(')
        .replace(/ln\s*\(/gi, 'Math.log(')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![a-z])/gi, 'Math.E');

    try {
        // Use Function constructor for safe evaluation
        const result = Function(`"use strict"; return (${processed})`)();

        if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error('Invalid result');
        }

        return {
            success: true,
            expression: expression,
            result: result,
            formatted: Number.isInteger(result) ? result.toString() : result.toFixed(10).replace(/\.?0+$/, ''),
        };
    } catch (error) {
        return {
            success: false,
            expression: expression,
            error: 'Invalid mathematical expression',
        };
    }
}

/**
 * Get function declarations for enabled tools only
 */
export function getEnabledFunctionDeclarations(enabledToolIds: string[]): FunctionDeclaration[] {
    const toolIdToFunctionName: Record<string, string> = {
        'web_search': 'web_search',
        'get_current_time': 'get_current_time',
        'calculator': 'calculate',
    };

    const enabledFunctions = enabledToolIds
        .map(id => toolIdToFunctionName[id])
        .filter(Boolean);

    return FUNCTION_DECLARATIONS.filter(fd => enabledFunctions.includes(fd.name));
}
