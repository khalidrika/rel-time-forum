import { logout } from "./auth.js";
import { socket } from "./ws.js";


export let currentUserId = null;
export let currentUserNickname = null;

export async function loadCurrentUser() {
    const res = await fetch("/api/me");
    if (res.ok) {
        const user = await res.json();
        currentUserId = user.id;
        currentUserNickname = user.nickname;
    }
}

export async function renderUsers() {
    const res = await fetch("/api/users", {
        method: "GET",
        credentials: "include"
    });

    if (!res.ok) {
        console.error("Failed to load users");
        return;
    }

    const users = await res.json();
    const usersContainer = document.createElement("div");
    usersContainer.className = "user-list";

    const header = document.createElement("h2");
    header.textContent = "Online Users";
    usersContainer.appendChild(header);
    
    if (users === null) {
        const noUser = document.createElement("p")
        noUser.id = "nousers"
        noUser.textContent = "No Users found"
        usersContainer.appendChild(noUser)
    }else{
        users?.forEach(user => {
            const userItem = document.createElement("div");
            userItem.className = "user-item";
            userItem.dataset.userid = user.id; //real-time updates

            // Add online/offline indicator
            const statusDot = document.createElement("span");
            statusDot.className = "status-dot";
            statusDot.style.display = "inline-block";
            statusDot.style.width = "10px";
            statusDot.style.height = "10px";
            statusDot.style.borderRadius = "50%";
            statusDot.style.marginRight = "8px";
            statusDot.style.backgroundColor = user.online ? "#4caf50" : "#ccc";
            statusDot.title = user.online ? "Online" : "Offline";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = user.nickname;

            const statusText = document.createElement("span");
            console.log(user.online)
            console.log(user)
            statusText.textContent = user.online ? " (Online)" : " (Offline)";
            statusText.style.color = user.online ? "#4caf50" : "#888";
            statusText.style.fontSize = "0.9em";

            userItem.appendChild(statusDot);
            userItem.appendChild(nameSpan);
            userItem.appendChild(statusText);

            userItem.addEventListener("click", () => openChatWindow(user));
            usersContainer.appendChild(userItem);
        });
    }

    document.getElementById("app").prepend(usersContainer);
}


export async function openChatWindow(user) {
    const existingChatBox = document.querySelector(".chat-box");
    if (existingChatBox) existingChatBox.remove();

    const chatBox = document.createElement("div");
    chatBox.className = "chat-box";
    chatBox.id = user.id

    const header = document.createElement("div");
    header.className = "chat-header";
    header.textContent = `Chat with ${user.nickname}`;
     // Add online/offline indicator in chat window
    const statusDot = document.createElement("span");
    statusDot.className = "status-dot";
    statusDot.style.display = "inline-block";
    statusDot.style.width = "10px";
    statusDot.style.height = "10px";
    statusDot.style.borderRadius = "50%";
    statusDot.style.marginRight = "8px";
    statusDot.style.backgroundColor = user.online ? "#4caf50" : "#ccc";
    statusDot.title = user.online ? "Online" : "Offline";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = user.nickname;

    header.appendChild(statusDot);
    header.appendChild(nameSpan);
    
    const closeButton = document.createElement("span");
    closeButton.textContent = "×";
    closeButton.className = "chat-close-button";
    closeButton.style.cursor = "pointer";
    closeButton.addEventListener("click", () => chatBox.remove());
    header.appendChild(closeButton);
    chatBox.appendChild(header);

    const messages = document.createElement("div");
    messages.className = "messages";
    chatBox.appendChild(messages);

    const res = await fetch(`/api/messages?userId=${user.id}`);

    if (!res.ok) {
        console.error(`Failed to load messages: ${res.status} ${res.statusText}`);
        return;
    }

    let history;
    try {
        history = await res.json();
        if (!Array.isArray(history)) {
            console.warn("No messages yet.");
            history = [];
        }
    } catch (e) {
        console.error("Invalid JSON response", e);
        return;
    }

    // Render existing messages if any
    if (history.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = "No previous message."
        emptyMsg.className = "empty-msg"
        messages.appendChild(emptyMsg);
    } else {
history.forEach(msg => {
    const msgEl = document.createElement("div");
    msgEl.className = "message";
    msgEl.textContent = msg.content;

    if (msg.from === currentUserId) {
        msgEl.classList.add("sent");
    } else {
        msgEl.classList.add("received");
    }

    messages.appendChild(msgEl);
});

    }


    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";
    chatBox.appendChild(input);

    const tokens = document.cookie.split("; ");
    let oldtoken = {}
    for (let token of tokens) {
        let [key, value] = token.split("=")
        oldtoken[key] = value
    }

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.addEventListener("click", () => {
        const tokens = document.cookie.split("; ");
        let newtoken = {}
        for (let token of tokens) {
            let [key, value] = token.split("=")
            newtoken[key] = value
        }
        if (oldtoken["session_token"] !== newtoken["session_token"]) {
            logout()
        }
        const message = input.value.trim();
        if (!message) return;
        socket.send(JSON.stringify({
            to: user.id,
            token: newtoken["session_token"],
            content: message
        }));
        input.value = "";
    });
    chatBox.appendChild(sendButton);

    document.getElementById("app").appendChild(chatBox);
}
