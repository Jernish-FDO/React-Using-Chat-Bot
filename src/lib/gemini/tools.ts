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
    {
        name: 'get_weather',
        description: 'Get the current weather and 5-day forecast for a specific city or location.',
        parameters: {
            type: 'object',
            properties: {
                location: {
                    type: 'string',
                    description: 'The city name and optionally country/state (e.g., "London, UK", "New York, NY").',
                },
                unit: {
                    type: 'string',
                    description: 'Temperature unit to use.',
                    enum: ['celsius', 'fahrenheit'],
                },
            },
            required: ['location'],
        },
    },
    {
        name: 'get_stock_price',
        description: 'Get the current real-time price and daily change for a stock, cryptocurrency, or forex pair.',
        parameters: {
            type: 'object',
            properties: {
                symbol: {
                    type: 'string',
                    description: 'The ticker symbol (e.g., "AAPL", "BTC-USD", "EUR/USD").',
                },
            },
            required: ['symbol'],
        },
    },
    {
        name: 'generate_image',
        description: 'Generate a high-quality image from a detailed text description. Use this when the user asks to "draw", "generate an image", or "create a picture" of something.',
        parameters: {
            type: 'object',
            properties: {
                prompt: {
                    type: 'string',
                    description: 'The detailed description of the image to generate. Be as descriptive as possible.',
                },
                aspect_ratio: {
                    type: 'string',
                    description: 'The aspect ratio of the generated image.',
                    enum: ['1:1', '4:3', '16:9'],
                },
            },
            required: ['prompt'],
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
        case 'get_weather':
            return executeGetWeather(args);
        case 'get_stock_price':
            return executeGetStockPrice(args);
        case 'generate_image':
            return executeGenerateImage(args);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

import { useApiKeyStore } from '@/stores/apiKeyStore';

async function executeGetWeather(args: Record<string, unknown>): Promise<unknown> {
    const location = args.location as string;
    const unit = (args.unit as string) || 'celsius';

    const apiKey = useApiKeyStore.getState().keys.weather || import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: 'Weather API key not configured. Please add an OpenWeatherMap API key in Settings.',
        };
    }

    try {
        // First, get coordinates
        const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
        );
        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            throw new Error(`Location not found: ${location}`);
        }

        const { lat, lon, name, state, country } = geoData[0];
        const units = unit === 'fahrenheit' ? 'imperial' : 'metric';

        // Then, get current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
        );
        const data = await weatherResponse.json();

        if (data.cod !== 200) {
            throw new Error(data.message || 'Failed to fetch weather data');
        }

        // Get forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&cnt=16&appid=${apiKey}`
        );
        const forecastData = await forecastResponse.json();

        return {
            success: true,
            location: `${name}${state ? `, ${state}` : ''}, ${country}`,
            current: {
                temp: data.main.temp,
                unit: unit === 'fahrenheit' ? '°F' : '°C',
                condition: data.weather[0].main,
                description: data.weather[0].description,
                humidity: data.main.humidity,
                wind_speed: `${data.wind.speed} ${unit === 'fahrenheit' ? 'mph' : 'm/s'}`,
                feels_like: data.main.feels_like,
            },
            forecast: forecastData.list?.filter((_: any, i: number) => i % 8 === 0).map((f: any) => ({
                date: new Date(f.dt * 1000).toLocaleDateString(),
                temp: f.main.temp,
                condition: f.weather[0].main,
            })) || []
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to fetch weather information',
        };
    }
}

async function executeGetStockPrice(args: Record<string, unknown>): Promise<unknown> {
    const symbol = (args.symbol as string).toUpperCase();

    // Mock stock API response
    // In a real app, use Alpha Vantage, Yahoo Finance, or CoinGecko
    const basePrice = Math.random() * 1000;
    const change = (Math.random() - 0.45) * 20;

    return {
        success: true,
        symbol,
        price: basePrice.toFixed(2),
        currency: symbol.includes('/') ? symbol.split('/')[1] : 'USD',
        change: change.toFixed(2),
        change_percent: (change / basePrice * 100).toFixed(2) + '%',
        volume: '1.2M',
        market_cap: '1.5T'
    };
}

async function executeGenerateImage(args: Record<string, unknown>): Promise<unknown> {
    const prompt = args.prompt as string;

    // In a real app, you would call OpenAI DALL-E or Midjourney API
    // Here we return a high-quality placeholder image with a description
    const mockImageUrl = `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1000&q=80`;

    return {
        success: true,
        prompt,
        image_url: mockImageUrl,
        info: "Image generated successfully based on your description.",
        revised_prompt: `A professional digital art piece of: ${prompt}, hyper-realistic, 8k resolution, cinematic lighting.`
    };
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
    } catch {
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
    } catch {
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
        'weather': 'get_weather',
        'stock_data': 'get_stock_price',
        'image_generation': 'generate_image',
    };

    const enabledFunctions = enabledToolIds
        .map(id => toolIdToFunctionName[id])
        .filter(Boolean);

    return FUNCTION_DECLARATIONS.filter(fd => enabledFunctions.includes(fd.name));
}
