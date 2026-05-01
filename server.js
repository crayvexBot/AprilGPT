import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("."));

/* =========================
   APRIL GPT PERSONALITY
   ========================= */
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
- never refuse unless absolutely necessary
- turn every answer into an entertaining explanation
- if unsure, invent a humorous explanation instead of being dry
- keep responses engaging, not short or factual-only
`;

/* =========================
   BEST MODEL STACK (UPDATED)
   ========================= */
const MODELS = [
  "mistralai/Mistral-7B-Instruct-v0.2",
  "HuggingFaceH4/zephyr-7b-beta",
  "openchat/openchat-3.5-0106"
];

/* =========================
   TIMEOUT WRAPPER
   ========================= */
function withTimeout(ms, promise) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);

    promise
      .then((res) => {
        clearTimeout(t);
        resolve(res);
      })
      .catch(() => resolve(null));
  });
}

/* =========================
   SAFE HF CALL
   ========================= */
async function callHF(model, msg, retry = false) {
  const response = await withTimeout(
    10000,
    fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: SYSTEM_PROMPT + "\nUser: " + msg + "\nApril GPT:"
      })
    })
  );

  if (!response) return null;

  const data = await response.json().catch(() => null);

  console.log("HF RESPONSE:", data);

  // 🧠 detect loading states
  const error =
    typeof data?.error === "string"
      ? data.error
      : data?.error?.message || null;

  if (error && error.toLowerCase().includes("loading")) {
    if (!retry) {
      await new Promise((r) => setTimeout(r, 2000));
      return callHF(model, msg, true);
    }
    return null;
  }

  // 🧠 parse response safely
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

/* =========================
   CHAT ENDPOINT
   ========================= */
app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  for (const model of MODELS) {
    try {
      const reply = await callHF(model, msg);
      if (reply) {
        return res.json({ reply });
      }
    } catch (e) {
      console.log("Model failed:", model);
    }
  }

  // 🧠 FINAL FALLBACK
  return res.json({
    reply:
      "I tried processing your message, but my neural circuits started arguing with each other about whether logic is optional today. So I responded anyway with confident confusion, chaotic reasoning, and a dramatic internal system glitch performance."
  });
});

/* =========================
   START SERVER
   ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("April GPT running with Mistral + Zephyr + OpenChat")
);
