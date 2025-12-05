<?php
session_start();
require_once '../config/database.php';

// Cek apakah user sudah login
if (!isset($_SESSION['user_id'])) {
    json_response(false, 'Unauthorized - Silakan login terlebih dahulu');
}

// Ambil data JSON dari request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validasi input
if (empty($data['qr_code']) || empty($data['nim'])) {
    json_response(false, 'Data tidak lengkap');
}

$qr_code = clean_input($data['qr_code']);
$nim = clean_input($data['nim']);
$keterangan = clean_input($data['keterangan'] ?? '');

// Decode QR code (format: JSON string)
$qr_data = json_decode($qr_code, true);

if (!$qr_data || !isset($qr_data['sessionId']) || !isset($qr_data['course'])) {
    json_response(false, 'Format QR Code tidak valid');
}

$session_id = clean_input($qr_data['sessionId']);
$course_code = clean_input($qr_data['course']);
$qr_timestamp = $qr_data['timestamp'] ?? 0;

// Validasi apakah QR code masih valid (tidak expired)
$current_time = time() * 1000; // Convert to milliseconds
$max_duration = 15 * 60 * 1000; // 15 menit dalam milliseconds

if (($current_time - $qr_timestamp) > $max_duration) {
    json_response(false, 'QR Code sudah expired. Silakan minta dosen untuk generate QR baru');
}

mysqli_begin_transaction($conn);

try {
    // Cek apakah mahasiswa terdaftar
    $check_mhs = "SELECT nama, prodi FROM mahasiswa WHERE nim = '$nim'";
    $result_mhs = mysqli_query($conn, $check_mhs);
    
    if (mysqli_num_rows($result_mhs) == 0) {
        throw new Exception('Mahasiswa tidak terdaftar');
    }
    
    $mahasiswa = mysqli_fetch_assoc($result_mhs);
    
    // Cari atau buat sesi perkuliahan
    $today = date('Y-m-d');
    $check_sesi = "SELECT s.id, k.kode_kelas, k.nama_mk, k.nip_dosen, d.nama as nama_dosen
                   FROM sesi_perkuliahan s
                   JOIN kelas k ON s.kode_kelas = k.kode_kelas
                   LEFT JOIN mata_kuliah mk ON k.kode_mk = mk.kode_mk
                   LEFT JOIN dosen d ON k.nip_dosen = d.nip
                   WHERE DATE(s.tanggal) = '$today' 
                   AND s.qr_code = '$session_id'
                   AND s.status IN ('ongoing', 'scheduled')";
    
    $result_sesi = mysqli_query($conn, $check_sesi);
    
    if (mysqli_num_rows($result_sesi) == 0) {
        // Jika tidak ada sesi, buat sesi baru
        // Cari kelas berdasarkan course code
        $find_kelas = "SELECT k.*, mk.nama_mk 
                       FROM kelas k 
                       JOIN mata_kuliah mk ON k.kode_mk = mk.kode_mk
                       WHERE k.kode_mk = '$course_code' OR mk.nama_mk LIKE '%$course_code%'
                       LIMIT 1";
        
        $result_kelas = mysqli_query($conn, $find_kelas);
        
        if (mysqli_num_rows($result_kelas) == 0) {
            throw new Exception('Kelas tidak ditemukan. Pastikan Anda sudah terdaftar di kelas ini');
        }
        
        $kelas = mysqli_fetch_assoc($result_kelas);
        $kode_kelas = $kelas['kode_kelas'];
        
        // Cek apakah mahasiswa terdaftar di kelas ini
        $check_peserta = "SELECT * FROM peserta_kelas WHERE kode_kelas = '$kode_kelas' AND nim = '$nim'";
        $result_peserta = mysqli_query($conn, $check_peserta);
        
        if (mysqli_num_rows($result_peserta) == 0) {
            throw new Exception('Anda tidak terdaftar di kelas ' . $kelas['nama_mk']);
        }
        
        // Hitung pertemuan ke berapa
        $count_pertemuan = "SELECT COUNT(*) as total FROM sesi_perkuliahan WHERE kode_kelas = '$kode_kelas'";
        $result_count = mysqli_query($conn, $count_pertemuan);
        $pertemuan_ke = mysqli_fetch_assoc($result_count)['total'] + 1;
        
        // Buat sesi baru
        $insert_sesi = "INSERT INTO sesi_perkuliahan (kode_kelas, pertemuan_ke, tanggal, qr_code, status) 
                       VALUES ('$kode_kelas', $pertemuan_ke, '$today', '$session_id', 'ongoing')";
        
        if (!mysqli_query($conn, $insert_sesi)) {
            throw new Exception('Gagal membuat sesi perkuliahan');
        }
        
        $sesi_id = mysqli_insert_id($conn);
        
    } else {
        $sesi = mysqli_fetch_assoc($result_sesi);
        $sesi_id = $sesi['id'];
        $kode_kelas = $sesi['kode_kelas'];
        
        // Cek apakah mahasiswa terdaftar di kelas ini
        $check_peserta = "SELECT * FROM peserta_kelas WHERE kode_kelas = '$kode_kelas' AND nim = '$nim'";
        $result_peserta = mysqli_query($conn, $check_peserta);
        
        if (mysqli_num_rows($result_peserta) == 0) {
            throw new Exception('Anda tidak terdaftar di kelas ini');
        }
    }
    
    // Cek apakah sudah absen sebelumnya
    $check_absen = "SELECT * FROM absensi WHERE sesi_id = $sesi_id AND nim = '$nim'";
    $result_absen = mysqli_query($conn, $check_absen);
    
    if (mysqli_num_rows($result_absen) > 0) {
        throw new Exception('Anda sudah melakukan absensi untuk sesi ini');
    }
    
    // Insert absensi
    $waktu_absen = date('Y-m-d H:i:s');
    $insert_absensi = "INSERT INTO absensi (sesi_id, nim, status, waktu_absen, keterangan) 
                      VALUES ($sesi_id, '$nim', 'hadir', '$waktu_absen', '$keterangan')";
    
    if (!mysqli_query($conn, $insert_absensi)) {
        throw new Exception('Gagal menyimpan absensi: ' . mysqli_error($conn));
    }
    
    // Update status sesi menjadi ongoing jika scheduled
    $update_sesi = "UPDATE sesi_perkuliahan SET status = 'ongoing' WHERE id = $sesi_id AND status = 'scheduled'";
    mysqli_query($conn, $update_sesi);
    
    mysqli_commit($conn);
    
    json_response(true, 'Absensi berhasil dicatat', [
        'nim' => $nim,
        'nama' => $mahasiswa['nama'],
        'waktu_absen' => $waktu_absen,
        'status' => 'hadir',
        'mata_kuliah' => $qr_data['courseName'] ?? 'Unknown'
    ]);
    
} catch (Exception $e) {
    mysqli_rollback($conn);
    json_response(false, $e->getMessage());
}

mysqli_close($conn);
?>