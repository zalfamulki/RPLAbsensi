<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// Ambil data JSON dari request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validasi data
if (empty($data['kode_kelas'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Kode kelas tidak valid'
    ]);
    exit;
}

$kode_kelas = $data['kode_kelas'];

try {
    // Cek apakah kelas ada
    $check_stmt = $conn->prepare("SELECT kode_kelas FROM kelas WHERE kode_kelas = ?");
    $check_stmt->bind_param("s", $kode_kelas);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Data kelas tidak ditemukan'
        ]);
        exit;
    }
    
    // Hapus data kelas
    $stmt = $conn->prepare("DELETE FROM kelas WHERE kode_kelas = ?");
    $stmt->bind_param("s", $kode_kelas);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Data kelas berhasil dihapus'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Gagal menghapus data: ' . $stmt->error
        ]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>