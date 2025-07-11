 // Set current year in footer
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        // Mock database for storing data
        let bookings = JSON.parse(localStorage.getItem('tutoring_bookings') || '[]');
        let users = JSON.parse(localStorage.getItem('tutoring_users') || '[]');
        let availableSlots = JSON.parse(localStorage.getItem('available_slots') || '[]');
        let questions = JSON.parse(localStorage.getItem('contact_questions') || '[]');
        let currentUser = null;

        // Calendar variables
        let currentDate = new Date();
        let selectedDate = null;
        let selectedTime = null;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            setupNavigation();
            setupGoogleSignIn();
            checkLoginState();
            setupFormHandlers();
            initializeCalendar();
        });

        // Setup navigation
        function setupNavigation() {
            const navLinks = document.querySelectorAll('nav a');
            const sections = document.querySelectorAll('.page-section');
            
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetSection = this.getAttribute('data-section');
                    
                    if (targetSection) {
                        navigateToSection(targetSection);
                    }
                });
            });
            
            document.querySelectorAll('.btn[data-section]').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetSection = this.getAttribute('data-section');
                    
                    if (targetSection) {
                        navigateToSection(targetSection);
                    }
                });
            });
        }

        // Navigate to a specific section
        function navigateToSection(sectionName) {
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        }
        

        // Google Sign-In setup
        function setupGoogleSignIn() {
            const googleSignInBtn = document.getElementById('google-signin-btn');
            if (googleSignInBtn) {
                googleSignInBtn.addEventListener('click', function() {
                    simulateGoogleSignIn();
                });
            }
        }
