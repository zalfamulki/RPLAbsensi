<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// Cek koneksi database
if (!$conn) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

try {
    // Jika ada parameter kode_kelas, ambil data kelas tertentu
    if (isset($_GET['kode_kelas'])) {
        $kode_kelas = $_GET['kode_kelas'];
        
        $stmt = $conn->prepare("SELECT * FROM kelas WHERE kode_kelas = ?");
        $stmt->bind_param("s", $kode_kelas);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $kelas = $result->fetch_assoc();
            echo json_encode($kelas);
        } else {
            echo json_encode(['error' => 'Kelas tidak ditemukan']);
        }
        
        $stmt->close();
    } else {
        // Ambil semua data kelas
        $sql = "SELECT * FROM kelas ORDER BY kode_kelas ASC";
        $result = $conn->query($sql);
        
        $kelas_list = array();
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $kelas_list[] = $row;
            }
        }
        
        echo json_encode($kelas_list);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>