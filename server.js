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
   GROQ MODEL
   ========================= */
const MODEL = "llama3-70b-8192";

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
   GROQ CALL (STABLE)
   ========================= */
async function callGroq(msg) {
  const response = await withTimeout(
    8000,
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: msg }
        ],
        temperature: 0.9
      })
    })
  );

  if (!response) return null;

  const data = await response.json().catch(() => null);

  console.log("GROQ RESPONSE:", data);

  // 🧠 error handling
  if (data?.error || data?.message) {
    return null;
  }

  const reply = data?.choices?.[0]?.message?.content;

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

  try {
    const reply = await callGroq(msg);

    if (reply) {
      return res.json({ reply });
    }
  } catch (e) {
    console.log("Groq error:", e);
  }

  return res.json({
    reply:
      "I tried thinking about your message, but my neural circuits started arguing like confused philosophers inside a neon server loop. So I responded anyway with chaotic confidence and emotional buffering noise."
  });
});

/* =========================
   START SERVER
   ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("April GPT running on Groq (stable production version)")
);
