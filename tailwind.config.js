/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Custom dark theme palette
                dark: {
                    50: '#f7f7f8',
                    100: '#ececf1',
                    200: '#d9d9e3',
                    300: '#c5c5d2',
                    400: '#acacbe',
                    500: '#8e8ea0',
                    600: '#565869',
                    700: '#40414f',
                    800: '#343541',
                    900: '#202123',
                    950: '#0d0d0f',
                },
                accent: {
                    primary: '#10a37f',
                    secondary: '#1a7f64',
                    hover: '#0d8a6a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
                'thinking': 'thinking 1.5s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                thinking: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '1' },
                },
            },
            typography: {
                DEFAULT: {
                    css: {
                        maxWidth: 'none',
                        color: '#d1d5db',
                        a: {
                            color: '#60a5fa',
                            '&:hover': {
                                color: '#93c5fd',
                            },
                        },
                        code: {
                            color: '#e5e7eb',
                            backgroundColor: '#374151',
                            borderRadius: '0.25rem',
                            padding: '0.125rem 0.25rem',
                        },
                        'code::before': {
                            content: '""',
                        },
                        'code::after': {
                            content: '""',
                        },
                        pre: {
                            backgroundColor: '#1f2937',
                            color: '#e5e7eb',
                        },
                    },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
