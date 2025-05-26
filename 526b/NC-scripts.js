// TOP OF PAGE

/** Array of president objects with name, suit, rank, and term */

/** Game state variables */
let presidents;
let round = 1; // Current round number
let order = []; // Order of presidents for the round
let currentIndex = 0; // Index of the current president
let currentPresident; // Current president object
let currentMode = 'number'; // 'number' or 'years'
let attempts = 0; // Number of attempts for current president
let roundCorrects = 0; // Correct answers in the round
let currentRoundResults = []; // Results for current round
let previousRoundWrong = []; // Indices of presidents missed in previous round
let reportCardData = Array(9).fill().map(() => ({ round: 0, data: [], numberCorrectOnFirstTry: 0, missed: [] })); // Report card data for 9 rounds
let column4Presidents = new Set(); // Presidents in column 4 (legacy, maintained for round logic)
let roundResults = []; // Results of all rounds
const optionDivs = document.querySelectorAll('.option'); // Option elements
let timeoutId; // Timeout ID for full-screen view
let timerStart; // Start time for timer
let submissionType; // "overall" or "speedrun"
let autoReturnTimer; // Timer for auto-return from scoreboards

// New variables for yearly accomplishments
let yearlyAccomplishments;
let accomplishmentsByName;

/** Helper Functions */

/**
 * Returns the suit letter for a given suit
 * @param {string} suit - The suit of the president
 * @returns {string} - 'D', 'R', or 'O'
 */
function getSuitLetter(suit) {
    if (suit === "democratic") return "D";
    if (suit === "republican") return "R";
    if (suit === "other") return "O";
}

/**
 * Shuffles an array in place
 * @param {Array} array - The array to shuffle
 * @returns {Array} - The shuffled array
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Determines deviation range based on streak
 * @param {number} streak - Current streak
 * @returns {Object} - Min and max deviation
 */
function getDeviation(streak) {
    if (streak === 0) return { minD: 5, maxD: 9 };
    else if (streak === 1) return { minD: 3, maxD: 7 };
    else if (streak === 2) return { minD: 2, maxD: 5 };
    else return { minD: 1, maxD: 2 };
}

/**
 * Returns the ordinal suffix for a number
 * @param {number} rank - The rank number
 * @returns {string} - 'st', 'nd', 'rd', or 'th'
 */
function getOrdinalSuffix(rank) {
    let j = rank % 10,
        k = rank % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
}

/**
 * Converts a rank to its ordinal form
 * @param {number} rank - The rank number
 * @returns {string} - The ordinal representation
 */
function getOrdinal(rank) {
    if (rank === 1) return "First";
    if (rank === 2) return "Second";
    if (rank === 3) return "Third";
    return rank + getOrdinalSuffix(rank);
}

/**
 * Generates answer options based on mode
 * @param {number} correctRank - The correct rank
 * @param {number} streak - Current streak
 * @param {string} mode - 'number' or 'years'
 * @returns {Array} - Array of options
 */
function generateOptions(correctRank, streak, mode) {
    let { minD, maxD } = getDeviation(streak);
    let r = correctRank;
    let lower = Math.max(1, r - maxD);
    let upper = Math.min(32, r + maxD);
    let possibleRanks = [];
    for (let i = lower; i <= upper; i++) {
        if (Math.abs(i - r) >= minD && i !== r) {
            possibleRanks.push(i);
        }
    }
    if (currentPresident.name === "Cleveland") {
        let otherRank = r === 22 ? 24 : (r === 24 ? 22 : null);
        if (otherRank) {
            possibleRanks = possibleRanks.filter(x => x !== otherRank);
        }
    }
    let incorrect1 = possibleRanks[Math.floor(Math.random() * possibleRanks.length)];
    let remaining = possibleRanks.filter(x => x !== incorrect1);
    let incorrect2 = remaining[Math.floor(Math.random() * remaining.length)];
    let ranks = [r, incorrect1, incorrect2];
    shuffle(ranks);
    if (mode === 'number') {
        return ranks.map(rank => rank.toString());
    } else {
        return ranks.map(rank => presidents[rank - 1].term);
    }
}

function hideAllScreens() {
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('reportCard').style.display = 'none';
    document.getElementById('fullScreenView').style.display = 'none';
    document.getElementById('finalMessage').style.display = 'none';
    document.getElementById('overallTop10').style.display = 'none';
    document.getElementById('speedrunTop10').style.display = 'none';
    document.getElementById('scoreSubmission').style.display = 'none';
    document.getElementById('settingsPopup').style.display = 'none'; // Hide settings popup
}

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

