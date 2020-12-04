package router

import (
	"github.com/gorilla/mux"
	"hello/20-controller/ctrl"
	"log"
	"net/http"
)

func SetUpServer(appPort string) {

	var router = mux.NewRouter()
	router.Handle("/", http.HandlerFunc(ctrl.ServeWs))

	router.Use(Cors)

	err := http.ListenAndServe(":"+appPort, router)
	if err != nil {
		log.Println(err)
		return
	}
}
