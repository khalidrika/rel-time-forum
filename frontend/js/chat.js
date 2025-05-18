import { logout } from "./auth.js";
import { socket } from "./ws.js";


let currentUserId = null;
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

    users?.forEach(user => {
        console.log(user);

        // console.log("this is a new user");

        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.textContent = user.nickname;
        userItem.addEventListener("click", () => openChatWindow(user));
        usersContainer.appendChild(userItem);
    });

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

    // const res = await fetch(`/api/messages?userId=${user.id}`);
    // const text = await res.text();
    // console.log("Raw Response:", text);
    // if (!res.ok) {
    //     console.error(`Failed to load messages: ${res.status} ${res.statusText}`);
    //     return;
    // }

    // let history = [];
    // try {
    //     history = JSON.parse(text);
    // } catch (e) {
    //     console.error("Invalid JSON response", e);
    //     return;
    // }
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
            const msgEl = document.createElement("p");
            msgEl.textContent = msg.content;
            messages.appendChild(msgEl);
        });
    }


    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";
    chatBox.appendChild(input);

    const tockens = document.cookie.split("; ");
    let oldtoken = {}
    for (let token of tockens) {
        let [key, value] = token.split("=")
        oldtoken[key] = value
    }

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.addEventListener("click", () => {
        const tockens = document.cookie.split("; ");
        let newtoken = {}
        for (let token of tockens) {
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
            tocken: newtoken["session_token"],
            content: message
        }));
        input.value = "";
    });
    chatBox.appendChild(sendButton);

    document.getElementById("app").appendChild(chatBox);
}
