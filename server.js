import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.static("."));

/* =========================
PERSONALITY
========================= */
const SYSTEM_PROMPT = `
You are April GPT.

Personality:

- funny, chaotic, highly entertaining
- playful and slightly confused
- never formal
- short-ish answers

Style:

- casual humor
- sarcastic but friendly
- creative explanations
- always joking

Behavior:

- keep answers short and fun
  `;

/* =========================
MODELS
========================= */
const MODELS = [
"llama-3.3-70b-versatile",
"llama-3.1-8b-instant"
];

/* =========================
DATABASE (IN MEMORY)
========================= */
const users = new Map();
// username -> { passwordHash, chats: { chatId: { title, messages: [] } } }

/* =========================
HASH
========================= */
function hash(pw) {
return crypto.createHash("sha256").update(pw).digest("hex");
}

/* =========================
PASSWORD CHECK
========================= */
function validPassword(pw) {
return pw.length >= 8 && /[A-Z]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

/* =========================
SIGNUP
========================= */
app.post("/signup", (req, res) => {
const { username, password } = req.body;

if (!username || !password)
return res.json({ error: "Missing fields" });

if (!validPassword(password))
return res.json({ error: "Weak password" });

if (users.has(username))
return res.json({ error: "User exists" });

users.set(username, {
passwordHash: hash(password),
chats: {}
});

res.json({ success: true });
});

/* =========================
LOGIN
========================= */
app.post("/login", (req, res) => {
const { username, password } = req.body;

const user = users.get(username);

if (!user || user.passwordHash !== hash(password)) {
return res.json({ error: "Invalid login" });
}

res.json({ success: true });
});

/* =========================
CREATE CHAT
========================= */
app.post("/create-chat", (req, res) => {
const { username } = req.body;
const user = users.get(username);

if (!user) return res.json({ error: "No user" });

const id = "chat_" + Date.now();

user.chats[id] = {
title: "New Chat",
messages: []
};

res.json({ chatId: id });
});

/* =========================
GET CHATS
========================= */
app.post("/get-chats", (req, res) => {
const { username } = req.body;
const user = users.get(username);

if (!user) return res.json({ error: "No user" });

res.json({ chats: user.chats });
});

/* =========================
GROQ CALL
========================= */
async function callGroq(model, messages) {
const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
method: "POST",
headers: {
Authorization: "Bearer ${process.env.GROQ_API_KEY}",
"Content-Type": "application/json"
},
body: JSON.stringify({
model,
messages,
temperature: 0.9
})
});

const data = await r.json().catch(() => null);
if (!data || data.error) return null;

return data?.choices?.[0]?.message?.content || null;
}

/* =========================
CHAT (PER USER + CHAT)
========================= */
app.post("/chat", async (req, res) => {
const { username, chatId, message } = req.body;

const user = users.get(username);
if (!user) return res.json({ error: "No user" });

const chat = user.chats[chatId];
if (!chat) return res.json({ error: "No chat" });

const messages = [
{ role: "system", content: SYSTEM_PROMPT },
...chat.messages,
{ role: "user", content: message }
];

for (const model of MODELS) {
try {
const reply = await callGroq(model, messages);

  if (reply) {
    // SAVE MEMORY
    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "assistant", content: reply });

    if (chat.messages.length > 20) {
      chat.messages.splice(0, 2);
    }

    // AUTO TITLE
    if (chat.title === "New Chat") {
      chat.title = message.split(" ").slice(0, 5).join(" ");
    }

    return res.json({ reply });
  }
} catch {}

}

return res.json({
reply: "My brain lagged. Try again."
});
});

/* =========================
START
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
console.log("April GPT v6 (AUTH + CHAT MEMORY)")
);
