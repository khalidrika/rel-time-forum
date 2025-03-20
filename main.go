package main

import server "realtime/server"

func main() {
	if server.Initialise() {
		return
	}
}
