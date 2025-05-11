// Game constants
const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;
const GRAVITY = 0.55;
const FLAP_SPEED = -8;
const PIPE_SPEED = 2;
const PIPE_SPAWN_INTERVAL = 1500;
let BIRD_SIZE = 100;
let PIPE_WIDTH = 80;
let PIPE_GAP = 200;

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

    // Set canvas size to be responsive and scale game elements
    function resizeCanvas() {
        // Use device width and height, minus some padding for mobile browser UI
        let width = window.innerWidth;
        let height = window.innerHeight;
        // Maintain aspect ratio (portrait for mobile, square for desktop)
        let aspectRatio = 9 / 16; // Portrait
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        canvas.width = width;
        canvas.height = height;
        // Calculate scaling factors
        let scaleX = width / BASE_WIDTH;
        let scaleY = height / BASE_HEIGHT;
        let scale = Math.min(scaleX, scaleY);
        // Dynamically scale game constants
        BIRD_SIZE = 50 * scale;
        PIPE_WIDTH = 80 * scale;
        PIPE_GAP = 200 * scaleY;
        // Update bird size
        bird.width = BIRD_SIZE;
        bird.height = BIRD_SIZE;
        // Optionally, reposition bird if needed
        bird.x = 60 * scaleX;
        // Update pipe positions if needed
        pipes.forEach(pipe => {
            pipe.x = pipe.x * scaleX;
            pipe.gapY = pipe.gapY * scaleY;
        });
    }
    
    // Initial resize and add listener for window changes
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Touch event support for mobile
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleClick();
    }, { passive: false });

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
    const MIN_PIPE_DISTANCE = 200; // Minimum horizontal distance between pipes (wider spacing)
    // Only spawn if no pipes or last pipe is far enough to the left
    if (pipes.length > 0) {
        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe.x > canvas.width - MIN_PIPE_DISTANCE) {
            return;
        }
    }
    // Ensure the gapY leaves enough room for the new larger gap and pipe width
    const minPipeHeight = 60;
    const maxGapY = canvas.height - PIPE_GAP - minPipeHeight;
    const gapY = Math.floor(Math.random() * (maxGapY - minPipeHeight + 1)) + minPipeHeight;
    pipes.push({
        x: canvas.width,
        gapY: gapY,
        passed: false
    });
}

