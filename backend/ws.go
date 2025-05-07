package backend

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"
    "github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

type Client struct {
	conn   *websocket.Conn
	userID int
}

type Message struct {
	SenderID   int    `json:"sender_id"`
	ReceiverID int    `json:"receiver_id"`
	Content    string `json:"content"`
	Timestamp  string `json:"timestamp"`
}

var (
	clients    = make(map[int]*Client)
	broadcast  = make(chan Message)
	register   = make(chan *Client)
	unregister = make(chan *Client)
	mutex      = &sync.Mutex{}
)

func RunHub() {
	for {
		select {
		case client := <-register:
			mutex.Lock()
			clients[client.userID] = client
			updateUserStatus(client.userID, true)
			mutex.Unlock()

		case client := <-unregister:
			mutex.Lock()
			if _, ok := clients[client.userID]; ok {
				delete(clients, client.userID)
				updateUserStatus(client.userID, false)
			}
			mutex.Unlock()

		case msg := <-broadcast:
			storeMessage(msg)
			if receiver, ok := clients[msg.ReceiverID]; ok {
				if err := receiver.conn.WriteJSON(msg); err != nil {
					log.Printf("Error sending message to client %d: %v", msg.ReceiverID, err)
				}
			}
		}
	}
}

func updateUserStatus(userID int, online bool) {
	query := `
        INSERT OR REPLACE INTO user_status (user_id, online, last_seen) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
    `
	if !online {
		query = `
            UPDATE user_status 
            SET online = 0, last_seen = CURRENT_TIMESTAMP 
            WHERE user_id = ?
        `
	}
	_, err := DB.Exec(query, userID)
	if err != nil {
		log.Printf("Error updating user status for user %d: %v", userID, err)
	}
}

func GetChatList(w http.ResponseWriter, r *http.Request) {
	userID, _ := GetUserIDFromRequest(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := DB.Query(`
        SELECT u.id, u.nickname, 
               MAX(m.created_at) as last_message_time,
               EXISTS(SELECT 1 FROM user_status WHERE user_id = u.id AND online = 1) as online
        FROM users u
        LEFT JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
        WHERE u.id != ?
        GROUP BY u.id
        ORDER BY last_message_time DESC, u.nickname ASC
    `, userID)
	if err != nil {
		log.Printf("Error fetching chat list: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var chatList []map[string]interface{}
	for rows.Next() {
		var id int
		var nickname string
		var lastMessageTime sql.NullTime
		var online bool
		if err := rows.Scan(&id, &nickname, &lastMessageTime, &online); err != nil {
			log.Printf("Error scanning chat list row: %v", err)
			continue
		}
		chatList = append(chatList, map[string]interface{}{
			"id":                id,
			"nickname":          nickname,
			"last_message_time": lastMessageTime.Time,
			"online":            online,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chatList)
}

func GetMessageHistory(w http.ResponseWriter, r *http.Request) {
	userID, _ := GetUserIDFromRequest(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Retrieve and validate receiverID
	receiverIDStr := chi.URLParam(r, "receiverID")
	receiverID, err := strconv.Atoi(receiverIDStr)
	if err != nil {
		http.Error(w, "Invalid receiver ID", http.StatusBadRequest)
		return
	}

	// Retrieve and validate offset
	offsetStr := r.URL.Query().Get("offset")
	offset := 0 // Default offset
	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			http.Error(w, "Invalid offset value", http.StatusBadRequest)
			return
		}
	}

	limit := 20 // Default limit

	rows, err := DB.Query(`
        SELECT sender_id, receiver_id, content, created_at
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `, userID, receiverID, receiverID, userID, limit, offset)
	if err != nil {
		log.Printf("Error fetching message history: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.Timestamp); err != nil {
			log.Printf("Error scanning message row: %v", err)
			continue
		}
		messages = append(messages, msg)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func ValidateMessage(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var msg Message
		if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		if msg.SenderID != getAuthenticatedUserID(r) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if len(msg.Content) > 1000 || len(msg.Content) == 0 {
			http.Error(w, "Invalid message content", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func storeMessage(msg Message) {
	_, err := DB.Exec(`
        INSERT INTO messages (sender_id, receiver_id, content, created_at)
        VALUES (?, ?, ?, ?)
    `, msg.SenderID, msg.ReceiverID, msg.Content, time.Now())
	if err != nil {
		log.Printf("Error storing message: %v", err)
	}
}
