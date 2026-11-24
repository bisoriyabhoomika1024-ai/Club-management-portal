/**
 * Club Corner - Data Storage & Model Layer
 * Handles LocalStorage persistence for Clubs, Events, Users, Registrations, Announcements, and Audit Logs.
 * Supports Student, Teacher, and Super Admin (Dean) roles.
 */

const STORAGE_KEYS = {
    CLUBS: 'club_corner_clubs',
    EVENTS: 'club_corner_events',
    ANNOUNCEMENTS: 'club_corner_announcements',
    REGISTRATIONS: 'club_corner_registrations',
    USERS: 'club_corner_users',
    MEMBERSHIPS: 'club_corner_memberships',
    SESSION: 'club_corner_session',
    AUDIT_LOGS: 'club_corner_audit_logs'
};

// Default Sample Clubs
const DEFAULT_CLUBS = [
    {
        id: 'club-1',
        name: 'IEEE Student Branch',
        category: 'Technical',
        badge: 'Technical & Research',
        shortDesc: 'Advancing technology for humanity through workshops, hackathons, and research projects.',
        fullDesc: 'The IEEE Student Branch at our college is a vibrant community of passionate engineering students dedicated to fostering technical excellence, technological innovation, and academic research. We organize international paper presentations, hands-on workshops on emerging technologies, and coding competitions.',
        mission: 'To foster technological innovation and excellence for the benefit of humanity and empower engineering students with industry-grade practical exposure.',
        activities: [
            'Annual Tech-Summit & Paper Presentations',
            'IoT and Embedded Systems Bootcamps',
            'Guest lectures by IEEE Distinguished Speakers',
            'National Robotics & Signal Processing Challenges'
        ],
        president: 'Aryan Mathur (4th Year, CSE)',
        vicePresident: 'Sneha Patel (3rd Year, ECE)',
        facultyCoordinator: 'Dr. Priya Raman (Associate Professor, CSE)',
        contactEmail: 'ieee.branch@college.edu',
        contactPhone: '+91 98765 43210',
        color: '#2563eb',
        accentBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        icon: 'fa-microchip',
        memberCount: 142,
        foundedYear: 2018
    },
    {
        id: 'club-2',
        name: 'Coding Club',
        category: 'Technical',
        badge: 'Software & Algorithms',
        shortDesc: 'Competitive programming, open-source projects, and full-stack software development.',
        fullDesc: 'Coding Club is the official coding sanctuary for developers, algorithmic problem solvers, and software architects. Whether you are solving your first LeetCode problem or building decentralized systems, Coding Club provides the peer network, mentorship, and hackathons you need.',
        mission: 'To build a high-performance developer community that excels in competitive programming contests, open-source contributions, and engineering innovation.',
        activities: [
            'Weekly CodeForces and LeetCode Sprint contests',
            'Full Stack Web & Mobile App development tracks',
            'College Annual Hackathon (ByteSprint)',
            'Mentorship for Google Summer of Code (GSoC) & SIH'
        ],
        president: 'Rohan Deshmukh (4th Year, CSE)',
        vicePresident: 'Ananya Roy (3rd Year, IT)',
        facultyCoordinator: 'Prof. Rajesh Kulkarni (Assistant Professor, CSE)',
        contactEmail: 'codingclub@college.edu',
        contactPhone: '+91 98765 43211',
        color: '#059669',
        accentBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        icon: 'fa-code',
        memberCount: 235,
        foundedYear: 2017
    },
    {
        id: 'club-3',
        name: 'GDG / Developer Club',
        category: 'Technical',
        badge: 'Google Technologies',
        shortDesc: 'Exploring Cloud, Android, Flutter, and Machine Learning with Google Developer ecosystem.',
        fullDesc: 'Google Developer Group on Campus connects students with the latest technologies from Google. We bridge the gap between theoretical computer science and modern cloud and AI practices through community-led workshops, code labs, and developer study jams.',
        mission: 'To inspire and equip students to build real-world solutions for community challenges using Google modern development tools.',
        activities: [
            'Google Cloud & DevOps Study Jams',
            'TensorFlow & GenAI Hands-on series',
            'Flutter Android/iOS App Development Sprint',
            'Google Solution Challenge mentoring'
        ],
        president: 'Kavita Singh (3rd Year, CSE)',
        vicePresident: 'Aditya Verma (2nd Year, CSE-AIML)',
        facultyCoordinator: 'Dr. Neha Gupta (Professor, IT)',
        contactEmail: 'gdg.campus@college.edu',
        contactPhone: '+91 98765 43212',
        color: '#ea4335',
        accentBg: 'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)',
        icon: 'fa-brands fa-google',
        memberCount: 198,
        foundedYear: 2020
    },
    {
        id: 'club-4',
        name: 'Robotics Club',
        category: 'Technical',
        badge: 'Hardware & Automation',
        shortDesc: 'Designing autonomous robots, quadcopters, mechatronics, and embedded systems.',
        fullDesc: 'Robotics Club brings together electronics, mechanical, and computer engineering enthusiasts. We build combat robots, automated rovers, drones, and sensor-driven microcontrollers for collegiate robotics challenges and industrial automation showcases.',
        mission: 'To empower students to invent hardware solutions by mastering mechatronics, kinematics, automation, and embedded systems design.',
        activities: [
            'RoboWars combat robot building workshop',
            'Line follower & Maze solver autonomous robotics',
            'Drone flight control and ROS (Robot Operating System) sessions',
            'Annual Robofest Inter-college competition'
        ],
        president: 'Harsh Vardhan (4th Year, Mechatronics)',
        vicePresident: 'Tanvi Joshi (3rd Year, CSE)',
        facultyCoordinator: 'Dr. Suresh Nair (Professor, Mechanical Dept)',
        contactEmail: 'robotics@college.edu',
        contactPhone: '+91 98765 43213',
        color: '#d97706',
        accentBg: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
        icon: 'fa-robot',
        memberCount: 110,
        foundedYear: 2019
    },
    {
        id: 'club-5',
        name: 'Literary Club',
        category: 'Literary',
        badge: 'Debate & Creative Writing',
        shortDesc: 'Fostering eloquence, critical thought, parliamentary debates, and creative writing.',
        fullDesc: 'The Literary Club is the intellectual heart of campus dialogue. From parliamentary debate tournaments to poetry slams and college magazine publications, we provide a safe and inspiring platform for eloquence, storytelling, and thoughtful discourse.',
        mission: 'To cultivate articulate public speaking, critical reasoning, and evocative creative writing skills across the student body.',
        activities: [
            'National Youth Parliament & Model UN (MUN)',
            'Weekly Parliamentary Debates and Open Mic Slams',
            'Creative Writing Workshops and Annual Anthology',
            'Book Discussion Circles and Author Interviews'
        ],
        president: 'Ishaan Sen (3rd Year, Humanities/CSE)',
        vicePresident: 'Diya Menon (2nd Year, CSE)',
        facultyCoordinator: 'Dr. Meenakshi Sunder (Head, Humanities)',
        contactEmail: 'literary@college.edu',
        contactPhone: '+91 98765 43214',
        color: '#8b5cf6',
        accentBg: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
        icon: 'fa-feather-pointed',
        memberCount: 125,
        foundedYear: 2016
    },
    {
        id: 'club-6',
        name: 'Art & Design Club',
        category: 'Arts',
        badge: 'UI/UX & Fine Arts',
        shortDesc: 'Digital UI/UX, graphic design, illustration, visual storytelling, and traditional art.',
        fullDesc: 'Art & Design Club fuels the aesthetic dimension of our campus. We bridge the disciplines of fine art, digital graphic design, UI/UX prototyping, branding, and multimedia animation. We collaborate with all technical clubs to make their software visually stunning.',
        mission: 'To nurture visual creativity and train students in contemporary digital design tools like Figma, Blender, and the Adobe Suite.',
        activities: [
            'UI/UX Design Sprints and Figma masterclasses',
            'Digital Art & 3D Modeling with Blender',
            'Campus Murals and Fine Arts Exhibitions',
            'Branding design for college technical fests'
        ],
        president: 'Riya Sengupta (3rd Year, CSE)',
        vicePresident: 'Kartik Nair (2nd Year, IT)',
        facultyCoordinator: 'Prof. Sunita Rao (Dean Student Affairs)',
        contactEmail: 'design.club@college.edu',
        contactPhone: '+91 98765 43215',
        color: '#ec4899',
        accentBg: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
        icon: 'fa-palette',
        memberCount: 95,
        foundedYear: 2021
    },
    {
        id: 'club-7',
        name: 'Entrepreneurship Club',
        category: 'Entrepreneurship',
        badge: 'Startups & Business',
        shortDesc: 'Incubating startup ideas, venture pitching, funding guidance, and business strategies.',
        fullDesc: 'E-Club (Entrepreneurship Cell) converts bright collegiate engineering ideas into commercial ventures. Through mentorship with angel investors, pitch competitions, and startup weekends, we guide students through product-market fit, legal incorporation, and seed funding.',
        mission: 'To ignite the entrepreneurial spirit in engineering students and transform campus innovations into viable enterprise ventures.',
        activities: [
            'Annual E-Summit & Shark-Tank style Angel Pitching',
            'Business Model Canvas and MVP workshops',
            'Fireside chats with Alumni Startup Founders',
            'Seed Grant & Incubation Centre mentorship'
        ],
        president: 'Vikramaditya Rao (4th Year, CSE)',
        vicePresident: 'Simran Chadha (3rd Year, ECE)',
        facultyCoordinator: 'Dr. Alok Verma (Director, Incubation Centre)',
        contactEmail: 'eclub@college.edu',
        contactPhone: '+91 98765 43216',
        color: '#0ea5e9',
        accentBg: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
        icon: 'fa-chart-line',
        memberCount: 160,
        foundedYear: 2018
    },
    {
        id: 'club-8',
        name: 'Cultural Club',
        category: 'Cultural',
        badge: 'Music, Dance & Drama',
        shortDesc: 'Celebrating music, choreography, theatrical productions, and grand campus fests.',
        fullDesc: 'Cultural Club is the heartbeat of campus celebrations. Uniting talented vocalists, instrumentalists, classical and western dancers, and theatrical actors, we spearhead our annual cultural fest Tarang and represent the university at national cultural fests.',
        mission: 'To celebrate diversity, heritage, and artistic expression by staging unforgettable campus performances and nurturing performing artists.',
        activities: [
            'Annual College Cultural Fest (Tarang)',
            'Battle of the Bands and Acoustic Nights',
            'Stage Plays, Street Plays (Nukkad Natak), and Mime',
            'Inter-college Dance and Drama championships'
        ],
        president: 'Megha Kapoor (4th Year, CSE)',
        vicePresident: 'Varun Dhawan (3rd Year, Civil)',
        facultyCoordinator: 'Prof. Shalini Vashisth (Cultural Secretary)',
        contactEmail: 'cultural@college.edu',
        contactPhone: '+91 98765 43217',
        color: '#f97316',
        accentBg: 'linear-gradient(135deg, #c2410c 0%, #f97316 100%)',
        icon: 'fa-masks-theater',
        memberCount: 280,
        foundedYear: 2015
    }
];

