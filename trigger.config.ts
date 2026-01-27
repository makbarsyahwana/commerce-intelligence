import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  runtime: "bun",
  project: "proj_nreaauimxjncrihqrlcu",
  dirs: ["./src/jobs"],
  maxDuration: 3600, // 1 hour
});
