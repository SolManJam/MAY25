// US Presidents Game - Complete Updated JavaScript File
// Date: May 27, 2025

// Game state variables
let presidents;
let round = 1;
let order = [];
let currentIndex = 0;
let currentPresident;
let currentMode = 'number'; // 'number' or 'years'
let currentDifficulty = 3; // Default difficulty level
let attempts = 0;
let roundCorrects = 0;
let currentRoundResults = [];
let previousRoundWrong = [];
let reportCardData = Array(9).fill().map(() => ({ round: 0, data: [], numberCorrectOnFirstTry: 0, missed: [] }));
let column4Presidents = new Set();
let roundResults = [];
const optionDivs = document.querySelectorAll('.option');
let timeoutId;
let timerStart;
let submissionType;
let autoReturnTimer;
let lastRoundPercentage = null; // Track the percentage from the previous round for difficulty adjustment

// Variables for yearly accomplishments
let yearlyAccomplishments;
let accomplishmentsByName;

// Helper Functions

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
        const j = Math.floor(Math.random() * (i + 1));
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
    const j = rank % 10,
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
 * Generates answer options based on mode and difficulty
 * @param {number} correctRank - The correct rank
 * @param {number} streak - Current streak
 * @param {string} mode - 'number' or 'years'
 * @param {number} difficulty - Number of options to generate
 * @returns {Array} - Array of options
 */
function generateOptions(correctRank, streak, mode, difficulty) {
    const { minD, maxD } = getDeviation(streak);
    const r = correctRank;
    const lower = Math.max(1, r - maxD);
    const upper = Math.min(32, r + maxD);
    let possibleRanks = [];
    for (let i = lower; i <= upper; i++) {
        if (Math.abs(i - r) >= minD && i !== r) {
            possibleRanks.push(i);
        }
    }
    if (currentPresident.name === "Cleveland") {
        const otherRank = r === 22 ? 24 : (r === 24 ? 22 : null);
        if (otherRank) {
            possibleRanks = possibleRanks.filter(x => x !== otherRank);
        }
    }
    let incorrectRanks = [];
    while (incorrectRanks.length < difficulty - 1 && possibleRanks.length > 0) {
        const index = Math.floor(Math.random() * possibleRanks.length);
        incorrectRanks.push(possibleRanks[index]);
        possibleRanks.splice(index, 1);
    }
    if (incorrectRanks.length < difficulty - 1) {
        let allOtherRanks = Array.from({length: 32}, (_, i) => i + 1).filter(x => x !== r && !incorrectRanks.includes(x));
        if (currentPresident.name === "Cleveland") {
            const otherRank = r === 22 ? 24 : (r === 24 ? 22 : null);
            if (otherRank) {
                allOtherRanks = allOtherRanks.filter(x => x !== otherRank);
            }
        }
        while (incorrectRanks.length < difficulty - 1 && allOtherRanks.length > 0) {
            const index = Math.floor(Math.random() * allOtherRanks.length);
            incorrectRanks.push(allOtherRanks[index]);
            allOtherRanks.splice(index, 1);
        }
    }
    let ranks = [r, ...incorrectRanks];
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
    document.getElementById('settingsPopup').style.display = 'none';
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
    const data = presidents.map(p => ({
        streak: p.streak,
        totalTrials: p.totalTrials,
        corrects: p.corrects,
        usedHints: p.usedHints || []
    }));
    localStorage.setItem('presidentsData', JSON.stringify(data));
}

/** Preloads all president card images */
function preloadAllImages() {
    presidents.forEach(p => {
        const img = new Image();
        img.src = `CARDS/${getSuitLetter(p.suit)}-${p.rank}.jpg`;
    });
}

// Two-Image System Functions

/**
 * Preloads the next president's image
 */
