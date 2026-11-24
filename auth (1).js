/**
 * Club Corner - Authentication & Role Protection Layer
 * Simulates demo login session using LocalStorage with role routing,
 * account status enforcement (Active/Inactive/Suspended), and strict RBAC route guards.
 * Supports Student, Teacher, and Super Admin (Dean) roles.
 */

const auth = {
    // Get currently logged-in user session
    getCurrentUser: function() {
        return db.getSession();
    },

    // Check if user is logged in
    isLoggedIn: function() {
        return !!this.getCurrentUser();
    },

    // Perform login with role validation & account status verification
    login: function(email, password, role) {
        if (!email || !password) {
            return {
                success: false,
                message: 'Please provide both email and password.'
            };
        }

        const users = db.getUsers();
        const user = users.find(u => 
            u.email.toLowerCase() === email.trim().toLowerCase() && 
            u.password === password
        );

        if (!user) {
            return { 
                success: false, 
                message: 'Invalid credentials. Please verify your email and password.' 
            };
        }

        // ACCOUNT STATUS CHECKS (Enforced by Dean)
        if (user.status === 'Suspended') {
            const reasonMsg = user.suspensionReason ? ` Reason: "${user.suspensionReason}"` : '';
            return {
                success: false,
                message: `Account Suspended: Access has been revoked by the Office of the Dean.${reasonMsg} Please contact academic administration.`
            };
        }

        if (user.status === 'Inactive') {
            return {
                success: false,
                message: 'Account Deactivated: This account is currently inactive. Please contact the Dean or department coordinator.'
            };
        }

        // ROLE-BASED ACCESS & ROUTING ENFORCEMENT
        if (role === 'dean') {
            // Logging in via Dean Portal (dean-login.html)
            if (user.role !== 'dean') {
                return {
                    success: false,
                    message: 'Access Denied: Standard student or faculty credentials cannot access the Super Admin Dean Portal.'
                };
            }
        } else {
            // Logging in via Standard Portal (login.html)
            if (user.role === 'dean') {
                return {
                    success: false,
                    message: 'Administrative Account Detected: Dean / Super Admin must authenticate exclusively through the dedicated Dean Portal.'
                };
            }

            if (role && user.role !== role) {
                return { 
                    success: false, 
                    message: `This account is registered as a ${user.role.toUpperCase()}. Please select the correct tab.` 
                };
            }
        }

        // Record audit log for Dean logins
        if (user.role === 'dean') {
            db.addAuditLog('DEAN_LOGIN', user.name, 'Super Admin Dean logged into the institutional dashboard.');
        }

        // Save session
        db.setSession(user);
        return { success: true, user: user };
    },

    // Logout and redirect to appropriate login screen
    logout: function() {
        const currentUser = this.getCurrentUser();
        const wasDean = currentUser && currentUser.role === 'dean';

        db.clearSession();
        this.showToast('You have been logged out successfully.', 'info');
        
        setTimeout(() => {
            if (wasDean) {
                window.location.href = 'dean-login.html';
            } else {
                window.location.href = 'login.html';
            }
        }, 600);
    },

    // Route Protection Guard
    // Call on pages to ensure only authorized roles can access
    protectRoute: function(allowedRoles = ['student', 'teacher', 'dean']) {
        const currentUser = this.getCurrentUser();
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // 1. Not logged in
        if (!currentUser) {
            if (allowedRoles.includes('dean') && !allowedRoles.includes('student') && !allowedRoles.includes('teacher')) {
                window.location.href = 'dean-login.html?msg=login_required';
            } else {
                window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}&msg=login_required`;
            }
            return false;
        }

        // 2. Account Status Check on each route navigation
        const latestUserData = db.getUserByEmail(currentUser.email);
        if (latestUserData && latestUserData.status === 'Suspended') {
            db.clearSession();
            window.location.href = 'login.html?msg=account_suspended';
            return false;
        }

        // 3. Role Authorization Guard
        if (!allowedRoles.includes(currentUser.role)) {
            if (currentUser.role === 'student') {
                window.location.href = 'student-dashboard.html?msg=unauthorized_route';
            } else if (currentUser.role === 'teacher') {
                window.location.href = 'teacher-dashboard.html?msg=unauthorized_route';
            } else if (currentUser.role === 'dean') {
                window.location.href = 'dean-dashboard.html?msg=unauthorized_route';
            } else {
                window.location.href = 'login.html';
            }
            return false;
        }

        return true;
    },

    // Check if already logged in when visiting login pages
    redirectIfLoggedIn: function(context = 'standard') {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        // If on the Dean login page:
        if (context === 'dean') {
            // Only auto-redirect if already authenticated as Dean
            if (currentUser.role === 'dean') {
                window.location.href = 'dean-dashboard.html';
            }
            // If currently logged in as a student or teacher, DO NOT redirect
            // Allow them to authenticate as Dean without getting trapped in a redirect loop
            return;
        }

        // If on standard student/teacher login page:
        if (currentUser.role === 'student') {
            window.location.href = 'student-dashboard.html';
        } else if (currentUser.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        }
        // If logged in as Dean and visits standard login.html, do NOT force redirect
    },

    // Toast Notification System
    showToast: function(message, type = 'info', duration = 3500) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;

        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'error') icon = 'fa-circle-exclamation';
        if (type === 'warning') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <div class="toast-content">
                <i class="fa-solid ${icon} toast-icon"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Animate entrance
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    },

    // Initialize navbar profile buttons across pages
    initNavUser: function() {
        const user = this.getCurrentUser();
        const userNavContainer = document.getElementById('nav-user-container');
        if (!userNavContainer) return;

        if (user) {
            let targetDashboard = 'student-dashboard.html';
            let roleBadgeClass = 'badge-student';
            let roleName = 'Student';

            if (user.role === 'dean') {
                targetDashboard = 'dean-dashboard.html';
                roleBadgeClass = 'badge-dean';
                roleName = 'Super Admin';
            } else if (user.role === 'teacher') {
                targetDashboard = 'teacher-dashboard.html';
                roleBadgeClass = 'badge-teacher';
                roleName = 'Faculty';
            }

            userNavContainer.innerHTML = `
                <div class="nav-user-profile">
                    <a href="${targetDashboard}" class="btn btn-outline nav-dashboard-btn">
                        <i class="fa-solid ${user.role === 'dean' ? 'fa-shield-halved' : 'fa-gauge-high'}"></i> ${user.role === 'dean' ? 'Dean Portal' : 'My Dashboard'}
                    </a>
                    <div class="nav-user-badge">
                        <span class="user-avatar-small" style="${user.role === 'dean' ? 'background: linear-gradient(135deg, #1e1b4b, #d97706);' : ''}">${user.avatarText || user.name.charAt(0)}</span>
                        <div class="user-meta-small">
                            <span class="user-name-small">${user.name.split(' ')[0]}</span>
                            <span class="role-tag ${roleBadgeClass}">${roleName}</span>
                        </div>
                    </div>
                    <button id="nav-logout-btn" class="btn btn-icon-only text-danger" title="Logout">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </div>
            `;

            const logoutBtn = document.getElementById('nav-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.logout();
                });
            }
        } else {
            userNavContainer.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <a href="login.html" class="btn btn-primary nav-login-btn">
                        <i class="fa-solid fa-right-to-bracket"></i> Login
                    </a>
                    <a href="dean-login.html" class="btn btn-outline btn-sm nav-dean-link" title="Dean / Super Admin Portal" style="border-color:#d97706; color:#b45309;">
                        <i class="fa-solid fa-shield-halved"></i> Dean
                    </a>
                </div>
            `;
        }
    }
};

// Check for redirect flash messages in URL
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg === 'login_required') {
        auth.showToast('Please log in first to access the requested portal.', 'warning');
    } else if (msg === 'unauthorized_route' || msg === 'unauthorized_teacher_route' || msg === 'unauthorized_student_route') {
        auth.showToast('Access restricted: You do not have permissions for that route. Redirected.', 'warning');
    } else if (msg === 'account_suspended') {
        auth.showToast('Your session has ended because the account was suspended by the Dean.', 'error', 5000);
    }
});