/** Saves president data to localStorage */
function saveData() {
    let data = presidents.map(p => ({
        streak: p.streak,
        totalTrials: p.totalTrials,
        corrects: p.corrects
    }));
    localStorage.setItem('presidentsData', JSON.stringify(data));
}

/** Preloads all president card images */
function preloadAllImages() {
    presidents.forEach(p => {
        let img = new Image();
        img.src = `CARDS/${getSuitLetter(p.suit)}-${p.rank}.jpg`;
    });
}

/**
 * Changes the president image with a fade effect
 * @param {string} newSrc - New image source
 */
function changeImageSmoothly(newSrc) {
    const img = document.getElementById('presidentImage');
    img.style.opacity = 0;
    setTimeout(() => {
        img.src = newSrc;
        img.onload = () => {
            img.style.opacity = 1;
        };
    }, 300);
}

/** Starts a new president question */
function startNewPresident() {
    if (currentIndex >= order.length) {
        showReportCard();
        return;
    }
    currentPresident = presidents[order[currentIndex]];
    currentPresident.totalTrials += 1;
    attempts = 0;

    let imgSrc = `CARDS/${getSuitLetter(currentPresident.suit)}-${currentPresident.rank}.jpg`;
    changeImageSmoothly(imgSrc);

    let options = generateOptions(currentPresident.rank, currentPresident.streak, currentMode);
    optionDivs.forEach((div, i) => {
    let option = options[i];
    div.innerText = option;
    div.dataset.value = option;
    if (currentMode === 'number') {
        let rank = parseInt(option);
        let presidentIndex = rank - 1;
        div.dataset.presidentIndex = presidentIndex;
    } else {
        let presidentIndex = presidents.findIndex(p => p.term === option);
        div.dataset.presidentIndex = presidentIndex;
    }
    div.classList.remove('disabled', 'correct');
    div.title = ''; // Clear the title attribute to prevent unwanted tooltips
});

    showMessage('');
}

/** Moves to the next president */
function moveToNextPresident() {
    currentIndex += 1;
    saveData();
    startNewPresident();
}

/** Starts a new round based on round number */
function startNewRound() {
    hideAllScreens();
    document.getElementById('gameArea').style.display = 'flex';
    if (round === 1) {
        order = Array.from({ length: 32 }, (_, i) => i);
        shuffle(order);
        timerStart = Date.now(); // Start timer for Speedrun
    } else if (round === 2) {
        let T = 12;
        let W = previousRoundWrong;
        if (W.length >= T) {
            order = shuffle(W).slice(0, T);
        } else {
            let additional = T - W.length;
            let C = Array.from({ length: 32 }, (_, i) => i).filter(i => !W.includes(i));
            order = W.concat(shuffle(C).slice(0, additional));
        }
    } else if (round === 3) {
        let T = 10;
        let W = previousRoundWrong;
        if (W.length >= T) {
            order = shuffle(W).slice(0, T);
        } else {
            let additional = T - W.length;
            let C = Array.from({ length: 32 }, (_, i) => i).filter(i => !W.includes(i));
            order = W.concat(shuffle(C).slice(0, additional));
        }
    } else if (round === 4) {
        let accuracy = presidents.map((p, i) => ({
            index: i,
            accuracy: p.totalTrials > 0 ? p.corrects / p.totalTrials : 1
        }));
        accuracy.sort((a, b) => a.accuracy - b.accuracy);
        let mostMissed = accuracy.slice(0, 6).map(a => a.index);
        let remaining = accuracy.filter(a => !mostMissed.includes(a.index));
        let notInColumn4 = remaining.filter(a => !column4Presidents.has(a.index));
        if (notInColumn4.length >= 2) {
            notInColumn4.sort((a, b) => a.accuracy - b.accuracy);
            let additional = notInColumn4.slice(0, 2).map(a => a.index);
            order = mostMissed.concat(additional);
        } else if (notInColumn4.length > 0) {
            let additional = notInColumn4.map(a => a.index);
            let needed = 2 - additional.length;
            let closest = remaining.filter(a => !additional.includes(a.index)).sort((a, b) => {
                let minDistA = Math.min(...mostMissed.map(m => Math.abs(presidents[m].rank - presidents[a.index].rank)));
                let minDistB = Math.min(...mostMissed.map(m => Math.abs(presidents[m].rank - presidents[b.index].rank)));
                return minDistA - minDistB;
            }).slice(0, needed).map(a => a.index);
            order = mostMissed.concat(additional, closest);
        } else {
            remaining.sort((a, b) => a.accuracy - b.accuracy);
            let additional = remaining.slice(0, 2).map(a => a.index);
            order = mostMissed.concat(additional);
        }
    } else {
        let W = previousRoundWrong;
        if (W.length >= 8) {
            order = shuffle(W).slice(0, 8);
        } else {
            let additional = 8 - W.length;
            let remaining = Array.from({ length: 32 }, (_, i) => i).filter(i => !column4Presidents.has(i));
            if (remaining.length >= additional) {
                let accuracyRemaining = remaining.map(i => ({
                    index: i,
                    accuracy: presidents[i].totalTrials > 0 ? presidents[i].corrects / presidents[i].totalTrials : 1
                }));
                accuracyRemaining.sort((a, b) => a.accuracy - b.accuracy);
                let selected = accuracyRemaining.slice(0, additional).map(a => a.index);
                order = W.concat(selected);
            } else {
                let selected = remaining;
                let stillNeeded = additional - selected.length;
                if (stillNeeded > 0) {
                    let otherPresidents = Array.from({ length: 32 }, (_, i) => i).filter(i => !W.includes(i) && !selected.includes(i));
                    let accuracyOther = otherPresidents.map(i => ({
                        index: i,
                        accuracy: presidents[i].totalTrials > 0 ? presidents[i].corrects / presidents[i].totalTrials : 1
                    }));
                    accuracyOther.sort((a, b) => a.accuracy - b.accuracy);
                    let moreSelected = accuracyOther.slice(0, stillNeeded).map(a => a.index);
                    selected = selected.concat(moreSelected);
                }
                order = W.concat(selected);
            }
        }
    }
    if (round >= 4) {
        column4Presidents = new Set([...column4Presidents, ...order]);
    }
    currentRoundResults = new Array(order.length).fill(false);
    currentIndex = 0;
    roundCorrects = 0;
    document.getElementById('reportCard').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
    startNewPresident();
}

