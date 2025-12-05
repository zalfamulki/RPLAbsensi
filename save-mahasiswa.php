<?php
session_start();
require_once '../config/database.php';

// Cek apakah user sudah login dan role admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    json_response(false, 'Unauthorized');
}

// Ambil data JSON dari request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validasi input
if (empty($data['nim']) || empty($data['nama']) || empty($data['prodi']) || 
    empty($data['email']) || empty($data['phone'])) {
    json_response(false, 'Semua field wajib diisi');
}

$nim = clean_input($data['nim']);
$nama = clean_input($data['nama']);
$prodi = clean_input($data['prodi']);
$email = clean_input($data['email']);
$phone = clean_input($data['phone']);
$password = isset($data['password']) ? $data['password'] : '';

// Validasi format NIM (harus angka)
if (!preg_match('/^[0-9]+$/', $nim)) {
    json_response(false, 'NIM harus berupa angka');
}

// Validasi format email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'Format email tidak valid');
}

// Validasi format phone (harus angka dan minimal 10 digit)
if (!preg_match('/^[0-9]{10,15}$/', $phone)) {
    json_response(false, 'Format nomor HP tidak valid (10-15 digit)');
}

mysqli_begin_transaction($conn);

try {
    // Cek apakah update atau insert baru
    if (!empty($data['id'])) {
        // UPDATE
        $old_nim = clean_input($data['id']);
        
        // Cek apakah mahasiswa ada
        $check_sql = "SELECT user_id FROM mahasiswa WHERE nim = '$old_nim'";
        $check_result = mysqli_query($conn, $check_sql);
        
        if (mysqli_num_rows($check_result) == 0) {
            throw new Exception('Data mahasiswa tidak ditemukan');
        }
        
        $row = mysqli_fetch_assoc($check_result);
        $user_id = $row['user_id'];
        
        // Jika NIM berubah, cek apakah NIM baru sudah dipakai
        if ($old_nim != $nim) {
            $check_new_nim = "SELECT nim FROM mahasiswa WHERE nim = '$nim'";
            $result_new_nim = mysqli_query($conn, $check_new_nim);
            if (mysqli_num_rows($result_new_nim) > 0) {
                throw new Exception('NIM baru sudah digunakan oleh mahasiswa lain');
            }
        }
        
        // Cek apakah email sudah dipakai oleh user lain
        $check_email = "SELECT m.nim FROM mahasiswa m WHERE m.email = '$email' AND m.nim != '$old_nim'";
        $result_email = mysqli_query($conn, $check_email);
        if (mysqli_num_rows($result_email) > 0) {
            throw new Exception('Email sudah digunakan oleh mahasiswa lain');
        }
        
        // Update tabel mahasiswa
        $update_mhs = "UPDATE mahasiswa SET 
                        nim = '$nim',
                        nama = '$nama',
                        prodi = '$prodi',
                        email = '$email',
                        phone = '$phone'
                      WHERE nim = '$old_nim'";
        
        if (!mysqli_query($conn, $update_mhs)) {
            throw new Exception('Gagal update data mahasiswa: ' . mysqli_error($conn));
        }
        
        // Update username di tabel users
        $update_user = "UPDATE users SET username = '$email'";
        
        // Update password jika diisi
        if (!empty($password)) {
            if (strlen($password) < 6) {
                throw new Exception('Password minimal 6 karakter');
            }
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $update_user .= ", password = '$hashed_password'";
        }
        
        $update_user .= " WHERE id = $user_id";
        
        if (!mysqli_query($conn, $update_user)) {
            throw new Exception('Gagal update data user: ' . mysqli_error($conn));
        }
        
        mysqli_commit($conn);
        json_response(true, 'Data mahasiswa berhasil diupdate');
        
    } else {
        // INSERT BARU
        
        // Cek apakah NIM sudah ada
        $check_nim = "SELECT nim FROM mahasiswa WHERE nim = '$nim'";
        $result_nim = mysqli_query($conn, $check_nim);
        
        if (mysqli_num_rows($result_nim) > 0) {
            throw new Exception('NIM sudah terdaftar');
        }
        
        // Cek apakah email sudah digunakan
        $check_email = "SELECT email FROM mahasiswa WHERE email = '$email'";
        $result_email = mysqli_query($conn, $check_email);
        
        if (mysqli_num_rows($result_email) > 0) {
            throw new Exception('Email sudah digunakan');
        }
        
        // Validasi password untuk data baru
        if (empty($password)) {
            throw new Exception('Password wajib diisi untuk mahasiswa baru');
        }
        
        if (strlen($password) < 6) {
            throw new Exception('Password minimal 6 karakter');
        }
        
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert ke tabel users
        $insert_user = "INSERT INTO users (username, password, role) 
                       VALUES ('$email', '$hashed_password', 'mahasiswa')";
        
        if (!mysqli_query($conn, $insert_user)) {
            throw new Exception('Gagal insert data user: ' . mysqli_error($conn));
        }
        
        $user_id = mysqli_insert_id($conn);
        
        // Insert ke tabel mahasiswa
        $insert_mhs = "INSERT INTO mahasiswa (user_id, nim, nama, prodi, email, phone) 
                      VALUES ($user_id, '$nim', '$nama', '$prodi', '$email', '$phone')";
        
        if (!mysqli_query($conn, $insert_mhs)) {
            throw new Exception('Gagal insert data mahasiswa: ' . mysqli_error($conn));
        }
        
        mysqli_commit($conn);
        json_response(true, 'Data mahasiswa berhasil ditambahkan');
    }
    
} catch (Exception $e) {
    mysqli_rollback($conn);
    json_response(false, $e->getMessage());
}

mysqli_close($conn);
?>