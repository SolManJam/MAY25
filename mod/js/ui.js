// ui.js
// Manages DOM interactions and UI updates for the US Presidents Game

import { presidents, accomplishmentsByName, saveData } from './data.js';
import { currentPresident, currentMode, currentDifficulty, attempts, roundCorrects, currentRoundResults, currentIndex, moveToNextPresident, round, submissionType, timerStart, reportCardData, previousRoundWrong, column4Presidents, roundResults, autoReturnTimer, startNewRound } from './gameLogic.js';
import { shuffle, getOrdinal, getSuitLetter } from './utils.js';

const optionDivs = document.querySelectorAll('.option');
let timeoutId = null;

// Update answer options
export function updateOptions(options, difficulty) {
    console.log('Updating options with:', options, 'for difficulty:', difficulty);  // Log options and difficulty
    optionDivs.forEach((div, i) => {
        if (i < difficulty) {
            div.style.display = 'block';
            div.innerText = options[i] || 'N/A';
            div.dataset.value = options[i];
            div.classList.remove('disabled', 'correct', 'try-again', 'hints', 'hint-text');
            div.title = '';
        } else {
            div.style.display = 'none';
        }
    });
}

// Update president card image
export function updateImage(imgSrc) {
    const currentImg = document.getElementById('currentImage');
    if (!currentImg) {
        console.error('currentImage element not found');
        return;
    }
    console.log('Updating image to:', imgSrc);  // Log the image source being set
    currentImg.style.transition = 'opacity 0.1s ease';
    currentImg.style.opacity = 0;
    setTimeout(() => {
        currentImg.src = imgSrc;
        currentImg.style.opacity = 1;
    }, 100);
}

// Hide all screens
export function hideAllScreens() {
    ['gameArea', 'reportCard', 'fullScreenView', 'finalMessage', 'overallTop10', 'speedrunTop10', 'scoreSubmission', 'settingsPopup'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

// Show a message
export function showMessage(text) {
    const messageElement = document.getElementById('message');
    if (!messageElement) {
        console.error('message element not found');
        return;
    }
    if (text) {
        messageElement.innerHTML = `<span class="cloud-text">${text} <i class="fas fa-cog gear-icon" title="Settings"></i></span>`;
        messageElement.style.display = 'block';
    } else {
        messageElement.innerHTML = '';
        messageElement.style.display = 'none';
    }
}

// Show report card
export function showReportCard() {
    hideAllScreens();
    const roundIndicator = document.getElementById('roundIndicator');
    if (roundIndicator) roundIndicator.innerText = `Rd ${round}/9`;
    const reportCard = document.getElementById('reportCard');
    if (!reportCard) {
        console.error('reportCard element not found');
        return;
    }
    reportCard.style.display = 'block';
    showMessage('');

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
    if (!col) {
        console.error(`column${round} element not found`);
        return;
    }
    const data = reportCardData[columnIndex];
    const missedSet = new Set(data.missed);
    const total = data.data.length;
    const correct = data.numberCorrectOnFirstTry;
    const percentage = Math.round((correct / total) * 100);
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
    previousRoundWrong = missedInRound;

    if (round === 9) {
        const sumCorrect = roundResults.reduce((acc, r) => acc + r.correct, 0);
        const sumTotal = roundResults.reduce((acc, r) => acc + r.total, 0);
        const overallAccuracy = (sumCorrect / sumTotal * 100).toFixed(2);
        submissionType = "overall";
        showScoreSubmission(overallAccuracy);
    }
}

// Show full list of presidents in a round
export function showFullList(column) {
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
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        document.getElementById('fullScreenView').style.display = 'none';
        document.getElementById('reportCard').style.display = 'block';
    }, 30000);
}

