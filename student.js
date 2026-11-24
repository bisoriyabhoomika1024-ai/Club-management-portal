/**
 * Club Corner - Student Dashboard Controller (student.js)
 * Manages views, club memberships, event registrations, notifications, and profile editing.
 */

// Global active view state
let currentStudentView = 'dashboard';
let currentStudentClubCategory = 'all';
let currentStudentClubSearch = '';
let currentStudentEventCategory = 'all';
let currentStudentEventSearch = '';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Role Route Protection
    if (!auth.protectRoute(['student'])) {
        return;
    }

    // 2. Initialize student profile in UI
    refreshStudentHeader();

    // 3. Setup Navigation Sidebar & View Switcher
    setupSidebarNavigation();

    // 4. Initial Render of Dashboard Overview
    renderDashboardOverview();

    // 5. Setup Profile Edit Form
    setupProfileForm();

    // 6. Setup Mobile Sidebar Drawer
    setupMobileSidebar();

    // 7. Check if hash or query param requested a specific view
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam) {
        switchView(viewParam);
    }
});

// Refresh Student Info in Top Bar & Sidebar
function refreshStudentHeader() {
    const student = auth.getCurrentUser();
    if (!student) return;

    // Sidebar
    const avatarEl = document.getElementById('student-avatar-display');
    const nameEl = document.getElementById('student-name-display');
    const rollEl = document.getElementById('student-roll-display');
    if (avatarEl) avatarEl.textContent = student.avatarText || student.name.charAt(0);
    if (nameEl) nameEl.textContent = student.name;
    if (rollEl) rollEl.textContent = student.rollNo || 'Roll No: N/A';

    // Top Bar & Welcome Banner
    const welcomeNameEl = document.getElementById('welcome-student-name');
    if (welcomeNameEl) welcomeNameEl.textContent = student.name;

    // Notification Badge Count
    const announcements = db.getAnnouncements();
    const notifBadge = document.getElementById('notif-badge-count');
    const sidebarNotifBadge = document.getElementById('sidebar-notif-badge');
    if (notifBadge) notifBadge.textContent = announcements.length;
    if (sidebarNotifBadge) sidebarNotifBadge.textContent = announcements.length;
}

// Sidebar Navigation
function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item[data-view]');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('student-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
}

// Switch between dashboard sections
function switchView(viewName) {
    currentStudentView = viewName;

    // Update active class on sidebar menu items
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update view title in top nav
    const viewTitleEl = document.getElementById('current-view-title');
    const titles = {
        'dashboard': 'Student Dashboard',
        'explore-clubs': 'Explore All Clubs',
        'my-clubs': 'My Joined Clubs',
        'upcoming-events': 'Upcoming Events & Competitions',
        'my-registrations': 'My Event Registrations',
        'notifications': 'Campus Announcements & Notices',
        'profile': 'My Student Profile'
    };
    if (viewTitleEl) viewTitleEl.textContent = titles[viewName] || 'Dashboard';

    // Hide all views, display the selected view
    const allViews = document.querySelectorAll('.dashboard-view');
    allViews.forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Trigger view-specific rendering
    if (viewName === 'dashboard') {
        renderDashboardOverview();
    } else if (viewName === 'explore-clubs') {
        renderExploreClubs();
    } else if (viewName === 'my-clubs') {
        renderMyClubs();
    } else if (viewName === 'upcoming-events') {
        renderStudentEvents();
    } else if (viewName === 'my-registrations') {
        renderMyRegistrations();
    } else if (viewName === 'notifications') {
        renderNotifications();
    } else if (viewName === 'profile') {
        populateProfileForm();
    }

    // Close mobile sidebar on navigation
    closeMobileSidebar();
}

