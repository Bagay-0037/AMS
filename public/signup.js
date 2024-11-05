document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display the next scholar ID
    fetch('/nextScholarId')
        .then(response => response.json())
        .then(data => {
            document.getElementById('scholarId').value = data.nextScholarId; // Populate the Scholar ID field
        })
        .catch(error => console.error('Error fetching next scholar ID:', error));
    // Fetch and populate departments
    fetch('/departments')
        .then(response => response.json())
        .then(data => {
            const departmentSelect = document.getElementById('department');
            data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.dept_name;
                option.textContent = dept.dept_name;
                departmentSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading departments:', error));

    // Fetch and populate schedules
    fetch('/schedules')
        .then(response => response.json())
        .then(data => {
            const scheduleSelect = document.getElementById('schedule');
            data.forEach(schedule => {
                const option = document.createElement('option');
                option.value = schedule.schedule;
                option.textContent = schedule.schedule;
                scheduleSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading schedules:', error));

    // Fetch and populate churches
    fetch('/churches')
        .then(response => response.json())
        .then(data => {
            const churchSelect = document.getElementById('church');
            data.forEach(church => {
                const option = document.createElement('option');
                option.value = church.church_name;
                option.textContent = church.church_name;
                churchSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading churches:', error));

    
});

document.getElementById('signupForm').addEventListener('submit', function(event) {
    const password = document.getElementById('password').value.trim(); // Trim whitespace
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,}$/;

    if (!passwordRegex.test(password)) {
        event.preventDefault(); // Prevent form submission
        alert('Password must be at least 12 characters long and include uppercase letters, lowercase letters, numbers, and special characters.');
    }
});

