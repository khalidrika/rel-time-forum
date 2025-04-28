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
	Title   string `json:"titile"`
	Content string `json:"content"`
}

func GetPostsHAndler(w http.ResponseWriter, r *http.Request) {
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
		ErrorHandler(w, "Method NOt allowed", http.StatusMethodNotAllowed)
		return
	}
}
