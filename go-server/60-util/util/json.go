package util

import "encoding/json"

func Json(data interface{}) (jsonData []byte) {
	jsonData, _ = json.Marshal(data)
	return
}