// Google Sign-In setup
       setupGoogleSignIn();
       
       // Check if user is already logged in
       checkLoginState();
       
       // Setup form handlers
       setupFormHandlers();
       
       // Load slot availability
       updateSlotAvailability();
       
       // Setup admin functions if user is admin
       if (currentUser && currentUser.role === 'admin') {
           loadAdminData();
       };
        // Simulate Google Sign-In
        function simulateGoogleSignIn() {
            const mockGoogleUser = {
                id: 'google_' + Date.now(),
                email: 'userEmail',
                name: 'user-name',
                firstName: 'John',
                lastName: ' Doe',
                picture: '/api/placeholder/32/32',
                role: 'user',
                verified: true,
                loginTime: new Date().toISOString()
            };

            // Check if this is the first user (make them admin)
            if (users.length === 0) {
                mockGoogleUser.role = 'admin';
                mockGoogleUser.email = 'userEmail';
                mockGoogleUser.name = 'user-name';
                mockGoogleUser.firstName = currentUser.firstName;
                mockGoogleUser.lastName = currentUser.lastName;
            }

            // Check if user already exists
            let existingUser = users.find(u => u.email === mockGoogleUser.email);
            if (!existingUser) {
                users.push(mockGoogleUser);
                localStorage.setItem('tutoring_users', JSON.stringify(users));
            } else {
                existingUser.loginTime = new Date().toISOString();
            }

            currentUser = existingUser || mockGoogleUser;
            localStorage.setItem('current_user', JSON.stringify(currentUser));

            // Show success message and redirect
            document.getElementById('login-success').style.display = 'block';
            setTimeout(() => {
                updateLoginState();
                if (currentUser.role === 'admin') {
                    navigateToSection('admin');
                } else {
                    navigateToSection('dashboard');
                }
            }, 1500);
        }

        // Check login state on page load
        function checkLoginState() {
            const savedUser = localStorage.getItem('current_user');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                updateLoginState();
            }
        }

        // Update UI based on login state
        function updateLoginState() {
            if (currentUser) {
                // Hide login nav, show user info
                document.getElementById('login-nav').style.display = 'none';
                document.getElementById('user-info').style.display = 'flex';

                // Show/hide sections based on role
                if (currentUser.role === 'admin') {
                    document.getElementById('dashboard-nav').style.display = 'none';
                    document.getElementById('bookings-nav').style.display = 'none';
                    document.getElementById('contact-nav').style.display = 'none';
                    document.getElementById('admin-nav').style.display = 'block';
                    document.getElementById('questions-nav').style.display = 'block';
                } else {
                    document.getElementById('dashboard-nav').style.display = 'block';
                    document.getElementById('bookings-nav').style.display = 'block';
                    document.getElementById('contact-nav').style.display = 'block';
                    document.getElementById('admin-nav').style.display = 'none';
                    document.getElementById('questions-nav').style.display = 'none';
                }

                // Update user info display
                
                document.getElementById('user-name').textContent = currentUser.firstName + ' ' + currentUser.lastName;
                document.getElementById('user-role').textContent = currentUser.role.toUpperCase();
                document.getElementById('user-role').className = `role-badge ${currentUser.role}`;
                
                if (document.getElementById('dashboard-user-name')) {
                    document.getElementById('dashboard-user-name').textContent = currentUser.firstName + ' ' + currentUser.lastName;
                }

                // Pre-populate contact form for users
                if (currentUser.role === 'user') {
                    const contactName = document.getElementById('contact-name');
                    const contactEmail = document.getElementById('contact-email');
                    if (contactName) contactName.value = currentUser.name;
                    if (contactEmail) contactEmail.value = currentUser.email;
                }

                // Load user-specific data
                if (currentUser.role === 'user') {
                    loadUserBookings();
                } else if (currentUser.role === 'admin') {
                    loadAdminData();
                    loadQuestions();
                }
            } else {
                // Show login nav, hide user-specific elements
                document.getElementById('login-nav').style.display = 'block';
                document.getElementById('dashboard-nav').style.display = 'none';
                document.getElementById('bookings-nav').style.display = 'none';
                document.getElementById('admin-nav').style.display = 'none';
                document.getElementById('questions-nav').style.display = 'none';
                document.getElementById('user-info').style.display = 'none';
                document.getElementById('contact-nav').style.display = 'block';
            }
        }

        // Setup form handlers
        function setupFormHandlers() {
            // Contact form
            const contactForm = document.getElementById('contact-form');
            if (contactForm) {
                contactForm.addEventListener('submit', handleContactSubmission);
            }

            // Help form
            const helpForm = document.getElementById('help-form');
            if (helpForm) {
                helpForm.addEventListener('submit', handleHelpSubmission);
            }

            // Booking form
            const bookingForm = document.getElementById('booking-form');
            if (bookingForm) {
                bookingForm.addEventListener('submit', handleBookingSubmission);
            }

            // Create slot form
            const createSlotForm = document.getElementById('create-slot-form');
            if (createSlotForm) {
                createSlotForm.addEventListener('submit', handleCreateSlot);
            }

            // Book session button
            const bookSessionBtn = document.getElementById('book-session-btn');
            if (bookSessionBtn) {
                bookSessionBtn.addEventListener('click', function() {
                    navigateToSection('bookings');
                });
            }

            // Logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }

            // Admin filters
            const filterDate = document.getElementById('filter-date');
            const filterSubject = document.getElementById('filter-subject');
            if (filterDate) {
                filterDate.addEventListener('change', loadAdminBookings);
            }
            if (filterSubject) {
                filterSubject.addEventListener('change', loadAdminBookings);
            }
        }

        // Handle contact form submission
        function handleContactSubmission(e) {
            e.preventDefault();
            
            const question = {
                id: 'question_' + Date.now(),
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                subject: document.getElementById('contact-subject').value,
                message: document.getElementById('contact-message').value,
                status: 'new',
                createdAt: new Date().toISOString()
            };

            questions.push(question);
            localStorage.setItem('contact_questions', JSON.stringify(questions));

            // Send email notification to all admins (simulation)
            notifyAdminsOfNewQuestion(question);

            document.getElementById('contact-success').style.display = 'block';
            document.getElementById('contact-form').reset();
            
            // Re-populate readonly fields for logged-in users
            if (currentUser && currentUser.role === 'user') {
                document.getElementById('contact-name').value = currentUser.name;
                document.getElementById('contact-email').value = currentUser.email;
            }
        }

        // Handle help form submission  
        function handleHelpSubmission(e) {
            e.preventDefault();
            
            const question = {
                id: 'help_' + Date.now(),
                name: currentUser.name,
                email: currentUser.email,
                phone: '',
                subject: document.getElementById('help-subject').value,
                message: document.getElementById('help-message').value,
                status: 'new',
                createdAt: new Date().toISOString(),
                type: 'help'
            };

            questions.push(question);
            localStorage.setItem('contact_questions', JSON.stringify(questions));

            notifyAdminsOfNewQuestion(question);

            document.getElementById('help-success').style.display = 'block';
            document.getElementById('help-form').reset();
        }

        // Notify admins of new questions (simulation)
        function notifyAdminsOfNewQuestion(question) {
            console.log('Email sent to admins:', {
                subject: `New Question: ${question.subject}`,
                message: `New question received from ${question.name} (${question.email})`,
                link: `${window.location.origin}#questions`
            });
        }

        // Initialize calendar
        function initializeCalendar() {
            updateCalendar();
            
            const prevBtn = document.getElementById('prev-month');
            const nextBtn = document.getElementById('next-month');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', function() {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    updateCalendar();
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', function() {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    updateCalendar();
                });
            }
        }

        // Update calendar display
        function updateCalendar() {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            
            const currentMonthElement = document.getElementById('current-month');
            if (currentMonthElement) {
                currentMonthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            }

            const calendarGrid = document.getElementById('calendar-grid');
            if (!calendarGrid) return;

            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            const today = new Date();
            let calendarHTML = '';

            // Add day headers
            const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayHeaders.forEach(day => {
                calendarHTML += `<div class="calendar-day" style="font-weight: bold; background-color: #f0f0f0;">${day}</div>`;
            });

            // Add calendar days
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isPast = date < today.setHours(0, 0, 0, 0);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                let classes = 'calendar-day';
                if (!isCurrentMonth || isPast) {
                    classes += ' disabled';
                } else if (isSelected) {
                    classes += ' selected';
                }

                calendarHTML += `<div class="${classes}" data-date="${date.toISOString().split('T')[0]}">${date.getDate()}</div>`;
            }

            calendarGrid.innerHTML = calendarHTML;

            // Add click event listeners to calendar days
            calendarGrid.querySelectorAll('.calendar-day:not(.disabled)').forEach(day => {
                day.addEventListener('click', function() {
                    if (!this.classList.contains('disabled')) {
                        // Remove previous selection
                        calendarGrid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                        
                        // Add selection to clicked day
                        this.classList.add('selected');
                        
                        // Update selected date
                        selectedDate = new Date(this.getAttribute('data-date'));
                        document.getElementById('selected-date').value = this.getAttribute('data-date');
                        
                        // Update time slots
                        updateTimeSlots();
                    }
                });
            });
        }

        // Update time slots based on selected date and subject
        function updateTimeSlots() {
            const timeSlotsContainer = document.getElementById('time-slots');
            const selectedSubject = document.getElementById('booking-subject').value;
            
            if (!timeSlotsContainer || !selectedDate || !selectedSubject) {
                if (timeSlotsContainer) {
                    timeSlotsContainer.innerHTML = '<p>Please select a subject and date first.</p>';
                }
                return;
            }

            const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
            const dateStr = selectedDate.toISOString().split('T')[0];

            let slotsHTML = '';
            
            timeSlots.forEach(time => {
                const slotKey = `${selectedSubject}-${dateStr}-${time}`;
                const availableSlot = availableSlots.find(slot => 
                    slot.subject === selectedSubject && 
                    slot.date === dateStr && 
                    slot.time === time
                );

                if (availableSlot) {
                    const bookedCount = bookings.filter(b => 
                        b.subject === selectedSubject && 
                        b.date === dateStr && 
                        b.time === time && 
                        b.status !== 'cancelled'
                    ).length;

                    const isAvailable = bookedCount < availableSlot.capacity;
                    const remaining = availableSlot.capacity - bookedCount;

                    let classes = 'time-slot';
                    if (isAvailable) {
                        classes += ' available';
                    } else {
                        classes += ' full';
                    }

                    if (selectedTime === time) {
                        classes += ' selected';
                    }

                    slotsHTML += `
                        <div class="${classes}" data-time="${time}" ${!isAvailable ? 'style="pointer-events: none;"' : ''}>
                            <strong>${time}</strong>
                            <p>${bookedCount}/${availableSlot.capacity} booked</p>
                            <p>${isAvailable ? `${remaining} spots left` : 'Full'}</p>
                        </div>
                    `;
                }
            });

            if (slotsHTML === '') {
                slotsHTML = '<p>No time slots available for this date and subject.</p>';
            }

            timeSlotsContainer.innerHTML = slotsHTML;

            // Add click event listeners to time slots
            timeSlotsContainer.querySelectorAll('.time-slot.available').forEach(slot => {
                slot.addEventListener('click', function() {
                    // Remove previous selection
                    timeSlotsContainer.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    
                    // Add selection
                    this.classList.add('selected');
                    
                    // Update selected time
                    selectedTime = this.getAttribute('data-time');
                    document.getElementById('selected-time').value = selectedTime;
                });
            });
        }

        // Handle booking submission
        function handleBookingSubmission(e) {
            e.preventDefault();
            
            if (!currentUser) {
                alert('Please log in to book a session.');
                return;
            }

            if (!selectedDate || !selectedTime) {
                document.getElementById('booking-error').textContent = 'Please select a date and time slot.';
                document.getElementById('booking-error').style.display = 'block';
                document.getElementById('booking-success').style.display = 'none';
                return;
            }

            const subject = document.getElementById('booking-subject').value;
            const dateStr = selectedDate.toISOString().split('T')[0];
            const notes = document.getElementById('booking-notes').value;

            // Check if slot is available
            const availableSlot = availableSlots.find(slot => 
                slot.subject === subject && 
                slot.date === dateStr && 
                slot.time === selectedTime
            );

            if (!availableSlot) {
                document.getElementById('booking-error').textContent = 'This time slot is not available.';
                document.getElementById('booking-error').style.display = 'block';
                document.getElementById('booking-success').style.display = 'none';
                return;
            }

            const existingBookings = bookings.filter(b => 
                b.subject === subject && 
                b.date === dateStr && 
                b.time === selectedTime && 
                b.status !== 'cancelled'
            );

            if (existingBookings.length >= availableSlot.capacity) {
                document.getElementById('booking-error').textContent = 'This time slot is fully booked.';
                document.getElementById('booking-error').style.display = 'block';
                document.getElementById('booking-success').style.display = 'none';
                return;
            }

            // Create booking
            const booking = {
                id: 'booking_' + Date.now(),
                userId: currentUser.id,
                userEmail: currentUser.email,
                userName: currentUser.name,
                subject: subject,
                date: dateStr,
                time: selectedTime,
                notes: notes,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };

            bookings.push(booking);
            localStorage.setItem('tutoring_bookings', JSON.stringify(bookings));

            // Show success message
            document.getElementById('booking-error').style.display = 'none';
            document.getElementById('booking-success').style.display = 'block';
            document.getElementById('booking-form').reset();
            
            // Reset selections
            selectedDate = null;
            selectedTime = null;
            document.getElementById('selected-date').value = '';
            document.getElementById('selected-time').value = '';

            // Update displays
            loadUserBookings();
            updateTimeSlots();
            
            if (currentUser.role === 'admin') {
                loadAdminData();
            }
        }

        // Handle create slot submission
        function handleCreateSlot(e) {
            e.preventDefault();
            
            const subject = document.getElementById('slot-subject').value;
            const date = document.getElementById('slot-date').value;
            const time = document.getElementById('slot-time').value;
            const capacity = parseInt(document.getElementById('slot-capacity').value);

            // Check if slot already exists
            const existingSlot = availableSlots.find(slot => 
                slot.subject === subject && 
                slot.date === date && 
                slot.time === time
            );

            if (existingSlot) {
                alert('A slot for this subject, date, and time already exists.');
                return;
            }

            const slot = {
                id: 'slot_' + Date.now(),
                subject: subject,
                date: date,
                time: time,
                capacity: capacity,
                createdAt: new Date().toISOString()
            };

            availableSlots.push(slot);
            localStorage.setItem('available_slots', JSON.stringify(availableSlots));

            document.getElementById('slot-success').style.display = 'block';
            document.getElementById('create-slot-form').reset();
            
            setTimeout(() => {
                document.getElementById('slot-success').style.display = 'none';
            }, 3000);
        }

        // Load user's bookings
        function loadUserBookings() {
            if (!currentUser) return;

            const userBookings = bookings.filter(b => b.userId === currentUser.id);
            const container = document.getElementById('user-bookings');
            
            if (!container) return;
            
            if (userBookings.length === 0) {
                container.innerHTML = '<p>You have no bookings yet.</p>';
                return;
            }

            container.innerHTML = userBookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-header">
                        <h4>${booking.subject.charAt(0).toUpperCase() + booking.subject.slice(1)}</h4>
                        <span class="booking-status status-${booking.status}">${booking.status.toUpperCase()}</span>
                    </div>
                    <div class="booking-details">
                        <div class="detail-item">
                            <span class="detail-label">Date</span>
                            <span class="detail-value">${new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Time</span>
                            <span class="detail-value">${booking.time}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value">${booking.status}</span>
                        </div>
                    </div>
                    ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                </div>
            `).join('');
        }

        // Load admin data
        function loadAdminData() {
            if (!currentUser || currentUser.role !== 'admin') return;

            loadAdminStats();
            loadAdminBookings();
        }

        // Load admin statistics
        function loadAdminStats() {
            const container = document.getElementById('booking-stats');
            if (!container) return;

            const totalBookings = bookings.length;
            const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
            const todaysBookings = bookings.filter(b => 
                b.date === new Date().toISOString().split('T')[0]
            ).length;

            const subjectStats = {};
            bookings.forEach(b => {
                subjectStats[b.subject] = (subjectStats[b.subject] || 0) + 1;
            });

            container.innerHTML = `
                <div class="booking-details">
                    <div class="detail-item">
                        <span class="detail-label">Total Bookings</span>
                        <span class="detail-value">${totalBookings}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Confirmed Bookings</span>
                        <span class="detail-value">${confirmedBookings}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Today's Bookings</span>
                        <span class="detail-value">${todaysBookings}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Total Users</span>
                        <span class="detail-value">${users.length}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Available Slots</span>
                        <span class="detail-value">${availableSlots.length}</span>
                    </div>
                </div>
                ${Object.keys(subjectStats).length > 0 ? `
                    <h4>Bookings by Subject:</h4>
                    <ul>
                        ${Object.entries(subjectStats).map(([subject, count]) => 
                            `<li>${subject.charAt(0).toUpperCase() + subject.slice(1)}: ${count}</li>`
                        ).join('')}
                    </ul>
                ` : ''}
            `;
        }

        // Load admin bookings
        function loadAdminBookings() {
            const container = document.getElementById('all-bookings');
            if (!container) return;

            let filteredBookings = [...bookings];

            // Apply filters
            const dateFilter = document.getElementById('filter-date')?.value;
            const subjectFilter = document.getElementById('filter-subject')?.value;

            if (dateFilter) {
                filteredBookings = filteredBookings.filter(b => b.date === dateFilter);
            }
            if (subjectFilter) {
                filteredBookings = filteredBookings.filter(b => b.subject === subjectFilter);
            }

            if (filteredBookings.length === 0) {
                container.innerHTML = '<p>No bookings found matching the selected filters.</p>';
                return;
            }

            // Sort by date and time
            filteredBookings.sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time);
                const dateB = new Date(b.date + 'T' + b.time);
                return dateB - dateA;
            });

            container.innerHTML = filteredBookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-header">
                        <h4>${booking.subject.charAt(0).toUpperCase() + booking.subject.slice(1)}</h4>
                        <span class="booking-status status-${booking.status}">${booking.status.toUpperCase()}</span>
                    </div>
                    <div class="booking-details">
                        <div class="detail-item">
                            <span class="detail-label">Student</span>
                            <span class="detail-value">${booking.userName} (${booking.userEmail})</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date</span>
                            <span class="detail-value">${new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Time</span>
                            <span class="detail-value">${booking.time}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Booked</span>
                            <span class="detail-value">${new Date(booking.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                    ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                </div>
            `).join('');
        }

        // Load questions for admin
        function loadQuestions() {
            const container = document.getElementById('questions-list');
            if (!container) return;

            if (questions.length === 0) {
                container.innerHTML = '<p>No questions received yet.</p>';
                return;
            }

            // Sort by date (newest first)
            const sortedQuestions = [...questions].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            container.innerHTML = sortedQuestions.map(question => `
                <div class="question-card">
                    <div class="question-header">
                        <h4>${question.subject.charAt(0).toUpperCase() + question.subject.slice(1)} Question</h4>
                        <span class="question-status status-${question.status}">${question.status.toUpperCase()}</span>
                    </div>
                    <div class="booking-details">
                        <div class="detail-item">
                            <span class="detail-label">From</span>
                            <span class="detail-value">${question.name} (${question.email})</span>
                        </div>
                        ${question.phone ? `
                            <div class="detail-item">
                                <span class="detail-label">Phone</span>
                                <span class="detail-value">${question.phone}</span>
                            </div>
                        ` : ''}
                        <div class="detail-item">
                            <span class="detail-label">Received</span>
                            <span class="detail-value">${new Date(question.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Type</span>
                            <span class="detail-value">${question.type === 'help' ? 'Help Request' : 'Contact Form'}</span>
                        </div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <strong>Message:</strong>
                        <p style="margin-top: 0.5rem; padding: 1rem; background-color: #f9f9f9; border-radius: 4px;">
                            ${question.message}
                        </p>
                    </div>
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-success" onclick="markAsResponded('${question.id}')">
                            Mark as Responded
                        </button>
                        <a href="mailto:${question.email}?subject=Re: ${question.subject}&body=Dear ${question.name},%0D%0A%0D%0AThank you for your inquiry..." 
                           class="btn" style="margin-left: 0.5rem;">
                            Reply via Email
                        </a>
                    </div>
                </div>
            `).join('');
        }

        // Mark question as responded
        function markAsResponded(questionId) {
            const question = questions.find(q => q.id === questionId);
            if (question) {
                question.status = 'responded';
                localStorage.setItem('contact_questions', JSON.stringify(questions));
                loadQuestions();
            }
        }

        // Handle logout
        function handleLogout() {
            currentUser = null;
            localStorage.removeItem('current_user');
            updateLoginState();
            navigateToSection('home');
        }

        // Update booking subject change
        document.addEventListener('change', function(e) {
            if (e.target && e.target.id === 'booking-subject') {
                updateTimeSlots();
            }
        });

        // Make markAsResponded available globally
        window.markAsResponded = markAsResponded;