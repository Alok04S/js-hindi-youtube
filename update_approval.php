<?php
// update_approval.php - Handles POST request to update approval status

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); 
    echo json_encode(["message" => "Only POST requests are allowed."]);
    exit();
}

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Basic validation for required fields
if (!isset($data['ref'], $data['approval_target'], $data['status'])) {
    http_response_code(400); 
    echo json_encode(["message" => "Missing required approval parameters."]);
    exit();
}

$reference_no = $data['ref'];
$approval_target = $data['approval_target']; // e.g., coordinator_approval or rector_approval
$status = $data['status']; // e.g., Approved or Rejected

// Ensure approval target is a valid column name to prevent SQL injection (Whitelisting)
if ($approval_target !== 'coordinator_approval' && $approval_target !== 'rector_approval') {
    http_response_code(400); 
    echo json_encode(["message" => "Invalid approval target specified."]);
    exit();
}

// Ensure status is valid
if ($status !== 'Approved' && $status !== 'Rejected') {
    http_response_code(400); 
    echo json_encode(["message" => "Invalid approval status."]);
    exit();
}

// --- Update Data using Prepared Statement ---
// IMPORTANT: We use $approval_target directly in the SET clause, but we must ensure it's whitelisted above.
$sql = "UPDATE leaves SET {$approval_target} = ? WHERE reference_no = ?";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $conn->error]);
    exit();
}

$stmt->bind_param("ss", $status, $reference_no);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode([
        "message" => "Approval status updated successfully.",
        "referenceNo" => $reference_no,
        "newStatus" => $status
    ]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to update status. Execution error.", "error" => $stmt->error]);
}

$stmt->close();
$conn->close();

?>