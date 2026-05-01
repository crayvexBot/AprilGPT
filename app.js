const API = "https://YOUR-RENDER-URL.onrender.com/chat";

// boot delay
setTimeout(() => {
  document.getElementById("boot").style.display = "none";
  document.getElementById("chat").style.display = "block";
}, 1500);

// typing indicator
function typing() {
  const out = document.getElementById("output");
  const t = document.createElement("div");
  t.id = "typing";
  t.innerText = "pythonAI> thinking of a joke...";
  out.appendChild(t);
  out.scrollTop = 999999;
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

// typewriter effect
function typeText(text) {
  const out = document.getElementById("output");

  const line = document.createElement("div");
  out.appendChild(line);

  let i = 0;

  const interval = setInterval(() => {
    line.innerText = "pythonAI> " + text.slice(0, i);
    i++;

    if (i > text.length) clearInterval(interval);

    out.scrollTop = 999999;
  }, 10);
}

// send message
async function send() {
  const input = document.getElementById("msg");
  const msg = input.value;
  input.value = "";

  const out = document.getElementById("output");
  out.innerHTML += `cmd>User: ${msg}\n`;

  typing();

  const r = await fetch(API, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ message: msg })
  });

  const d = await r.json();

  removeTyping();
  typeText(d.reply);
}
