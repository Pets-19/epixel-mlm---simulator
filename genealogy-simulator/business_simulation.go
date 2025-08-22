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
	ID                   string             `json:"id"`
	Name                 string             `json:"name"`
	Email                string             `json:"email"`
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
	CalculationMethodology  string                          `json:"calculation_methodology"`
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

// TeamVolumeDetail shows how team volume was calculated for each user
type TeamVolumeDetail struct {
	UserID          string                     `json:"user_id"`
	UserName        string                     `json:"user_name"`
	DirectDownline  []string                   `json:"direct_downline"`
	TotalDownline   int                        `json:"total_downline"`
	DownlineVolumes map[string]float64         `json:"downline_volumes"`
	Calculation     string                     `json:"calculation"`
	VolumeBreakdown map[string]VolumeBreakdown `json:"volume_breakdown"`
}

// VolumeBreakdown shows volume breakdown by level
type VolumeBreakdown struct {
	Level  int     `json:"level"`
	Users  int     `json:"users"`
	Volume float64 `json:"volume"`
}

// LegVolumeDetail shows how leg volume was calculated for each user
type LegVolumeDetail struct {
	UserID       string                  `json:"user_id"`
	UserName     string                  `json:"user_name"`
	LegStructure map[string]LegStructure `json:"leg_structure"`
	Calculation  string                  `json:"calculation"`
}

// LegStructure shows the structure of each leg
type LegStructure struct {
	LegKey         string            `json:"leg_key"`
	DirectChildren []string          `json:"direct_children"`
	TotalUsers     int               `json:"total_users"`
	TotalVolume    float64           `json:"total_volume"`
	LevelBreakdown map[int]LevelData `json:"level_breakdown"`
}

// LevelData shows data for each level in a leg
type LevelData struct {
	Level  int     `json:"level"`
	Users  int     `json:"users"`
	Volume float64 `json:"volume"`
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
			TeamLegVolumes:    make(map[string]float64),
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
	volumeCalculations := generateVolumeCalculations(users, req.Products, req.GenealogyType)

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
func calculateVolumes(users []SimulationUser, genealogyType string) {
	log.Printf("Calculating volumes for %d users", len(users))

	// Personal volumes are already set during product assignment

	// Calculate team volumes (unlimited genealogy levels) and leg-specific volumes
	for i := range users {
		users[i].TeamVolume = calculateTeamVolume(users[i].ID, users)
		users[i].TeamLegVolumes = calculateTeamLegVolumes(users[i].ID, users, genealogyType)
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

// calculateTeamLegVolumes calculates team volume for each leg of a user
func calculateTeamLegVolumes(userID string, users []SimulationUser, genealogyType string) map[string]float64 {
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

	// Calculate volume for each leg
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
			legVolumes[legKey] = calculateLegVolume(childID, users, genealogyType)
		}
	}

	return legVolumes
}

// calculateLegVolume calculates volume for a specific leg
func calculateLegVolume(userID string, users []SimulationUser, genealogyType string) float64 {
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

	// Recursively calculate volume for all downline in this leg
	for _, childID := range user.Children {
		legVolume += calculateLegVolume(childID, users, genealogyType)
	}

	return legVolume
}

// calculateLegVolumeSummary calculates summary statistics for all legs
func calculateLegVolumeSummary(users []SimulationUser) map[string]LegVolumeData {
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

	return legSummary
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
	legVolumeSummary := calculateLegVolumeSummary(users)

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
func generateVolumeCalculations(users []SimulationUser, products []BusinessProduct, genealogyType string) VolumeCalculations {
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
			volumeBreakdown[fmt.Sprintf("level_%d", level)] = VolumeBreakdown{
				Level:  data.Level,
				Users:  data.Users,
				Volume: data.Volume,
			}
		}

		teamDetail := TeamVolumeDetail{
			UserID:          user.ID,
			UserName:        user.Name,
			DirectDownline:  directDownline,
			TotalDownline:   totalDownline,
			DownlineVolumes: downlineVolumes,
			Calculation:     fmt.Sprintf("Team Volume = Sum of all downline Personal Volumes = $%.2f", user.TeamVolume),
			VolumeBreakdown: volumeBreakdown,
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
				LegKey:         legKey,
				DirectChildren: directChildren,
				TotalUsers:     totalUsers,
				TotalVolume:    legVolume,
				LevelBreakdown: levelBreakdown,
			}
		}

		legDetail := LegVolumeDetail{
			UserID:       user.ID,
			UserName:     user.Name,
			LegStructure: legStructure,
			Calculation:  fmt.Sprintf("Leg Volume = Sum of Personal Volumes in specific leg = %v", user.TeamLegVolumes),
		}

		legVolumeBreakdown[user.ID] = legDetail
	}

	// Generate calculation methodology
	methodology := fmt.Sprintf(`
		Volume Calculation Methodology for %s Genealogy:
		
		1. Personal Volume: Commissionable Volume of products purchased by each user
		2. Team Volume: Sum of Personal Volumes from all downline users (unlimited genealogy levels)
		3. Leg Volume: Sum of Personal Volumes from users in specific legs (left/right for binary, leg-1/leg-2/etc for unilevel/matrix)
		
		All calculations are performed recursively through the genealogy tree structure.
	`, genealogyType)

	return VolumeCalculations{
		PersonalVolumeBreakdown: personalVolumeBreakdown,
		TeamVolumeBreakdown:     teamVolumeBreakdown,
		LegVolumeBreakdown:      legVolumeBreakdown,
		CalculationMethodology:  methodology,
	}
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
