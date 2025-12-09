<?php
// submit_leave.php - Handles POST request for leave application

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

// Placeholder/Mocked Student Data (Should come from secure session)
$student_id = "S1001";
$student_name = "John Doe";
$room_no = "A-205";

// Basic validation check (omitted for brevity, assume inputs are safe via prepared statements)
if (empty($data['departureDate']) || empty($data['reason'])) {
    http_response_code(400); 
    echo json_encode(["message" => "Missing essential fields."]);
    exit();
}

// --- Data Preparation ---
$departure_dt = $data['departureDate'] . ' ' . $data['departureTime'] . ':00';
$arrival_date = $data['arrivalDate'];
$nature_of_leave = $data['natureOfLeave'];

// Generate unique reference number
$reference_no = 'HLM-' . strtoupper(substr(base_convert(sha1(uniqid(mt_rand(), true)), 16, 36), 0, 15));

// Set initial approval status based on nature of leave
$coordinator_approval = ($nature_of_leave === 'working') ? 'Pending' : 'N/A';
$rector_approval = 'Pending';

// --- Insert Data using Prepared Statement ---
$sql = "INSERT INTO leaves (student_id, student_name, room_no, reference_no, departure, arrival, reason, destination, nature_of_leave, guardian_name, guardian_contact, coordinator_approval, rector_approval) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $conn->error]);
    exit();
}

$stmt->bind_param(
    "sssssssssssss", 
    $student_id, $student_name, $room_no, $reference_no, 
    $departure_dt, $arrival_date, $data['reason'], $data['destination'], 
    $nature_of_leave, $data['guardianName'], $data['guardianContact'], 
    $coordinator_approval, $rector_approval
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "message" => "Leave application submitted successfully.",
        "referenceNo" => $reference_no
    ]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to submit application. Execution error.", "error" => $stmt->error]);
}

$stmt->close();
$conn->close();

?>