/** Displays the report card or final score submission */
function showReportCard() {
    hideAllScreens();
    document.getElementById('roundIndicator').innerText = `Rd ${round}/9`;
    console.log('Set roundIndicator to:', document.getElementById('roundIndicator').innerText);

    document.getElementById('gameArea').style.display = 'none';
    showMessage('');
    let reportCard = document.getElementById('reportCard');
    reportCard.style.display = 'block';

    let columnIndex = round - 1;
    let missedInRound = order.filter((_, i) => !currentRoundResults[i]);
    reportCardData[columnIndex] = {
        round: round,
        numberCorrectOnFirstTry: roundCorrects,
        data: order.map(index => ({
            presidentIndex: index,
            corrects: presidents[index].corrects,
            totalTrials: presidents[index].totalTrials
        })),
        missed: missedInRound
    };

    roundResults.push({ round: round, correct: roundCorrects, total: order.length });

    // Update the column for the current round
    let col = document.getElementById(`column${round}`);
    let data = reportCardData[columnIndex];
    let missedSet = new Set(data.missed);
    let total = data.data.length;
    let correct = data.numberCorrectOnFirstTry;
    let percentage = Math.round((correct / total) * 100);
    let entries;
    if (round === 1) {
        let sortedData = [...presidents].sort((a, b) => a.rank - b.rank);
        entries = sortedData.map(p => {
            let index = presidents.indexOf(p);
            let isMissed = missedSet.has(index);
            let displayName = isMissed ? `${p.rank} ${p.name}` : p.name;
            return `<div class="${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
    } else {
        entries = data.data.map(d => {
            let p = presidents[d.presidentIndex];
            let isMissed = missedSet.has(d.presidentIndex);
            let displayName = isMissed ? `${p.rank} ${p.name}` : p.name;
            return `<div class="${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
    }
    let displayList = entries.slice(0, 10).join('') + `<a href="#" class="showMore" data-column="${round}">show more</a>`;
    col.innerHTML = `<div class="cloud-text"><p class="percentage">${percentage.toString().padStart(2, '0')}%</p><h3>Round ${round}: ${correct}/${total}</h3>${displayList}</div>`;
    console.log('Set column', round, 'to:', col.innerHTML);

    previousRoundWrong = missedInRound;

    if (round === 9) {
        let sumCorrect = roundResults.reduce((acc, r) => acc + r.correct, 0);
        let sumTotal = roundResults.reduce((acc, r) => acc + r.total, 0);
        let overallAccuracy = (sumCorrect / sumTotal * 100).toFixed(2);
        submissionType = "overall";
        showScoreSubmission(overallAccuracy);
    }
}

/**
 * Shows the full list of presidents for a column with cloud background
 * @param {string} column - Column number ('1' to '9')
 */
function showFullList(column) {
    hideAllScreens();
    document.getElementById('fullScreenView').style.display = 'block';
    let gridContainer = document.getElementById('gridContainer');
    gridContainer.innerHTML = '';
    let entries = [];
    let columnIndex = parseInt(column) - 1;
    let data = reportCardData[columnIndex];
    if (!data || data.round === 0) return;
    let missedSet = new Set(data.missed);
    if (column === '1') {
        let sortedData = [...presidents].sort((a, b) => a.rank - b.rank);
        entries = sortedData.map(p => {
            let index = presidents.indexOf(p);
            let isMissed = missedSet.has(index);
            let displayName = `${p.rank} ${p.name}`;
            return `<div class="cloud-text ${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
    } else {
        entries = data.data.map(d => {
            let p = presidents[d.presidentIndex];
            let isMissed = missedSet.has(d.presidentIndex);
            let displayName = `${p.rank} ${p.name}<br><span style="font-size: smaller;">${p.term}</span>`;
            return `<div class="cloud-text ${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
    }
    gridContainer.innerHTML = entries.join('');
    document.getElementById('fullScreenView').style.display = 'block';
    document.getElementById('reportCard').style.display = 'none';
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        document.getElementById('fullScreenView').style.display = 'none';
        document.getElementById('reportCard').style.display = 'block';
    }, 30000);
}

/** Event Listeners */

/** Handle option clicks */
optionDivs.forEach(div => {
    div.addEventListener('click', function() {
        if (div.classList.contains('disabled')) return;
        let selectedValue = div.dataset.value;
        let isCorrect;
        if (currentMode === 'number') {
            isCorrect = Number(selectedValue) === currentPresident.rank;
        } else {
            isCorrect = selectedValue === currentPresident.term;
        }
        if (isCorrect) {
            div.classList.add('correct');
            optionDivs.forEach(d => d.classList.add('disabled'));
            if (attempts === 0) {
                currentPresident.corrects += 1;
                roundCorrects += 1;
                currentPresident.streak += 1;
                currentRoundResults[currentIndex] = true;
            } else {
                currentPresident.streak = 0;
            }
            if (attempts >= 2) {
                moveToNextPresident(); // Proceed immediately after user clicks correct option
            } else {
                setTimeout(moveToNextPresident, 1000);
            }
        } else {
            div.innerText = "try again";
            div.classList.add('disabled');
            attempts += 1;
            if (attempts === 2) {
                // Step 1: Get accomplishments of the correct president
                let correctAccomplishments = accomplishmentsByName[currentPresident.name] || [];
                
                // Step 2: Prepare two sentences
                let sentences = [];
                if (correctAccomplishments.length >= 2) {
                    // Select two different accomplishments
                    let indices = Array.from({length: correctAccomplishments.length}, (_, i) => i);
                    shuffle(indices); // Shuffle indices using existing shuffle function
                    sentences = [
                        correctAccomplishments[indices[0]],
                        correctAccomplishments[indices[1]]
                    ];
                } else if (correctAccomplishments.length === 1) {
                    // Only one accomplishment, use it for both
                    sentences = [correctAccomplishments[0], correctAccomplishments[0]];
                } else {
                    // No accomplishments available
                    sentences = ["No data available", "No data available"];
                }
                
                // Step 3: Update options
                let incorrectIndex = 0;
                optionDivs.forEach(d => {
                    let isCorrectOption;
                    if (currentMode === 'number') {
                        isCorrectOption = Number(d.dataset.value) === currentPresident.rank;
                    } else {
                        isCorrectOption = d.dataset.value === currentPresident.term;
                    }
                    if (isCorrectOption) {
                        d.classList.add('correct');
                        d.classList.remove('disabled'); // User must click this to proceed
                    } else {
                        d.classList.add('disabled');
                        let sentence = sentences[incorrectIndex];
                        d.innerText = sentence;
                        d.title = sentence; // Show full sentence on hover
                        incorrectIndex += 1; // Move to next sentence for next incorrect option
                    }
                });
                
                // Step 4: Show message with gear icon
                let ordinal = getOrdinal(currentPresident.rank);
                let message = `Sorry. ${currentPresident.name} was actually the <u>${ordinal}</u> President in ${currentPresident.term}.`;
                showMessage(message);
                currentPresident.streak = 0;
                // Game waits for user to click the correct option
            }
        }
    });
});

/** Handle gear icon clicks to open settings popup */
document.getElementById('message').addEventListener('click', function(event) {
    if (event.target.classList.contains('gear-icon')) {
        openSettingsPopup();
    }
});

/** Open settings popup */
function openSettingsPopup() {
    const popup = document.getElementById('settingsPopup');
    const radios = popup.querySelectorAll('input[name="mode"]');
    radios.forEach(radio => {
        radio.checked = radio.value === currentMode;
    });
    popup.style.display = 'block';
}

/** Handle settings okay button */
document.getElementById('settingsOkay').addEventListener('click', function() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    currentMode = selectedMode;
    document.getElementById('settingsPopup').style.display = 'none';
    moveToNextPresident();
});

/** Handle show more links */
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('showMore') && event.target.hasAttribute('data-column')) {
        event.preventDefault();
        let column = event.target.getAttribute('data-column');
        showFullList(column);
    }
});

