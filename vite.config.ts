import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss()
  ],
  test: {
    environment: 'jsdom',
    exclude: ['tests/liveGoogleCloudParallel.test.ts', 'tests/e2e/**'],
  },
  server: {
    port: 5173,
    host: "127.0.0.1"
  }
});
