// ===== GLOBAL VARIABLES =====
let currentUser = {
    nama: 'Muhammad Rizki',
    nim: '1234567890',
    email: 'rizki@student.unsil.ac.id',
    status: 'Aktif',
    role: 'mahasiswa'
};

let qrTimer = null;
let qrDuration = 15 * 60; // in seconds
let qrStartTime = null;

// ===== ROLE SELECTION =====
if (document.getElementById('roleSelection')) {
    const roleCards = document.querySelectorAll('.role-card');
    const loginForm = document.getElementById('loginForm');
    const roleSelection = document.getElementById('roleSelection');
    const roleBadge = document.getElementById('roleBadge');
    const backToRole = document.getElementById('backToRole');
    
    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            const role = this.dataset.role;
            
            // Remove selected class from all cards
            roleCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Animate transition
            setTimeout(() => {
                roleSelection.style.display = 'none';
                loginForm.style.display = 'flex';
                roleBadge.textContent = role === 'mahasiswa' ? '👨‍🎓 Mahasiswa' : '👨‍🏫 Dosen';
                
                // Store selected role
                sessionStorage.setItem('selectedRole', role);
            }, 300);
        });
    });
    
    // Back to role selection
    if (backToRole) {
        backToRole.addEventListener('click', function() {
            loginForm.style.display = 'none';
            roleSelection.style.display = 'grid';
            roleCards.forEach(c => c.classList.remove('selected'));
        });
    }
}

// ===== PASSWORD TOGGLE =====
if (document.getElementById('togglePassword')) {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        // Toggle icon (you can add eye/eye-slash icons)
        this.style.color = type === 'text' ? 'var(--primary)' : 'var(--text-light)';
    });
}

// ===== LOGIN FUNCTIONALITY =====
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const selectedRole = sessionStorage.getItem('selectedRole');
        
        // Simple validation
        if (email && password && selectedRole) {
            // Store login status
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userRole', selectedRole);
            
            // Show loading
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Loading...</span>';
            submitBtn.disabled = true;
            
            // Simulate login process
            setTimeout(() => {
                if (selectedRole === 'dosen') {
                    window.location.href = 'dashboard-dosen.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
        } else {
            alert('Mohon pilih role dan isi semua field!');
        }
    });
}

