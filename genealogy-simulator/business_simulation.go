package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"
)

// BusinessProduct represents a product in the business plan
type BusinessProduct struct {
	ID                int     `json:"id"`
	ProductName       string  `json:"product_name"`
	ProductPrice      float64 `json:"product_price"`
	BusinessVolume    float64 `json:"business_volume"`
	ProductSalesRatio float64 `json:"product_sales_ratio"`
	ProductType       string  `json:"product_type"`
	SortOrder         int     `json:"sort_order"`
	IsActive          bool    `json:"is_active"`
}

// SimulationUser represents a user in the simulation with product assignment
type SimulationUser struct {
	ID                   string         `json:"id"`
	Name                 string         `json:"name"`
	Email                string         `json:"email"`
	Level                int            `json:"level"`
	ParentID             *string        `json:"parent_id,omitempty"`
	Children             []string       `json:"children"`
	GenealogyPosition    string         `json:"genealogy_position"`
	ProductID            *int           `json:"product_id,omitempty"`
	ProductName          *string        `json:"product_name,omitempty"`
	PersonalVolume       float64        `json:"personal_volume"`
	TeamVolume           float64        `json:"team_volume"`
	CommissionableVolume float64        `json:"commissionable_volume"`
	PayoutCycle          int            `json:"payout_cycle"`
	CreatedAt            time.Time      `json:"created_at"`
	GenealogyNode        *GenealogyNode `json:"genealogy_node,omitempty"`
}

// BusinessSimulationRequest represents the enhanced simulation request
type BusinessSimulationRequest struct {
	GenealogyType        string            `json:"genealogy_type"`
	MaxExpectedUsers     int               `json:"max_expected_users"`
	PayoutCycle          string            `json:"payout_cycle"`
	NumberOfPayoutCycles int               `json:"number_of_payout_cycles"`
	MaxChildrenCount     int               `json:"max_children_count"`
	Products             []BusinessProduct `json:"products"`
}

// BusinessSimulationResponse represents the enhanced simulation response
type BusinessSimulationResponse struct {
	ID                   string              `json:"id"`
	GenealogyType        string              `json:"genealogy_type"`
	MaxExpectedUsers     int                 `json:"max_expected_users"`
	PayoutCycle          string              `json:"payout_cycle"`
	NumberOfPayoutCycles int                 `json:"number_of_payout_cycles"`
	MaxChildrenCount     int                 `json:"max_children_count"`
	Products             []BusinessProduct   `json:"products"`
	Users                []SimulationUser    `json:"users"`
	GenealogyStructure   map[string][]string `json:"genealogy_structure"`
	SimulationSummary    SimulationSummary   `json:"simulation_summary"`
	CreatedAt            time.Time           `json:"created_at"`
	UpdatedAt            time.Time           `json:"updated_at"`
}

// SimulationSummary provides analytics for the simulation
type SimulationSummary struct {
	TotalUsersGenerated int                                `json:"total_users_generated"`
	UsersPerCycle       map[int]int                        `json:"users_per_cycle"`
	ProductDistribution map[string]ProductDistributionData `json:"product_distribution"`
	TotalPersonalVolume float64                            `json:"total_personal_volume"`
	TotalTeamVolume     float64                            `json:"total_team_volume"`
	AverageTeamVolume   float64                            `json:"average_team_volume"`
}

