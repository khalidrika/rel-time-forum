import { logout } from "./auth.js";
import { socket } from "./ws.js";

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

    users?.forEach(user => {
        console.log ("this is a new user");

        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.textContent = user.nickname;
        userItem.addEventListener("click", () => openChatWindow(user));
        usersContainer.appendChild(userItem);
    });

    document.getElementById("app").prepend(usersContainer);
}


export function openChatWindow(user) {
    // Remove any existing chat box first
    const existingChatBox = document.querySelector(".chat-box");
    if (existingChatBox) existingChatBox.remove();

    const chatBox = document.createElement("div");
    chatBox.className = "chat-box";

    // Header with Close Button
    const header = document.createElement("div");
    header.className = "chat-header";
    header.textContent = `Chat with ${user.nickname}`;

    const closeButton = document.createElement("span");
    closeButton.textContent = "×";
    closeButton.className = "chat-close-button";
    closeButton.style.cursor = "pointer";
    closeButton.style.marginLeft = "10px";
    closeButton.addEventListener("click", () => chatBox.remove());

    header.appendChild(closeButton);
    chatBox.appendChild(header);

    // Messages Area
    const messages = document.createElement("div");
    messages.className = "messages";
    chatBox.appendChild(messages);

    // Input + Send Button
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";
    chatBox.appendChild(input);

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.addEventListener("click", () => {
        // console.log("*******************",user);

        const message = input.value.trim();
        if (!message) return;
        const msgDiv = document.createElement("div");
        msgDiv.textContent = "you: " + message;
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
        const tokens = document.cookie.split('; ');
        let tokenValue = {}
        for (let i = 0; i < tokens.length; i++) {
            let [key, value] = tokens[i].split("=")
            tokenValue[key] = value
        }
        const from = localStorage.getItem("username");
        if (!from) {
            logout();
            return
        }

        // console.log(`Sending message to ${user.nickname}:`, input.value);
        console.log("message", {
            from: from,
            to: user.nickname,
            content: message,
            token: tokenValue["session_token"]
        });

        socket.send(JSON.stringify({
            from: from,
            to: user.nickname,
            content: message,
            token: tokenValue["session_token"]
        }));

        input.value = "";
    });
    chatBox.appendChild(sendButton);

    document.getElementById("app").appendChild(chatBox);
}

