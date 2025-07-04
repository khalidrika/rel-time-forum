package backend

import (
	"encoding/json"
	"html"
	"log"
	"net/http"
	"strings"
	"time"
)

type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Nickname  string    `json:"nickname"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := DB.Query(`
		SELECT posts.id, posts.user_id, users.Nickname, posts.title, posts.content, posts.created_at
		FROM posts
		JOIN users ON posts.user_id = users.id
		ORDER BY posts.created_at DESC
	`)
	if err != nil {
		ErrorHandler(w, "database error", http.StatusInternalServerError)
		log.Println("DB Query error:", err)
		return
	}
	defer rows.Close()

	var posts []Post
	count := 0

	for rows.Next() {
		var post Post
		if err := rows.Scan(&post.ID, &post.UserID, &post.Nickname, &post.Title, &post.Content, &post.CreatedAt); err != nil {
			ErrorHandler(w, "database error", http.StatusInternalServerError)
			log.Println("Row scan error:", err)
			return
		}
		posts = append(posts, post)
		count++
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorHandler(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req Post
	var err error
	req.UserID, err = GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorHandler(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		ErrorHandler(w, "Title and content required", http.StatusBadRequest)
		return
	}

	req.Title = html.EscapeString(req.Title)
	req.Content = html.EscapeString(req.Content)

	stmt, err := DB.Prepare("INSERT INTO posts (user_id, title, content, created_at) VALUES (?, ?, ?, ?)")
	if err != nil {
		ErrorHandler(w, "Failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	req.CreatedAt = time.Now()
	res, err := stmt.Exec(req.UserID, req.Title, req.Content, req.CreatedAt)
	if err != nil {
		ErrorHandler(w, "Failed to insert post", http.StatusInternalServerError)
		return
	}
	lastId, _ := res.LastInsertId()
	req.ID = int(lastId)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}
