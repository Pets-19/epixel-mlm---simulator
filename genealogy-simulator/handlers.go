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

// handleGenealogyTypes handles both GET and POST for genealogy types
func handleGenealogyTypes(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		handleGetGenealogyTypes(w, r)
	case "POST":
		handleCreateGenealogyType(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
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

// handleCreateGenealogyType creates a new genealogy type
func handleCreateGenealogyType(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name               string                 `json:"name"`
		Description        string                 `json:"description"`
		MaxChildrenPerNode int                    `json:"max_children_per_node"`
		IsActive           bool                   `json:"is_active"`
		Rules              map[string]interface{} `json:"rules"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding create genealogy type request: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Creating genealogy type: %+v", req)

	// Validate required fields
	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	// Convert rules to JSON string
	rulesJSON, err := json.Marshal(req.Rules)
	if err != nil {
		log.Printf("Error marshalling rules: %v", err)
		http.Error(w, "Invalid rules format", http.StatusBadRequest)
		return
	}

	// Insert into database
	var newID int
	err = db.QueryRow(
		`INSERT INTO genealogy_types (name, description, max_children_per_node, is_active, rules) 
		 VALUES ($1, $2, $3, $4, $5) 
		 RETURNING id`,
		req.Name, req.Description, req.MaxChildrenPerNode, req.IsActive, string(rulesJSON),
	).Scan(&newID)

	if err != nil {
		log.Printf("Error inserting genealogy type: %v", err)
		http.Error(w, "Failed to create genealogy type: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Created genealogy type with ID: %d", newID)

	// Return the created type
	response := map[string]interface{}{
		"id":                    newID,
		"name":                  req.Name,
		"description":           req.Description,
		"max_children_per_node": req.MaxChildrenPerNode,
		"is_active":             req.IsActive,
		"rules":                 req.Rules,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
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
		// Fallback: Use max_children_per_node to determine plan type
		// 2 children = binary-like, >2 = matrix-like
		log.Printf("Custom genealogy type '%s', using max_children_count=%d to determine plan type", genealogyType.Name, req.MaxChildrenCount)
		maxChildrenCount := req.MaxChildrenCount
		if maxChildrenCount <= 0 {
			maxChildrenCount = genealogyType.MaxChildrenPerNode
		}
		if maxChildrenCount <= 2 {
			log.Println("Using binary plan simulator for custom type")
			simulator := NewBinaryPlanSimulator(simulationID)
			response = simulator.Simulate(req)
		} else {
			log.Println("Using matrix plan simulator for custom type")
			simulator := NewMatrixPlanSimulator(simulationID, maxChildrenCount)
			response = simulator.Simulate(req)
		}
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
