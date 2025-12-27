import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                whatsapp: {
                    dark: '#0b141a',
                    darker: '#060b0e',
                    green: '#00a884',
                    'green-light': '#25d366',
                    'green-dark': '#075e54',
                    text: '#e9edef',
                    'text-secondary': '#8696a0',
                    'call-bg': '#0a1014',
                },
            },
            animation: {
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'ripple': 'ripple 1.5s ease-out infinite',
                'ripple-delay': 'ripple 1.5s ease-out 0.5s infinite',
                'ripple-delay-2': 'ripple 1.5s ease-out 1s infinite',
            },
            keyframes: {
                ripple: {
                    '0%': { transform: 'scale(1)', opacity: '0.4' },
                    '100%': { transform: 'scale(2.5)', opacity: '0' },
                },
            },
            dropShadow: {
                'glow': '0 0 10px rgba(34, 211, 238, 0.5)',
            },
        },
    },
    plugins: [],
}

export default config