// Default Sample Events
const DEFAULT_EVENTS = [
    {
        id: 'event-1',
        clubId: 'club-2',
        clubName: 'Coding Club',
        title: 'ByteSprint 2026: 24-Hour National Hackathon',
        date: '2026-10-25',
        time: '09:00 AM - 09:00 AM (Next Day)',
        venue: 'Main Auditorium & CS Labs 3 & 4',
        category: 'Technical',
        status: 'Completed',
        description: 'Compete in teams of 2 to 4 to build innovative real-world AI, Web3, or EdTech solutions. Prize pool worth INR 1,50,000 with industry internships for top winners.',
        registrationLink: '#register',
        maxSeats: 120,
        registeredCount: 84
    },
    {
        id: 'event-2',
        clubId: 'club-1',
        clubName: 'IEEE Student Branch',
        title: 'IEEE Emerging Tech & Research Symposium',
        date: '2026-10-30',
        time: '10:00 AM - 04:30 PM',
        venue: 'Seminar Hall B, Engineering Block',
        category: 'Technical',
        status: 'Completed',
        description: 'Explore the frontiers of Quantum Computing, Next-gen Semiconductors, and IEEE publication ethics with distinguished IEEE guest fellows.',
        registrationLink: '#register',
        maxSeats: 90,
        registeredCount: 62
    },
    {
        id: 'event-3',
        clubId: 'club-3',
        clubName: 'GDG / Developer Club',
        title: 'Google Cloud & GenAI Hands-on Workshop',
        date: '2026-11-25',
        time: '02:00 PM - 05:30 PM',
        venue: 'Lab 5, Silicon Block',
        category: 'Technical',
        status: 'Upcoming',
        description: 'Deploy containerized web services on Google Kubernetes Engine and build practical multimodal AI bots with Gemini APIs. Free Cloud credits provided.',
        registrationLink: '#register',
        maxSeats: 75,
        registeredCount: 58
    },
    {
        id: 'event-4',
        clubId: 'club-4',
        clubName: 'Robotics Club',
        title: 'Battle of Bots: Arena Combat Championship',
        date: '2026-12-05',
        time: '11:00 AM - 04:00 PM',
        venue: 'Open Amphitheatre Ground',
        category: 'Technical',
        status: 'Upcoming',
        description: 'Wired and wireless robot combat tournament featuring 15kg and 30kg custom combat robots. High-voltage engineering action and spectator excitement!',
        registrationLink: '#register',
        maxSeats: 200,
        registeredCount: 140
    },
    {
        id: 'event-5',
        clubId: 'club-5',
        clubName: 'Literary Club',
        title: 'National Parliamentary Debate: Vox Populi',
        date: '2026-12-12',
        time: '09:30 AM - 03:30 PM',
        venue: 'Conference Hall A',
        category: 'Literary',
        status: 'Upcoming',
        description: 'Asian Parliamentary debate tournament examining technology ethics, global economics, and public policy. Trophies and best speaker accolades.',
        registrationLink: '#register',
        maxSeats: 60,
        registeredCount: 42
    },
    {
        id: 'event-6',
        clubId: 'club-6',
        clubName: 'Art & Design Club',
        title: 'DesignSprint: UI/UX Prototyping Challenge',
        date: '2026-12-18',
        time: '10:30 AM - 02:30 PM',
        venue: 'Digital Media Studio 2',
        category: 'Arts',
        status: 'Upcoming',
        description: 'A 4-hour Figma design contest where participants solve a mobile usability problem and craft an end-to-end interactive user interface.',
        registrationLink: '#register',
        maxSeats: 50,
        registeredCount: 39
    },
    {
        id: 'event-7',
        clubId: 'club-7',
        clubName: 'Entrepreneurship Club',
        title: 'Campus Shark Tank: Seed Pitch 2026',
        date: '2026-12-22',
        time: '01:30 PM - 06:00 PM',
        venue: 'Executive Convention Centre',
        category: 'Entrepreneurship',
        status: 'Upcoming',
        description: 'Pitch your minimum viable product to seasoned venture capitalists and college alumni entrepreneurs for up to INR 2,00,000 prototype funding.',
        registrationLink: '#register',
        maxSeats: 80,
        registeredCount: 45
    },
    {
        id: 'event-8',
        clubId: 'club-8',
        clubName: 'Cultural Club',
        title: 'Tarang 2026: Inter-Departmental Acoustic Night',
        date: '2026-12-28',
        time: '05:30 PM - 09:30 PM',
        venue: 'College Central Lawn Stage',
        category: 'Cultural',
        status: 'Upcoming',
        description: 'An evening of live unplugged bands, classical soloists, beatboxing, and lyrical poetry under the stars. Free admission for all enrolled students.',
        registrationLink: '#register',
        maxSeats: 350,
        registeredCount: 290
    }
];

