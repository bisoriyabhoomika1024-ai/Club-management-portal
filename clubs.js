/**
 * Club Corner - Clubs & Club Details Controller (clubs.js)
 * Supports catalog search, category filtering, joining clubs, and detailed club views.
 */

let currentCategoryFilter = 'all';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    // Check navigation session
    auth.initNavUser();

    // If on clubs catalog page
    if (document.getElementById('all-clubs-grid')) {
        setupClubsCatalog();
    }

    // If on club details page
    if (document.getElementById('club-details-container')) {
        setupClubDetails();
    }
});

// Setup Clubs Catalog
function setupClubsCatalog() {
    renderClubsGrid();

    // Category pills filter
    const pills = document.querySelectorAll('.category-pills .pill-btn');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategoryFilter = pill.getAttribute('data-category');
            renderClubsGrid();
        });
    });

    // Search input filter
    const searchInput = document.getElementById('club-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            renderClubsGrid();
        });
    }
}

function renderClubsGrid() {
    const container = document.getElementById('all-clubs-grid');
    if (!container) return;

    let clubs = db.getClubs();
    const currentUser = auth.getCurrentUser();
    const studentEmail = currentUser && currentUser.role === 'student' ? currentUser.email : null;

    // Apply category filter
    if (currentCategoryFilter !== 'all') {
        clubs = clubs.filter(c => c.category && c.category.toLowerCase() === currentCategoryFilter.toLowerCase());
    }

    // Apply search filter
    if (currentSearchTerm) {
        clubs = clubs.filter(c => 
            c.name.toLowerCase().includes(currentSearchTerm) ||
            c.shortDesc.toLowerCase().includes(currentSearchTerm) ||
            c.category.toLowerCase().includes(currentSearchTerm) ||
            (c.president && c.president.toLowerCase().includes(currentSearchTerm))
        );
    }

    if (clubs.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h4>No Clubs Found</h4>
                <p>No clubs match your current search or category filter. Try clearing the search or choosing another category.</p>
                <button class="btn btn-outline btn-sm" onclick="clearFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }

    container.innerHTML = clubs.map(club => {
        const isMember = studentEmail ? db.isStudentMember(studentEmail, club.id) : false;
        const categoryBadgeClass = getCategoryBadgeClass(club.category);

        return `
            <div class="card card-hoverable club-card">
                <div class="club-card-banner" style="background: ${club.accentBg || 'linear-gradient(135deg, #4f46e5, #7c3aed)'};">
                    <span class="badge ${categoryBadgeClass}">${club.category}</span>
                    <div class="club-avatar">
                        <i class="fa-solid ${club.icon || 'fa-users'}" style="color: ${club.color || '#4f46e5'}"></i>
                    </div>
                </div>
                <div class="club-card-body">
                    <h3 class="club-card-title">${club.name}</h3>
                    <p class="club-card-desc">${club.shortDesc}</p>
                    <div class="club-card-meta">
                        <span><i class="fa-solid fa-users text-muted"></i> ${club.memberCount || 50} Members</span>
                        <span><i class="fa-regular fa-clock text-muted"></i> Est. ${club.foundedYear || 2020}</span>
                    </div>
                    <div class="club-card-footer">
                        <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm" style="flex:1;">
                            Explore
                        </a>
                        ${currentUser && currentUser.role === 'student' ? `
                            <button onclick="toggleClub('${club.id}')" class="btn ${isMember ? 'btn-secondary' : 'btn-primary'} btn-sm">
                                <i class="fa-solid ${isMember ? 'fa-check' : 'fa-plus'}"></i> ${isMember ? 'Joined' : 'Join Club'}
                            </button>
                        ` : `
                            <a href="login.html?redirect=clubs.html" class="btn btn-primary btn-sm">
                                Join
                            </a>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function clearFilters() {
    currentCategoryFilter = 'all';
    currentSearchTerm = '';
    const searchInput = document.getElementById('club-search-input');
    if (searchInput) searchInput.value = '';
    const pills = document.querySelectorAll('.category-pills .pill-btn');
    pills.forEach(p => p.classList.remove('active'));
    if (pills[0]) pills[0].classList.add('active');
    renderClubsGrid();
}

function toggleClub(clubId) {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    const isMember = db.isStudentMember(user.email, clubId);
    if (isMember) {
        db.leaveClub(user.email, clubId);
        auth.showToast('You left the club.', 'info');
    } else {
        db.joinClub(user.email, clubId);
        auth.showToast('Congratulations! You are now a member of this club.', 'success');
    }

    if (document.getElementById('all-clubs-grid')) {
        renderClubsGrid();
    }
    if (document.getElementById('club-details-container')) {
        setupClubDetails();
    }
}

// Setup Club Details Page
function setupClubDetails() {
    const container = document.getElementById('club-details-container');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const clubId = params.get('id') || 'club-1';
    const club = db.getClubById(clubId) || db.getClubs()[0];

    if (!club) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Club Not Found</h3>
                <p>The club you are looking for does not exist or has been removed.</p>
                <a href="clubs.html" class="btn btn-primary">Back to All Clubs</a>
            </div>
        `;
        return;
    }

    const currentUser = auth.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'student' ? 
        db.isStudentMember(currentUser.email, club.id) : false;
    
    // Find events for this club
    const allEvents = db.getEvents();
    const clubEvents = allEvents.filter(e => e.clubId === club.id || e.clubName === club.name);

    container.innerHTML = `
        <!-- Club Banner Header -->
        <div class="club-hero-header" style="background: ${club.accentBg || 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)'};">
            <div class="container club-hero-inner">
                <div class="club-hero-left">
                    <div class="club-hero-avatar">
                        <i class="fa-solid ${club.icon || 'fa-users'}" style="color: ${club.color || '#4f46e5'}"></i>
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge ${getCategoryBadgeClass(club.category)}">${club.category}</span>
                            <span class="badge" style="background: rgba(255,255,255,0.2); color: #fff;">Founded ${club.foundedYear || 2018}</span>
                        </div>
                        <h1 class="club-hero-name">${club.name}</h1>
                        <p class="club-hero-tagline">${club.badge || club.shortDesc}</p>
                    </div>
                </div>
                <div class="club-hero-right">
                    <div class="club-stat-pill">
                        <i class="fa-solid fa-users"></i>
                        <span><strong>${club.memberCount || 50}</strong> Active Members</span>
                    </div>
                    ${currentUser && currentUser.role === 'student' ? `
                        <button onclick="toggleClub('${club.id}')" class="btn ${isMember ? 'btn-secondary' : 'btn-light'} btn-lg">
                            <i class="fa-solid ${isMember ? 'fa-check-circle' : 'fa-plus-circle'}"></i>
                            ${isMember ? 'Member of Club' : 'Join This Club'}
                        </button>
                    ` : `
                        <a href="login.html?redirect=club-details.html?id=${club.id}" class="btn btn-light btn-lg">
                            <i class="fa-solid fa-right-to-bracket"></i> Login to Join
                        </a>
                    `}
                </div>
            </div>
        </div>

        <!-- Club Main Content Body -->
        <div class="container py-5">
            <div class="club-details-layout">
                <!-- Left Details Column -->
                <div class="club-main-column">
                    <!-- About Card -->
                    <div class="card mb-4 p-4">
                        <h3 class="mb-3 font-bold" style="font-size: 1.35rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-circle-info text-primary"></i> About the Club
                        </h3>
                        <p style="color: var(--slate-700); line-height: 1.7; font-size: 1rem; margin-bottom: 1.5rem;">
                            ${club.fullDesc || club.shortDesc}
                        </p>
                        
                        <h4 class="font-bold mb-2" style="font-size: 1.1rem; color: var(--slate-900);">
                            <i class="fa-solid fa-bullseye text-primary"></i> Our Mission
                        </h4>
                        <div style="background: var(--slate-50); border-left: 4px solid var(--primary); padding: 1rem 1.25rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem;">
                            <p style="color: var(--slate-700); font-style: italic; margin: 0;">
                                "${club.mission || 'To cultivate technical leadership and innovative problem solving for society.'}"
                            </p>
                        </div>

                        <h4 class="font-bold mb-3" style="font-size: 1.1rem; color: var(--slate-900);">
                            <i class="fa-solid fa-list-check text-primary"></i> Regular Activities & Initiatives
                        </h4>
                        <ul class="club-activities-list">
                            ${(club.activities || [
                                'Hands-on practical training & workshops',
                                'Annual flagship department hackathons & fests',
                                'Mentorship for national collegiate hackathons',
                                'Peer networking and resume-building sessions'
                            ]).map(act => `
                                <li><i class="fa-solid fa-circle-check text-success"></i> ${act}</li>
                            `).join('')}
                        </ul>
                    </div>

                    <!-- Upcoming Events by this Club -->
                    <div class="card p-4">
                        <h3 class="mb-3 font-bold" style="font-size: 1.35rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-calendar-days text-primary"></i> Upcoming Club Events (${clubEvents.length})
                        </h3>
                        ${clubEvents.length > 0 ? `
                            <div class="club-events-sublist">
                                ${clubEvents.map(event => {
                                    const isRegistered = currentUser && currentUser.role === 'student' ?
                                        db.isStudentRegisteredForEvent(currentUser.email, event.id) : false;
                                    return `
                                        <div class="event-strip-item">
                                            <div class="strip-date">
                                                <span>${new Date(event.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <div class="strip-info">
                                                <h5 class="strip-title">${event.title}</h5>
                                                <div class="strip-meta">
                                                    <span><i class="fa-regular fa-clock"></i> ${event.time}</span>
                                                    <span><i class="fa-solid fa-location-dot"></i> ${event.venue}</span>
                                                </div>
                                            </div>
                                            <div class="strip-action">
                                                ${currentUser && currentUser.role === 'student' ? `
                                                    <button onclick="registerForClubEvent('${event.id}')" class="btn ${isRegistered ? 'btn-secondary' : 'btn-primary'} btn-sm">
                                                        ${isRegistered ? 'Registered' : 'Register'}
                                                    </button>
                                                ` : `
                                                    <a href="login.html" class="btn btn-outline btn-sm">Register</a>
                                                `}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <p class="text-muted" style="margin: 0;">No upcoming scheduled events at this moment. Stay tuned!</p>
                        `}
                    </div>
                </div>

                <!-- Right Sidebar Column (Leadership & Contact) -->
                <div class="club-sidebar-column">
                    <!-- Leadership Card -->
                    <div class="card p-4 mb-4">
                        <h4 class="font-bold mb-3" style="font-size: 1.15rem; color: var(--slate-900);">
                            <i class="fa-solid fa-user-tie text-primary"></i> Club Leadership
                        </h4>
                        
                        <div class="leader-item mb-3">
                            <span class="leader-role">President</span>
                            <h5 class="leader-name">${club.president || 'Student President'}</h5>
                        </div>

                        <div class="leader-item mb-3">
                            <span class="leader-role">Vice-President</span>
                            <h5 class="leader-name">${club.vicePresident || 'Student Vice-President'}</h5>
                        </div>

                        <div class="leader-item">
                            <span class="leader-role">Faculty Coordinator</span>
                            <h5 class="leader-name">${club.facultyCoordinator || 'Prof. Faculty Mentor'}</h5>
                        </div>
                    </div>

                    <!-- Contact & Communication Card -->
                    <div class="card p-4">
                        <h4 class="font-bold mb-3" style="font-size: 1.15rem; color: var(--slate-900);">
                            <i class="fa-solid fa-address-book text-primary"></i> Contact & Office
                        </h4>
                        
                        <div class="contact-entry mb-2">
                            <i class="fa-regular fa-envelope text-primary"></i>
                            <div>
                                <span class="text-muted text-xs d-block">Official Email</span>
                                <a href="mailto:${club.contactEmail}">${club.contactEmail || 'club@college.edu'}</a>
                            </div>
                        </div>

                        <div class="contact-entry mb-2">
                            <i class="fa-solid fa-phone text-primary"></i>
                            <div>
                                <span class="text-muted text-xs d-block">Contact Phone</span>
                                <span>${club.contactPhone || '+91 98765 43210'}</span>
                            </div>
                        </div>

                        <div class="contact-entry">
                            <i class="fa-solid fa-location-dot text-primary"></i>
                            <div>
                                <span class="text-muted text-xs d-block">Meeting Location</span>
                                <span>Student Activity Centre, 2nd Floor</span>
                            </div>
                        </div>

                        <div class="pt-3 mt-3 border-top">
                            <a href="clubs.html" class="btn btn-outline btn-sm w-100">
                                <i class="fa-solid fa-arrow-left"></i> Back to All Clubs
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function registerForClubEvent(eventId) {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    if (db.isStudentRegisteredForEvent(user.email, eventId)) {
        auth.showToast('You are already registered for this event.', 'info');
        return;
    }

    const res = db.registerStudentForEvent(user, eventId);
    if (res.success) {
        auth.showToast('Registration successful! View under My Registrations in your dashboard.', 'success');
        setupClubDetails();
    } else {
        auth.showToast(res.message, 'warning');
    }
}

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
