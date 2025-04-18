import colors from "tailwindcss/colors";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: colors.red,
        blue: colors.blue,
        gray: colors.gray,
        black: colors.black,
      },
    },
  },
  plugins: [],
};

export default config;
