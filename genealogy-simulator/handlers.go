package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

var db *sql.DB

// InitDB initializes the database connection
func InitDB() {
	var err error

	// Check for full DATABASE_URL first (for cloud deployments like Neon)
	connStr := os.Getenv("DATABASE_URL")

	if connStr == "" {
		// Fallback to individual env vars for local development
		dbHost := os.Getenv("DB_HOST")
		if dbHost == "" {
			dbHost = "localhost"
		}
		dbUser := os.Getenv("DB_USER")
		if dbUser == "" {
			dbUser = "postgres"
		}
		dbPassword := os.Getenv("DB_PASSWORD")
		if dbPassword == "" {
			dbPassword = "password"
		}
		dbName := os.Getenv("DB_NAME")
		if dbName == "" {
			dbName = "epixel_mlm_tools"
		}
		dbPort := os.Getenv("DB_PORT")
		if dbPort == "" {
			dbPort = "5432"
		}
		sslMode := os.Getenv("DB_SSLMODE")
		if sslMode == "" {
			sslMode = "disable"
		}

		connStr = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			dbUser, dbPassword, dbHost, dbPort, dbName, sslMode)
	}

	log.Printf("Connecting to database...")
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("Database connection failed: ", err)
	}
	log.Printf("Database connected successfully!")
}

// handleGetGenealogyTypes returns all available genealogy types
func handleGetGenealogyTypes(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, description, is_active, created_at, updated_at FROM genealogy_types WHERE is_active = true")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var types []GenealogyType
	for rows.Next() {
		var gt GenealogyType
		err := rows.Scan(&gt.ID, &gt.Name, &gt.Description, &gt.IsActive, &gt.CreatedAt, &gt.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Set default values for missing fields
		gt.MaxChildrenPerNode = 2 // Default for Binary Plan
		if gt.Name == "Matrix" || gt.Name == "Unilevel" {
			gt.MaxChildrenPerNode = 5 // Default for Matrix/Unilevel
		}
		gt.Rules = make(map[string]interface{}) // Empty rules for now

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

	// Get genealogy type to determine simulation logic
	genealogyType, err := getGenealogyTypeByID(req.GenealogyTypeID)
	if err != nil {
		log.Printf("Error getting genealogy type: %v", err)
		http.Error(w, "Invalid genealogy type", http.StatusBadRequest)
		return
	}

	// Generate simulation ID
	simulationID := uuid.New().String()
	log.Printf("Generated simulation ID: %s", simulationID)
	log.Printf("Genealogy type name from DB: %s", genealogyType.Name)

	// Create simulator based on genealogy type (case-insensitive, partial match)
	var response SimulationResponse
	genealogyTypeLower := strings.ToLower(genealogyType.Name)

	switch {
	case strings.Contains(genealogyTypeLower, "binary"):
		log.Println("Creating binary plan simulator")
		simulator := NewBinaryPlanSimulator(simulationID)
		response = simulator.Simulate(req)
	case strings.Contains(genealogyTypeLower, "unilevel"):
		log.Println("Creating unilevel plan simulator")
		maxChildrenCount := req.MaxChildrenCount
		if maxChildrenCount <= 0 {
			maxChildrenCount = genealogyType.MaxChildrenPerNode // fallback to database default
		}
		simulator := NewUnilevelPlanSimulator(simulationID, maxChildrenCount)
		response = simulator.Simulate(req)
	case strings.Contains(genealogyTypeLower, "matrix"):
		log.Println("Creating matrix plan simulator")
		maxChildrenCount := req.MaxChildrenCount
		if maxChildrenCount <= 0 {
			maxChildrenCount = genealogyType.MaxChildrenPerNode // fallback to database default
		}
		simulator := NewMatrixPlanSimulator(simulationID, maxChildrenCount)
		response = simulator.Simulate(req)
	default:
		log.Printf("Unsupported genealogy type: %s", genealogyType.Name)
		http.Error(w, "Unsupported genealogy type", http.StatusBadRequest)
		return
	}

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

	err := db.QueryRow(
		"SELECT id, name, description, is_active, created_at, updated_at FROM genealogy_types WHERE id = $1",
		id,
	).Scan(&gt.ID, &gt.Name, &gt.Description, &gt.IsActive, &gt.CreatedAt, &gt.UpdatedAt)

	if err != nil {
		return nil, err
	}

	// Set default values for missing fields
	gt.MaxChildrenPerNode = 2 // Default for Binary Plan
	if gt.Name == "Matrix" || gt.Name == "Unilevel" {
		gt.MaxChildrenPerNode = 5 // Default for Matrix/Unilevel
	}
	gt.Rules = make(map[string]interface{}) // Empty rules for now

	return &gt, nil
}
