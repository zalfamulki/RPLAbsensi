<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = clean_input($data['id']);

if (empty($id)) {
    echo json_encode(['success' => false, 'message' => 'ID tidak ditemukan']);
    exit;
}

// Mencegah menghapus diri sendiri
// Ambil user_id dari admin yang mau dihapus
$q_target = mysqli_query($conn, "SELECT user_id FROM admin WHERE id = '$id'");
$target = mysqli_fetch_assoc($q_target);

if ($target && $target['user_id'] == $_SESSION['user_id']) {
    echo json_encode(['success' => false, 'message' => 'Anda tidak bisa menghapus akun sendiri saat sedang login!']);
    exit;
}

mysqli_begin_transaction($conn);

try {
    $user_id = $target['user_id'];

    // 1. Hapus dari tabel admin
    mysqli_query($conn, "DELETE FROM admin WHERE id = '$id'");

    // 2. Hapus dari tabel users
    mysqli_query($conn, "DELETE FROM users WHERE id = '$user_id'");

    mysqli_commit($conn);
    echo json_encode(['success' => true, 'message' => 'Data admin berhasil dihapus']);

} catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'message' => 'Gagal menghapus: ' . $e->getMessage()]);
}

mysqli_close($conn);
?>