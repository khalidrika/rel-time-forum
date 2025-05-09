package backend

import (
	"net/http"
)

func Routes() http.Handler {
	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./frontend"))
	mux.Handle("/frontend/", http.StripPrefix("/frontend/", fs))

	mux.HandleFunc("/api/login", LoginHandler)
	mux.HandleFunc("/api/register", RegisterHandler)
	mux.HandleFunc("/api/logout", LogoutHandler)
	mux.HandleFunc("/api/me", MeHandler)
	mux.HandleFunc("/api/posts", GetPostsHandler)
	mux.HandleFunc("/api/create-post", CreatePostHandler)
	mux.HandleFunc("/api/comments", GetCommentHandler)
	mux.HandleFunc("/api/add-comment", AddCommentHandler)
	mux.HandleFunc("/", HomeHandler)
	mux.HandleFunc("/ws", ChatHandler)

	return mux
}

/* func(w http.ResponseWriter, r *http.Request) {
	validePath := map[string]bool{
		"/": true, "/login": true, "/register": true, "/home": true,
	}
	if !validePath[r.URL.Path] {
		ErrorHandler(w, "page not found", http.StatusNotFound)
		return
	}
	http.ServeFile(w, r, "./frontend/html/index.html")
} */
