// data.js
// Handles data fetching, storage, and preloading for the US Presidents Game

import { getSuitLetter } from './utils.js';

export let presidents = [];
export let yearlyAccomplishments = [];
export let accomplishmentsByName = {};

// Load presidents data from JSON and local storage
export async function loadPresidents() {
    try {
        const response = await fetch('../json/presidents.json');
        if (!response.ok) throw new Error('Failed to load presidents.json');
        presidents = await response.json();
        console.log('Presidents loaded:', presidents);  // Check if presidents array is populated
        const savedData = localStorage.getItem('presidentsData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            presidents.forEach((p, i) => {
                p.streak = parsedData[i]?.streak || 0;
                p.totalTrials = parsedData[i]?.totalTrials || 0;
                p.corrects = parsedData[i]?.corrects || 0;
                p.usedHints = parsedData[i]?.usedHints || [];
            });
        }
    } catch (error) {
        console.error('Error loading presidents data:', error);
    }
}

// Load accomplishments data from JSON
export async function loadAccomplishments() {
    try {
        const response = await fetch('../json/yearly_accomplishments.json');
        if (!response.ok) throw new Error('Failed to load yearly_accomplishments.json');
        yearlyAccomplishments = await response.json();
        accomplishmentsByName = {};
        yearlyAccomplishments.forEach(entry => {
            accomplishmentsByName[entry.name] = accomplishmentsByName[entry.name] || [];
            accomplishmentsByName[entry.name].push(entry);
        });
        console.log('Accomplishments by name:', accomplishmentsByName);  // Check accomplishments object
    } catch (error) {
        console.error('Error loading accomplishments data:', error);
    }
}

// Preload all president card images
export function preloadAllImages() {
    presidents.forEach(p => {
        const img = new Image();
        img.src = `../assets/cards/${getSuitLetter(p.suit)}-${p.rank}.jpg`;
    });
}

// Preload the next president’s image
export function preloadNextImage(currentIndex, order) {
    const nextImg = document.getElementById('nextImage');
    if (currentIndex + 1 < order.length) {
        const nextPresident = presidents[order[currentIndex + 1]];
        const nextImgSrc = `../assets/cards/${getSuitLetter(nextPresident.suit)}-${nextPresident.rank}.jpg`;
        nextImg.src = nextImgSrc;
        nextImg.onload = () => console.log(`Preloaded ${nextImgSrc} for ${nextPresident.name}`);
        nextImg.onerror = () => console.log(`Failed to preload ${nextImgSrc}`);
        nextImg.style.display = 'none';
    } else {
        nextImg.src = '';
        nextImg.style.display = 'none';
    }
}

// Save president data to local storage
export function saveData() {
    const data = presidents.map(p => ({
        streak: p.streak,
        totalTrials: p.totalTrials,
        corrects: p.corrects,
        usedHints: p.usedHints || []
    }));
    localStorage.setItem('presidentsData', JSON.stringify(data));
}