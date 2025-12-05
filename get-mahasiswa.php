<?php
session_start();
require_once '../config/database.php';

// Cek apakah user sudah login dan role admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    json_response(false, 'Unauthorized');
}

// Jika ada parameter NIM, ambil data mahasiswa tertentu
if (isset($_GET['nim'])) {
    $nim = clean_input($_GET['nim']);
    
    $sql = "SELECT m.*, u.username 
            FROM mahasiswa m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.nim = '$nim'";
    
    $result = mysqli_query($conn, $sql);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $data = mysqli_fetch_assoc($result);
        echo json_encode($data);
    } else {
        json_response(false, 'Data tidak ditemukan');
    }
} else {
    // Ambil semua data mahasiswa
    $sql = "SELECT m.*, u.username 
            FROM mahasiswa m 
            JOIN users u ON m.user_id = u.id 
            ORDER BY m.nama ASC";
    
    $result = mysqli_query($conn, $sql);
    
    $data = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode($data);
}

mysqli_close($conn);
?>