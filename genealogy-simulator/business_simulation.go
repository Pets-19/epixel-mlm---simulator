package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
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

// SimulationUser represents a user in the business simulation
type SimulationUser struct {
	ID                   string             `json:"id"`
	Name                 string             `json:"name"`
	Level                int                `json:"level"`
	ParentID             *string            `json:"parent_id,omitempty"`
	Children             []string           `json:"children"`
	GenealogyPosition    string             `json:"genealogy_position"`
	ProductID            *int               `json:"product_id,omitempty"`
	ProductName          *string            `json:"product_name,omitempty"`
	PersonalVolume       float64            `json:"personal_volume"`
	TeamVolume           float64            `json:"team_volume"`
	TeamLegVolumes       map[string]float64 `json:"team_leg_volumes"`
	CommissionableVolume float64            `json:"commissionable_volume"`
	PayoutCycle          int                `json:"payout_cycle"`
	CreatedAt            time.Time          `json:"created_at"`
	GenealogyNode        *GenealogyNode     `json:"genealogy_node,omitempty"`
	// Enhanced cycle-specific volume tracking
	PersonalVolumePerCycle   map[int]float64            `json:"personal_volume_per_cycle"`
	LegVolumePerCycle        map[string]map[int]float64 `json:"leg_volume_per_cycle"`
	TeamVolumePerCycle       map[int]float64            `json:"team_volume_per_cycle"`
	VolumeGenerationPerCycle map[int]VolumeGeneration   `json:"volume_generation_per_cycle"`
}

// BusinessSimulationRequest represents the enhanced simulation request
type BusinessSimulationRequest struct {
	GenealogyType        string            `json:"genealogy_type"`
	MaxExpectedUsers     int               `json:"max_expected_users"`
	PayoutCycle          string            `json:"payout_cycle"`
	NumberOfPayoutCycles int               `json:"number_of_payout_cycles"`
	MaxChildrenCount     int               `json:"max_children_count"`
	PayoutCap            float64           `json:"payout_cap"`
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
	VolumeCalculations   VolumeCalculations  `json:"volume_calculations"`
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
	LegVolumeSummary    map[string]LegVolumeData           `json:"leg_volume_summary"`
}

// LegVolumeData represents volume data for each leg
type LegVolumeData struct {
	TotalVolume   float64 `json:"total_volume"`
	UserCount     int     `json:"user_count"`
	AverageVolume float64 `json:"average_volume"`
	MaxVolume     float64 `json:"max_volume"`
	MinVolume     float64 `json:"min_volume"`
}

