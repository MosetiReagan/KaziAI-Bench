/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kazi: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          primary: "#3B82F6",
          accent: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444"
        }
      }
    },
  },
  plugins: [],
}
