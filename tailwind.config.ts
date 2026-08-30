import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#0b1117",
          muted: "#0d141c",
          card: "#121a24",
          hover: "#182230",
        },
        ink: {
          DEFAULT: "#e6edf3",
          muted: "#8b949e",
          faint: "#6e7681",
        },
        line: "#2a3644",
        brand: {
          DEFAULT: "#3fb950",
          dim: "#238636",
          deep: "#0e4429",
          glow: "rgba(63, 185, 80, 0.18)",
        },
      },
      boxShadow: {
        card: "0 12px 40px rgba(0, 0, 0, 0.28)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
