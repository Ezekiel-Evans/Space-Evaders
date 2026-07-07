const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game States
let gameOver = false;
let distanceToPlanet = 1000; // Goal distance
const targetPlanet = { x: canvas.width / 2, y: -200, radius: 80 };

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
const asteroids = [];
let spawnTimer = 0;

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.dx = -player.speed;
    if (e.key === 'ArrowRight' || e.key === 'd') player.dx = player.speed;
});

document.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) player.dx = 0;
});

function spawnAsteroid() {
    const size = Math.random() * 20 + 15; // 8-bit chunks
    asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: Math.random() * 3 + 2
    });
}

function drawPlayer() {
    ctx.fillStyle = '#00ffcc';
    // Simple 8-bit classic rocket shape using rects
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
    if (distanceToPlanet > 0) {
        ctx.fillText(`Distance to Planet: ${Math.max(0, Math.floor(distanceToPlanet))}m`, 10, 30);
    } else {
        ctx.fillStyle = '#00ffcc';
        ctx.fillText("YOU REACHED THE PLANET!", canvas.width / 2 - 100, canvas.height / 2);
    }
}

function update() {
    if (gameOver) return;

    // Move Player & Keep in bounds
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Decrease distance to victory
    if (distanceToPlanet > 0) {
        distanceToPlanet -= 0.5;
    }

    // Spawn Asteroids
    spawnTimer++;
    if (spawnTimer > 30 && distanceToPlanet > 100) {
        spawnAsteroid();
        spawnTimer = 0;
    }

    // Move and check Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.y += ast.speed;

        // Collision Detection (AABB)
        if (player.x < ast.x + ast.width &&
            player.x + player.width > ast.x &&
            player.y < ast.y + ast.height &&
            player.y + player.height > ast.y) {
                
                // Explode effect (Clear screen/close game)
                gameOver = true;
                alert("Boom! Your ship exploded.");
                window.close(); // Note: modern browsers only allow window.close() if opened via script, so we fallback to a blank screen
                window.location.reload(); 
        }

        // Remove off-screen asteroids
        if (ast.y > canvas.height) {
            asteroids.splice(i, 1);
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawPlayer();
    drawAsteroids();
    drawUI();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start Game Loop
gameLoop();