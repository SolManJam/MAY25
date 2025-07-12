document.addEventListener('DOMContentLoaded', function() {
    const reportCardData = JSON.parse(localStorage.getItem('reportCardData')) || [];
    const currentRound = parseInt(localStorage.getItem('currentRound'));
    const timerStart = parseInt(localStorage.getItem('timerStart') || '0');
    if (!currentRound || reportCardData.length === 0) {
        window.location.href = 'index.html'; // Redirect back if no data
        return;
    }

    // Set round indicator
    document.getElementById('roundIndicator').innerText = `Rd ${currentRound}/9`;

    // Populate all columns up to current round
    for (let i = 1; i <= 9; i++) {
        const col = document.getElementById(`column${i}`);
        const data = reportCardData[i - 1];
        if (data && data.round !== 0) {
            const missedSet = new Set(data.missed);
            const total = data.data.length;
            const correct = data.numberCorrectOnFirstTry;
            const percentage = Math.round((correct / total) * 100);
            let entries = data.data.map(d => {
                const isMissed = missedSet.has(d.presidentIndex);
                const displayName = isMissed ? `${d.rank} ${d.name} (${d.term})` : `${d.name} (${d.term})`;
                return `<div class="${isMissed ? 'missed' : ''}">${displayName}</div>`;
            });
            const displayList = entries.slice(0, 10).join('') + `<a href="#" class="showMore" data-column="${i}">show more</a>`;
            col.innerHTML = `<div class="cloud-text"><p class="percentage">${percentage.toString().padStart(2, '0')}%</p><h3>Round ${i}: ${correct}/${total}</h3>${displayList}</div>`;
        } else {
            col.innerHTML = '';
        }
    }

    // Handle speedrun (round 1 perfect score) or overall score submission (round 9)
    const continueButton = document.getElementById('continue');
    const scoreSubmission = document.getElementById('scoreSubmission');
    if (currentRound === 1 && reportCardData[0].numberCorrectOnFirstTry === 32) {
        continueButton.style.display = 'none';
        scoreSubmission.style.display = 'block';
        document.getElementById('submitScore').onclick = function() {
            const initials = document.getElementById('initials').value.trim().toUpperCase();
            if (initials.length !== 3 || !/^[A-Z]{3}$/.test(initials)) {
                alert("Please enter exactly 3 letters.");
                return;
            }
            const time = Date.now() - timerStart;
            saveScore("speedrun", initials, time);
            scoreSubmission.style.display = 'none';
            localStorage.setItem('nextRound', '2');
            window.location.href = 'index.html';
        };
    } else if (currentRound === 9) {
        continueButton.style.display = 'none';
        scoreSubmission.style.display = 'block';
        document.getElementById('submitScore').onclick = function() {
            const initials = document.getElementById('initials').value.trim().toUpperCase();
            if (initials.length !== 3 || !/^[A-Z]{3}$/.test(initials)) {
                alert("Please enter exactly 3 letters.");
                return;
            }
            const sumCorrect = reportCardData.reduce((acc, r) => acc + r.numberCorrectOnFirstTry, 0);
            const sumTotal = reportCardData.reduce((acc, r) => acc + r.data.length, 0);
            const overallAccuracy = (sumCorrect / sumTotal * 100).toFixed(2);
            saveScore("overall", initials, overallAccuracy);
            localStorage.setItem('finalAccuracy', overallAccuracy);
            window.location.href = 'index.html';
        };
    } else {
        scoreSubmission.style.display = 'none';
        continueButton.style.display = 'block';
        continueButton.addEventListener('click', function() {
            localStorage.setItem('nextRound', currentRound + 1);
            window.location.href = 'index.html';
        });
    }

    // Handle "show more" links
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('showMore')) {
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

    function showFullList(column) {
        document.getElementById('reportCard').style.display = 'none';
        const gridContainer = document.getElementById('gridContainer');
        gridContainer.innerHTML = '';
        const columnIndex = parseInt(column) - 1;
        const data = reportCardData[columnIndex];
        if (!data || data.round === 0) return;
        const missedSet = new Set(data.missed);
        const entries = data.data.map(d => {
            const isMissed = missedSet.has(d.presidentIndex);
            const displayName = `${d.rank} ${d.name} (${d.term})`;
            return `<div class="cloud-text ${isMissed ? 'missed' : ''}">${displayName}</div>`;
        });
        gridContainer.innerHTML = entries.join('');
        document.getElementById('fullScreenView').style.display = 'block';
    }

    function saveScore(type, initials, score) {
        const key = type === "overall" ? "overallTop10" : "speedrunTop10";
        let scores = JSON.parse(localStorage.getItem(key)) || [];
        scores.push({ initials, score });
        scores.sort(type === "overall" ? (a, b) => b.score - a.score : (a, b) => a.score - b.score);
        scores = scores.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(scores));
    }
});