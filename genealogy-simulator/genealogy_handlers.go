package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// User represents a user in the genealogy system
type User struct {
	ID               int       `json:"id"`
	Email            string    `json:"email"`
	Name             string    `json:"name"`
	Role             string    `json:"role"`
	WhatsappNumber   string    `json:"whatsapp_number"`
	OrganizationName *string   `json:"organization_name,omitempty"`
	Country          *string   `json:"country,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// GenealogyNodeWithUser represents a node in the genealogy structure with user details
type GenealogyNodeWithUser struct {
	GenealogyNode
	// Include user details
	User *User `json:"user,omitempty"`
}

// GenealogyNodeWithChildren represents a node with its children
type GenealogyNodeWithChildren struct {
	GenealogyNode
	Children []GenealogyNodeWithChildren `json:"children"`
}

// GenerateUsersRequest represents a request to generate users
type GenerateUsersRequest struct {
	Count            int    `json:"count"`
	GenealogyTypeID  int    `json:"genealogy_type_id"`
	ParentID         *int   `json:"parent_id,omitempty"`
	Position         string `json:"position,omitempty"`
	SimulationID     string `json:"simulation_id,omitempty"`
	PayoutCycle      int    `json:"payout_cycle"`
	MaxChildrenCount int    `json:"max_children_count"`
}

// AddUserToGenealogyRequest represents a request to add a user to genealogy
type AddUserToGenealogyRequest struct {
	UserID          int    `json:"user_id"`
	GenealogyTypeID int    `json:"genealogy_type_id"`
	ParentID        *int   `json:"parent_id,omitempty"`
	Position        string `json:"position,omitempty"`
	SimulationID    string `json:"simulation_id,omitempty"`
	PayoutCycle     int    `json:"payout_cycle"`
	CyclePosition   int    `json:"cycle_position"`
}

// handleGenerateUsers generates users and adds them to genealogy structure
func handleGenerateUsers(w http.ResponseWriter, r *http.Request) {
	var req GenerateUsersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Count <= 0 {
		http.Error(w, "Count must be greater than 0", http.StatusBadRequest)
		return
	}

	// Generate users and add to genealogy
	var generatedNodes []GenealogyNodeWithUser
	for i := 1; i <= req.Count; i++ {
		// Create user with unique values
		timestamp := time.Now().UnixNano() + int64(i)
		user, err := createUser(fmt.Sprintf("user%d@example.com", timestamp),
			fmt.Sprintf("Generated User %d", i), "user",
			fmt.Sprintf("+1%010d", timestamp%10000000000))
		if err != nil {
			log.Printf("Error creating user: %v", err)
			http.Error(w, fmt.Sprintf("Error creating user: %v", err), http.StatusInternalServerError)
			return
		}

		log.Printf("Created user with ID: %d", user.ID)

		// Add user to genealogy structure
		log.Printf("Attempting to add user %d to genealogy type %d", user.ID, req.GenealogyTypeID)
		node, err := addUserToGenealogy(user.ID, req.GenealogyTypeID, req.ParentID,
			req.Position, req.SimulationID, req.PayoutCycle, i)
		if err != nil {
			log.Printf("Error adding user to genealogy: %v", err)
			http.Error(w, fmt.Sprintf("Error adding user to genealogy: %v", err), http.StatusInternalServerError)
			return
		}
		log.Printf("Successfully added user %d to genealogy with node ID: %d", user.ID, node.ID)

		generatedNodes = append(generatedNodes, GenealogyNodeWithUser{
			GenealogyNode: *node,
			User:          user,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Generated %d users and added to genealogy", req.Count),
		"data":    generatedNodes,
	})
}

// handleGetDownlineUsers gets all downline users for a given parent
func handleGetDownlineUsers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	parentID, err := strconv.Atoi(vars["parent_id"])
	if err != nil {
		http.Error(w, "Invalid parent ID", http.StatusBadRequest)
		return
	}

	// Get genealogy type from query params
	genealogyTypeID := r.URL.Query().Get("genealogy_type_id")
	if genealogyTypeID == "" {
		http.Error(w, "Genealogy type ID is required", http.StatusBadRequest)
		return
	}
	gTypeID, err := strconv.Atoi(genealogyTypeID)
	if err != nil {
		http.Error(w, "Invalid genealogy type ID", http.StatusBadRequest)
		return
	}

	// Get downline users using nested set model
	query := `
		SELECT gn.*, u.id as user_id, u.email, u.name, u.role, u.whatsapp_number, 
		       u.organization_name, u.country, u.created_at, u.updated_at
		FROM genealogy_nodes gn
		JOIN users u ON gn.user_id = u.id
		WHERE gn.genealogy_type_id = $1 
		AND gn.left_bound > (SELECT left_bound FROM genealogy_nodes WHERE id = $2 AND genealogy_type_id = $1)
		AND gn.right_bound < (SELECT right_bound FROM genealogy_nodes WHERE id = $2 AND genealogy_type_id = $1)
		ORDER BY gn.left_bound
	`

	rows, err := db.Query(query, gTypeID, parentID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error querying downline: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var downlineUsers []GenealogyNodeWithUser
	for rows.Next() {
		var genealogyNode GenealogyNode
		var user User
		err := rows.Scan(
			&genealogyNode.ID, &genealogyNode.UserID, &genealogyNode.GenealogyTypeID, &genealogyNode.ParentID,
			&genealogyNode.LeftBound, &genealogyNode.RightBound, &genealogyNode.Depth, &genealogyNode.Position,
			&genealogyNode.SimulationID, &genealogyNode.PayoutCycle, &genealogyNode.CyclePosition,
			&genealogyNode.CreatedAt, &genealogyNode.UpdatedAt,
			&user.ID, &user.Email, &user.Name, &user.Role, &user.WhatsappNumber,
			&user.OrganizationName, &user.Country, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error scanning downline: %v", err), http.StatusInternalServerError)
			return
		}
		nodeWithUser := GenealogyNodeWithUser{
			GenealogyNode: genealogyNode,
			User:          &user,
		}
		downlineUsers = append(downlineUsers, nodeWithUser)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    downlineUsers,
		"count":   len(downlineUsers),
	})
}

// handleGetUplineUsers gets all upline users for a given node
func handleGetUplineUsers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	nodeID, err := strconv.Atoi(vars["node_id"])
	if err != nil {
		http.Error(w, "Invalid node ID", http.StatusBadRequest)
		return
	}

	// Get genealogy type from query params
	genealogyTypeID := r.URL.Query().Get("genealogy_type_id")
	if genealogyTypeID == "" {
		http.Error(w, "Genealogy type ID is required", http.StatusBadRequest)
		return
	}
	gTypeID, err := strconv.Atoi(genealogyTypeID)
	if err != nil {
		http.Error(w, "Invalid genealogy type ID", http.StatusBadRequest)
		return
	}

	// Get upline users using nested set model
	query := `
		SELECT gn.*, u.id as user_id, u.email, u.name, u.role, u.whatsapp_number, 
		       u.organization_name, u.country, u.created_at, u.updated_at
		FROM genealogy_nodes gn
		JOIN users u ON gn.user_id = u.id
		WHERE gn.genealogy_type_id = $1 
		AND gn.left_bound < (SELECT left_bound FROM genealogy_nodes WHERE id = $2)
		AND gn.right_bound > (SELECT right_bound FROM genealogy_nodes WHERE id = $2)
		ORDER BY gn.depth ASC
	`

	rows, err := db.Query(query, gTypeID, nodeID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error querying upline: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var uplineUsers []GenealogyNodeWithUser
	for rows.Next() {
		var genealogyNode GenealogyNode
		var user User
		err := rows.Scan(
			&genealogyNode.ID, &genealogyNode.UserID, &genealogyNode.GenealogyTypeID, &genealogyNode.ParentID,
			&genealogyNode.LeftBound, &genealogyNode.RightBound, &genealogyNode.Depth, &genealogyNode.Position,
			&genealogyNode.SimulationID, &genealogyNode.PayoutCycle, &genealogyNode.CyclePosition,
			&genealogyNode.CreatedAt, &genealogyNode.UpdatedAt,
			&user.ID, &user.Email, &user.Name, &user.Role, &user.WhatsappNumber,
			&user.OrganizationName, &user.Country, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error scanning upline: %v", err), http.StatusInternalServerError)
			return
		}
		nodeWithUser := GenealogyNodeWithUser{
			GenealogyNode: genealogyNode,
			User:          &user,
		}
		uplineUsers = append(uplineUsers, nodeWithUser)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    uplineUsers,
		"count":   len(uplineUsers),
	})
}

// handleGetGenealogyStructure gets the complete genealogy structure for a type
func handleGetGenealogyStructure(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	genealogyTypeID, err := strconv.Atoi(vars["genealogy_type_id"])
	if err != nil {
		http.Error(w, "Invalid genealogy type ID", http.StatusBadRequest)
		return
	}

	// Get all nodes for this genealogy type
	query := `
		SELECT gn.*, u.id as user_id, u.email, u.name, u.role, u.whatsapp_number, 
		       u.organization_name, u.country, u.created_at, u.updated_at
		FROM genealogy_nodes gn
		JOIN users u ON gn.user_id = u.id
		WHERE gn.genealogy_type_id = $1
		ORDER BY gn.left_bound
	`

	rows, err := db.Query(query, genealogyTypeID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error querying genealogy structure: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var nodes []GenealogyNodeWithUser
	for rows.Next() {
		var genealogyNode GenealogyNode
		var user User
		err := rows.Scan(
			&genealogyNode.ID, &genealogyNode.UserID, &genealogyNode.GenealogyTypeID, &genealogyNode.ParentID,
			&genealogyNode.LeftBound, &genealogyNode.RightBound, &genealogyNode.Depth, &genealogyNode.Position,
			&genealogyNode.SimulationID, &genealogyNode.PayoutCycle, &genealogyNode.CyclePosition,
			&genealogyNode.CreatedAt, &genealogyNode.UpdatedAt,
			&user.ID, &user.Email, &user.Name, &user.Role, &user.WhatsappNumber,
			&user.OrganizationName, &user.Country, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error scanning genealogy structure: %v", err), http.StatusInternalServerError)
			return
		}
		nodeWithUser := GenealogyNodeWithUser{
			GenealogyNode: genealogyNode,
			User:          &user,
		}
		nodes = append(nodes, nodeWithUser)
	}

	// Build tree structure
	treeStructure := buildTreeStructureFromNodes(nodes)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"nodes":          nodes,
			"tree_structure": treeStructure,
			"total_nodes":    len(nodes),
		},
	})
}

// handleAddUserToGenealogy adds a user to the genealogy structure
func handleAddUserToGenealogy(w http.ResponseWriter, r *http.Request) {
	var req AddUserToGenealogyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	node, err := addUserToGenealogy(req.UserID, req.GenealogyTypeID, req.ParentID,
		req.Position, req.SimulationID, req.PayoutCycle, req.CyclePosition)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error adding user to genealogy: %v", err), http.StatusInternalServerError)
		return
	}

	// Get user details
	user, err := getUserByID(req.UserID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting user: %v", err), http.StatusInternalServerError)
		return
	}
	nodeWithUser := GenealogyNodeWithUser{
		GenealogyNode: *node,
		User:          user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User added to genealogy successfully",
		"data":    nodeWithUser,
	})
}

// Helper functions

// createUser creates a new user
func createUser(email, name, role, whatsappNumber string) (*User, error) {
	query := `
		INSERT INTO users (email, name, password_hash, role, whatsapp_number, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, email, name, role, whatsapp_number, organization_name, country, created_at, updated_at
	`

	var user User
	err := db.QueryRow(query, email, name, "hashed_password", role, whatsappNumber).Scan(
		&user.ID, &user.Email, &user.Name, &user.Role, &user.WhatsappNumber,
		&user.OrganizationName, &user.Country, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// getUserByID gets a user by ID
func getUserByID(id int) (*User, error) {
	query := `
		SELECT id, email, name, role, whatsapp_number, organization_name, country, created_at, updated_at
		FROM users WHERE id = $1
	`

	var user User
	err := db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.Name, &user.Role, &user.WhatsappNumber,
		&user.OrganizationName, &user.Country, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// addUserToGenealogy adds a user to the genealogy structure
func addUserToGenealogy(userID, genealogyTypeID int, parentID *int, position, simulationID string, payoutCycle, cyclePosition int) (*GenealogyNode, error) {
	// Get genealogy type to determine max children
	genealogyType, err := getGenealogyTypeByID(genealogyTypeID)
	if err != nil {
		return nil, err
	}

	// Determine position and parent if not provided
	if parentID == nil {
		// Find the first available parent
		parentQuery := `
			SELECT id FROM genealogy_nodes 
			WHERE genealogy_type_id = $1 
			AND (
				SELECT COUNT(*) FROM genealogy_nodes 
				WHERE parent_id = genealogy_nodes.id AND genealogy_type_id = $1
			) < $2
			ORDER BY left_bound
			LIMIT 1
		`
		var foundParentID int
		err := db.QueryRow(parentQuery, genealogyTypeID, genealogyType.MaxChildrenPerNode).Scan(&foundParentID)
		if err != nil && err.Error() != "sql: no rows in result set" {
			return nil, err
		}
		if err == nil {
			parentID = &foundParentID
		}
	}

	// Calculate bounds and depth
	var leftBound, rightBound, depth int
	if parentID == nil {
		// Root node
		leftBound = 1
		rightBound = 2
		depth = 0
		position = "root"

		// Insert the root node
		insertQuery := `
			INSERT INTO genealogy_nodes (user_id, genealogy_type_id, parent_id, left_bound, right_bound, depth, position, simulation_id, payout_cycle, cycle_position, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
			RETURNING id, user_id, genealogy_type_id, parent_id, left_bound, right_bound, depth, position, simulation_id, payout_cycle, cycle_position, created_at, updated_at
		`

		var node GenealogyNode
		var simulationIDPtr *string
		if simulationID != "" {
			simulationIDPtr = &simulationID
		}

		log.Printf("Inserting root node with userID: %d, genealogyTypeID: %d, leftBound: %d, rightBound: %d, depth: %d, position: %s, simulationID: %v, payoutCycle: %d, cyclePosition: %d",
			userID, genealogyTypeID, leftBound, rightBound, depth, position, simulationIDPtr, payoutCycle, cyclePosition)

		err = db.QueryRow(insertQuery, userID, genealogyTypeID, parentID, leftBound, rightBound, depth, position, simulationIDPtr, payoutCycle, cyclePosition).Scan(
			&node.ID, &node.UserID, &node.GenealogyTypeID, &node.ParentID,
			&node.LeftBound, &node.RightBound, &node.Depth, &node.Position,
			&node.SimulationID, &node.PayoutCycle, &node.CyclePosition,
			&node.CreatedAt, &node.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning root node: %v", err)
			return nil, err
		}

		log.Printf("Successfully inserted root node with ID: %d", node.ID)
		return &node, nil
	} else {
		// Get parent bounds
		var parentLeftBound, parentRightBound, parentDepth int
		err := db.QueryRow(
			"SELECT left_bound, right_bound, depth FROM genealogy_nodes WHERE id = $1",
			*parentID,
		).Scan(&parentLeftBound, &parentRightBound, &parentDepth)
		if err != nil {
			return nil, err
		}

		// Calculate position if not provided
		if position == "" {
			childrenCount, err := getChildrenCount(*parentID)
			if err != nil {
				return nil, err
			}

			switch genealogyType.Name {
			case "Binary Plan":
				if childrenCount == 0 {
					position = "left"
				} else {
					position = "right"
				}
			default:
				position = "child"
			}
		}

		// Calculate new bounds
		if position == "left" || position == "child" {
			leftBound = parentLeftBound + 1
		} else {
			// Find the rightmost child's right bound
			var maxRightBound int
			err := db.QueryRow(
				"SELECT COALESCE(MAX(right_bound), $1) FROM genealogy_nodes WHERE parent_id = $2",
				parentLeftBound, *parentID,
			).Scan(&maxRightBound)
			if err != nil {
				return nil, err
			}
			leftBound = maxRightBound + 1
		}

		rightBound = leftBound + 1
		depth = parentDepth + 1

		// Start a transaction for proper bounds updates
		tx, err := db.Begin()
		if err != nil {
			return nil, err
		}
		defer tx.Rollback()

		// Update bounds of all nodes that come after this insertion point
		_, err = tx.Exec(
			"UPDATE genealogy_nodes SET left_bound = left_bound + 2, right_bound = right_bound + 2 WHERE left_bound >= $1 AND genealogy_type_id = $2",
			leftBound, genealogyTypeID,
		)
		if err != nil {
			return nil, err
		}

		// Update parent's right bound to accommodate the new child
		_, err = tx.Exec(
			"UPDATE genealogy_nodes SET right_bound = right_bound + 2 WHERE id = $1",
			*parentID,
		)
		if err != nil {
			return nil, err
		}

		// Insert the new node
		insertQuery := `
			INSERT INTO genealogy_nodes (user_id, genealogy_type_id, parent_id, left_bound, right_bound, depth, position, simulation_id, payout_cycle, cycle_position, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
			RETURNING id, user_id, genealogy_type_id, parent_id, left_bound, right_bound, depth, position, simulation_id, payout_cycle, cycle_position, created_at, updated_at
		`

		var node GenealogyNode
		var simulationIDPtr *string
		if simulationID != "" {
			simulationIDPtr = &simulationID
		}

		log.Printf("Inserting node with userID: %d, genealogyTypeID: %d, parentID: %v, leftBound: %d, rightBound: %d, depth: %d, position: %s, simulationID: %v, payoutCycle: %d, cyclePosition: %d",
			userID, genealogyTypeID, parentID, leftBound, rightBound, depth, position, simulationIDPtr, payoutCycle, cyclePosition)

		err = tx.QueryRow(insertQuery, userID, genealogyTypeID, parentID, leftBound, rightBound, depth, position, simulationIDPtr, payoutCycle, cyclePosition).Scan(
			&node.ID, &node.UserID, &node.GenealogyTypeID, &node.ParentID,
			&node.LeftBound, &node.RightBound, &node.Depth, &node.Position,
			&node.SimulationID, &node.PayoutCycle, &node.CyclePosition,
			&node.CreatedAt, &node.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning node: %v", err)
			return nil, err
		}

		// Commit the transaction
		if err = tx.Commit(); err != nil {
			return nil, err
		}

		log.Printf("Successfully inserted node with ID: %d", node.ID)
		return &node, nil
	}

}

// getChildrenCount gets the number of children for a node
func getChildrenCount(nodeID int) (int, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM genealogy_nodes WHERE parent_id = $1",
		nodeID,
	).Scan(&count)
	return count, err
}

// buildTreeStructureFromNodes builds a tree structure from nodes with user details
func buildTreeStructureFromNodes(nodes []GenealogyNodeWithUser) map[string]interface{} {
	if len(nodes) == 0 {
		return map[string]interface{}{}
	}

	// Find root node
	var rootNode *GenealogyNodeWithUser
	for i := range nodes {
		if nodes[i].ParentID == nil {
			rootNode = &nodes[i]
			break
		}
	}

	if rootNode == nil {
		return map[string]interface{}{}
	}

	// Build tree recursively
	tree := buildTreeNodeWithUser(*rootNode, nodes)
	return map[string]interface{}{
		"root":        tree,
		"total_nodes": len(nodes),
	}
}

// buildTreeNodeWithUser recursively builds the tree structure
func buildTreeNodeWithUser(node GenealogyNodeWithUser, allNodes []GenealogyNodeWithUser) GenealogyNodeWithChildren {
	children := make([]GenealogyNodeWithChildren, 0)

	for _, n := range allNodes {
		if n.ParentID != nil && *n.ParentID == node.ID {
			child := buildTreeNodeWithUser(n, allNodes)
			children = append(children, child)
		}
	}

	return GenealogyNodeWithChildren{
		GenealogyNode: GenealogyNode{
			ID:              node.ID,
			UserID:          node.UserID,
			GenealogyTypeID: node.GenealogyTypeID,
			ParentID:        node.ParentID,
			LeftBound:       node.LeftBound,
			RightBound:      node.RightBound,
			Depth:           node.Depth,
			Position:        node.Position,
			SimulationID:    node.SimulationID,
			PayoutCycle:     node.PayoutCycle,
			CyclePosition:   node.CyclePosition,
			CreatedAt:       node.CreatedAt,
			UpdatedAt:       node.UpdatedAt,
		},
		Children: children,
	}
}
