package ctrl

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	"hello/60-util/util"
	"hello/70-global/global"
	"log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(*http.Request) bool { return true },
}


func ServeWs(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	defer onClose(conn)
	err = onConnect()
	if err != nil {
		log.Println(err)
		return
	}

	req := make(global.JsonMap)
	var res global.JsonMap

	for {
		_, message, err := conn.ReadMessage()
		err = json.Unmarshal(message, &req)
		if err != nil {
			log.Println(err)
			return
		}

		log.Println(req["type"].(string))
		switch req["type"] {
		case "message":
			res, err = onMessage(conn, req)
			if err != nil {
				log.Println(err)
				return
			}
		case "create or join":
			res, err = onCreateOrJoin(conn, req)
			if err != nil {
				log.Println(err)
				return
			}
		case "ipaddr":
			res, err = onIpaddr(conn, req)
			if err != nil {
				log.Println(err)
				return
			}
		}
		_ = res

	}
}

func onConnect() (err error) {
	log.Println("접속!")
	return
}

func onClose(conn *websocket.Conn) {
	err := conn.Close()
	if err != nil {
		log.Println(err)
		return
	}

	return
}

func onMessage(conn *websocket.Conn, req global.JsonMap) (res global.JsonMap, err error) {
	res = make(global.JsonMap)

	roomId := util.Conn2RoomId[conn]
	conns := util.RoomId2Conns[roomId]
	err = conns.BroadCastInRoom(conn, req)
	if err != nil {
		log.Println(err)
		return
	}

	return
}

func onCreateOrJoin(conn *websocket.Conn, req global.JsonMap) (res global.JsonMap, err error) {
	roomId := req["room_id"].(string)
	conns := util.RoomId2Conns[roomId]

	switch len(conns) {
	case 0:
		util.RoomId2Conns[roomId] = append(util.RoomId2Conns[roomId], conn)
		util.Conn2RoomId[conn] = roomId

		res = global.JsonMap{
			"type": "created",
		}
		_ = util.Send(conn, res)
		return

	case 1:
		util.RoomId2Conns[roomId] = append(util.RoomId2Conns[roomId], conn)
		util.Conn2RoomId[conn] = roomId

		res = global.JsonMap{
			"type": "join",
		}
		_ = conns.BroadCastInRoom(conn, res)

		res = global.JsonMap{
			"type": "joined",
		}
		_ = util.Send(conn, res)

		res = global.JsonMap{
			"type": "ready",
		}
		_ = conns.BroadCastInRoom(conn, res)

		return

	default:
		res = global.JsonMap{
			"type": "full",
		}
		_ = util.Send(conn, res)
		return
	}
}

func onIpaddr(conn *websocket.Conn, req global.JsonMap) (res global.JsonMap, err error) {
	res = make(global.JsonMap)

	return
}