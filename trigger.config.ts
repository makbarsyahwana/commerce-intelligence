import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "megpie-analytics-sync",
  dirs: ["./src"],
  maxDuration: 3600, // 1 hour
});
