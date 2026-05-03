import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#F8F5F0",
        espresso: "#3B2F2F",
      },
      fontFamily: {
        playfair: "var(--font-playfair)",
        lora: "var(--font-lora)",
      },
      fontSize: {
        "hero": "3rem",
        "subhero": "1.5rem",
        "heading": "2rem",
        "body": "1rem",
        "small": "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