// Default Sample Announcements (from Faculty / Clubs / Dean)
const DEFAULT_ANNOUNCEMENTS = [
    {
        id: 'ann-0',
        title: 'Office of the Dean: Annual Club Governance Directives',
        message: 'All college clubs must submit semester budget reports and event audits to the Office of the Dean by month-end. Strict anti-ragging and safety protocols must be observed.',
        date: '2026-10-05',
        author: 'Prof. K. R. Sharma (Dean)',
        target: 'All Students & Faculty'
    },
    {
        id: 'ann-1',
        title: 'Welcome to Spring Semester 2026 Clubs Orientation!',
        message: 'All 1st-year B.Tech students are invited to the Central Clubs Orientation in the Main Auditorium on Friday. Discover active clubs, meet presidents, and register directly.',
        date: '2026-10-06',
        author: 'Dr. Priya Raman (Club Convener)',
        target: 'All Students'
    },
    {
        id: 'ann-2',
        title: 'ByteSprint 2026 Problem Statements Released',
        message: 'The track themes for ByteSprint 2026 (Smart Campus, FinTech, and AI for Social Good) are now live. Make sure your teams finalize registration before October 20.',
        date: '2026-10-07',
        author: 'Coding Club Faculty Mentor',
        target: 'Coding Club'
    },
    {
        id: 'ann-3',
        title: 'IEEE Student Branch Membership Drive 2026',
        message: 'Subsidized student membership vouchers are available for the first 50 registrations. Contact Sneha Patel at the IEEE desk.',
        date: '2026-10-08',
        author: 'IEEE Executive Committee',
        target: 'IEEE Members'
    }
];

