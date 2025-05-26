import { logout } from "./auth.js";
import { socket, updateUserStatus } from "./ws.js";

export let currentUserId = null;
export let currentUserNickname = null;


export async function loadCurrentUser() {
    try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("Failed to fetch user data");
        const user = await res.json();
        currentUserId = user.id;
        currentUserNickname = user.nickname;
        return user;
    } catch (err) {
        console.error("Failed to load current user:", err);
        return null;
    }
}

export async function renderUsers() {
    try {
        const res = await fetch("/api/users", {
            method: "GET",
            credentials: "include"
        });
        if (!res.ok) throw new Error("Failed to load users");

        const users = await res.json();
        const existingList = document.querySelector(".user-list");
        if (existingList) existingList.remove();

        const usersContainer = document.createElement("div");
        usersContainer.className = "user-list";

        const header = document.createElement("h2");
        header.textContent = "Users";
        usersContainer.appendChild(header);

        if (users.length === 0) {
            const noUser = document.createElement("p");
            noUser.textContent = "No users found";
            usersContainer.appendChild(noUser);
        } else {
            const fragment = document.createDocumentFragment();
            users.forEach(user => {
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
            
            statusText.textContent = user.online ? " (Online)" : " (Offline)";
            statusText.style.color = user.online ? "#4caf50" : "#888";
            statusText.style.fontSize = "0.9em";

            userItem.appendChild(statusDot);
            userItem.appendChild(nameSpan);
            userItem.appendChild(statusText);

            userItem.addEventListener("click", () => openChatWindow(user));
            fragment.appendChild(userItem);
            });
            usersContainer.appendChild(fragment);
        }

        document.getElementById("app").prepend(usersContainer);
    } catch (err) {
        console.error("Error loading users:", err);
    }
}

export function buildMessageElement(msg) {
    const msgEl = document.createElement("div");
    msgEl.className = `message ${msg.from === currentUserId ? "sent" : "received"}`;

    const header = document.createElement("div");
    header.className = "message-header";

    const sender = document.createElement("strong");
    sender.textContent = msg.from_name || "User";

    const createdAt = document.createElement("span");
    createdAt.className = "created";
    createdAt.textContent = new Date(msg.createdat).toLocaleString();

    header.append(sender, createdAt);

    const content = document.createElement("div");
    content.textContent = msg.content;

    msgEl.append(header, content);
    return msgEl;
}

export function createChatbox(user) {
    const anyOpenBox = document.querySelector(".chat-box");
    if (anyOpenBox) anyOpenBox.remove();

    const chatBox = document.createElement("div");
    chatBox.className = "chat-box";
    chatBox.dataset.userId = String(user.id); // تأكد أنه string

    const header = document.createElement("div");
    header.className = "chat-header";

    const title = document.createElement("span");
    title.className = "chat-title";
    title.textContent = `Chat with ${user.nickname || "User"}`;

    const statusDot = document.createElement("span");
    statusDot.className = "status-dot";
    statusDot.style.display = "inline-block";
    statusDot.style.width = "10px";
    statusDot.style.height = "10px";
    statusDot.style.borderRadius = "50%";
    statusDot.style.marginRight = "8px";
    statusDot.style.backgroundColor = user.online ? "#4caf50" : "#ccc";
    statusDot.title = user.online ? "Online" : "Offline";
    title.prepend(statusDot);
    updateUserStatus(user.id, user.online);
    const closeButton = document.createElement("button");
    closeButton.className = "btn btn-danger chat-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.title = "Close chat";
    closeButton.addEventListener("click", () => chatBox.remove());

    header.append(title, closeButton);
    chatBox.appendChild(header);

    const messages = document.createElement("div");
    messages.className = "messages";
    chatBox.appendChild(messages);

    document.getElementById("app").appendChild(chatBox);
    return { messages, chatBox };
}

export async function openChatWindow(user) {    
    if (!user || !user.id) return;

    const existingBox = document.querySelector(".-chatbox");
    if (existingBox) existingBox.remove();

    const { messages, chatBox } = createChatbox(user);
    let offset = 0;
    let isLoading = false;
    let hasMoreMessages = true;

    async function loadMessages() {
        if (isLoading || !hasMoreMessages) return;
        isLoading = true;

        try {
            
            const res = await fetch(`/api/messages?userId=${user.id}&offset=${offset}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            const messageChunk = Array.isArray(data) ? data : [];

            if (offset === 0) messages.innerHTML = "";

            if (messageChunk.length === 0 && offset === 0) {
                const noMsg = document.createElement("div");
                noMsg.className = "no-messages";
                noMsg.textContent = "No messages yet.";
                messages.appendChild(noMsg);
                hasMoreMessages = false;
                return;
            }

            const fragment = document.createDocumentFragment();
            messageChunk.forEach(msg => {
                const msgEl = buildMessageElement(msg);
                if (msgEl) fragment.prepend(msgEl);
            });

            messages.prepend(fragment);
            offset += messageChunk.length;

            if (offset === messageChunk.length) {
                setTimeout(() => {
                    messages.scrollTop = messages.scrollHeight;
                }, 50);
            }

        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            isLoading = false;
        }
    }

    messages.addEventListener("scroll", () => {
        if (messages.scrollTop < 50) loadMessages();
    });

    await loadMessages();

    const inputWrapper = document.createElement("div");
    inputWrapper.className = "chat-input-container";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";

    sendButton.addEventListener("click", () => {
        const msg = input.value.trim();
        if (!msg) return;

        const tokenCookie = document.cookie.split("; ").find(row => row.startsWith("session_token="));
        if (!tokenCookie) return logout();
        const token = tokenCookie.split("=")[1];

        const newMsg = {
            from: currentUserId,
            to: user.id,
            from_name: currentUserNickname,
            content: msg,
            createdat: new Date().toISOString()
        };

        const msgEl = buildMessageElement(newMsg);
        if (msgEl) {
            messages.appendChild(msgEl);
            messages.scrollTop = messages.scrollHeight;
        }

        socket.send(JSON.stringify({
            ...newMsg,
            token
        }));

        input.value = "";
    });


    inputWrapper.appendChild(input);
    inputWrapper.appendChild(sendButton);
    chatBox.appendChild(inputWrapper);
}

// Update the status dot in the chatbox for a specific user
export function updateChatboxStatusDot(userId, online) {
    const chatBox = document.querySelector(`.chat-box[data-user-id="${userId}"]`);
    if (!chatBox) return;
    const statusDot = chatBox.querySelector(".status-dot");
    if (!statusDot) return;
    statusDot.style.backgroundColor = online ? "#4caf50" : "#ccc";
    statusDot.title = online ? "Online" : "Offline";
}