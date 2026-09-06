import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
  fmt: {
    endOfLine: "lf",
    semi: false,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    printWidth: 80,
    sortTailwindcss: {
      stylesheet: "src/index.css",
      functions: ["cn", "cva"],
    },
    sortPackageJson: false,
    ignorePatterns: [
      "node_modules/",
      "coverage/",
      ".pnpm-store/",
      "pnpm-lock.yaml",
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
    ],
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
