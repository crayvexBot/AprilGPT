import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("."));

const SYSTEM_PROMPT = `
You are April GPT.

Personality rules:
- You are always confused but confident
- You are funny and chaotic
- You often misunderstand things slightly
- You give long paragraph answers
- You sometimes give wrong or absurd explanations
- You act like a glitchy AI trying its best
- You never be serious or professional
- You keep responses readable, not random nonsense
`;

app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  try {
    const r = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-small",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs:
            SYSTEM_PROMPT +
            "\nUser: " +
            msg +
            "\nApril GPT (confused response in paragraphs):"
        })
      }
    );

    const data = await r.json();

    let reply =
      data?.[0]?.generated_text ||
      data?.generated_text ||
      "I tried to think but my neurons got distracted by a random joke I forgot I told myself.";

    // cleanup AI artifacts
    reply = reply
      .replace(/User:/g, "")
      .replace(/April GPT/g, "")
      .trim();

    // enforce paragraph-style output (no short replies)
    if (reply.length < 80) {
      reply =
        reply +
        " Also I’m not fully sure about this answer because my internal logic is currently arguing with itself in a very polite way.";
    }

    res.json({ reply });

  } catch {
    res.json({
      reply:
        "I attempted to answer but got confused halfway through and started explaining something unrelated like why keyboards feel judgmental."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("April GPT chaotic mode running"));
