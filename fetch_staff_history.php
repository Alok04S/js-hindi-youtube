<?php
// fetch_staff_history.php - Retrieves the history of leaves approved or rejected by a staff member

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require 'db_connect.php';

// Get Staff Role and ID from GET parameters
$staff_role = isset($_GET['role']) ? $_GET['role'] : null;
$staff_id = isset($_GET['staff_id']) ? $_GET['staff_id'] : null; 

if (!$staff_role || !$staff_id) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required staff role or ID."]);
    exit();
}

// --- SQL Query Construction ---

$sql = "";
$bind_types = "";
$bind_params = [];

if ($staff_role === 'coordinator') {
    // COORDINATOR History: Show leaves where coordinator_approval is Approved OR Rejected
    $sql = "SELECT * FROM leaves 
            WHERE coordinator_approval = 'Approved' OR coordinator_approval = 'Rejected' 
            ORDER BY created_at DESC";
    // NOTE: In a real system, you'd filter this list by branch/year specific to the coordinator.
    
} elseif ($staff_role === 'rector') {
    // RECTOR History: Show leaves where rector_approval is Approved OR Rejected
    $sql = "SELECT * FROM leaves 
            WHERE rector_approval = 'Approved' OR rector_approval = 'Rejected'
            ORDER BY created_at DESC";
    
} else {
    // Invalid Role
    http_response_code(403);
    echo json_encode(["message" => "Invalid staff role specified."]);
    exit();
}

// --- Execute Query ---

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error during preparation: " . $conn->error]);
    exit();
}

// Execute without parameters (as simplified queries don't need bindings here)
$stmt->execute();
$result = $stmt->get_result();

$history_records = [];
while ($row = $result->fetch_assoc()) {
    $history_records[] = $row;
}

http_response_code(200);
echo json_encode($history_records);

$stmt->close();
$conn->close();

?>