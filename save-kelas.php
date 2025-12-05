<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// Ambil data JSON dari request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validasi data
if (empty($data['kode_kelas']) || empty($data['nama_kelas']) || empty($data['mata_kuliah']) || 
    empty($data['dosen']) || empty($data['hari']) || empty($data['jam_mulai']) || 
    empty($data['jam_selesai']) || empty($data['ruangan']) || empty($data['semester'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Semua field harus diisi'
    ]);
    exit;
}

$kode_kelas = $data['kode_kelas'];
$nama_kelas = $data['nama_kelas'];
$mata_kuliah = $data['mata_kuliah'];
$dosen = $data['dosen'];
$hari = $data['hari'];
$jam_mulai = $data['jam_mulai'];
$jam_selesai = $data['jam_selesai'];
$ruangan = $data['ruangan'];
$semester = $data['semester'];

try {
    // Cek apakah ini update atau insert baru
    if (!empty($data['id'])) {
        // Update data kelas yang sudah ada
        $id = $data['id'];
        
        $stmt = $conn->prepare("UPDATE kelas SET 
            kode_kelas = ?, 
            nama_kelas = ?, 
            mata_kuliah = ?, 
            dosen = ?, 
            hari = ?, 
            jam_mulai = ?, 
            jam_selesai = ?, 
            ruangan = ?,
            semester = ?,
            updated_at = NOW() 
            WHERE kode_kelas = ?");
        
        $stmt->bind_param("ssssssssss", 
            $kode_kelas, 
            $nama_kelas, 
            $mata_kuliah, 
            $dosen, 
            $hari, 
            $jam_mulai, 
            $jam_selesai, 
            $ruangan,
            $semester,
            $id
        );
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Data kelas berhasil diupdate'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Gagal mengupdate data: ' . $stmt->error
            ]);
        }
        
    } else {
        // Insert data kelas baru
        
        // Cek apakah kode kelas sudah ada
        $check_stmt = $conn->prepare("SELECT kode_kelas FROM kelas WHERE kode_kelas = ?");
        $check_stmt->bind_param("s", $kode_kelas);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Kode kelas sudah terdaftar'
            ]);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO kelas 
            (kode_kelas, nama_kelas, mata_kuliah, dosen, hari, jam_mulai, jam_selesai, ruangan, semester, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        
        $stmt->bind_param("sssssssss", 
            $kode_kelas, 
            $nama_kelas, 
            $mata_kuliah, 
            $dosen, 
            $hari, 
            $jam_mulai, 
            $jam_selesai, 
            $ruangan,
            $semester
        );
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Data kelas berhasil ditambahkan'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Gagal menambahkan data: ' . $stmt->error
            ]);
        }
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>