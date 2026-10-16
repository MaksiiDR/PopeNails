import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Noche estrellada del logo + papel marfil
        pn: {
          ink: "#100e13",      // banda superior, botones principales
          night: "#1c1822",    // superficies oscuras secundarias
          ivory: "#f5f0e7",    // fondo de la app
          paper: "#fffdf9",    // tarjetas
          line: "#e7dfd1",     // bordes y separadores
          muted: "#857b70",    // texto secundario
          text: "#1d1a20",     // texto principal
          gold: "#a8844b",     // acento sobre claro
          goldsoft: "#d8b878", // acento sobre oscuro
          plum: "#6b3157",     // semipermanente
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        label: ["var(--font-label)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