/** Handle return from full-screen view */
document.getElementById('returnLink').addEventListener('click', function(event) {
    event.preventDefault();
    clearTimeout(timeoutId);
    document.getElementById('fullScreenView').style.display = 'none';
    document.getElementById('reportCard').style.display = 'block';
});

/** Handle continue button */
document.getElementById('continue').addEventListener('click', () => {
    if (round === 1 && roundCorrects === 32) {
        let time = Date.now() - timerStart;
        submissionType = "speedrun";
        showScoreSubmission(time);
    } else if (round < 9) {
        round += 1;
        startNewRound();
    }
});

/** Handle play again */
document.getElementById('playAgain').addEventListener('click', function(event) {
    event.preventDefault();
    presidents.forEach(p => {
        p.streak = 0;
        p.totalTrials = 0;
        p.corrects = 0;
    });
    saveData();
    round = 1;
    reportCardData = Array(9).fill().map(() => ({ round: 0, data: [], numberCorrectOnFirstTry: 0, missed: [] }));
    column4Presidents = new Set();
    roundResults = [];
    document.getElementById('finalMessage').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
    startNewRound();
});

/** Scoreboard and Timer Functions */

/**
 * Formats time in MM:SS:MMM
 * @param {number} ms - Time in milliseconds
 * @returns {string} - Formatted time
 */
