package backend

import (
	"encoding/json"
	"net/http"
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

type CreateCommentRequest struct {
	Content string `json:"content"`
}

func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorHandler(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := r.URL.Query().Get("postId")
	if postIDStr == "" {
		ErrorHandler(w, "Missing postId", http.StatusBadRequest)
		return
	}

	var req CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Content == "" {
		ErrorHandler(w, "Invalid comment content", http.StatusBadRequest)
		return
	}

	stmt, err := DB.Prepare("INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)")
	if err != nil {
		ErrorHandler(w, "Failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(postIDStr, userID, req.Content, time.Now())
	if err != nil {
		ErrorHandler(w, "Failed to insert comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment added successfully"})
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
		ORDER BY comments.created_at ASC
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
		comments = append(comments, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}
