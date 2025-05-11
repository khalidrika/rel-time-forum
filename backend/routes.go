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
	mux.HandleFunc("/api/comments", GetCommentsHandler)      
	mux.HandleFunc("/api/add-comment", CreateCommentHandler) 
	mux.HandleFunc("/", HomeHandler)
	mux.HandleFunc("/ws", ChatHandler)

	return mux
}
