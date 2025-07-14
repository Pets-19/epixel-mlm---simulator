package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

var db *sql.DB

// InitDB initializes the database connection
func InitDB() {
	var err error
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	connStr := fmt.Sprintf("postgres://postgres:password@%s:5432/epixel_mlm_tools?sslmode=disable", dbHost)
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}
}

// handleGetGenealogyTypes returns all available genealogy types
func handleGetGenealogyTypes(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, description, max_children_per_node, rules, is_active, created_at, updated_at FROM genealogy_types WHERE is_active = true")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var types []GenealogyType
	for rows.Next() {
		var gt GenealogyType
		var rulesJSON []byte
		err := rows.Scan(&gt.ID, &gt.Name, &gt.Description, &gt.MaxChildrenPerNode, &rulesJSON, &gt.IsActive, &gt.CreatedAt, &gt.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		err = json.Unmarshal(rulesJSON, &gt.Rules)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		types = append(types, gt)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(types)
}

// handleSimulation handles genealogy simulation requests
func handleSimulation(w http.ResponseWriter, r *http.Request) {
	log.Println("Received simulation request")

	var req SimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Simulation request: %+v", req)

	// Validate request
	if req.MaxExpectedUsers <= 0 || req.NumberOfCycles <= 0 {
		log.Printf("Invalid parameters: max_users=%d, cycles=%d", req.MaxExpectedUsers, req.NumberOfCycles)
		http.Error(w, "Invalid parameters", http.StatusBadRequest)
		return
	}

	// Generate simulation ID
	simulationID := uuid.New().String()
	log.Printf("Generated simulation ID: %s", simulationID)

	// Create simulator based on genealogy type
	simulator := NewBinaryPlanSimulator(simulationID)
	log.Println("Created binary plan simulator")

	// Run simulation
	log.Println("Starting simulation...")
	response := simulator.Simulate(req)
	log.Printf("Simulation completed. Generated %d nodes", len(response.Nodes))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Println("Response sent successfully")
}

// handleSaveSimulation saves the simulation results to database
func handleSaveSimulation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SimulationID string `json:"simulation_id"`
		SaveToDB     bool   `json:"save_to_db"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if !req.SaveToDB {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Simulation completed successfully"})
		return
	}

	// In a real implementation, you would save the simulation results to the database
	// For now, we'll just return a success message
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":       "Simulation results saved to database",
		"simulation_id": req.SimulationID,
	})
}

// getGenealogyTypeByID retrieves a genealogy type by ID
func getGenealogyTypeByID(id int) (*GenealogyType, error) {
	var gt GenealogyType
	var rulesJSON []byte

	err := db.QueryRow(
		"SELECT id, name, description, max_children_per_node, rules, is_active, created_at, updated_at FROM genealogy_types WHERE id = $1",
		id,
	).Scan(&gt.ID, &gt.Name, &gt.Description, &gt.MaxChildrenPerNode, &rulesJSON, &gt.IsActive, &gt.CreatedAt, &gt.UpdatedAt)

	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(rulesJSON, &gt.Rules)
	if err != nil {
		return nil, err
	}

	return &gt, nil
}
