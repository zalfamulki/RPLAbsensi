<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

// Ambil data JSON dari request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validasi input
if (empty($data['email']) || empty($data['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Email dan password harus diisi'
    ]);
    exit;
}

$email = clean_input($data['email']);
$password = $data['password'];

// Query untuk mendapatkan data user berdasarkan email
$sql = "SELECT u.*, 
        m.nim, m.nama as nama_mahasiswa, m.prodi as prodi_mahasiswa,
        d.nip as nip_dosen, d.nidn, d.nama as nama_dosen, d.jabatan as jabatan_dosen, d.prodi as prodi_dosen,
        a.nip as nip_admin, a.nama as nama_admin, a.jabatan as jabatan_admin
        FROM users u
        LEFT JOIN mahasiswa m ON u.id = m.user_id
        LEFT JOIN dosen d ON u.id = d.user_id
        LEFT JOIN admin a ON u.id = a.user_id
        WHERE u.username = '$email' OR m.email = '$email' OR d.email = '$email' OR a.email = '$email'";

$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) === 1) {
    $user = mysqli_fetch_assoc($result);
    
    // Verifikasi password
    if (password_verify($password, $user['password'])) {
        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        
        // Set data tambahan berdasarkan role
        $userData = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ];
        
        if ($user['role'] == 'mahasiswa') {
            $_SESSION['nim'] = $user['nim'];
            $_SESSION['nama'] = $user['nama_mahasiswa'];
            $_SESSION['prodi'] = $user['prodi_mahasiswa'];
            
            $userData['nim'] = $user['nim'];
            $userData['nama'] = $user['nama_mahasiswa'];
            $userData['prodi'] = $user['prodi_mahasiswa'];
            $userData['redirect'] = 'dashboard.html';
            
        } elseif ($user['role'] == 'dosen') {
            $_SESSION['nip'] = $user['nip_dosen'];
            $_SESSION['nidn'] = $user['nidn'];
            $_SESSION['nama'] = $user['nama_dosen'];
            $_SESSION['jabatan'] = $user['jabatan_dosen'];
            $_SESSION['prodi'] = $user['prodi_dosen'];
            
            $userData['nip'] = $user['nip_dosen'];
            $userData['nidn'] = $user['nidn'];
            $userData['nama'] = $user['nama_dosen'];
            $userData['jabatan'] = $user['jabatan_dosen'];
            $userData['prodi'] = $user['prodi_dosen'];
            $userData['redirect'] = 'dashboard-dosen.html';
            
        } elseif ($user['role'] == 'admin') {
            $_SESSION['nip'] = $user['nip_admin'];
            $_SESSION['nama'] = $user['nama_admin'];
            $_SESSION['jabatan'] = $user['jabatan_admin'];
            
            $userData['nip'] = $user['nip_admin'];
            $userData['nama'] = $user['nama_admin'];
            $userData['jabatan'] = $user['jabatan_admin'];
            $userData['redirect'] = 'dashboard-admin.html';
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => $userData
        ]);
        
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Password salah'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Email tidak ditemukan'
    ]);
}

mysqli_close($conn);
?>