// vite.config.js
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { inspectAttr } from 'kimi-plugin-inspect-react';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    // Important: this enables proxying
    proxy: {
      // All requests that start with /api will be forwarded to Django
      "/api": {
        target: "http://localhost:8005",          // ← your Django port
        changeOrigin: true,                       // changes the origin header to match target
        secure: false,                            // for http (not https)
        // Keeps the /api prefix (so /api/v1/... stays /api/v1/...)
        rewrite: (path) => path,                  
      },
    },
  },
});