// Simplified JavaScript for display testing

let currentDifficulty = 3; // Default difficulty level

// Static list of presidents for Report Card (hypothetical data)
const presidents = [
    "Washington (1789-1797)", "Adams (1797-1801)", "Jefferson (1801-1809)", "Madison (1809-1817)",
    "Monroe (1817-1825)", "J.Q. Adams (1825-1829)", "Jackson (1829-1837)", "Van Buren (1837-1841)",
    "W.H. Harrison (1841)", "Tyler (1841-1845)"
];

// Placeholder hints
const placeholderHints = [
    "This president served during a major war.",
    "Known for a famous speech.",
    "Implemented significant economic policies.",
    "Faced a major scandal during their term.",
    "Expanded the territory of the United States.",
    "Signed important legislation into law.",
    "Dealt with international conflicts.",
    "Focused on civil rights issues.",
    "Had a significant impact on the economy.",
    "Left a lasting legacy in American history."
];

// Game state
let correctIndex;
let clickCount = 0;
let incorrectClicks = [];

// Hide all screens to control visibility
function hideAllScreens() {
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('reportCard').style.display = 'none';
    document.getElementById('fullScreenView').style.display = 'none';
    document.getElementById('finalMessage').style.display = 'none';
    document.getElementById('overallTop10').style.display = 'none';
    document.getElementById('speedrunTop10').style.display = 'none';
    document.getElementById('scoreSubmission').style.display = 'none';
    document.getElementById('settingsPopup').style.display = 'none';
}

// Show a message in the message area
function showMessage(text) {
    const messageElement = document.getElementById('message');
    if (text) {
        messageElement.innerHTML = `<span class="cloud-text">${text} <i class="fas fa-cog gear-icon" title="Settings"></i></span>`;
        messageElement.style.display = 'block';
    } else {
        messageElement.innerHTML = '';
        messageElement.style.display = 'none';
    }
}

// Set button heights to match image height for larger screens only
function setButtonHeights() {
    const image = document.getElementById('currentImage');
    const rightSide = document.getElementById('rightSide');
    const optionDivs = document.querySelectorAll('.option');
    const visibleOptions = Array.from(optionDivs).filter(div => div.style.display !== 'none');
    const numButtons = visibleOptions.length;
    const imageHeight = image.offsetHeight;

    if (window.innerWidth > 480) {
        const gap = 5; // Gap between buttons in pixels
        const totalGap = (numButtons - 1) * gap;
        const buttonHeight = (imageHeight - totalGap) / numButtons;
        rightSide.style.height = `${imageHeight}px`;
        visibleOptions.forEach(div => {
            div.style.height = `${buttonHeight}px`;
        });
    } else {
        // Mobile layout: let CSS handle heights
        rightSide.style.height = 'auto';
        visibleOptions.forEach(div => {
            div.style.height = 'auto';
        });
    }
}

// Update the number of visible options based on difficulty
function updateOptionsDisplay(difficulty) {
    // Safeguard: Ensure difficulty is 3 or 4
    difficulty = Math.min(Math.max(difficulty, 3), 4);
    const optionDivs = document.querySelectorAll('.option');
    optionDivs.forEach((div, index) => {
        if (index < difficulty) {
            div.style.display = 'block';
        } else {
            div.style.display = 'none';
        }
    });
    // Delay height adjustment to ensure layout updates
    setTimeout(() => setButtonHeights(), 0);
}

// Reset game function
function resetGame() {
    clickCount = 0;
    incorrectClicks = [];
    const optionDivs = document.querySelectorAll('.option');
    const visibleOptions = Array.from(optionDivs).filter(div => div.style.display !== 'none');
    correctIndex = Math.floor(Math.random() * visibleOptions.length);
    visibleOptions.forEach((div, index) => {
        div.innerText = (index + 1).toString();
        div.classList.remove('disabled', 'try-again', 'hints', 'correct');
        div.style.pointerEvents = 'auto';
    });
    setButtonHeights();
}

