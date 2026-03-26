//  apiKey: "AIzaSyDoc9kVka1AGCXJopS7CqC9f4ikNa_2iH8",
//   authDomain: "chatapp-7a6a2.firebaseapp.com",
//   projectId: "chatapp-7a6a2"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ----- Firebase config -----
const firebaseConfig = {
   apiKey: "AIzaSyDoc9kVka1AGCXJopS7CqC9f4ikNa_2iH8",
  authDomain: "chatapp-7a6a2.firebaseapp.com",
  projectId: "chatapp-7a6a2"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----- User & Room -----
const user = prompt("Enter your name:") || "Me";
const room = "private-chat";
const statusDoc = doc(db, `rooms/${room}/status/${user}`);

// ----- Set user online -----
await setDoc(statusDoc, { online: true, typing: false });

// ----- Typing status -----
const input = document.getElementById("message");
input.addEventListener("input", async () => {
  await setDoc(statusDoc, { online: true, typing: input.value.trim() !== "" }, { merge: true });
});

// ----- Offline handling -----
window.addEventListener("beforeunload", async () => {
  await setDoc(statusDoc, { online: false, typing: false }, { merge: true });
});

// ----- Send message -----
window.sendMessage = async function() {
  const msg = input.value.trim();
  if (!msg) return;

  await addDoc(collection(db, `rooms/${room}/messages`), {
    text: msg,
    sender: user,
    time: Date.now()
  });
  input.value = "";
  await setDoc(statusDoc, { online: true, typing: false }, { merge: true });
};

// ----- Real-time messages -----
const q = query(collection(db, `rooms/${room}/messages`), orderBy("time"));
onSnapshot(q, snapshot => {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.classList.add("message", data.sender === user ? "me" : "other");

    const time = new Date(data.time);
    const hours = time.getHours().toString().padStart(2,'0');
    const minutes = time.getMinutes().toString().padStart(2,'0');
    const ts = `${hours}:${minutes}`;

    div.innerHTML = `${data.text} <span class="timestamp">${ts}</span> ${data.sender === user ? '<span class="checkmark">✔✔</span>' : ''}`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
});

// ----- Status: online & typing -----
const statusBox = document.getElementById("status-box");
const statusQuery = collection(db, `rooms/${room}/status`);
onSnapshot(statusQuery, snapshot => {
  let onlineUsers = [];
  let typingUsers = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (doc.id !== user && data.online) onlineUsers.push(doc.id);
    if (doc.id !== user && data.typing) typingUsers.push(doc.id);
  });

  let statusText = "";
  if (onlineUsers.length) statusText += `${onlineUsers.join(", ")} online`;
  if (typingUsers.length) statusText += typingUsers.length ? ` • ${typingUsers.join(", ")} typing...` : "";
  statusBox.textContent = statusText || "No one online";
});