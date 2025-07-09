#!/usr/bin/env node

import { main } from "./utils/main.js";

// 📝 Parse CLI arguments
const args = process.argv.slice(2);
let folder_location = "./site";
let description = "Build a todo app";

// Support usage like:
// npx my-ai-builder --folder ./site --description "Build a SaaS landing"
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--folder" && args[i + 1]) {
    folder_location = args[i + 1];
  }
  if (args[i] === "--description" && args[i + 1]) {
    description = args[i + 1];
  }
}

const prompt = `Inside the ${folder_location} build a website on the following description.\n${description}`;
const build = [{ role: "user", parts: [{ text: prompt }] }];

(async () => {
  try {
    const result = await main(build);
    console.log("✅ Build result:", result);
  } catch (error) {
    console.error("❌ CLI Error:", error.message);
    process.exit(1);
  }
})();

// git commit -m "cli-alpha"