document.addEventListener('DOMContentLoaded', () => {

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

    // --- ADMIN CONFIGURATION ---
    // In a real app, this would be managed in the database.
    const ADMIN_EMAILS = ['your-admin-email@example.com', 'another-admin@gmail.com'];

    // --- GLOBAL STATE ---
    let currentUser = null;
    let isAdmin = false;

    // --- UI ELEMENTS ---
    const navLinks = document.querySelectorAll('nav a[data-section]');
    const sections = document.querySelectorAll('.page-section');
    const authElements = document.querySelectorAll('.auth-only');
    const noAuthElements = document.querySelectorAll('.no-auth');
    const adminElements = document.querySelectorAll('.admin-only');

    // --- AUTHENTICATION ---

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUser = user;
            isAdmin = ADMIN_EMAILS.includes(user.email);
            updateUIForUser();
            loadDynamicData();
        } else {
            // User is signed out
            currentUser = null;
            isAdmin = false;
            updateUIForGuest();
            showSection('home');
        }
    });

    document.getElementById('google-login-btn').addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(handleAuthError);
    });

    document.getElementById('microsoft-login-btn').addEventListener('click', () => {
        const provider = new firebase.auth.OAuthProvider('microsoft.com');
        auth.signInWithPopup(provider).catch(handleAuthError);
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut();
    });

    function handleAuthError(error) {
        document.getElementById('login-error').textContent = `Error: ${error.message}`;
        document.getElementById('login-error').style.display = 'block';
    }

    // --- UI MANAGEMENT ---

    function updateUIForUser() {
        document.getElementById('user-name').textContent = currentUser.displayName;
        document.getElementById('user-role').textContent = isAdmin ? 'Admin' : 'Student';
        document.getElementById('user-role').className = isAdmin ? 'role-badge admin' : 'role-badge';
        document.getElementById('user-info').style.display = 'flex';
        
        authElements.forEach(el => el.style.display = 'inline-block');
        noAuthElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = isAdmin ? 'inline-block' : 'none');
        
        showSection(isAdmin ? 'admin' : 'bookings');
    }

    function updateUIForGuest() {
        document.getElementById('user-info').style.display = 'none';
        authElements.forEach(el => el.style.display = 'none');
        noAuthElements.forEach(el => el.style.display = 'inline-block');
        adminElements.forEach(el => el.style.display = 'none');
    }

    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.toggle('active', section.id === `${sectionId}-section`);
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.target.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    function showMessage(elementId, message, isSuccess = true) {
        const el = document.getElementById(elementId);
        el.textContent = message;
        el.className = isSuccess ? 'success-message' : 'alert alert-danger';
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 4000);
    }

    // --- DYNAMIC DATA LOADING ---

    function loadDynamicData() {
        if (isAdmin) {
            loadAdminBookings();
            // loadQuestions(); // If you implement this feature
        } else {
            loadAvailableSlots();
            loadMyBookings();
        }
    }

    // --- STUDENT FUNCTIONALITY ---
    
    async function loadAvailableSlots() {
        const listEl = document.getElementById('slots-list');
        listEl.innerHTML = '<p>Loading available slots...</p>';
        try {
            const slotsSnapshot = await db.collection('slots').where('status', '==', 'open').get();
            const bookingsSnapshot = await db.collection('bookings').get();
            const allBookings = bookingsSnapshot.docs.map(doc => doc.data());

            if (slotsSnapshot.empty) {
                listEl.innerHTML = '<p>No mentorship slots are currently available. Please check back later.</p>';
                return;
            }

            let html = '';
            slotsSnapshot.forEach(doc => {
                const slot = { id: doc.id, ...doc.data() };
                const bookingsForSlot = allBookings.filter(b => b.slotId === slot.id && b.status === 'confirmed').length;
                const capacity = slot.capacity || 1; // Default to 1 if not set
                const isFull = bookingsForSlot >= capacity;
                const userHasBooked = allBookings.some(b => b.slotId === slot.id && b.userId === currentUser.uid);

                html += `
                    <div class="booking-card ${isFull ? 'full' : ''}">
                        <div class="booking-header">
                            <h4>${slot.subject}</h4>
                            <span class="booking-status">${isFull ? 'Full' : 'Available'}</span>
                        </div>
                        <p>Date: ${slot.date} at ${slot.time}</p>
                        <p>Capacity: ${bookingsForSlot} / ${capacity}</p>
                        ${userHasBooked ? `<button class="btn" disabled>Already Booked</button>` : `<button class="btn" onclick="app.requestBooking('${slot.id}')" ${isFull ? 'disabled' : ''}>Request Slot</button>`}
                    </div>
                `;
            });
            listEl.innerHTML = html;
        } catch (error) {
            console.error("Error loading slots:", error);
            listEl.innerHTML = '<p class="alert alert-danger">Could not load slots. Please try again later.</p>';
        }
    }
    
    async function requestBooking(slotId) {
        if (!currentUser) return showMessage('booking-error', 'You must be logged in to book.', false);

        try {
            await db.collection('bookings').add({
                userId: currentUser.uid,
                userName: currentUser.displayName,
                userEmail: currentUser.email,
                slotId: slotId,
                status: 'pending', // 'pending', 'confirmed', 'cancelled'
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showMessage('booking-success', 'Your request has been sent! You will be notified upon approval.');
            loadAvailableSlots();
            loadMyBookings();
        } catch (error) {
            console.error("Error requesting booking: ", error);
            showMessage('booking-error', 'Could not send your request. Please try again.', false);
        }
    }

    async function loadMyBookings() {
        const listEl = document.getElementById('my-bookings-list');
        if (!currentUser) return;
        
        listEl.innerHTML = '<p>Loading your bookings...</p>';
        try {
            const bookingsSnapshot = await db.collection('bookings').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').get();
            const slotsSnapshot = await db.collection('slots').get();
            const allSlots = slotsSnapshot.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data()}), {});
            
            if (bookingsSnapshot.empty) {
                listEl.innerHTML = '<p>You have no bookings yet.</p>';
                return;
            }

            let html = '';
            bookingsSnapshot.forEach(doc => {
                const booking = { id: doc.id, ...doc.data() };
                const slot = allSlots[booking.slotId];
                if (slot) {
                     html += `
                        <div class="booking-card">
                           <div class="booking-header">
                               <h4>${slot.subject}</h4>
                               <span class="booking-status status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                           </div>
                           <p>Date: ${slot.date} at ${slot.time}</p>
                        </div>
                    `;
                }
            });
            listEl.innerHTML = html;
        } catch (error) {
            console.error("Error loading my bookings:", error);
            listEl.innerHTML = '<p class="alert alert-danger">Could not load your bookings.</p>';
        }
    }

    // --- ADMIN FUNCTIONALITY ---
    
    document.getElementById('create-slot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('slot-subject').value;
        const date = document.getElementById('slot-date').value;
        const time = document.getElementById('slot-time').value;
        const capacity = parseInt(document.getElementById('slot-capacity').value, 10);
        
        try {
            await db.collection('slots').add({
                subject, date, time, capacity,
                status: 'open', // 'open' or 'closed'
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showMessage('slot-success', 'Slot created successfully!');
            e.target.reset();
        } catch (error) {
            console.error("Error creating slot:", error);
            showMessage('slot-success', 'Error creating slot.', false);
        }
    });

    async function loadAdminBookings() {
        const listEl = document.getElementById('admin-bookings-list');
        listEl.innerHTML = '<p>Loading pending bookings...</p>';
        try {
            const bookingsSnapshot = await db.collection('bookings').where('status', '==', 'pending').get();
            const slotsSnapshot = await db.collection('slots').get();
            const allSlots = slotsSnapshot.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data()}), {});

            if (bookingsSnapshot.empty) {
                listEl.innerHTML = '<p>No pending bookings to approve.</p>';
                return;
            }

            let html = '';
            bookingsSnapshot.forEach(doc => {
                const booking = { id: doc.id, ...doc.data() };
                const slot = allSlots[booking.slotId];
                if (slot) {
                    html += `
                        <div class="booking-card">
                            <h4>${slot.subject} on ${slot.date}</h4>
                            <p>Requested by: ${booking.userName} (${booking.userEmail})</p>
                            <div>
                                <button class="btn btn-success" onclick="app.updateBookingStatus('${booking.id}', 'confirmed')">Approve</button>
                                <button class="btn btn-danger" onclick="app.updateBookingStatus('${booking.id}', 'cancelled')">Deny</button>
                            </div>
                        </div>
                    `;
                }
            });
            listEl.innerHTML = html;
        } catch (error) {
            console.error("Error loading admin bookings:", error);
            listEl.innerHTML = '<p class="alert alert-danger">Could not load bookings.</p>';
        }
    }
    
    async function updateBookingStatus(bookingId, newStatus) {
        try {
            await db.collection('bookings').doc(bookingId).update({ status: newStatus });
            // After updating, reload both admin and student views
            // This ensures data is fresh everywhere
            loadDynamicData(); 
            
            // Reload for all users (if they are on the page)
            if(!isAdmin) {
                loadAvailableSlots();
                loadMyBookings();
            } else {
                 loadAdminBookings();
            }
        } catch (error) {
            console.error("Error updating booking status:", error);
            alert('Failed to update status.');
        }
    }
    
    // --- EXPOSE FUNCTIONS TO GLOBAL SCOPE FOR ONCLICK ATTRIBUTES ---
    window.app = {
        requestBooking,
        updateBookingStatus
    };
    
    // --- INITIALIZE FOOTER YEAR ---
    document.getElementById('current-year').textContent = new Date().getFullYear();
});