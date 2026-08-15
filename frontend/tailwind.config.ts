import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E14",
        surface: "#12161F",
        "surface-raised": "#171C27",
        border: {
          DEFAULT: "#232B38",
          soft: "#1B222D",
        },
        ink: {
          DEFAULT: "#E8ECF1",
          muted: "#8B95A5",
          faint: "#5B6472",
        },
        accent: {
          DEFAULT: "#5B8DEF",
          soft: "rgba(91,141,239,0.14)",
          dim: "#3E5FA3",
        },
        status: {
          green: "#34D399",
          "green-soft": "rgba(52,211,153,0.14)",
          amber: "#FBBF24",
          "amber-soft": "rgba(251,191,36,0.14)",
          red: "#F87171",
          "red-soft": "rgba(248,113,113,0.14)",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jbmono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.02), 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
