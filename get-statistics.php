<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    json_response(false, 'Unauthorized');
}

$sql_mhs = "SELECT COUNT(*) as total FROM mahasiswa";
$result_mhs = mysqli_query($conn, $sql_mhs);
$total_mahasiswa = mysqli_fetch_assoc($result_mhs)['total'];

$sql_dosen = "SELECT COUNT(*) as total FROM dosen";
$result_dosen = mysqli_query($conn, $sql_dosen);
$total_dosen = mysqli_fetch_assoc($result_dosen)['total'];

$sql_kelas = "SELECT COUNT(*) as total FROM kelas";
$result_kelas = mysqli_query($conn, $sql_kelas);
$total_kelas = mysqli_fetch_assoc($result_kelas)['total'];

$today = date('Y-m-d');
$sql_absensi = "SELECT COUNT(DISTINCT a.id) as total 
                FROM absensi a 
                JOIN sesi_perkuliahan s ON a.sesi_id = s.id 
                WHERE DATE(a.waktu_absen) = '$today' AND a.status = 'hadir'";
$result_absensi = mysqli_query($conn, $sql_absensi);
$absensi_hari_ini = mysqli_fetch_assoc($result_absensi)['total'];

$data = [
    'total_mahasiswa' => $total_mahasiswa,
    'total_dosen' => $total_dosen,
    'total_kelas' => $total_kelas,
    'absensi_hari_ini' => $absensi_hari_ini
];

echo json_encode($data);
mysqli_close($conn);
?>