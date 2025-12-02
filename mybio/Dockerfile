FROM golang:1.23 AS builder
WORKDIR /app
COPY . .
RUN go build -o server ./cmd/server

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
COPY static ./static
COPY data ./data

EXPOSE 8080
CMD ["./server"]
