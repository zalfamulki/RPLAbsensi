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

if (empty($data['nip'])) {
    json_response(false, 'NIP tidak boleh kosong');
}

$nip = clean_input($data['nip']);

// Cek apakah dosen ada
$check_sql = "SELECT user_id, nama FROM dosen WHERE nip = '$nip'";
$check_result = mysqli_query($conn, $check_sql);

if (mysqli_num_rows($check_result) == 0) {
    json_response(false, 'Data dosen tidak ditemukan');
}

$row = mysqli_fetch_assoc($check_result);
$user_id = $row['user_id'];
$nama_dosen = $row['nama'];

mysqli_begin_transaction($conn);

try {
    // Cek apakah dosen mengampu kelas
    $check_kelas = "SELECT COUNT(*) as total FROM kelas WHERE nip_dosen = '$nip'";
    $result_kelas = mysqli_query($conn, $check_kelas);
    $kelas_count = mysqli_fetch_assoc($result_kelas)['total'];
    
    if ($kelas_count > 0) {
        // Ada kelas yang diampu
        // Opsi 1: Tolak penghapusan
        // throw new Exception("Dosen tidak dapat dihapus karena masih mengampu $kelas_count kelas. Hapus kelas terlebih dahulu.");
        
        // Opsi 2: Hapus semua kelas yang diampu (CASCADE)
        // Data kelas akan terhapus otomatis karena FOREIGN KEY CASCADE
        // Untuk keamanan, kita berikan informasi
    }
    
    // Cek apakah ada sesi perkuliahan yang dibuat oleh dosen ini
    $check_sesi = "SELECT COUNT(*) as total FROM sesi_perkuliahan s 
                   JOIN kelas k ON s.kode_kelas = k.kode_kelas 
                   WHERE k.nip_dosen = '$nip'";
    $result_sesi = mysqli_query($conn, $check_sesi);
    $sesi_count = mysqli_fetch_assoc($result_sesi)['total'];
    
    // Hapus data user (akan otomatis hapus dosen karena ON DELETE CASCADE)
    $delete_sql = "DELETE FROM users WHERE id = $user_id";
    
    if (!mysqli_query($conn, $delete_sql)) {
        throw new Exception('Gagal menghapus data: ' . mysqli_error($conn));
    }
    
    // Log aktivitas
    $admin_name = $_SESSION['nama'] ?? 'Admin';
    $log_message = "$admin_name menghapus dosen: $nama_dosen (NIP: $nip)";
    
    // Commit transaction
    mysqli_commit($conn);
    
    json_response(true, 'Data dosen berhasil dihapus', [
        'nip' => $nip,
        'nama' => $nama_dosen,
        'kelas_deleted' => $kelas_count,
        'sesi_deleted' => $sesi_count,
        'warning' => $kelas_count > 0 ? "Semua kelas yang diampu ($kelas_count kelas) dan data terkait telah dihapus" : null
    ]);
    
} catch (Exception $e) {
    mysqli_rollback($conn);
    json_response(false, $e->getMessage());
}

mysqli_close($conn);
?>