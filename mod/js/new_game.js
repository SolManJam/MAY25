// new_game.js
// Main entry point for the US Presidents Game

import { loadPresidents, loadAccomplishments, preloadAllImages } from './data.js';
import { startNewRound, currentMode, currentDifficulty } from './gameLogic.js';
import { setupOptionListeners } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadPresidents();
    console.log('Presidents after load:', presidents);  // Confirm presidents data
    await loadAccomplishments();
    console.log('Accomplishments after load:', accomplishmentsByName);  // Confirm accomplishments data
    preloadAllImages();
    const savedMode = localStorage.getItem('gameMode') || 'number';
    const savedDifficulty = localStorage.getItem('gameDifficulty') || '3';
    currentMode = savedMode;
    currentDifficulty = parseInt(savedDifficulty, 10);
    console.log('Starting game with mode:', currentMode, 'and difficulty:', currentDifficulty);  // Log settings
    startNewRound();
    setupOptionListeners();
});