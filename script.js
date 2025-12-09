// script.js - Single Page Application (SPA) Controller

const API_BASE_URL = 'http://localhost/hostel-backend/'; // <-- IMPORTANT: Check this URL

// --- GLOBAL STATE ---
let CURRENT_USER_ROLE = 'guest'; 
let CURRENT_USER_ID = '';
let CURRENT_USER_NAME = '';
// Mock student data (in a real app, this would be fetched on login)
let STUDENT_DATA = { roomNo: 'A-205', branch: 'CSE', year: '3rd' }; 


document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Element References ---
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const studentNavItems = document.querySelectorAll('.student-nav');
    const staffNavItems = document.querySelectorAll('.staff-nav'); 
    const studentSubViews = document.querySelectorAll('#student-content-area .sub-view');
    
    // --- 2. Attach Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    studentNavItems.forEach(item => item.addEventListener('click', handleStudentNavigation));
    staffNavItems.forEach(item => item.addEventListener('click', handleStaffNavigation)); 
    document.getElementById('leave-form').addEventListener('submit', handleFormSubmission);
    document.getElementById('lookup-btn').addEventListener('click', handleGatePassLookup);
    
    // Initial State
    switchView('login-view', 'guest'); // Start on the login screen
});


// =================================================================
// I. AUTHENTICATION AND VIEW MANAGEMENT
// =================================================================

/**
 * Handles the login form submission.
 */
// **FIXED:** Declared as 'async'
async function handleLogin(event) { 
    event.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const role = document.getElementById('login-role').value;
    const password = document.getElementById('login-password').value; // password is mocked

    const loginMessage = document.getElementById('login-message');
    loginMessage.className = 'message-box';
    loginMessage.innerHTML = 'Logging in...';

    // --- MOCK AUTHENTICATION LOGIC (Replace with real AJAX call) ---
    // Simulating a brief delay (like an API call)
    await new Promise(resolve => setTimeout(resolve, 300));

    if (password !== 'password') { 
        displayStatus('Invalid password.', 'error', loginMessage);
        return;
    }

    // Set Global State based on mock login
    CURRENT_USER_ID = username;
    CURRENT_USER_ROLE = role;
    if (role === 'student') CURRENT_USER_NAME = 'John Doe';
    else if (role === 'coordinator') CURRENT_USER_NAME = 'Dr. Sharma';
    else if (role === 'rector') CURRENT_USER_NAME = 'Prof. Patel';
    
    // Switch View
    const targetViewId = role + '-view';
    if (document.getElementById(targetViewId)) {
        switchView(targetViewId, role);
        displayStatus('', 'clear', loginMessage); // Clear login message
        
        // Update Header
        document.getElementById('welcome-message').textContent = `Welcome, ${CURRENT_USER_NAME} (${CURRENT_USER_ID})`;
        document.getElementById('logout-btn').style.display = 'inline-block';
    } else {
        displayStatus('Error: Invalid role view.', 'error', loginMessage);
    }
}

/**
 * Handles the logout action.
 */
function handleLogout() {
    // Reset state
    CURRENT_USER_ROLE = 'guest';
    CURRENT_USER_ID = '';
    CURRENT_USER_NAME = '';
    
    // Reset header
    document.getElementById('welcome-message').textContent = 'Welcome! Please Log In.';
    document.getElementById('logout-btn').style.display = 'none';

    // Switch back to login
    switchView('login-view', 'guest');
}

/**
 * Central function to switch between the main views (Login, Student, Staff).
 */
function switchView(targetViewId, role) {
    // 1. Hide all main views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active-view');
        view.style.display = 'none';
    });
    
    // 2. Show the target view
    const targetView = document.getElementById(targetViewId);
    if (targetView) {
        targetView.classList.add('active-view');
        targetView.style.display = (targetViewId === 'login-view') ? 'block' : 'grid'; 
    }
    
    // 3. Load role-specific data
    if (role === 'student') {
        // Default to 'apply' view on login
        handleStudentNavigation({ target: document.querySelector('.student-nav[data-view="apply"]') });
    } else if (role === 'coordinator' || role === 'rector') {
        // Default to 'pending' view on login
        handleStaffNavigation({ target: document.querySelector('.staff-nav[data-view="pending"]') });
    }
}

// =================================================================
// II. STUDENT VIEW LOGIC
// =================================================================

/**
 * Handles navigation within the Student Dashboard (Apply, History, Gate Pass).
 */
