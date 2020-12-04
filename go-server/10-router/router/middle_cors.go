package router

import (
	"net/http"
)

func Cors(next http.Handler) http.Handler {

	httpFunc := func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("origin")
		switch origin {
		case "ws://localhost:1338",
			"http://localhost:3000",
			"http://localhost:7000",
			"https://localhost:3000",
			"https://tenu-admin.tenuto.co.kr",
			"https://dev-tenu-admin.tenuto.co.kr":

			w.Header().Add("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Access-Control-*, Origin, X-Requested-With, Content-Type, Accept, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
		}

		switch r.Method {
		case http.MethodOptions:
			w.WriteHeader(http.StatusOK)
			return
		default:
			next.ServeHTTP(w, r)
		}
	}
	return http.HandlerFunc(httpFunc)
}
