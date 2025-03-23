package backend

import (
	"net/http"
)

func Routes() http.Handler {
	mux := http.NewServeMux()

	// rl := NewRetLimiter(20 * time.Microsecond)
	mux.HandleFunc("/", HomeHandler)
	return mux
}
