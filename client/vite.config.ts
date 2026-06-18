import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project at /dactylology/. Use BASE_URL so the
// built HTML and our runtime fetches (/model, /mediapipe) resolve under the
// project path in production while staying at "/" during local dev.
const base = process.env.GITHUB_ACTIONS ? '/dactylology/' : '/'

export default defineConfig({
    base,
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: true,
    },
});
