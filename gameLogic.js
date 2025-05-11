// gameLogic.js
// Handles core game logic: updating state, spawning pipes, collision detection
import { GRAVITY, FLAP_SPEED, PIPE_SPEED, PIPE_SPAWN_INTERVAL, BIRD_SIZE, PIPE_WIDTH, PIPE_GAP, BASE_HEIGHT } from './constants.js';
import { assets } from './assetLoader.js';

export let pipes = [];
export let score = 0;
export let highScore = localStorage.getItem('highScore') || 0;
export let gameStarted = false;
export let gameOver = false;
export let gameOverSoundPlayed = false;
export let pause = false;

export let bird = {
    x: 60,
    y: 240,
    velocity: 0,
    width: BIRD_SIZE,
    height: BIRD_SIZE
};

export function spawnPipe(canvas) {
    if (!gameStarted || gameOver) return;
    const MIN_PIPE_DISTANCE = 200;
    if (pipes.length > 0) {
        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe.x > canvas.width - MIN_PIPE_DISTANCE) {
            return;
        }
    }
    const minPipeHeight = 60;
    const maxGapY = canvas.height - PIPE_GAP - minPipeHeight;
    const gapY = Math.floor(Math.random() * (maxGapY - minPipeHeight + 1)) + minPipeHeight;
    pipes.push({
        x: canvas.width,
        gapY: gapY,
        passed: false
    });
}

export function update(canvas) {
    if (!gameStarted || pause) return;
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    if (bird.y + bird.height > canvas.height - 100 * (canvas.height / BASE_HEIGHT)) {
        bird.velocity = 0;
        bird.y = canvas.height - bird.height - 100 * (canvas.height / BASE_HEIGHT);
        if (!gameOver) {
            gameOver = true;
            if (assets.gameOverSound && !gameOverSoundPlayed) {
                assets.gameOverSound.currentTime = 0;
                assets.gameOverSound.play().catch(error => console.error('Error playing game over sound:', error));
                gameOverSoundPlayed = true;
            }
        }
    }
    if (!gameOver) {
        pipes.forEach((pipe) => {
            pipe.x -= PIPE_SPEED;
            if (!pipe.passed && bird.x > pipe.x + PIPE_WIDTH) {
                pipe.passed = true;
                score++;
                if (assets.scoreSound) {
                    assets.scoreSound.currentTime = 0;
                    assets.scoreSound.play().catch(error => console.error('Error playing score sound:', error));
                }
            }
            if (
                bird.x + BIRD_SIZE > pipe.x &&
                bird.x < pipe.x + PIPE_WIDTH &&
                (bird.y < pipe.gapY || bird.y + BIRD_SIZE > pipe.gapY + PIPE_GAP)
            ) {
                if (!gameOver) {
                    gameOver = true;
                    if (assets.gameOverSound && !gameOverSoundPlayed) {
                        assets.gameOverSound.currentTime = 0;
                        assets.gameOverSound.play().catch(error => console.error('Error playing game over sound:', error));
                        gameOverSoundPlayed = true;
                    }
                }
            }
        });
        pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    }
}

export function resetGame() {
    bird.y = 240;
    bird.velocity = 0;
    pipes = [];
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    score = 0;
    gameStarted = false;
    gameOver = false;
    gameOverSoundPlayed = false;
    pause = false;
}