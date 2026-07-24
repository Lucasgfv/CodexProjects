import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8F5",
        ink: "#17201B",
        moss: "#345C45",
        sage: "#7E9B86",
        lavender: "#A89ACB",
        coral: "#E86D55",
      },
      boxShadow: {
        panel: "0 18px 60px rgba(23, 32, 27, 0.12)",
        subtle: "0 8px 24px rgba(23, 32, 27, 0.07)",
      },
      borderRadius: {
        panel: "18px",
      },
    },
  },
  plugins: [],
};

export default config;

