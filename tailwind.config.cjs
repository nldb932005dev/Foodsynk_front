/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
