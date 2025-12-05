<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$token = clean_input($data['token']);
$password = $data['password']; // Password baru

if (empty($token) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit;
}

$now = date("Y-m-d H:i:s");

// 1. Cek Validitas Token di database
// Token harus cocok DAN waktu sekarang belum melewati expires_at
$sql = "SELECT email FROM password_resets WHERE token = '$token' AND expires_at >= '$now'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) === 0) {
    echo json_encode(['success' => false, 'message' => 'Link reset tidak valid atau sudah kadaluarsa (expired).']);
    exit;
}

$row = mysqli_fetch_assoc($result);
$email = $row['email'];

// 2. Update Password di tabel users
$hashed_password = password_hash($password, PASSWORD_DEFAULT);
$update = mysqli_query($conn, "UPDATE users SET password = '$hashed_password' WHERE username = '$email'");

if ($update) {
    // 3. Hapus token agar tidak bisa dipakai lagi (One-time use)
    mysqli_query($conn, "DELETE FROM password_resets WHERE email = '$email'");
    
    echo json_encode(['success' => true, 'message' => 'Password berhasil diubah']);
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal mengupdate password: ' . mysqli_error($conn)]);
}

mysqli_close($conn);
?>