// ProductDistributionData represents product distribution statistics
type ProductDistributionData struct {
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// VolumeCalculations provides detailed breakdown of volume calculations
type VolumeCalculations struct {
	PersonalVolumeBreakdown map[string]PersonalVolumeDetail `json:"personal_volume_breakdown"`
	TeamVolumeBreakdown     map[string]TeamVolumeDetail     `json:"team_volume_breakdown"`
	LegVolumeBreakdown      map[string]LegVolumeDetail      `json:"leg_volume_breakdown"`
	VolumeByPayoutCycle     map[int]PayoutCycleVolume       `json:"volume_by_payout_cycle"`
	CalculationMethodology  string                          `json:"calculation_methodology"`
}

// PayoutCycleVolume shows volume breakdown by payout cycle
type PayoutCycleVolume struct {
	CycleNumber         int                                 `json:"cycle_number"`
	UsersGenerated      int                                 `json:"users_generated"`
	PersonalVolume      float64                             `json:"personal_volume"`
	TeamVolume          float64                             `json:"team_volume"`
	LegVolumes          map[string]float64                  `json:"leg_volumes"`
	ProductDistribution map[string]ProductCycleDistribution `json:"product_distribution"`
	LevelBreakdown      map[int]LevelVolumeData             `json:"level_breakdown"`
	CycleSummary        string                              `json:"cycle_summary"`

	// Binary Plan Specifics
	CarryForwardLeft  float64 `json:"carry_forward_left"`
	CarryForwardRight float64 `json:"carry_forward_right"`
	MatchedVolume     float64 `json:"matched_volume"`
	PayoutVolume      float64 `json:"payout_volume"`
	CapFlush          float64 `json:"cap_flush"`
}

// ProductCycleDistribution shows product distribution within a cycle
type ProductCycleDistribution struct {
	ProductName          string  `json:"product_name"`
	UsersCount           int     `json:"users_count"`
	TotalVolume          float64 `json:"total_volume"`
	Percentage           float64 `json:"percentage"`
	AverageVolumePerUser float64 `json:"average_volume_per_user"`
}

// LevelVolumeData shows volume data for each level within a cycle
type LevelVolumeData struct {
	Level         int     `json:"level"`
	UsersCount    int     `json:"users_count"`
	TotalVolume   float64 `json:"total_volume"`
	AverageVolume float64 `json:"average_volume"`
	MaxVolume     float64 `json:"max_volume"`
	MinVolume     float64 `json:"min_volume"`
}

// PersonalVolumeDetail shows how personal volume was calculated for each user
type PersonalVolumeDetail struct {
	UserID               string  `json:"user_id"`
	UserName             string  `json:"user_name"`
	ProductID            *int    `json:"product_id,omitempty"`
	ProductName          *string `json:"product_name,omitempty"`
	ProductPrice         float64 `json:"product_price"`
	CommissionableVolume float64 `json:"commissionable_volume"`
	Calculation          string  `json:"calculation"`
}

// Enhanced volume calculation with cycle attribution
type VolumeWithCycleAttribution struct {
	TotalVolume            float64                    `json:"total_volume"`
	CycleBreakdown         map[int]float64            `json:"cycle_breakdown"`
	PersonalVolumePerCycle map[int]float64            `json:"personal_volume_per_cycle"`
	LegVolumePerCycle      map[string]map[int]float64 `json:"leg_volume_per_cycle"`
	TeamVolumePerCycle     map[int]float64            `json:"team_volume_per_cycle"`
	Calculation            string                     `json:"calculation"`
}

// Enhanced team volume detail with cycle attribution
type TeamVolumeDetail struct {
	UserID           string                     `json:"user_id"`
	UserName         string                     `json:"user_name"`
	DirectDownline   []string                   `json:"direct_downline"`
	TotalDownline    int                        `json:"total_downline"`
	DownlineVolumes  map[string]float64         `json:"downline_volumes"`
	Calculation      string                     `json:"calculation"`
	VolumeBreakdown  map[string]VolumeBreakdown `json:"volume_breakdown"`
	CycleAttribution VolumeWithCycleAttribution `json:"cycle_attribution"`
}

// VolumeBreakdown shows volume breakdown by level
type VolumeBreakdown struct {
	Level  int     `json:"level"`
	Users  int     `json:"users"`
	Volume float64 `json:"volume"`
}

// LegVolumeDetail shows how leg volume was calculated for each user
type LegVolumeDetail struct {
	UserID           string                                `json:"user_id"`
	UserName         string                                `json:"user_name"`
	LegStructure     map[string]LegStructure               `json:"leg_structure"`
	Calculation      string                                `json:"calculation"`
	CycleAttribution map[string]VolumeWithCycleAttribution `json:"cycle_attribution"`
}

// LegStructure shows the structure of each leg
type LegStructure struct {
	LegKey           string                     `json:"leg_key"`
	DirectChildren   []string                   `json:"direct_children"`
	TotalUsers       int                        `json:"total_users"`
	TotalVolume      float64                    `json:"total_volume"`
	LevelBreakdown   map[int]LevelData          `json:"level_breakdown"`
	CycleAttribution VolumeWithCycleAttribution `json:"cycle_attribution"`
}

// LevelData shows data for each level in a leg
type LevelData struct {
	Level  int     `json:"level"`
	Users  int     `json:"users"`
	Volume float64 `json:"volume"`
}

// VolumeGeneration tracks volume generated in each cycle
type VolumeGeneration struct {
	PersonalVolume float64            `json:"personal_volume"`
	LegVolumes     map[string]float64 `json:"leg_volumes"`
	TeamVolume     float64            `json:"team_volume"`
	Source         string             `json:"source"` // "enrollment", "purchase", "downline"
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
	log.Printf("Genealogy type name from DB: %s", genealogyType.Name)

	var simResponse SimulationResponse
	genealogyTypeLower := strings.ToLower(genealogyType.Name)

	// Match genealogy type - support both "binary" and "binary plan" formats
	// Also fallback to max_children_per_node for custom named types
	switch {
	case strings.Contains(genealogyTypeLower, "binary"):
		simulator := NewBinaryPlanSimulator(simulationID)
		simResponse = simulator.Simulate(simReq)
	case strings.Contains(genealogyTypeLower, "unilevel"):
		simulator := NewUnilevelPlanSimulator(simulationID, req.MaxChildrenCount)
		simResponse = simulator.Simulate(simReq)
	case strings.Contains(genealogyTypeLower, "matrix"):
		simulator := NewMatrixPlanSimulator(simulationID, req.MaxChildrenCount)
		simResponse = simulator.Simulate(simReq)
	default:
		// Fallback: Use max_children_per_node to determine plan type
		// 2 children = binary-like, >2 = matrix-like
		log.Printf("Custom genealogy type '%s', using max_children_per_node=%d to determine plan type", genealogyType.Name, req.MaxChildrenCount)
		if req.MaxChildrenCount <= 2 {
			simulator := NewBinaryPlanSimulator(simulationID)
			simResponse = simulator.Simulate(simReq)
		} else {
			simulator := NewMatrixPlanSimulator(simulationID, req.MaxChildrenCount)
			simResponse = simulator.Simulate(simReq)
		}
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
			Level:             node.Depth,
			ParentID:          parentID,
			Children:          make([]string, 0),
			GenealogyPosition: node.Position,
			PayoutCycle:       node.PayoutCycle,
			CreatedAt:         node.CreatedAt,
			GenealogyNode:     &node,
			TeamLegVolumes:    make(map[string]float64),
			// Initialize new fields
			PersonalVolumePerCycle:   make(map[int]float64),
			LegVolumePerCycle:        make(map[string]map[int]float64),
			TeamVolumePerCycle:       make(map[int]float64),
			VolumeGenerationPerCycle: make(map[int]VolumeGeneration),
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
	calculateVolumes(users, req.GenealogyType)

	// Generate simulation summary
	summary := generateSimulationSummary(users, req.Products, req.NumberOfPayoutCycles)

	// Generate volume calculations breakdown
	volumeCalculations := generateVolumeCalculations(users, req.Products, req.GenealogyType, req.PayoutCap)

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
		VolumeCalculations:   volumeCalculations,
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

		// Set personal volume per cycle (attributed to enrollment cycle)
		user.PersonalVolumePerCycle[user.PayoutCycle] = product.BusinessVolume

		// Initialize volume generation for this cycle
		user.VolumeGenerationPerCycle[user.PayoutCycle] = VolumeGeneration{
			PersonalVolume: product.BusinessVolume,
			LegVolumes:     make(map[string]float64),
			TeamVolume:     0.0, // Will be calculated later
			Source:         "enrollment",
		}
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

// calculateVolumes calculates personal and team volumes for all users with cycle attribution
func calculateVolumes(users []SimulationUser, genealogyType string) {
	log.Printf("Calculating volumes for %d users with cycle attribution", len(users))

	// Personal volumes are already set during product assignment

	// Initialize cycle-specific volume fields for all users
	for i := range users {
		// Initialize maps if they don't exist
		if users[i].PersonalVolumePerCycle == nil {
			users[i].PersonalVolumePerCycle = make(map[int]float64)
		}
		if users[i].LegVolumePerCycle == nil {
			users[i].LegVolumePerCycle = make(map[string]map[int]float64)
		}
		if users[i].TeamVolumePerCycle == nil {
			users[i].TeamVolumePerCycle = make(map[int]float64)
		}
		if users[i].VolumeGenerationPerCycle == nil {
			users[i].VolumeGenerationPerCycle = make(map[int]VolumeGeneration)
		}

		// Initialize leg volume per cycle maps
		legKeys := getLegKeys(genealogyType)
		for _, legKey := range legKeys {
			if users[i].LegVolumePerCycle[legKey] == nil {
				users[i].LegVolumePerCycle[legKey] = make(map[int]float64)
			}
		}
	}

	// Calculate team volumes (unlimited genealogy levels) and leg-specific volumes with cycle attribution
	for i := range users {
		users[i].TeamVolume = calculateTeamVolumeWithCycleAttribution(users[i].ID, users)
		users[i].TeamLegVolumes = calculateTeamLegVolumesWithCycleAttribution(users[i].ID, users, genealogyType)
	}

	log.Println("Enhanced volume calculations with cycle attribution completed")
}

// calculateTeamVolumeWithCycleAttribution calculates team volume with cycle attribution
func calculateTeamVolumeWithCycleAttribution(userID string, users []SimulationUser) float64 {
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

	// Recursively calculate team volume from unlimited downline levels
	for _, childID := range user.Children {
		for i := range users {
			if users[i].ID == childID {
				teamVolume += users[i].PersonalVolume
				teamVolume += calculateTeamVolumeWithCycleAttribution(childID, users)
				break
			}
		}
	}

	return teamVolume
}

// calculateTeamLegVolumesWithCycleAttribution calculates team volume for each leg with cycle attribution
func calculateTeamLegVolumesWithCycleAttribution(userID string, users []SimulationUser, genealogyType string) map[string]float64 {
	legVolumes := make(map[string]float64)

	// Initialize leg volumes based on genealogy type
	switch genealogyType {
	case "binary":
		legVolumes["left"] = 0.0
		legVolumes["right"] = 0.0
	case "unilevel", "matrix":
		// For unilevel/matrix, create legs based on average children per node
		legVolumes["leg-1"] = 0.0
		legVolumes["leg-2"] = 0.0
		legVolumes["leg-3"] = 0.0
		legVolumes["leg-4"] = 0.0
		legVolumes["leg-5"] = 0.0
	default:
		return legVolumes
	}

	// Find the user
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil || len(user.Children) == 0 {
		return legVolumes
	}

	// Calculate volume for each leg with unlimited level traversal
	for i, childID := range user.Children {
		var legKey string

		switch genealogyType {
		case "binary":
			if i == 0 {
				legKey = "left"
			} else {
				legKey = "right"
			}
		case "unilevel", "matrix":
			legKey = fmt.Sprintf("leg-%d", i+1)
		}

		if legKey != "" {
			legVolumes[legKey] = calculateLegVolumeWithCycleAttribution(childID, users, genealogyType)

			// Calculate leg volume per cycle for this user
			legVolumePerCycle := calculateLegVolumeWithCycleBreakdown(childID, users, genealogyType, legKey)
			if user.LegVolumePerCycle[legKey] == nil {
				user.LegVolumePerCycle[legKey] = make(map[int]float64)
			}

			// Distribute leg volume across cycles
			for cycle, volume := range legVolumePerCycle.CycleBreakdown {
				user.LegVolumePerCycle[legKey][cycle] += volume
			}
		}
	}

	return legVolumes
}

// calculateLegVolumeWithCycleAttribution calculates volume for a specific leg with unlimited levels
func calculateLegVolumeWithCycleAttribution(userID string, users []SimulationUser, genealogyType string) float64 {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return 0
	}

	legVolume := user.PersonalVolume

	// Recursively calculate volume for all downline in this leg (unlimited levels)
	for _, childID := range user.Children {
		legVolume += calculateLegVolumeWithCycleAttribution(childID, users, genealogyType)
	}

	return legVolume
}

// calculateTeamVolumeWithCycleBreakdown calculates team volume with detailed cycle breakdown
func calculateTeamVolumeWithCycleBreakdown(userID string, users []SimulationUser) VolumeWithCycleAttribution {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return VolumeWithCycleAttribution{
			TotalVolume:    0.0,
			CycleBreakdown: make(map[int]float64),
			Calculation:    "No downline users",
		}
	}

	// calculateDownlineVolumeWithCycleAttribution now includes the current user's personal volume
	// So we get the complete volume breakdown directly
	totalVolume, cycleBreakdown := calculateDownlineVolumeWithCycleAttribution(userID, users, 0)

	// Get the user to access cycle-specific volume data
	var currentUser *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			currentUser = &users[i]
			break
		}
	}

	calculation := fmt.Sprintf("Team Volume = Personal Volume + Sum of all downline Personal Volumes at unlimited levels = $%.2f", totalVolume)
	if len(cycleBreakdown) > 0 {
		cycleDetails := make([]string, 0)
		for cycle, volume := range cycleBreakdown {
			cycleDetails = append(cycleDetails, fmt.Sprintf("Cycle %d: $%.2f", cycle, volume))
		}
		calculation += fmt.Sprintf(" (Breakdown: %s)", strings.Join(cycleDetails, ", "))
	}

	return VolumeWithCycleAttribution{
		TotalVolume:            totalVolume,
		CycleBreakdown:         cycleBreakdown,
		PersonalVolumePerCycle: currentUser.PersonalVolumePerCycle,
		LegVolumePerCycle:      currentUser.LegVolumePerCycle,
		TeamVolumePerCycle:     currentUser.TeamVolumePerCycle,
		Calculation:            calculation,
	}
}

