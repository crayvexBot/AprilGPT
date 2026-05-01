const API = "https://aprilgpt-vi60.onrender.com/chat";

let chats = [[]];
let current = 0;

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("closed");
}

function newChat() {
  chats.push([]);
  current = chats.length - 1;
  renderList();
  renderChat();
}

function renderList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  chats.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "chatItem";
    div.innerText = "Chat " + (i + 1);

    div.onclick = () => {
      current = i;
      renderChat();
    };

    list.appendChild(div);
  });
}

function renderChat() {
  const chat = document.getElementById("chat");
  chat.innerHTML = "";

  chats[current].forEach(m => {
    const div = document.createElement("div");
    div.className = "msg " + m.role;
    div.innerText = m.text;
    chat.appendChild(div);
  });

  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const input = document.getElementById("msg");
  const msg = input.value;
  if (!msg) return;

  input.value = "";

  chats[current].push({ role: "user", text: msg });
  renderChat();

  const temp = { role: "ai", text: "..." };
  chats[current].push(temp);
  renderChat();

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    const d = await r.json();
    temp.text = d.reply;
    renderChat();

  } catch {
    temp.text = "AI connection lost.";
    renderChat();
  }
}

renderList();
renderChat();
