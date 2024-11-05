document.addEventListener('DOMContentLoaded', function() {
    // Toggle members list visibility and fetch scholars when 'members' is clicked
    document.getElementById('members').addEventListener('click', function() {
        const membersList = document.getElementById('membersList');
        const scannerSection = document.getElementById('scannerSection');
        membersList.style.display = membersList.style.display === 'none' ? 'block' : 'none';
        scannerSection.style.display = 'none';
        
        // Fetch scholars from the server using the church ID from the session
        fetch('/get_scholars')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const scholarList = document.getElementById('scholarList');
                scholarList.innerHTML = ''; // Clear previous list
                
                if (data.length > 0) {
                    // Create table rows dynamically based on the data
                    data.forEach(scholar => {
                        const row = `<tr>
                                        <td>${scholar.scholar_id}</td>
                                        <td>${scholar.name}</td>
                                     </tr>`;
                        scholarList.innerHTML += row; // Append each row to the table
                    });
                } else {
                    scholarList.innerHTML = '<tr><td colspan="2">No members found for your church.</td></tr>';
                }
            })
            .catch(err => {
                console.error('Error fetching scholars:', err);
            });
    });
});


let lastScannedCode = null;
let lastScanTime = 0;
const scanCooldown = 5000; // 5 seconds cooldown period

// Function to format date to MySQL DATETIME format
function formatDateToMySQL(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

let isCooldownActive = false;
// Function to handle QR code scanning
function onQRCodeScanned(qrCode) {
    const currentTime = new Date().getTime();

    if (qrCode === lastScannedCode && (currentTime - lastScanTime) < scanCooldown) {
        if (!isCooldownActive) {
            displayNotification('Please wait before scanning the same QR code again.', 'error');
            isCooldownActive = true; // Set cooldown flag to true
        }
        return;
    }

    const scholarIdMatch = qrCode.match(/scholar_id:(\d+)/);

    if (scholarIdMatch) {
        const scholarId = scholarIdMatch[1];

        // First, fetch scholar's church ID to compare with the logged-in church personnel's church ID
        fetch(`/get_scholar_church/${scholarId}`)
            .then(response => response.json())
            .then(data => {
                const scholarChurchId = data.church_id;

                // Compare scholar's church ID with personnel's church ID stored in session
                if (data.same_church) {
                    // Convert current date and time to Philippine timezone (UTC+8)
                    const currentDateTime = new Date();
                    const philippinesOffset = 8 * 60 * 60 * 1000; // UTC+8 offset
                    const philippineTime = new Date(currentDateTime.getTime() + philippinesOffset);
                    const formattedDateTime = formatDateToMySQL(philippineTime); // Format for MySQL

                    // Proceed to record fellowship
                    fetch('/record-fellowship', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            scholar_id: scholarId,
                            fellowship: formattedDateTime
                        })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            displayNotification(`Fellowship recorded. Total fellowship count: ${result.total_fellowship}`, 'success');
                        } else {
                            displayNotification('Error recording fellowship.', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error recording fellowship:', error);
                        displayNotification('Error connecting to the server.', 'error');
                    });
                } else {
                    // If different church, notify personnel
                    displayNotification('This scholar is from a different church.', 'error');
                    console.error('Different church scanned!');
                }
            })
            .catch(err => {
                console.error('Error fetching scholar church ID:', err);
            });

        lastScannedCode = qrCode;
        lastScanTime = currentTime;
    } else {
        displayNotification('Invalid QR code format.', 'error');
    }
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
    }
);


function displayNotification(message, type) {
    const notificationContainer = document.getElementById('notificationContainer');
    
    // Create a new notification element
    const notificationDiv = document.createElement('div');
    notificationDiv.textContent = message; // Set the message text
    notificationDiv.classList.add(type); // Add success or error class
    
    // Style the notificationDiv for visibility (optional, can be customized in CSS)
    notificationDiv.style.marginTop = '10px'; // Add spacing between notifications
    notificationDiv.style.padding = '10px';
    notificationDiv.style.border = '1px solid #ccc';
    notificationDiv.style.borderRadius = '5px';

    // Add the new notification to the container
    notificationContainer.appendChild(notificationDiv);

    // Hide the notification after 10 seconds
    setTimeout(() => {
        notificationDiv.style.display = 'none'; // Or remove it completely
    }, 10000); // Hide after 10 seconds
}

    