// calculateDownlineVolumeWithCycleAttribution calculates downline volume with cycle attribution
func calculateDownlineVolumeWithCycleAttribution(userID string, users []SimulationUser, depth int) (float64, map[int]float64) {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return 0.0, make(map[int]float64)
	}

	totalVolume := user.PersonalVolume // Include current user's personal volume
	cycleBreakdown := make(map[int]float64)

	// Add current user's personal volume to cycle breakdown (attributed to enrollment cycle)
	cycle := user.PayoutCycle
	if cycle > 0 {
		cycleBreakdown[cycle] += user.PersonalVolume
		// Update user's cycle-specific team volume
		user.TeamVolumePerCycle[cycle] = user.PersonalVolume
	} else if depth == 0 {
		// For root user (level 0), don't artificially assign personal volume to cycle 1
		// Instead, let the downline volume determine the cycle distribution
		// The root user's team volume will be distributed across cycles where downline users are active
	}

	// Recursively calculate from all children (unlimited levels)
	for _, childID := range user.Children {
		childVolume, childCycleBreakdown := calculateDownlineVolumeWithCycleAttribution(childID, users, depth+1)
		totalVolume += childVolume

		// Merge cycle breakdowns from all downline users
		for cycle, volume := range childCycleBreakdown {
			cycleBreakdown[cycle] += volume
			// Update user's cycle-specific team volume
			user.TeamVolumePerCycle[cycle] += volume
		}
	}

	// For root user (depth 0), if they have no personal volume but have downline volume,
	// distribute their team volume across the cycles where downline users are active
	if depth == 0 && user.PersonalVolume == 0 && len(cycleBreakdown) > 0 {
		// Calculate total downline volume
		totalDownlineVolume := 0.0
		for _, volume := range cycleBreakdown {
			totalDownlineVolume += volume
		}

		// Distribute the team volume proportionally across cycles
		if totalDownlineVolume > 0 {
			for cycle, volume := range cycleBreakdown {
				// Calculate what percentage of total downline volume this cycle represents
				cyclePercentage := volume / totalDownlineVolume
				// Distribute the team volume proportionally
				cycleBreakdown[cycle] = volume + (totalDownlineVolume * cyclePercentage)
				// Update user's cycle-specific team volume
				user.TeamVolumePerCycle[cycle] = cycleBreakdown[cycle]
			}
		}
	}

	return totalVolume, cycleBreakdown
}