function preloadNextImage() {
    const nextImg = document.getElementById('nextImage');
    if (currentIndex + 1 < order.length) {
        const nextPresident = presidents[order[currentIndex + 1]];
        const nextImgSrc = `CARDS/${getSuitLetter(nextPresident.suit)}-${nextPresident.rank}.jpg`;
        nextImg.src = nextImgSrc;
        nextImg.onload = () => console.log(`Preloaded ${nextImgSrc} for ${nextPresident.name}`);
        nextImg.onerror = () => console.log(`Failed to preload ${nextImgSrc}`);
    } else {
        nextImg.src = ''; // Clear if no next image
    }
    nextImg.style.display = 'none'; // Keep hidden
}

/**
 * Swaps the current image with the preloaded next image
 */
function changeImageSmoothly(nextPresidentIndex) {
    const currentImg = document.getElementById('currentImage');
    const nextImg = document.getElementById('nextImage');
    
    currentImg.style.transition = 'opacity 0.1s ease';
    currentImg.style.opacity = 0;
    
    setTimeout(() => {
        const nextPresident = presidents[nextPresidentIndex];
        const imgSrc = `CARDS/${getSuitLetter(nextPresident.suit)}-${nextPresident.rank}.jpg`;
        
        if (nextImg.src) {
            console.log(`Swapping currentImage to preloaded: ${nextImg.src}`);
            currentImg.src = nextImg.src;
        } else {
            console.log(`Setting currentImage to: ${imgSrc} for ${nextPresident.name}`);
            currentImg.src = imgSrc;
        }
        currentImg.style.opacity = 1;
        nextImg.src = '';
        nextImg.style.display = 'none';
        preloadNextImage();
    }, 100);
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

    const currentImg = document.getElementById('currentImage');
    const imgSrc = `CARDS/${getSuitLetter(currentPresident.suit)}-${currentPresident.rank}.jpg`;
    currentImg.style.transition = 'opacity 0.1s ease';
    currentImg.style.opacity = 0;

    setTimeout(() => {
        currentImg.src = imgSrc;
        currentImg.style.opacity = 1;
        console.log(`Set image for ${currentPresident.name} to ${imgSrc}`);
        preloadNextImage();
    }, 100);

    const options = generateOptions(currentPresident.rank, currentPresident.streak, currentMode, currentDifficulty);
    optionDivs.forEach((div, i) => {
        if (i < currentDifficulty) {
            div.style.display = 'block';
            div.innerText = options[i];
            div.dataset.value = options[i];
            div.classList.remove('disabled', 'correct', 'try-again', 'hints');
            div.title = '';
        } else {
            div.style.display = 'none';
        }
    });

    showMessage('');
}

/** Moves to the next president */
function moveToNextPresident() {
    if (currentIndex + 1 < order.length) {
        currentIndex++;
        startNewPresident();
    } else {
        showReportCard();
    }
}

