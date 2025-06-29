// gameLogic.js
// Manages game logic and state for the US Presidents Game

import { presidents, accomplishmentsByName, saveData, preloadNextImage } from './data.js';
import { shuffle, getDeviation, getOrdinal } from './utils.js';
import { updateOptions, updateImage, hideAllScreens, showMessage, showReportCard } from './ui.js';

export let round = 1;
export let order = [];
export let currentIndex = 0;
export let currentPresident = null;
export let currentMode = 'number'; // 'number' or 'years'
export let currentDifficulty = 3; // Default difficulty
export let attempts = 0;
export let roundCorrects = 0;
export let currentRoundResults = [];
export let previousRoundWrong = [];
export let reportCardData = Array(9).fill().map(() => ({ round: 0, data: [], numberCorrectOnFirstTry: 0, missed: [] }));
export let column4Presidents = new Set();
export let roundResults = [];
export let timerStart = null;
export let submissionType = null;
export let autoReturnTimer = null;

// Generate answer options
export function generateOptions(correctRank, streak, mode, difficulty) {
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
    if (currentPresident?.name === "Cleveland") {
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
        let allOtherRanks = Array.from({ length: 32 }, (_, i) => i + 1).filter(x => x !== r && !incorrectRanks.includes(x));
        if (currentPresident?.name === "Cleveland") {
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
    return mode === 'number' ? ranks.map(rank => rank.toString()) : ranks.map(rank => presidents[rank - 1].term);
}

// Start a new president question
export function startNewPresident() {
    if (currentIndex >= order.length) {
        showReportCard();
        return;
    }
    currentPresident = presidents[order[currentIndex]];
    console.log('Current president:', currentPresident);  // Verify currentPresident has data
    if (!currentPresident) {
        console.error('No current president selected');
        return;
    }
    currentPresident.totalTrials = (currentPresident.totalTrials || 0) + 1;
    attempts = 0;

    const imgSrc = `../assets/cards/${getSuitLetter(currentPresident.suit)}-${currentPresident.rank}.jpg`;
    console.log('Image source:', imgSrc);  // Check if the path is correct
    updateImage(imgSrc);
    preloadNextImage(currentIndex, order);

    const options = generateOptions(currentPresident.rank, currentPresident.streak || 0, currentMode, currentDifficulty);
    console.log('Generated options:', options);  // Ensure options array has values
    updateOptions(options, currentDifficulty);
    document.getElementById('superButton').style.display = 'none';
    showMessage('');
}

// Move to the next president
export function moveToNextPresident() {
    if (currentIndex + 1 < order.length) {
        currentIndex++;
        saveData();
        startNewPresident();
    } else {
        showReportCard();
    }
}

// Start a new round
export function startNewRound() {
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
        let remaining = accuracy.filter(a => ! Participation.includes(a.index));
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
    startNewPresident();
}