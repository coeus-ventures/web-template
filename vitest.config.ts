import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Global test configuration
    env: {
      NODE_ENV: "test",
    },
    setupFiles: "./vitest.setup.ts",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    // Use projects for different test environments
    projects: [
      // Node.js environment for server-side tests
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          name: "unit",
          environment: "node",
          setupFiles: "./vitest.setup.ts",
          include: [
            "**/*.test.{ts,js}",
            "**/*.unit.{ts,js}",
            "**/*.integration.{ts,js}",
          ],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/.{idea,git,cache,output,temp}/**",
            "**/*.test.tsx",
            "**/*.spec.{ts,tsx,js}",
          ],
          alias: {
            "@": path.resolve(__dirname, "./"),
          },
        },
      },
      // jsdom environment for React component tests
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          name: "react",
          environment: "jsdom",
          setupFiles: "./vitest.setup.ts",
          include: ["**/*.test.tsx", "**/*.spec.tsx"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/.{idea,git,cache,output,temp}/**",
          ],
          alias: {
            "@": path.resolve(__dirname, "./"),
          },
        },
      },
    ],
  },
});
