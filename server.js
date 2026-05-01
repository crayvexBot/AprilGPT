import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("."));

app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  try {
    const r = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: msg })
      }
    );

    const data = await r.json();

    let reply =
      data?.[0]?.generated_text ||
      "I am thinking... but I am unsure.";

    res.json({ reply });

  } catch {
    res.json({ reply: "AI ERROR: SYSTEM NOT RESPONDING" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("April GPT running"));
