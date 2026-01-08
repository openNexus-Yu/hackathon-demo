/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#fafcfc",
                surface: "#ffffff",
                "surface-hover": "#f0fdf4",
                primary: {
                    DEFAULT: "#059669",
                    dark: "#047857",
                    light: "#10b981",
                },
                accent: {
                    DEFAULT: "#06d6a0",
                    light: "#6ee7b7",
                },
                secondary: "#64748b",
                muted: "#94a3b8",
                border: "#e2e8f0",
                "border-hover": "#10b981",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(5, 150, 105, 0.2)' },
                    '100%': { boxShadow: '0 0 40px rgba(5, 150, 105, 0.4)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'emerald-glow': 'radial-gradient(ellipse at center, rgba(5, 150, 105, 0.08) 0%, transparent 70%)',
            }
        },
    },
    plugins: [],
}
