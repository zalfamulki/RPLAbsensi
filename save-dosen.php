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
if (empty($data['nip']) || empty($data['nidn']) || empty($data['nama']) || 
    empty($data['prodi']) || empty($data['email']) || empty($data['phone'])) {
    json_response(false, 'Semua field wajib diisi');
}

$nip = clean_input($data['nip']);
$nidn = clean_input($data['nidn']);
$nama = clean_input($data['nama']);
$jabatan = clean_input($data['jabatan'] ?? '');
$prodi = clean_input($data['prodi']);
$email = clean_input($data['email']);
$phone = clean_input($data['phone']);
$password = isset($data['password']) ? $data['password'] : '';

// Validasi format NIP (harus angka, biasanya 18 digit)
if (!preg_match('/^[0-9]{18}$/', $nip)) {
    json_response(false, 'NIP harus 18 digit angka');
}

// Validasi format NIDN (harus angka, biasanya 10 digit)
if (!preg_match('/^[0-9]{10}$/', $nidn)) {
    json_response(false, 'NIDN harus 10 digit angka');
}

// Validasi format email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'Format email tidak valid');
}

// Validasi format phone
if (!preg_match('/^[0-9]{10,15}$/', $phone)) {
    json_response(false, 'Format nomor HP tidak valid (10-15 digit)');
}

mysqli_begin_transaction($conn);

try {
    // Cek apakah update atau insert baru
    if (!empty($data['id'])) {
        // UPDATE
        $old_nip = clean_input($data['id']);
        
        // Cek apakah dosen ada
        $check_sql = "SELECT user_id FROM dosen WHERE nip = '$old_nip'";
        $check_result = mysqli_query($conn, $check_sql);
        
        if (mysqli_num_rows($check_result) == 0) {
            throw new Exception('Data dosen tidak ditemukan');
        }
        
        $row = mysqli_fetch_assoc($check_result);
        $user_id = $row['user_id'];
        
        // Jika NIP berubah, cek apakah NIP baru sudah dipakai
        if ($old_nip != $nip) {
            $check_new_nip = "SELECT nip FROM dosen WHERE nip = '$nip'";
            $result_new_nip = mysqli_query($conn, $check_new_nip);
            if (mysqli_num_rows($result_new_nip) > 0) {
                throw new Exception('NIP baru sudah digunakan oleh dosen lain');
            }
        }
        
        // Cek apakah NIDN sudah dipakai dosen lain
        $check_nidn = "SELECT nip FROM dosen WHERE nidn = '$nidn' AND nip != '$old_nip'";
        $result_nidn = mysqli_query($conn, $check_nidn);
        if (mysqli_num_rows($result_nidn) > 0) {
            throw new Exception('NIDN sudah digunakan oleh dosen lain');
        }
        
        // Cek apakah email sudah dipakai oleh user lain
        $check_email = "SELECT d.nip FROM dosen d WHERE d.email = '$email' AND d.nip != '$old_nip'";
        $result_email = mysqli_query($conn, $check_email);
        if (mysqli_num_rows($result_email) > 0) {
            throw new Exception('Email sudah digunakan oleh dosen lain');
        }
        
        // Update tabel dosen
        $update_dosen = "UPDATE dosen SET 
                          nip = '$nip',
                          nidn = '$nidn',
                          nama = '$nama',
                          jabatan = '$jabatan',
                          prodi = '$prodi',
                          email = '$email',
                          phone = '$phone'
                        WHERE nip = '$old_nip'";
        
        if (!mysqli_query($conn, $update_dosen)) {
            throw new Exception('Gagal update data dosen: ' . mysqli_error($conn));
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
        json_response(true, 'Data dosen berhasil diupdate');
        
    } else {
        // INSERT BARU
        
        // Cek apakah NIP sudah ada
        $check_nip = "SELECT nip FROM dosen WHERE nip = '$nip'";
        $result_nip = mysqli_query($conn, $check_nip);
        
        if (mysqli_num_rows($result_nip) > 0) {
            throw new Exception('NIP sudah terdaftar');
        }
        
        // Cek apakah NIDN sudah ada
        $check_nidn = "SELECT nidn FROM dosen WHERE nidn = '$nidn'";
        $result_nidn = mysqli_query($conn, $check_nidn);
        
        if (mysqli_num_rows($result_nidn) > 0) {
            throw new Exception('NIDN sudah terdaftar');
        }
        
        // Cek apakah email sudah digunakan
        $check_email = "SELECT email FROM dosen WHERE email = '$email'";
        $result_email = mysqli_query($conn, $check_email);
        
        if (mysqli_num_rows($result_email) > 0) {
            throw new Exception('Email sudah digunakan');
        }
        
        // Validasi password untuk data baru
        if (empty($password)) {
            throw new Exception('Password wajib diisi untuk dosen baru');
        }
        
        if (strlen($password) < 6) {
            throw new Exception('Password minimal 6 karakter');
        }
        
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert ke tabel users
        $insert_user = "INSERT INTO users (username, password, role) 
                       VALUES ('$email', '$hashed_password', 'dosen')";
        
        if (!mysqli_query($conn, $insert_user)) {
            throw new Exception('Gagal insert data user: ' . mysqli_error($conn));
        }
        
        $user_id = mysqli_insert_id($conn);
        
        // Insert ke tabel dosen
        $insert_dosen = "INSERT INTO dosen (user_id, nip, nidn, nama, jabatan, prodi, email, phone) 
                        VALUES ($user_id, '$nip', '$nidn', '$nama', '$jabatan', '$prodi', '$email', '$phone')";
        
        if (!mysqli_query($conn, $insert_dosen)) {
            throw new Exception('Gagal insert data dosen: ' . mysqli_error($conn));
        }
        
        mysqli_commit($conn);
        json_response(true, 'Data dosen berhasil ditambahkan');
    }
    
} catch (Exception $e) {
    mysqli_rollback($conn);
    json_response(false, $e->getMessage());
}

mysqli_close($conn);
?>