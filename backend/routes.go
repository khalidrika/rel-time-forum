package backend

import (
	"net/http"
)

func Ruotes() http.Handler {
	mux := http.NewServeMux()

	// rl := NewRetLimiter(20 * time.Microsecond)
	mux.HandleFunc("/", HomeHandler)
	return mux
}
