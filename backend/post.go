package backend

import (
	"encoding/json"
	"net/http"
	"time"
)

type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

type CreatePostRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := DB.Query(`
	SELECT id, user_id, title, content, created_at
	FROM posts
	ORDER BY created_at DESC
	`)
	if err != nil {
		ErrorHandler(w, "database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		if err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt); err != nil {
			ErrorHandler(w, "database error", http.StatusInternalServerError)
			return
		}
		posts = append(posts, post)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorHandler(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorHandler(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Title == "" || req.Content == "" {
		ErrorHandler(w, "Title and content required", http.StatusBadRequest)
		return
	}

	stmt, err := DB.Prepare("INSERT INTO posts (user_id, title, content, created_at) VALUES (?, ?, ?, ?)")
	if err != nil {
		ErrorHandler(w, "Failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(userID, req.Title, req.Content, time.Now())
	if err != nil {
		ErrorHandler(w, "Failed to insert post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Post created successfully"}`))
}