// ProductDistributionData represents product distribution statistics
type ProductDistributionData struct {
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// handleBusinessSimulation handles the enhanced business simulation with products and volumes
func handleBusinessSimulation(w http.ResponseWriter, r *http.Request) {
	// Handle OPTIONS request for CORS preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	log.Println("Received business simulation request")

	var req BusinessSimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Business simulation request: %+v", req)

	// Validate request
	if err := validateBusinessSimulationRequest(req); err != nil {
		log.Printf("Validation error: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Convert business request to traditional simulation request
	genealogyTypeID, err := getGenealogyTypeIDByName(req.GenealogyType)
	if err != nil {
		log.Printf("Error getting genealogy type ID: %v", err)
		http.Error(w, "Invalid genealogy type", http.StatusBadRequest)
		return
	}

	simReq := SimulationRequest{
		GenealogyTypeID:  genealogyTypeID,
		MaxExpectedUsers: req.MaxExpectedUsers,
		PayoutCycleType:  req.PayoutCycle,
		NumberOfCycles:   req.NumberOfPayoutCycles,
		MaxChildrenCount: req.MaxChildrenCount,
	}

	// Run genealogy simulation using existing stable code
	genealogyType, err := getGenealogyTypeByID(genealogyTypeID)
	if err != nil {
		log.Printf("Error getting genealogy type: %v", err)
		http.Error(w, "Invalid genealogy type", http.StatusBadRequest)
		return
	}

	simulationID := fmt.Sprintf("biz_sim_%d", time.Now().UnixNano())
	log.Printf("Generated business simulation ID: %s", simulationID)

	var simResponse SimulationResponse
	switch genealogyType.Name {
	case "Binary":
		simulator := NewBinaryPlanSimulator(simulationID)
		simResponse = simulator.Simulate(simReq)
	case "Unilevel":
		simulator := NewUnilevelPlanSimulator(simulationID, req.MaxChildrenCount)
		simResponse = simulator.Simulate(simReq)
	case "Matrix":
		simulator := NewMatrixPlanSimulator(simulationID, req.MaxChildrenCount)
		simResponse = simulator.Simulate(simReq)
	default:
		http.Error(w, "Unsupported genealogy type", http.StatusBadRequest)
		return
	}

	// Enhance simulation with business logic
	businessResponse := enhanceSimulationWithBusinessLogic(simResponse, req)

	log.Printf("Business simulation completed. Generated %d users", len(businessResponse.Users))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(businessResponse); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Println("Business simulation response sent successfully")
}

// validateBusinessSimulationRequest validates the simulation request
func validateBusinessSimulationRequest(req BusinessSimulationRequest) error {
	if req.MaxExpectedUsers <= 0 {
		return fmt.Errorf("max_expected_users must be greater than 0")
	}

	if req.NumberOfPayoutCycles <= 0 {
		return fmt.Errorf("number_of_payout_cycles must be greater than 0")
	}

	if req.MaxChildrenCount <= 0 {
		return fmt.Errorf("max_children_count must be greater than 0")
	}

	// Validate genealogy type constraints
	if req.GenealogyType == "binary" && req.MaxChildrenCount != 2 {
		return fmt.Errorf("binary genealogy type requires exactly 2 children per user")
	}

	if (req.GenealogyType == "unilevel" || req.GenealogyType == "matrix") && req.MaxChildrenCount < 1 {
		return fmt.Errorf("%s genealogy type requires at least 1 child per user", req.GenealogyType)
	}

	// Validate products
	if len(req.Products) == 0 {
		return fmt.Errorf("at least one product is required for simulation")
	}

	// Validate sales ratios total 100%
	totalSalesRatio := 0.0
	for _, product := range req.Products {
		totalSalesRatio += product.ProductSalesRatio
	}
	if totalSalesRatio < 99.99 || totalSalesRatio > 100.01 {
		return fmt.Errorf("product sales ratios must total 100%%, current total: %.2f%%", totalSalesRatio)
	}

	return nil
}

// getGenealogyTypeIDByName gets genealogy type ID by name
func getGenealogyTypeIDByName(name string) (int, error) {
	var id int
	err := db.QueryRow(
		"SELECT id FROM genealogy_types WHERE LOWER(name) LIKE LOWER($1) AND is_active = true",
		"%"+name+"%",
	).Scan(&id)
	return id, err
}

// enhanceSimulationWithBusinessLogic adds business logic to genealogy simulation
func enhanceSimulationWithBusinessLogic(simResponse SimulationResponse, req BusinessSimulationRequest) BusinessSimulationResponse {
	log.Println("Enhancing simulation with business logic")

	// Convert genealogy nodes to simulation users
	users := make([]SimulationUser, 0)
	genealogyStructure := make(map[string][]string)

	// Create simulation users from genealogy nodes
	for i, node := range simResponse.Nodes {
		userID := fmt.Sprintf("user_%d", i+1)
		userName := fmt.Sprintf("User %d", i+1)
		userEmail := fmt.Sprintf("user%d@simulation.com", i+1)

		var parentID *string
		if node.ParentID != nil {
			// Find parent user ID
			for j, parentNode := range simResponse.Nodes {
				if parentNode.ID == *node.ParentID {
					parentUserID := fmt.Sprintf("user_%d", j+1)
					parentID = &parentUserID
					break
				}
			}
		}

		user := SimulationUser{
			ID:                userID,
			Name:              userName,
			Email:             userEmail,
			Level:             node.Depth,
			ParentID:          parentID,
			Children:          make([]string, 0),
			GenealogyPosition: node.Position,
			PayoutCycle:       node.PayoutCycle,
			CreatedAt:         node.CreatedAt,
			GenealogyNode:     &node,
		}

		users = append(users, user)
	}

	// Build children relationships
	for i := range users {
		if users[i].ParentID != nil {
			// Find parent and add this user as child
			for j := range users {
				if users[j].ID == *users[i].ParentID {
					users[j].Children = append(users[j].Children, users[i].ID)
					break
				}
			}
		}
	}

	// Build genealogy structure map
	for _, user := range users {
		if len(user.Children) > 0 {
			genealogyStructure[user.ID] = user.Children
		}
	}

	// Assign products to users based on sales ratios
	assignProductsToUsers(users, req.Products)

	// Calculate volumes
	calculateVolumes(users)

	// Generate simulation summary
	summary := generateSimulationSummary(users, req.Products, req.NumberOfPayoutCycles)

	return BusinessSimulationResponse{
		ID:                   simResponse.SimulationID,
		GenealogyType:        req.GenealogyType,
		MaxExpectedUsers:     req.MaxExpectedUsers,
		PayoutCycle:          req.PayoutCycle,
		NumberOfPayoutCycles: req.NumberOfPayoutCycles,
		MaxChildrenCount:     req.MaxChildrenCount,
		Products:             req.Products,
		Users:                users,
		GenealogyStructure:   genealogyStructure,
		SimulationSummary:    summary,
		CreatedAt:            simResponse.CreatedAt,
		UpdatedAt:            time.Now(),
	}
}

// assignProductsToUsers assigns products to users based on sales ratios
func assignProductsToUsers(users []SimulationUser, products []BusinessProduct) {
	log.Printf("Assigning products to %d users", len(users))

	// Skip root user (no product assignment)
	usersToAssign := make([]*SimulationUser, 0)
	for i := range users {
		if users[i].Level > 0 {
			usersToAssign = append(usersToAssign, &users[i])
		}
	}

	// Assign products randomly based on sales ratios
	for _, user := range usersToAssign {
		product := assignProductBasedOnSalesRatio(products)

		user.ProductID = &product.ID
		user.ProductName = &product.ProductName
		user.CommissionableVolume = product.BusinessVolume
		user.PersonalVolume = product.BusinessVolume
	}

	log.Printf("Assigned products to %d users", len(usersToAssign))
}

// assignProductBasedOnSalesRatio assigns a product based on sales ratio (random assignment)
func assignProductBasedOnSalesRatio(products []BusinessProduct) BusinessProduct {
	random := rand.Float64() * 100
	cumulativeRatio := 0.0

	for _, product := range products {
		cumulativeRatio += product.ProductSalesRatio
		if random <= cumulativeRatio {
			return product
		}
	}

	// Fallback to last product
	return products[len(products)-1]
}

// calculateVolumes calculates personal and team volumes for all users
func calculateVolumes(users []SimulationUser) {
	log.Printf("Calculating volumes for %d users", len(users))

	// Personal volumes are already set during product assignment

	// Calculate team volumes (unlimited genealogy levels)
	for i := range users {
		users[i].TeamVolume = calculateTeamVolume(users[i].ID, users)
	}

	log.Println("Volume calculations completed")
}

// calculateTeamVolume calculates team volume for a user (unlimited genealogy levels)
func calculateTeamVolume(userID string, users []SimulationUser) float64 {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil || len(user.Children) == 0 {
		return 0
	}

	teamVolume := 0.0

	// Recursively calculate team volume
	for _, childID := range user.Children {
		for i := range users {
			if users[i].ID == childID {
				teamVolume += users[i].PersonalVolume
				teamVolume += calculateTeamVolume(childID, users)
				break
			}
		}
	}

	return teamVolume
}

// generateSimulationSummary generates comprehensive simulation analytics
func generateSimulationSummary(users []SimulationUser, products []BusinessProduct, numberOfCycles int) SimulationSummary {
	log.Println("Generating simulation summary")

	usersPerCycle := make(map[int]int)
	productDistribution := make(map[string]ProductDistributionData)

	// Count users per cycle
	for _, user := range users {
		if user.PayoutCycle > 0 {
			usersPerCycle[user.PayoutCycle]++
		}
	}

	// Calculate product distribution
	usersWithProducts := make([]SimulationUser, 0)
	for _, user := range users {
		if user.ProductID != nil {
			usersWithProducts = append(usersWithProducts, user)
		}
	}

	for _, product := range products {
		count := 0
		for _, user := range usersWithProducts {
			if user.ProductID != nil && *user.ProductID == product.ID {
				count++
			}
		}

		percentage := 0.0
		if len(usersWithProducts) > 0 {
			percentage = (float64(count) / float64(len(usersWithProducts))) * 100
		}

		productDistribution[product.ProductName] = ProductDistributionData{
			Count:      count,
			Percentage: percentage,
		}
	}

	// Calculate total volumes
	totalPersonalVolume := 0.0
	totalTeamVolume := 0.0

	for _, user := range users {
		totalPersonalVolume += user.PersonalVolume
		totalTeamVolume += user.TeamVolume
	}

	averageTeamVolume := 0.0
	if len(users) > 0 {
		averageTeamVolume = totalTeamVolume / float64(len(users))
	}

	return SimulationSummary{
		TotalUsersGenerated: len(users),
		UsersPerCycle:       usersPerCycle,
		ProductDistribution: productDistribution,
		TotalPersonalVolume: totalPersonalVolume,
		TotalTeamVolume:     totalTeamVolume,
		AverageTeamVolume:   averageTeamVolume,
	}
}
