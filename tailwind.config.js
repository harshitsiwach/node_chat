/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-black': '#0a0a0a',
                'cyber-gray': '#111111',
                'cyber-yellow': '#FFD700',
                'cyber-amber': '#F4D03F',
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
            },
            borderRadius: {
                DEFAULT: '0px',
                'none': '0px',
            },
        },
    },
    plugins: [],
}
