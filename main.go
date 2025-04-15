package main

import (
	server "realtime/backend"
)

func main() {
	server.Initialise()

	server.StartServer()
	server.DB.Close()
}
