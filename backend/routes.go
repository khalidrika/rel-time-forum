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
	return mux
}
