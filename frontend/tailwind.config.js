/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                glass: {
                    100: 'rgba(255, 255, 255, 0.1)',
                    200: 'rgba(255, 255, 255, 0.2)',
                    300: 'rgba(255, 255, 255, 0.3)',
                    dark: 'rgba(0, 0, 0, 0.6)',
                },
                accent: {
                    primary: '#8b5cf6', // Violet
                    secondary: '#ec4899', // Pink
                    glow: '#6366f1', // Indigo
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                brand: ['"Space Grotesk"', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a41ff33 0deg, #c41eff33 55deg, #ff1e1e33 120deg, #1e90ff33 160deg, transparent 360deg)',
            }
        },
    },
    plugins: [],
}
