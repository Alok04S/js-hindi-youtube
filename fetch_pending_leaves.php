<?php
// fetch_pending_leaves.php - Handles GET request to retrieve pending leaves for staff

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // POST added for approval actions later
header("Access-Control-Allow-Headers: Content-Type");

require 'db_connect.php';

// Mocked Staff Role (In a real system, this comes from a secure session after login)
// Example: coordinator for a specific branch/year, or rector for all.
$staff_role = isset($_GET['role']) ? $_GET['role'] : 'rector'; // Default to rector for testing
$staff_id = isset($_GET['staff_id']) ? $_GET['staff_id'] : 'T999'; // Mocked ID

// --- SQL Query Construction ---

$sql = "";
$bind_types = "";
$bind_params = [];

if ($staff_role === 'coordinator') {
    // COORDINATOR view: Show leaves where their approval is 'Pending' AND the nature is 'working'
    // (Non-working leaves skip the coordinator)
    $sql = "SELECT * FROM leaves WHERE coordinator_approval = 'Pending' AND nature_of_leave = 'working' ORDER BY created_at ASC";
    // We would ideally filter by branch/year here too, e.g., "AND branch = ?"
    
} elseif ($staff_role === 'rector') {
    // RECTOR view: Show leaves where their approval is 'Pending' AND either:
    // 1. Nature is 'non-working' (they approve directly).
    // 2. Nature is 'working' AND coordinator has already 'Approved'.
    $sql = "SELECT * FROM leaves 
            WHERE rector_approval = 'Pending' 
              AND (
                nature_of_leave = 'non-working'
                OR (nature_of_leave = 'working' AND coordinator_approval = 'Approved')
              )
            ORDER BY created_at ASC";
    
} else {
    // Invalid Role
    http_response_code(403);
    echo json_encode(["message" => "Access denied or invalid role."]);
    exit();
}

// --- Execute Query ---

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error during preparation: " . $conn->error]);
    exit();
}

// Bind parameters if any (none in current simplified queries)
// if (!empty($bind_params)) { $stmt->bind_param($bind_types, ...$bind_params); }

$stmt->execute();
$result = $stmt->get_result();

$pending_leaves = [];
while ($row = $result->fetch_assoc()) {
    $pending_leaves[] = $row;
}

http_response_code(200);
echo json_encode($pending_leaves);

$stmt->close();
$conn->close();

?>