// Default Sample Users (Students, Teachers, and Super Admin Dean)
const DEFAULT_USERS = [
    // SUPER ADMIN (DEAN)
    {
        id: 'usr-dean-1',
        email: 'dean@college.com',
        password: 'dean123',
        role: 'dean',
        name: 'Prof. K. R. Sharma',
        department: 'Office of the Dean, Academic Council',
        designation: 'Dean of Student Affairs & Academic Administration',
        avatarText: 'KS',
        cabin: 'Administrative Block, Suite 101',
        status: 'Active',
        createdAt: '2026-08-01',
        isSuperAdmin: true
    },
    // TEACHERS / FACULTY
    {
        id: 'usr-teach-1',
        email: 'teacher@college.com',
        password: 'teacher123',
        role: 'teacher',
        name: 'Dr. Priya Raman',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor & Student Clubs Convener',
        avatarText: 'PR',
        cabin: 'Tech Block 3, Room 402',
        status: 'Active',
        createdAt: '2026-08-10'
    },
    {
        id: 'usr-teach-2',
        email: 'rajesh.kulkarni@college.edu',
        password: 'teacher123',
        role: 'teacher',
        name: 'Prof. Rajesh Kulkarni',
        department: 'Computer Science & Engineering',
        designation: 'Assistant Professor & Coding Club Coordinator',
        avatarText: 'RK',
        cabin: 'Tech Block 3, Room 315',
        status: 'Active',
        createdAt: '2026-08-12'
    },
    {
        id: 'usr-teach-3',
        email: 'suresh.nair@college.edu',
        password: 'teacher123',
        role: 'teacher',
        name: 'Dr. Suresh Nair',
        department: 'Mechanical Engineering',
        designation: 'Professor & Robotics Club Mentor',
        avatarText: 'SN',
        cabin: 'Mechanical Block B, Room 204',
        status: 'Active',
        createdAt: '2026-08-15'
    },
    {
        id: 'usr-teach-4',
        email: 'neha.gupta@college.edu',
        password: 'teacher123',
        role: 'teacher',
        name: 'Dr. Neha Gupta',
        department: 'Information Technology',
        designation: 'Professor & GDG Campus Mentor',
        avatarText: 'NG',
        cabin: 'Silicon Block, Room 502',
        status: 'Active',
        createdAt: '2026-08-20'
    },
    // STUDENTS
    {
        id: 'usr-stud-1',
        email: 'student@college.com',
        password: 'student123',
        role: 'student',
        name: 'Aarav Sharma',
        branch: 'Computer Science & Engineering',
        year: '1st Year (2026)',
        rollNo: '26CSE042',
        avatarText: 'AS',
        joinedClubs: ['club-1', 'club-2'],
        status: 'Active',
        createdAt: '2026-09-01'
    },
    {
        id: 'usr-stud-2',
        email: 'pooja.verma@college.edu',
        password: 'student123',
        role: 'student',
        name: 'Pooja Verma',
        branch: 'Computer Science & Engineering',
        year: '1st Year (2026)',
        rollNo: '26CSE088',
        avatarText: 'PV',
        joinedClubs: ['club-4'],
        status: 'Active',
        createdAt: '2026-09-02'
    },
    {
        id: 'usr-stud-3',
        email: 'rohan.mehra@college.edu',
        password: 'student123',
        role: 'student',
        name: 'Rohan Mehra',
        branch: 'Information Technology',
        year: '2nd Year (2025)',
        rollNo: '25IT019',
        avatarText: 'RM',
        joinedClubs: ['club-5'],
        status: 'Active',
        createdAt: '2026-09-05'
    },
    {
        id: 'usr-stud-4',
        email: 'tanya.dixit@college.edu',
        password: 'student123',
        role: 'student',
        name: 'Tanya Dixit',
        branch: 'Electronics & Communication',
        year: '1st Year (2026)',
        rollNo: '26ECE031',
        avatarText: 'TD',
        joinedClubs: ['club-7'],
        status: 'Active',
        createdAt: '2026-09-06'
    },
    {
        id: 'usr-stud-5',
        email: 'sneha.patel@college.edu',
        password: 'student123',
        role: 'student',
        name: 'Sneha Patel',
        branch: 'Electronics & Communication',
        year: '3rd Year (2024)',
        rollNo: '24ECE012',
        avatarText: 'SP',
        joinedClubs: ['club-1'],
        status: 'Active',
        createdAt: '2026-09-07'
    },
    {
        id: 'usr-stud-6',
        email: 'aryan.mathur@college.edu',
        password: 'student123',
        role: 'student',
        name: 'Aryan Mathur',
        branch: 'Computer Science & Engineering',
        year: '4th Year (2023)',
        rollNo: '23CSE005',
        avatarText: 'AM',
        joinedClubs: ['club-1'],
        status: 'Active',
        createdAt: '2026-09-08'
    },
    {
        id: 'usr-stud-7',
        email: 'kavita.singh@college.edu',
        password: 'student123',
        role: 'student',
        name: 'Kavita Singh',
        branch: 'Computer Science & Engineering',
        year: '3rd Year (2024)',
        rollNo: '24CSE051',
        avatarText: 'KS',
        joinedClubs: ['club-3'],
        status: 'Suspended', // Demo suspended student
        createdAt: '2026-09-09',
        suspensionReason: 'Administrative review for code of conduct clarification.'
    }
];

