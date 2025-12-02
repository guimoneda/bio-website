package main

import (
    "log"
    "net/http"
    "mybio/internal"
)

func main() {
    r := internal.NewRouter()

    log.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":8080", r))
}
