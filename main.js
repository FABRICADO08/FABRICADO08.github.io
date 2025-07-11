document.addEventListener('DOMContentLoaded', () => {

    // --- PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ---
    const firebaseConfig = {
        apiKey: "AIza...",
        authDomain: "your-project-id.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project-id.appspot.com",
        messagingSenderId: "...",
        appId: "1:..."
    };

    // --- INITIALIZE FIREBASE ---
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- PAGE ELEMENTS ---
    const loginPage = document.getElementById('login-page');
    const studentDashboardPage = document.getElementById('student-dashboard-page');
    const teacherDashboardPage = document.getElementById('teacher-dashboard-page');

    // --- VIEW SWITCHING LOGIC ---
    function showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        const pageToShow = document.getElementById(page + '-page');
        if (pageToShow) {
            pageToShow.style.display = (page === 'login') ? 'flex' : 'block';
        }
    }

    // --- AUTHENTICATION LISTENER ---
    auth.onAuthStateChanged(async user => {
        if (user) {
            // User is signed in. Check their role from Firestore.
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            
            if (userData.role === 'teacher') {
                setupTeacherDashboard(user);
                showPage('teacher-dashboard');
            } else {
                setupStudentDashboard(user);
                showPage('student-dashboard');
            }
        } else {
            // User is signed out
            showPage('login');
        }
    });

    // --- LOGIN/LOGOUT BUTTONS ---
    document.getElementById('google-login-btn').addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(handleAuthError);
    });

    document.getElementById('microsoft-login-btn').addEventListener('click', () => {
        const provider = new firebase.auth.OAuthProvider('microsoft.com');
        auth.signInWithPopup(provider).catch(handleAuthError);
    });
    
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', () => auth.signOut());
    });

    function handleAuthError(error) {
        const errorElement = document.getElementById('login-error');
        errorElement.textContent = `Login Error: ${error.message}`;
        errorElement.style.display = 'block';
    }
    
    // --- STUDENT DASHBOARD RENDERING ---
    function setupStudentDashboard(user) {
        document.getElementById('student-welcome-name').textContent = `Welcome back, ${user.displayName.split(' ')[0]}!`;
        const studentAvatar = document.getElementById('student-avatar');
        studentAvatar.innerHTML = user.photoURL ? `<img src="${user.photoURL}" alt="Avatar">` : user.displayName.charAt(0);
        
        // Render the main content for the student
        renderStudentContent(user);
    }

    async function renderStudentContent(user) {
        const mainContent = studentDashboardPage.querySelector('main');
        mainContent.innerHTML = `<p>Loading dashboard...</p>`;

        // Fetch all slots and bookings
        const slotsSnapshot = await db.collection('slots').where('status', '==', 'open').get();
        const bookingsSnapshot = await db.collection('bookings').get();
        const allBookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const myBookings = allBookings.filter(b => b.userId === user.uid);
        const upcomingSessions = myBookings.filter(b => b.status === 'confirmed');
        const pendingRequests = myBookings.filter(b => b.status === 'pending');

        let availableSlotsHtml = '';
        if (slotsSnapshot.empty) {
            availableSlotsHtml = '<p>No mentorship slots are currently available.</p>';
        } else {
            slotsSnapshot.forEach(doc => {
                const slot = { id: doc.id, ...doc.data() };
                const bookingsForSlot = allBookings.filter(b => b.slotId === slot.id && b.status === 'confirmed').length;
                const isFull = bookingsForSlot >= slot.capacity;
                const hasRequested = myBookings.some(b => b.slotId === slot.id);

                let actionHtml = '';
                if (isFull) {
                    actionHtml = `<a href="#" class="action-btn-disabled">Full</a>`;
                } else if (hasRequested) {
                    actionHtml = `<a href="#" class="action-btn-disabled">Requested</a>`;
                } else {
                    actionHtml = `<a href="#" onclick="app.requestSlot('${slot.id}')" class="action-btn">Request Slot</a>`;
                }

                availableSlotsHtml += `
                    <tr>
                        <td><div class="teacher-cell">...</div></td>
                        <td>${slot.subject}</td>
                        <td>${slot.date} <br> ${slot.time}</td>
                        <td>1 hour</td>
                        <td><span class="status-badge status-available">${bookingsForSlot}/${slot.capacity}</span></td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
            });
        }

        mainContent.innerHTML = `
            <div class="welcome-header"><h1 id="student-welcome-name">Welcome back, ${user.displayName.split(' ')[0]}!</h1><p>Find and request mentorship slots from your teachers.</p></div>
            <section class="stats-grid">
                <div class="stat-card"><div class="stat-card-info"><h3>${upcomingSessions.length}</h3><p>Upcoming Sessions</p></div><div class="stat-card-icon icon-blue">...</div></div>
                <div class="stat-card"><div class="stat-card-info"><h3>${pendingRequests.length}</h3><p>Pending Requests</p></div><div class="stat-card-icon icon-yellow">...</div></div>
                <div class="stat-card"><div class="stat-card-info"><h3>0</h3><p>Completed</p></div><div class="stat-card-icon icon-green">...</div></div>
            </section>
            <section class="available-slots-section">
                <div class="section-header"><h2>Available Mentorship Slots</h2></div>
                <div class="table-wrapper"><table>
                    <thead><tr><th>Teacher</th><th>Subject</th><th>Date & Time</th><th>Duration</th><th>Availability</th><th>Action</th></tr></thead>
                    <tbody>${availableSlotsHtml}</tbody>
                </table></div>
            </section>
        `;
    }

    // --- TEACHER DASHBOARD RENDERING ---
    function setupTeacherDashboard(user) {
        document.getElementById('teacher-welcome-name').textContent = `Welcome, ${user.displayName}!`;
        const teacherAvatar = document.getElementById('teacher-avatar');
        teacherAvatar.innerHTML = user.photoURL ? `<img src="${user.photoURL}" alt="Avatar">` : user.displayName.split(' ').map(n => n[0]).join('');
        
        // Render the main content for the teacher
        renderTeacherContent(user);
    }
    
    async function renderTeacherContent(user) {
        const mainContent = teacherDashboardPage.querySelector('main');
        mainContent.innerHTML = `<p>Loading dashboard...</p>`;
        
        const bookingsSnapshot = await db.collection('bookings').where('status', '==', 'pending').get();
        const pendingRequests = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let requestsHtml = '<p>No pending requests.</p>';
        if (pendingRequests.length > 0) {
            requestsHtml = pendingRequests.map(req => `
                <div class="request-card">
                    <div class="request-header"><div class="student-info"><div class="student-avatar">${req.userName.charAt(0)}</div><div class="student-name"><span>${req.userName}</span><span>Student</span></div></div><span class="status-badge status-pending">Pending</span></div>
                    <p>Wants to book a slot for a subject.</p>
                    <div class="request-actions">
                        <button onclick="app.updateBookingStatus('${req.id}', 'confirmed')" class="btn-approve">Approve</button> 
                        <button onclick="app.updateBookingStatus('${req.id}', 'declined')" class="btn-decline">Decline</button>
                    </div>
                </div>
            `).join('');
        }

        mainContent.innerHTML = `
            <div class="welcome-header"><h1 id="teacher-welcome-name">Welcome, ${user.displayName}!</h1><p>Manage your mentorship slots and student requests.</p></div>
            <section class="stats-grid">
                <!-- Stats would be calculated here -->
            </section>
            <section class="dashboard-grid">
                <div class="main-column">
                    <div class="card">
                        <h3>Pending Requests</h3>
                        ${requestsHtml}
                    </div>
                </div>
                <div class="sidebar-column">
                    <div class="card">
                        <h3>Today's Schedule</h3>
                        <!-- Schedule would be rendered here -->
                    </div>
                </div>
            </section>
        `;
    }

    // --- GLOBAL APP FUNCTIONS FOR ONCLICK ---
    window.app = {
        requestSlot: async (slotId) => {
            if (!auth.currentUser) return alert('You must be logged in.');
            const user = auth.currentUser;
            await db.collection('bookings').add({
                userId: user.uid,
                userName: user.displayName,
                slotId: slotId,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Request sent!');
            renderStudentContent(user); // Refresh the dashboard
        },
        updateBookingStatus: async (bookingId, newStatus) => {
             if (!auth.currentUser) return alert('You must be logged in.');
            await db.collection('bookings').doc(bookingId).update({ status: newStatus });
            alert(`Booking ${newStatus}!`);
            renderTeacherContent(auth.currentUser); // Refresh the dashboard
        }
    };
});