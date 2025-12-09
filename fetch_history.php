<?php
// fetch_history.php - Handles GET request to retrieve student's leave history

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require 'db_connect.php';

// Check if student_id is provided in the query string
if (!isset($_GET['student_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Missing student ID."]);
    exit();
}

$student_id = $_GET['student_id'];

// --- Retrieve Data using Prepared Statement ---
$sql = "SELECT reference_no, DATE(departure) AS departure, arrival, reason, nature_of_leave, coordinator_approval, rector_approval 
        FROM leaves 
        WHERE student_id = ? 
        ORDER BY created_at DESC";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $conn->error]);
    exit();
}

$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    // Rename 'nature_of_leave' to 'nature' to match frontend JS logic
    $row['nature'] = $row['nature_of_leave'];
    unset($row['nature_of_leave']);
    
    // Rename columns for easier JS consumption
    $row['ref'] = $row['reference_no'];
    unset($row['reference_no']);
    
    $history[] = $row;
}

http_response_code(200);
echo json_encode($history);

$stmt->close();
$conn->close();

?>