function handleStudentNavigation(event) {
    const targetView = event.target.getAttribute('data-view');

    // Update active class for sidebar
    document.querySelectorAll('.student-nav').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

    // Show/Hide sub-views
    studentSubViews.forEach(view => {
        view.style.display = 'none';
        if (view.id === targetView) {
            view.style.display = 'block';
        }
    });

    // Re-fetch history if navigating there
    if (targetView === 'history') {
        fetchLeaveHistory(CURRENT_USER_ID);
    }
}

/**
 * Sends the student form data to the PHP submission endpoint.
 */
// **FIXED:** Declared as 'async'
async function handleFormSubmission(event) {
    event.preventDefault();
    
    const statusMessage = document.getElementById('status-message');
    displayStatus('Submitting application...', 'info', statusMessage);

    const formData = {
        studentId: CURRENT_USER_ID,
        studentName: CURRENT_USER_NAME,
        roomNo: STUDENT_DATA.roomNo,
        departureDate: document.getElementById('departure-date').value,
        departureTime: document.getElementById('departure-time').value,
        arrivalDate: document.getElementById('arrival-date').value,
        natureOfLeave: document.getElementById('nature-of-leave').value,
        destination: document.getElementById('destination').value.trim(),
        reason: document.getElementById('reason').value.trim(),
        guardianName: document.getElementById('guardian-name').value.trim(),
        guardianContact: document.getElementById('guardian-contact').value.trim(),
    };
    
    // Basic Validation
    if (new Date(formData.arrivalDate) <= new Date(formData.departureDate)) {
        displayStatus('Error: Arrival date must be after the departure date.', 'error', statusMessage);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}submit_leave.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData), 
        });

        if (response.ok) {
            const data = await response.json();
            
            const approvalPath = formData.natureOfLeave === 'working' ? 'Coordinator then Rector' : 'Rector Only';
            const successHTML = `
                ✅ **Application Submitted!** <br>
                Your **Reference No.** is: <strong>${data.referenceNo}</strong>.<br>
                **Approval Path:** ${approvalPath}.<br>
            `;
            displayStatus(successHTML, 'success', statusMessage);
            document.getElementById('leave-form').reset();
            // Automatically switch to history view to see the new entry
            handleStudentNavigation({ target: document.querySelector('.student-nav[data-view="history"]') });
        } else {
            const errorData = await response.json();
            displayStatus(`Submission Failed: ${errorData.message || 'Server error occurred.'}`, 'error', statusMessage);
        }

    } catch (error) {
        console.error("Submission error:", error);
        displayStatus('Network Error: Could not connect to the PHP server.', 'error', statusMessage);
    }
}

/**
 * Fetches leave history from the PHP backend.
 */
// **FIXED:** Declared as 'async'
async function fetchLeaveHistory(studentId) {
    const historyContainer = document.getElementById('leave-table-container');
    historyContainer.innerHTML = 'Loading history...';
    try {
        const response = await fetch(`${API_BASE_URL}fetch_history.php?student_id=${studentId}`);
        if (response.ok) {
            const records = await response.json();
            renderLeaveHistory(records); 
        } else {
            historyContainer.innerHTML = '<p class="error">Failed to load history from server.</p>';
        }
    } catch (error) {
        historyContainer.innerHTML = '<p class="error">Network error while fetching history.</p>';
    }
}

/**
 * Creates and renders the HTML table for leave history.
 */
