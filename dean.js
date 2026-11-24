/**
 * Club Corner - Super Admin (Dean) Dashboard Controller (dean.js)
 * Implements Institutional Oversight, Comprehensive User Management,
 * Account Status Controls (Active/Inactive/Suspended), Secure Password Resets,
 * Role Governance Safeguards, Club/Event Super-Oversight, and Audit Logs.
 */

let currentDeanView = 'dashboard';
let userRoleFilter = 'all';
let userStatusFilter = 'all';
let userSearchQuery = '';
let editingUserEmail = null;
let suspendingUserEmail = null;
let resettingUserEmail = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Role-Based Route Protection Guard: Only 'dean' permitted
    if (!auth.protectRoute(['dean'])) {
        return;
    }

    // 2. Initialize Dean profile in UI
    refreshDeanHeader();

    // 3. Setup Navigation Sidebar & View Switcher
    setupDeanSidebar();

    // 4. Initial Render of Overview
    renderDeanOverview();

    // 5. Setup User Management Modals & Listeners
    setupUserModals();

    // 6. Setup Dean Profile Settings Form
    setupDeanProfileForm();

    // 7. Setup Mobile Sidebar Drawer
    setupMobileDeanSidebar();

    // 8. Check URL view parameter
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam) {
        switchDeanView(viewParam);
    }
});

function refreshDeanHeader() {
    const dean = auth.getCurrentUser();
    if (!dean) return;

    const avatarEl = document.getElementById('dean-avatar-display');
    const nameEl = document.getElementById('dean-name-display');
    const roleEl = document.getElementById('dean-role-display');
    const welcomeName = document.getElementById('dean-welcome-name');

    if (avatarEl) avatarEl.textContent = dean.avatarText || 'KS';
    if (nameEl) nameEl.textContent = dean.name;
    if (roleEl) roleEl.textContent = dean.designation || 'Dean of Student Affairs';
    if (welcomeName) welcomeName.textContent = dean.name;
}

function setupDeanSidebar() {
    const menuItems = document.querySelectorAll('.dean-sidebar .menu-item[data-view]');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            switchDeanView(viewName);
        });
    });

    const logoutBtn = document.getElementById('dean-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
}

