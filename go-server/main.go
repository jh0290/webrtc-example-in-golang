package main

import (
	"hello/10-router/router"
	"log"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Llongfile)
	log.Println("started")
	router.SetUpServer("1338")
}

