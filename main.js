// main.js
// Entry point for the Zippy Bird game
import { BASE_WIDTH, BASE_HEIGHT } from './constants.js';
import { loadAssets, assets } from './assetLoader.js';
import { bird, pipes, score, highScore, gameStarted, gameOver, gameOverSoundPlayed, pause, spawnPipe, update, resetGame } from './gameLogic.js';
import { handleClick, addEventListeners } from './eventHandlers.js';
import { render } from './renderer.js';

let canvas, ctx;

async function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    await loadAssets();
    function resizeCanvas() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let aspectRatio = 9 / 16;
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        canvas.width = width;
        canvas.height = height;
        // Optionally, update scaling factors here if needed
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    addEventListeners(canvas, () => {}); // You can implement pause logic if needed
    requestAnimationFrame(gameLoop);
    setInterval(() => spawnPipe(canvas), 1500);
}

function gameLoop() {
    update(canvas);
    render(ctx, canvas);
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', init);