// calculateLegVolumeWithCycleBreakdown calculates leg volume with detailed cycle breakdown
func calculateLegVolumeWithCycleBreakdown(userID string, users []SimulationUser, genealogyType string, legKey string) VolumeWithCycleAttribution {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return VolumeWithCycleAttribution{
			TotalVolume:    0.0,
			CycleBreakdown: make(map[int]float64),
			Calculation:    "User not found",
		}
	}

	// Find direct children for this leg
	var legChildren []string
	switch genealogyType {
	case "binary":
		if legKey == "left" && len(user.Children) > 0 {
			legChildren = []string{user.Children[0]}
		} else if legKey == "right" && len(user.Children) > 1 {
			legChildren = []string{user.Children[1]}
		}
	case "unilevel", "matrix":
		// For unilevel/matrix, assign children to legs based on position
		legIndex := 0
		if strings.HasPrefix(legKey, "leg-") {
			fmt.Sscanf(legKey, "leg-%d", &legIndex)
			legIndex-- // Convert to 0-based index
		}
		if legIndex >= 0 && legIndex < len(user.Children) {
			legChildren = []string{user.Children[legIndex]}
		}
	}

	if len(legChildren) == 0 {
		return VolumeWithCycleAttribution{
			TotalVolume:    0.0,
			CycleBreakdown: make(map[int]float64),
			Calculation:    fmt.Sprintf("No users in %s leg", legKey),
		}
	}

	// Calculate leg volume with cycle attribution
	totalVolume := 0.0
	cycleBreakdown := make(map[int]float64)

	// Initialize leg volume per cycle for the current user
	if user.LegVolumePerCycle[legKey] == nil {
		user.LegVolumePerCycle[legKey] = make(map[int]float64)
	}

	for _, childID := range legChildren {
		childVolume, childCycleBreakdown := calculateDownlineVolumeWithCycleAttribution(childID, users, 0)
		totalVolume += childVolume

		// Merge cycle breakdowns
		for cycle, volume := range childCycleBreakdown {
			cycleBreakdown[cycle] += volume
			// Update user's leg volume per cycle
			user.LegVolumePerCycle[legKey][cycle] += volume
		}
	}

	calculation := fmt.Sprintf("Leg Volume = Sum of Personal Volumes in %s leg at unlimited levels = $%.2f", legKey, totalVolume)
	if len(cycleBreakdown) > 0 {
		cycleDetails := make([]string, 0)
		for cycle, volume := range cycleBreakdown {
			cycleDetails = append(cycleDetails, fmt.Sprintf("Cycle %d: $%.2f", cycle, volume))
		}
		calculation += fmt.Sprintf(" (Breakdown: %s)", strings.Join(cycleDetails, ", "))
	}

	// Get the user to access cycle-specific volume data
	var currentUser *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			currentUser = &users[i]
			break
		}
	}

	return VolumeWithCycleAttribution{
		TotalVolume:            totalVolume,
		CycleBreakdown:         cycleBreakdown,
		PersonalVolumePerCycle: currentUser.PersonalVolumePerCycle,
		LegVolumePerCycle:      currentUser.LegVolumePerCycle,
		TeamVolumePerCycle:     currentUser.TeamVolumePerCycle,
		Calculation:            calculation,
	}
}

