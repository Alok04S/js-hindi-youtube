// staff_script.js

const API_BASE_URL = 'http://localhost/hostel-backend/'; 

// Mocked Staff Role (This would be set after staff login)
const CURRENT_STAFF_ROLE = 'rector'; // Change to 'coordinator' to test the other view
const STAFF_ID = 'T999';

document.addEventListener('DOMContentLoaded', () => {
    fetchPendingLeaves(CURRENT_STAFF_ROLE);
});

async function fetchPendingLeaves(role) {
    const tableBody = document.getElementById('pending-leaves-body');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}fetch_pending_leaves.php?role=${role}&staff_id=${STAFF_ID}`);
        if (!response.ok) throw new Error('Failed to fetch data.');
        
        const leaves = await response.json();
        renderPendingLeaves(leaves, tableBody, role);

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error loading pending leaves: ${error.message}</td></tr>`;
    }
}

function renderPendingLeaves(leaves, tableBody, role) {
    if (leaves.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No leaves currently pending your approval.</td></tr>`;
        return;
    }

    tableBody.innerHTML = leaves.map(leaf => {
        // Determine what approval status will be set
        const approvalTarget = (role === 'coordinator') ? 'coordinator_approval' : 'rector_approval';
        
        // Disable Rector button if Coordinator hasn't approved yet for a working leave
        const rectorDisabled = (role === 'rector' && leaf.nature_of_leave === 'working' && leaf.coordinator_approval !== 'Approved');
        
        return `
            <tr data-ref="${leaf.reference_no}">
                <td>${leaf.reference_no}</td>
                <td>${leaf.student_name} (${leaf.room_no})</td>
                <td>${leaf.departure.split(' ')[0]}</td>
                <td>${leaf.nature_of_leave.toUpperCase()}</td>
                <td>${leaf.reason}</td>
                <td>
                    <button class="approve-btn" data-approval-target="${approvalTarget}" data-status="Approved" ${rectorDisabled ? 'disabled' : ''}>Approve</button>
                    <button class="reject-btn" data-approval-target="${approvalTarget}" data-status="Rejected">Reject</button>
                </td>
            </tr>
        `;
    }).join('');

    // Attach event listeners to the new buttons
    document.querySelectorAll('.approve-btn, .reject-btn').forEach(button => {
        button.addEventListener('click', handleApprovalAction);
    });
}

// ... (handleApprovalAction function will call another PHP script: update_approval.php) ...