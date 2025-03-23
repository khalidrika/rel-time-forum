package backend

import "fmt"

func StartServer() {
	ruoter := Routes()
	fmt.Println(ruoter)
}
