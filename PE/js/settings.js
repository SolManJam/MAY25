// settings.js
// Settings JavaScript for the US Presidents Game
// Date: June 28, 2025

document.addEventListener('DOMContentLoaded', function() {
    // Load current settings from local storage, with defaults if none exist
    const mode = localStorage.getItem('gameMode') || 'number';
    const difficulty = localStorage.getItem('gameDifficulty') || '3';
    
    // Set the radio buttons to reflect the current settings
    document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
    document.querySelector(`input[name="difficulty"][value="${difficulty}"]`).checked = true;
});

// Handle the "Save" button: save settings and redirect
document.getElementById('saveButton').addEventListener('click', function() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    
    localStorage.setItem('gameMode', selectedMode);
    localStorage.setItem('gameDifficulty', selectedDifficulty);
    
    window.location.href = '../main_menu.html';
});

// Handle the "Back" button: redirect without saving
document.getElementById('backButton').addEventListener('click', function() {
    window.location.href = '../main_menu.html';
});