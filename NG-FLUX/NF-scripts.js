let currentDifficulty = 3; // Default difficulty level

// Simplified game logic for demonstration
function setButtonHeights() {
    const image = document.getElementById('currentImage');
    const imageHeight = image.clientHeight;
    const optionDivs = document.querySelectorAll('.option');
    const visibleOptions = Array.from(optionDivs).filter(div => div.style.display !== 'none');
    const numButtons = visibleOptions.length;

    if (imageHeight > 0 && numButtons > 0) {
        const totalGap = (numButtons - 1) * 5; // 5px gap between buttons
        const buttonHeight = (imageHeight - totalGap) / numButtons;
        visibleOptions.forEach(div => {
            div.style.height = `${buttonHeight}px`;
            div.style.minHeight = '0'; // Prevent min-height interference
        });
    }
}

function updateOptionsDisplay(difficulty) {
    const optionDivs = document.querySelectorAll('.option');
    optionDivs.forEach((div, index) => {
        div.style.display = index < difficulty ? 'block' : 'none';
    });
    setButtonHeights();
}

function resetGame() {
    updateOptionsDisplay(currentDifficulty);
    const optionDivs = document.querySelectorAll('.option');
    optionDivs.forEach((div, index) => {
        div.innerText = `Option ${index + 1}`;
    });
}

function isMobilePortrait() {
    return window.matchMedia("(max-width: 480px) and (orientation: portrait)").matches;
}

// Event listeners
document.getElementById('settingsOkay').addEventListener('click', function() {
    currentDifficulty = parseInt(document.querySelector('input[name="difficulty"]:checked').value);
    updateOptionsDisplay(currentDifficulty);
    resetGame();
    document.getElementById('settingsPopup').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
});

document.getElementById('message').addEventListener('click', function(event) {
    if (event.target.classList.contains('gear-icon')) {
        document.getElementById('settingsPopup').style.display = 'block';
    }
});

if (window.matchMedia("(orientation: portrait)").matches) {
    document.body.classList.add("portrait-mode");
}

window.addEventListener('resize', setButtonHeights);
window.addEventListener('load', () => {
    updateOptionsDisplay(currentDifficulty);
    resetGame();
    document.getElementById('gameArea').style.display = 'flex';
    document.getElementById('message').innerHTML = '<span class="cloud-text">Click the gear to open settings <i class="fas fa-cog gear-icon" title="Settings"></i></span>';
});