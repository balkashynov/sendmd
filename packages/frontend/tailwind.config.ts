import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "var(--parchment)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        rule: "var(--rule)",
        "code-bg": "var(--code-bg)",
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