// calculateLegVolumeSummary calculates summary statistics for all legs with product analysis
func calculateLegVolumeSummary(users []SimulationUser, products []BusinessProduct) map[string]LegVolumeData {
	legSummary := make(map[string]LegVolumeData)

	// Initialize leg data structures
	legs := []string{"left", "right", "leg-1", "leg-2", "leg-3", "leg-4", "leg-5"}
	for _, leg := range legs {
		legSummary[leg] = LegVolumeData{
			TotalVolume:   0.0,
			UserCount:     0,
			AverageVolume: 0.0,
			MaxVolume:     0.0,
			MinVolume:     0.0,
		}
	}

	// Collect data for each leg
	for _, user := range users {
		for legName, legVolume := range user.TeamLegVolumes {
			if legData, exists := legSummary[legName]; exists {
				legData.TotalVolume += legVolume
				legData.UserCount++

				if legVolume > legData.MaxVolume {
					legData.MaxVolume = legVolume
				}

				if legData.MinVolume == 0 || legVolume < legData.MinVolume {
					legData.MinVolume = legVolume
				}

				legSummary[legName] = legData
			}
		}
	}

	// Calculate averages
	for legName, legData := range legSummary {
		if legData.UserCount > 0 {
			legData.AverageVolume = legData.TotalVolume / float64(legData.UserCount)
			legSummary[legName] = legData
		}
	}

	// Enhanced analysis: Log product distribution impact on leg volumes
	if len(products) > 0 {
		log.Printf("Leg volume summary calculated for %d legs with %d product types", len(legSummary), len(products))
		for legName, legData := range legSummary {
			if legData.UserCount > 0 {
				log.Printf("Leg %s: %d users, total volume: $%.2f, avg volume: $%.2f",
					legName, legData.UserCount, legData.TotalVolume, legData.AverageVolume)
			}
		}
	}

	return legSummary
}