function switchDeanView(viewName) {
    currentDeanView = viewName;

    // Update active class on sidebar items
    const menuItems = document.querySelectorAll('.dean-sidebar .menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update title
    const titles = {
        'dashboard': 'Institutional Super Admin Overview',
        'user-management': 'Institutional User Management & Access Control',
        'clubs-oversight': 'College Clubs & Societies Governance',
        'events-oversight': 'Campus Events & Hackathons Directory',
        'audit-logs': 'Administrative Activity & Security Audit Logs',
        'profile': 'Office of the Dean Profile Settings'
    };
    const titleEl = document.getElementById('dean-current-title');
    if (titleEl) titleEl.textContent = titles[viewName] || 'Dean Administration';

    // Switch view sections
    const allViews = document.querySelectorAll('.dashboard-view');
    allViews.forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById(`dean-view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    // Trigger section renders
    if (viewName === 'dashboard') renderDeanOverview();
    else if (viewName === 'user-management') renderUserManagementTable();
    else if (viewName === 'clubs-oversight') renderClubsOversightTable();
    else if (viewName === 'events-oversight') renderEventsOversightTable();
    else if (viewName === 'audit-logs') renderAuditLogsTable();
    else if (viewName === 'profile') populateDeanProfileForm();

    closeMobileDeanSidebar();
}

// ===================================================================
// PHASE 4: ADMINISTRATIVE DASHBOARD METRICS & ANALYTICS
// ===================================================================
function renderDeanOverview() {
    const users = db.getUsers();
    const clubs = db.getClubs();
    const events = db.getEvents();
    const regs = db.getRegistrations();

    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const activeUsers = users.filter(u => u.status === 'Active');
    const inactiveUsers = users.filter(u => u.status === 'Inactive');
    const suspendedUsers = users.filter(u => u.status === 'Suspended');

    // Overview Metric Cards
    const elTotalStudents = document.getElementById('stat-total-students');
    const elTotalTeachers = document.getElementById('stat-total-teachers');
    const elTotalUsers = document.getElementById('stat-total-users');
    const elActiveAccounts = document.getElementById('stat-active-accounts');
    const elSuspendedAccounts = document.getElementById('stat-suspended-accounts');
    const elTotalClubs = document.getElementById('stat-total-clubs');
    const elTotalEvents = document.getElementById('stat-total-events');
    const elTotalRegistrations = document.getElementById('stat-total-regs');

    if (elTotalStudents) elTotalStudents.textContent = students.length;
    if (elTotalTeachers) elTotalTeachers.textContent = teachers.length;
    if (elTotalUsers) elTotalUsers.textContent = users.length;
    if (elActiveAccounts) elActiveAccounts.textContent = activeUsers.length;
    if (elSuspendedAccounts) elSuspendedAccounts.textContent = suspendedUsers.length;
    if (elTotalClubs) elTotalClubs.textContent = clubs.length;
    if (elTotalEvents) elTotalEvents.textContent = events.length;
    if (elTotalRegistrations) elTotalRegistrations.textContent = regs.length;

    // Overview Recent Users Preview Table
    const recentUsersTbody = document.getElementById('dean-recent-users-tbody');
    if (recentUsersTbody) {
        const preview = users.slice(0, 5);
        recentUsersTbody.innerHTML = preview.map(u => `
            <tr>
                <td>
                    <strong>${u.name}</strong>
                    <span class="d-block text-xs text-muted">${u.email}</span>
                </td>
                <td><span class="badge ${getUserRoleBadgeClass(u.role)}">${u.role.toUpperCase()}</span></td>
                <td>${u.department || u.branch || 'General'}</td>
                <td><span class="badge ${getStatusBadgeClass(u.status)}">${u.status}</span></td>
                <td>
                    <button onclick="openUserDetailsModal('${u.email}')" class="action-btn-sm btn-action-view" title="View Dossier">
                        <i class="fa-solid fa-eye"></i> Details
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Overview Club Leadership Roster Preview
    const clubsOverviewTbody = document.getElementById('dean-clubs-overview-tbody');
    if (clubsOverviewTbody) {
        clubsOverviewTbody.innerHTML = clubs.slice(0, 4).map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td><span class="badge badge-tech">${c.category}</span></td>
                <td>${c.president || 'Student Lead'}</td>
                <td>${c.facultyCoordinator || 'Faculty Coordinator'}</td>
                <td><i class="fa-solid fa-users text-muted"></i> ${c.memberCount || 50}</td>
            </tr>
        `).join('');
    }
}

// ===================================================================
// PHASE 3: COMPREHENSIVE USER MANAGEMENT
// ===================================================================
function renderUserManagementTable() {
    const tbody = document.getElementById('dean-users-tbody');
    if (!tbody) return;

    let users = db.getUsers();

    // Role Filter
    if (userRoleFilter !== 'all') {
        users = users.filter(u => u.role === userRoleFilter);
    }

    // Status Filter
    if (userStatusFilter !== 'all') {
        users = users.filter(u => (u.status || 'Active').toLowerCase() === userStatusFilter.toLowerCase());
    }

    // Search Query (by name, email, roll number, department)
    if (userSearchQuery) {
        const q = userSearchQuery.toLowerCase();
        users = users.filter(u => 
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.rollNo && u.rollNo.toLowerCase().includes(q)) ||
            (u.branch && u.branch.toLowerCase().includes(q)) ||
            (u.department && u.department.toLowerCase().includes(q))
        );
    }

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No accounts match the selected filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const isSelf = user.role === 'dean';
        const statusBadge = getStatusBadgeClass(user.status);
        const roleBadge = getUserRoleBadgeClass(user.role);

        return `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <div class="user-avatar-small" style="${user.role === 'dean' ? 'background: linear-gradient(135deg, #1e1b4b, #d97706);' : ''}">
                            ${user.avatarText || user.name.charAt(0)}
                        </div>
                        <div>
                            <strong style="color:var(--slate-900);">${user.name}</strong>
                            ${isSelf ? '<span class="badge badge-dean" style="font-size:0.65rem; margin-left:0.35rem;">YOU</span>' : ''}
                            <span class="d-block text-xs text-muted">${user.email}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${roleBadge}">${user.role.toUpperCase()}</span></td>
                <td>
                    ${user.role === 'student' ? (user.rollNo || 'N/A') : (user.cabin || 'Office')}
                    <span class="d-block text-xs text-muted">${user.branch || user.department || 'N/A'}</span>
                </td>
                <td>${user.createdAt || '2026-08-15'}</td>
                <td>
                    <span class="badge ${statusBadge}">${user.status || 'Active'}</span>
                    ${user.status === 'Suspended' && user.suspensionReason ? `<span class="d-block text-xs text-danger" title="${user.suspensionReason}">Review Flag</span>` : ''}
                </td>
                <td>
                    <div class="admin-table-actions">
                        <!-- View Details Dossier -->
                        <button onclick="openUserDetailsModal('${user.email}')" class="action-btn-sm btn-action-view" title="View Account Dossier">
                            <i class="fa-solid fa-address-card"></i> Dossier
                        </button>
                        
                        <!-- Edit Profile -->
                        <button onclick="openEditUserModal('${user.email}')" class="action-btn-sm action-edit" title="Edit Permitted Profile">
                            <i class="fa-solid fa-user-pen"></i> Edit
                        </button>

                        <!-- Password Reset -->
                        <button onclick="openResetPasswordModal('${user.email}')" class="action-btn-sm btn-action-reset" title="Secure Password Reset">
                            <i class="fa-solid fa-key"></i> Reset
                        </button>

                        <!-- Status Action: Activate / Deactivate / Suspend -->
                        ${!isSelf ? `
                            ${user.status === 'Suspended' ? `
                                <button onclick="handleActivateUser('${user.email}')" class="action-btn-sm btn-action-activate" title="Lift Suspension & Activate">
                                    <i class="fa-solid fa-circle-check"></i> Reinstate
                                </button>
                            ` : user.status === 'Active' ? `
                                <button onclick="openSuspendModal('${user.email}')" class="action-btn-sm btn-action-suspend" title="Suspend Account">
                                    <i class="fa-solid fa-ban"></i> Suspend
                                </button>
                                <button onclick="handleToggleActive('${user.email}', 'Inactive')" class="action-btn-sm" style="background:#f1f5f9; color:#475569;" title="Deactivate Account">
                                    <i class="fa-solid fa-pause"></i>
                                </button>
                            ` : `
                                <button onclick="handleToggleActive('${user.email}', 'Active')" class="action-btn-sm btn-action-activate" title="Activate Account">
                                    <i class="fa-solid fa-play"></i> Activate
                                </button>
                            `}
                        ` : `
                            <span class="text-xs text-muted" style="padding:0.25rem;">Super Admin Protected</span>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// User Management Search & Filter Listeners
function setupUserModals() {
    // Search input listener
    const searchInput = document.getElementById('dean-user-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            userSearchQuery = e.target.value.trim();
            renderUserManagementTable();
        });
    }

    // Role filter pills
    const rolePills = document.querySelectorAll('#user-role-filter-pills .pill-btn');
    rolePills.forEach(pill => {
        pill.addEventListener('click', () => {
            rolePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            userRoleFilter = pill.getAttribute('data-role');
            renderUserManagementTable();
        });
    });

    // Status select filter
    const statusSelect = document.getElementById('dean-user-status-filter');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            userStatusFilter = e.target.value;
            renderUserManagementTable();
        });
    }

    // Suspend Modal Form Listener
    const suspendForm = document.getElementById('suspend-user-form');
    if (suspendForm) {
        suspendForm.onsubmit = (e) => {
            e.preventDefault();
            const reason = document.getElementById('suspend-reason-input').value.trim();
            if (!reason) {
                auth.showToast('Please state a reason for academic suspension.', 'warning');
                return;
            }
            if (suspendingUserEmail) {
                const res = db.updateUserStatusByDean(suspendingUserEmail, 'Suspended', reason);
                if (res.success) {
                    auth.showToast(`Account for ${suspendingUserEmail} has been Suspended.`, 'success');
                    document.getElementById('suspend-user-modal').classList.remove('active');
                    renderUserManagementTable();
                    renderDeanOverview();
                } else {
                    auth.showToast(res.message, 'error');
                }
            }
        };
    }

    // Edit User Modal Form Listener
    const editForm = document.getElementById('edit-user-form');
    if (editForm) {
        editForm.onsubmit = (e) => {
            e.preventDefault();
            if (!editingUserEmail) return;

            const formData = {
                name: document.getElementById('edit-user-name').value.trim(),
                role: document.getElementById('edit-user-role').value,
                status: document.getElementById('edit-user-status').value,
                department: document.getElementById('edit-user-dept').value.trim(),
                branch: document.getElementById('edit-user-dept').value.trim(),
                year: document.getElementById('edit-user-year-desig').value.trim(),
                designation: document.getElementById('edit-user-year-desig').value.trim(),
                rollNo: document.getElementById('edit-user-roll-cabin').value.trim(),
                cabin: document.getElementById('edit-user-roll-cabin').value.trim()
            };

            const res = db.updateUserProfileByDean(editingUserEmail, formData);
            if (res.success) {
                auth.showToast('Account profile successfully updated.', 'success');
                document.getElementById('edit-user-modal').classList.remove('active');
                renderUserManagementTable();
                renderDeanOverview();
            } else {
                auth.showToast(res.message, 'error');
            }
        };
    }

    // Reset Password Modal Form Listener
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.onsubmit = (e) => {
            e.preventDefault();
            if (!resettingUserEmail) return;

            const newPass = document.getElementById('reset-new-password').value.trim();
            const confirmPass = document.getElementById('reset-confirm-password').value.trim();

            if (newPass.length < 6) {
                auth.showToast('Password must be at least 6 characters.', 'warning');
                return;
            }
            if (newPass !== confirmPass) {
                auth.showToast('Passwords do not match.', 'warning');
                return;
            }

            const res = db.resetUserPasswordByDean(resettingUserEmail, newPass);
            if (res.success) {
                auth.showToast(`Password successfully reset for ${resettingUserEmail}.`, 'success');
                document.getElementById('reset-password-modal').classList.remove('active');
            } else {
                auth.showToast(res.message, 'error');
            }
        };
    }
}

// 1. View User Details Dossier
function openUserDetailsModal(email) {
    const user = db.getUserByEmail(email);
    if (!user) return;

    const modal = document.getElementById('user-details-modal');
    const container = document.getElementById('user-dossier-content');

    const joinedClubs = user.joinedClubs ? user.joinedClubs.map(id => {
        const club = db.getClubById(id);
        return club ? club.name : id;
    }).join(', ') : 'None';

    const userRegistrations = db.getRegistrationsForStudent(user.email);

    container.innerHTML = `
        <div class="user-dossier-grid">
            <div class="dossier-avatar">
                ${user.avatarText || user.name.charAt(0)}
            </div>
            <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge ${getUserRoleBadgeClass(user.role)}">${user.role.toUpperCase()}</span>
                    <span class="badge ${getStatusBadgeClass(user.status)}">${user.status || 'Active'}</span>
                </div>
                <h3 style="font-size:1.35rem; font-weight:800; color:var(--slate-900);">${user.name}</h3>
                <p class="text-muted" style="margin:0; font-family:monospace;">${user.email}</p>
            </div>
        </div>

        <div class="dossier-info-list mb-4">
            <div class="dossier-item">
                <span class="label">Department / Branch</span>
                <span class="val">${user.department || user.branch || 'Engineering Sciences'}</span>
            </div>
            <div class="dossier-item">
                <span class="label">${user.role === 'student' ? 'Academic Year' : 'Academic Designation'}</span>
                <span class="val">${user.year || user.designation || 'Faculty'}</span>
            </div>
            <div class="dossier-item">
                <span class="label">${user.role === 'student' ? 'Roll Number' : 'Office / Cabin'}</span>
                <span class="val">${user.rollNo || user.cabin || 'Campus Office'}</span>
            </div>
            <div class="dossier-item">
                <span class="label">Account Registered On</span>
                <span class="val">${user.createdAt || '2026-08-15'}</span>
            </div>
        </div>

        ${user.status === 'Suspended' ? `
            <div style="background:#fee2e2; border:1px solid #fecaca; border-radius:var(--radius-md); padding:0.85rem 1rem; margin-bottom:1.5rem;">
                <strong style="color:#991b1b; display:block; font-size:0.85rem;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Suspension Record:
                </strong>
                <p style="color:#b91c1c; font-size:0.85rem; margin:0;">
                    ${user.suspensionReason || 'Subject to dean administration review.'}
                </p>
            </div>
        ` : ''}

        <div style="background:var(--slate-50); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1.25rem;">
            <h4 class="font-bold mb-2" style="font-size:0.95rem; color:var(--slate-900);">
                <i class="fa-solid fa-network-wired text-primary"></i> Club Memberships & Participation
            </h4>
            <p style="font-size:0.88rem; color:var(--slate-700); margin-bottom:0.75rem;">
                <strong>Joined Societies:</strong> ${joinedClubs}
            </p>
            <p style="font-size:0.88rem; color:var(--slate-700); margin:0;">
                <strong>Event Registrations:</strong> ${userRegistrations.length} registered events on record.
            </p>
        </div>
    `;

    modal.classList.add('active');
}

// 2. Edit User Profile
function openEditUserModal(email) {
    const user = db.getUserByEmail(email);
    if (!user) return;

    editingUserEmail = email;
    document.getElementById('edit-user-name').value = user.name || '';
    document.getElementById('edit-user-email-display').value = user.email || '';
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-status').value = user.status || 'Active';
    document.getElementById('edit-user-dept').value = user.department || user.branch || '';
    document.getElementById('edit-user-year-desig').value = user.year || user.designation || '';
    document.getElementById('edit-user-roll-cabin').value = user.rollNo || user.cabin || '';

    // Safeguard Dean
    const roleSelect = document.getElementById('edit-user-role');
    const statusSelect = document.getElementById('edit-user-status');
    if (user.role === 'dean') {
        roleSelect.disabled = true;
        statusSelect.disabled = true;
    } else {
        roleSelect.disabled = false;
        statusSelect.disabled = false;
    }

    document.getElementById('edit-user-modal').classList.add('active');
}

// 3. Suspend User Modal
function openSuspendModal(email) {
    const user = db.getUserByEmail(email);
    if (!user) return;
    if (user.role === 'dean') {
        auth.showToast('The Dean Super Admin account cannot be suspended.', 'error');
        return;
    }

    suspendingUserEmail = email;
    document.getElementById('suspend-user-name').textContent = `${user.name} (${user.email})`;
    document.getElementById('suspend-reason-input').value = '';
    document.getElementById('suspend-user-modal').classList.add('active');
}

function handleActivateUser(email) {
    if (confirm(`Reinstate and activate account for ${email}?`)) {
        const res = db.updateUserStatusByDean(email, 'Active');
        if (res.success) {
            auth.showToast(`Account ${email} is now Active.`, 'success');
            renderUserManagementTable();
            renderDeanOverview();
        } else {
            auth.showToast(res.message, 'error');
        }
    }
}

function handleToggleActive(email, newStatus) {
    const res = db.updateUserStatusByDean(email, newStatus);
    if (res.success) {
        auth.showToast(`Account marked as ${newStatus}.`, 'info');
        renderUserManagementTable();
        renderDeanOverview();
    } else {
        auth.showToast(res.message, 'error');
    }
}

// 4. Secure Password Reset
function openResetPasswordModal(email) {
    const user = db.getUserByEmail(email);
    if (!user) return;

    resettingUserEmail = email;
    document.getElementById('reset-user-email-target').textContent = `${user.name} (${user.email})`;
    document.getElementById('reset-new-password').value = '';
    document.getElementById('reset-confirm-password').value = '';
    document.getElementById('reset-password-modal').classList.add('active');
}

function generateSecureTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let temp = '';
    for (let i = 0; i < 10; i++) {
        temp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('reset-new-password').value = temp;
    document.getElementById('reset-confirm-password').value = temp;
    auth.showToast('Generated strong temporary password!', 'info');
}

// ===================================================================
// CLUBS OVERSIGHT TABLE
// ===================================================================
function renderClubsOversightTable() {
    const tbody = document.getElementById('dean-clubs-oversight-tbody');
    if (!tbody) return;

    const clubs = db.getClubs();
    tbody.innerHTML = clubs.map(c => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="width:36px; height:36px; border-radius:6px; background:${c.accentBg || '#4f46e5'}; display:flex; align-items:center; justify-content:center; color:#fff;">
                        <i class="fa-solid ${c.icon || 'fa-users'}"></i>
                    </div>
                    <div>
                        <strong style="color:var(--slate-900);">${c.name}</strong>
                        <span class="d-block text-xs text-muted">Est. ${c.foundedYear || 2018}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-tech">${c.category}</span></td>
            <td>${c.president || 'Student Lead'}</td>
            <td>${c.facultyCoordinator || 'Coordinator'}</td>
            <td><i class="fa-solid fa-users text-muted"></i> ${c.memberCount || 50} Members</td>
            <td><a href="mailto:${c.contactEmail}">${c.contactEmail || 'club@college.edu'}</a></td>
            <td>
                <a href="club-details.html?id=${c.id}" class="action-btn-sm" style="background:var(--slate-100); color:var(--slate-700);" target="_blank">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect
                </a>
            </td>
        </tr>
    `).join('');
}

// ===================================================================
// EVENTS OVERSIGHT TABLE
// ===================================================================
function renderEventsOversightTable() {
    const tbody = document.getElementById('dean-events-oversight-tbody');
    if (!tbody) return;

    const events = db.getEvents();
    tbody.innerHTML = events.map(e => `
        <tr>
            <td>
                <strong style="color:var(--slate-900);">${e.title}</strong>
                <span class="d-block text-xs text-muted">${e.description ? e.description.substring(0, 50) + '...' : ''}</span>
            </td>
            <td><span class="badge badge-tech">${e.clubName}</span></td>
            <td>${e.date}<br><span class="text-xs text-muted">${e.time}</span></td>
            <td>${e.venue}</td>
            <td><strong>${e.registeredCount || 0}</strong> / ${e.maxSeats || 100}</td>
            <td>
                <span class="badge ${e.status === 'Completed' ? 'badge-status-inactive' : 'badge-status-approved'}">
                    ${e.status || 'Upcoming'}
                </span>
            </td>
        </tr>
    `).join('');
}

// ===================================================================
// AUDIT LOGS TABLE
// ===================================================================
function renderAuditLogsTable() {
    const tbody = document.getElementById('dean-audit-logs-tbody');
    if (!tbody) return;

    const logs = db.getAuditLogs();
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No audit logs recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(l => `
        <tr>
            <td style="font-family:monospace; font-size:0.8rem; color:var(--slate-600);">${l.timestamp}</td>
            <td><span class="log-action-badge log-${l.action}">${l.action}</span></td>
            <td><strong>${l.performedBy}</strong></td>
            <td>${l.targetUser}</td>
            <td style="font-size:0.88rem; color:var(--slate-700);">${l.details}</td>
        </tr>
    `).join('');
}

// ===================================================================
// DEAN PROFILE FORM
// ===================================================================
function populateDeanProfileForm() {
    const dean = auth.getCurrentUser();
    if (!dean) return;

    document.getElementById('dean-prof-name').value = dean.name || '';
    document.getElementById('dean-prof-email').value = dean.email || '';
    document.getElementById('dean-prof-dept').value = dean.department || '';
    document.getElementById('dean-prof-desig').value = dean.designation || '';
    document.getElementById('dean-prof-cabin').value = dean.cabin || '';
}

function setupDeanProfileForm() {
    const form = document.getElementById('dean-profile-form');
    if (!form) return;

    form.onsubmit = (e) => {
        e.preventDefault();
        const dean = auth.getCurrentUser();
        if (!dean) return;

        const updated = {
            ...dean,
            name: document.getElementById('dean-prof-name').value.trim(),
            department: document.getElementById('dean-prof-dept').value.trim(),
            designation: document.getElementById('dean-prof-desig').value.trim(),
            cabin: document.getElementById('dean-prof-cabin').value.trim(),
            avatarText: document.getElementById('dean-prof-name').value.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        };

        db.updateUser(updated);
        auth.showToast('Dean administrative credentials updated.', 'success');
        refreshDeanHeader();
    };
}

// ===================================================================
// HELPERS & DRAWER
// ===================================================================
function getUserRoleBadgeClass(role) {
    if (role === 'dean') return 'badge-dean';
    if (role === 'teacher') return 'badge-teacher';
    return 'badge-student';
}

function getStatusBadgeClass(status) {
    if (status === 'Suspended') return 'badge-status-suspended';
    if (status === 'Inactive') return 'badge-status-inactive';
    return 'badge-status-active';
}

function setupMobileDeanSidebar() {
    const toggleBtn = document.getElementById('mobile-dean-sidebar-toggle');
    const sidebar = document.getElementById('dean-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
}

function closeMobileDeanSidebar() {
    const sidebar = document.getElementById('dean-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}
