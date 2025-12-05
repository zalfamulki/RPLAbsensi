<?php
session_start();
require_once '../config/database.php';
header('Content-Type: application/json');

// Cek Auth
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validasi
if (empty($data['nip']) || empty($data['nama']) || empty($data['email'])) {
    echo json_encode(['success' => false, 'message' => 'Data wajib (NIP, Nama, Email) harus diisi']);
    exit;
}

$id = isset($data['id']) ? clean_input($data['id']) : null;
$nip = clean_input($data['nip']);
$nama = clean_input($data['nama']);
$email = clean_input($data['email']);
$jabatan = clean_input($data['jabatan']);
$password = $data['password']; // Jangan di-clean karena password sensitif case

mysqli_begin_transaction($conn);

try {
    if ($id) {
        // --- MODE EDIT ---
        // 1. Ambil user_id dari tabel admin berdasarkan ID Admin
        $q_check = mysqli_query($conn, "SELECT user_id FROM admin WHERE id = '$id'");
        $row = mysqli_fetch_assoc($q_check);
        if (!$row) throw new Exception("Data admin tidak ditemukan.");
        $user_id = $row['user_id'];

        // 2. Update tabel users (Username/Email & Password)
        if (!empty($password)) {
            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $sql_user = "UPDATE users SET username = '$email', password = '$hashed' WHERE id = '$user_id'";
        } else {
            $sql_user = "UPDATE users SET username = '$email' WHERE id = '$user_id'";
        }
        mysqli_query($conn, $sql_user);

        // 3. Update tabel admin
        $sql_admin = "UPDATE admin SET nip='$nip', nama='$nama', email='$email', jabatan='$jabatan' WHERE id='$id'";
        mysqli_query($conn, $sql_admin);

        $msg = "Data admin berhasil diperbarui";

    } else {
        // --- MODE TAMBAH BARU ---
        if (empty($password)) throw new Exception("Password wajib diisi untuk admin baru");

        // 1. Cek email duplikat
        $cek = mysqli_query($conn, "SELECT id FROM users WHERE username = '$email'");
        if(mysqli_num_rows($cek) > 0) throw new Exception("Email sudah terdaftar");

        // 2. Insert tabel users
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $sql_user = "INSERT INTO users (username, password, role) VALUES ('$email', '$hashed', 'admin')";
        if (!mysqli_query($conn, $sql_user)) throw new Exception("Gagal buat user: " . mysqli_error($conn));
        
        $user_id = mysqli_insert_id($conn);

        // 3. Insert tabel admin
        $sql_admin = "INSERT INTO admin (user_id, nip, nama, email, jabatan) VALUES ('$user_id', '$nip', '$nama', '$email', '$jabatan')";
        if (!mysqli_query($conn, $sql_admin)) throw new Exception("Gagal simpan profil: " . mysqli_error($conn));

        $msg = "Admin baru berhasil ditambahkan";
    }

    mysqli_commit($conn);
    echo json_encode(['success' => true, 'message' => $msg]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

mysqli_close($conn);
?>