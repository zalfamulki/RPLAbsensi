// ===== API BASE URL =====
const API_URL = 'api/';

// ===== CHECK SESSION ON PAGE LOAD =====
async function checkSession() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', ''];
    
    if (publicPages.includes(currentPage)) {
        return; // Skip session check for public pages
    }
    
    try {
        const response = await fetch(API_URL + 'check-session.php');
        const result = await response.json();
        
        if (!result.logged_in) {
            window.location.href = 'login.html';
            return;
        }
        
        // Store user data in sessionStorage for frontend use
        sessionStorage.setItem('userData', JSON.stringify(result.data));
        
        // Check if user is accessing correct dashboard
        const role = result.data.role;
        if (role === 'mahasiswa' && currentPage.includes('dosen')) {
            window.location.href = 'dashboard.html';
        } else if (role === 'dosen' && currentPage === 'dashboard.html') {
            window.location.href = 'dashboard-dosen.html';
        } else if (role === 'admin' && !currentPage.includes('admin')) {
            window.location.href = 'dashboard-admin.html';
        }
        
        // Update UI with user data
        updateUserInterface(result.data);
        
    } catch (error) {
        console.error('Session check error:', error);
        window.location.href = 'login.html';
    }
}

// ===== UPDATE USER INTERFACE =====
function updateUserInterface(userData) {
    // Update sidebar profile
    const sidebarName = document.querySelector('.sidebar-user-info h3');
    const sidebarInfo = document.querySelector('.sidebar-user-info p');
    
    if (sidebarName) {
        sidebarName.textContent = userData.nama || 'User';
    }
    
    if (sidebarInfo) {
        if (userData.role === 'mahasiswa') {
            sidebarInfo.textContent = userData.nim || '';
        } else {
            sidebarInfo.textContent = userData.nip || '';
        }
    }
    
    // Update welcome message
    const userName = document.querySelector('.user-name, .welcome-section h3');
    if (userName) {
        userName.textContent = userData.nama || 'User';
    }
}

// ===== LOGIN FUNCTIONALITY =====
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const selectedRole = sessionStorage.getItem('selectedRole');
        
        if (!email || !password) {
            alert('Email dan password harus diisi!');
            return;
        }
        
        // Show loading
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Loading...</span>';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(API_URL + 'login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: selectedRole
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store user data
                sessionStorage.setItem('userData', JSON.stringify(result.data));
                sessionStorage.setItem('isLoggedIn', 'true');
                
                // Show success message
                submitBtn.innerHTML = '<span>✓ Login Berhasil!</span>';
                submitBtn.style.background = '#10B981';
                
                // Redirect after 1 second
                setTimeout(() => {
                    window.location.href = result.data.redirect;
                }, 1000);
            } else {
                alert('Login gagal: ' + result.message);
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Terjadi kesalahan saat login. Silakan coba lagi.');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    });
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
            
            roleCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            setTimeout(() => {
                roleSelection.style.display = 'none';
                loginForm.style.display = 'flex';
                roleBadge.textContent = role === 'mahasiswa' ? '👨‍🎓 Mahasiswa' : '👨‍🏫 Dosen';
                sessionStorage.setItem('selectedRole', role);
            }, 300);
        });
    });
    
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
        this.style.color = type === 'text' ? 'var(--primary)' : 'var(--text-light)';
    });
}

// ===== LOGOUT FUNCTIONALITY =====
document.querySelectorAll('#logoutBtn, #sidebarLogout').forEach(btn => {
    if (btn) {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (confirm('Apakah Anda yakin ingin logout?')) {
                try {
                    await fetch(API_URL + 'logout.php');
                    sessionStorage.clear();
                    localStorage.clear();
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    sessionStorage.clear();
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            }
        });
    }
});

// ===== LOAD PROFILE DATA =====
async function loadProfileData() {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const role = userData.role;
    
    try {
        let endpoint = '';
        if (role === 'mahasiswa') endpoint = 'get-profile-mahasiswa.php';
        else if (role === 'dosen') endpoint = 'get-profile-dosen.php';
        else if (role === 'admin') endpoint = 'get-profile-admin.php';
        
        if (!endpoint) return;
        
        const response = await fetch(API_URL + endpoint);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Update form fields
            if (document.getElementById('nama')) {
                document.getElementById('nama').value = data.nama || '';
            }
            
            if (role === 'mahasiswa') {
                if (document.getElementById('nim')) document.getElementById('nim').value = data.nim || '';
                if (document.getElementById('status')) document.getElementById('status').value = 'Aktif';
                if (document.getElementById('email')) document.getElementById('email').value = data.email || '';
            } else if (role === 'dosen') {
                if (document.getElementById('nip')) document.getElementById('nip').value = data.nip || '';
                if (document.getElementById('nidn')) document.getElementById('nidn').value = data.nidn || '';
                if (document.getElementById('jabatan')) document.getElementById('jabatan').value = data.jabatan || '';
                if (document.getElementById('prodi')) document.getElementById('prodi').value = data.prodi || '';
                if (document.getElementById('email')) document.getElementById('email').value = data.email || '';
                if (document.getElementById('phone')) document.getElementById('phone').value = data.phone || '';
            } else if (role === 'admin') {
                if (document.getElementById('nip')) document.getElementById('nip').value = data.nip || '';
                if (document.getElementById('jabatan')) document.getElementById('jabatan').value = data.jabatan || '';
                if (document.getElementById('email')) document.getElementById('email').value = data.email || '';
                if (document.getElementById('phone')) document.getElementById('phone').value = data.phone || '';
                if (document.getElementById('username')) document.getElementById('username').value = data.username || '';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ===== SIDEBAR MENU =====
if (document.getElementById('menuBtn')) {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    
    menuBtn.addEventListener('click', function() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// ===== LOAD STATISTICS (ADMIN) =====
if (document.getElementById('totalMahasiswa')) {
    async function loadStatistics() {
        try {
            const response = await fetch(API_URL + 'get-statistics.php');
            const data = await response.json();
            
            if (document.getElementById('totalMahasiswa')) {
                document.getElementById('totalMahasiswa').textContent = data.total_mahasiswa || 0;
            }
            if (document.getElementById('totalDosen')) {
                document.getElementById('totalDosen').textContent = data.total_dosen || 0;
            }
            if (document.getElementById('totalKelas')) {
                document.getElementById('totalKelas').textContent = data.total_kelas || 0;
            }
            if (document.getElementById('absensiHariIni')) {
                document.getElementById('absensiHariIni').textContent = data.absensi_hari_ini || 0;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
    
    loadStatistics();
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

// ===== RUN ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    
    // Load profile data if on profile page
    if (window.location.pathname.includes('profil')) {
        loadProfileData();
    }
});

console.log('🚀 UnivSync Attend - System Ready with Database Integration');