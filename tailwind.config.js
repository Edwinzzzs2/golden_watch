const { heroui } = require("@heroui/react");
const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    path.join(process.cwd(), "node_modules", "@heroui", "theme", "dist", "**", "*.{js,ts,jsx,tsx}"),
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};
