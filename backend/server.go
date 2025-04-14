package backend

import (
	"log"
	"net"
	"net/http"
	"os"
	"time"
)

func StartServer() {
	router := Routes()
	// rl := NewRetLimiter(20 * time.Microsecond)
	if err := Server(router); err != nil {
		log.Fatalf("server encounterd an error: %v", err)
	}
}

func Server(handler http.Handler) error {
	// var port string

	envPort := os.Getenv("PORT")
	if envPort != "" {
		// port = envPort
	}
	listener, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatalf("error starting server : %v", err)
		return err
	}
	defer listener.Close()
	server := &http.Server{
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  15 * time.Second,
	}
	log.Printf("Starting Server on http://127.0.0.1:%d", listener.Addr().(*net.TCPAddr).Port)
	return server.Serve(listener)
}
