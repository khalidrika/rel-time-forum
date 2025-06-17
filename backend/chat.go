package backend

import (
	"encoding/json"
	"html"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

var upgrade = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Message struct {
	Token      string    `json:"token"`
	From       int       `json:"from"`
	To         int       `json:"to"`
	Content    string    `json:"content"`
	Created_at time.Time `json:"createdat"`
}

func (m *Manager) ChatHandler(w http.ResponseWriter, r *http.Request) {
	// m.Lock()
	// defer m.Unlock()
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
	m.broadcastStatus(id, true)
	// log.Printf("User %s connected, active connections: %d", nickname, len(m.Users[id]))
	var msg Message
	for {
		_, payload, err := conn.ReadMessage()
		if err != nil {
			// log.Printf("Connection closed for user %d", client.Id)
			m.removeclient(client)
			break
		}

		if err := json.Unmarshal(payload, &msg); err != nil {
			log.Println("Invalid message format:", err)
			continue
		}

		msg.From = client.Id
		if msg.Token != client.Token {

			m.broadcastStatus(client.Id, false)
			log.Println("not same")
			return
		}
		err = InsertMsg(msg.Content, client.Id, msg.To)
		if err == nil {
			msg.Created_at = time.Now()

			type OutgoingMsg struct {
				Token      string    `json:"token"`
				From       int       `json:"from"`
				To         int       `json:"to"`
				Content    string    `json:"content"`
				Created_at time.Time `json:"createdat"`
				FromName   string    `json:"from_name"`
			}

			out := OutgoingMsg{
				Token:      msg.Token,
				From:       msg.From,
				To:         msg.To,
				Content:    msg.Content,
				Created_at: msg.Created_at,
				FromName:   client.Nickname,
			}

			for _, receiverID := range []int{msg.To, client.Id} {
				clients, ok := m.Users[receiverID]
				if ok {
					for _, c := range clients {
						if err := c.Conn.WriteJSON(out); err != nil {
							log.Println("Failed to send enriched message:", err)
						}
					}
				}
				// Send notification to the receiver
				if msg.To != client.Id {
					m.sendNotification(msg.To, client.Nickname, msg.Content)
				}
			}
		} else {
			log.Println("failde to insert:", err)
			msg.Content = ""
			m.broadcast(client.Id, msg)
		}
	}
}

func InsertMsg(msg string, from, to int) error {
	msg = html.EscapeString(msg)
	_, err := DB.Exec(`
	INSERT INTO messages
	(sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)
	`, from, to, msg, time.Now())
	return err
}

func (m *Manager) broadcast(id int, message Message) {
	m.Lock()
	defer m.Unlock()
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
		m.broadcastStatus(c.Id, false)
	}
}

func (m *Manager) GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	m.Lock()
	defer m.Unlock()

	id, err := GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := DB.Query(`
		SELECT 
			u.id, 
			u.nickname
		FROM users u
		WHERE u.id <> ?
		ORDER BY 
			(
				SELECT MAX(m.created_at)
				FROM messages m
				WHERE (m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id)
			) IS NULL,
			(
				SELECT MAX(m.created_at)
				FROM messages m
				WHERE (m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id)
			) DESC,
			u.nickname ASC
	`, id, id, id, id, id)
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

		online := false
		if clients, ok := m.Users[userID]; ok && len(clients) > 0 {
			online = true
		}

		users = append(users, map[string]interface{}{
			"id":       userID,
			"nickname": nickname,
			"online":   online,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (m *Manager) broadcastStatus(userID int, online bool) {
	m.Lock()
	defer m.Unlock()
	statusMsg := map[string]interface{}{
		"type":   "status",
		"userId": userID,
		"online": online,
	}
	for _, clients := range m.Users {
		for _, client := range clients {
			client.Conn.WriteJSON(statusMsg)
		}
	}
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	offset := r.URL.Query().Get("offset")

	otherUserIDStr := r.URL.Query().Get("userId")
	if otherUserIDStr == "" {
		ErrorHandler(w, "Missing userId", http.StatusBadRequest)
		return
	}

	otherUserID, err := strconv.Atoi(otherUserIDStr)
	if err != nil {
		ErrorHandler(w, "Invalid userId", http.StatusBadRequest)
		return
	}
	rows, err := DB.Query(`
    SELECT m.sender_id, m.receiver_id, m.content, m.created_at, u.nickname
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at DESC
    LIMIT 10 OFFSET ?
    `, userID, otherUserID, otherUserID, userID, offset)
	if err != nil {
		ErrorHandler(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []map[string]interface{}
	for rows.Next() {
		var senderID, receiverID int
		var content, fromName string
		var createdAt time.Time

		if err := rows.Scan(&senderID, &receiverID, &content, &createdAt, &fromName); err != nil {
			continue
		}
		messages = append(messages, map[string]interface{}{
			"from":      senderID,
			"to":        receiverID,
			"content":   content,
			"createdat": createdAt.Format(time.RFC3339),
			"from_name": fromName,
		})

	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

// Send notification to receiver when a new message is received
func (m *Manager) sendNotification(userID int, fromName string, content string) {
	m.Lock()
	defer m.Unlock()
	notification := map[string]any{
		"type":  "notification",
		"title": "New Message",
		"body":  fromName + ": " + content,
	}
	clients, ok := m.Users[userID]
	if ok {
		for _, client := range clients {
			client.Conn.WriteJSON(notification)
		}
	}
}