function formatTime(ms) {
    let minutes = Math.floor(ms / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);
    let milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Saves a score to localStorage
 * @param {string} type - 'overall' or 'speedrun'
 * @param {string} initials - Player initials
 * @param {number} score - Score value
 * @returns {boolean} - True if score is in top 10
 */
function saveScore(type, initials, score) {
    let key = type === "overall" ? "overallTop10" : "speedrunTop10";
    let scores = JSON.parse(localStorage.getItem(key)) || [];
    scores.push({ initials, score });
    if (type === "overall") {
        scores.sort((a, b) => b.score - a.score);
    } else {
        scores.sort((a, b) => a.score - b.score);
    }
    scores = scores.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(scores));
    return scores.some(s => s.initials === initials && s.score === score);
}

/**
 * Shows the score submission dialog
 * @param {number} score - Score to submit
 */
function showScoreSubmission(score) {
    document.getElementById('scoreSubmission').style.display = 'block';
    document.getElementById('submitScore').onclick = function() {
        let initials = document.getElementById('initials').value.trim().toUpperCase();
        if (initials.length !== 3 || !/^[A-Z]{3}$/.test(initials)) {
            alert("Please enter exactly 3 letters.");
            return;
        }
        let isTop10 = saveScore(submissionType, initials, score);
        document.getElementById('scoreSubmission').style.display = 'none';
        if (submissionType === "speedrun") {
            round += 1;
            startNewRound();
        } else if (submissionType === "overall") {
            showFinalMessage(score);
        }
        if (isTop10) {
            submissionType === "overall" ? showOverallTop10() : showSpeedrunTop10();
        }
    };
}

/**
 * Shows the final message with score and grade
 * @param {number} accuracy - Overall accuracy percentage
 */