// generateSimulationSummary generates comprehensive simulation analytics
func generateSimulationSummary(users []SimulationUser, products []BusinessProduct, numberOfCycles int) SimulationSummary {
	log.Println("Generating simulation summary")

	usersPerCycle := make(map[int]int)
	productDistribution := make(map[string]ProductDistributionData)

	// Count users per cycle and validate against expected cycles
	for _, user := range users {
		if user.PayoutCycle > 0 {
			usersPerCycle[user.PayoutCycle]++
		}
	}

	// Validate cycle distribution against expected number of cycles
	if numberOfCycles > 0 {
		log.Printf("Expected %d payout cycles, found users in cycles: %v", numberOfCycles, getKeys(usersPerCycle))

		// Check for any cycles beyond expected range
		for cycle := range usersPerCycle {
			if cycle > numberOfCycles {
				log.Printf("Warning: Found users in cycle %d, but only %d cycles were expected", cycle, numberOfCycles)
			}
		}
	}

	// Calculate product distribution
	usersWithProducts := make([]SimulationUser, 0)
	for _, user := range users {
		if user.ProductID != nil {
			usersWithProducts = append(usersWithProducts, user)
		}
	}

	// Calculate product distribution
	productCounts := make(map[string]int)
	for _, user := range usersWithProducts {
		if user.ProductName != nil {
			productCounts[*user.ProductName]++
		}
	}

	totalUsersWithProducts := len(usersWithProducts)
	for productName, count := range productCounts {
		percentage := 0.0
		if totalUsersWithProducts > 0 {
			percentage = float64(count) / float64(totalUsersWithProducts) * 100
		}
		productDistribution[productName] = ProductDistributionData{
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

	// Calculate leg volume summary
	legVolumeSummary := calculateLegVolumeSummary(users, products)

	// Enhanced cycle analysis using numberOfCycles parameter
	cycleAnalysis := fmt.Sprintf("Simulation configured for %d payout cycles", numberOfCycles)
	if len(usersPerCycle) > 0 {
		cycleAnalysis += fmt.Sprintf(", actual cycles with users: %d", len(usersPerCycle))
	}

	log.Printf("Simulation summary generated: %d users across %d cycles, %s",
		len(users), len(usersPerCycle), cycleAnalysis)

	return SimulationSummary{
		TotalUsersGenerated: len(users),
		UsersPerCycle:       usersPerCycle,
		ProductDistribution: productDistribution,
		TotalPersonalVolume: totalPersonalVolume,
		TotalTeamVolume:     totalTeamVolume,
		AverageTeamVolume:   averageTeamVolume,
		LegVolumeSummary:    legVolumeSummary,
	}
}

// generateVolumeCalculations generates detailed volume calculation breakdown
func generateVolumeCalculations(users []SimulationUser, products []BusinessProduct, genealogyType string, payoutCap float64) VolumeCalculations {
	log.Println("Generating volume calculations breakdown")

	personalVolumeBreakdown := make(map[string]PersonalVolumeDetail)
	teamVolumeBreakdown := make(map[string]TeamVolumeDetail)
	legVolumeBreakdown := make(map[string]LegVolumeDetail)

	// Generate personal volume breakdown
	for _, user := range users {
		personalDetail := PersonalVolumeDetail{
			UserID:               user.ID,
			UserName:             user.Name,
			ProductID:            user.ProductID,
			ProductName:          user.ProductName,
			ProductPrice:         0.0,
			CommissionableVolume: user.PersonalVolume,
			Calculation:          fmt.Sprintf("Personal Volume = Commissionable Volume of purchased product = $%.2f", user.PersonalVolume),
		}

		// Find product details
		if user.ProductID != nil {
			for _, product := range products {
				if product.ID == *user.ProductID {
					personalDetail.ProductPrice = product.ProductPrice
					break
				}
			}
		}

		personalVolumeBreakdown[user.ID] = personalDetail
	}

	// Generate team volume breakdown
	for _, user := range users {
		directDownline := user.Children
		totalDownline := countTotalDownline(user.ID, users)
		downlineVolumes := make(map[string]float64)
		volumeBreakdown := make(map[string]VolumeBreakdown)

		// Calculate downline volumes by level
		for _, childID := range user.Children {
			childVolume := calculateDownlineVolumeByLevel(childID, users, 1)
			downlineVolumes[childID] = childVolume
		}

		// Generate level breakdown
		levelBreakdown := calculateLevelBreakdown(user.ID, users)
		for level, data := range levelBreakdown {
			volumeBreakdown[fmt.Sprintf("level_%d", level)] = VolumeBreakdown(data)
		}

		teamDetail := TeamVolumeDetail{
			UserID:           user.ID,
			UserName:         user.Name,
			DirectDownline:   directDownline,
			TotalDownline:    totalDownline,
			DownlineVolumes:  downlineVolumes,
			Calculation:      fmt.Sprintf("Team Volume = Sum of all downline Personal Volumes = $%.2f", user.TeamVolume),
			VolumeBreakdown:  volumeBreakdown,
			CycleAttribution: calculateTeamVolumeWithCycleBreakdown(user.ID, users),
		}

		teamVolumeBreakdown[user.ID] = teamDetail
	}

	// Generate leg volume breakdown
	for _, user := range users {
		legStructure := make(map[string]LegStructure)

		for legKey, legVolume := range user.TeamLegVolumes {
			directChildren := getDirectChildrenForLeg(user.ID, users, legKey, genealogyType)
			totalUsers := countUsersInLeg(user.ID, users, legKey, genealogyType)
			levelBreakdown := calculateLegLevelBreakdown(user.ID, users, legKey, genealogyType)

			legStructure[legKey] = LegStructure{
				LegKey:           legKey,
				DirectChildren:   directChildren,
				TotalUsers:       totalUsers,
				TotalVolume:      legVolume,
				LevelBreakdown:   levelBreakdown,
				CycleAttribution: calculateLegVolumeWithCycleBreakdown(user.ID, users, genealogyType, legKey),
			}
		}

		legDetail := LegVolumeDetail{
			UserID:           user.ID,
			UserName:         user.Name,
			LegStructure:     legStructure,
			Calculation:      fmt.Sprintf("Leg Volume = Sum of Personal Volumes in specific leg = %v", user.TeamLegVolumes),
			CycleAttribution: make(map[string]VolumeWithCycleAttribution),
		}

		for legKey := range user.TeamLegVolumes {
			legDetail.CycleAttribution[legKey] = calculateLegVolumeWithCycleBreakdown(user.ID, users, genealogyType, legKey)
		}

		legVolumeBreakdown[user.ID] = legDetail
	}

	// Generate volume breakdown by payout cycle
	volumeByPayoutCycle := generateVolumeByPayoutCycle(users, products, genealogyType, payoutCap)

	// Generate calculation methodology
	methodology := fmt.Sprintf(`
		Volume Calculation Methodology for %s Genealogy:
		
		1. Personal Volume: Commissionable Volume of products purchased by each user
		2. Team Volume: Sum of Personal Volumes from all downline users (unlimited genealogy levels)
		3. Leg Volume: Sum of Personal Volumes from users in specific legs (left/right for binary, leg-1/leg-2/etc for unilevel/matrix)
		4. Payout Cycle Volume: Volume breakdown by payout cycle showing temporal distribution
		
		All calculations are performed recursively through the genealogy tree structure.
		Payout cycle analysis shows how business activity develops over time.
	`, genealogyType)

	return VolumeCalculations{
		PersonalVolumeBreakdown: personalVolumeBreakdown,
		TeamVolumeBreakdown:     teamVolumeBreakdown,
		LegVolumeBreakdown:      legVolumeBreakdown,
		VolumeByPayoutCycle:     volumeByPayoutCycle,
		CalculationMethodology:  methodology,
	}
}

// generateVolumeByPayoutCycle generates volume breakdown by payout cycle
func generateVolumeByPayoutCycle(users []SimulationUser, products []BusinessProduct, genealogyType string, payoutCap float64) map[int]PayoutCycleVolume {
	cycleVolumes := make(map[int]PayoutCycleVolume)

	// Group users by payout cycle
	usersByCycle := make(map[int][]SimulationUser)
	for _, user := range users {
		cycle := user.PayoutCycle
		if cycle > 0 {
			usersByCycle[cycle] = append(usersByCycle[cycle], user)
		}
	}

	// Track carry forward volumes for binary plan
	carryForwardLeft := 0.0
	carryForwardRight := 0.0

	// Get sorted cycles to ensure correct carry forward calculation
	cycles := getKeysForCycleMap(usersByCycle)
	// Simple bubble sort for cycles (num cycles is small)
	for i := 0; i < len(cycles)-1; i++ {
		for j := 0; j < len(cycles)-i-1; j++ {
			if cycles[j] > cycles[j+1] {
				cycles[j], cycles[j+1] = cycles[j+1], cycles[j]
			}
		}
	}

	// Ensure we process all cycles from 1 to max cycle found, even if some have no users
	maxCycle := 0
	if len(cycles) > 0 {
		maxCycle = cycles[len(cycles)-1]
	}

	// Find Root User (Level 0) for Team/Leg Analysis
	var rootUser *SimulationUser
	for i := range users {
		// Level 0 is consistently the root in this simulation
		if users[i].Level == 0 {
			rootUser = &users[i]
			break
		}
	}

	// Calculate volumes for each cycle
	for cycleNumber := 1; cycleNumber <= maxCycle; cycleNumber++ {
		cycleUsers := usersByCycle[cycleNumber]

		// Calculate personal volume for this cycle (Total Sales in Company/Tree)
		personalVolume := 0.0
		for _, user := range users {
			if user.PersonalVolumePerCycle[cycleNumber] > 0 {
				personalVolume += user.PersonalVolumePerCycle[cycleNumber]
			}
		}

		// Calculate team & leg volumes based on Root User (The Simulator)
		teamVolume := 0.0
		legVolumes := make(map[string]float64)
		legKeys := getLegKeys(genealogyType)
		for _, legKey := range legKeys {
			legVolumes[legKey] = 0.0
		}

		if rootUser != nil {
			// Team Volume
			if rootUser.TeamVolumePerCycle[cycleNumber] > 0 {
				teamVolume = rootUser.TeamVolumePerCycle[cycleNumber]
			}

			// Leg Volumes
			for _, legKey := range legKeys {
				if rootUser.LegVolumePerCycle[legKey] != nil && rootUser.LegVolumePerCycle[legKey][cycleNumber] > 0 {
					legVolumes[legKey] = rootUser.LegVolumePerCycle[legKey][cycleNumber]
				}
			}
		}

		// Calculate product distribution for this cycle
		productDistribution := calculateProductDistributionForCycle(cycleUsers, products)

		// Calculate level breakdown for this cycle
		levelBreakdown := calculateLevelBreakdownForCycle(cycleUsers)

		// Binary Plan Logic: Carry Forward & Capping
		var matchedVolume, cvPayoutVolume, capFlush, nextCarryLeft, nextCarryRight float64

		if genealogyType == "binary" {
			// Current Cycle Raw Volumes
			currentLeft := legVolumes["left"]
			currentRight := legVolumes["right"]

			// Adds Carry Forward
			totalLeft := currentLeft + carryForwardLeft
			totalRight := currentRight + carryForwardRight

			// Calculate Match
			if totalLeft < totalRight {
				matchedVolume = totalLeft
			} else {
				matchedVolume = totalRight
			}

			// Calculate New Carry Forward
			nextCarryLeft = totalLeft - matchedVolume
			nextCarryRight = totalRight - matchedVolume

			// Apply Payout Cap
			cvPayoutVolume = matchedVolume
			if payoutCap > 0 && matchedVolume > payoutCap {
				cvPayoutVolume = payoutCap
				capFlush = matchedVolume - payoutCap
			}

			// Update state for next cycle
			// Note: We use the calculates values for the *next* iteration
			// but we store the *current* carry forward (brought into this cycle)
			// or the *next*? Usually report shows "Carry Forward (Next)" or "Brought Forward".
			// Let's store "Carry Forward Left/Right" as the value *resulting* from this cycle
			// (available for next), matching "Carry Forward" terminology.
		}

		// Generate cycle summary
		cycleSummary := fmt.Sprintf(
			"Cycle %d: %d users generated, $%.2f personal volume, $%.2f team volume. "+
				"Products: %s. Leg performance: %s",
			cycleNumber,
			len(cycleUsers),
			personalVolume,
			teamVolume,
			formatProductSummary(productDistribution),
			formatLegSummary(legVolumes),
		)

		if genealogyType == "binary" {
			cycleSummary += fmt.Sprintf(". Binary: Matched $%.2f, Capped $%.2f, CF Left $%.2f, CF Right $%.2f",
				matchedVolume, cvPayoutVolume, nextCarryLeft, nextCarryRight)
		}

		cycleVolumes[cycleNumber] = PayoutCycleVolume{
			CycleNumber:         cycleNumber,
			UsersGenerated:      len(cycleUsers),
			PersonalVolume:      personalVolume,
			TeamVolume:          teamVolume,
			LegVolumes:          legVolumes,
			ProductDistribution: productDistribution,
			LevelBreakdown:      levelBreakdown,
			CycleSummary:        cycleSummary,
			// Binary Fields
			MatchedVolume:     matchedVolume,
			PayoutVolume:      cvPayoutVolume,
			CapFlush:          capFlush,
			CarryForwardLeft:  nextCarryLeft,
			CarryForwardRight: nextCarryRight,
		}

		// Update global carry forward for next iteration
		carryForwardLeft = nextCarryLeft
		carryForwardRight = nextCarryRight
	}

	return cycleVolumes
}

// calculateProductDistributionForCycle calculates product distribution within a specific cycle
func calculateProductDistributionForCycle(users []SimulationUser, products []BusinessProduct) map[string]ProductCycleDistribution {
	productStats := make(map[string]ProductCycleDistribution)

	// Initialize product stats
	for _, product := range products {
		productStats[product.ProductName] = ProductCycleDistribution{
			ProductName:          product.ProductName,
			UsersCount:           0,
			TotalVolume:          0.0,
			Percentage:           0.0,
			AverageVolumePerUser: 0.0,
		}
	}

	// Count users and volumes for each product
	totalUsers := len(users)
	for _, user := range users {
		if user.ProductName != nil {
			if stats, exists := productStats[*user.ProductName]; exists {
				stats.UsersCount++
				stats.TotalVolume += user.PersonalVolume
				productStats[*user.ProductName] = stats
			}
		}
	}

	// Calculate percentages and averages
	for productName, stats := range productStats {
		if totalUsers > 0 {
			stats.Percentage = float64(stats.UsersCount) / float64(totalUsers) * 100
		}
		if stats.UsersCount > 0 {
			stats.AverageVolumePerUser = stats.TotalVolume / float64(stats.UsersCount)
		}
		productStats[productName] = stats
	}

	return productStats
}

// calculateLevelBreakdownForCycle calculates level breakdown within a specific cycle
func calculateLevelBreakdownForCycle(users []SimulationUser) map[int]LevelVolumeData {
	levelData := make(map[int]LevelVolumeData)

	// Group users by level
	for _, user := range users {
		level := user.Level
		if _, exists := levelData[level]; !exists {
			levelData[level] = LevelVolumeData{
				Level:         level,
				UsersCount:    0,
				TotalVolume:   0.0,
				AverageVolume: 0.0,
				MaxVolume:     0.0,
				MinVolume:     0.0,
			}
		}

		levelInfo := levelData[level]
		levelInfo.UsersCount++
		levelInfo.TotalVolume += user.PersonalVolume

		if user.PersonalVolume > levelInfo.MaxVolume {
			levelInfo.MaxVolume = user.PersonalVolume
		}

		if levelInfo.MinVolume == 0 || user.PersonalVolume < levelInfo.MinVolume {
			levelInfo.MinVolume = user.PersonalVolume
		}

		levelData[level] = levelInfo
	}

	// Calculate averages
	for level, data := range levelData {
		if data.UsersCount > 0 {
			data.AverageVolume = data.TotalVolume / float64(data.UsersCount)
			levelData[level] = data
		}
	}

	return levelData
}

// getLegKeys returns the leg keys for a given genealogy type
func getLegKeys(genealogyType string) []string {
	switch genealogyType {
	case "binary":
		return []string{"left", "right"}
	case "unilevel", "matrix":
		return []string{"leg-1", "leg-2", "leg-3", "leg-4", "leg-5"}
	default:
		return []string{}
	}
}

// formatProductSummary formats product distribution for cycle summary
func formatProductSummary(productDistribution map[string]ProductCycleDistribution) string {
	var summaries []string
	for productName, stats := range productDistribution {
		if stats.UsersCount > 0 {
			summary := fmt.Sprintf("%s(%d users, $%.2f)", productName, stats.UsersCount, stats.TotalVolume)
			summaries = append(summaries, summary)
		}
	}
	return strings.Join(summaries, ", ")
}

// formatLegSummary formats leg volumes for cycle summary
func formatLegSummary(legVolumes map[string]float64) string {
	var summaries []string
	for legKey, volume := range legVolumes {
		if volume > 0 {
			summary := fmt.Sprintf("%s: $%.2f", legKey, volume)
			summaries = append(summaries, summary)
		}
	}
	return strings.Join(summaries, ", ")
}

// Helper functions for volume calculations
func countTotalDownline(userID string, users []SimulationUser) int {
	count := 0
	for _, user := range users {
		if user.ID == userID {
			for _, childID := range user.Children {
				count += 1 + countTotalDownline(childID, users)
			}
			break
		}
	}
	return count
}

func calculateDownlineVolumeByLevel(userID string, users []SimulationUser, level int) float64 {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return 0
	}

	volume := user.PersonalVolume
	for _, childID := range user.Children {
		volume += calculateDownlineVolumeByLevel(childID, users, level+1)
	}

	return volume
}

func calculateLevelBreakdown(userID string, users []SimulationUser) map[int]LevelData {
	levelData := make(map[int]LevelData)
	calculateLevelBreakdownRecursive(userID, users, 1, levelData)
	return levelData
}

func calculateLevelBreakdownRecursive(userID string, users []SimulationUser, level int, levelData map[int]LevelData) {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return
	}

	// Initialize level data if not exists
	if _, exists := levelData[level]; !exists {
		levelData[level] = LevelData{
			Level:  level,
			Users:  0,
			Volume: 0,
		}
	}

	// Update level data
	levelInfo := levelData[level]
	levelInfo.Users++
	levelInfo.Volume += user.PersonalVolume
	levelData[level] = levelInfo

	// Process children
	for _, childID := range user.Children {
		calculateLevelBreakdownRecursive(childID, users, level+1, levelData)
	}
}