// Update game state
function update() {
    if (!gameStarted || pause) return;

    // Update bird position
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Calculate bird rotation based on velocity
    let birdRotation = Math.min(Math.max(bird.velocity * 3, -30), 30); // Clamp rotation between -30 and 30 degrees
    if (bird.y + bird.height > canvas.height - 100 * (canvas.height / BASE_HEIGHT)) {
        bird.velocity = 0; // Stop bird movement
        bird.y = canvas.height - bird.height - 100 * (canvas.height / BASE_HEIGHT); // Ensure bird stays at ground level
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
    pause = !pause;
}

function draw() {
    if (!assets.background || !assets.bird || !assets.pipe || !assets.ground) return;
    // Draw background
    ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    // Calculate bird rotation based on velocity
    let birdRotation = Math.min(Math.max(bird.velocity * 3, -30), 30); // Clamp rotation between -30 and 30 degrees
    ctx.save(); // Save the current state
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2); // Move to the bird's center
    ctx.rotate(birdRotation * Math.PI / 180); // Rotate the canvas
    ctx.drawImage(assets.bird, -bird.width / 2, -bird.height / 2, bird.width, bird.height); // Draw the bird
    ctx.restore(); // Restore the original state
    // Draw pipes
    pipes.forEach(pipe => {
        ctx.drawImage(assets.pipe, pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.drawImage(
            assets.pipe,
            pipe.x,
            pipe.gapY + PIPE_GAP,
            PIPE_WIDTH,
            canvas.height - (pipe.gapY + PIPE_GAP)
        );
    });
    // Draw ground
    ctx.drawImage(assets.ground, 0, canvas.height - 100 * (canvas.height / BASE_HEIGHT), canvas.width, 100 * (canvas.height / BASE_HEIGHT));
    // Draw credit at the bottom center
    ctx.font = `${16 * (canvas.height / BASE_HEIGHT)}px ${assets.font}`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 * (canvas.height / BASE_HEIGHT);
    ctx.fillStyle = '#fff';
    const creditText = 'by Afiq Ilyasa Akmal';
    const creditY = canvas.height - 30 * (canvas.height / BASE_HEIGHT);
    ctx.strokeText(creditText, canvas.width / 2, creditY);
    ctx.fillText(creditText, canvas.width / 2, creditY);
    // Draw score
    ctx.font = `${20 * (canvas.height / BASE_HEIGHT)}px ${assets.font}`;
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3 * (canvas.height / BASE_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.strokeText(`Score: ${score}`, 10 * (canvas.width / BASE_WIDTH), 30 * (canvas.height / BASE_HEIGHT));
    ctx.fillText(`Score: ${score}`, 10 * (canvas.width / BASE_WIDTH), 30 * (canvas.height / BASE_HEIGHT));
    ctx.strokeText(`High Score: ${highScore}`, 10 * (canvas.width / BASE_WIDTH), 60 * (canvas.height / BASE_HEIGHT));
    ctx.fillText(`High Score: ${highScore}`, 10 * (canvas.width / BASE_WIDTH), 60 * (canvas.height / BASE_HEIGHT));
    // Draw game over message
    if (gameOver) {
        ctx.font = `${32 * (canvas.height / BASE_HEIGHT)}px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3 * (canvas.height / BASE_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.strokeText('Game Over!', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
        // Dynamically adjust font size for restart message
        let restartMsg = 'Click or press Space to restart';
        let fontSize = 16 * (canvas.height / BASE_HEIGHT);
        ctx.font = `${fontSize}px ${assets.font}`;
        let msgWidth = ctx.measureText(restartMsg).width;
        // Reduce font size if still too wide, but not below 10px
        while (msgWidth > canvas.width * 0.9 && fontSize > 10) {
            fontSize -= 1;
            ctx.font = `${fontSize}px ${assets.font}`;
            msgWidth = ctx.measureText(restartMsg).width;
        }
        if (msgWidth > canvas.width * 0.9) {
            // Split into two lines if still too wide
            let line1 = 'Click or press Space';
            let line2 = 'to restart';
            // Adjust font size for split lines
            fontSize = 16 * (canvas.height / BASE_HEIGHT);
            ctx.font = `${fontSize}px ${assets.font}`;
            let line1Width = ctx.measureText(line1).width;
            let line2Width = ctx.measureText(line2).width;
            while ((line1Width > canvas.width * 0.9 || line2Width > canvas.width * 0.9) && fontSize > 10) {
                fontSize -= 1;
                ctx.font = `${fontSize}px ${assets.font}`;
                line1Width = ctx.measureText(line1).width;
                line2Width = ctx.measureText(line2).width;
            }
            ctx.strokeText(line1, canvas.width / 2, canvas.height / 2 + 0.1 * canvas.height);
            ctx.fillText(line1, canvas.width / 2, canvas.height / 2 + 0.1 * canvas.height);
            ctx.strokeText(line2, canvas.width / 2, canvas.height / 2 + 0.1 * canvas.height);
            ctx.fillText(line2, canvas.width / 2, canvas.height / 2 + 0.1 * canvas.height);
        } else {
            ctx.strokeText(restartMsg, canvas.width / 2, canvas.height / 2 + 40 * (canvas.height / BASE_HEIGHT));
            ctx.fillText(restartMsg, canvas.width / 2, canvas.height / 2 + 40 * (canvas.height / BASE_HEIGHT));
        }
    }
    // Draw start message
    if (!gameStarted) {
        ctx.font = `${32 * (canvas.height / BASE_HEIGHT)}px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4 * (canvas.height / BASE_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.strokeText('ZIPPY', canvas.width / 2, canvas.height / 2 - 90 * (canvas.height / BASE_HEIGHT));
        ctx.fillText('ZIPPY', canvas.width / 2, canvas.height / 2 - 90 * (canvas.height / BASE_HEIGHT));
        ctx.strokeText('BIRD', canvas.width / 2, canvas.height / 2 - 50 * (canvas.height / BASE_HEIGHT));
        ctx.fillText('BIRD', canvas.width / 2, canvas.height / 2 - 50 * (canvas.height / BASE_HEIGHT));
        // Adaptive start message
        let startMsg = 'Click or press Space to start';
        let fontSize = 20 * (canvas.height / BASE_HEIGHT);
        ctx.font = `${fontSize}px ${assets.font}`;
        ctx.lineWidth = 3 * (canvas.height / BASE_HEIGHT);
        let msgWidth = ctx.measureText(startMsg).width;
        // Reduce font size if too wide, but not below 10px
        while (msgWidth > canvas.width * 0.9 && fontSize > 10) {
            fontSize -= 1;
            ctx.font = `${fontSize}px ${assets.font}`;
            msgWidth = ctx.measureText(startMsg).width;
        }
        if (msgWidth > canvas.width * 0.9) {
            // Split into two lines if still too wide
            let line1 = 'Click or press Space';
            let line2 = 'to start';
            // Adjust font size for split lines
            fontSize = 20 * (canvas.height / BASE_HEIGHT);
            ctx.font = `${fontSize}px ${assets.font}`;
            let line1Width = ctx.measureText(line1).width;
            let line2Width = ctx.measureText(line2).width;
            while ((line1Width > canvas.width * 0.9 || line2Width > canvas.width * 0.9) && fontSize > 10) {
                fontSize -= 1;
                ctx.font = `${fontSize}px ${assets.font}`;
                line1Width = ctx.measureText(line1).width;
                line2Width = ctx.measureText(line2).width;
            }
            ctx.strokeText(line1, canvas.width / 2, canvas.height / 2);
            ctx.fillText(line1, canvas.width / 2, canvas.height / 2);
            ctx.strokeText(line2, canvas.width / 2, canvas.height / 2 + 0.1 * canvas.height);
            ctx.fillText(line2, canvas.width / 2, canvas.height / 2 + 0.1 * canvas.height);
        } else {
            ctx.strokeText(startMsg, canvas.width / 2, canvas.height / 2);
            ctx.fillText(startMsg, canvas.width / 2, canvas.height / 2);
        }
    }
    // Draw pause overlay
    if (pause) {
        ctx.font = `${32 * (canvas.height / BASE_HEIGHT)}px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3 * (canvas.height / BASE_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.strokeText('Paused', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    }
    if (pauseCountdown > 0) {
        ctx.font = `${48 * (canvas.height / BASE_HEIGHT)}px ${assets.font}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4 * (canvas.height / BASE_HEIGHT);
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