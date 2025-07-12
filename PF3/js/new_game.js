// US Presidents Game - Updated JavaScript File with New Project Structure
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
let yearlyAccomplishments;
let accomplishmentsByName;

// Helper Functions
function getSuitLetter(suit) {
    if (suit === "democratic") return "D";
    if (suit === "republican") return "R";
    if (suit === "other") return "O";
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getDeviation(streak) {
    if (streak === 0) return { minD: 5, maxD: 9 };
    else if (streak === 1) return { minD: 3, maxD: 7 };
    else if (streak === 2) return { minD: 2, maxD: 5 };
    else return { minD: 1, maxD: 2 };
}

function getOrdinalSuffix(rank) {
    const j = rank % 10,
          k = rank % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
}

function getOrdinal(rank) {
    if (rank === 1) return "First";
    if (rank === 2) return "Second";
    if (rank === 3) return "Third";
    return rank + getOrdinalSuffix(rank);
}

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
    //document.getElementById('reportCard').style.display = 'none';
    //document.getElementById('fullScreenView').style.display = 'none';
    document.getElementById('finalMessage').style.display = 'none';
    document.getElementById('overallTop10').style.display = 'none';
    document.getElementById('speedrunTop10').style.display = 'none';
    //document.getElementById('scoreSubmission').style.display = 'none';
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

function saveData() {
    const data = presidents.map(p => ({
        streak: p.streak,
        totalTrials: p.totalTrials,
        corrects: p.corrects,
        usedHints: p.usedHints || []
    }));
    localStorage.setItem('presidentsData', JSON.stringify(data));
}

function preloadAllImages() {
    presidents.forEach(p => {
        const img = new Image();
        img.src = `../assets/cards/${getSuitLetter(p.suit)}-${p.rank}.jpg`;
    });
}

function preloadNextImage() {
    const nextImg = document.getElementById('nextImage');
    if (currentIndex + 1 < order.length) {
        const nextPresident = presidents[order[currentIndex + 1]];
        const nextImgSrc = `../assets/cards/${getSuitLetter(nextPresident.suit)}-${nextPresident.rank}.jpg`;
        nextImg.src = nextImgSrc;
        nextImg.onload = () => console.log(`Preloaded ${nextImgSrc} for ${nextPresident.name}`);
        nextImg.onerror = () => console.log(`Failed to preload ${nextImgSrc}`);
    } else {
        nextImg.src = '';
    }
    nextImg.style.display = 'none';
}

function changeImageSmoothly(nextPresidentIndex) {
    const currentImg = document.getElementById('currentImage');
    const nextImg = document.getElementById('nextImage');
    currentImg.style.transition = 'opacity 0.1s ease';
    currentImg.style.opacity = 0;
    setTimeout(() => {
        const nextPresident = presidents[nextPresidentIndex];
        const imgSrc = `../assets/cards/${getSuitLetter(nextPresident.suit)}-${nextPresident.rank}.jpg`;
        if (nextImg.src) {
            currentImg.src = nextImg.src;
        } else {
            currentImg.src = imgSrc;
        }
        currentImg.style.opacity = 1;
        nextImg.src = '';
        nextImg.style.display = 'none';
        preloadNextImage();
    }, 100);
}

function isMobile() {
    return window.matchMedia("(max-width: 900px)").matches;
}

function isPortrait() {
    return window.matchMedia("(orientation: portrait)").matches;
}

function startNewPresident() {
    if (currentIndex >= order.length) {
        showReportCard();
        return;
    }
    currentPresident = presidents[order[currentIndex]];
    currentPresident.totalTrials += 1;
    attempts = 0;

    const currentImg = document.getElementById('currentImage');
    const imgSrc = `../assets/cards/${getSuitLetter(currentPresident.suit)}-${currentPresident.rank}.jpg`;
    currentImg.style.transition = 'opacity 0.1s ease';
    currentImg.style.opacity = 0;

    setTimeout(() => {
        currentImg.src = imgSrc;
        currentImg.style.opacity = 1;
        preloadNextImage();
    }, 100);

    const options = generateOptions(currentPresident.rank, currentPresident.streak, currentMode, currentDifficulty);
    optionDivs.forEach((div, i) => {
        if (i < currentDifficulty) {
            div.style.display = 'block';
            div.innerText = options[i];
            div.dataset.value = options[i];
            div.classList.remove('disabled', 'correct', 'try-again', 'hints', 'hint-text');
            div.title = '';
        } else {
            div.style.display = 'none';
        }
    });

    document.getElementById('superButton').style.display = 'none';
    showMessage('');
}

function moveToNextPresident() {
    if (currentIndex + 1 < order.length) {
        currentIndex++;
        startNewPresident();
    } else {
        showReportCard();
    }
}

function startNewRound() {
    

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
    //document.getElementById('reportCard').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
    startNewPresident();
}

function showReportCard() {
    const columnIndex = round - 1;
    const missedInRound = order.filter((_, i) => !currentRoundResults[i]);
    reportCardData[columnIndex] = {
        round: round,
        numberCorrectOnFirstTry: roundCorrects,
        data: order.map(index => ({
            presidentIndex: index,
            name: presidents[index].name, // Added for display in report-card.html
            rank: presidents[index].rank, // Added for display
            term: presidents[index].term, // Added for display
            corrects: presidents[index].corrects,
            totalTrials: presidents[index].totalTrials
        })),
        missed: missedInRound
    };

    roundResults.push({ round: round, correct: roundCorrects, total: order.length });
    previousRoundWrong = missedInRound;

    // Save data to localStorage
    localStorage.setItem('reportCardData', JSON.stringify(reportCardData));
    localStorage.setItem('currentRound', round);

    // Handle special cases
    if (round === 1 && roundCorrects === 32) {
        // Speedrun case: perfect score in round 1
        const speedrunTime = Date.now() - timerStart;
        localStorage.setItem('speedrunTime', speedrunTime);
    } else if (round === 9) {
        // Final round: calculate overall accuracy
        const sumCorrect = roundResults.reduce((acc, r) => acc + r.correct, 0);
        const sumTotal = roundResults.reduce((acc, r) => acc + r.total, 0);
        const overallAccuracy = (sumCorrect / sumTotal * 100).toFixed(2);
        localStorage.setItem('overallAccuracy', overallAccuracy);
        localStorage.setItem('showFinalMessage', 'true');
    } else {
        // Set next round for rounds 2-8
        localStorage.setItem('nextRound', round + 1);
    }

    // Transition to report-card.html
    window.location.href = 'report-card.html';
}

// Event Listeners
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

                if (isMobile()) {
                    const superButton = document.getElementById('superButton');
                    const image = document.getElementById('currentImage');
                    superButton.innerText = selectedHints[0].description || "No hints available";
                    superButton.style.display = 'flex';
                    if (isPortrait()) {
                        superButton.style.width = `${image.offsetWidth}px`;
                        superButton.style.left = '50%';
                        superButton.style.transform = 'translateX(-50%)';
                        superButton.style.height = 'auto';
                    } else {
                        superButton.style.width = '100%';
                        superButton.style.left = '0';
                        superButton.style.transform = 'none';
                        superButton.style.height = '100%';
                    }
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

document.getElementById('settingsOkay').addEventListener('click', function() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    currentMode = selectedMode;
    currentDifficulty = parseInt(selectedDifficulty);
    document.getElementById('settingsPopup').style.display = 'none';
    moveToNextPresident();
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
    //document.getElementById('reportCard').style.display = 'none';
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

// Initialize game on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    fetch('../json/presidents.json')
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
            return fetch('../json/yearly_accomplishments.json');
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
            // Set initial mode and difficulty from local storage
            const savedMode = localStorage.getItem('gameMode') || 'number';
            const savedDifficulty = localStorage.getItem('gameDifficulty') || '3';
            currentMode = savedMode;
            currentDifficulty = parseInt(savedDifficulty, 10);
            startNewRound();
        })
        .catch(error => console.error('Error loading data:', error));
});