import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/analyze-ticket": {
        target: "https://france-distribution-one.vercel.app",
        changeOrigin: true,
      },
      "/api/ticket-pdf": {
        target: "https://france-distribution-one.vercel.app",
        changeOrigin: true,
      },
      "/api/upcitemdb": {
        target: "https://api.upcitemdb.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/upcitemdb/, "/prod/trial/lookup"),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router", "react-router-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          pdf: ["jspdf", "jspdf-autotable", "html2canvas"],
        },
      },
    },
  },
});