// 1. Dashboard Overview View
function renderDashboardOverview() {
    const student = auth.getCurrentUser();
    if (!student) return;

    // Calculate metrics
    const joinedClubIds = db.getStudentJoinedClubIds(student.email);
    const allEvents = db.getEvents();
    const myRegistrations = db.getRegistrationsForStudent(student.email);
    const announcements = db.getAnnouncements();

    // Update metric cards
    const statClubs = document.getElementById('stat-clubs-joined');
    const statEvents = document.getElementById('stat-upcoming-events');
    const statRegs = document.getElementById('stat-events-registered');
    const statNotifs = document.getElementById('stat-new-notifs');

    if (statClubs) statClubs.textContent = joinedClubIds.length;
    if (statEvents) statEvents.textContent = allEvents.length;
    if (statRegs) statRegs.textContent = myRegistrations.length;
    if (statNotifs) statNotifs.textContent = announcements.length;

    // Render Recommended Clubs (first 3 clubs the student hasn't joined yet, or top 3)
    const recClubsContainer = document.getElementById('dashboard-recommended-clubs');
    if (recClubsContainer) {
        const allClubs = db.getClubs();
        const unjoined = allClubs.filter(c => !joinedClubIds.includes(c.id)).slice(0, 3);
        const clubsToShow = unjoined.length > 0 ? unjoined : allClubs.slice(0, 3);

        recClubsContainer.innerHTML = clubsToShow.map(club => {
            const isMember = db.isStudentMember(student.email, club.id);
            return `
                <div class="card card-hoverable club-card">
                    <div class="club-card-banner" style="background: ${club.accentBg};">
                        <span class="badge ${getCategoryBadgeClass(club.category)}">${club.category}</span>
                        <div class="club-avatar">
                            <i class="fa-solid ${club.icon || 'fa-users'}" style="color: ${club.color}"></i>
                        </div>
                    </div>
                    <div class="club-card-body">
                        <h4 class="club-card-title">${club.name}</h4>
                        <p class="club-card-desc">${club.shortDesc}</p>
                        <div class="club-card-meta">
                            <span><i class="fa-solid fa-users text-muted"></i> ${club.memberCount || 50} Members</span>
                        </div>
                        <div class="club-card-footer">
                            <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm" style="flex:1;">Details</a>
                            <button onclick="handleStudentJoinClub('${club.id}')" class="btn ${isMember ? 'btn-secondary' : 'btn-primary'} btn-sm">
                                <i class="fa-solid ${isMember ? 'fa-check' : 'fa-plus'}"></i> ${isMember ? 'Joined' : 'Join Club'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render Dashboard Upcoming Events
    const dashEventsContainer = document.getElementById('dashboard-upcoming-events');
    if (dashEventsContainer) {
        const eventsToShow = allEvents.slice(0, 3);
        dashEventsContainer.innerHTML = eventsToShow.map(event => {
            const isRegistered = db.isStudentRegisteredForEvent(student.email, event.id);
            const dateObj = new Date(event.date);
            const month = dateObj.toLocaleString('default', { month: 'short' });
            const day = dateObj.getDate() || '15';

            return `
                <div class="event-card">
                    <div class="event-card-header">
                        <div class="event-date-badge">
                            <span class="month">${month}</span>
                            <span class="day">${day}</span>
                        </div>
                        <div class="event-info">
                            <span class="event-club-tag"><i class="fa-solid fa-flag"></i> ${event.clubName}</span>
                            <h4 class="event-title">${event.title}</h4>
                        </div>
                    </div>
                    <div class="event-details-list">
                        <div class="event-detail-item">
                            <i class="fa-regular fa-clock"></i>
                            <span>${event.time}</span>
                        </div>
                        <div class="event-detail-item">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>${event.venue}</span>
                        </div>
                    </div>
                    <div class="event-card-actions">
                        <span class="text-muted" style="font-size: 0.82rem;">
                            <i class="fa-solid fa-user-group text-primary"></i> ${event.registeredCount || 0} registered
                        </span>
                        <button onclick="handleStudentRegisterEvent('${event.id}')" class="btn ${isRegistered ? 'btn-secondary' : 'btn-primary'} btn-sm">
                            <i class="fa-solid ${isRegistered ? 'fa-check' : 'fa-ticket'}"></i> ${isRegistered ? 'Registered' : 'Register'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 2. Explore Clubs View
function renderExploreClubs() {
    const container = document.getElementById('student-all-clubs-grid');
    if (!container) return;

    const student = auth.getCurrentUser();
    let clubs = db.getClubs();

    // Filter by Category
    if (currentStudentClubCategory !== 'all') {
        clubs = clubs.filter(c => c.category && c.category.toLowerCase() === currentStudentClubCategory.toLowerCase());
    }

    // Filter by Search
    if (currentStudentClubSearch) {
        clubs = clubs.filter(c => 
            c.name.toLowerCase().includes(currentStudentClubSearch) ||
            c.shortDesc.toLowerCase().includes(currentStudentClubSearch) ||
            c.category.toLowerCase().includes(currentStudentClubSearch)
        );
    }

    // Setup Category pills listeners once
    const pills = document.querySelectorAll('#view-explore-clubs .pill-btn');
    pills.forEach(pill => {
        pill.onclick = () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentStudentClubCategory = pill.getAttribute('data-category');
            renderExploreClubs();
        };
    });

    // Search listener
    const searchInput = document.getElementById('student-club-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            currentStudentClubSearch = e.target.value.toLowerCase().trim();
            renderExploreClubs();
        };
    }

    if (clubs.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h4>No Clubs Found</h4>
                <p>Try searching for a different keyword or resetting your category filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = clubs.map(club => {
        const isMember = db.isStudentMember(student.email, club.id);
        return `
            <div class="card card-hoverable club-card">
                <div class="club-card-banner" style="background: ${club.accentBg};">
                    <span class="badge ${getCategoryBadgeClass(club.category)}">${club.category}</span>
                    <div class="club-avatar">
                        <i class="fa-solid ${club.icon || 'fa-users'}" style="color: ${club.color}"></i>
                    </div>
                </div>
                <div class="club-card-body">
                    <h4 class="club-card-title">${club.name}</h4>
                    <p class="club-card-desc">${club.shortDesc}</p>
                    <div class="club-card-meta">
                        <span><i class="fa-solid fa-users text-muted"></i> ${club.memberCount || 50} Members</span>
                        <span><i class="fa-regular fa-clock text-muted"></i> Est. ${club.foundedYear || 2020}</span>
                    </div>
                    <div class="club-card-footer">
                        <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm" style="flex:1;">Details</a>
                        <button onclick="handleStudentJoinClub('${club.id}')" class="btn ${isMember ? 'btn-secondary' : 'btn-primary'} btn-sm">
                            <i class="fa-solid ${isMember ? 'fa-check' : 'fa-plus'}"></i> ${isMember ? 'Joined' : 'Join Club'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 3. My Clubs View
function renderMyClubs() {
    const container = document.getElementById('student-my-clubs-grid');
    if (!container) return;

    const student = auth.getCurrentUser();
    const joinedClubIds = db.getStudentJoinedClubIds(student.email);
    const allClubs = db.getClubs();
    const myClubs = allClubs.filter(c => joinedClubIds.includes(c.id));

    if (myClubs.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-users-slash"></i>
                <h4>You Haven't Joined Any Clubs Yet</h4>
                <p>Join clubs to participate in workshops, projects, and collegiate fests!</p>
                <button class="btn btn-primary" onclick="switchView('explore-clubs')">
                    <i class="fa-solid fa-compass"></i> Explore Clubs Now
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = myClubs.map(club => {
        return `
            <div class="card club-card">
                <div class="club-card-banner" style="background: ${club.accentBg};">
                    <span class="badge ${getCategoryBadgeClass(club.category)}">${club.category}</span>
                    <span class="badge" style="background: rgba(255,255,255,0.25); color: #fff;">
                        <i class="fa-solid fa-circle-check"></i> Member
                    </span>
                    <div class="club-avatar">
                        <i class="fa-solid ${club.icon || 'fa-users'}" style="color: ${club.color}"></i>
                    </div>
                </div>
                <div class="club-card-body">
                    <h4 class="club-card-title">${club.name}</h4>
                    <p class="club-card-desc">${club.shortDesc}</p>
                    <div class="club-card-meta">
                        <span><i class="fa-solid fa-users text-muted"></i> ${club.memberCount || 50} Members</span>
                        <span><i class="fa-solid fa-user-tie text-muted"></i> ${club.president ? club.president.split('(')[0] : 'Pres.'}</span>
                    </div>
                    <div class="club-card-footer">
                        <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm" style="flex:1;">
                            <i class="fa-solid fa-eye"></i> View Club
                        </a>
                        <button onclick="handleStudentLeaveClub('${club.id}')" class="btn btn-danger-outline btn-sm" title="Leave Club">
                            <i class="fa-solid fa-arrow-right-from-bracket"></i> Leave
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Upcoming Events View
function renderStudentEvents() {
    const container = document.getElementById('student-all-events-grid');
    if (!container) return;

    const student = auth.getCurrentUser();
    let events = db.getEvents();

    // Category Filter
    if (currentStudentEventCategory !== 'all') {
        events = events.filter(e => e.category && e.category.toLowerCase() === currentStudentEventCategory.toLowerCase());
    }

    // Search Filter
    if (currentStudentEventSearch) {
        events = events.filter(e => 
            e.title.toLowerCase().includes(currentStudentEventSearch) ||
            e.clubName.toLowerCase().includes(currentStudentEventSearch) ||
            e.venue.toLowerCase().includes(currentStudentEventSearch)
        );
    }

    // Filter pills listeners
    const pills = document.querySelectorAll('#view-upcoming-events .pill-btn');
    pills.forEach(pill => {
        pill.onclick = () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentStudentEventCategory = pill.getAttribute('data-category');
            renderStudentEvents();
        };
    });

    // Search listener
    const searchInput = document.getElementById('student-event-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            currentStudentEventSearch = e.target.value.toLowerCase().trim();
            renderStudentEvents();
        };
    }

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-calendar-xmark"></i>
                <h4>No Events Found</h4>
                <p>No upcoming events match your search criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => {
        const isRegistered = db.isStudentRegisteredForEvent(student.email, event.id);
        const dateObj = new Date(event.date);
        const month = dateObj.toLocaleString('default', { month: 'short' });
        const day = dateObj.getDate() || '15';

        return `
            <div class="event-card">
                <div class="event-card-header">
                    <div class="event-date-badge">
                        <span class="month">${month}</span>
                        <span class="day">${day}</span>
                    </div>
                    <div class="event-info">
                        <span class="event-club-tag"><i class="fa-solid fa-flag"></i> ${event.clubName}</span>
                        <h4 class="event-title">${event.title}</h4>
                    </div>
                </div>
                <div class="event-details-list">
                    <div class="event-detail-item">
                        <i class="fa-regular fa-clock"></i>
                        <span>${event.time}</span>
                    </div>
                    <div class="event-detail-item">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${event.venue}</span>
                    </div>
                </div>
                <p style="font-size: 0.88rem; color: var(--slate-600); line-height: 1.5; margin: 0.5rem 0;">
                    ${event.description}
                </p>
                <div class="event-card-actions">
                    <span class="text-muted" style="font-size: 0.82rem;">
                        <i class="fa-solid fa-user-group text-primary"></i> ${event.registeredCount || 0} Registered
                    </span>
                    <button onclick="handleStudentRegisterEvent('${event.id}')" class="btn ${isRegistered ? 'btn-secondary' : 'btn-primary'} btn-sm">
                        <i class="fa-solid ${isRegistered ? 'fa-check' : 'fa-ticket'}"></i> ${isRegistered ? 'Registered' : 'Register Now'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 5. My Registrations View
function renderMyRegistrations() {
    const tbody = document.getElementById('student-registrations-tbody');
    if (!tbody) return;

    const student = auth.getCurrentUser();
    const registrations = db.getRegistrationsForStudent(student.email);

    if (registrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2.5rem 1rem;">
                    <i class="fa-solid fa-ticket-simple text-muted" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    <p style="font-weight: 600; color: var(--slate-700); margin-bottom: 0.25rem;">No Event Registrations</p>
                    <p style="font-size: 0.85rem; color: var(--slate-500); margin-bottom: 1rem;">You have not registered for any upcoming college events yet.</p>
                    <button class="btn btn-outline btn-sm" onclick="switchView('upcoming-events')">Browse Events</button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = registrations.map(reg => {
        const event = db.getEventById(reg.eventId);
        const eventDate = event ? event.date : reg.registrationDate;
        const venue = event ? event.venue : 'Campus Venue';
        const statusBadgeClass = reg.status === 'Approved' ? 'badge-status-approved' : 
                                 reg.status === 'Rejected' ? 'badge-status-rejected' : 'badge-status-pending';

        return `
            <tr>
                <td>
                    <strong style="color: var(--slate-900); display: block;">${reg.eventName}</strong>
                    <span style="font-size: 0.78rem; color: var(--primary);"><i class="fa-solid fa-flag"></i> ${reg.clubName}</span>
                </td>
                <td>${eventDate}</td>
                <td>${venue}</td>
                <td>${reg.registrationDate}</td>
                <td>
                    <span class="badge ${statusBadgeClass}">
                        <i class="fa-solid ${reg.status === 'Approved' ? 'fa-check' : 'fa-clock'}"></i>
                        ${reg.status}
                    </span>
                </td>
                <td>
                    <button onclick="handleCancelRegistration('${reg.id}')" class="btn btn-danger-outline btn-sm">
                        <i class="fa-solid fa-xmark"></i> Cancel
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// 6. Notifications / Announcements View
function renderNotifications() {
    const container = document.getElementById('student-notifications-list');
    if (!container) return;

    const announcements = db.getAnnouncements();

    if (announcements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-bell-slash"></i>
                <h4>No Announcements Yet</h4>
                <p>New notices from faculty coordinators and club leaders will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = announcements.map(ann => {
        return `
            <div class="notification-card">
                <div class="notification-icon">
                    <i class="fa-solid fa-bullhorn"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4 class="notification-title">${ann.title}</h4>
                        <span class="notification-date"><i class="fa-regular fa-clock"></i> ${ann.date}</span>
                    </div>
                    <p class="notification-msg">${ann.message}</p>
                    <div class="notification-author">
                        <i class="fa-solid fa-user-shield"></i> Posted by: ${ann.author || 'Club Convener'}
                        ${ann.target ? `<span class="badge badge-tech" style="margin-left: 0.5rem;">${ann.target}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 7. Student Profile Form
function populateProfileForm() {
    const student = auth.getCurrentUser();
    if (!student) return;

    document.getElementById('profile-name').value = student.name || '';
    document.getElementById('profile-email').value = student.email || '';
    document.getElementById('profile-branch').value = student.branch || 'Computer Science & Engineering';
    document.getElementById('profile-year').value = student.year || '1st Year (2026)';
    document.getElementById('profile-roll').value = student.rollNo || '';
}

function setupProfileForm() {
    const form = document.getElementById('student-profile-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const student = auth.getCurrentUser();
        if (!student) return;

        const updated = {
            ...student,
            name: document.getElementById('profile-name').value.trim(),
            branch: document.getElementById('profile-branch').value.trim(),
            year: document.getElementById('profile-year').value.trim(),
            rollNo: document.getElementById('profile-roll').value.trim(),
            avatarText: document.getElementById('profile-name').value.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        };

        db.updateUser(updated);
        auth.showToast('Student profile updated successfully!', 'success');
        refreshStudentHeader();
    });
}

// Actions
function handleStudentJoinClub(clubId) {
    const student = auth.getCurrentUser();
    if (!student) return;

    const isMember = db.isStudentMember(student.email, clubId);
    if (isMember) {
        db.leaveClub(student.email, clubId);
        auth.showToast('You left the club.', 'info');
    } else {
        db.joinClub(student.email, clubId);
        auth.showToast('Successfully joined the club!', 'success');
    }

    refreshStudentHeader();
    if (currentStudentView === 'dashboard') renderDashboardOverview();
    if (currentStudentView === 'explore-clubs') renderExploreClubs();
    if (currentStudentView === 'my-clubs') renderMyClubs();
}

function handleStudentLeaveClub(clubId) {
    const student = auth.getCurrentUser();
    if (!student) return;

    if (confirm('Are you sure you want to leave this club?')) {
        db.leaveClub(student.email, clubId);
        auth.showToast('You have left the club.', 'info');
        refreshStudentHeader();
        renderMyClubs();
        renderDashboardOverview();
    }
}

function handleStudentRegisterEvent(eventId) {
    const student = auth.getCurrentUser();
    if (!student) return;

    if (db.isStudentRegisteredForEvent(student.email, eventId)) {
        auth.showToast('You are already registered for this event. View in My Registrations.', 'info');
        return;
    }

    const res = db.registerStudentForEvent(student, eventId);
    if (res.success) {
        auth.showToast('Registered successfully! Confirmation added to My Registrations.', 'success');
        refreshStudentHeader();
        if (currentStudentView === 'dashboard') renderDashboardOverview();
        if (currentStudentView === 'upcoming-events') renderStudentEvents();
    } else {
        auth.showToast(res.message, 'warning');
    }
}

function handleCancelRegistration(regId) {
    if (confirm('Are you sure you want to cancel this event registration?')) {
        db.cancelRegistration(regId);
        auth.showToast('Event registration cancelled.', 'info');
        refreshStudentHeader();
        renderMyRegistrations();
        renderDashboardOverview();
    }
}

// Helpers
function getCategoryBadgeClass(category) {
    switch (category ? category.toLowerCase() : '') {
        case 'technical': return 'badge-tech';
        case 'cultural': return 'badge-cult';
        case 'literary': return 'badge-lit';
        case 'arts': return 'badge-arts';
        case 'entrepreneurship': return 'badge-biz';
        default: return 'badge-tech';
    }
}

function setupMobileSidebar() {
    const toggleBtn = document.getElementById('mobile-student-sidebar-toggle');
    const sidebar = document.getElementById('student-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('student-sidebar');
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
}