// ===== CHECK LOGIN STATUS =====
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Redirect to login if not logged in
    if (!isLoggedIn && currentPage !== 'login.html' && currentPage !== 'index.html' && currentPage !== '') {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user is accessing correct dashboard
    if (isLoggedIn && userRole) {
        if (userRole === 'dosen' && currentPage === 'dashboard.html') {
            window.location.href = 'dashboard-dosen.html';
        } else if (userRole === 'mahasiswa' && currentPage === 'dashboard-dosen.html') {
            window.location.href = 'dashboard.html';
        }
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

// ===== GENERATE QR CODE (DOSEN) =====
if (document.getElementById('generateBtn')) {
    const generateBtn = document.getElementById('generateBtn');
    const courseSelect = document.getElementById('courseSelect');
    const durationInput = document.getElementById('duration');
    const roomInput = document.getElementById('room');
    const qrDisplayArea = document.getElementById('qrDisplayArea');
    
    generateBtn.addEventListener('click', function() {
        const course = courseSelect.value;
        const duration = parseInt(durationInput.value);
        const room = roomInput.value;
        
        if (!course) {
            alert('Mohon pilih mata kuliah!');
            return;
        }
        
        if (!room) {
            alert('Mohon isi ruangan!');
            return;
        }
        
        // Show loading
        const originalHTML = this.innerHTML;
        this.innerHTML = '<span>Generating...</span>';
        this.disabled = true;
        
        setTimeout(() => {
            // Generate QR Code
            const qrData = {
                course: course,
                room: room,
                timestamp: new Date().getTime(),
                sessionId: Math.random().toString(36).substring(7)
            };
            
            // Clear previous QR if exists
            document.getElementById('qrcode').innerHTML = '';
            
            // Generate new QR Code
            new QRCode(document.getElementById('qrcode'), {
                text: JSON.stringify(qrData),
                width: 220,
                height: 220,
                colorDark: '#4F46E5',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Update display
            document.getElementById('qrCourseName').textContent = courseSelect.options[courseSelect.selectedIndex].text;
            document.getElementById('qrCourseDetails').textContent = `Ruangan: ${room} • Durasi: ${duration} menit`;
            
            // Show QR display area
            qrDisplayArea.style.display = 'block';
            qrDisplayArea.scrollIntoView({ behavior: 'smooth' });
            
            // Start timer
            qrDuration = duration * 60;
            qrStartTime = new Date().getTime();
            startQRTimer();
            
            // Simulate real-time attendance
            startAttendanceSimulation();
            
            // Reset button
            this.innerHTML = originalHTML;
            this.disabled = false;
        }, 1000);
    });
}

// ===== QR TIMER =====
function startQRTimer() {
    if (qrTimer) clearInterval(qrTimer);
    
    const timerDisplay = document.getElementById('timer');
    const progressBar = document.getElementById('progressBar');
    
    qrTimer = setInterval(() => {
        const currentTime = new Date().getTime();
        const elapsed = Math.floor((currentTime - qrStartTime) / 1000);
        const remaining = qrDuration - elapsed;
        
        if (remaining <= 0) {
            clearInterval(qrTimer);
            timerDisplay.textContent = '00:00';
            progressBar.style.width = '0%';
            alert('Waktu QR Code telah habis!');
            return;
        }
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timerDisplay.innerHTML = `<span>${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>`;
        
        const progress = ((qrDuration - remaining) / qrDuration) * 100;
        progressBar.style.width = progress + '%';
    }, 1000);
}

// ===== REFRESH QR =====
if (document.getElementById('refreshBtn')) {
    document.getElementById('refreshBtn').addEventListener('click', function() {
        if (confirm('Refresh QR Code? Timer akan direset.')) {
            qrStartTime = new Date().getTime();
            
            // Regenerate QR with new data
            const qrData = {
                course: document.getElementById('courseSelect').value,
                room: document.getElementById('room').value,
                timestamp: new Date().getTime(),
                sessionId: Math.random().toString(36).substring(7)
            };
            
            document.getElementById('qrcode').innerHTML = '';
            new QRCode(document.getElementById('qrcode'), {
                text: JSON.stringify(qrData),
                width: 220,
                height: 220,
                colorDark: '#4F46E5',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Add refresh animation
            document.getElementById('qrcode').classList.add('zoom-in');
            setTimeout(() => {
                document.getElementById('qrcode').classList.remove('zoom-in');
            }, 300);
        }
    });
}

// ===== STOP SESSION =====
if (document.getElementById('stopBtn')) {
    document.getElementById('stopBtn').addEventListener('click', function() {
        if (confirm('Stop sesi absensi?')) {
            clearInterval(qrTimer);
            document.getElementById('qrDisplayArea').style.display = 'none';
            document.getElementById('courseSelect').value = '';
            document.getElementById('room').value = '';
            alert('Sesi absensi telah dihentikan.');
        }
    });
}

// ===== SIMULATE REAL-TIME ATTENDANCE =====
let attendanceSimulation = null;
function startAttendanceSimulation() {
    if (attendanceSimulation) clearInterval(attendanceSimulation);
    
    const studentNames = [
        'Ahmad Fauzi', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Lestari',
        'Eko Prasetyo', 'Fitri Handayani', 'Gilang Ramadhan', 'Hana Kartika',
        'Irfan Hakim', 'Joko Widodo', 'Kartini Sari', 'Linda Wijaya'
    ];
    
    let count = 0;
    const studentList = document.getElementById('studentList');
    const attendanceCount = document.getElementById('attendanceCount');
    
    attendanceSimulation = setInterval(() => {
        if (count >= 12) {
            clearInterval(attendanceSimulation);
            return;
        }
        
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.innerHTML = `
            <div>
                <div class="student-name">${studentNames[count]}</div>
                <div class="student-time">${new Date().toLocaleTimeString('id-ID')}</div>
            </div>
        `;
        
        studentList.insertBefore(studentItem, studentList.firstChild);
        count++;
        attendanceCount.textContent = count;
        
        // Remove animation class after animation completes
        setTimeout(() => {
            studentItem.style.animation = 'none';
        }, 300);
        
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
}

// ===== QR CODE SCANNER (MAHASISWA) =====
if (document.getElementById('qr-video')) {
    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
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
            
            // Add scanning animation
            document.querySelector('.qr-scanner-frame').classList.add('animate-in');
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Tidak dapat mengakses kamera. Gunakan input manual atau izinkan akses kamera.');
        }
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
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>Memproses...</span>';
        btn.disabled = true;
        
        setTimeout(() => {
            // Success animation
            btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M16 6L8 14l-4-4" stroke="white" fill="none" stroke-width="2"/></svg> <span>Berhasil!</span>';
            btn.style.background = 'var(--success)';
            
            setTimeout(() => {
                alert('✅ Absensi berhasil dicatat!\n\nMata Kuliah: ' + document.getElementById('courseSelect').options[document.getElementById('courseSelect').selectedIndex].text);
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
                document.getElementById('manualCode').value = '';
                
                // Redirect to history page
                setTimeout(() => {
                    window.location.href = 'riwayat-absensi.html';
                }, 1000);
            }, 1000);
        }, 1500);
    });
}

// ===== NOTIFICATION BUTTON =====
if (document.getElementById('notifBtn')) {
    document.getElementById('notifBtn').addEventListener('click', function() {
        const notifications = [
            '📢 Pengumuman: Jadwal kuliah Sistem Digital diundur ke pukul 14:00',
            '✅ Absensi Anda untuk mata kuliah PBO telah tercatat',
            '⏰ Reminder: Kuliah Basis Data dimulai dalam 30 menit'
        ];
        
        alert(notifications.join('\n\n'));
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
                    
                    // Add success feedback
                    const uploadBtn = document.querySelector('.photo-upload-btn');
                    uploadBtn.style.background = 'var(--success)';
                    setTimeout(() => {
                        uploadBtn.style.background = '';
                    }, 1000);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    });
}

// ===== ADD INTERACTIVE EFFECTS =====
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.info-card, .welcome-card, .stat-card, .schedule-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.schedule-card, .action-btn, .stat-card');
    animatedElements.forEach(el => observer.observe(el));
});

console.log('🚀 UnivSync Attend - System Ready');
console.log('📱 Current Page:', window.location.pathname);
console.log('👤 User Role:', sessionStorage.getItem('userRole'));