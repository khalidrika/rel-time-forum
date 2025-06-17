package backend

import (
	"encoding/json"
	"html"
	"log"
	"net/http"
	"strconv"
	"time"
)

type Comment struct {
	ID        int       `json:"id"`
	PostID    int       `json:"postId"`
	UserID    int       `json:"userId"`
	Nickname  string    `json:"nickname"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}


func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorHandler(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var err error
	var req Comment
	req.UserID, err = GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	req.Nickname, err = GetNicknameById(req.UserID)
	if err != nil {
		log.Println("error from get nickname:", err)
		return
	}
	postIDStr := r.URL.Query().Get("postId")
	if postIDStr == "" {
		ErrorHandler(w, "Missing postId", http.StatusBadRequest)
		return
	}
	req.PostID, err = strconv.Atoi(postIDStr)
	if err != nil {
		log.Println("can not convert post id :", err)
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Content == "" {
		ErrorHandler(w, "Invalid comment content", http.StatusBadRequest)
		return
	}

	req.Content = html.EscapeString(req.Content)
	stmt, err := DB.Prepare("INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)")
	if err != nil {
		ErrorHandler(w, "Failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	req.CreatedAt = time.Now()
	res, err := stmt.Exec(postIDStr, req.UserID, req.Content, req.CreatedAt)
	if err != nil {
		ErrorHandler(w, "Failed to insert comment", http.StatusInternalServerError)
		return
	}
	lastcomment, _ := res.LastInsertId()
	req.ID = int(lastcomment)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

func GetCommentsHandler(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.URL.Query().Get("postId")
	if postIDStr == "" {
		ErrorHandler(w, "Missing postId", http.StatusBadRequest)
		return
	}
	rows, err := DB.Query(`
		SELECT comments.id, comments.post_id, comments.user_id, users.nickname, comments.content, comments.created_at
		FROM comments
		JOIN users ON comments.user_id = users.id
		WHERE comments.post_id = ?
		ORDER BY comments.id DESC
	`, postIDStr)
	if err != nil {
		ErrorHandler(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var c Comment
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Nickname, &c.Content, &c.CreatedAt); err != nil {
			ErrorHandler(w, "Failed to read comment", http.StatusInternalServerError)
			return
		}
		// log.Println(c)
		comments = append(comments, c)
	}
	// log.Println(comments)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}