// Default Sample Registrations for Student
const DEFAULT_REGISTRATIONS = [
    {
        id: 'reg-1',
        studentName: 'Aarav Sharma',
        studentEmail: 'student@college.com',
        rollNo: '26CSE042',
        branch: 'CSE',
        eventId: 'event-1',
        eventName: 'ByteSprint 2026: 24-Hour National Hackathon',
        clubName: 'Coding Club',
        registrationDate: '2026-10-06',
        status: 'Approved'
    },
    {
        id: 'reg-2',
        studentName: 'Aarav Sharma',
        studentEmail: 'student@college.com',
        rollNo: '26CSE042',
        branch: 'CSE',
        eventId: 'event-3',
        eventName: 'Google Cloud & GenAI Hands-on Workshop',
        clubName: 'GDG / Developer Club',
        registrationDate: '2026-10-07',
        status: 'Approved'
    },
    {
        id: 'reg-3',
        studentName: 'Pooja Verma',
        studentEmail: 'pooja.verma@college.edu',
        rollNo: '26CSE088',
        branch: 'CSE',
        eventId: 'event-4',
        eventName: 'Battle of Bots: Arena Combat Championship',
        clubName: 'Robotics Club',
        registrationDate: '2026-10-07',
        status: 'Pending'
    },
    {
        id: 'reg-4',
        studentName: 'Rohan Mehra',
        studentEmail: 'rohan.mehra@college.edu',
        rollNo: '25IT019',
        branch: 'IT',
        eventId: 'event-5',
        eventName: 'National Parliamentary Debate: Vox Populi',
        clubName: 'Literary Club',
        registrationDate: '2026-10-08',
        status: 'Approved'
    },
    {
        id: 'reg-5',
        studentName: 'Tanya Dixit',
        studentEmail: 'tanya.dixit@college.edu',
        rollNo: '26ECE031',
        branch: 'ECE',
        eventId: 'event-7',
        eventName: 'Campus Shark Tank: Seed Pitch 2026',
        clubName: 'Entrepreneurship Club',
        registrationDate: '2026-10-08',
        status: 'Pending'
    }
];

