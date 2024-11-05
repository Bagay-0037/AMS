// Greeting Start
function displayGreeting() {
    const greetingElement = document.getElementById('greeting');
    const hours = new Date().getHours();
    let greeting = 'Good Day!';

    if (hours < 12) {
        greeting = 'Good Morning!';
    } else if (hours >= 12 && hours < 18) {
        greeting = 'Good Afternoon!';
    } else {
        greeting = 'Good Evening!';
    }

    greetingElement.textContent = greeting;
}

window.onload = displayGreeting;
// Greeting End

function toggleDropdown(id) {
    const menu = document.getElementById(id);
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function toggleQRCode() {
    const qrCodeSection = document.getElementById('qrCodeSection');
    qrCodeSection.style.display = (qrCodeSection.style.display === 'block') ? 'none' : 'block';
}

// Toggle the visibility of the submenu for Settings
function toggleSettings() {
    const settingsMenu = document.getElementById('monitoringMenu');
    settingsMenu.style.display = (settingsMenu.style.display === "block") ? "none" : "block";
}

// Event listeners for menu buttons
document.querySelector('.menu-button[onclick*="toggleSettings()"]').addEventListener('click', toggleSettings);

// Function to show the selected content and hide the others
function showContent(section) {
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => {
        content.classList.remove('shown'); // Hide all sections
        content.classList.add('hidden-content'); // Ensure they are hidden
    });

    const selectedContent = document.getElementById(section);
    if (selectedContent) {
        selectedContent.classList.remove('hidden-content'); // Remove hidden class
        selectedContent.classList.add('shown'); // Add shown class
    }
}

// Show only the scholar dashboard with the log table and total time
// Other functions remain unchanged...

function showScholarData() {
    document.getElementById('qrCodeSection').style.display = 'none'; // Hide QR Code section
    document.getElementById('scholarDashboard').style.display = 'block'; // Show the scholar dashboard
    document.getElementById('logTable').style.display = 'block'; // Show the log table
    document.getElementById('totalTimeSection').style.display = 'block'; // Show total time section
    document.getElementById('scheduleInfo').style.display = 'none'; // Hide schedule info
    document.getElementById('fellowshipTable').style.display = 'none'; // Hide fellowship table
    document.getElementById('totalFellowshipSection').style.display = 'none'; // Hide total fellowship section
   
    // Fetch scholar logs
    fetch('/dashboard') // Ensure this endpoint is correct
        .then(response => response.json())
        .then(data => {
            const logTableBody = document.getElementById('logTableBody');
            let totalTime = 0;

            // Clear existing rows
            logTableBody.innerHTML = '';

            // Show the table
            const logTable = document.getElementById('logTable');
            logTable.style.display = 'table'; // Show the table

            // Loop through the log data and create table rows
            if (data.length === 0) {
                const row = document.createElement('tr');
                const noDataCell = document.createElement('td');
                noDataCell.colSpan = 5; // Span across all columns
                noDataCell.textContent = 'No records found.';
                row.appendChild(noDataCell);
                logTableBody.appendChild(row);
            } else {
                data.forEach(log => {
                    const row = document.createElement('tr');

                    const nameCell = document.createElement('td');
                    nameCell.textContent = log.name;

                    const deptCell = document.createElement('td');
                    deptCell.textContent = log.dept_name;

                    const startTimeCell = document.createElement('td');
                    startTimeCell.textContent = new Date(log.start_time).toLocaleString();

                    const endTimeCell = document.createElement('td');
                    endTimeCell.textContent = log.end_time ? new Date(log.end_time).toLocaleString() : 'N/A';

                    const totalDutyTimeCell = document.createElement('td');
                    totalDutyTimeCell.textContent = log.total_duty_time || 'N/A';

                    row.appendChild(nameCell);
                    row.appendChild(deptCell);
                    row.appendChild(startTimeCell);
                    row.appendChild(endTimeCell);
                    row.appendChild(totalDutyTimeCell);

                    logTableBody.appendChild(row);

                    // Calculate the total time in seconds and add it to the total
                    if (log.total_duty_time) {
                        const [hours, minutes, seconds] = log.total_duty_time.split(':').map(Number);
                        totalTime += hours * 3600 + minutes * 60 + seconds;
                    }
                });
            }

            // Update the total time display
            const totalTimeDisplay = document.getElementById('totalTimeValue');
            const hours = Math.floor(totalTime / 3600);
            const minutes = Math.floor((totalTime % 3600) / 60);
            const seconds = totalTime % 60;
            totalTimeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Check completion status and display below Total Time
            const completionDiv = document.getElementById('completion-status'); // Ensure this div is below the Total Time display
            const completionThreshold = localStorage.getItem('completionThreshold') || (60 * 3600);

            // Display completion status
            if (totalTime >= completionThreshold) {
                completionDiv.textContent = "COMPLETED";
                 // Display Completed if the time is enough
                displayCertificate(data[0].name, totalTime);
            } else {
                completionDiv.textContent = ""; // Clear if not completed
                document.getElementById('certificateSection').style.display = 'none';
            }
        })
        .catch(error => console.error('Error fetching scholar logs:', error));
        
}
function displayCertificate(scholarName, totalFellowship) {
    const certificateSection = document.getElementById('certificateSection');
    const scholarNameDisplay = document.getElementById('scholarNameDisplay');
    const totalFellowshipDisplay = document.getElementById('totalFellowshipDisplay');
    const dateIssuedDisplay = document.getElementById('dateIssued');


    // Show certificate details
    scholarNameDisplay.textContent = scholarName;
    totalFellowshipDisplay.textContent = totalFellowship; // Use totalFellowship hours from your data
    dateIssuedDisplay.textContent = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Show the certificate section
    certificateSection.style.display = 'block';
}


