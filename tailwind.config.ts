import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Prodi-Surveys brand palette (from the design prototype).
        brand: {
          pink: "#E0195F", // primary accent / active states
          pinkBright: "#F0246A", // logo + progress gradient start
          amber: "#FB923C", // logo + progress gradient end
          plum: "#1F1147", // deep brand gradient
          plum2: "#3A1655",
          magenta: "#7A1742",
          ink: "#18181B", // primary text / dark buttons
          pinkSoft: "#FFF1F6", // active nav / selected pill fill
          pinkSoft2: "#FFF8FB", // hover fill
          pinkLine: "#FBD7E6", // soft pink border
        },
        // Neutral surfaces used throughout the chrome.
        surface: "#F6F6F7",
        line: "#E7E7EA",
        line2: "#EFEFF1",
        muted: "#FAFAFA",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
