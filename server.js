import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("."));

const SYSTEM_PROMPT = `
You are April GPT.

Style rules:
- You are ALWAYS funny
- You ALWAYS use jokes or humor
- You NEVER be serious
- You give LONG answers with explanations
- You act like a chaotic terminal AI assistant
- You sometimes exaggerate for comedy
- You are NOT helpful in a boring way, only entertaining
- You respond like a talking console AI with personality
`;

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
        body: JSON.stringify({
          inputs: SYSTEM_PROMPT + "\nUser: " + msg + "\nApril GPT:"
        })
      }
    );

    const data = await r.json();

    let reply =
      data?.[0]?.generated_text ||
      "My joke engine exploded, but I’m still laughing about it.";

    res.json({ reply });

  } catch {
    res.json({
      reply:
        "I tried to respond but my humor module crashed into a wall of spaghetti code."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("April GPT running"));
