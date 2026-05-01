const API = "https://aprilgpt-vi60.onrender.com/chat";

let chats = [[]];
let currentChat = 0;

// SIDEBAR TOGGLE
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("closed");
}

// NEW CHAT
function newChat() {
  chats.push([]);
  currentChat = chats.length - 1;
  renderChatList();
  renderChat();
}

// RENDER CHAT LIST
function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  chats.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "chatItem";
    div.innerText = "Chat " + (i + 1);

    div.onclick = () => {
      currentChat = i;
      renderChat();
    };

    list.appendChild(div);
  });
}

// RENDER CHAT MESSAGES
function renderChat() {
  const chat = document.getElementById("chat");
  chat.innerHTML = "";

  chats[currentChat].forEach(m => {
    const div = document.createElement("div");
    div.className = "msg " + m.role;
    div.innerText = m.text;
    chat.appendChild(div);
  });

  chat.scrollTop = chat.scrollHeight;
}

// SEND MESSAGE
async function send() {
  const input = document.getElementById("msg");
  const msg = input.value;
  if (!msg) return;

  input.value = "";

  // USER MESSAGE
  chats[currentChat].push({ role: "user", text: msg });
  renderChat();

  // AI placeholder
  const loading = { role: "ai", text: "..." };
  chats[currentChat].push(loading);
  renderChat();

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();

    loading.text = data.reply;
    renderChat();

  } catch {
    loading.text = "AI ERROR: connection failed";
    renderChat();
  }
}

// INIT
renderChatList();
renderChat();
