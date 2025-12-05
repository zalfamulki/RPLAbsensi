<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$email = clean_input($data['email']);

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email wajib diisi']);
    exit;
}

// 1. Cek apakah email terdaftar di tabel users
$check = mysqli_query($conn, "SELECT id FROM users WHERE username = '$email'");
if (mysqli_num_rows($check) == 0) {
    echo json_encode(['success' => false, 'message' => 'Email tidak ditemukan dalam sistem.']);
    exit;
}

// 2. Generate Token Unik (Random String)
$token = bin2hex(random_bytes(32));
// Token berlaku selama 1 jam (Now + 1 hour)
$expires = date("Y-m-d H:i:s", strtotime('+1 hour'));

// 3. Simpan ke tabel password_resets
// Hapus request reset lama dari email ini jika ada
mysqli_query($conn, "DELETE FROM password_resets WHERE email = '$email'");

$sql = "INSERT INTO password_resets (email, token, expires_at) VALUES ('$email', '$token', '$expires')";
if (mysqli_query($conn, $sql)) {
    
    // --- BUAT LINK RESET ---
    // Sesuaikan localhost ini dengan alamat project Anda
    $link = "http://localhost/absensi/reset-password.html?token=" . $token;

    // --- PENGIRIMAN EMAIL (SIMULASI) ---
    // Untuk mengirim email asli, Anda butuh library PHPMailer.
    // Di sini saya kirim link balik ke JSON agar bisa dites lewat alert.
    
    echo json_encode([
        'success' => true, 
        'message' => 'Link reset telah dikirim ke email Anda.',
        'debug_link' => $link // Hapus baris ini jika sudah live production
    ]);

} else {
    echo json_encode(['success' => false, 'message' => 'Gagal membuat token: ' . mysqli_error($conn)]);
}

mysqli_close($conn);
?>