// Default Sample Audit Logs
const DEFAULT_AUDIT_LOGS = [
    {
        id: 'log-1',
        timestamp: '2026-10-05 10:15:30',
        action: 'SYSTEM_INIT',
        performedBy: 'Prof. K. R. Sharma (Dean)',
        targetUser: 'System',
        details: 'Initial administrative institutional setup & Dean authorization configured.'
    },
    {
        id: 'log-2',
        timestamp: '2026-10-06 14:22:10',
        action: 'FACULTY_VERIFICATION',
        performedBy: 'Prof. K. R. Sharma (Dean)',
        targetUser: 'Dr. Priya Raman (teacher@college.com)',
        details: 'Verified and appointed Dr. Priya Raman as Student Clubs Convener.'
    },
    {
        id: 'log-3',
        timestamp: '2026-10-07 11:05:44',
        action: 'ACCOUNT_SUSPENDED',
        performedBy: 'Prof. K. R. Sharma (Dean)',
        targetUser: 'Kavita Singh (kavita.singh@college.edu)',
        details: 'Account temporarily suspended pending code of conduct clarification.'
    }
];

// Initialize Data if not already in LocalStorage or if Dean account missing
function initDatabase() {
    if (!localStorage.getItem(STORAGE_KEYS.CLUBS)) {
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(DEFAULT_CLUBS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_REGISTRATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));
    }

    // Ensure USERS exists and includes the Dean account
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!storedUsers) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    } else {
        try {
            const users = JSON.parse(storedUsers);
            const hasDean = users.some(u => u.role === 'dean' || u.email === 'dean@college.com');
            if (!hasDean) {
                const deanUser = DEFAULT_USERS.find(u => u.role === 'dean');
                if (deanUser) {
                    users.unshift(deanUser);
                    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
                }
            }
            // Ensure status property exists on all users
            let updated = false;
            users.forEach(u => {
                if (!u.status) {
                    u.status = 'Active';
                    updated = true;
                }
            });
            if (updated) {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            }
        } catch (e) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
    }
}