// Populate Report Card with hypothetical stats
function populateReportCard() {
    hideAllScreens();
    const columns = document.querySelectorAll('.report-column');
    columns.forEach((col, index) => {
        const round = index + 1;
        const percentage = 80;
        const correct = 8;
        const total = 10;
        const presidentsList = presidents.slice(0, 10);
        const missedIndices = [1, 3, 5];
        const entries = presidentsList.map((name, i) => {
            const isMissed = missedIndices.includes(i);
            return `<div class="${isMissed ? 'missed' : ''}">${name}</div>`;
        });
        const displayList = entries.join('') + `<a href="#" class="showMore" data-column="${round}">show more</a>`;
        col.innerHTML = `<div class="cloud-text"><p class="percentage">${percentage}%</p><h3>Round ${round}: ${correct}/${total}</h3>${displayList}</div>`;
    });
    document.getElementById('roundIndicator').innerText = `Rd 1/9`;
    document.getElementById('reportCard').style.display = 'block';
}

// Show full list of presidents for a column
function showFullList(column) {
    hideAllScreens();
    const gridContainer = document.getElementById('gridContainer');
    gridContainer.innerHTML = '';
    const presidentsList = presidents;
    const missedIndices = [1, 3, 5, 7, 9];
    const entries = presidentsList.map((name, i) => {
        const isMissed = missedIndices.includes(i);
        return `<div class="cloud-text ${isMissed ? 'missed' : ''}">${name}</div>`;
    });
    gridContainer.innerHTML = entries.join('');
    document.getElementById('fullScreenView').style.display = 'block';
}

// Open settings popup and set current difficulty
function openSettingsPopup() {
    const popup = document.getElementById('settingsPopup');
    const difficultyRadios = popup.querySelectorAll('input[name="difficulty"]');
    difficultyRadios.forEach(radio => {
        radio.checked = radio.value === currentDifficulty.toString();
    });
    hideAllScreens();
    popup.style.display = 'block';
}

// Event Listeners
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('showMore') && event.target.hasAttribute('data-column')) {
        event.preventDefault();
        const column = event.target.getAttribute('data-column');
        showFullList(column);
    }
});

document.getElementById('returnLink').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('fullScreenView').style.display = 'none';
    document.getElementById('reportCard').style.display = 'block';
});

document.getElementById('settingsOkay').addEventListener('click', function() {
    const selectedDifficulty = parseInt(document.querySelector('input[name="difficulty"]:checked').value);
    updateOptionsDisplay(selectedDifficulty);
    currentDifficulty = selectedDifficulty;
    resetGame();
    document.getElementById('settingsPopup').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
});

document.getElementById('goToReportCard').addEventListener('click', function(event) {
    event.preventDefault();
    populateReportCard();
});

document.getElementById('message').addEventListener('click', function(event) {
    if (event.target.classList.contains('gear-icon')) {
        openSettingsPopup();
    }
});

// Add event listeners to options
const optionDivs = document.querySelectorAll('.option');
optionDivs.forEach((div, index) => {
    div.addEventListener('click', function() {
        if (div.classList.contains('disabled')) return;
        clickCount++;
        const visibleOptions = Array.from(optionDivs).filter(d => d.style.display !== 'none');
        const visibleIndex = visibleOptions.indexOf(div);
        if (visibleIndex === correctIndex) {
            div.classList.add('correct');
            setTimeout(resetGame, 1000);
        } else {
            if (clickCount === 1) {
                div.innerText = "try again";
                div.classList.add('try-again', 'disabled');
                div.style.pointerEvents = 'none';
            } else if (clickCount === 2) {
                visibleOptions.forEach((d, i) => {
                    if (i !== correctIndex) {
                        const hint = placeholderHints[Math.floor(Math.random() * placeholderHints.length)];
                        d.innerText = hint;
                        d.classList.add('hints', 'disabled');
                        d.style.pointerEvents = 'none';
                    } else {
                        d.classList.add('correct');
                    }
                });
            }
        }
    });
});

// Initialize the game
hideAllScreens();
document.getElementById('gameArea').style.display = 'flex';
updateOptionsDisplay(currentDifficulty);
resetGame();
showMessage('Click the gear to open settings');

// Add resize event listener for dynamic adjustments
window.addEventListener('resize', setButtonHeights);