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

// Menu Start
function toggleDropdown(id) {
    const menu = document.getElementById(id);
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}
// Menu End

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
