<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    json_response(false, 'Unauthorized');
}

if (isset($_GET['nip'])) {
    $nip = clean_input($_GET['nip']);
    $sql = "SELECT d.*, u.username FROM dosen d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.nip = '$nip'";
    $result = mysqli_query($conn, $sql);
    if ($result && mysqli_num_rows($result) > 0) {
        echo json_encode(mysqli_fetch_assoc($result));
    } else {
        json_response(false, 'Data tidak ditemukan');
    }
} else {
    $sql = "SELECT d.*, u.username FROM dosen d 
            JOIN users u ON d.user_id = u.id 
            ORDER BY d.nama ASC";
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