func getDirectChildrenForLeg(userID string, users []SimulationUser, legKey string, genealogyType string) []string {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return []string{}
	}

	var legChildren []string
	for i, childID := range user.Children {
		var currentLegKey string
		switch genealogyType {
		case "binary":
			if i == 0 {
				currentLegKey = "left"
			} else {
				currentLegKey = "right"
			}
		case "unilevel", "matrix":
			currentLegKey = fmt.Sprintf("leg-%d", i+1)
		}

		if currentLegKey == legKey {
			legChildren = append(legChildren, childID)
		}
	}

	return legChildren
}

func countUsersInLeg(userID string, users []SimulationUser, legKey string, genealogyType string) int {
	count := 0
	countUsersInLegRecursive(userID, users, legKey, genealogyType, &count)
	return count
}

func countUsersInLegRecursive(userID string, users []SimulationUser, legKey string, genealogyType string, count *int) {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return
	}

	*count++

	for i, childID := range user.Children {
		var currentLegKey string
		switch genealogyType {
		case "binary":
			if i == 0 {
				currentLegKey = "left"
			} else {
				currentLegKey = "right"
			}
		case "unilevel", "matrix":
			currentLegKey = fmt.Sprintf("leg-%d", i+1)
		}

		if currentLegKey == legKey {
			countUsersInLegRecursive(childID, users, legKey, genealogyType, count)
		}
	}
}

