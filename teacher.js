/**
 * Club Corner - Teacher Dashboard Controller (teacher.js)
 * Executive administration portal for managing clubs, events, student registrations,
 * announcements, and generating reports.
 */

let currentTeacherView = 'dashboard';
let editingClubId = null;
let editingEventId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Role Route Protection
    if (!auth.protectRoute(['teacher'])) {
        return;
    }

    // 2. Initialize teacher profile in UI
    refreshTeacherHeader();

    // 3. Setup Navigation Sidebar & View Switcher
    setupTeacherSidebar();

    // 4. Initial Render of Overview
    renderTeacherDashboardOverview();

    // 5. Setup Modals & Event Listeners
    setupClubModal();
    setupEventModal();
    setupAnnouncementForm();
    setupTeacherProfileForm();

    // 6. Setup Mobile Drawer
    setupMobileTeacherSidebar();

    // 7. Check URL view param
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam) {
        switchTeacherView(viewParam);
    }
});

function refreshTeacherHeader() {
    const teacher = auth.getCurrentUser();
    if (!teacher) return;

    const avatarEl = document.getElementById('faculty-avatar-display');
    const nameEl = document.getElementById('faculty-name-display');
    const roleEl = document.getElementById('faculty-role-display');
    if (avatarEl) avatarEl.textContent = teacher.avatarText || 'PR';
    if (nameEl) nameEl.textContent = teacher.name;
    if (roleEl) roleEl.textContent = teacher.designation || 'Club Convener';

    const welcomeName = document.getElementById('teacher-welcome-name');
    if (welcomeName) welcomeName.textContent = teacher.name;
}

function setupTeacherSidebar() {
    const menuItems = document.querySelectorAll('.teacher-sidebar .menu-item[data-view]');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            switchTeacherView(viewName);
        });
    });

    const logoutBtn = document.getElementById('teacher-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
}

