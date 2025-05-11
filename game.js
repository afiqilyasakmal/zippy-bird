// Game constants
const GRAVITY = 0.5;
const FLAP_SPEED = -8;
const PIPE_SPEED = 2;
const PIPE_SPAWN_INTERVAL = 1500;
const BIRD_SIZE = 50;
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;

// Game assets
const assets = {
    bird: null,
    pipe: null,
    background: null,
    ground: null,
    jumpSound: null,
    gameOverSound: null,
    font: null,
    scoreSound: null
};

// Game variables
let canvas, ctx;
let bird = {
    x: 60,
    y: 240,
    velocity: 0,
    width: BIRD_SIZE,
    height: BIRD_SIZE
};
let pipes = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameStarted = false;
let gameOver = false;
let gameOverSoundPlayed = false;
let pause = false;
let pauseCountdown = 0;
let pauseCountdownInterval = null;
let pauseResumeCallback = null;

// Initialize game
// Load game assets
async function loadAssets() {
    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    const loadAudio = (src) => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
            audio.src = src;
        });
    };

    try {
        assets.bird = await loadImage('assets/bird.svg');
        assets.pipe = await loadImage('assets/pipe.svg');
        assets.background = await loadImage('assets/background.svg');
        assets.ground = await loadImage('assets/ground.svg');
        assets.jumpSound = await loadAudio('assets/jump.wav');
        assets.gameOverSound = await loadAudio('assets/game-over.mp3');
        assets.scoreSound = await loadAudio('assets/score.wav');
        // Load retro font
        try {
            const font = new FontFace('Press Start 2P', 'url(assets/PressStart2P-Regular.ttf)');
            await font.load();
            document.fonts.add(font);
            assets.font = '"Press Start 2P", monospace';
        } catch (fontError) {
            console.error('Error loading font:', fontError);
            assets.font = 'monospace';
        }
    } catch (error) {
        console.error('Error loading assets:', error);
    }
}

async function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Load assets before starting the game
    await loadAssets();

    // Set canvas size to be responsive
    function resizeCanvas() {
        const height = window.innerHeight;
        const aspectRatio = 1;
        canvas.height = height;
        canvas.width = height / aspectRatio;
    }
    
    // Initial resize and add listener for window changes
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') handleClick();
        if (e.code === 'KeyP') handlePause();
    });
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Start spawning pipes
    setInterval(spawnPipe, PIPE_SPAWN_INTERVAL);
}

// Handle click/tap events
function handleClick() {
    if (gameOver) {
        resetGame();
        return;
    }
    
    if (!gameStarted) {
        gameStarted = true;
    }
    
    bird.velocity = FLAP_SPEED;
    // Play jump sound
    if (assets.jumpSound) {
        assets.jumpSound.currentTime = 0; // Reset sound to start
        assets.jumpSound.play().catch(error => console.error('Error playing sound:', error));
    }
}

// Spawn new pipe
function spawnPipe() {
    if (!gameStarted || gameOver) return;
    const MIN_PIPE_DISTANCE = 180; // Minimum horizontal distance between pipes
    // Only spawn if no pipes or last pipe is far enough to the left
    if (pipes.length > 0) {
        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe.x > canvas.width - MIN_PIPE_DISTANCE) {
            return;
        }
    }
    const gapY = Math.floor(Math.random() * (canvas.height - PIPE_GAP - 100)) + 50;
    pipes.push({
        x: canvas.width,
        gapY: gapY,
        passed: false
    });
}