/** Starts a new round based on round number with dynamic difficulty adjustment */
function startNewRound() {
    if (round === 1) {
        currentDifficulty = 3; // Round 1 starts at level 3
    } else {
        let adjustment = 0;
        if (lastRoundPercentage >= 90) {
            adjustment = 1; // Increase difficulty if score >= 90%
        } else if (lastRoundPercentage < 80) {
            adjustment = -1; // Decrease difficulty if score < 80%
        }
        // Adjust and clamp difficulty between 3 and 5
        currentDifficulty = Math.min(5, Math.max(3, currentDifficulty + adjustment));
    }

    hideAllScreens();
    document.getElementById('gameArea').style.display = 'flex';
    if (round === 1) {
        order = Array.from({ length: 32 }, (_, i) => i);
        shuffle(order);
        timerStart = Date.now();
    } else if (round === 2) {
        const T = 12;
        const W = previousRoundWrong;
        if (W.length >= T) {
            order = shuffle(W).slice(0, T);
        } else {
            const additional = T - W.length;
            const C = Array.from({ length: 32 }, (_, i) => i).filter(i => !W.includes(i));
            order = W.concat(shuffle(C).slice(0, additional));
        }
    } else if (round === 3) {
        const T = 10;
        const W = previousRoundWrong;
        if (W.length >= T) {
            order = shuffle(W).slice(0, T);
        } else {
            const additional = T - W.length;
            const C = Array.from({ length: 32 }, (_, i) => i).filter(i => !W.includes(i));
            order = W.concat(shuffle(C).slice(0, additional));
        }
    } else if (round === 4) {
        const accuracy = presidents.map((p, i) => ({
            index: i,
            accuracy: p.totalTrials > 0 ? p.corrects / p.totalTrials : 1
        }));
        accuracy.sort((a, b) => a.accuracy - b.accuracy);
        const mostMissed = accuracy.slice(0, 6).map(a => a.index);
        let remaining = accuracy.filter(a => !mostMissed.includes(a.index));
        let notInColumn4 = remaining.filter(a => !column4Presidents.has(a.index));
        if (notInColumn4.length >= 2) {
            notInColumn4.sort((a, b) => a.accuracy - b.accuracy);
            const additional = notInColumn4.slice(0, 2).map(a => a.index);
            order = mostMissed.concat(additional);
        } else if (notInColumn4.length > 0) {
            const additional = notInColumn4.map(a => a.index);
            const needed = 2 - additional.length;
            const closest = remaining.filter(a => !additional.includes(a.index)).sort((a, b) => {
                const minDistA = Math.min(...mostMissed.map(m => Math.abs(presidents[m].rank - presidents[a.index].rank)));
                const minDistB = Math.min(...mostMissed.map(m => Math.abs(presidents[m].rank - presidents[b.index].rank)));
                return minDistA - minDistB;
            }).slice(0, needed).map(a => a.index);
            order = mostMissed.concat(additional, closest);
        } else {
            remaining.sort((a, b) => a.accuracy - b.accuracy);
            const additional = remaining.slice(0, 2).map(a => a.index);
            order = mostMissed.concat(additional);
        }
    } else {
        const W = previousRoundWrong;
        if (W.length >= 8) {
            order = shuffle(W).slice(0, 8);
        } else {
            const additional = 8 - W.length;
            let remaining = Array.from({ length: 32 }, (_, i) => i).filter(i => !column4Presidents.has(i));
            if (remaining.length >= additional) {
                const accuracyRemaining = remaining.map(i => ({
                    index: i,
                    accuracy: presidents[i].totalTrials > 0 ? presidents[i].corrects / presidents[i].totalTrials : 1
                }));
                accuracyRemaining.sort((a, b) => a.accuracy - b.accuracy);
                const selected = accuracyRemaining.slice(0, additional).map(a => a.index);
                order = W.concat(selected);
            } else {
                let selected = remaining;
                const stillNeeded = additional - selected.length;
                if (stillNeeded > 0) {
                    const otherPresidents = Array.from({ length: 32 }, (_, i) => i).filter(i => !W.includes(i) && !selected.includes(i));
                    const accuracyOther = otherPresidents.map(i => ({
                        index: i,
                        accuracy: presidents[i].totalTrials > 0 ? presidents[i].corrects / presidents[i].totalTrials : 1
                    }));
                    accuracyOther.sort((a, b) => a.accuracy - b.accuracy);
                    const moreSelected = accuracyOther.slice(0, stillNeeded).map(a => a.index);
                    selected = selected.concat(moreSelected);
                }
                order = W.concat(selected);
            }
        }
    }
    order = shuffle(order);
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

/** Displays the report card at the end of a round and stores the percentage for the next round's difficulty adjustment */
function showReportCard() {
    hideAllScreens();
    document.getElementById('roundIndicator').innerText = `Rd ${round}/9`;
    console.log('Set roundIndicator to:', document.getElementById('roundIndicator').innerText);

    document.getElementById('gameArea').style.display = 'none';
    showMessage('');
    const reportCard = document.getElementById('reportCard');
    reportCard.style.display = 'block';

    const columnIndex = round - 1;
    const missedInRound = order.filter((_, i) => !currentRoundResults[i]);
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

    const col = document.getElementById(`column${round}`);
    const data = reportCardData[columnIndex];
    const missedSet = new Set(data.missed);
    const total = data.data.length;
    const correct = data.numberCorrectOnFirstTry;
    const percentage = Math.round((correct / total) * 100);
    lastRoundPercentage = percentage; // Store the percentage for the next round's difficulty adjustment

    let entries;
    if (round === 1) {
        const sortedData = [...presidents].sort((a, b) => a.rank - b.rank);
        entries = sortedData.map(p => {
            const index = presidents.indexOf(p);
            const isMissed = missedSet.has(index);
            const displayName = isMissed ? `${p.rank} ${p.name} (${p.term})` : `${p.name} (${p.term})`;
            return `<div class="${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
    } else {
        entries = data.data.map(d => {
            const p = presidents[d.presidentIndex];
            const isMissed = missedSet.has(d.presidentIndex);
            const displayName = isMissed ? `${p.rank} ${p.name} (${p.term})` : `${p.name} (${p.term})`;
            return `<div class="${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
    }
    const displayList = entries.slice(0, 10).join('') + `<a href="#" class="showMore" data-column="${round}">show more</a>`;
    col.innerHTML = `<div class="cloud-text"><p class="percentage">${percentage.toString().padStart(2, '0')}%</p><h3>Round ${round}: ${correct}/${total}</h3>${displayList}</div>`;
    console.log('Set column', round, 'to:', col.innerHTML);

    previousRoundWrong = missedInRound;

    if (round === 9) {
        const sumCorrect = roundResults.reduce((acc, r) => acc + r.correct, 0);
        const sumTotal = roundResults.reduce((acc, r) => acc + r.total, 0);
        const overallAccuracy = (sumCorrect / sumTotal * 100).toFixed(2);
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
    const gridContainer = document.getElementById('gridContainer');
    gridContainer.innerHTML = '';
    let entries = [];
    const columnIndex = parseInt(column) - 1;
    const data = reportCardData[columnIndex];
    if (!data || data.round === 0) return;
    const missedSet = new Set(data.missed);
    if (column === '1') {
        const sortedData = [...presidents].sort((a, b) => a.rank - b.rank);
        entries = sortedData.map(p => {
            const index = presidents.indexOf(p);
            const isMissed = missedSet.has(index);
            const displayName = `${p.rank} ${p.name} (${p.term})`;
            return `<div class="cloud-text ${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
    } else {
        entries = data.data.map(d => {
            const p = presidents[d.presidentIndex];
            const isMissed = missedSet.has(d.presidentIndex);
            const displayName = `${p.rank} ${p.name} (${p.term})`;
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

// Event Listeners

/** Handle option clicks */
optionDivs.forEach(div => {
    div.addEventListener('click', function() {
        if (div.classList.contains('disabled') || div.style.display === 'none') return;
        let selectedValue = div.dataset.value;
        let isCorrect;
        if (currentMode === 'number') {
            isCorrect = Number(selectedValue) === currentPresident.rank;
        } else {
            isCorrect = selectedValue === currentPresident.term;
        }
        if (isCorrect) {
            div.classList.add('correct');
            optionDivs.forEach(d => {
                if (d !== div && d.style.display !== 'none') {
                    d.classList.add('disabled');
                    d.classList.remove('try-again', 'hints');
                }
            });
            if (attempts === 0) {
                currentPresident.corrects += 1;
                roundCorrects += 1;
                currentPresident.streak += 1;
                currentRoundResults[currentIndex] = true;
            } else {
                currentPresident.streak = 0;
            }
            if (attempts >= 2) {
                moveToNextPresident();
            } else {
                setTimeout(moveToNextPresident, 1000);
            }
        } else {
            attempts += 1;
            if (attempts === 1) {
                div.innerText = "try again";
                div.classList.add('disabled', 'try-again');
            } else if (attempts === 2) {
                let correctAccomplishments = accomplishmentsByName[currentPresident.name] || [];
                
                if (currentPresident.name === "Cleveland") {
                    let termYears;
                    if (currentPresident.rank === 22) {
                        termYears = { start: 1885, end: 1888 };
                    } else if (currentPresident.rank === 24) {
                        termYears = { start: 1893, end: 1896 };
                    }
                    correctAccomplishments = correctAccomplishments.filter(entry => 
                        entry.year >= termYears.start && entry.year <= termYears.end
                    );
                }
                
                let availableHints = correctAccomplishments.map(entry => entry.description);
                if (!currentPresident.usedHints) {
                    currentPresident.usedHints = [];
                }
                let unusedHints = availableHints.filter(hint => !currentPresident.usedHints.includes(hint));
                if (unusedHints.length < currentDifficulty - 1) {
                    currentPresident.usedHints = [];
                    unusedHints = availableHints;
                }
                let hints = [];
                for (let i = 0; i < currentDifficulty - 1; i++) {
                    if (unusedHints.length > 0) {
                        const hint = unusedHints[Math.floor(Math.random() * unusedHints.length)];
                        hints.push(hint);
                        unusedHints = unusedHints.filter(h => h !== hint);
                        currentPresident.usedHints.push(hint);
                    } else {
                        const hint = availableHints[Math.floor(Math.random() * availableHints.length)];
                        hints.push(hint);
                    }
                }
                
                shuffle(hints);
                
                let incorrectIndex = 0;
                optionDivs.forEach(d => {
                    if (d.style.display !== 'none') {
                        let isCorrectOption;
                        if (currentMode === 'number') {
                            isCorrectOption = Number(d.dataset.value) === currentPresident.rank;
                        } else {
                            isCorrectOption = d.dataset.value === currentPresident.term;
                        }
                        if (!isCorrectOption) {
                            d.classList.add('disabled', 'hints');
                            let sentence = hints[incorrectIndex];
                            d.innerText = sentence;
                            d.title = sentence;
                            incorrectIndex += 1;
                        } else {
                            d.classList.add('correct');
                            d.classList.remove('disabled');
                        }
                    }
                });
                
                let ordinal = getOrdinal(currentPresident.rank);
                let message = `${currentPresident.name} was the <u>${ordinal}</u> President in ${currentPresident.term}.`;
                showMessage(message);
                currentPresident.streak = 0;
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
    const modeRadios = popup.querySelectorAll('input[name="mode"]');
    modeRadios.forEach(radio => {
        radio.checked = radio.value === currentMode;
    });
    const difficultyRadios = popup.querySelectorAll('input[name="difficulty"]');
    difficultyRadios.forEach(radio => {
        radio.checked = radio.value === currentDifficulty.toString();
    });
    popup.style.display = 'block';
}

/** Handle settings okay button */
document.getElementById('settingsOkay').addEventListener('click', function() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    currentMode = selectedMode;
    currentDifficulty = parseInt(selectedDifficulty);
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
        p.usedHints = [];
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

// Scoreboard and Timer Functions

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
    else grade = "F <span style='color:red'>SEE ME</span>";
    document.getElementById('finalScore').innerHTML = `You scored ${accuracy}%`;
    document.getElementById('gradeDisplay').innerHTML = grade;
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
        timeLeft--;
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

document.getElementById('scrollLeft').addEventListener('click', () => {
    document.getElementById('reportColumns').scrollBy({ left: -200, behavior: 'smooth' });
});

document.getElementById('scrollRight').addEventListener('click', () => {
    document.getElementById('reportColumns').scrollBy({ left: 200, behavior: 'smooth' });
});

/** Initialize the game by fetching presidents and accomplishments data */
fetch('presidents.json')
    .then(response => response.json())
    .then(data => {
        presidents = data;

        const savedData = localStorage.getItem('presidentsData');
        const parsedData = savedData ? JSON.parse(savedData) : null;
        presidents.forEach((p, i) => {
            p.streak = parsedData ? (parsedData[i].streak || 0) : 0;
            p.totalTrials = parsedData ? (parsedData[i].totalTrials || 0) : 0;
            p.corrects = parsedData ? (parsedData[i].corrects || 0) : 0;
            p.usedHints = parsedData ? (parsedData[i].usedHints || []) : [];
        });

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
            accomplishmentsByName[entry.name].push(entry);
        });

        preloadAllImages();
        startNewRound();
    })
    .catch(error => console.error('Error loading data:', error));

// BOTTOM OF CODE