function renderLeaveHistory(leaveRecords) {
    const historyContainer = document.getElementById('leave-table-container');
    if (leaveRecords.length === 0) {
        historyContainer.innerHTML = '<p class="warning">You have not submitted any leave applications yet.</p>';
        return;
    }

    const tableHTML = `
        <table class="status-table">
            <thead>
                <tr>
                    <th>Ref. No.</th>
                    <th>Dates</th>
                    <th>Nature</th>
                    <th>Coordinator</th>
                    <th>Rector</th>
                    <th>Overall Status</th>
                </tr>
            </thead>
            <tbody>
                ${leaveRecords.map(record => `
                    <tr>
                        <td><strong>${record.reference_no}</strong></td>
                        <td>${record.departure.split(' ')[0]} to ${record.arrival}</td>
                        <td>${record.nature_of_leave}</td>
                        <td>${getStatusTag(record.coordinator_approval)}</td>
                        <td>${getStatusTag(record.rector_approval)}</td>
                        <td>${getOverallStatus(record)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    historyContainer.innerHTML = tableHTML;
}

/**
 * Handles the gate pass lookup. (API call needed for full implementation)
 */
// **FIXED:** Declared as 'async'
async function handleGatePassLookup() {
    const refNo = document.getElementById('lookup-ref-no').value.trim().toUpperCase();
    const gatepassDetails = document.getElementById('gatepass-details');

    if (!refNo) {
        displayStatus('Please enter a Reference Number.', 'warning', gatepassDetails);
        return;
    }
    
    // NOTE: This feature requires a new PHP endpoint (e.g., fetch_gatepass.php?ref=...)
    // await fetch() call would go here
    displayStatus(`Lookup for **${refNo}** executed. This requires a dedicated backend API endpoint to confirm status and generate the pass details.`, 'info', gatepassDetails);
    gatepassDetails.style.whiteSpace = 'pre-wrap';
    gatepassDetails.style.textAlign = 'center';
}


// =================================================================
// III. STAFF VIEW LOGIC
// =================================================================

/**
 * Handles navigation within the Staff Dashboard (Pending, History).
 */
function handleStaffNavigation(event) {
    const targetView = event.target.getAttribute('data-view');

    // Update active class for sidebar
    document.querySelectorAll('.staff-nav').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

    // Show/Hide sub-views
    document.querySelectorAll('#staff-content-area .sub-view').forEach(view => {
        view.style.display = 'none';
        if (view.id === targetView) {
            view.style.display = 'block';
        }
    });

    // Fetch data if navigating there
    if (targetView === 'pending') {
        fetchPendingLeaves(CURRENT_USER_ROLE);
    } else if (targetView === 'approved') {
        fetchStaffHistory(CURRENT_USER_ROLE, CURRENT_USER_ID);
    }
}

/**
 * Loads the initial data for the Coordinator or Rector dashboard.
 */
// **FIXED:** Declared as 'async'
async function fetchPendingLeaves(role) {
    const title = document.getElementById('pending-title');
    if (title) {
        title.textContent = `Pending Approvals for ${role.toUpperCase()} - ${CURRENT_USER_NAME}`;
    }
    const tableContainer = document.getElementById('pending-leaves-body');
    tableContainer.innerHTML = 'Loading pending leaves...';

    try {
        const response = await fetch(`${API_BASE_URL}fetch_pending_leaves.php?role=${role}&staff_id=${CURRENT_USER_ID}`);
        if (!response.ok) throw new Error('Failed to fetch data.');
        
        const leaves = await response.json();
        renderPendingLeavesTable(leaves, tableContainer, role);

    } catch (error) {
        tableContainer.innerHTML = `<p class="error">Error loading pending leaves: ${error.message}</p>`;
    }
}

/**
 * Renders the table for pending approvals with action buttons.
 */
function renderPendingLeavesTable(leaves, container, role) {
    if (leaves.length === 0) {
        container.innerHTML = `<p class="warning">No leaves currently pending your approval.</p>`;
        return;
    }
    
    const tableHTML = `
        <table class="status-table">
            <thead>
                <tr>
                    <th>Ref. No.</th>
                    <th>Student Info</th>
                    <th>Departure</th>
                    <th>Nature</th>
                    <th>Reason</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${leaves.map(leaf => {
                    const approvalTarget = (role === 'coordinator') ? 'coordinator_approval' : 'rector_approval';
                    // Rector cannot approve 'working' leave until Coordinator has Approved
                    const rectorDisabled = (role === 'rector' && leaf.nature_of_leave === 'working' && leaf.coordinator_approval !== 'Approved');
                    
                    return `
                        <tr data-ref="${leaf.reference_no}">
                            <td><strong>${leaf.reference_no}</strong></td>
                            <td>${leaf.student_name} (${leaf.room_no})</td>
                            <td>${leaf.departure.split(' ')[0]}</td>
                            <td>${leaf.nature_of_leave.toUpperCase()}</td>
                            <td>${leaf.reason}</td>
                            <td>
                                <button class="approve-btn" data-ref="${leaf.reference_no}" data-target="${approvalTarget}" data-status="Approved" ${rectorDisabled ? 'disabled' : ''}>Approve</button>
                                <button class="reject-btn" data-ref="${leaf.reference_no}" data-target="${approvalTarget}" data-status="Rejected">Reject</button>
                                ${rectorDisabled ? '<small class="hint-text">Waiting for Coord.</small>' : ''}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = tableHTML;
    
    // Attach event listeners to the new buttons
    document.querySelectorAll('.approve-btn, .reject-btn').forEach(button => {
        button.addEventListener('click', handleApprovalAction);
    });
}

/**
 * Handles the click event for Approve/Reject buttons, calling the PHP update endpoint.
 */
// **FIXED:** Declared as 'async'
async function handleApprovalAction(event) {
    const button = event.target;
    const ref = button.getAttribute('data-ref');
    const target = button.getAttribute('data-target');
    const status = button.getAttribute('data-status');
    const row = button.closest('tr');

    if (!confirm(`Are you sure you want to set status for ${ref} to ${status}?`)) {
        return;
    }

    button.disabled = true;
    row.style.opacity = 0.5;

    try {
        const response = await fetch(`${API_BASE_URL}update_approval.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ref: ref,
                approval_target: target,
                status: status
            }),
        });

        if (response.ok) {
            // Success: reload the dashboard to update the queue
            alert(`Approval for ${ref} updated to ${status}.`);
            fetchPendingLeaves(CURRENT_USER_ROLE); // Reload pending queue
        } else {
            const errorData = await response.json();
            alert(`Failed to update status: ${errorData.message}`);
        }

    } catch (error) {
        alert('Network Error: Could not reach the server to update status.');
    }
    button.disabled = false;
    row.style.opacity = 1;
}

/**
 * Fetches the staff member's approval/rejection history.
 */
// **FIXED:** Declared as 'async'
async function fetchStaffHistory(role, staffId) {
    const historyContainer = document.getElementById('approved');
    const tableContainer = historyContainer.querySelector('.history-table-container');
    tableContainer.innerHTML = 'Loading approval history...';

    try {
        // This relies on the fetch_staff_history.php file you created
        const response = await fetch(`${API_BASE_URL}fetch_staff_history.php?role=${role}&staff_id=${staffId}`);
        if (!response.ok) throw new Error('Failed to fetch staff history.');
        
        const records = await response.json();
        renderStaffHistoryTable(records, tableContainer, role);

    } catch (error) {
        tableContainer.innerHTML = `<p class="error">Error loading history: ${error.message}</p>`;
    }
}

/**
 * Renders the table for staff approval history.
 */
function renderStaffHistoryTable(records, container, role) {
    if (records.length === 0) {
        container.innerHTML = `<p class="warning">You have not taken any approval actions yet.</p>`;
        return;
    }

    const tableHTML = `
        <table class="status-table">
            <thead>
                <tr>
                    <th>Ref. No.</th>
                    <th>Student Name</th>
                    <th>Departure Date</th>
                    <th>Nature</th>
                    <th>${role === 'coordinator' ? 'Your Status' : 'Final Status'}</th>
                    <th>Rector Status</th>
                </tr>
            </thead>
            <tbody>
                ${records.map(record => {
                    const yourStatus = (role === 'coordinator') ? record.coordinator_approval : record.rector_approval;
                    const rectorStatus = (role === 'coordinator') ? record.rector_approval : 'N/A';
                    
                    return `
                        <tr>
                            <td><strong>${record.reference_no}</strong></td>
                            <td>${record.student_name}</td>
                            <td>${record.departure.split(' ')[0]}</td>
                            <td>${record.nature_of_leave.toUpperCase()}</td>
                            <td>${getStatusTag(yourStatus)}</td>
                            <td>${getStatusTag(rectorStatus)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = tableHTML;
}


// =================================================================
// IV. HELPER FUNCTIONS
// =================================================================

function getStatusTag(status) {
    const lowerStatus = status.toLowerCase();
    let className = 'pending';
    if (lowerStatus === 'approved') className = 'approved';
    else if (lowerStatus === 'rejected') className = 'rejected';
    else if (lowerStatus === 'n/a') className = 'warning';
    return `<span class="status-tag ${className}">${status}</span>`;
}

function getOverallStatus(record) {
    if (record.rector_approval === 'Rejected' || record.coordinator_approval === 'Rejected') {
        return getStatusTag('Rejected');
    }
    
    // Check for "Working" leave full approval (Coord AND Rector)
    if (record.nature_of_leave === 'working' && record.coordinator_approval === 'Approved' && record.rector_approval === 'Approved') {
        return getStatusTag('Approved');
    }
    
    // Check for "Non-Working" leave full approval (Rector only)
    if (record.nature_of_leave === 'non-working' && record.rector_approval === 'Approved') {
        return getStatusTag('Approved');
    }
    
    return getStatusTag('Pending');
}

function displayStatus(message, type, element) {
    element.innerHTML = message;
    element.className = `message-box ${type}`;
}