// Data Access Methods
const db = {
    // Reset all data to fresh demo state
    resetDemoData: function() {
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(DEFAULT_CLUBS));
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_REGISTRATIONS));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));

        const session = this.getSession();
        if (session) {
            const freshUser = DEFAULT_USERS.find(u => u.email === session.email);
            if (freshUser) {
                this.setSession(freshUser);
            }
        }
    },

    // Session Management
    getSession: function() {
        const data = localStorage.getItem(STORAGE_KEYS.SESSION);
        return data ? JSON.parse(data) : null;
    },
    setSession: function(user) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    },
    clearSession: function() {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    },

    // Users
    getUsers: function() {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : DEFAULT_USERS;
    },
    saveUsers: function(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },
    getUserByEmail: function(email) {
        if (!email) return null;
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    updateUser: function(updatedUser) {
        let users = this.getUsers();
        users = users.map(u => u.email.toLowerCase() === updatedUser.email.toLowerCase() ? { ...u, ...updatedUser } : u);
        this.saveUsers(users);
        const session = this.getSession();
        if (session && session.email.toLowerCase() === updatedUser.email.toLowerCase()) {
            this.setSession({ ...session, ...updatedUser });
        }
    },

    // DEAN USER MANAGEMENT METHODS
    updateUserStatusByDean: function(email, newStatus, reason = '') {
        const user = this.getUserByEmail(email);
        if (!user) return { success: false, message: 'User not found.' };

        // Safeguard: Cannot deactivate or suspend the Super Admin Dean
        if (user.role === 'dean' || user.isSuperAdmin) {
            return { success: false, message: 'Safeguard Violation: The Dean Super Admin account cannot be deactivated or suspended.' };
        }

        user.status = newStatus;
        if (newStatus === 'Suspended' && reason) {
            user.suspensionReason = reason;
        } else if (newStatus === 'Active') {
            delete user.suspensionReason;
        }

        this.updateUser(user);

        // Add audit log
        this.addAuditLog(
            `ACCOUNT_${newStatus.toUpperCase()}`,
            `${user.name} (${user.email})`,
            `Status changed to ${newStatus}${reason ? '. Reason: ' + reason : ''}`
        );

        return { success: true, user: user };
    },

    resetUserPasswordByDean: function(email, newPassword) {
        const user = this.getUserByEmail(email);
        if (!user) return { success: false, message: 'User not found.' };

        user.password = newPassword;
        this.updateUser(user);

        this.addAuditLog(
            'PASSWORD_RESET',
            `${user.name} (${user.email})`,
            'Administrative password reset executed by Dean.'
        );

        return { success: true };
    },

    updateUserProfileByDean: function(email, formData) {
        const user = this.getUserByEmail(email);
        if (!user) return { success: false, message: 'User not found.' };

        // Safeguard: Role changes
        if (formData.role && formData.role !== user.role) {
            // Cannot demote Dean
            if (user.role === 'dean' && formData.role !== 'dean') {
                return { success: false, message: 'Safeguard Violation: Cannot demote the Dean account.' };
            }
            // Cannot promote to Dean without system level access
            if (formData.role === 'dean' && user.role !== 'dean') {
                return { success: false, message: 'Safeguard Violation: Secondary users cannot be granted Dean privileges.' };
            }
        }

        const changes = [];
        if (formData.name && formData.name !== user.name) changes.push(`Name: ${user.name} -> ${formData.name}`);
        if (formData.role && formData.role !== user.role) changes.push(`Role: ${user.role} -> ${formData.role}`);
        if (formData.status && formData.status !== user.status) changes.push(`Status: ${user.status} -> ${formData.status}`);

        user.name = formData.name || user.name;
        user.department = formData.department || user.department;
        user.branch = formData.branch || user.branch;
        user.year = formData.year || user.year;
        user.designation = formData.designation || user.designation;
        user.rollNo = formData.rollNo || user.rollNo;
        user.cabin = formData.cabin || user.cabin;
        if (formData.status && user.role !== 'dean') {
            user.status = formData.status;
        }
        if (formData.role && user.role !== 'dean') {
            user.role = formData.role;
        }

        this.updateUser(user);

        if (changes.length > 0) {
            this.addAuditLog(
                'PROFILE_UPDATED',
                `${user.name} (${user.email})`,
                `Administrative updates: ${changes.join(', ')}`
            );
        }

        return { success: true, user: user };
    },

    // Audit Logs
    getAuditLogs: function() {
        const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
        return data ? JSON.parse(data) : DEFAULT_AUDIT_LOGS;
    },
    saveAuditLogs: function(logs) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    },
    addAuditLog: function(action, targetUser, details) {
        const logs = this.getAuditLogs();
        const session = this.getSession();
        const performedBy = session ? `${session.name} (${session.role === 'dean' ? 'Dean' : session.role})` : 'System Administrator';

        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

        const newLog = {
            id: 'log-' + Date.now(),
            timestamp: timestamp,
            action: action,
            performedBy: performedBy,
            targetUser: targetUser || 'System',
            details: details || ''
        };

        logs.unshift(newLog);
        this.saveAuditLogs(logs);
        return newLog;
    },

    // Clubs
    getClubs: function() {
        const data = localStorage.getItem(STORAGE_KEYS.CLUBS);
        return data ? JSON.parse(data) : DEFAULT_CLUBS;
    },
    saveClubs: function(clubs) {
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
    },
    getClubById: function(id) {
        const clubs = this.getClubs();
        return clubs.find(c => c.id === id);
    },
    addClub: function(club) {
        const clubs = this.getClubs();
        club.id = 'club-' + Date.now();
        club.memberCount = 1;
        club.foundedYear = new Date().getFullYear();
        clubs.unshift(club);
        this.saveClubs(clubs);
        return club;
    },
    updateClub: function(clubId, updatedData) {
        let clubs = this.getClubs();
        clubs = clubs.map(c => c.id === clubId ? { ...c, ...updatedData } : c);
        this.saveClubs(clubs);
    },
    deleteClub: function(clubId) {
        let clubs = this.getClubs();
        clubs = clubs.filter(c => c.id !== clubId);
        this.saveClubs(clubs);
    },

    // Student Club Membership
    getStudentJoinedClubIds: function(studentEmail) {
        const user = this.getUserByEmail(studentEmail);
        return user && user.joinedClubs ? user.joinedClubs : [];
    },
    isStudentMember: function(studentEmail, clubId) {
        const joined = this.getStudentJoinedClubIds(studentEmail);
        return joined.includes(clubId);
    },
    joinClub: function(studentEmail, clubId) {
        const user = this.getUserByEmail(studentEmail);
        if (!user) return false;
        if (!user.joinedClubs) user.joinedClubs = [];
        if (!user.joinedClubs.includes(clubId)) {
            user.joinedClubs.push(clubId);
            this.updateUser(user);

            const club = this.getClubById(clubId);
            if (club) {
                club.memberCount = (club.memberCount || 0) + 1;
                this.updateClub(clubId, club);
            }
            return true;
        }
        return false;
    },
    leaveClub: function(studentEmail, clubId) {
        const user = this.getUserByEmail(studentEmail);
        if (!user || !user.joinedClubs) return false;
        if (user.joinedClubs.includes(clubId)) {
            user.joinedClubs = user.joinedClubs.filter(id => id !== clubId);
            this.updateUser(user);

            const club = this.getClubById(clubId);
            if (club && club.memberCount > 0) {
                club.memberCount = club.memberCount - 1;
                this.updateClub(clubId, club);
            }
            return true;
        }
        return false;
    },

    // Events
    getEvents: function() {
        const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
        return data ? JSON.parse(data) : DEFAULT_EVENTS;
    },
    saveEvents: function(events) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    },
    getEventById: function(id) {
        const events = this.getEvents();
        return events.find(e => e.id === id);
    },
    addEvent: function(event) {
        const events = this.getEvents();
        event.id = 'event-' + Date.now();
        event.registeredCount = 0;
        if (!event.status) event.status = 'Upcoming';
        events.unshift(event);
        this.saveEvents(events);
        return event;
    },
    updateEvent: function(eventId, updatedData) {
        let events = this.getEvents();
        events = events.map(e => e.id === eventId ? { ...e, ...updatedData } : e);
        this.saveEvents(events);
    },
    deleteEvent: function(eventId) {
        let events = this.getEvents();
        events = events.filter(e => e.id !== eventId);
        this.saveEvents(events);
    },

    // Registrations
    getRegistrations: function() {
        const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
        return data ? JSON.parse(data) : DEFAULT_REGISTRATIONS;
    },
    saveRegistrations: function(regs) {
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
    },
    getRegistrationsForStudent: function(studentEmail) {
        const regs = this.getRegistrations();
        return regs.filter(r => r.studentEmail.toLowerCase() === studentEmail.toLowerCase());
    },
    isStudentRegisteredForEvent: function(studentEmail, eventId) {
        const regs = this.getRegistrationsForStudent(studentEmail);
        return regs.some(r => r.eventId === eventId);
    },
    registerStudentForEvent: function(student, eventId) {
        if (this.isStudentRegisteredForEvent(student.email, eventId)) {
            return { success: false, message: 'You have already registered for this event!' };
        }
        const event = this.getEventById(eventId);
        if (!event) {
            return { success: false, message: 'Event not found.' };
        }
        const regs = this.getRegistrations();
        const newReg = {
            id: 'reg-' + Date.now(),
            studentName: student.name || 'Student',
            studentEmail: student.email,
            rollNo: student.rollNo || 'N/A',
            branch: student.branch || 'CSE',
            eventId: event.id,
            eventName: event.title,
            clubName: event.clubName,
            registrationDate: new Date().toISOString().split('T')[0],
            status: 'Approved'
        };
        regs.unshift(newReg);
        this.saveRegistrations(regs);

        event.registeredCount = (event.registeredCount || 0) + 1;
        this.updateEvent(event.id, event);

        return { success: true, registration: newReg };
    },
    cancelRegistration: function(regId) {
        let regs = this.getRegistrations();
        const reg = regs.find(r => r.id === regId);
        if (reg) {
            const event = this.getEventById(reg.eventId);
            if (event && event.registeredCount > 0) {
                event.registeredCount = event.registeredCount - 1;
                this.updateEvent(event.id, event);
            }
        }
        regs = regs.filter(r => r.id !== regId);
        this.saveRegistrations(regs);
        return true;
    },
    updateRegistrationStatus: function(regId, newStatus) {
        let regs = this.getRegistrations();
        regs = regs.map(r => r.id === regId ? { ...r, status: newStatus } : r);
        this.saveRegistrations(regs);
    },

    // Announcements
    getAnnouncements: function() {
        const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
        return data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
    },
    saveAnnouncements: function(announcements) {
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    },
    addAnnouncement: function(ann) {
        const announcements = this.getAnnouncements();
        ann.id = 'ann-' + Date.now();
        ann.date = new Date().toISOString().split('T')[0];
        announcements.unshift(ann);
        this.saveAnnouncements(announcements);
        return ann;
    },
    deleteAnnouncement: function(annId) {
        let announcements = this.getAnnouncements();
        announcements = announcements.filter(a => a.id !== annId);
        this.saveAnnouncements(announcements);
    }
};

// Automatically execute database initialization on script load
initDatabase();
