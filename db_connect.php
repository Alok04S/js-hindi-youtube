<?php
// db_connect.php

$servername = "localhost";
$username = "root"; // <-- CHANGE THIS
$password = "password"; // <-- CHANGE THIS
$dbname = "hostelleaveDB"; // <-- CHANGE THIS

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8");

?>