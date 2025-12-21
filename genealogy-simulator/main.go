package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

func main() {
	// Initialize database connection
	InitDB()
	defer db.Close()

	// Initialize services
	// Settings service removed

	r := mux.NewRouter()

	// CORS middleware - apply before routes
	r.Use(corsMiddleware)

	// API routes
	r.HandleFunc("/api/genealogy/simulate", handleSimulation).Methods("POST")
	r.HandleFunc("/api/genealogy/business-simulate", handleBusinessSimulation).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/genealogy/types", handleGenealogyTypes).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/genealogy/save-simulation", handleSaveSimulation).Methods("POST")

	// Genealogy Management API routes
	r.HandleFunc("/api/genealogy/generate-users", handleGenerateUsers).Methods("POST")
	r.HandleFunc("/api/genealogy/downline/{parent_id}", handleGetDownlineUsers).Methods("GET")
	r.HandleFunc("/api/genealogy/upline/{node_id}", handleGetUplineUsers).Methods("GET")
	r.HandleFunc("/api/genealogy/structure/{genealogy_type_id}", handleGetGenealogyStructure).Methods("GET")
	r.HandleFunc("/api/genealogy/add-user", handleAddUserToGenealogy).Methods("POST")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Genealogy Simulator running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Continue to next handler
		next.ServeHTTP(w, r)
	})
}
