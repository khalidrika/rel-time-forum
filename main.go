package main

import server "realtime/backend"

func main() {
	if !server.Initialise() {
		return
	}
}
