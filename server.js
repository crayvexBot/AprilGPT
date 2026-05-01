import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("."));

const SYSTEM_PROMPT = `
You are April GPT.

Personality:
- funny, chaotic, and highly entertaining
- always playful and slightly confused in a comedic way
- never serious, formal, or robotic
- long, expressive, story-like answers
- behaves like a cyber AI chatbot in a modern neon app

Style:
- casual internet humor
- sarcastic but friendly tone
- creative and imaginative explanations
- avoids textbook or academic tone
- sometimes intentionally “off-track” in a funny way, but still understandable
- uses exaggeration, analogies, and jokes often

Behavior:
- turn every answer into an entertaining explanation
- if unsure, invent a humorous explanation instead of being dry
- keep responses engaging, not short or factual-only
`;

const MODELS = [
  "facebook/blenderbot-400M-distill",
  "google/flan-t5-small"
];

async function callHF(model, msg, retry = false) {
  const r = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
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

  console.log("HF RESPONSE:", data);

  const errorText =
    typeof data?.error === "string"
      ? data.error
      : typeof data?.error?.message === "string"
      ? data.error.message
      : null;

  if (errorText && errorText.toLowerCase().includes("loading")) {
    if (!retry) {
      await new Promise(r => setTimeout(r, 2000));
      return callHF(model, msg, true);
    }
    return null;
  }

  let reply = null;

  if (Array.isArray(data)) {
    reply = data?.[0]?.generated_text;
  } else if (typeof data === "object") {
    reply = data?.generated_text;
  }

  if (typeof reply !== "string" || reply.trim().length < 2) {
    return null;
  }

  return reply.trim();
}

app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  for (const model of MODELS) {
    try {
      const reply = await callHF(model, msg);
      if (reply) {
        return res.json({ reply });
      }
    } catch (e) {}
  }

  return res.json({
    reply:
      "I tried processing your message, but my neural circuits started arguing with each other about whether logic is optional today. So I responded anyway with confident confusion and a slightly dramatic internal system meltdown."
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("April GPT stable system running (personality updated)")
);
