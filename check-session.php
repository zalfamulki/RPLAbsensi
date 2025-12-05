<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
    echo json_encode([
        'success' => true,
        'logged_in' => true,
        'data' => [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role'],
            'nama' => $_SESSION['nama'] ?? '',
            'nim' => $_SESSION['nim'] ?? '',
            'nip' => $_SESSION['nip'] ?? '',
            'prodi' => $_SESSION['prodi'] ?? ''
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'logged_in' => false,
        'message' => 'Session tidak ditemukan'
    ]);
}
?>