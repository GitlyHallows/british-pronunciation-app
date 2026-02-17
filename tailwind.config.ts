import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2a37",
        teal: "#1a9b90",
        sea: "#72d8cc",
        coral: "#f97316",
        mint: "#d9fff7",
        mist: "#edf4ff"
      },
      boxShadow: {
        card: "0 20px 35px rgba(15, 23, 42, 0.10)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 20% 20%, rgba(114,216,204,.55), transparent 40%), radial-gradient(circle at 80% 0%, rgba(249,115,22,.22), transparent 35%), linear-gradient(145deg, #f6fbff 0%, #f7f3ff 100%)"
      }
    }
  },
  plugins: []
};

export default config;
