<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$type = $_GET['type'] ?? '';
$session = $_GET['session'] ?? 'global';

$conn = get_db_connection();

// Create table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS school_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL,
    session_id VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (data_type, session_id)
)");

if ($action === 'get') {
    $stmt = $conn->prepare("SELECT content FROM school_data WHERE data_type = ? AND session_id = ?");
    $stmt->bind_param("ss", $type, $session);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo $row['content'];
    } else {
        echo json_encode([]); // Default empty array
    }
} 
elseif ($action === 'save') {
    $json_data = file_get_contents('php://input');
    
    // Validate JSON
    if (json_decode($json_data) === null) {
        echo json_encode(["error" => "Invalid JSON data"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO school_data (data_type, session_id, content) 
                           VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE content = VALUES(content)");
    $stmt->bind_param("sss", $type, $session, $json_data);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => $stmt->error]);
    }
}
else {
    echo json_encode(["message" => "NMS School API v1.0"]);
}

$conn->close();
?>
