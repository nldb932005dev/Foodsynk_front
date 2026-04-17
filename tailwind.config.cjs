/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
      },
      colors: {
        brand: {
          coral: "#E84C3D",
          green: "#2D6A4F",
          "green-light": "#A7D7C5",
          "green-dark": "#1B4332",
          orange: "#E8713A",
          navy: "#1B2A4A",
          cream: "#F8F6F3",
        },
      },
    },
  },
  plugins: [],
};
