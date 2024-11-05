// Function to display the greeting based on time
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

function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function fetchMembers() {
    fetch('/deptMembers')
        .then(response => response.json())
        .then(data => {
            let table = '<table><tr><th>Scholar ID</th><th>Scholar Name</th><th>Schedule</th><th>Total Time</th></tr>';
            data.forEach(member => {
                table += `<tr>
                    <td>${member.scholar_id}</td>
                    <td>${member.name}</td>
                    <td>${member.schedule}</td>
                    <td>${member.total_time ? member.total_time : 'No logs yet'}</td>
                </tr>`;
            });
            table += '</table>';
            document.getElementById('results').innerHTML = table;
        })
        .catch(error => {
            console.error('Error fetching department members:', error);
        });
}

function fetchPersonnel() {
    fetch('/deptPersonnel')
        .then(response => response.json())
        .then(data => {
            let table = '<table><tr><th>Personnel Name</th><th>Email</th></tr>';
            data.forEach(personnel => {
                table += `<tr>
                    <td>${personnel.personnel_name}</td>
                    <td>${personnel.personnel_email}</td>
                </tr>`;
            });
            table += '</table>';
            document.getElementById('results').innerHTML = table;
        })
        .catch(error => {
            console.error('Error fetching department personnel:', error);
        });
}

