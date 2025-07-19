package main

import (
	"time"
)

// UnilevelPlanSimulator implements the unilevel plan logic
// No strict limit per parent, but MaxChildrenCount is used as an average for filling/spilling
// Uses nested set model for efficient tree operations

type UnilevelPlanSimulator struct {
	simulationID     string
	nodes            []GenealogyNode
	nextLeftBound    int
	maxChildrenCount int
}

func NewUnilevelPlanSimulator(simulationID string, maxChildrenCount int) *UnilevelPlanSimulator {
	return &UnilevelPlanSimulator{
		simulationID:     simulationID,
		nodes:            make([]GenealogyNode, 0),
		nextLeftBound:    1,
		maxChildrenCount: maxChildrenCount,
	}
}

func (u *UnilevelPlanSimulator) Simulate(req SimulationRequest) SimulationResponse {
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

		cycleNodes := u.generateCycleNodes(cycle, cycleStartUser, cycleEndUser, req.GenealogyTypeID)
		totalNodes += len(cycleNodes)

		cycles = append(cycles, CycleData{
			CycleNumber:  cycle,
			StartUser:    cycleStartUser,
			EndUser:      cycleEndUser,
			UsersInCycle: usersInCycle,
			NodesInCycle: cycleNodes,
		})
	}

	treeStructure := u.buildTreeStructure()

	return SimulationResponse{
		SimulationID:        u.simulationID,
		GenealogyTypeID:     req.GenealogyTypeID,
		MaxExpectedUsers:    req.MaxExpectedUsers,
		PayoutCycleType:     req.PayoutCycleType,
		NumberOfCycles:      req.NumberOfCycles,
		UsersPerCycle:       usersPerCycle,
		TotalNodesGenerated: totalNodes,
		Nodes:               u.nodes,
		Cycles:              cycles,
		TreeStructure:       treeStructure,
		CreatedAt:           time.Now(),
	}
}

// generateCycleNodes generates nodes for a specific cycle
func (u *UnilevelPlanSimulator) generateCycleNodes(cycle, startUser, endUser, genealogyTypeID int) []GenealogyNode {
	cycleNodes := make([]GenealogyNode, 0)

	for userID := startUser; userID <= endUser; userID++ {
		node := u.createNode(userID, genealogyTypeID, cycle, userID-startUser+1)
		cycleNodes = append(cycleNodes, node)
		u.nodes = append(u.nodes, node)
	}

	return cycleNodes
}

// createNode creates a new node with proper positioning
func (u *UnilevelPlanSimulator) createNode(userID, genealogyTypeID, cycle, cyclePosition int) GenealogyNode {
	var parentID *int
	position := "child"
	depth := 0

	if len(u.nodes) > 0 {
		// Find the first node that has less than maxChildrenCount children
		for i := range u.nodes {
			childrenCount := u.countChildren(u.nodes[i].ID)
			if childrenCount < u.maxChildrenCount {
				parentID = &u.nodes[i].ID
				depth = u.nodes[i].Depth + 1
				break
			}
		}
	}

	leftBound := u.nextLeftBound
	rightBound := leftBound + 1
	u.nextLeftBound += 2

	node := GenealogyNode{
		UserID:          userID,
		GenealogyTypeID: genealogyTypeID,
		ParentID:        parentID,
		LeftBound:       leftBound,
		RightBound:      rightBound,
		Depth:           depth,
		Position:        position,
		SimulationID:    &u.simulationID,
		PayoutCycle:     cycle,
		CyclePosition:   cyclePosition,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Assign a temporary ID for this simulation
	node.ID = len(u.nodes) + 1

	return node
}

// countChildren counts the number of children for a given node
func (u *UnilevelPlanSimulator) countChildren(nodeID int) int {
	count := 0
	for _, node := range u.nodes {
		if node.ParentID != nil && *node.ParentID == nodeID {
			count++
		}
	}
	return count
}

// buildTreeStructure builds a tree structure for visualization
func (u *UnilevelPlanSimulator) buildTreeStructure() map[string]interface{} {
	if len(u.nodes) == 0 {
		return map[string]interface{}{}
	}

	// Find root node (node without parent)
	var rootNode *GenealogyNode
	for i := range u.nodes {
		if u.nodes[i].ParentID == nil {
			rootNode = &u.nodes[i]
			break
		}
	}

	if rootNode == nil {
		return map[string]interface{}{}
	}

	tree := u.buildTreeNode(*rootNode)
	return map[string]interface{}{
		"root":        tree,
		"total_nodes": len(u.nodes),
	}
}

// buildTreeNode recursively builds the tree structure
func (u *UnilevelPlanSimulator) buildTreeNode(node GenealogyNode) TreeNode {
	children := make([]TreeNode, 0)

	for i := range u.nodes {
		if u.nodes[i].ParentID != nil && *u.nodes[i].ParentID == node.ID {
			child := u.buildTreeNode(u.nodes[i])
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
