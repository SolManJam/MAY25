// utils.js
// Utility functions for the US Presidents Game

export function getSuitLetter(suit) {
    if (suit === "democratic") return "D";
    if (suit === "republican") return "R";
    if (suit === "other") return "O";
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function getDeviation(streak) {
    if (streak === 0) return { minD: 5, maxD: 9 };
    else if (streak === 1) return { minD: 3, maxD: 7 };
    else if (streak === 2) return { minD: 2, maxD: 5 };
    else return { minD: 1, maxD: 2 };
}

export function getOrdinalSuffix(rank) {
    const j = rank % 10,
          k = rank % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
}

export function getOrdinal(rank) {
    if (rank === 1) return "First";
    if (rank === 2) return "Second";
    if (rank === 3) return "Third";
    return rank + getOrdinalSuffix(rank);
}