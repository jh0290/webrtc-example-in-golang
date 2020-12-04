package util

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"hello/70-global/global"
	"log"
)

func Send(conn *websocket.Conn, res global.JsonMap) (err error){

	tmp := fmt.Sprint("보냄 :", res)
	_ = log.Output(2, tmp)
	jsonStr, err := json.Marshal(res)
	if err != nil {
		log.Println(err)
		return
	}

	if string(jsonStr) != "" || string(jsonStr) != "{}" {
		err = conn.WriteMessage(websocket.TextMessage, jsonStr)
		if err != nil {
			log.Println(err)
			return
		}
	}
	return
}
