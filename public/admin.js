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

function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Function to display Department Admin information
function showDepartmentAdmin() {
    document.getElementById('deletePosts').style.display = 'none';
    document.getElementById('admin-info').style.display = 'block';
    fetch('/department-admins')
        .then(response => response.json())
        .then(data => {
            let tableContent = `
                <table>
                    <tr>
                        <th>Admin Name</th>
                        <th>Department</th>
                        <th>Total Members</th>
                        <th>Total Personnel</th>
                    </tr>
            `;
            data.forEach(admin => {
                tableContent += `
                    <tr>
                        <td>${admin.deptAdmin_name}</td>
                        <td>${admin.dept_name}</td>
                        <td>${admin.total_members}</td>
                        <td>${admin.total_personnel}</td>
                    </tr>
                `;
            });
            tableContent += `</table>`;
            document.getElementById('admin-info').innerHTML = tableContent;
        })
        .catch(error => console.error('Error fetching department admin data:', error));
}

// Function to display Church Admin information
function showChurchAdmin() {
    document.getElementById('deletePosts').style.display = 'none';
    document.getElementById('admin-info').style.display = 'block';
    fetch('/church-admins')
        .then(response => response.json())
        .then(data => {
            let tableContent = `
                <table>
                    <tr>
                        <th>Admin Name</th>
                        <th>Church</th>
                        <th>Total Members</th>
                        <th>Total Personnel</th>
                    </tr>
            `;
            data.forEach(admin => {
                tableContent += `
                    <tr>
                        <td>${admin.chAdmin_name}</td>
                        <td>${admin.church_name}</td>
                        <td>${admin.total_members}</td>
                        <td>${admin.total_personnel}</td>
                    </tr>
                `;
            });
            tableContent += `</table>`;
            document.getElementById('admin-info').innerHTML = tableContent;
        })
        .catch(error => console.error('Error fetching church admin data:', error));
}

function showScholars() {
    document.getElementById('deletePosts').style.display = 'none';
    document.getElementById('admin-info').style.display = 'block';
    fetch('/all-scholars')
        .then(response => response.json())
        .then(data => {
            let tableContent = `
                <table>
                    <tr>
                        <th>Scholar ID</th>
                        <th>Name</th>
                        <th>Total Time</th>
                        <th>Total Fellowship</th>
                    </tr>
            `;
            data.forEach(scholar => {
                tableContent += `
                    <tr>
                        <td>${scholar.scholar_id}</td>
                        <td>${scholar.name}</td>
                        <td>${scholar.total_duty_time}</td>
                        <td>${scholar.total_fellowship}</td>
                    </tr>
                `;
            });
            tableContent += `</table>`;
            document.getElementById('admin-info').innerHTML = tableContent;
        })
        .catch(error => console.error('Error fetching scholars data:', error));
}

// Admin.js
function uploadFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const uploadedImage = e.target.result;
            // Get previously stored files or initialize an empty array
            let files = JSON.parse(localStorage.getItem('whatsNewFiles')) || [];
            // Insert the new file at the beginning of the array (most recent first)
            files.unshift(uploadedImage);
            // Keep only the latest 3 files
            if (files.length > 3) files = files.slice(0, 3);
            // Store updated files
            localStorage.setItem('whatsNewFiles', JSON.stringify(files));
            alert("File uploaded successfully!");
        };
        reader.readAsDataURL(file);
    }
}
// Function to display files with delete option (only for admin view)
function showAdminWhatsNew() {
    const whatsNewContainer = document.getElementById('whatsNewContainer');
    whatsNewContainer.innerHTML = ""; // Clear the existing content
    const files = JSON.parse(localStorage.getItem('whatsNewFiles')) || [];

    files.forEach((file, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';  // Add class for styling the image container

        const imgElement = document.createElement('img');
        imgElement.src = file;
        imgElement.alt = `Uploaded file ${index + 1}`;
        imgElement.className = 'uploaded-image'; // Apply class to style the image

        // Create delete button (only in admin view)
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';

        // Add event listener to delete the image
        deleteButton.addEventListener('click', () => {
            deleteUploadedFile(index);
        });

        imgContainer.appendChild(imgElement);
        imgContainer.appendChild(deleteButton); // Append the delete button

        whatsNewContainer.appendChild(imgContainer);
    });
}



function showDeletePost() {
    // Hide all sections
    document.querySelectorAll('.content').forEach(content => content.classList.add('hidden-content'));
    
    // Show the delete post section only
    document.getElementById('delete-post-section').classList.remove('hidden-content');
    
    // Display the posts available for deletion
    displayPostsForDeletion();
}


function displayPostsForDeletion() {

    document.getElementById('deletePosts').style.display = 'block';
    document.getElementById('admin-info').style.display = 'none';
     

    const deletePostsContainer = document.getElementById('deletePosts');
    deletePostsContainer.innerHTML = ""; // Clear previous content
    const files = JSON.parse(localStorage.getItem('whatsNewFiles')) || [];
    
    if (files.length === 0) {
        deletePostsContainer.innerHTML = '<p>No posts available for deletion.</p>'; // Message if no files exist
        return;
    }
    
    files.forEach((file, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';  // Add class for styling the image container
        
        const imgElement = document.createElement('img');
        imgElement.src = file;
        imgElement.alt = `Uploaded file ${index + 1}`;
        imgElement.className = 'uploaded-image'; // Apply class to style the image

        // Create a delete button for each image
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = function() {
            deleteFile(index);
        };

        imgContainer.appendChild(imgElement);
        imgContainer.appendChild(deleteButton); // Add delete button to the container
        deletePostsContainer.appendChild(imgContainer);
    });
}

function deleteFile(index) {
    let files = JSON.parse(localStorage.getItem('whatsNewFiles')) || [];
    if (index > -1) {
        files.splice(index, 1); // Remove the file from the array
    }
    localStorage.setItem('whatsNewFiles', JSON.stringify(files)); // Update the local storage
    alert("File deleted successfully!");
    displayPostsForDeletion(); // Refresh the display
}