function switchTeacherView(viewName) {
    currentTeacherView = viewName;

    // Update active class on sidebar items
    const menuItems = document.querySelectorAll('.teacher-sidebar .menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update title
    const titles = {
        'dashboard': 'Faculty Admin Dashboard',
        'manage-clubs': 'Club Directory & Management',
        'manage-events': 'Event Management & Approvals',
        'student-registrations': 'Student Event Registrations',
        'announcements': 'Campus Announcements & Notices',
        'reports': 'Reports & Student Analytics',
        'profile': 'Faculty Profile Settings'
    };
    const titleEl = document.getElementById('teacher-current-title');
    if (titleEl) titleEl.textContent = titles[viewName] || 'Admin Dashboard';

    // Show selected view
    const allViews = document.querySelectorAll('.dashboard-view');
    allViews.forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById(`teacher-view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    // Render contents
    if (viewName === 'dashboard') renderTeacherDashboardOverview();
    else if (viewName === 'manage-clubs') renderManageClubs();
    else if (viewName === 'manage-events') renderManageEvents();
    else if (viewName === 'student-registrations') renderManageRegistrations();
    else if (viewName === 'announcements') renderTeacherAnnouncements();
    else if (viewName === 'reports') renderTeacherReports();
    else if (viewName === 'profile') populateTeacherProfileForm();

    closeMobileTeacherSidebar();
}

// 1. Dashboard Overview
function renderTeacherDashboardOverview() {
    const clubs = db.getClubs();
    const events = db.getEvents();
    const regs = db.getRegistrations();
    const users = db.getUsers().filter(u => u.role === 'student');

    // Metrics
    const metricClubs = document.getElementById('admin-stat-clubs');
    const metricStudents = document.getElementById('admin-stat-students');
    const metricEvents = document.getElementById('admin-stat-events');
    const metricRegs = document.getElementById('admin-stat-regs');

    if (metricClubs) metricClubs.textContent = clubs.length;
    if (metricStudents) metricStudents.textContent = users.length > 0 ? (users.length + 140) : 142; // realistic mock count
    if (metricEvents) metricEvents.textContent = events.length;
    if (metricRegs) metricRegs.textContent = regs.length;

    // Recent Registrations Preview Table
    const recentRegsTbody = document.getElementById('teacher-recent-regs-tbody');
    if (recentRegsTbody) {
        const recent = regs.slice(0, 5);
        if (recent.length === 0) {
            recentRegsTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No registrations found.</td></tr>`;
        } else {
            recentRegsTbody.innerHTML = recent.map(r => `
                <tr>
                    <td><strong>${r.studentName}</strong><br><span class="text-xs text-muted">${r.studentEmail}</span></td>
                    <td>${r.eventName}</td>
                    <td>${r.registrationDate}</td>
                    <td>
                        <span class="badge ${r.status === 'Approved' ? 'badge-status-approved' : r.status === 'Rejected' ? 'badge-status-rejected' : 'badge-status-pending'}">
                            ${r.status}
                        </span>
                    </td>
                    <td>
                        <button onclick="switchTeacherView('student-registrations')" class="btn btn-outline btn-sm">Manage</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// 2. Manage Clubs (CRUD)
function renderManageClubs() {
    const tbody = document.getElementById('manage-clubs-tbody');
    if (!tbody) return;

    const clubs = db.getClubs();
    const searchInput = document.getElementById('admin-club-search');
    let filter = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let displayClubs = clubs;
    if (filter) {
        displayClubs = displayClubs.filter(c => 
            c.name.toLowerCase().includes(filter) ||
            c.category.toLowerCase().includes(filter) ||
            (c.president && c.president.toLowerCase().includes(filter))
        );
    }

    if (displayClubs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No clubs found matching criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = displayClubs.map(club => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="width:36px; height:36px; border-radius:6px; background:${club.accentBg || '#4f46e5'}; display:flex; align-items:center; justify-content:center; color:#fff;">
                        <i class="fa-solid ${club.icon || 'fa-users'}"></i>
                    </div>
                    <div>
                        <strong style="color:var(--slate-900);">${club.name}</strong>
                        <span class="d-block text-xs text-muted">${club.shortDesc ? club.shortDesc.substring(0, 50) + '...' : ''}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-tech">${club.category}</span></td>
            <td>${club.president || 'N/A'}</td>
            <td>${club.facultyCoordinator || 'N/A'}</td>
            <td><i class="fa-solid fa-users text-muted"></i> ${club.memberCount || 50}</td>
            <td>
                <div class="admin-table-actions">
                    <button onclick="openEditClubModal('${club.id}')" class="action-btn-sm action-edit" title="Edit Club">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button onclick="handleDeleteClub('${club.id}')" class="action-btn-sm action-delete" title="Delete Club">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <a href="club-details.html?id=${club.id}" class="action-btn-sm" style="background:var(--slate-100); color:var(--slate-700);" target="_blank" title="View Public Page">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            </td>
        </tr>
    `).join('');

    // Setup search listener once
    if (searchInput && !searchInput.dataset.listening) {
        searchInput.dataset.listening = "true";
        searchInput.addEventListener('input', () => renderManageClubs());
    }
}

function openAddClubModal() {
    editingClubId = null;
    document.getElementById('club-modal-title').innerHTML = '<i class="fa-solid fa-plus-circle text-primary"></i> Add New College Club';
    document.getElementById('club-form').reset();
    document.getElementById('club-modal').classList.add('active');
}

function openEditClubModal(clubId) {
    const club = db.getClubById(clubId);
    if (!club) return;

    editingClubId = clubId;
    document.getElementById('club-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-primary"></i> Edit Club Information';
    document.getElementById('club-name-input').value = club.name || '';
    document.getElementById('club-category-input').value = club.category || 'Technical';
    document.getElementById('club-desc-input').value = club.shortDesc || '';
    document.getElementById('club-full-desc-input').value = club.fullDesc || '';
    document.getElementById('club-president-input').value = club.president || '';
    document.getElementById('club-vp-input').value = club.vicePresident || '';
    document.getElementById('club-faculty-input').value = club.facultyCoordinator || '';
    document.getElementById('club-email-input').value = club.contactEmail || '';
    document.getElementById('club-phone-input').value = club.contactPhone || '';

    document.getElementById('club-modal').classList.add('active');
}

function setupClubModal() {
    const modal = document.getElementById('club-modal');
    const closeBtn = document.getElementById('club-modal-close');
    const cancelBtn = document.getElementById('club-modal-cancel');
    const form = document.getElementById('club-form');

    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
    if (cancelBtn) cancelBtn.onclick = () => modal.classList.remove('active');

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const clubData = {
                name: document.getElementById('club-name-input').value.trim(),
                category: document.getElementById('club-category-input').value,
                shortDesc: document.getElementById('club-desc-input').value.trim(),
                fullDesc: document.getElementById('club-full-desc-input').value.trim(),
                president: document.getElementById('club-president-input').value.trim(),
                vicePresident: document.getElementById('club-vp-input').value.trim(),
                facultyCoordinator: document.getElementById('club-faculty-input').value.trim(),
                contactEmail: document.getElementById('club-email-input').value.trim(),
                contactPhone: document.getElementById('club-phone-input').value.trim(),
                badge: document.getElementById('club-category-input').value + ' Society',
                icon: getCategoryIcon(document.getElementById('club-category-input').value),
                color: '#4f46e5',
                accentBg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
            };

            if (editingClubId) {
                db.updateClub(editingClubId, clubData);
                auth.showToast('Club updated successfully!', 'success');
            } else {
                db.addClub(clubData);
                auth.showToast('New club created successfully!', 'success');
            }

            modal.classList.remove('active');
            renderManageClubs();
            renderTeacherDashboardOverview();
        };
    }
}

function handleDeleteClub(clubId) {
    const club = db.getClubById(clubId);
    if (!club) return;

    if (confirm(`Are you sure you want to delete "${club.name}"? This action will remove the club from all student dashboards.`)) {
        db.deleteClub(clubId);
        auth.showToast(`Club "${club.name}" was deleted.`, 'info');
        renderManageClubs();
        renderTeacherDashboardOverview();
    }
}

// 3. Manage Events (CRUD)
function renderManageEvents() {
    const tbody = document.getElementById('manage-events-tbody');
    if (!tbody) return;

    const events = db.getEvents();
    const searchInput = document.getElementById('admin-event-search');
    let filter = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let displayEvents = events;
    if (filter) {
        displayEvents = displayEvents.filter(e => 
            e.title.toLowerCase().includes(filter) ||
            e.clubName.toLowerCase().includes(filter) ||
            e.venue.toLowerCase().includes(filter)
        );
    }

    if (displayEvents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No events found.</td></tr>`;
        return;
    }

    tbody.innerHTML = displayEvents.map(event => `
        <tr>
            <td>
                <strong style="color:var(--slate-900);">${event.title}</strong>
                <span class="d-block text-xs text-muted">${event.description ? event.description.substring(0, 50) + '...' : ''}</span>
            </td>
            <td><span class="badge badge-tech"><i class="fa-solid fa-flag"></i> ${event.clubName}</span></td>
            <td>${event.date} <br><span class="text-xs text-muted">${event.time}</span></td>
            <td>${event.venue}</td>
            <td><span class="font-bold text-primary">${event.registeredCount || 0}</span> / ${event.maxSeats || 100}</td>
            <td>
                <div class="admin-table-actions">
                    <button onclick="openEditEventModal('${event.id}')" class="action-btn-sm action-edit" title="Edit Event">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button onclick="handleDeleteEvent('${event.id}')" class="action-btn-sm action-delete" title="Delete Event">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (searchInput && !searchInput.dataset.listening) {
        searchInput.dataset.listening = "true";
        searchInput.addEventListener('input', () => renderManageEvents());
    }
}

function openAddEventModal() {
    editingEventId = null;
    document.getElementById('event-modal-title').innerHTML = '<i class="fa-solid fa-plus-circle text-primary"></i> Create College Event';
    document.getElementById('event-form').reset();
    populateClubDropdown();
    document.getElementById('event-modal').classList.add('active');
}

function openEditEventModal(eventId) {
    const event = db.getEventById(eventId);
    if (!event) return;

    editingEventId = eventId;
    document.getElementById('event-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-primary"></i> Edit Event Information';
    populateClubDropdown();

    document.getElementById('event-title-input').value = event.title || '';
    document.getElementById('event-club-select').value = event.clubName || '';
    document.getElementById('event-date-input').value = event.date || '';
    document.getElementById('event-time-input').value = event.time || '';
    document.getElementById('event-venue-input').value = event.venue || '';
    document.getElementById('event-category-select').value = event.category || 'Technical';
    document.getElementById('event-desc-input').value = event.description || '';
    document.getElementById('event-seats-input').value = event.maxSeats || 100;

    document.getElementById('event-modal').classList.add('active');
}

function populateClubDropdown() {
    const select = document.getElementById('event-club-select');
    if (!select) return;

    const clubs = db.getClubs();
    select.innerHTML = clubs.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

function setupEventModal() {
    const modal = document.getElementById('event-modal');
    const closeBtn = document.getElementById('event-modal-close');
    const cancelBtn = document.getElementById('event-modal-cancel');
    const form = document.getElementById('event-form');

    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
    if (cancelBtn) cancelBtn.onclick = () => modal.classList.remove('active');

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const clubName = document.getElementById('event-club-select').value;
            const club = db.getClubs().find(c => c.name === clubName);

            const eventData = {
                title: document.getElementById('event-title-input').value.trim(),
                clubName: clubName,
                clubId: club ? club.id : 'club-1',
                date: document.getElementById('event-date-input').value,
                time: document.getElementById('event-time-input').value.trim(),
                venue: document.getElementById('event-venue-input').value.trim(),
                category: document.getElementById('event-category-select').value,
                description: document.getElementById('event-desc-input').value.trim(),
                maxSeats: parseInt(document.getElementById('event-seats-input').value, 10) || 100,
                registrationLink: '#register'
            };

            if (editingEventId) {
                db.updateEvent(editingEventId, eventData);
                auth.showToast('Event details updated successfully!', 'success');
            } else {
                db.addEvent(eventData);
                auth.showToast('New event created! Students can now register.', 'success');
            }

            modal.classList.remove('active');
            renderManageEvents();
            renderTeacherDashboardOverview();
        };
    }
}

function handleDeleteEvent(eventId) {
    const event = db.getEventById(eventId);
    if (!event) return;

    if (confirm(`Delete event "${event.title}"?`)) {
        db.deleteEvent(eventId);
        auth.showToast('Event removed.', 'info');
        renderManageEvents();
        renderTeacherDashboardOverview();
    }
}

// 4. Student Registrations Management (Approve, Reject, View Details)
function renderManageRegistrations() {
    const tbody = document.getElementById('admin-registrations-tbody');
    if (!tbody) return;

    const regs = db.getRegistrations();
    const filterStatus = document.getElementById('admin-reg-status-filter');
    const searchInput = document.getElementById('admin-reg-search');

    let displayRegs = regs;

    if (filterStatus && filterStatus.value !== 'all') {
        displayRegs = displayRegs.filter(r => r.status.toLowerCase() === filterStatus.value.toLowerCase());
    }

    if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.toLowerCase().trim();
        displayRegs = displayRegs.filter(r => 
            r.studentName.toLowerCase().includes(query) ||
            r.studentEmail.toLowerCase().includes(query) ||
            r.eventName.toLowerCase().includes(query) ||
            r.clubName.toLowerCase().includes(query)
        );
    }

    if (displayRegs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No student registrations found.</td></tr>`;
        return;
    }

    tbody.innerHTML = displayRegs.map(r => `
        <tr>
            <td>
                <strong>${r.studentName}</strong>
                <span class="d-block text-xs text-muted">${r.rollNo || ''} (${r.branch || 'CSE'})</span>
            </td>
            <td><a href="mailto:${r.studentEmail}">${r.studentEmail}</a></td>
            <td>
                <strong>${r.eventName}</strong>
                <span class="d-block text-xs text-primary">${r.clubName}</span>
            </td>
            <td>${r.registrationDate}</td>
            <td>
                <span class="badge ${r.status === 'Approved' ? 'badge-status-approved' : r.status === 'Rejected' ? 'badge-status-rejected' : 'badge-status-pending'}">
                    ${r.status}
                </span>
            </td>
            <td>
                <div class="admin-table-actions">
                    <button onclick="updateRegistrationStatusAction('${r.id}', 'Approved')" class="action-btn-sm action-approve" title="Approve Registration">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                    <button onclick="updateRegistrationStatusAction('${r.id}', 'Rejected')" class="action-btn-sm action-reject" title="Reject Registration">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                    <button onclick="viewRegistrationDetails('${r.id}')" class="action-btn-sm" style="background:var(--slate-100); color:var(--slate-700);" title="View Details">
                        <i class="fa-solid fa-eye"></i> Details
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (filterStatus && !filterStatus.dataset.listening) {
        filterStatus.dataset.listening = "true";
        filterStatus.addEventListener('change', () => renderManageRegistrations());
    }
    if (searchInput && !searchInput.dataset.listening) {
        searchInput.dataset.listening = "true";
        searchInput.addEventListener('input', () => renderManageRegistrations());
    }
}

function updateRegistrationStatusAction(regId, newStatus) {
    db.updateRegistrationStatus(regId, newStatus);
    auth.showToast(`Registration marked as ${newStatus}.`, 'success');
    renderManageRegistrations();
    renderTeacherDashboardOverview();
}

function viewRegistrationDetails(regId) {
    const reg = db.getRegistrations().find(r => r.id === regId);
    if (!reg) return;

    alert(
        `STUDENT REGISTRATION DOSSIER\n` +
        `----------------------------------------\n` +
        `Student Name: ${reg.studentName}\n` +
        `Email: ${reg.studentEmail}\n` +
        `Roll Number: ${reg.rollNo || '26CSE042'}\n` +
        `Department: ${reg.branch || 'CSE'}\n` +
        `Event: ${reg.eventName}\n` +
        `Club Host: ${reg.clubName}\n` +
        `Registration Date: ${reg.registrationDate}\n` +
        `Current Status: ${reg.status}`
    );
}

// 5. Announcements Management
function renderTeacherAnnouncements() {
    const container = document.getElementById('admin-announcements-list');
    if (!container) return;

    const announcements = db.getAnnouncements();

    if (announcements.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No announcements currently active.</p></div>`;
        return;
    }

    container.innerHTML = announcements.map(ann => `
        <div class="notification-card">
            <div class="notification-icon" style="background:#ccfbf1; color:#0d9488;">
                <i class="fa-solid fa-bullhorn"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <h4 class="notification-title">${ann.title}</h4>
                    <div>
                        <span class="notification-date">${ann.date}</span>
                        <button onclick="handleDeleteAnnouncement('${ann.id}')" class="btn btn-danger-outline btn-sm" style="margin-left: 0.75rem;">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </div>
                <p class="notification-msg">${ann.message}</p>
                <div class="notification-author">
                    Target: <strong>${ann.target || 'All Students'}</strong> | Author: ${ann.author || 'Dr. Priya Raman'}
                </div>
            </div>
        </div>
    `).join('');
}

function setupAnnouncementForm() {
    const form = document.getElementById('create-announcement-form');
    if (!form) return;

    form.onsubmit = (e) => {
        e.preventDefault();
        const teacher = auth.getCurrentUser();

        const ann = {
            title: document.getElementById('ann-title-input').value.trim(),
            message: document.getElementById('ann-message-input').value.trim(),
            target: document.getElementById('ann-target-select').value,
            author: teacher ? teacher.name : 'Dr. Priya Raman (Club Convener)'
        };

        db.addAnnouncement(ann);
        auth.showToast('Announcement broadcasted! It is now visible to students.', 'success');
        form.reset();
        renderTeacherAnnouncements();
    };
}

function handleDeleteAnnouncement(annId) {
    if (confirm('Delete this announcement?')) {
        db.deleteAnnouncement(annId);
        auth.showToast('Announcement removed.', 'info');
        renderTeacherAnnouncements();
    }
}

// 6. Reports View
function renderTeacherReports() {
    const clubs = db.getClubs();
    const events = db.getEvents();
    const regs = db.getRegistrations();

    const reportClubsEl = document.getElementById('rep-total-clubs');
    const reportEventsEl = document.getElementById('rep-total-events');
    const reportRegsEl = document.getElementById('rep-total-regs');

    if (reportClubsEl) reportClubsEl.textContent = clubs.length;
    if (reportEventsEl) reportEventsEl.textContent = events.length;
    if (reportRegsEl) reportRegsEl.textContent = regs.length;

    // Club breakdown table
    const tbody = document.getElementById('rep-clubs-breakdown-tbody');
    if (tbody) {
        tbody.innerHTML = clubs.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td><span class="badge badge-tech">${c.category}</span></td>
                <td>${c.memberCount || 50} Members</td>
                <td>${c.president || 'Student Lead'}</td>
                <td><span class="badge badge-status-approved">Active</span></td>
            </tr>
        `).join('');
    }

    // Export CSV Button
    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Club Name,Category,Members,President,Coordinator\n";
            clubs.forEach(c => {
                csvContent += `"${c.name}","${c.category}","${c.memberCount || 50}","${c.president}","${c.facultyCoordinator}"\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "club_corner_report_2026.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            auth.showToast('Report CSV generated and downloaded.', 'success');
        };
    }
}

// 7. Teacher Profile Form
function populateTeacherProfileForm() {
    const teacher = auth.getCurrentUser();
    if (!teacher) return;

    document.getElementById('teacher-profile-name').value = teacher.name || '';
    document.getElementById('teacher-profile-email').value = teacher.email || '';
    document.getElementById('teacher-profile-dept').value = teacher.department || 'Computer Science & Engineering';
    document.getElementById('teacher-profile-desig').value = teacher.designation || 'Associate Professor & Student Clubs Convener';
}

function setupTeacherProfileForm() {
    const form = document.getElementById('teacher-profile-form');
    if (!form) return;

    form.onsubmit = (e) => {
        e.preventDefault();
        const teacher = auth.getCurrentUser();
        if (!teacher) return;

        const updated = {
            ...teacher,
            name: document.getElementById('teacher-profile-name').value.trim(),
            department: document.getElementById('teacher-profile-dept').value.trim(),
            designation: document.getElementById('teacher-profile-desig').value.trim(),
            avatarText: document.getElementById('teacher-profile-name').value.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        };

        db.updateUser(updated);
        auth.showToast('Faculty profile updated successfully.', 'success');
        refreshTeacherHeader();
    };
}

// Helper icons
function getCategoryIcon(cat) {
    switch (cat ? cat.toLowerCase() : '') {
        case 'technical': return 'fa-microchip';
        case 'cultural': return 'fa-masks-theater';
        case 'literary': return 'fa-feather-pointed';
        case 'arts': return 'fa-palette';
        case 'entrepreneurship': return 'fa-chart-line';
        default: return 'fa-users';
    }
}

function setupMobileTeacherSidebar() {
    const toggleBtn = document.getElementById('mobile-teacher-sidebar-toggle');
    const sidebar = document.getElementById('teacher-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
}

function closeMobileTeacherSidebar() {
    const sidebar = document.getElementById('teacher-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
}