function downloadCertificate() {
    const certificateSection = document.getElementById('certificateSection');

    html2canvas(certificateSection).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a3');
        

        // Add the image to the PDF and save it
        pdf.addImage(imgData, 'PNG', 111, 111);
        pdf.save('certificate.pdf'); // You can change the filename as needed
    });
}



function toggleQRCode() {
    document.getElementById('scholarDashboard').style.display = 'none';
    document.getElementById('logTable').style.display = 'none';
    document.getElementById('totalTimeSection').style.display = 'none';
    document.getElementById('scheduleInfo').style.display = 'none';
    document.getElementById('fellowshipTable').style.display = 'none'; // Hide fellowship table
    document.getElementById('totalFellowshipSection').style.display = 'none';
    document.getElementById('certificateSection').style.display = 'none';
    const qrCodeSection = document.getElementById('qrCodeSection');
    qrCodeSection.style.display = 'block';

    fetch('/get-qr-code')
        .then(response => response.json())
        .then(data => {
            if (data.qr_code) {
                const qrCodeImage = document.getElementById('qrCodeImage');
                qrCodeImage.src = data.qr_code;  // Set the image source to the QR code
            } else {
                alert('No QR code found for this scholar.');
            }
        })
        .catch(error => console.error('Error fetching QR code:', error));
}

function showSchedule() {
    document.getElementById('scholarDashboard').style.display = 'none';
    document.getElementById('logTable').style.display = 'none';
    document.getElementById('totalTimeSection').style.display = 'none';
    document.getElementById('qrCodeSection').style.display = 'none';
    document.getElementById('fellowshipTable').style.display = 'none';
    document.getElementById('totalFellowshipSection').style.display = 'none'; // Hide fellowship table
    document.getElementById('certificateSection').style.display = 'none';

    fetch('/schedule')
        .then(response => response.json())
        .then(data => {
            const scheduleInfoDiv = document.getElementById('scheduleInfo');
            scheduleInfoDiv.innerHTML = ''; // Clear any previous content

            if (data.error) {
                scheduleInfoDiv.textContent = data.error;
            } else {
                // Display the scholar's name, department, and schedule
                scheduleInfoDiv.innerHTML = `
                    <h1>My Schedule</h1><br>
                    <p><strong>${data.name}</strong></p>
                    <h5>Name</h5><br>
                    <p><strong>${data.dept_name}</strong></p>
                    <h5>Department</h5><br>
                    <p><strong>${data.schedule}</strong></p>
                    <h5>Schedule</h5><br>
                `;
            }

            scheduleInfoDiv.style.display = 'block'; // Show the schedule info div
        })
        .catch(error => {
            console.error('Error fetching schedule:', error);
        });
}


function showFellowshipData() {
    document.getElementById('qrCodeSection').style.display = 'none'; // Hide QR Code section
    document.getElementById('scholarDashboard').style.display = 'none'; // Hide the scholar dashboard
    document.getElementById('logTable').style.display = 'none'; // Hide the log table
    document.getElementById('totalTimeSection').style.display = 'none'; // Hide the total time section
    document.getElementById('scheduleInfo').style.display = 'none'; // Hide schedule info
    document.getElementById('fellowshipTable').style.display = 'block'; // Show the fellowship table
    document.getElementById('totalFellowshipSection').style.display = 'block'; // Show the total fellowship section
    document.getElementById('certificateSection').style.display = 'none';

    // Fetch and populate the fellowship data
    fetch('/fellowship-dashboard') // Ensure this endpoint is correct
        .then(response => response.json())
        .then(data => {
            const fellowshipTableBody = document.getElementById('fellowshipTableBody');

            // Clear existing rows
            fellowshipTableBody.innerHTML = '';

            // Show the fellowship table
            const fellowshipTable = document.getElementById('fellowshipTable');
            fellowshipTable.style.display = 'table'; // Show the table

            // Initialize total fellowship counter
            let totalFellowship = 0;

            // Populate the fellowship data here...
            data.forEach(record => {
                const row = document.createElement('tr');
                
                const scholarNameCell = document.createElement('td');
                scholarNameCell.textContent = record.name;

                const churchCell = document.createElement('td');
                churchCell.textContent = record.church_name;

                const fellowshipCell = document.createElement('td');
                fellowshipCell.textContent = record.fellowship;

                row.appendChild(scholarNameCell);
                row.appendChild(churchCell);
                row.appendChild(fellowshipCell);

                fellowshipTableBody.appendChild(row);

                // Add to total fellowship
                totalFellowship = record.total_fellowship; // Assuming total_fellowship is an integer
            });

            // Display the total fellowship
            document.getElementById('totalFellowshipValue').textContent = totalFellowship;
        })
        .catch(error => console.error('Error fetching fellowship data:', error));
}
