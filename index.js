// ./index.js
import express from "express";
import { main } from "./utils/main.js";

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  const folder_location = req.query.folder_location || "C:/";
  const description = req.query.description || "Build a todo app";

  const prompt = `Inside the ${folder_location} build a website on the following description.\n${description}`;

  const build = [{ role: "user", parts: [{ text: prompt }] }];

  try {
    const result = await main(build);
    res.json({ success: true, result });
  } catch (error) {
    console.error("❌ API Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(3000, () => console.log("🚀 API running"));
