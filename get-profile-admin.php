<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

$sql = "SELECT a.*, u.username 
        FROM admin a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.user_id = $user_id";

$result = mysqli_query($conn, $sql);

if ($result && mysqli_num_rows($result) > 0) {
    $data = mysqli_fetch_assoc($result);
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Data tidak ditemukan'
    ]);
}

mysqli_close($conn);
?>

<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

// Pastikan yang akses adalah admin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Query join untuk mengambil data lengkap admin
$sql = "SELECT u.username, u.role, 
        a.id as admin_id, a.nip, a.nama, a.email, a.jabatan 
        FROM users u 
        JOIN admin a ON u.id = a.user_id 
        WHERE u.id = '$user_id'";

$result = mysqli_query($conn, $sql);

if ($row = mysqli_fetch_assoc($result)) {
    // Hapus password dari object jika ada (safety)
    unset($row['password']);
    
    echo json_encode([
        'success' => true,
        'data' => $row
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Profil tidak ditemukan'
    ]);
}

mysqli_close($conn);
?>