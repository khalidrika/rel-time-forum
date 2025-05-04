package backend

import (
	"net/http"
)

func Routes() http.Handler {
	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./frontend"))
	mux.Handle("/frontend/", http.StripPrefix("/frontend/", fs))

	// mux.HandleFunc("/", HomeHandler)
	// mux.HandleFunc("/api/home-content", HomeContentHandler)
	mux.HandleFunc("/api/login", LoginHandler)
	mux.HandleFunc("/api/register", RegisterHandler)
	mux.HandleFunc("/api/logout", LogoutHandler)
	mux.HandleFunc("/api/me", MeHandler)
	mux.HandleFunc("/api/posts", GetPostsHandler)
	mux.HandleFunc("/api/create-post", CreatePostHandler)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		validePath := map[string]bool{
			"/": true, "/login": true, "/register": true, "/home": true,
		}
		if !validePath[r.URL.Path] {
			ErrorHandler(w, "page not found", http.StatusNotFound)
			return
		}
		http.ServeFile(w, r, "./frontend/html/index.html")
	})
	return mux
}
