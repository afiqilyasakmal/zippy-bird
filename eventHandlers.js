// eventHandlers.js
// Handles user input events for the game
import { resetGame, bird, gameOver, gameStarted } from './gameLogic.js';
import { FLAP_SPEED } from './constants.js';
import { assets } from './assetLoader.js';

export function handleClick() {
    if (gameOver) {
        resetGame();
        return;
    }
    if (!gameStarted) {
        gameStarted = true;
    }
    bird.velocity = FLAP_SPEED;
    if (assets.jumpSound) {
        assets.jumpSound.currentTime = 0;
        assets.jumpSound.play().catch(error => console.error('Error playing sound:', error));
    }
}

export function addEventListeners(canvas, handlePause) {
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleClick();
    }, { passive: false });
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') handleClick();
        if (e.code === 'KeyP') handlePause();
    });
}