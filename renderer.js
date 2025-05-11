// renderer.js
// Handles all rendering and drawing to the canvas
import { bird, pipes, score, highScore, gameOver, gameStarted } from './gameLogic.js';
import { assets } from './assetLoader.js';
import { BIRD_SIZE, PIPE_WIDTH, PIPE_GAP, BASE_WIDTH, BASE_HEIGHT } from './constants.js';

export function render(ctx, canvas) {
    // Draw background
    if (assets.background) {
        ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Draw pipes
    pipes.forEach(pipe => {
        if (assets.pipe) {
            // Top pipe
            ctx.save();
            ctx.translate(pipe.x + PIPE_WIDTH / 2, pipe.gapY);
            ctx.scale(1, -1);
            ctx.drawImage(assets.pipe, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, canvas.height);
            ctx.restore();
            // Bottom pipe
            ctx.drawImage(assets.pipe, pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, canvas.height);
        } else {
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
            ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.gapY - PIPE_GAP);
        }
    });
    // Draw ground
    if (assets.ground) {
        ctx.drawImage(assets.ground, 0, canvas.height - 100 * (canvas.height / BASE_HEIGHT), canvas.width, 100 * (canvas.height / BASE_HEIGHT));
    } else {
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, canvas.height - 100 * (canvas.height / BASE_HEIGHT), canvas.width, 100 * (canvas.height / BASE_HEIGHT));
    }
    // Draw bird
    if (assets.bird) {
        ctx.save();
        let birdRotation = Math.min(Math.max(bird.velocity * 3, -30), 30);
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate((birdRotation * Math.PI) / 180);
        ctx.drawImage(assets.bird, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.restore();
    } else {
        ctx.fillStyle = '#ff0';
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    }
    // Draw score
    ctx.font = assets.font || '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(score, canvas.width / 2, 80);
    // Draw high score
    ctx.font = '12px monospace';
    ctx.fillStyle = '#eee';
    ctx.fillText('High Score: ' + highScore, canvas.width / 2, 30);
    // Draw game over
    if (gameOver) {
        ctx.font = assets.font || '24px monospace';
        ctx.fillStyle = '#f00';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Click or Tap to Restart', canvas.width / 2, canvas.height / 2 + 40);
    } else if (!gameStarted) {
        ctx.font = assets.font || '24px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Tap or Click to Start', canvas.width / 2, canvas.height / 2);
    }
}