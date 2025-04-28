package backend

import (
	"net/http"
)

func Routes() http.Handler {
	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./frontend"))
	mux.Handle("/frontend/", http.StripPrefix("/frontend/", fs))

	mux.HandleFunc("/", HomeHandler)
	mux.HandleFunc("/api/home-content", HomeContentHandler)
	mux.HandleFunc("/api/login", LoginHandler)
	mux.HandleFunc("/api/register", RegisterHandler)
	mux.HandleFunc("/api/logout", LogoutHandler)
	mux.HandleFunc("/api/me", MeHandler)
	mux.HandleFunc("/api/posts", GetPostsHAndler)
	return mux
}

