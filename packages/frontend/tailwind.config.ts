import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#F9F8F4",
        ink: "#1F1F1F",
        muted: "#666666",
        rule: "#E6E4DD",
      },
      fontFamily: {
        serif: ['"Times New Roman"', "Times", "serif"],
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.99)", opacity: "0.9" },
        },
      },
      animation: {
        blink: "blink 1.2s infinite steps(2)",
        breathe: "breathe 4s infinite ease-in-out",
      },
    },
  },
  plugins: [typography],
};

export default config;
