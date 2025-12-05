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

if (empty($data['nim'])) {
    json_response(false, 'NIM tidak boleh kosong');
}

$nim = clean_input($data['nim']);

// Cek apakah mahasiswa ada
$check_sql = "SELECT user_id, nama FROM mahasiswa WHERE nim = '$nim'";
$check_result = mysqli_query($conn, $check_sql);

if (mysqli_num_rows($check_result) == 0) {
    json_response(false, 'Data mahasiswa tidak ditemukan');
}

$row = mysqli_fetch_assoc($check_result);
$user_id = $row['user_id'];
$nama_mahasiswa = $row['nama'];

mysqli_begin_transaction($conn);

try {
    // Cek apakah mahasiswa memiliki data absensi
    $check_absensi = "SELECT COUNT(*) as total FROM absensi WHERE nim = '$nim'";
    $result_absensi = mysqli_query($conn, $check_absensi);
    $absensi_count = mysqli_fetch_assoc($result_absensi)['total'];
    
    if ($absensi_count > 0) {
        // Jika ada data absensi, beri warning tapi tetap bisa dihapus
        // Data absensi akan terhapus otomatis karena ON DELETE CASCADE
    }
    
    // Cek apakah mahasiswa terdaftar di kelas
    $check_kelas = "SELECT COUNT(*) as total FROM peserta_kelas WHERE nim = '$nim'";
    $result_kelas = mysqli_query($conn, $check_kelas);
    $kelas_count = mysqli_fetch_assoc($result_kelas)['total'];
    
    if ($kelas_count > 0) {
        // Jika terdaftar di kelas, data akan terhapus otomatis karena CASCADE
    }
    
    // Hapus data user (akan otomatis hapus mahasiswa karena ON DELETE CASCADE)
    $delete_sql = "DELETE FROM users WHERE id = $user_id";
    
    if (!mysqli_query($conn, $delete_sql)) {
        throw new Exception('Gagal menghapus data: ' . mysqli_error($conn));
    }
    
    // Log aktivitas (optional - bisa ditambahkan tabel log jika diperlukan)
    $admin_name = $_SESSION['nama'] ?? 'Admin';
    $log_message = "$admin_name menghapus mahasiswa: $nama_mahasiswa (NIM: $nim)";
    
    // Commit transaction
    mysqli_commit($conn);
    
    json_response(true, 'Data mahasiswa berhasil dihapus', [
        'nim' => $nim,
        'nama' => $nama_mahasiswa,
        'absensi_deleted' => $absensi_count,
        'kelas_unregistered' => $kelas_count
    ]);
    
} catch (Exception $e) {
    mysqli_rollback($conn);
    json_response(false, $e->getMessage());
}

mysqli_close($conn);
?>