// Update game state
function update() {
    if (!gameStarted || pause || pauseCountdown > 0) return;

    // Update bird position
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Check collisions
    if (bird.y < 0 || bird.y > canvas.height) {
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
        // Update pipes
        pipes.forEach((pipe, index) => {
            pipe.x -= PIPE_SPEED;
            
            // Check if bird passed the pipe
            if (!pipe.passed && bird.x > pipe.x + PIPE_WIDTH) {
                pipe.passed = true;
                score++;
                if (assets.scoreSound) {
                    assets.scoreSound.currentTime = 0;
                    assets.scoreSound.play().catch(error => console.error('Error playing score sound:', error));
                }
            }
            
            // Check collision with pipes
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
        
        // Remove off-screen pipes
        pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    }
}

// Draw game objects
function handlePause() {
    if (gameOver || !gameStarted) return;
    if (!pause) {
        pause = true;
        pauseCountdown = 0;
        clearInterval(pauseCountdownInterval);
    } else {
        // Start countdown before resuming
        pauseCountdown = 3;
        pauseCountdownInterval = setInterval(() => {
            pauseCountdown--;
            if (pauseCountdown <= 0) {
                clearInterval(pauseCountdownInterval);
                pause = false;
                pauseCountdown = 0;
            }
        }, 1000);
    }
}

function draw() {
    if (!assets.background || !assets.bird || !assets.pipe || !assets.ground) return;

    // Draw background
    ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    
    // Draw bird
    ctx.drawImage(assets.bird, bird.x, bird.y, bird.width, bird.height);
    
    // Draw pipes
    pipes.forEach(pipe => {
        // Draw top pipe
        ctx.drawImage(assets.pipe, pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        // Draw bottom pipe
        ctx.drawImage(
            assets.pipe,
            pipe.x,
            pipe.gapY + PIPE_GAP,
            PIPE_WIDTH,
            canvas.height - (pipe.gapY + PIPE_GAP)
        );
    });
    
    // Draw ground
    ctx.drawImage(assets.ground, 0, canvas.height - 100, canvas.width, 100);
    
    // Draw credit at the bottom center
    ctx.font = `16px ${assets.font}`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    const creditText = 'by Afiq Ilyasa Akmal';
    const creditY = canvas.height - 30;
    ctx.strokeText(creditText, canvas.width / 2, creditY);
    ctx.fillText(creditText, canvas.width / 2, creditY);
    
    // Draw score
    ctx.font = `20px ${assets.font}`;
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#fff';
    ctx.strokeText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.strokeText(`High Score: ${highScore}`, 10, 60);
    ctx.fillText(`High Score: ${highScore}`, 10, 60);
    
    // Draw game over message
    if (gameOver) {
        ctx.font = `32px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#fff';
        ctx.strokeText('Game Over!', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
        ctx.font = `16px ${assets.font}`;
        ctx.strokeText('Click or press Space to restart', canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Click or press Space to restart', canvas.width / 2, canvas.height / 2 + 40);
    }
    
    // Draw start message
    if (!gameStarted) {
        // Draw the title in two rows above the start message
        ctx.font = `32px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#fff';
        // First row: "ZIPPY"
        ctx.strokeText('ZIPPY', canvas.width / 2, canvas.height / 2 - 90);
        ctx.fillText('ZIPPY', canvas.width / 2, canvas.height / 2 - 90);
        // Second row: "BIRD"
        ctx.strokeText('BIRD', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('BIRD', canvas.width / 2, canvas.height / 2 - 50);
        // Draw the start message below the title
        ctx.font = `20px ${assets.font}`;
        ctx.lineWidth = 3;
        ctx.strokeText('Click or press Space to start', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Click or press Space to start', canvas.width / 2, canvas.height / 2);
    }
    // Draw pause overlay
    if (pause && pauseCountdown === 0) {
        ctx.font = `32px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#fff';
        ctx.strokeText('Paused', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = `16px ${assets.font}`;
        ctx.strokeText('Press P again to resume', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press P again to resume', canvas.width / 2, canvas.height / 2 + 20);
    }
    if (pauseCountdown > 0) {
        ctx.font = `48px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#fff';
        ctx.strokeText(pauseCountdown, canvas.width / 2, canvas.height / 2);
        ctx.fillText(pauseCountdown, canvas.width / 2, canvas.height / 2);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Reset game state
function resetGame() {
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
    pauseCountdown = 0;
    clearInterval(pauseCountdownInterval);
}

// Start the game
init();