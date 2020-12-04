package util

import (
	"github.com/gorilla/websocket"
	"hello/70-global/global"
	"log"
)

type Room []*websocket.Conn

func (cs Room) BroadCastInRoom(conn *websocket.Conn, res global.JsonMap) (err error) {
	for _, c := range cs {
		if conn == c {
			continue
		}
		err = Send(c, res)
		if err != nil {
			log.Println(err)
			return
		}
	}
	return
}


var RoomId2Conns = map[string]Room{} // roomId, num
var Conn2RoomId = map[*websocket.Conn]string{}

