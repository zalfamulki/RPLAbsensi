// ===== GLOBAL VARIABLES =====
let currentUser = {
    nama: 'Muhammad Rizki',
    nim: '1234567890',
    email: 'rizki@student.unsil.ac.id',
    status: 'Aktif'
};

// ===== LOGIN FUNCTIONALITY =====
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (email && password) {
            // Store login status
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userEmail', email);
            
            // Show loading
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Loading...';
            submitBtn.disabled = true;
            
            // Simulate login process
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            alert('Mohon isi semua field!');
        }
    });
}

// ===== CHECK LOGIN STATUS =====
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Redirect to login if not logged in (except on login and index page)
    if (!isLoggedIn && currentPage !== 'login.html' && currentPage !== 'index.html' && currentPage !== '') {
        window.location.href = 'login.html';
    }
}

// Run check on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLoginStatus);
} else {
    checkLoginStatus();
}

// ===== LOGOUT FUNCTIONALITY =====
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
}

// ===== PROFILE EDIT FUNCTIONALITY =====
if (document.getElementById('editBtn')) {
    const editBtn = document.getElementById('editBtn');
    const profileInputs = document.querySelectorAll('.profile-form input');
    let isEditing = false;
    
    editBtn.addEventListener('click', function() {
        if (!isEditing) {
            // Enable editing
            profileInputs.forEach(input => {
                if (input.id !== 'nim' && input.id !== 'status') {
                    input.removeAttribute('readonly');
                    input.style.background = 'white';
                }
            });
            editBtn.textContent = 'Simpan Perubahan';
            editBtn.classList.remove('btn-primary');
            editBtn.classList.add('btn-success');
            isEditing = true;
        } else {
            // Save changes
            profileInputs.forEach(input => {
                input.setAttribute('readonly', 'true');
                input.style.background = '#F9FAFB';
            });
            editBtn.textContent = 'Edit Profil';
            editBtn.classList.remove('btn-success');
            editBtn.classList.add('btn-primary');
            isEditing = false;
            
            alert('Profil berhasil diupdate!');
        }
    });
}

// ===== QR CODE SCANNER =====
if (document.getElementById('qr-video')) {
    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    let scanning = false;
    
    // Request camera access
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            video.srcObject = stream;
            video.play();
            scanning = true;
            scanQRCode();
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Tidak dapat mengakses kamera. Gunakan input manual.');
        }
    }
    
    // Simulate QR scanning (in real app, use a QR library like jsQR)
    function scanQRCode() {
        if (!scanning) return;
        
        // This is a placeholder - in production, use jsQR or similar library
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Simulate scanning
        setTimeout(() => {
            if (scanning) scanQRCode();
        }, 500);
    }
    
    // Start camera when page loads
    startCamera();
    
    // Stop camera when leaving page
    window.addEventListener('beforeunload', function() {
        scanning = false;
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    });
}

// ===== MANUAL QR CODE SUBMISSION =====
if (document.getElementById('submitManualBtn')) {
    document.getElementById('submitManualBtn').addEventListener('click', function() {
        const manualCode = document.getElementById('manualCode').value;
        const courseSelect = document.getElementById('courseSelect').value;
        
        if (!courseSelect) {
            alert('Mohon pilih mata kuliah terlebih dahulu!');
            return;
        }
        
        if (!manualCode) {
            alert('Mohon masukkan kode QR!');
            return;
        }
        
        // Simulate attendance submission
        const btn = this;
        btn.textContent = 'Memproses...';
        btn.disabled = true;
        
        setTimeout(() => {
            alert('Absensi berhasil dicatat!');
            btn.textContent = 'Submit';
            btn.disabled = false;
            document.getElementById('manualCode').value = '';
            
            // Redirect to history page
            setTimeout(() => {
                window.location.href = 'riwayat-absensi.html';
            }, 1000);
        }, 1500);
    });
}

// ===== COURSE FILTER =====
if (document.getElementById('filterCourse')) {
    document.getElementById('filterCourse').addEventListener('change', function() {
        const selectedCourse = this.value;
        const attendanceItems = document.querySelectorAll('.attendance-item');
        
        attendanceItems.forEach(item => {
            if (selectedCourse === 'all') {
                item.style.display = 'flex';
            } else {
                const courseTitle = item.querySelector('.attendance-details h3').textContent;
                if (courseTitle.includes(getCourseFullName(selectedCourse))) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
        
        // Update summary based on visible items
        updateSummary();
    });
}

function getCourseFullName(code) {
    const courses = {
        'PBO': 'Pemrograman Berorientasi Objek',
        'BASDAT': 'Basis Data',
        'JARKOM': 'Jaringan Komputer',
        'RPL': 'Rekayasa Perangkat Lunak',
        'SISDIG': 'Sistem Digital'
    };
    return courses[code] || '';
}

function updateSummary() {
    const visibleItems = document.querySelectorAll('.attendance-item[style*="display: flex"], .attendance-item:not([style*="display"])');
    let hadir = 0, izin = 0, alpha = 0;
    
    visibleItems.forEach(item => {
        const status = item.querySelector('.attendance-status');
        if (status.classList.contains('hadir')) hadir++;
        else if (status.classList.contains('izin')) izin++;
        else if (status.classList.contains('alpha')) alpha++;
    });
    
    // Update summary display
    const summaryStats = document.querySelectorAll('.stat-value');
    if (summaryStats.length >= 3) {
        summaryStats[0].textContent = hadir;
        summaryStats[1].textContent = izin;
        summaryStats[2].textContent = alpha;
    }
}

// ===== NOTIFICATION BUTTON =====
if (document.getElementById('notifBtn')) {
    document.getElementById('notifBtn').addEventListener('click', function() {
        alert('Tidak ada notifikasi baru');
    });
}

// ===== MENU BUTTON =====
if (document.getElementById('menuBtn')) {
    document.getElementById('menuBtn').addEventListener('click', function() {
        // Create simple menu
        const menuOptions = [
            'Pengaturan',
            'Bantuan',
            'Tentang Aplikasi',
            'Logout'
        ];
        
        const choice = confirm('Menu:\n1. Pengaturan\n2. Bantuan\n3. Tentang Aplikasi\n4. Logout\n\nPilih menu?');
        
        if (choice) {
            alert('Fitur dalam pengembangan');
        }
    });
}

// ===== PHOTO UPLOAD =====
if (document.querySelector('.photo-upload-btn')) {
    document.querySelector('.photo-upload-btn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';
                    
                    const photoDiv = document.querySelector('.profile-photo');
                    photoDiv.innerHTML = '';
                    photoDiv.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ===== FORM VALIDATION HELPERS =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateNIM(nim) {
    return nim.length >= 8 && /^\d+$/.test(nim);
}

// ===== LOADING ANIMATION =====
function showLoading(button) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    return originalText;
}

function hideLoading(button, originalText) {
    button.textContent = originalText;
    button.disabled = false;
}

// ===== CONSOLE LOG FOR DEBUGGING =====
console.log('UnivSync Attend - System Ready');
console.log('Current Page:', window.location.pathname);
console.log('Login Status:', sessionStorage.getItem('isLoggedIn'));