// ===== GLOBAL VARIABLES =====
let currentUser = {
    nama: 'Zalfa Malikul Mulqi',
    nim: '247006111117',
    email: 'zalfa@student.unsil.ac.id',
    status: 'Aktif',
    role: 'mahasiswa'
};

let qrTimer = null;
let qrDuration = 15 * 60; // in seconds
let qrStartTime = null;
let currentSession = null;
let attendanceSimulation = null;

// ===== CLASS HISTORY STORAGE =====
function getClassHistory() {
    const history = localStorage.getItem('classHistory');
    return history ? JSON.parse(history) : [];
}

function saveClassHistory(sessionData) {
    const history = getClassHistory();
    history.unshift(sessionData); // Add to beginning
    localStorage.setItem('classHistory', JSON.stringify(history));
}

function saveCurrentSessionToHistory() {
    if (currentSession) {
        const attendanceCount = parseInt(document.getElementById('attendanceCount').textContent) || 0;
        
        const sessionData = {
            id: currentSession.sessionId,
            course: currentSession.courseName,
            courseCode: currentSession.courseCode,
            room: currentSession.room,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: currentSession.time,
            timestamp: new Date().getTime(),
            stats: {
                hadir: attendanceCount,
                izin: Math.floor(Math.random() * 5), // Simulate
                alpha: Math.floor(Math.random() * 3)  // Simulate
            }
        };
        
        saveClassHistory(sessionData);
        console.log('Session saved to history:', sessionData);
    }
}

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
        const courseValue = courseSelect.value;
        const courseName = courseSelect.options[courseSelect.selectedIndex].text;
        const duration = parseInt(durationInput.value);
        const room = roomInput.value;
        
        if (!courseValue) {
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
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            // Store current session data
            currentSession = {
                courseCode: courseValue,
                courseName: courseName,
                room: room,
                time: timeString + ' WIB',
                duration: duration,
                sessionId: Math.random().toString(36).substring(7),
                startTime: now.getTime()
            };
            
            // Generate QR Code
            const qrData = {
                course: courseValue,
                courseName: courseName,
                room: room,
                timestamp: now.getTime(),
                sessionId: currentSession.sessionId
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
            document.getElementById('qrCourseName').textContent = courseName;
            document.getElementById('qrCourseDetails').textContent = `Ruangan: ${room} • Durasi: ${duration} menit`;
            
            // Show QR display area
            qrDisplayArea.style.display = 'block';
            qrDisplayArea.scrollIntoView({ behavior: 'smooth' });
            
            // Start timer
            qrDuration = duration * 60;
            qrStartTime = now.getTime();
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
            timerDisplay.innerHTML = '<span>00:00</span>';
            progressBar.style.width = '0%';
            
            // Auto save to history when time ends
            saveCurrentSessionToHistory();
            
            alert('⏰ Waktu QR Code telah habis!\n\nSesi absensi telah disimpan ke riwayat.');
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
        if (!currentSession) {
            alert('Tidak ada sesi aktif untuk di-refresh!');
            return;
        }
        
        if (confirm('Refresh QR Code? Timer akan direset dan QR code akan diperbarui.')) {
            // Save old session first
            saveCurrentSessionToHistory();
            
            // Reset timer
            const now = new Date();
            qrStartTime = now.getTime();
            currentSession.startTime = now.getTime();
            currentSession.sessionId = Math.random().toString(36).substring(7);
            
            // Regenerate QR with new data
            const qrData = {
                course: currentSession.courseCode,
                courseName: currentSession.courseName,
                room: currentSession.room,
                timestamp: now.getTime(),
                sessionId: currentSession.sessionId
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
            
            // Reset attendance counter
            document.getElementById('attendanceCount').textContent = '0';
            document.getElementById('studentList').innerHTML = '';
            
            // Restart attendance simulation
            if (attendanceSimulation) clearInterval(attendanceSimulation);
            startAttendanceSimulation();
            
            // Add refresh animation
            const qrBox = document.getElementById('qrcode');
            qrBox.style.animation = 'none';
            setTimeout(() => {
                qrBox.style.animation = 'qrAppear 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 10);
            
            // Show success message
            this.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M16 6L8 14l-4-4" stroke="currentColor" fill="none" stroke-width="2"/></svg> Berhasil!';
            this.style.background = 'var(--success)';
            this.style.color = 'white';
            this.style.borderColor = 'var(--success)';
            
            setTimeout(() => {
                this.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 10h3M15 10h3M4 4l1.5 1.5M14.5 5.5L16 4M5.5 14.5L4 16M16 16l-1.5-1.5" stroke="currentColor" fill="none" stroke-width="2"/><path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" fill="none" stroke-width="2"/><path d="M10 18a8 8 0 0 1-8-8" stroke="currentColor" fill="none" stroke-width="2"/></svg> Refresh';
                this.style.background = '';
                this.style.color = '';
                this.style.borderColor = '';
            }, 2000);
        }
    });
}

// ===== STOP SESSION =====
if (document.getElementById('stopBtn')) {
    document.getElementById('stopBtn').addEventListener('click', function() {
        if (!currentSession) {
            alert('Tidak ada sesi aktif!');
            return;
        }
        
        if (confirm('Stop sesi absensi? Data akan disimpan ke riwayat.')) {
            // Clear timers
            if (qrTimer) clearInterval(qrTimer);
            if (attendanceSimulation) clearInterval(attendanceSimulation);
            
            // Save to history
            saveCurrentSessionToHistory();
            
            // Reset display
            document.getElementById('qrDisplayArea').style.display = 'none';
            document.getElementById('courseSelect').value = '';
            document.getElementById('room').value = '';
            
            // Clear current session
            currentSession = null;
            
            alert('✅ Sesi absensi telah dihentikan dan disimpan ke riwayat.');
        }
    });
}

// ===== SIMULATE REAL-TIME ATTENDANCE =====
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

// ===== LOAD CLASS HISTORY (RIWAYAT KELAS PAGE) =====
if (document.getElementById('classHistoryList')) {
    function loadClassHistory() {
        const history = getClassHistory();
        const listContainer = document.getElementById('classHistoryList');
        const emptyState = document.getElementById('emptyState');
        
        if (history.length === 0) {
            listContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        listContainer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        
        listContainer.innerHTML = '';
        
        history.forEach((session, index) => {
            const card = document.createElement('div');
            card.className = 'class-session-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <div class="session-header">
                    <div class="session-title-group">
                        <h3>${session.course}</h3>
                        <p class="session-class">${session.room}</p>
                    </div>
                    <div class="session-date-badge">
                        <svg width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle;">
                            <rect x="2" y="3" width="12" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M5 1v2M11 1v2M2 7h12" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${session.date}
                    </div>
                </div>
                
                <div class="session-time">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M9 5v4l3 2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>${session.time}</span>
                </div>
                
                <div class="session-stats">
                    <div class="stat-box stat-hadir">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M16 6L8 14l-4-4" stroke="currentColor" fill="none" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${session.stats.hadir}</span>
                            <span class="stat-label">Hadir</span>
                        </div>
                    </div>
                    
                    <div class="stat-box stat-izin">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="8" stroke="currentColor" fill="none" stroke-width="2"/>
                                <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${session.stats.izin}</span>
                            <span class="stat-label">Izin</span>
                        </div>
                    </div>
                    
                    <div class="stat-box stat-alpha">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M14 6L6 14M6 6l8 8" stroke="currentColor" fill="none" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${session.stats.alpha}</span>
                            <span class="stat-label">Alpha</span>
                        </div>
                    </div>
                </div>
            `;
            
            listContainer.appendChild(card);
        });
        
        // Update summary statistics
        updateSummaryStats(history);
    }
    
    function updateSummaryStats(history) {
        const totalSessions = history.length;
        let totalHadir = 0;
        let totalMahasiswa = 0;
        
        history.forEach(session => {
            totalHadir += session.stats.hadir;
            totalMahasiswa += session.stats.hadir + session.stats.izin + session.stats.alpha;
        });
        
        const avgAttendance = totalMahasiswa > 0 ? Math.round((totalHadir / totalMahasiswa) * 100) : 0;
        
        // Update total sessions
        const totalSessionsElement = document.querySelector('.total-stats .total-stat-item:first-child .total-value');
        if (totalSessionsElement) {
            totalSessionsElement.textContent = totalSessions;
        }
        
        // Update average attendance
        const avgAttendanceElement = document.querySelector('.total-stats .total-stat-item:last-child .total-value');
        if (avgAttendanceElement) {
            avgAttendanceElement.textContent = avgAttendance + '%';
        }
    }
    
    // Load history on page load
    loadClassHistory();
    
    // Filter functionality
    const filterCourse = document.getElementById('filterCourse');
    const filterMonth = document.getElementById('filterMonth');
    
    if (filterCourse) {
        filterCourse.addEventListener('change', applyFilters);
    }
    
    if (filterMonth) {
        filterMonth.addEventListener('change', applyFilters);
    }
    
    function applyFilters() {
        const selectedCourse = filterCourse ? filterCourse.value : 'all';
        const selectedMonth = filterMonth ? filterMonth.value : 'all';
        
        let history = getClassHistory();
        
        // Filter by course
        if (selectedCourse !== 'all') {
            history = history.filter(session => session.courseCode === selectedCourse);
        }
        
        // Filter by month
        if (selectedMonth !== 'all') {
            const monthNum = parseInt(selectedMonth);
            history = history.filter(session => {
                const sessionDate = new Date(session.timestamp);
                return sessionDate.getMonth() + 1 === monthNum;
            });
        }
        
        // Reload with filtered data
        renderClassHistory(history);
        updateSummaryStats(history);
    }
    
    function renderClassHistory(history) {
        const listContainer = document.getElementById('classHistoryList');
        const emptyState = document.getElementById('emptyState');
        
        if (history.length === 0) {
            listContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        listContainer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        
        listContainer.innerHTML = '';
        
        history.forEach((session, index) => {
            const card = document.createElement('div');
            card.className = 'class-session-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <div class="session-header">
                    <div class="session-title-group">
                        <h3>${session.course}</h3>
                        <p class="session-class">${session.room}</p>
                    </div>
                    <div class="session-date-badge">
                        <svg width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle;">
                            <rect x="2" y="3" width="12" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M5 1v2M11 1v2M2 7h12" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${session.date}
                    </div>
                </div>
                
                <div class="session-time">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M9 5v4l3 2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>${session.time}</span>
                </div>
                
                <div class="session-stats">
                    <div class="stat-box stat-hadir">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M16 6L8 14l-4-4" stroke="currentColor" fill="none" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${session.stats.hadir}</span>
                            <span class="stat-label">Hadir</span>
                        </div>
                    </div>
                    
                    <div class="stat-box stat-izin">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="8" stroke="currentColor" fill="none" stroke-width="2"/>
                                <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${session.stats.izin}</span>
                            <span class="stat-label">Izin</span>
                        </div>
                    </div>
                    
                    <div class="stat-box stat-alpha">
                        <div class="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M14 6L6 14M6 6l8 8" stroke="currentColor" fill="none" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">${session.stats.alpha}</span>
                            <span class="stat-label">Alpha</span>
                        </div>
                    </div>
                </div>
            `;
            
            listContainer.appendChild(card);
        });
    }
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

// ===== MAHASISWA ATTENDANCE HISTORY STORAGE =====
function getMahasiswaAttendanceHistory() {
    const history = localStorage.getItem('mahasiswaAttendanceHistory');
    return history ? JSON.parse(history) : [];
}

function saveMahasiswaAttendance(attendanceData) {
    const history = getMahasiswaAttendanceHistory();
    history.unshift(attendanceData); // Add to beginning
    localStorage.setItem('mahasiswaAttendanceHistory', JSON.stringify(history));
}

// ===== MANUAL QR CODE SUBMISSION (UPDATE) =====
if (document.getElementById('submitManualBtn')) {
    document.getElementById('submitManualBtn').addEventListener('click', function() {
        const manualCode = document.getElementById('manualCode').value;
        const courseSelect = document.getElementById('courseSelect');
        const courseValue = courseSelect.value;
        
        if (!courseValue) {
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
            const courseName = courseSelect.options[courseSelect.selectedIndex].text;
            const now = new Date();
            
            // Save to mahasiswa attendance history
            const attendanceData = {
                id: Math.random().toString(36).substring(7),
                course: courseName,
                courseCode: courseValue,
                date: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
                timestamp: now.getTime(),
                status: 'hadir',
                month: now.getMonth() + 1 // 1-12
            };
            
            saveMahasiswaAttendance(attendanceData);
            
            // Success animation
            btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M16 6L8 14l-4-4" stroke="white" fill="none" stroke-width="2"/></svg> <span>Berhasil!</span>';
            btn.style.background = 'var(--success)';
            
            setTimeout(() => {
                alert('✅ Absensi berhasil dicatat!\n\nMata Kuliah: ' + courseName + '\nWaktu: ' + attendanceData.time);
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

// ===== SIDEBAR MENU FUNCTIONALITY =====
if (document.getElementById('menuBtn')) {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    
    // Open sidebar
    menuBtn.addEventListener('click', function() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// ===== SIDEBAR LOGOUT =====
if (document.getElementById('sidebarLogout')) {
    document.getElementById('sidebarLogout').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin logout?')) {
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
}

// ===== SIDEBAR SETTINGS =====
if (document.getElementById('settingsBtn')) {
    document.getElementById('settingsBtn').addEventListener('click', function(e) {
        e.preventDefault();
        alert('⚙️ Pengaturan\n\nFitur pengaturan akan segera hadir:\n• Ubah Password\n• Notifikasi\n• Tema\n• Bahasa');
    });
}

// ===== SIDEBAR HELP =====
if (document.getElementById('helpBtn')) {
    document.getElementById('helpBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const helpText = `
📚 Bantuan UnivSync Attend

Mahasiswa:
• Pilih mata kuliah
• Scan QR code yang ditampilkan dosen
• Absensi otomatis tercatat
• Cek riwayat di menu Riwayat Absensi

Dosen:
• Generate QR code untuk sesi kelas
• QR code aktif sesuai durasi yang ditentukan
• Monitor kehadiran real-time
• Export data absensi

Butuh bantuan lebih lanjut?
Hubungi: support@unsil.ac.id
        `;
        alert(helpText);
    });
}

// ===== SIDEBAR LAPORAN (DOSEN) =====
if (document.getElementById('laporanBtn')) {
    document.getElementById('laporanBtn').addEventListener('click', function(e) {
        e.preventDefault();
        alert('📊 Laporan Absensi\n\nFitur laporan lengkap akan segera hadir:\n• Laporan per mata kuliah\n• Laporan per mahasiswa\n• Export Excel/PDF\n• Statistik kehadiran');
    });
}

// ===== NOTIFICATION BUTTON (REMOVED FROM MAIN, KEEP FOR COMPATIBILITY) =====
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

// ===== LOAD MAHASISWA ATTENDANCE HISTORY =====
if (document.getElementById('attendanceHistoryList')) {
    function loadMahasiswaAttendanceHistory() {
        const history = getMahasiswaAttendanceHistory();
        const listContainer = document.getElementById('attendanceHistoryList');
        const emptyState = document.getElementById('emptyStateMahasiswa');
        
        if (history.length === 0) {
            listContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            updateMahasiswaSummary([]); // Update with empty data
            return;
        }
        
        listContainer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        
        renderMahasiswaAttendance(history);
        updateMahasiswaSummary(history);
    }
    
    function renderMahasiswaAttendance(history) {
        const listContainer = document.getElementById('attendanceHistoryList');
        listContainer.innerHTML = '';
        
        history.forEach((attendance, index) => {
            const card = document.createElement('div');
            card.className = 'class-session-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            // Determine status badge
            let statusBadge = '';
            if (attendance.status === 'hadir') {
                statusBadge = `
                    <div class="status-badge-attendance hadir">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M13 4L6 11l-3-3" stroke="white" fill="none" stroke-width="2"/>
                        </svg>
                        Hadir
                    </div>
                `;
            } else if (attendance.status === 'izin') {
                statusBadge = `
                    <div class="status-badge-attendance izin">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <circle cx="8" cy="8" r="6" stroke="white" fill="none" stroke-width="2"/>
                            <path d="M8 5v3M8 11h.01" stroke="white" stroke-width="2"/>
                        </svg>
                        Izin
                    </div>
                `;
            } else {
                statusBadge = `
                    <div class="status-badge-attendance alpha">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M11 5L5 11M5 5l6 6" stroke="white" fill="none" stroke-width="2"/>
                        </svg>
                        Alpha
                    </div>
                `;
            }
            
            card.innerHTML = `
                <div class="session-header">
                    <div class="session-title-group">
                        <h3>${attendance.course}</h3>
                        <p class="session-class">${attendance.time}</p>
                    </div>
                    <div class="session-date-badge">
                        <svg width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle;">
                            <rect x="2" y="3" width="12" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M5 1v2M11 1v2M2 7h12" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        ${attendance.date}
                    </div>
                </div>
                
                <div class="attendance-status-row">
                    ${statusBadge}
                </div>
            `;
            
            listContainer.appendChild(card);
        });
    }
    
    function updateMahasiswaSummary(history) {
        let totalHadir = 0;
        let totalIzin = 0;
        let totalAlpha = 0;
        
        history.forEach(attendance => {
            if (attendance.status === 'hadir') totalHadir++;
            else if (attendance.status === 'izin') totalIzin++;
            else if (attendance.status === 'alpha') totalAlpha++;
        });
        
        const total = totalHadir + totalIzin + totalAlpha;
        const percentage = total > 0 ? Math.round((totalHadir / total) * 100) : 0;
        
        // Update UI
        const totalHadirEl = document.getElementById('totalHadir');
        const totalIzinEl = document.getElementById('totalIzin');
        const totalAlphaEl = document.getElementById('totalAlpha');
        const percentageEl = document.getElementById('attendancePercentage');
        const percentageFillEl = document.getElementById('percentageFill');
        
        if (totalHadirEl) totalHadirEl.textContent = totalHadir;
        if (totalIzinEl) totalIzinEl.textContent = totalIzin;
        if (totalAlphaEl) totalAlphaEl.textContent = totalAlpha;
        if (percentageEl) percentageEl.textContent = percentage + '%';
        if (percentageFillEl) {
            setTimeout(() => {
                percentageFillEl.style.width = percentage + '%';
            }, 100);
        }
    }
    
    // Load history on page load
    loadMahasiswaAttendanceHistory();
    
    // Filter functionality for mahasiswa
    const filterCourseMahasiswa = document.getElementById('filterCourseMahasiswa');
    const filterMonthMahasiswa = document.getElementById('filterMonthMahasiswa');
    
    if (filterCourseMahasiswa) {
        filterCourseMahasiswa.addEventListener('change', applyMahasiswaFilters);
    }
    
    if (filterMonthMahasiswa) {
        filterMonthMahasiswa.addEventListener('change', applyMahasiswaFilters);
    }
    
    function applyMahasiswaFilters() {
        const selectedCourse = filterCourseMahasiswa ? filterCourseMahasiswa.value : 'all';
        const selectedMonth = filterMonthMahasiswa ? filterMonthMahasiswa.value : 'all';
        
        let history = getMahasiswaAttendanceHistory();
        
        // Filter by course
        if (selectedCourse !== 'all') {
            history = history.filter(attendance => attendance.courseCode === selectedCourse);
        }
        
        // Filter by month
        if (selectedMonth !== 'all') {
            const monthNum = parseInt(selectedMonth);
            history = history.filter(attendance => {
                return attendance.month === monthNum;
            });
        }
        
        // Re-render with filtered data
        const listContainer = document.getElementById('attendanceHistoryList');
        const emptyState = document.getElementById('emptyStateMahasiswa');
        
        if (history.length === 0) {
            listContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            updateMahasiswaSummary([]);
            return;
        }
        
        listContainer.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';
        
        renderMahasiswaAttendance(history);
        updateMahasiswaSummary(history);
    }
}

// ===== ADD SOME DUMMY DATA FOR MAHASISWA (FOR TESTING) =====
function addDummyMahasiswaData() {
    const existingData = getMahasiswaAttendanceHistory();
    
    // Only add if no data exists
    if (existingData.length === 0) {
        const dummyData = [
            {
                id: 'dummy1',
                course: 'Pemrograman Berorientasi Objek - TI 3A',
                courseCode: 'PBO',
                date: '1 Des 2024',
                time: '08:15 WIB',
                timestamp: new Date('2024-12-01 08:15').getTime(),
                status: 'hadir',
                month: 12
            },
            {
                id: 'dummy2',
                course: 'Basis Data - TI 3A',
                courseCode: 'BASDAT',
                date: '30 Nov 2024',
                time: '10:20 WIB',
                timestamp: new Date('2024-11-30 10:20').getTime(),
                status: 'hadir',
                month: 11
            },
            {
                id: 'dummy3',
                course: 'Jaringan Komputer - TI 3A',
                courseCode: 'JARKOM',
                date: '29 Nov 2024',
                time: '13:10 WIB',
                timestamp: new Date('2024-11-29 13:10').getTime(),
                status: 'hadir',
                month: 11
            }
        ];
        
        localStorage.setItem('mahasiswaAttendanceHistory', JSON.stringify(dummyData));
    }
}

// Call this when page loads (only adds if empty)
if (document.getElementById('attendanceHistoryList')) {
    addDummyMahasiswaData();
}
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