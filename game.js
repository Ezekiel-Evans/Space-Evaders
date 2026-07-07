const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game States
let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
let gameMode = '';      // 'level' or 'endless'
let gameOver = false;

// Mode Tracking variables
let distanceToPlanet = 1000; // Goal distance for level mode
let endlessDistance = 0;     // Score tracker for endless mode

// 8-Bit Spaceship
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0
};

// Asteroids array
let asteroids = [];
let spawnTimer = 0;

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.key === 'ArrowLeft' || e.key === 'a') player.dx = -player.speed;
    if (e.key === 'ArrowRight' || e.key === 'd') player.dx = player.speed;
});

document.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) player.dx = 0;
});

// Function called by HTML Buttons
function startGame(mode) {
    gameMode = mode;
    gameState = 'PLAYING';
    gameOver = false;
    asteroids = [];
    spawnTimer = 0;
    
    // Reset values depending on mode
    if (mode === 'level') {
        distanceToPlanet = 1000;
    } else {
        endlessDistance = 0;
    }
    
    // Hide the HTML menu overlay
    document.getElementById('mainMenu').style.display = 'none';
}

function spawnAsteroid() {
    const size = Math.random() * 30 + 15; 
    const baseSpeed = 120;
    const speed = baseSpeed / size;
    asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: speed
    });
}

function drawPlayer() {
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(player.x + 10, player.y, 10, 10);
    ctx.fillRect(player.x, player.y + 10, 30, 10);
    ctx.fillRect(player.x, player.y + 20, 10, 10);
    ctx.fillRect(player.x + 20, player.y + 20, 10, 10);
}

function drawAsteroids() {
    ctx.fillStyle = '#ff5555';
    asteroids.forEach(ast => {
        ctx.fillRect(ast.x, ast.y, ast.width, ast.height);
    });
}

function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Courier New"';
    
    if (gameMode === 'level') {
        if (distanceToPlanet > 0) {
            ctx.fillText(`Distance to Planet: ${Math.max(0, Math.floor(distanceToPlanet))}m`, 10, 30);
        } else {
            ctx.fillStyle = '#00ffcc';
            ctx.fillText("YOU REACHED THE PLANET!", canvas.width / 2 - 110, canvas.height / 2);
            gameOver = true;
        }
    } else if (gameMode === 'endless') {
        ctx.fillText(`Distance Traveled: ${Math.floor(endlessDistance)}m`, 10, 30);
    }
}

function update() {
    if (gameState !== 'PLAYING' || gameOver) return;

    // Move Player & Keep in bounds
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Mode Specific Logic
    if (gameMode === 'level') {
        if (distanceToPlanet > 0) {
            distanceToPlanet -= 0.5;
        }
    } else if (gameMode === 'endless') {
        endlessDistance += 0.5; // Always increases
    }

    // Spawn Asteroids (Endless spawns forever, Level stops spawning near the end)
    spawnTimer++;
    let shouldSpawn = gameMode === 'endless' || (gameMode === 'level' && distanceToPlanet > 100);
    
    if (spawnTimer > 30 && shouldSpawn) {
        spawnAsteroid();
        spawnTimer = 0;
    }

    // Move and check Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.y += ast.speed;

        // Collision Detection
        if (player.x < ast.x + ast.width &&
            player.x + player.width > ast.x &&
            player.y < ast.y + ast.height &&
            player.y + player.height > ast.y) {
                
            gameOver = true;
            gameState = 'MENU';
            alert(`Boom! Ship exploded. \nFinal Score: ${gameMode === 'level' ? Math.floor(1000 - distanceToPlanet) + 'm' : Math.floor(endlessDistance) + 'm'}`);
            
            // Show menu overlay again instead of forcing reload
            document.getElementById('mainMenu').style.display = 'flex';
        }

        // Remove off-screen asteroids
        if (ast.y > canvas.height) {
            asteroids.splice(i, 1);
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING') {
        drawPlayer();
        drawAsteroids();
        drawUI();
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start Loop (will wait in MENU state until button click)
gameLoop();
// Add this right at the very bottom of game.js, after gameLoop() has been called
document.getElementById('levelBtn').addEventListener('click', () => startGame('level'));
document.getElementById('endlessBtn').addEventListener('click', () => startGame('endless'));
