//Greeting Start
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
//Greeting End

//Menu Start
function toggleDropdown(id) {
    var menu = document.getElementById(id);
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } 
    else {
        menu.style.display = "block";
    }
}
//Menu End

// Function to show the selected content and hide the others 
function showContent(section) {
    // Hide all content sections
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => {
        content.classList.remove('shown'); // Hide all sections
        content.classList.add('hidden-content'); // Ensure they are hidden
    });

    // Show the selected section
    const selectedContent = document.getElementById(section);
    if (selectedContent) {
        selectedContent.classList.remove('hidden-content'); // Remove hidden class
        selectedContent.classList.add('shown'); // Add shown class
    }
}

function showWhatsNew() {
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

        imgContainer.appendChild(imgElement);
        whatsNewContainer.appendChild(imgContainer);
    });

    showContent('whats-new'); // Show the "What's New" section
}

// Add this to load the images when "What's New" is clicked
function showContent(section) {
    // Hide all sections
    document.querySelectorAll('.content').forEach(content => content.classList.add('hidden-content'));
    // Show selected section
    document.getElementById(section).classList.remove('hidden-content');
    if (section === 'whats-new') {
        showWhatsNew();
    }
}