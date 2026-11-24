/**
 * Club Corner - Landing Page Controller (landing.js)
 * Populates featured clubs, upcoming events and handles mobile navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation auth status
    auth.initNavUser();

    // Render Featured Clubs
    renderFeaturedClubs();

    // Render Upcoming Events
    renderUpcomingEvents();

    // Setup Mobile Navigation Toggle
    setupMobileNav();

    // Setup Demo Reset Button
    setupResetDemo();
});

function renderFeaturedClubs() {
    const container = document.getElementById('featured-clubs-container');
    if (!container) return;

    const clubs = db.getClubs().slice(0, 4); // First 4 highlight clubs
    const currentUser = auth.getCurrentUser();
    const studentEmail = currentUser && currentUser.role === 'student' ? currentUser.email : null;

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
                        <span><i class="fa-solid fa-users text-muted"></i> ${club.memberCount || 100}+ Members</span>
                        <span><i class="fa-regular fa-calendar-check text-muted"></i> Active</span>
                    </div>
                    <div class="club-card-footer">
                        <a href="club-details.html?id=${club.id}" class="btn btn-outline btn-sm" style="flex:1;">
                            View Details
                        </a>
                        ${currentUser && currentUser.role === 'student' ? `
                            <button onclick="handleJoinToggle('${club.id}')" class="btn ${isMember ? 'btn-secondary' : 'btn-primary'} btn-sm">
                                <i class="fa-solid ${isMember ? 'fa-check' : 'fa-plus'}"></i> ${isMember ? 'Joined' : 'Join'}
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

function renderUpcomingEvents() {
    const container = document.getElementById('upcoming-events-container');
    if (!container) return;

    const events = db.getEvents().slice(0, 3); // First 3 upcoming events
    const currentUser = auth.getCurrentUser();

    container.innerHTML = events.map(event => {
        const dateObj = new Date(event.date);
        const month = dateObj.toLocaleString('default', { month: 'short' });
        const day = dateObj.getDate() || '15';
        const isRegistered = currentUser && currentUser.role === 'student' ? 
            db.isStudentRegisteredForEvent(currentUser.email, event.id) : false;

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
                <p style="font-size: 0.88rem; color: var(--slate-600); line-height: 1.5; margin-bottom: 0.5rem;">
                    ${event.description.length > 110 ? event.description.substring(0, 110) + '...' : event.description}
                </p>
                <div class="event-card-actions">
                    <span style="font-size: 0.8rem; font-weight: 600; color: var(--slate-500);">
                        <i class="fa-solid fa-user-group text-primary"></i> ${event.registeredCount || 0} Registered
                    </span>
                    ${currentUser && currentUser.role === 'student' ? `
                        <button onclick="handleEventRegister('${event.id}')" class="btn ${isRegistered ? 'btn-secondary' : 'btn-primary'} btn-sm">
                            <i class="fa-solid ${isRegistered ? 'fa-check' : 'fa-ticket'}"></i> ${isRegistered ? 'Registered' : 'Register Now'}
                        </button>
                    ` : `
                        <a href="login.html?redirect=events.html" class="btn btn-primary btn-sm">
                            <i class="fa-solid fa-ticket"></i> Register
                        </a>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function handleJoinToggle(clubId) {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    const isMember = db.isStudentMember(user.email, clubId);
    if (isMember) {
        db.leaveClub(user.email, clubId);
        auth.showToast('You have left the club.', 'info');
    } else {
        db.joinClub(user.email, clubId);
        auth.showToast('Successfully joined the club! Check My Clubs in your dashboard.', 'success');
    }
    renderFeaturedClubs();
}

function handleEventRegister(eventId) {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    const isRegistered = db.isStudentRegisteredForEvent(user.email, eventId);
    if (isRegistered) {
        auth.showToast('You are already registered! View details in My Registrations.', 'info');
        return;
    }

    const res = db.registerStudentForEvent(user, eventId);
    if (res.success) {
        auth.showToast('Registration confirmed! Saved to your Student Dashboard.', 'success');
        renderUpcomingEvents();
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

function setupMobileNav() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    if (toggleBtn && navLinks) {
        toggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
        });
    }
}

function setupResetDemo() {
    const resetBtn = document.getElementById('reset-demo-data-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Reset all demo data back to factory defaults?')) {
                db.resetDemoData();
                auth.showToast('Demo data successfully restored.', 'success');
                setTimeout(() => window.location.reload(), 600);
            }
        });
    }
}
