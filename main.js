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
    // Add the email addresses of users who should be considered 'Teachers' or 'Admins'
    const ADMIN_EMAILS = ['teacher1@example.com', 'dr.smith@example.com'];

    // --- PAGE ELEMENTS ---
    const loginPage = document.getElementById('login-page');
    const studentDashboard = document.getElementById('student-dashboard-page');
    const teacherDashboard = document.getElementById('teacher-dashboard-page');

    // --- VIEW SWITCHING LOGIC ---
    function showPage(page) {
        // Hide all pages first
        loginPage.style.display = 'none';
        studentDashboard.style.display = 'none';
        teacherDashboard.style.display = 'none';
        
        // Show the requested page
        if (page === 'login') loginPage.style.display = 'flex';
        if (page === 'student') studentDashboard.style.display = 'block';
        if (page === 'teacher') teacherDashboard.style.display = 'block';
    }

    // --- AUTHENTICATION LISTENER ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            const isAdmin = ADMIN_EMAILS.includes(user.email);
            if (isAdmin) {
                // User is a teacher/admin
                setupTeacherDashboard(user);
                showPage('teacher');
            } else {
                // User is a student
                setupStudentDashboard(user);
                showPage('student');
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
    
    // --- DASHBOARD SETUP ---
    function setupStudentDashboard(user) {
        document.getElementById('student-welcome-name').textContent = `Welcome back, ${user.displayName.split(' ')[0]}!`;
        const studentAvatar = document.getElementById('student-avatar');
        if (user.photoURL) {
            studentAvatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName}">`;
        } else {
            studentAvatar.textContent = user.displayName.charAt(0);
        }
        // Add logic here to load student-specific data from Firestore
    }

    function setupTeacherDashboard(user) {
        document.getElementById('teacher-welcome-name').textContent = `Welcome, ${user.displayName}!`;
        const teacherAvatar = document.getElementById('teacher-avatar');
        if (user.photoURL) {
            teacherAvatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName}">`;
        } else {
            teacherAvatar.textContent = user.displayName.split(' ').map(n => n[0]).join('');
        }
        // Add logic here to load teacher-specific data from Firestore
    }
});