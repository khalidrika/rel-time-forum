package backend

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrade = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	To      int    `json:"to"`
	Content string `json:"content"`
}

func (m *Manager) ChatHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var id int
	var nickname string
	err = DB.QueryRow(`
		SELECT u.id, u.nickname
		FROM users u 
		JOIN sessions s ON u.id = s.user_id 
		WHERE s.token = ? 
	`, cookie.Value).Scan(&id, &nickname)
	if err != nil {
		ErrorHandler(w, "Failed to validate session", http.StatusUnauthorized)
		return
	}

	conn, err := upgrade.Upgrade(w, r, nil)
	if err != nil {
		ErrorHandler(w, "Failed to upgrade connection", http.StatusInternalServerError)
		return
	}

	client := NewClient(id, nickname, cookie.Value, conn)
	m.addclient(client)
	log.Printf("User %s connected, active connections: %d", nickname, len(m.Users[id]))

	var msg Message
	for {
		_, payload, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Connection closed for user %d", client.Id)
			m.removeclient(client)
			break
		}

		if err := json.Unmarshal(payload, &msg); err != nil {
			log.Println("Invalid message format:", err)
			continue
		}

		// Send to recipient and echo back to sender
		m.broadcast(msg.To, msg)
		m.broadcast(client.Id, msg)
	}
}

func (m *Manager) broadcast(id int, message Message) {
	clients, ok := m.Users[id]
	if !ok || len(clients) == 0 {
		log.Printf("No active clients for user %d", id)
		return
	}

	for _, client := range clients {
		err := client.Conn.WriteJSON(message)
		if err != nil {
			log.Println("Failed to send message:", err)
		}
	}
}

func (m *Manager) removeclient(c *Client) {
	clients, ok := m.Users[c.Id]
	if !ok {
		return
	}

	for i, client := range clients {
		if client == c {
			m.Users[c.Id] = append(clients[:i], clients[i+1:]...)
			break
		}
	}

	// Cleanup if no more connections for user
	if len(m.Users[c.Id]) == 0 {
		delete(m.Users, c.Id)
	}
}

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := DB.Query("SELECT id, nickname FROM users WHERE id <> ?", id)
	if err != nil {
		ErrorHandler(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var userID int
		var nickname string
		if err := rows.Scan(&userID, &nickname); err != nil {
			continue
		}
		users = append(users, map[string]interface{}{
			"id":       userID,
			"nickname": nickname,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
