package backend

import (
	"encoding/json"
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

func AddCommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorHandler(w, "Method Not allowed", http.StatusMethodNotAllowed)
		return
	}
	userId, err := GetUserIDFromRequest(r)
	if err != nil {
		ErrorHandler(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	postID := r.URL.Query().Get("postId")
	if postID == "" {
		ErrorHandler(w, "missing posted", http.StatusBadRequest)
		return
	}

	var body struct {
		content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		ErrorHandler(w, "invalid comment", http.StatusBadRequest)
		return
	}
	_, err = DB.Exec(`
	INSERT INTO comments (post_id, user_id, content)
	VALUES (?, ?, ?)
	`, postID, userId, body.content)
	if err != nil {
		ErrorHandler(w, "FAiled to save comment", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Comment added",
	})
}
