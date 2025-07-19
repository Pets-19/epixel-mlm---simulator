package main

import (
	"time"
)

// MatrixPlanSimulator implements the matrix plan logic
// Strict limit per parent node to MaxChildrenCount children
// If a parent reaches this limit, new children spill to the next available downline node
// Uses nested set model for efficient tree operations

type MatrixPlanSimulator struct {
	simulationID     string
	nodes            []GenealogyNode
	nextLeftBound    int
	maxChildrenCount int
}

func NewMatrixPlanSimulator(simulationID string, maxChildrenCount int) *MatrixPlanSimulator {
	return &MatrixPlanSimulator{
		simulationID:     simulationID,
		nodes:            make([]GenealogyNode, 0),
		nextLeftBound:    1,
		maxChildrenCount: maxChildrenCount,
	}
}

func (m *MatrixPlanSimulator) Simulate(req SimulationRequest) SimulationResponse {
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

		cycleNodes := m.generateCycleNodes(cycle, cycleStartUser, cycleEndUser, req.GenealogyTypeID)
		totalNodes += len(cycleNodes)

		cycles = append(cycles, CycleData{
			CycleNumber:  cycle,
			StartUser:    cycleStartUser,
			EndUser:      cycleEndUser,
			UsersInCycle: usersInCycle,
			NodesInCycle: cycleNodes,
		})
	}

	treeStructure := m.buildTreeStructure()

	return SimulationResponse{
		SimulationID:        m.simulationID,
		GenealogyTypeID:     req.GenealogyTypeID,
		MaxExpectedUsers:    req.MaxExpectedUsers,
		PayoutCycleType:     req.PayoutCycleType,
		NumberOfCycles:      req.NumberOfCycles,
		UsersPerCycle:       usersPerCycle,
		TotalNodesGenerated: totalNodes,
		Nodes:               m.nodes,
		Cycles:              cycles,
		TreeStructure:       treeStructure,
		CreatedAt:           time.Now(),
	}
}

// generateCycleNodes generates nodes for a specific cycle
func (m *MatrixPlanSimulator) generateCycleNodes(cycle, startUser, endUser, genealogyTypeID int) []GenealogyNode {
	cycleNodes := make([]GenealogyNode, 0)

	for userID := startUser; userID <= endUser; userID++ {
		node := m.createNode(userID, genealogyTypeID, cycle, userID-startUser+1)
		cycleNodes = append(cycleNodes, node)
		m.nodes = append(m.nodes, node)
	}

	return cycleNodes
}

// createNode creates a new node with proper positioning
func (m *MatrixPlanSimulator) createNode(userID, genealogyTypeID, cycle, cyclePosition int) GenealogyNode {
	var parentID *int
	position := "child"
	depth := 0

	if len(m.nodes) > 0 {
		// Find the first node that has less than maxChildrenCount children
		for i := range m.nodes {
			childrenCount := m.countChildren(m.nodes[i].ID)
			if childrenCount < m.maxChildrenCount {
				parentID = &m.nodes[i].ID
				depth = m.nodes[i].Depth + 1
				break
			}
		}
	}

	leftBound := m.nextLeftBound
	rightBound := leftBound + 1
	m.nextLeftBound += 2

	node := GenealogyNode{
		UserID:          userID,
		GenealogyTypeID: genealogyTypeID,
		ParentID:        parentID,
		LeftBound:       leftBound,
		RightBound:      rightBound,
		Depth:           depth,
		Position:        position,
		SimulationID:    &m.simulationID,
		PayoutCycle:     cycle,
		CyclePosition:   cyclePosition,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Assign a temporary ID for this simulation
	node.ID = len(m.nodes) + 1

	return node
}

// countChildren counts the number of children for a given node
func (m *MatrixPlanSimulator) countChildren(nodeID int) int {
	count := 0
	for _, node := range m.nodes {
		if node.ParentID != nil && *node.ParentID == nodeID {
			count++
		}
	}
	return count
}

// buildTreeStructure builds a tree structure for visualization
func (m *MatrixPlanSimulator) buildTreeStructure() map[string]interface{} {
	if len(m.nodes) == 0 {
		return map[string]interface{}{}
	}

	// Find root node (node without parent)
	var rootNode *GenealogyNode
	for i := range m.nodes {
		if m.nodes[i].ParentID == nil {
			rootNode = &m.nodes[i]
			break
		}
	}

	if rootNode == nil {
		return map[string]interface{}{}
	}

	tree := m.buildTreeNode(*rootNode)
	return map[string]interface{}{
		"root":        tree,
		"total_nodes": len(m.nodes),
	}
}

// buildTreeNode recursively builds the tree structure
func (m *MatrixPlanSimulator) buildTreeNode(node GenealogyNode) TreeNode {
	children := make([]TreeNode, 0)

	for i := range m.nodes {
		if m.nodes[i].ParentID != nil && *m.nodes[i].ParentID == node.ID {
			child := m.buildTreeNode(m.nodes[i])
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
