package internal

import (
    "encoding/json"
    "net/http"
    "os"

    "github.com/gorilla/mux"
)

func NewRouter() *mux.Router {
    r := mux.NewRouter()

    r.PathPrefix("/static/").
        Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

    r.HandleFunc("/api/bio", GetBio).Methods("GET")

    r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        http.ServeFile(w, r, "./static/index.html")
    })

    return r
}

func GetBio(w http.ResponseWriter, r *http.Request) {
    file, err := os.Open("./data/bio.json")
    if err != nil {
        http.Error(w, "cannot open bio file", 500)
        return
    }
    defer file.Close()

    var data map[string]any
    json.NewDecoder(file).Decode(&data)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(data)
}
