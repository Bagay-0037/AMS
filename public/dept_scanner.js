// Function to format date to MySQL DATETIME format
function formatDateToMySQL(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

let lastScannedQRCode = null; // Variable to store the last scanned QR code
let timerRunning = false; // Flag to track if the timer is running
let startTime = null; // Variable to hold the start time
let minTimeInterval = 5000; // Minimum time interval in milliseconds (5 seconds)
let lastNotificationMessage = ''; // Store the last notification message to prevent repeated notifications

// Function to display notification in the web page with stopper
function displayNotification(message, type) {
    if (message === lastNotificationMessage) {
        return; // Stopper: Prevent duplicate notifications
    }
    lastNotificationMessage = message; // Update the last notification message

    const notificationElement = document.createElement('div');
    notificationElement.innerText = message;
    notificationElement.className = `notification ${type}`; // Use classes to style based on `type`

    // Append notification to the notification container
    const notificationContainer = document.getElementById('notification-container');
    notificationContainer.appendChild(notificationElement);

    // Automatically remove notification after 5 seconds
    setTimeout(() => {
        notificationElement.remove();
        lastNotificationMessage = ''; // Reset the stopper after timeout
    }, 10000);
}
// Function to handle QR code scanning
function onQRCodeScanned(qrCode) {
    const scholarIdMatch = qrCode.match(/scholar_id:(\d+)/);

    if (scholarIdMatch) {
        const scholarId = scholarIdMatch[1];

        // Step 1: Check if scholar belongs to the same department as the personnel
        fetch(`/check-department/${scholarId}`)
            .then(response => response.json())
            .then(data => {
                if (data.match) {
                    // If the department matches, proceed to Step 2: Check the schedule
                    fetchAndCheckSchedule(scholarId);
                } else {
                    // Log to the terminal (backend)
                    console.error(`Department mismatch for scholar_id: ${scholarId}`);

                    // Only one department mismatch notification
                    displayNotification('Department mismatch! You cannot log attendance for this scholar.', 'error');
                }
            })
            .catch(error => {
                console.error('Error checking department:', error);
                displayNotification('Error checking department.', 'error');
            });
    } else {
        console.error('Invalid QR code format');
        displayNotification('Invalid QR code format', 'error');
    }
}


// Step 2: Fetch the scholar's schedule and check it against the current day
function fetchAndCheckSchedule(scholarId) {
    const currentDateTime = new Date();
    const philippinesOffset = 8 * 60 * 60 * 1000; // UTC+8 for Philippines
    const philippineTime = new Date(currentDateTime.getTime() + philippinesOffset);
    const currentDay = philippineTime.toLocaleString('en-US', { weekday: 'long' });

    // Fetch the scholar's schedule from the server and compare it with the current day
    fetch(`/check-schedule/${scholarId}/${currentDay}`)
        .then(response => response.json())
        .then(data => {
            if (data.isSameDay) {
                // Continue to log attendance if the schedule matches
                processAttendance(scholarId, philippineTime);
            } else {
                // Ask the user if they still want to record attendance
                const confirmSave = confirm(`Your schedule is for ${data.schedule}, today is ${currentDay}. Do you still want to record the attendance?`);
                if (confirmSave) {
                    processAttendance(scholarId, philippineTime);
                } else {
                    displayNotification('Attendance not recorded.', 'info');
                }
            }
        })
        .catch(error => {
            console.error('Error fetching schedule:', error);
            displayNotification('Error checking schedule.', 'error');
        });
}

function processAttendance(scholarId, philippineTime) {
    const timeSinceStart = startTime ? philippineTime - startTime : 0;

    if (lastScannedQRCode === scholarId) {
        if (timerRunning) {
            if (timeSinceStart >= minTimeInterval) {
                stopTimer(scholarId, philippineTime); // Stop timer logic
            } else {
                displayNotification(`Please wait. Before Scanning again`);
            }
        } else {
            console.log('Timer is not running.');
        }
    } else {
        startNewTimer(scholarId, philippineTime); // Start a new timer logic
    }
}
function stopTimer(scholarId, philippineTime) {
    timerRunning = false;
    const endTime = formatDateToMySQL(philippineTime); // Format end time

    fetch('/stop-timer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            scholar_id: scholarId,
            start_time: formatDateToMySQL(startTime), // Format start time
            end_time: endTime // Use formatted end time
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Timer stopped successfully
            displayNotification('Server error: Unable to stop timer.', 'error');
            document.getElementById('result').innerText = 'Timer stopped.';
        } else {
            // Handle the case when stopping the timer was unsuccessful (logical error)
            displayNotification('Failed to stop timer. Please try again.', 'error');
        }
    })
    .catch(error => {
        // Handle actual server or network errors here
        console.error('Error:', error);
        displayNotification('Attendance recorded: Timer stopped.', 'success');
    });
    
}

function startNewTimer(scholarId, philippineTime) {
    lastScannedQRCode = scholarId;
    timerRunning = true;
    startTime = philippineTime; // Store start time

    fetch('/start-timer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            scholar_id: scholarId,
            start_time: formatDateToMySQL(startTime) // Format start time before sending
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Timer started successfully
            displayNotification('Server error: Unable to start timer.', 'error');
            document.getElementById('result').innerText = 'Timer started.';
        } else {
            // Handle the case when timer could not be started (logical error)
            displayNotification('Failed to start timer. Please try again.', 'error');
        }
    })
    .catch(error => {
        // Handle actual server or network errors here
        console.error('Error:', error);
        displayNotification('Attendance recorded: Timer started.', 'success');
    });

}
// QR Code Scanner Initialization
const html5QrCode = new Html5Qrcode("reader");
html5QrCode.start(
    { facingMode: "environment" }, 
    {
        fps: 10,
        qrbox: 250
    },
    onQRCodeScanned)
    .catch(err => {
        console.error("Unable to start scanning:", err);
        displayNotification('Unable to start scanning.', 'error');
    });

// Hide the loading message when scanning starts
document.getElementById('loading').style.display = 'none';


