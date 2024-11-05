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

// Function to fetch Church Members and display them in a table
function fetchMembers() {
    fetch('/church_members')
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = ''; // Clear previous results
            if (data.length === 0) {
                resultsContainer.innerHTML = '<p>No church members found.</p>';
                return;
            }

            // Create the table and headers for Church Members
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Scholar ID</th>
                        <th>Scholar Name</th>
                        <th>Total Fellowship</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;

            // Populate the table with member data
            data.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${member.scholar_id}</td>
                    <td>${member.name}</td>
                    <td>${member.total_fellowship}</td>
                `;
                table.querySelector('tbody').appendChild(row);
            });

            // Append the table to the results container
            resultsContainer.appendChild(table);
        })
        .catch(error => console.error('Error fetching members:', error));
}

// Function to fetch Church Personnel and display them in a table
function fetchPersonnel() {
    fetch('/church_personnel')
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = ''; // Clear previous results
            if (data.length === 0) {
                resultsContainer.innerHTML = '<p>No church personnel found.</p>';
                return;
            }

            // Create the table and headers for Church Personnel
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Personnel Name</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;

            // Populate the table with personnel data
            data.forEach(personnel => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${personnel.ch_personnel_name}</td>
                    <td>${personnel.ch_personnel_email}</td>
                `;
                table.querySelector('tbody').appendChild(row);
            });

            // Append the table to the results container
            resultsContainer.appendChild(table);
        })
        .catch(error => console.error('Error fetching personnel:', error));
}

// Function to toggle dropdown menu visibility
function toggleDropdown(id) {
    const menu = document.getElementById(id);
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}
