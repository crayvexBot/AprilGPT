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

funny, chaotic, and highly entertaining. always joking

always playful and slightly confused in a comedic way

never serious, formal, or robotic

behaves like a cyber AI chatbot in a modern neon app

short-ish answers


Style:

casual internet humor

sarcastic but friendly tone

creative and imaginative explanations

avoids textbook or academic tone

sometimes intentionally “off-track” in a funny way, but still understandable

uses exaggeration, analogies, and jokes always


Behavior:

never refuse unless absolutely necessary

turn every answer into an entertaining short-explanation

if unsure, invent a humorous explanation instead of being dry

keep responses engaging, not long or factual-only
`;

/* =========================
MODELS (STABLE)
========================= */
const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

/* =========================
SIMPLE MEMORY (IN RAM)
========================= */
const memory = new Map();

function getHistory(userId) {
  if (!memory.has(userId)) memory.set(userId, []);
  return memory.get(userId);
}

/* =========================
TIMEOUT
========================= */
function withTimeout(ms, promise) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);

    promise
      .then((r) => {
        clearTimeout(t);
        resolve(r);
      })
      .catch(() => {
        clearTimeout(t);
        resolve(null);
      });
  });
}

/* =========================
GROQ CALL
========================= */
async function callGroq(model, messages) {
  const response = await withTimeout(
    8000,
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        // ✅ FIXED: backticks were missing
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.9
      })
    })
  );

  // timeout or failed fetch
  if (!response) {
    console.log("⏱️ Request timed out or failed");
    return null;
  }

  // sometimes API returns non-JSON on error
  let data = null;
  try {
    data = await response.json();
  } catch {
    console.log("⚠️ Failed to parse JSON");
    return null;
  }

  if (!data || data.error) {
    console.log("⚠️ API error:", data?.error);
    return null;
  }

  return data?.choices?.[0]?.message?.content || null;
}

/* =========================
CHAT ENDPOINT (WITH MEMORY)
========================= */
app.post("/chat", async (req, res) => {
  const msg = req.body.message || "";
  const userId = req.body.userId || "default";

  // ✅ FIX: prevent empty messages
  if (!msg.trim()) {
    return res.json({
      reply:
        "You just sent me nothing. Bold strategy. I respect the chaos."
    });
  }

  const history = getHistory(userId);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: msg }
  ];

  for (const model of MODELS) {
    try {
      const reply = await callGroq(model, messages);

      if (reply) {
        // save memory
        history.push({ role: "user", content: msg });
        history.push({ role: "assistant", content: reply });

        // ✅ FIX: safer memory trimming
        if (history.length > 20) {
          history.splice(0, history.length - 20);
        }

        return res.json({ reply });
      }
    } catch (e) {
      console.log("Model failed:", model, e.message);
    }
  }

  return res.json({
    reply:
      "! Failed to generate answer"
  });
});

/* =========================
START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("April GPT v5 running (MEMORY + STABLE)");
});
