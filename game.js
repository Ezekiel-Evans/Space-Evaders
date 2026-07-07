const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game States
let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
let gameMode = '';      // 'level' or 'endless' or 'campaign_endless'
let gameOver = false;

// Progression Tracking variables
let currentLevel = 1;
const maxCampaignLevel = 10;
let distanceToPlanet = 1000; 
let endlessDistance = 0;     

// High Score Tracking
let endlessHighScore = localStorage.getItem('spaceDodgerHighScore') ? parseInt(localStorage.getItem('spaceDodgerHighScore')) : 0;

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

function startGame(mode) {
    gameMode = mode;
    gameState = 'PLAYING';
    gameOver = false;
    asteroids = [];
    spawnTimer = 0;
    
    // Reset player position
    player.x = canvas.width / 2 - 15;
    player.y = canvas.height - 60;
    player.dx = 0;
    
    // Reset values depending on selected path
    if (mode === 'level') {
        currentLevel = 1;
        distanceToPlanet = 1000; // Base starting distance
    } else if (mode === 'campaign_endless') {
        // Continuous level climbing after beating level 10
        distanceToPlanet = 1000 + (currentLevel * 100);
    } else if (mode === 'endless') {
        endlessDistance = 0;
    }
    
    // Hide menus and reset special buttons
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameOverMenu').style.display = 'none';
    document.getElementById('campaignEndlessBtn').style.display = 'none';
}

function nextLevel() {
    currentLevel++;
    asteroids = [];
    spawnTimer = 0;
    
    // Grow length requirement by 100m for each progressive level
    distanceToPlanet = 1000 + (currentLevel * 100);
    
    // Put spaceship back at starting position safely
    player.x = canvas.width / 2 - 15;
    player.y = canvas.height - 60;
    player.dx = 0;
}

function showGameOverScreen(isVictory = false) {
    gameState = 'GAMEOVER';
    gameOver = true;
    
    const titleElement = document.getElementById('gameOverTitle');
    const scoreElement = document.getElementById('gameOverScore');
    const highScoreElement = document.getElementById('gameOverHighScore');
    const campaignEndlessBtn = document.getElementById('campaignEndlessBtn');
    
    if (isVictory) {
        titleElement.innerText = "YOU WIN!";
        titleElement.style.color = "#00ffcc";
        scoreElement.innerText = `Cleared all ${maxCampaignLevel} system levels!`;
        highScoreElement.style.display = 'none';
        
        // Show option to take current level difficulty onwards into infinite tiers
        campaignEndlessBtn.style.display = 'block';
    } else {
        titleElement.innerText = "BOOM! CRASHED";
        titleElement.style.color = "#ff5555";
        campaignEndlessBtn.style.display = 'none';
        
        if (gameMode === 'level' || gameMode === 'campaign_endless') {
            scoreElement.innerText = `Crashed on Level ${currentLevel}`;
            highScoreElement.style.display = 'none';
        } else if (gameMode === 'endless') {
            let finalScore = Math.floor(endlessDistance);
            scoreElement.innerText = `Final Distance: ${finalScore}m`;
            
            if (finalScore > endlessHighScore) {
                endlessHighScore = finalScore;
                localStorage.setItem('spaceDodgerHighScore', endlessHighScore);
                highScoreElement.innerText = `NEW HIGH SCORE: ${endlessHighScore}m!`;
                highScoreElement.style.color = "#00ffcc";
            } else {
                highScoreElement.innerText = `High Score: ${endlessHighScore}m`;
                highScoreElement.style.color = "#ffcc00";
            }
            highScoreElement.style.display = 'block';
        }
    }
    
    document.getElementById('gameOverMenu').style.display = 'flex';
}

function showMainMenu() {
    gameState = 'MENU';
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('gameOverMenu').style.display = 'none';
}

function spawnAsteroid() {
    const size = Math.random() * 30 + 15; 
    const baseSpeed = 120;
    let speed = baseSpeed / size;
    
    // Scale asteroid velocity based on current level tier (Only applies outside simple endless)
    if (gameMode === 'level' || gameMode === 'campaign_endless') {
        speed += (currentLevel * 0.4); 
    }
    
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
    
    if (gameMode === 'level' || gameMode === 'campaign_endless') {
        if (distanceToPlanet > 0) {
            ctx.fillText(`Distance to Planet: ${Math.max(0, Math.floor(distanceToPlanet))}m`, 10, 30);
        }
        // Level Tracker displayed in top-right corner
        ctx.fillStyle = '#00ffcc';
        ctx.fillText(`Level: ${currentLevel}`, canvas.width - 100, 30);
    } else if (gameMode === 'endless') {
        ctx.fillText(`Distance: ${Math.floor(endlessDistance)}m`, 10, 30);
        ctx.fillStyle = '#ffcc00'; 
        ctx.fillText(`Hi-Score: ${endlessHighScore}m`, 10, 55);
    }
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Move Player & Keep in bounds
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Mode Specific Progression Logic
    if (gameMode === 'level') {
        if (distanceToPlanet > 0) {
            distanceToPlanet -= 0.5;
        } else {
            if (currentLevel < maxCampaignLevel) {
                nextLevel(); // Automatically bump into next challenge state
            } else {
                showGameOverScreen(true); // Hit level 10 goal boundary
                return;
            }
        }
    } else if (gameMode === 'campaign_endless') {
        // Runs infinite level progression loops seamlessly
        if (distanceToPlanet > 0) {
            distanceToPlanet -= 0.5;
        } else {
            nextLevel();
        }
    } else if (gameMode === 'endless') {
        endlessDistance += 0.5; 
    }

    // Spawn Asteroids
    spawnTimer++;
    let isLevelMode = (gameMode === 'level' || gameMode === 'campaign_endless');
    let shouldSpawn = gameMode === 'endless' || (isLevelMode && distanceToPlanet > 100);
    
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
                
            showGameOverScreen(false); 
            return;
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

// Start Game Loop
gameLoop();

// --- Event Listeners for HTML DOM Buttons ---
document.getElementById('levelBtn').addEventListener('click', () => startGame('level'));
document.getElementById('endlessBtn').addEventListener('click', () => startGame('endless'));
document.getElementById('tryAgainBtn').addEventListener('click', () => startGame(gameMode));
document.getElementById('campaignEndlessBtn').addEventListener('click', () => startGame('campaign_endless'));
document.getElementById('goToMenuBtn').addEventListener('click', showMainMenu);
