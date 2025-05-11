// assetLoader.js
// Handles loading of images, audio, and fonts for the game

export const assets = {
    bird: null,
    pipe: null,
    background: null,
    ground: null,
    jumpSound: null,
    gameOverSound: null,
    font: null,
    scoreSound: null
};

export async function loadAssets() {
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