func calculateLegLevelBreakdown(userID string, users []SimulationUser, legKey string, genealogyType string) map[int]LevelData {
	levelData := make(map[int]LevelData)
	calculateLegLevelBreakdownRecursive(userID, users, legKey, genealogyType, 1, levelData)
	return levelData
}

func calculateLegLevelBreakdownRecursive(userID string, users []SimulationUser, legKey string, genealogyType string, level int, levelData map[int]LevelData) {
	var user *SimulationUser
	for i := range users {
		if users[i].ID == userID {
			user = &users[i]
			break
		}
	}

	if user == nil {
		return
	}

	// Initialize level data if not exists
	if _, exists := levelData[level]; !exists {
		levelData[level] = LevelData{
			Level:  level,
			Users:  0,
			Volume: 0,
		}
	}

	// Update level data
	levelInfo := levelData[level]
	levelInfo.Users++
	levelInfo.Volume += user.PersonalVolume
	levelData[level] = levelInfo

	// Process children in this leg
	for i, childID := range user.Children {
		var currentLegKey string
		switch genealogyType {
		case "binary":
			if i == 0 {
				currentLegKey = "left"
			} else {
				currentLegKey = "right"
			}
		case "unilevel", "matrix":
			currentLegKey = fmt.Sprintf("leg-%d", i+1)
		}

		if currentLegKey == legKey {
			calculateLegLevelBreakdownRecursive(childID, users, legKey, genealogyType, level+1, levelData)
		}
	}
}

// getKeys returns the keys from a map as a slice
func getKeys(m map[int]int) []int {
	keys := make([]int, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// getKeysForCycleMap returns the keys from a map[int][]SimulationUser as a slice
func getKeysForCycleMap(m map[int][]SimulationUser) []int {
	keys := make([]int, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