// Setup event listeners (renamed from setupOptionListeners for clarity)
export function setupEventListeners() {
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
                    currentPresident.corrects = (currentPresident.corrects || 0) + 1;
                    roundCorrects += 1;
                    currentPresident.streak = (currentPresident.streak || 0) + 1;
                    currentRoundResults[currentIndex] = true;
                } else {
                    currentPresident.streak = 0;
                }

                setTimeout(moveToNextPresident, 1000);
            } else {
                attempts += 1;

                if (attempts === 1) {
                    div.innerText = "try again";
                    div.classList.add('disabled', 'try-again');
                } else if (attempts === 2) {
                    let availableHints = [];

                    if (currentPresident.name === "Garfield") {
                        availableHints = [
                            { description: accomplishmentsByName[currentPresident.name][0].description, year: 1881 },
                            { description: "On September 19, 1881, James A. Garfield died of assassination, ending his presidency after 6 months, and was succeeded by Chester A. Arthur.", year: 1881 }
                        ];
                    } else if (currentPresident.name === "W.H. Harrison") {
                        availableHints = [
                            { description: accomplishmentsByName[currentPresident.name][0].description, year: 1841 },
                            { description: "On April 4, 1841, W.H. Harrison died of pneumonia, ending his presidency after 1 month, and was succeeded by John Tyler.", year: 1841 }
                        ];
                    } else if (currentPresident.name === "Cleveland") {
                        let termYears = currentPresident.rank === 22 ? { start: 1885, end: 1888 } : { start: 1893, end: 1896 };
                        let termAccomplishments = accomplishmentsByName[currentPresident.name].filter(entry => 
                            entry.year >= termYears.start && entry.year <= termYears.end
                        );
                        availableHints = termAccomplishments.map(entry => ({ 
                            description: entry.description, 
                            year: Number(entry.year)
                        }));
                        availableHints.push({ description: "Grover Cleveland served two non-consecutive terms as the 22nd and 24th President.", year: Infinity });
                    } else {
                        availableHints = accomplishmentsByName[currentPresident.name].map(entry => ({ 
                            description: entry.description, 
                            year: Number(entry.year)
                        }));
                    }

                    if (!currentPresident.usedHints) currentPresident.usedHints = [];
                    let unusedHints = availableHints.filter(h => !currentPresident.usedHints.includes(h.description));
                    if (unusedHints.length < currentDifficulty - 1) {
                        currentPresident.usedHints = [];
                        unusedHints = availableHints;
                    }

                    let selectedHints = shuffle(unusedHints).slice(0, currentDifficulty - 1);
                    selectedHints.forEach(h => {
                        if (!currentPresident.usedHints.includes(h.description)) {
                            currentPresident.usedHints.push(h.description);
                        }
                    });
                    selectedHints.sort((a, b) => a.year - b.year);

                    if (isMobilePortrait()) {
                        const superButton = document.getElementById('superButton');
                        superButton.innerText = selectedHints[0].description || "No hints available";
                        superButton.style.display = 'flex';
                        optionDivs.forEach(d => d.style.display = 'none');
                        superButton.onclick = function() {
                            superButton.style.display = 'none';
                            moveToNextPresident();
                        };
                    } else {
                        let hintIndex = 0;
                        optionDivs.forEach(d => {
                            if (d.style.display !== 'none') {
                                let isCorrectOption = currentMode === 'number' 
                                    ? Number(d.dataset.value) === currentPresident.rank 
                                    : d.dataset.value === currentPresident.term;
                                if (!isCorrectOption) {
                                    if (hintIndex < selectedHints.length) {
                                        let sentence = selectedHints[hintIndex].description;
                                        d.innerText = sentence;
                                        d.title = sentence;
                                        d.classList.add('hint-text');
                                        hintIndex += 1;
                                    } else {
                                        d.innerText = '';
                                        d.title = '';
                                    }
                                    d.classList.add('disabled', 'hints');
                                } else {
                                    d.classList.add('correct');
                                    d.classList.remove('disabled');
                                }
                            }
                        });

                        let ordinal = getOrdinal(currentPresident.rank);
                        let message = `${currentPresident.name} was the <u>${ordinal}</u> President in ${currentPresident.term}.`;
                        showMessage(message);
                    }
                    currentPresident.streak = 0;
                }
            }
        });
    });

    document.getElementById('message').addEventListener('click', function(event) {
        if (event.target.classList.contains('gear-icon')) {
            openSettingsPopup();
        }
    });

    document.getElementById('settingsOkay').addEventListener('click', function() {
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        currentMode = selectedMode;
        currentDifficulty = parseInt(selectedDifficulty, 10);
        document.getElementById('settingsPopup').style.display = 'none';
        moveToNextPresident();
    });

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('showMore') && event.target.hasAttribute('data-column')) {
            event.preventDefault();
            let column = event.target.getAttribute('data-column');
            showFullList(column);
        }
    });

    document.getElementById('returnLink').addEventListener('click', function(event) {
        event.preventDefault();
        clearTimeout(timeoutId);
        document.getElementById('fullScreenView').style.display = 'none';
        document.getElementById('reportCard').style.display = 'block';
    });

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

    document.getElementById('viewOverallTop10').addEventListener('click', function(event) {
        event.preventDefault();
        showOverallTop10();
    });

    document.getElementById('viewSpeedrunTop10').addEventListener('click', function(event) {
        event.preventDefault();
        showSpeedrunTop10();
    });

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
}

// Helper function to check mobile portrait mode
function isMobilePortrait() {
    return window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;
}

// Score submission and top 10 display functions
function formatTime(ms) {
    let minutes = Math.floor(ms / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);
    let milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
}

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

export function showScoreSubmission(score) {
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

function showFinalMessage(accuracy) {
    let grade;
    if (accuracy >= 90) grade = "A 😊";
    else if (accuracy >= 80) grade = "B";
    else if (accuracy >= 70) grade = "C";
    else grade = "F <span style='color:red'>SEE ME</span>";
    document.getElementById('finalScore').innerHTML = `You scored ${accuracy}%`;
    document.getElementById('grade').innerHTML = grade;
    document.getElementById('finalMessage').style.display = 'block';
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('reportCard').style.display = 'none';
}

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

// Expose setupOptionListeners for compatibility with your import
export { setupEventListeners as setupOptionListeners };