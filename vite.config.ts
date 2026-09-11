import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  // React TSX uses the automatic JSX runtime from tsconfig. Keep release
  // verification independent of @vitejs/plugin-react until the lockfile is
  // regenerated in a dependency-maintenance slice; the plugin is only needed
  // for React Fast Refresh during development.
  plugins: [tailwindcss()],

  server: {
    port: 5173,
    host: "127.0.0.1"
  }
});