function showFinalMessage(accuracy) {
    let grade;
    if (accuracy >= 90) grade = "A 😊";
    else if (accuracy >= 80) grade = "B";
    else if (accuracy >= 70) grade = "C";
    else grade = "F <span style='color:red;'>SEE ME</span>";
    document.getElementById('finalScore').innerHTML = `You scored ${accuracy}%`;
    document.getElementById('grade').innerHTML = grade;
    document.getElementById('finalMessage').style.display = 'block';
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('reportCard').style.display = 'none';
}

/**
 * Starts the auto-return countdown for scoreboards
 * @param {string} type - 'Overall' or 'Speedrun'
 */
function startAutoReturn(type) {
    let countdownElement = document.getElementById(`countdown${type}`);
    let autoReturnElement = document.getElementById(`autoReturn${type.toLowerCase()}`);
    autoReturnElement.style.display = 'block';
    let timeLeft = 30;
    countdownElement.textContent = timeLeft;
    autoReturnTimer = setInterval(() => {
        timeLeft -= 1;
        countdownElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(autoReturnTimer);
            document.getElementById(`${type.toLowerCase()}Top10`).style.display = 'none';
            document.getElementById('finalMessage').style.display = 'block';
        }
    }, 1000);
}

/** Shows the Overall TOP 10 scoreboard with cloud background */
function showOverallTop10() {
    hideAllScreens();
    let scores = JSON.parse(localStorage.getItem("overallTop10")) || [];
    let list = document.getElementById("overallList");
    list.innerHTML = "";
    scores.forEach(s => {
        let li = document.createElement("li");
        li.textContent = `${s.initials}: ${s.score}%`;
        list.appendChild(li);
    });
    document.getElementById("overallTop10").style.display = "block";
    startAutoReturn("Overall");
}

/** Shows the Speedrun TOP 10 scoreboard with cloud background */
function showSpeedrunTop10() {
    hideAllScreens();
    let scores = JSON.parse(localStorage.getItem("speedrunTop10")) || [];
    let list = document.getElementById("speedrunList");
    list.innerHTML = "";
    scores.forEach(s => {
        let li = document.createElement("li");
        li.textContent = `${s.initials}: ${formatTime(s.score)}`;
        list.appendChild(li);
    });
    document.getElementById("speedrunTop10").style.display = "block";
    startAutoReturn("Speedrun");
}

/** Event listeners for TOP 10 views */
document.getElementById('viewOverallTop10').addEventListener('click', function(event) {
    event.preventDefault();
    showOverallTop10();
});

document.getElementById('viewSpeedrunTop10').addEventListener('click', function(event) {
    event.preventDefault();
    showSpeedrunTop10();
});

/** Event listeners for returning from TOP 10 */
document.getElementById('returnFromOverall').addEventListener('click', function() {
    hideAllScreens();
    document.getElementById('finalMessage').style.display = 'block';
    clearInterval(autoReturnTimer);
});

document.getElementById('returnFromSpeedrun').addEventListener('click', function() {
    hideAllScreens();
    document.getElementById('finalMessage').style.display = 'block';
    clearInterval(autoReturnTimer);
});

/** Initialize the game by fetching presidents and accomplishments data */
fetch('presidents.json')
    .then(response => response.json())
    .then(data => {
        presidents = data;

        // Load saved data from localStorage
        let savedData = localStorage.getItem('presidentsData');
        if (savedData) {
            let parsedData = JSON.parse(savedData);
            presidents.forEach((p, i) => {
                p.streak = parsedData[i].streak || 0;
                p.totalTrials = parsedData[i].totalTrials || 0;
                p.corrects = parsedData[i].corrects || 0;
            });
        } else {
            presidents.forEach(p => {
                p.streak = 0;
                p.totalTrials = 0;
                p.corrects = 0;
            });
        }

        // Fetch the yearly accomplishments
        return fetch('yearly_accomplishments.json');
    })
    .then(response => response.json())
    .then(data => {
        yearlyAccomplishments = data;
        accomplishmentsByName = {};
        yearlyAccomplishments.forEach(entry => {
            if (!accomplishmentsByName[entry.name]) {
                accomplishmentsByName[entry.name] = [];
            }
            accomplishmentsByName[entry.name].push(entry.description);
        });

        preloadAllImages();
        startNewRound();
    })
    .catch(error => console.error('Error loading data:', error));

// BOTTOM OF PAGE