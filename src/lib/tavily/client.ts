// Tavily API client for web search
const TAVILY_API_URL = 'https://api.tavily.com/search';

export interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
}

export interface TavilyResponse {
    query: string;
    results: TavilySearchResult[];
    answer?: string;
    response_time: number;
    follow_up_questions?: string[];
}

export interface TavilySearchOptions {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeAnswer?: boolean;
    includeRawContent?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
}

/**
 * Search the web using Tavily API
 */
export async function searchWeb(
    query: string,
    options: TavilySearchOptions = {}
): Promise<TavilyResponse> {
    const apiKey = import.meta.env.VITE_TAVILY_API_KEY;

    if (!apiKey) {
        throw new Error('Tavily API key not configured. Please add VITE_TAVILY_API_KEY to your .env.local file.');
    }

    const {
        searchDepth = 'basic',
        maxResults = 5,
        includeAnswer = true,
        includeRawContent = false,
        includeDomains = [],
        excludeDomains = [],
    } = options;

    const response = await fetch(TAVILY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            api_key: apiKey,
            query,
            search_depth: searchDepth,
            max_results: maxResults,
            include_answer: includeAnswer,
            include_raw_content: includeRawContent,
            include_domains: includeDomains.length > 0 ? includeDomains : undefined,
            exclude_domains: excludeDomains.length > 0 ? excludeDomains : undefined,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
            throw new Error('Invalid Tavily API key. Please check your VITE_TAVILY_API_KEY.');
        }

        if (response.status === 429) {
            throw new Error('Tavily rate limit exceeded. Please wait before making more searches.');
        }

        throw new Error(`Tavily search failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data as TavilyResponse;
}

/**
 * Format search results for display in chat
 */
export function formatSearchResults(response: TavilyResponse): string {
    let formatted = '';

    if (response.answer) {
        formatted += `**Summary:** ${response.answer}\n\n`;
    }

    formatted += `**Sources (${response.results.length}):**\n\n`;

    response.results.forEach((result, index) => {
        formatted += `${index + 1}. [${result.title}](${result.url})\n`;
        formatted += `   ${result.content.slice(0, 200)}${result.content.length > 200 ? '...' : ''}\n\n`;
    });

    return formatted;
}

/**
 * Check if Tavily API is configured
 */
export function isTavilyConfigured(): boolean {
    return !!import.meta.env.VITE_TAVILY_API_KEY;
}
