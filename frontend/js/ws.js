class ChatManager {
    constructor() {
        this.ws = null;
        this.currentChatUser = null;
        this.messageOffset = 0;
        this.loadingMessages = false;
    }

    initWebSocket() {
        this.ws = new WebSocket('ws://localhost:8080/ws');
        
        this.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            this.appendMessage(msg);
        };

        window.addEventListener('beforeunload', () => {
            this.ws.close();
        });
    }

    async loadMessageHistory(receiverId) {
        if (this.loadingMessages) return;
        this.loadingMessages = true;
        
        const response = await fetch(`/messages/${receiverId}?offset=${this.messageOffset}&limit=10`);
        const messages = await response.json();
        
        messages.reverse().forEach(msg => this.prependMessage(msg));
        this.messageOffset += messages.length;
        this.loadingMessages = false;
    }

    sendMessage(content, receiverId) {
        const msg = {
            sender_id: currentUser.id,
            receiver_id: receiverId,
            content: content
        };
        this.ws.send(JSON.stringify(msg));
    }

    // Throttled scroll handler
    handleScroll = throttle(() => {
        const container = document.querySelector('.message-container');
        if (container.scrollTop < 100) {
            this.loadMessageHistory(this.currentChatUser.id);
        }
    }, 200);
}