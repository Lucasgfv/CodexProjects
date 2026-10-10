import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        ink: "var(--color-text)",
        muted: "var(--color-text-muted)",
        line: "var(--color-border)",
        "line-strong": "var(--color-border-strong)",
        moss: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          subtle: "var(--color-primary-subtle)",
        },
        sage: {
          DEFAULT: "var(--color-secondary)",
          subtle: "var(--color-secondary-subtle)",
        },
        lavender: {
          DEFAULT: "var(--color-accent)",
          subtle: "var(--color-accent-subtle)",
        },
        coral: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        document: ["var(--font-document)"],
      },
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-xs)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-sm)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-base)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-lg)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-xl)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-2xl)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-3xl)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-4xl)" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },
      boxShadow: {
        subtle: "var(--shadow-sm)",
        panel: "var(--shadow-lg)",
        focus: "var(--shadow-focus)",
      },
      borderRadius: {
        panel: "var(--radius-panel)",
        control: "var(--radius-control)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
    },
  },
  plugins: [],
};

export default config;

