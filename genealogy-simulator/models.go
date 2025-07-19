package main

import (
	"time"
)

// GenealogyType represents a genealogy structure type
type GenealogyType struct {
	ID                 int                    `json:"id"`
	Name               string                 `json:"name"`
	Description        string                 `json:"description"`
	MaxChildrenPerNode int                    `json:"max_children_per_node"`
	Rules              map[string]interface{} `json:"rules"`
	IsActive           bool                   `json:"is_active"`
	CreatedAt          time.Time              `json:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at"`
}

// GenealogyNode represents a node in the genealogy tree
type GenealogyNode struct {
	ID              int       `json:"id"`
	UserID          int       `json:"user_id"`
	GenealogyTypeID int       `json:"genealogy_type_id"`
	ParentID        *int      `json:"parent_id"`
	LeftBound       int       `json:"left_bound"`
	RightBound      int       `json:"right_bound"`
	Depth           int       `json:"depth"`
	Position        string    `json:"position"`
	SimulationID    *string   `json:"simulation_id"`
	PayoutCycle     int       `json:"payout_cycle"`
	CyclePosition   int       `json:"cycle_position"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// SimulationRequest represents the request for genealogy simulation
type SimulationRequest struct {
	GenealogyTypeID  int    `json:"genealogy_type_id"`
	MaxExpectedUsers int    `json:"max_expected_users"`
	PayoutCycleType  string `json:"payout_cycle_type"` // weekly, biweekly, monthly
	NumberOfCycles   int    `json:"number_of_cycles"`
	MaxChildrenCount int    `json:"max_children_count"`
}

// SimulationResponse represents the response from genealogy simulation
type SimulationResponse struct {
	SimulationID        string                 `json:"simulation_id"`
	GenealogyTypeID     int                    `json:"genealogy_type_id"`
	MaxExpectedUsers    int                    `json:"max_expected_users"`
	PayoutCycleType     string                 `json:"payout_cycle_type"`
	NumberOfCycles      int                    `json:"number_of_cycles"`
	UsersPerCycle       int                    `json:"users_per_cycle"`
	TotalNodesGenerated int                    `json:"total_nodes_generated"`
	Nodes               []GenealogyNode        `json:"nodes"`
	Cycles              []CycleData            `json:"cycles"`
	TreeStructure       map[string]interface{} `json:"tree_structure"`
	CreatedAt           time.Time              `json:"created_at"`
}

// CycleData represents data for each payout cycle
type CycleData struct {
	CycleNumber  int             `json:"cycle_number"`
	StartUser    int             `json:"start_user"`
	EndUser      int             `json:"end_user"`
	UsersInCycle int             `json:"users_in_cycle"`
	NodesInCycle []GenealogyNode `json:"nodes_in_cycle"`
}

// TreeNode represents a node in the tree structure for visualization
type TreeNode struct {
	ID       int        `json:"id"`
	UserID   int        `json:"user_id"`
	Position string     `json:"position"`
	Children []TreeNode `json:"children"`
	Cycle    int        `json:"cycle"`
}

// BinaryPlanSimulator implements the binary plan logic
type BinaryPlanSimulator struct {
	simulationID  string
	nodes         []GenealogyNode
	nextLeftBound int
}

// NewBinaryPlanSimulator creates a new binary plan simulator
func NewBinaryPlanSimulator(simulationID string) *BinaryPlanSimulator {
	return &BinaryPlanSimulator{
		simulationID:  simulationID,
		nodes:         make([]GenealogyNode, 0),
		nextLeftBound: 1,
	}
}

// Simulate runs the binary plan simulation
func (b *BinaryPlanSimulator) Simulate(req SimulationRequest) SimulationResponse {
	usersPerCycle := req.MaxExpectedUsers / req.NumberOfCycles
	if req.MaxExpectedUsers%req.NumberOfCycles != 0 {
		usersPerCycle++
	}

	cycles := make([]CycleData, 0)
	totalNodes := 0

	for cycle := 1; cycle <= req.NumberOfCycles; cycle++ {
		cycleStartUser := totalNodes + 1
		cycleEndUser := cycleStartUser + usersPerCycle - 1
		if cycleEndUser > req.MaxExpectedUsers {
			cycleEndUser = req.MaxExpectedUsers
		}
		usersInCycle := cycleEndUser - cycleStartUser + 1

		cycleNodes := b.generateCycleNodes(cycle, cycleStartUser, cycleEndUser, req.GenealogyTypeID)
		totalNodes += len(cycleNodes)

		cycles = append(cycles, CycleData{
			CycleNumber:  cycle,
			StartUser:    cycleStartUser,
			EndUser:      cycleEndUser,
			UsersInCycle: usersInCycle,
			NodesInCycle: cycleNodes,
		})
	}

	treeStructure := b.buildTreeStructure()

	return SimulationResponse{
		SimulationID:        b.simulationID,
		GenealogyTypeID:     req.GenealogyTypeID,
		MaxExpectedUsers:    req.MaxExpectedUsers,
		PayoutCycleType:     req.PayoutCycleType,
		NumberOfCycles:      req.NumberOfCycles,
		UsersPerCycle:       usersPerCycle,
		TotalNodesGenerated: totalNodes,
		Nodes:               b.nodes,
		Cycles:              cycles,
		TreeStructure:       treeStructure,
		CreatedAt:           time.Now(),
	}
}

// generateCycleNodes generates nodes for a specific cycle
func (b *BinaryPlanSimulator) generateCycleNodes(cycle, startUser, endUser, genealogyTypeID int) []GenealogyNode {
	cycleNodes := make([]GenealogyNode, 0)

	for userID := startUser; userID <= endUser; userID++ {
		node := b.createNode(userID, genealogyTypeID, cycle, userID-startUser+1)
		cycleNodes = append(cycleNodes, node)
		b.nodes = append(b.nodes, node)
	}

	return cycleNodes
}

// createNode creates a new node with proper positioning
func (b *BinaryPlanSimulator) createNode(userID, genealogyTypeID, cycle, cyclePosition int) GenealogyNode {
	var parentID *int
	position := "left"
	depth := 0

	if len(b.nodes) > 0 {
		// Find the first node that has space for a child
		for i := range b.nodes {
			childrenCount := b.countChildren(b.nodes[i].ID)
			if childrenCount < 2 { // Binary plan max 2 children
				parentID = &b.nodes[i].ID
				if childrenCount == 1 {
					position = "right"
				}
				depth = b.nodes[i].Depth + 1
				break
			}
		}
	}

	leftBound := b.nextLeftBound
	rightBound := leftBound + 1
	b.nextLeftBound += 2

	node := GenealogyNode{
		UserID:          userID,
		GenealogyTypeID: genealogyTypeID,
		ParentID:        parentID,
		LeftBound:       leftBound,
		RightBound:      rightBound,
		Depth:           depth,
		Position:        position,
		SimulationID:    &b.simulationID,
		PayoutCycle:     cycle,
		CyclePosition:   cyclePosition,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Assign a temporary ID for this simulation
	node.ID = len(b.nodes) + 1

	return node
}

// countChildren counts the number of children for a given node
func (b *BinaryPlanSimulator) countChildren(nodeID int) int {
	count := 0
	for _, node := range b.nodes {
		if node.ParentID != nil && *node.ParentID == nodeID {
			count++
		}
	}
	return count
}

// buildTreeStructure builds a tree structure for visualization
func (b *BinaryPlanSimulator) buildTreeStructure() map[string]interface{} {
	if len(b.nodes) == 0 {
		return map[string]interface{}{}
	}

	// Find root node (node without parent)
	var rootNode *GenealogyNode
	for i := range b.nodes {
		if b.nodes[i].ParentID == nil {
			rootNode = &b.nodes[i]
			break
		}
	}

	if rootNode == nil {
		return map[string]interface{}{}
	}

	tree := b.buildTreeNode(*rootNode)
	return map[string]interface{}{
		"root":        tree,
		"total_nodes": len(b.nodes),
	}
}

// buildTreeNode recursively builds the tree structure
func (b *BinaryPlanSimulator) buildTreeNode(node GenealogyNode) TreeNode {
	children := make([]TreeNode, 0)

	for i := range b.nodes {
		if b.nodes[i].ParentID != nil && *b.nodes[i].ParentID == node.ID {
			child := b.buildTreeNode(b.nodes[i])
			children = append(children, child)
		}
	}

	return TreeNode{
		ID:       node.ID,
		UserID:   node.UserID,
		Position: node.Position,
		Children: children,
		Cycle:    node.PayoutCycle,
	}
}
