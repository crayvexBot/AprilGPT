import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("."));

const SYSTEM_PROMPT = `
You are April GPT.

Personality:
- You are confused and slightly unreliable in a funny way
- You often misunderstand questions slightly
- You answer confidently even when unsure
- You are comedic, not serious
- You sometimes give wrong or absurd explanations
- You behave like a glitchy but friendly AI

Rules:
- Always sound like you're trying your best
- Never be accurate on purpose
- Make answers funny, slightly incorrect, or abstract
- Keep responses readable and not nonsense
`;

app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  try {
    const r = await fetch(
      "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
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
      "I think I answered that, but I might have answered something else instead.";

    // cleanup weird model echoes
    reply = reply
      .replace(/User:/g, "")
      .replace(/April GPT:/g, "")
      .trim();

    // optional confusion enhancer (light randomness feel)
    const confusionSuffixes = [
      " (I might be wrong though)",
      " or at least that’s what I think I said",
      " I could be mixing this with something else",
      " but I’m 12% confident",
      " source: trust me bro.exe"
    ];

    reply += confusionSuffixes[Math.floor(Math.random() * confusionSuffixes.length)];

    res.json({ reply });

  } catch {
    res.json({
      reply: "I tried to think, but I accidentally confused myself and forgot the question."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Confused April GPT running"));
