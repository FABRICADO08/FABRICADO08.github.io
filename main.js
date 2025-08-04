/*document.addEventListener('DOMContentLoaded', () => {

    // --- PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ---
    const firebaseConfig = {
  apiKey: "AIzaSyCgc8xXVs1_DNhKMoUx0kiZnzoL8nIsStM",
  authDomain: "mentorship-5ce42.firebaseapp.com",
  projectId: "mentorship-5ce42",
  storageBucket: "mentorship-5ce42.firebasestorage.app",
  messagingSenderId: "764728773969",
  appId: "1:764728773969:web:1ade331d0ce736efe19770",
  measurementId: "G-PDKKVLP6L6"
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
});*/



document.addEventListener('DOMContentLoaded', () => {

    // --- PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ---
    const firebaseConfig = {
        apiKey: "AIzaSyCgc8xXVs1_DNhKMoUx0kiZnzoL8nIsStM",
        authDomain: "mentorship-5ce42.firebaseapp.com",
        projectId: "mentorship-5ce42",
        storageBucket: "mentorship-5ce42.firebase-app.com",
        messagingSenderId: "764728773969",
        appId: "1:764728773969:web:1ade331d0ce736efe19770",
        measurementId: "G-PDKKVLP6L6"
    };

    // --- INITIALIZE FIREBASE ---
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- PAGE ELEMENTS ---
    const loginPage = document.getElementById('login-page');
    const studentDashboardPage = document.getElementById('student-dashboard-page');
    const teacherDashboardPage = document.getElementById('teacher-dashboard-page');
    const loginErrorElement = document.getElementById('login-error');

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
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();

            let userData;
            if (!userDoc.exists) {
                // New user signing in for the first time
                userData = {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    role: 'student', // Default role for new users
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await userDocRef.set(userData);
            } else {
                userData = userDoc.data();
            }

            if (userData.role === 'teacher') {
                setupTeacherDashboard(user);
                showPage('teacher-dashboard');
            } else { // student or any other role
                setupStudentDashboard(user);
                showPage('student-dashboard');
            }
            loginErrorElement.style.display = 'none'; // Hide error on successful login
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
        btn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User signed out successfully.");
            }).catch((error) => {
                console.error("Error signing out: ", error);
            });
        });
    });

    function handleAuthError(error) {
        console.error("Authentication Error:", error);
        loginErrorElement.textContent = `Login Error: ${error.message}`;
        loginErrorElement.style.display = 'block';
    }

    // Helper to format date and time
    function formatDateTime(dateString, timeString) {
        const date = new Date(`${dateString}T${timeString}:00`);
        if (isNaN(date)) return 'Invalid Date/Time';
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options);
    }

    // --- STUDENT DASHBOARD RENDERING ---
    async function setupStudentDashboard(user) {
        document.getElementById('student-welcome-name').textContent = `Welcome back, ${user.displayName.split(' ')[0]}!`;
        const studentAvatar = document.getElementById('student-avatar');
        studentAvatar.innerHTML = user.photoURL ? `<img src="${user.photoURL}" alt="Avatar">` : user.displayName.charAt(0);

        await renderStudentContent(user);
    }

    async function renderStudentContent(user) {
        const mainContent = studentDashboardPage.querySelector('main');
        mainContent.innerHTML = `<p>Loading dashboard...</p>`;

        // Fetch user's bookings and all open slots
        const myBookingsSnapshot = await db.collection('bookings').where('userId', '==', user.uid).get();
        const myBookings = myBookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const slotsSnapshot = await db.collection('slots').where('status', '==', 'open').get();
        const allOpenSlots = slotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get confirmed bookings for all slots to calculate availability
        const allConfirmedBookingsSnapshot = await db.collection('bookings').where('status', '==', 'confirmed').get();
        const allConfirmedBookings = allConfirmedBookingsSnapshot.docs.map(doc => doc.data());

        const upcomingSessions = myBookings.filter(b => b.status === 'confirmed');
        const pendingRequests = myBookings.filter(b => b.status === 'pending');

        let availableSlotsHtml = '';
        if (allOpenSlots.length === 0) {
            availableSlotsHtml = '<tr><td colspan="6">No mentorship slots are currently available.</td></tr>';
        } else {
            for (const slot of allOpenSlots) {
                // Fetch teacher name (can be optimized with a single lookup if needed)
                const teacherDoc = await db.collection('users').doc(slot.teacherId).get();
                const teacherName = teacherDoc.exists ? teacherDoc.data().displayName : 'N/A';

                const bookingsForSlot = allConfirmedBookings.filter(b => b.slotId === slot.id).length;
                const isFull = bookingsForSlot >= slot.capacity;
                const hasRequested = myBookings.some(b => b.slotId === slot.id);
                const hasConfirmed = myBookings.some(b => b.slotId === slot.id && b.status === 'confirmed');

                let actionHtml = '';
                if (isFull) {
                    actionHtml = `<span class="action-btn-disabled">Full</span>`;
                } else if (hasConfirmed) {
                    actionHtml = `<span class="action-btn-disabled">Confirmed</span>`;
                } else if (hasRequested) {
                    actionHtml = `<span class="action-btn-disabled">Requested</span>`;
                } else {
                    actionHtml = `<button onclick="app.requestSlot('${slot.id}', '${slot.subjectName}', '${teacherName}')" class="action-btn">Request Slot</button>`;
                }

                availableSlotsHtml += `
                    <tr>
                        <td>${teacherName}</td>
                        <td>${slot.subjectName}</td>
                        <td>${formatDateTime(slot.date, slot.time)}</td>
                        <td>${slot.durationMinutes} minutes</td>
                        <td><span class="status-badge status-available">${bookingsForSlot}/${slot.capacity}</span></td>
                        <td>${actionHtml}</td>
                    </tr>
                `;
            }
        }

        // Fetch testimonials written by the user
        const myTestimonialsSnapshot = await db.collection('testimonials').where('userId', '==', user.uid).get();
        const myTestimonials = myTestimonialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let myTestimonialsHtml = '';
        if (myTestimonials.length === 0) {
            myTestimonialsHtml = '<p>You haven\'t written any testimonials yet.</p>';
        } else {
            myTestimonialsHtml = myTestimonials.map(t => `
                <div class="testimonial-item">
                    <p>"${t.testimonialText}"</p>
                    <small>Status: ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</small>
                </div>
            `).join('');
        }


        mainContent.innerHTML = `
            <div class="welcome-header"><h1 id="student-welcome-name">Welcome back, ${user.displayName.split(' ')[0]}!</h1><p>Find and request mentorship slots from your teachers.</p></div>
            <section class="stats-grid">
                <div class="stat-card"><div class="stat-card-info"><h3>${upcomingSessions.length}</h3><p>Upcoming Sessions</p></div><div class="stat-card-icon icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M21 7H3M4 12h.01M9 12h.01M14 12h.01M19 12h.01M6 16h.01M11 16h.01M16 16h.01M8 20h.01M13 20h.01M18 20h.01M4 4h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                </div></div>
                <div class="stat-card"><div class="stat-card-info"><h3>${pendingRequests.length}</h3><p>Pending Requests</p></div><div class="stat-card-icon icon-yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </div></div>
                <div class="stat-card"><div class="stat-card-info"><h3>${myBookings.filter(b => b.status === 'completed').length}</h3><p>Completed</p></div><div class="stat-card-icon icon-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div></div>
            </section>
            <section class="available-slots-section">
                <div class="section-header"><h2>Available Mentorship Slots</h2></div>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Teacher</th><th>Subject</th><th>Date & Time</th><th>Duration</th><th>Availability</th><th>Action</th></tr></thead>
                        <tbody>${availableSlotsHtml}</tbody>
                    </table>
                </div>
            </section>
            <section class="testimonial-section card" style="margin-top: 32px; padding: 24px;">
                <div class="section-header" style="margin-bottom: 20px;"><h2>Write a Testimonial</h2></div>
                <textarea id="testimonial-text" placeholder="Share your mentorship experience..." rows="4" class="form-control" style="margin-bottom: 15px;"></textarea>
                <button onclick="app.submitTestimonial()" class="btn-primary" style="width: auto;">Submit Testimonial</button>
                <div class="section-header" style="margin-top: 30px; margin-bottom: 20px;"><h2>My Testimonials</h2></div>
                <div id="my-testimonials-list">${myTestimonialsHtml}</div>
            </section>
        `;
    }

    // --- TEACHER DASHBOARD RENDERING ---
    async function setupTeacherDashboard(user) {
        document.getElementById('teacher-welcome-name').textContent = `Welcome, ${user.displayName}!`;
        const teacherAvatar = document.getElementById('teacher-avatar');
        teacherAvatar.innerHTML = user.photoURL ? `<img src="${user.photoURL}" alt="Avatar">` : user.displayName.split(' ').map(n => n[0]).join('');

        await renderTeacherContent(user);
    }

    async function renderTeacherContent(user) {
        const mainContent = teacherDashboardPage.querySelector('main');
        mainContent.innerHTML = `<p>Loading dashboard...</p>`;

        // Fetch bookings for slots created by this teacher
        const mySlotsSnapshot = await db.collection('slots').where('teacherId', '==', user.uid).get();
        const mySlots = mySlotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const mySlotIds = mySlots.map(s => s.id);

        let pendingRequests = [];
        if (mySlotIds.length > 0) {
            const pendingBookingsSnapshot = await db.collection('bookings')
                .where('slotId', 'in', mySlotIds)
                .where('status', '==', 'pending')
                .get();
            pendingRequests = pendingBookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        let requestsHtml = '';
        if (pendingRequests.length === 0) {
            requestsHtml = '<p>No pending requests.</p>';
        } else {
            requestsHtml = pendingRequests.map(req => `
                <div class="request-card" style="margin-bottom: 15px; border: 1px solid var(--border-color); padding: 15px; border-radius: var(--border-radius);">
                    <div class="request-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="student-info" style="display: flex; align-items: center; gap: 10px;">
                            <div class="student-avatar" style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--light-purple); color: var(--purple); display: flex; align-items: center; justify-content: center; font-weight: 600;">${req.userName.charAt(0)}</div>
                            <div class="student-name">
                                <span style="font-weight: 600;">${req.userName}</span>
                                <span style="font-size: 13px; color: var(--text-light);">Student</span>
                            </div>
                        </div>
                        <span class="status-badge status-pending" style="background-color: var(--light-yellow); color: var(--warning); padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">Pending</span>
                    </div>
                    <p style="margin-top: 0; margin-bottom: 15px;">
                        Requested to book a slot for <strong>${req.subjectName}</strong> on 
                        <strong>${formatDateTime(req.slotDate, req.slotTime)}</strong>.
                    </p>
                    <div class="request-actions" style="display: flex; gap: 10px;">
                        <button onclick="app.updateBookingStatus('${req.id}', 'confirmed', '${user.uid}')" class="btn-approve" style="padding: 8px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; background-color: var(--success); color: white;">Approve</button>
                        <button onclick="app.updateBookingStatus('${req.id}', 'declined', '${user.uid}')" class="btn-decline" style="padding: 8px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; background-color: var(--danger); color: white;">Decline</button>
                    </div>
                </div>
            `).join('');
        }

        // Fetch subjects created by this teacher
        const mySubjectsSnapshot = await db.collection('subjects').where('teacherId', '==', user.uid).get();
        const mySubjects = mySubjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let subjectsOptionsHtml = '<option value="">Select Subject</option>';
        if (mySubjects.length > 0) {
            subjectsOptionsHtml += mySubjects.map(sub => `<option value="${sub.id}">${sub.name} (R${sub.pricePerDuration}/min)</option>`).join('');
        }

        // Fetch all slots created by this teacher
        let mySlotsHtml = '';
        if (mySlots.length === 0) {
            mySlotsHtml = '<tr><td colspan="6">You have not created any mentorship slots yet.</td></tr>';
        } else {
            for (const slot of mySlots) {
                const confirmedBookingsForSlotSnapshot = await db.collection('bookings')
                    .where('slotId', '==', slot.id)
                    .where('status', '==', 'confirmed')
                    .get();
                const confirmedBookingsCount = confirmedBookingsForSlotSnapshot.size;

                mySlotsHtml += `
                    <tr>
                        <td>${slot.subjectName}</td>
                        <td>${formatDateTime(slot.date, slot.time)}</td>
                        <td>${slot.durationMinutes} mins</td>
                        <td>R${slot.price}</td>
                        <td>${confirmedBookingsCount}/${slot.capacity}</td>
                        <td>
                            <button onclick="app.cancelSlot('${slot.id}', '${user.uid}')" class="btn-decline" style="background-color: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Cancel</button>
                        </td>
                    </tr>
                `;
            }
        }

        // Fetch all testimonials for Admin review
        const allTestimonialsSnapshot = await db.collection('testimonials').get();
        const allTestimonials = allTestimonialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let testimonialsForReviewHtml = '';
        if (allTestimonials.length === 0) {
            testimonialsForReviewHtml = '<p>No testimonials to review.</p>';
        } else {
            testimonialsForReviewHtml = allTestimonials.map(t => `
                <div class="request-card" style="margin-bottom: 15px; border: 1px solid var(--border-color); padding: 15px; border-radius: var(--border-radius);">
                    <div class="request-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="student-info" style="display: flex; align-items: center; gap: 10px;">
                            <div class="student-avatar" style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--light-purple); color: var(--purple); display: flex; align-items: center; justify-content: center; font-weight: 600;">${t.userName.charAt(0)}</div>
                            <div class="student-name">
                                <span style="font-weight: 600;">${t.userName}</span>
                                <span style="font-size: 13px; color: var(--text-light);">Student</span>
                            </div>
                        </div>
                        <span class="status-badge" style="background-color: ${t.status === 'approved' ? 'var(--light-green)' : t.status === 'pending' ? 'var(--light-yellow)' : 'var(--light-red)'}; color: ${t.status === 'approved' ? 'var(--success)' : t.status === 'pending' ? 'var(--warning)' : 'var(--danger)'}; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
                    </div>
                    <p style="margin-top: 0; margin-bottom: 15px;">"${t.testimonialText}"</p>
                    <div class="request-actions" style="display: flex; gap: 10px;">
                        ${t.status !== 'approved' ? `<button onclick="app.approveTestimonial('${t.id}', '${user.uid}')" class="btn-approve" style="padding: 8px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; background-color: var(--success); color: white;">Approve</button>` : ''}
                        ${t.status !== 'rejected' ? `<button onclick="app.rejectTestimonial('${t.id}', '${user.uid}')" class="btn-decline" style="padding: 8px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; background-color: var(--danger); color: white;">Reject</button>` : ''}
                    </div>
                </div>
            `).join('');
        }


        mainContent.innerHTML = `
            <div class="welcome-header"><h1 id="teacher-welcome-name">Welcome, ${user.displayName}!</h1><p>Manage your mentorship slots and student requests.</p></div>
            <section class="stats-grid">
                <div class="stat-card"><div class="stat-card-info"><h3>${mySlots.length}</h3><p>Total Slots</p></div><div class="stat-card-icon icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div></div>
                <div class="stat-card"><div class="stat-card-info"><h3>${pendingRequests.length}</h3><p>Pending Requests</p></div><div class="stat-card-icon icon-yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div></div>
                <div class="stat-card"><div class="stat-card-info"><h3>${allTestimonials.filter(t => t.status === 'pending').length}</h3><p>Testimonials to Review</p></div><div class="stat-card-icon icon-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div></div>
            </section>
            <section class="dashboard-grid">
                <div class="main-column">
                    <div class="card" style="margin-bottom: 32px;">
                        <div class="section-header" style="margin-bottom: 20px;"><h2>Pending Mentorship Requests</h2></div>
                        <div id="pending-requests-list">${requestsHtml}</div>
                    </div>
                    <div class="card" style="margin-bottom: 32px;">
                        <div class="section-header" style="margin-bottom: 20px;"><h2>Manage Subjects</h2></div>
                        <form id="create-subject-form" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end;">
                            <div class="form-group" style="flex: 1; min-width: 150px;">
                                <label for="subject-name">Subject Name</label>
                                <input type="text" id="subject-name" class="form-control" required>
                            </div>
                             <div class="form-group" style="flex: 1; min-width: 150px;">
                                <label for="subject-price-per-minute">Price per Minute (R)</label>
                                <input type="number" id="subject-price-per-minute" class="form-control" min="0" step="0.01" required>
                            </div>
                            <button type="submit" class="btn-primary" style="padding: 12px 20px; width: auto;">Add Subject</button>
                        </form>
                        <div class="section-header" style="margin-bottom: 15px;"><h3>Your Subjects</h3></div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr><th>Subject Name</th><th>Price/Min</th><th>Action</th></tr>
                                </thead>
                                <tbody id="my-subjects-list">
                                    ${mySubjects.map(sub => `
                                        <tr>
                                            <td>${sub.name}</td>
                                            <td>R${sub.pricePerDuration}</td>
                                            <td><button onclick="app.deleteSubject('${sub.id}', '${user.uid}')" class="btn-decline" style="background-color: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card">
                        <div class="section-header" style="margin-bottom: 20px;"><h2>Create Mentorship Slot</h2></div>
                        <form id="create-slot-form" style="display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end;">
                            <div class="form-group" style="flex: 1; min-width: 150px;">
                                <label for="slot-subject">Subject</label>
                                <select id="slot-subject" class="form-control" required>
                                    ${subjectsOptionsHtml}
                                </select>
                            </div>
                            <div class="form-group" style="flex: 1; min-width: 150px;">
                                <label for="slot-date">Date</label>
                                <input type="date" id="slot-date" class="form-control" required>
                            </div>
                            <div class="form-group" style="flex: 1; min-width: 100px;">
                                <label for="slot-time">Time</label>
                                <input type="time" id="slot-time" class="form-control" required>
                            </div>
                            <div class="form-group" style="flex: 1; min-width: 100px;">
                                <label for="slot-duration">Duration (minutes)</label>
                                <input type="number" id="slot-duration" class="form-control" min="15" step="15" required>
                            </div>
                             <div class="form-group" style="flex: 1; min-width: 100px;">
                                <label for="slot-capacity">Capacity</label>
                                <input type="number" id="slot-capacity" class="form-control" min="1" value="1" required>
                            </div>
                            <button type="submit" class="btn-primary" style="padding: 12px 20px; width: auto;">Add Slot</button>
                        </form>
                        <div class="section-header" style="margin-top: 30px; margin-bottom: 15px;"><h3>Your Mentorship Slots</h3></div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr><th>Subject</th><th>Date & Time</th><th>Duration</th><th>Price</th><th>Booked</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    ${mySlotsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="sidebar-column">
                    <div class="card" style="margin-bottom: 32px;">
                        <div class="section-header" style="margin-bottom: 20px;"><h2>Testimonials for Review</h2></div>
                        <div id="testimonials-review-list">${testimonialsForReviewHtml}</div>
                    </div>
                </div>
            </section>
        `;

        // Add event listeners for new forms
        document.getElementById('create-subject-form').addEventListener('submit', app.createSubject);
        document.getElementById('create-slot-form').addEventListener('submit', app.createSlot);
    }

    // --- GLOBAL APP FUNCTIONS FOR ONCLICK ---
    window.app = {
        requestSlot: async (slotId, subjectName, teacherName) => {
            if (!auth.currentUser) {
                alert('You must be logged in to request a slot.');
                return;
            }
            const user = auth.currentUser;

            // Check if user already requested/booked this slot
            const existingBooking = await db.collection('bookings')
                .where('userId', '==', user.uid)
                .where('slotId', '==', slotId)
                .get();

            if (!existingBooking.empty) {
                alert('You have already requested or booked this slot.');
                return;
            }

            // Get slot details to add to booking (date, time)
            const slotDoc = await db.collection('slots').doc(slotId).get();
            if (!slotDoc.exists) {
                alert('Slot not found.');
                return;
            }
            const slotData = slotDoc.data();

            try {
                await db.collection('bookings').add({
                    userId: user.uid,
                    userName: user.displayName,
                    userEmail: user.email,
                    teacherId: slotData.teacherId, // Store teacherId for easier queries
                    slotId: slotId,
                    subjectName: subjectName,
                    slotDate: slotData.date, // Add slot date
                    slotTime: slotData.time, // Add slot time
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Mentorship request sent successfully! The teacher will review it.');
                renderStudentContent(user); // Refresh the dashboard
            } catch (error) {
                console.error("Error requesting slot:", error);
                alert('Failed to send request. Please try again.');
            }
        },

        updateBookingStatus: async (bookingId, newStatus, teacherUid) => {
            if (!auth.currentUser || auth.currentUser.uid !== teacherUid) {
                alert('You are not authorized to perform this action.');
                return;
            }
            try {
                await db.collection('bookings').doc(bookingId).update({ status: newStatus });
                alert(`Booking ${newStatus}!`);
                renderTeacherContent(auth.currentUser); // Refresh the dashboard
            } catch (error) {
                console.error("Error updating booking status:", error);
                alert('Failed to update booking status.');
            }
        },

        createSubject: async (event) => {
            event.preventDefault();
            if (!auth.currentUser) return alert('You must be logged in.');
            const user = auth.currentUser;
            const subjectName = document.getElementById('subject-name').value.trim();
            const pricePerMinute = parseFloat(document.getElementById('subject-price-per-minute').value);

            if (!subjectName || isNaN(pricePerMinute) || pricePerMinute <= 0) {
                alert('Please provide a valid subject name and price per minute.');
                return;
            }

            try {
                await db.collection('subjects').add({
                    name: subjectName,
                    pricePerDuration: pricePerMinute,
                    teacherId: user.uid,
                    teacherName: user.displayName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Subject created successfully!');
                document.getElementById('create-subject-form').reset();
                renderTeacherContent(user); // Refresh the dashboard
            } catch (error) {
                console.error("Error creating subject:", error);
                alert('Failed to create subject. Please try again.');
            }
        },

        deleteSubject: async (subjectId, teacherUid) => {
            if (!auth.currentUser || auth.currentUser.uid !== teacherUid) {
                alert('You are not authorized to perform this action.');
                return;
            }

            if (!confirm('Are you sure you want to delete this subject? All associated slots will be affected.')) {
                return;
            }

            try {
                // Optionally delete associated slots or set them to inactive
                const associatedSlots = await db.collection('slots').where('subjectId', '==', subjectId).get();
                const batch = db.batch();
                associatedSlots.docs.forEach(doc => {
                    batch.delete(doc.ref); // Or update status to 'inactive'
                });
                batch.delete(db.collection('subjects').doc(subjectId));
                await batch.commit();

                alert('Subject and associated slots deleted successfully!');
                renderTeacherContent(auth.currentUser);
            } catch (error) {
                console.error("Error deleting subject:", error);
                alert('Failed to delete subject. Please try again.');
            }
        },

        createSlot: async (event) => {
            event.preventDefault();
            if (!auth.currentUser) return alert('You must be logged in.');
            const user = auth.currentUser;

            const subjectId = document.getElementById('slot-subject').value;
            const slotDate = document.getElementById('slot-date').value;
            const slotTime = document.getElementById('slot-time').value;
            const slotDuration = parseInt(document.getElementById('slot-duration').value);
            const slotCapacity = parseInt(document.getElementById('slot-capacity').value);

            if (!subjectId || !slotDate || !slotTime || isNaN(slotDuration) || slotDuration <= 0 || isNaN(slotCapacity) || slotCapacity <= 0) {
                alert('Please fill in all slot details correctly.');
                return;
            }

            const subjectDoc = await db.collection('subjects').doc(subjectId).get();
            if (!subjectDoc.exists) {
                alert('Selected subject does not exist.');
                return;
            }
            const subjectData = subjectDoc.data();
            const slotPrice = subjectData.pricePerDuration * slotDuration; // Calculate price for this specific slot

            try {
                await db.collection('slots').add({
                    subjectId: subjectId,
                    subjectName: subjectData.name,
                    teacherId: user.uid,
                    teacherName: user.displayName,
                    date: slotDate,
                    time: slotTime,
                    durationMinutes: slotDuration,
                    capacity: slotCapacity,
                    price: slotPrice,
                    status: 'open',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Mentorship slot created successfully!');
                document.getElementById('create-slot-form').reset();
                renderTeacherContent(user); // Refresh the dashboard
            } catch (error) {
                console.error("Error creating slot:", error);
                alert('Failed to create slot. Please try again.');
            }
        },

        cancelSlot: async (slotId, teacherUid) => {
            if (!auth.currentUser || auth.currentUser.uid !== teacherUid) {
                alert('You are not authorized to perform this action.');
                return;
            }
            if (!confirm('Are you sure you want to cancel this slot? This will also decline all pending bookings.')) {
                return;
            }

            try {
                // Update slot status to 'cancelled'
                await db.collection('slots').doc(slotId).update({ status: 'cancelled' });

                // Decline all pending bookings for this slot
                const pendingBookingsSnapshot = await db.collection('bookings')
                    .where('slotId', '==', slotId)
                    .where('status', '==', 'pending')
                    .get();

                const batch = db.batch();
                pendingBookingsSnapshot.docs.forEach(doc => {
                    batch.update(doc.ref, { status: 'declined' });
                });
                await batch.commit();

                alert('Slot cancelled and pending bookings declined.');
                renderTeacherContent(auth.currentUser);
            } catch (error) {
                console.error("Error cancelling slot:", error);
                alert('Failed to cancel slot.');
            }
        },

        submitTestimonial: async () => {
            if (!auth.currentUser) {
                alert('You must be logged in to submit a testimonial.');
                return;
            }
            const user = auth.currentUser;
            const testimonialText = document.getElementById('testimonial-text').value.trim();

            if (!testimonialText) {
                alert('Please write something for your testimonial.');
                return;
            }

            try {
                await db.collection('testimonials').add({
                    userId: user.uid,
                    userName: user.displayName,
                    testimonialText: testimonialText,
                    status: 'pending', // Testimonials require admin approval
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Testimonial submitted for review!');
                document.getElementById('testimonial-text').value = ''; // Clear text area
                renderStudentContent(user); // Refresh to show their pending testimonial
            } catch (error) {
                console.error("Error submitting testimonial:", error);
                alert('Failed to submit testimonial. Please try again.');
            }
        },

        approveTestimonial: async (testimonialId, teacherUid) => {
            if (!auth.currentUser || auth.currentUser.uid !== teacherUid) {
                alert('You are not authorized to perform this action.');
                return;
            }
            try {
                await db.collection('testimonials').doc(testimonialId).update({ status: 'approved' });
                alert('Testimonial approved!');
                renderTeacherContent(auth.currentUser); // Refresh the dashboard
            } catch (error) {
                console.error("Error approving testimonial:", error);
                alert('Failed to approve testimonial.');
            }
        },

        rejectTestimonial: async (testimonialId, teacherUid) => {
            if (!auth.currentUser || auth.currentUser.uid !== teacherUid) {
                alert('You are not authorized to perform this action.');
                return;
            }
            try {
                await db.collection('testimonials').doc(testimonialId).update({ status: 'rejected' });
                alert('Testimonial rejected!');
                renderTeacherContent(auth.currentUser); // Refresh the dashboard
            } catch (error) {
                console.error("Error rejecting testimonial:", error);
                alert('Failed to reject testimonial.');
            }
        }
    };
});
