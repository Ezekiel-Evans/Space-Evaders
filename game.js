// --- Firebase Initial Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// !!! REPLACE THIS OBJECT WITH YOUR EXACT CONFIG FROM THE FIREBASE CONSOLE !!!
const firebaseConfig = {
  apiKey: "AIzaSyDNWjhBfAYcYHSzXli1nfEToI3nwcHSWO0",
  authDomain: "space-evaders-fb65d.firebaseapp.com",
  projectId: "space-evaders-fb65d",
  storageBucket: "space-evaders-fb65d.firebasestorage.app",
  messagingSenderId: "620632860696",
  appId: "1:620632860696:web:c2dbd212aeb394c0667b6d",
  measurementId: "G-TPJ3DVWDX6"
};

// Initialize Firebase & Firestore database instance
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Game Variables & States ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'MENU'; 
let gameMode = '';      
let gameOver = false;

let currentLevel = 1;
const maxCampaignLevel = 10;
let distanceToPlanet = 1000; 
let endlessDistance = 0;     

let transitionMessage = '';
let transitionSubMessage = '';

let endlessHighScore = localStorage.getItem('spaceDodgerHighScore') ? parseInt(localStorage.getItem('spaceDodgerHighScore')) : 0;

const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0
};

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

// --- Firebase Leaderboard Functions ---

// 1. Fetch Top 5 High Scores from Firebase and inject into HTML
async function loadLeaderboard() {
    try {
        const scoresRef = collection(db, "leaderboard");
        // Query options: Sort by distance descending, limit to top 5 entries
        const q = query(scoresRef, orderBy("distance", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        
        let htmlContent = "";
        let rank = 1;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            htmlContent += `<div>#${rank} ${data.name} - ${data.distance}m</div>`;
            rank++;
        });

        if (htmlContent === "") htmlContent = "No high scores yet. Be the first!";
        
        // Update both UI leaderboard panels
        document.getElementById('menuLeaderboard').innerHTML = htmlContent;
        document.getElementById('gameOverLeaderboard').innerHTML = htmlContent;
    } catch (error) {
        console.error("Error loading leaderboard: ", error);
        document.getElementById('menuLeaderboard').innerText = "Failed to load scores.";
    }
}

// 2. Upload score to Firestore database
async function saveOnlineScore(score) {
    const playerName = prompt("New High Score! Enter your name for the global leaderboard (Max 10 chars):");
    const cleanName = playerName ? playerName.substring(0, 10).toUpperCase() : "ANONYMOUS";
    
    try {
        await addDoc(collection(db, "leaderboard"), {
            name: cleanName,
            distance: score,
            timestamp: new Date()
        });
        // Reload leaderboard automatically after sending data
        loadLeaderboard();
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// --- Gameplay Flow Logics ---

function startGame(mode) {
    gameMode = mode;
    gameOver = false;
    asteroids = [];
    spawnTimer = 0;
    
    player.x = canvas.width / 2 - 15;
    player.y = canvas.height - 60;
    player.dx = 0;
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameOverMenu').style.display = 'none';
    document.getElementById('campaignEndlessBtn').style.display = 'none';

    if (mode === 'level') {
        currentLevel = 1;
        distanceToPlanet = 1000;
        startTransition(`LEVEL ${currentLevel}`, "Get Ready!");
    } else if (mode === 'campaign_endless') {
        distanceToPlanet = 1000 + (currentLevel * 100);
        startTransition(`LEVEL ${currentLevel}`, "Endless Run Continues...");
    } else if (mode === 'endless') {
        endlessDistance = 0;
        gameState = 'PLAYING'; 
    }
}

function startTransition(mainText, subText) {
    gameState = 'TRANSITION';
    transitionMessage = mainText;
    transitionSubMessage = subText;
    player.dx = 0; 

    setTimeout(() => {
        if (gameState === 'TRANSITION') {
            gameState = 'PLAYING';
        }
    }, 2500);
}

function handleLevelClear() {
    if (gameMode === 'level' && currentLevel >= maxCampaignLevel) {
        showGameOverScreen(true);
        return;
    }

    currentLevel++;
    asteroids = [];
    spawnTimer = 0;
    distanceToPlanet = 1000 + (currentLevel * 100);
    
    player.x = canvas.width / 2 - 15;
    player.y = canvas.height - 60;

    startTransition("YOU REACHED THE PLANET!", `Entering Level ${currentLevel}...`);
}

async function showGameOverScreen(isVictory = false) {
    gameState = 'GAMEOVER';
    gameOver = true;
    
    const titleElement = document.getElementById('gameOverTitle');
    const scoreElement = document.getElementById('gameOverScore');
    const highScoreElement = document.getElementById('gameOverHighScore');
    const campaignEndlessBtn = document.getElementById('campaignEndlessBtn');
    
    // Always trigger a refresh to show the most recent top scores
    loadLeaderboard();

    if (isVictory) {
        titleElement.innerText = "YOU WIN!";
        titleElement.style.color = "#00ffcc";
        scoreElement.innerText = `Cleared all ${maxCampaignLevel} system levels!`;
        highScoreElement.style.display = 'none';
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
            
            // Local score tracking
            if (finalScore > endlessHighScore) {
                endlessHighScore = finalScore;
                localStorage.setItem('spaceDodgerHighScore', endlessHighScore);
                highScoreElement.innerText = `NEW HIGH SCORE: ${endlessHighScore}m!`;
                highScoreElement.style.color = "#00ffcc";
                
                // Trigger online Firebase upload if you break your personal local record!
                await saveOnlineScore(finalScore);
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
    loadLeaderboard(); // Load fresh database entries on returning to menu
}

function spawnAsteroid() {
    const size = Math.random() * 30 + 15; 
    const baseSpeed = 120;
    let speed = baseSpeed / size;
    
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
        ctx.fillStyle = '#00ffcc';
        ctx.fillText(`Level: ${currentLevel}`, canvas.width - 100, 30);
    } else if (gameMode === 'endless') {
        ctx.fillText(`Distance: ${Math.floor(endlessDistance)}m`, 10, 30);
        ctx.fillStyle = '#ffcc00'; 
        ctx.fillText(`Hi-Score: ${endlessHighScore}m`, 10, 55);
    }
}

function drawTransitionOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 24px "Courier New"';
    ctx.fillText(transitionMessage, canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New"';
    ctx.fillText(transitionSubMessage, canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left'; 
}

function update() {
    if (gameState !== 'PLAYING') return;

    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    if (gameMode === 'level' || gameMode === 'campaign_endless') {
        if (distanceToPlanet > 0) {
            distanceToPlanet -= 0.5;
        } else {
            handleLevelClear();
            return;
        }
    } else if (gameMode === 'endless') {
        endlessDistance += 0.5; 
    }

    spawnTimer++;
    let isLevelMode = (gameMode === 'level' || gameMode === 'campaign_endless');
    let shouldSpawn = gameMode === 'endless' || (isLevelMode && distanceToPlanet > 100);
    
    if (spawnTimer > 30 && shouldSpawn) {
        spawnAsteroid();
        spawnTimer = 0;
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.y += ast.speed;

        if (player.x < ast.x + ast.width &&
            player.x + player.width > ast.x &&
            player.y < ast.y + ast.height &&
            player.y + player.height > ast.y) {
                
            showGameOverScreen(false); 
            return;
        }

        if (ast.y > canvas.height) {
            asteroids.splice(i, 1);
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING' || gameState === 'TRANSITION') {
        drawPlayer();
        drawAsteroids();
        drawUI();
    }
    
    if (gameState === 'TRANSITION') {
        drawTransitionOverlay();
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start game loop and initial data pull
gameLoop();
loadLeaderboard();

// --- Event Listeners for HTML DOM Buttons ---
document.getElementById('levelBtn').addEventListener('click', () => startGame('level'));
document.getElementById('endlessBtn').addEventListener('click', () => startGame('endless'));
document.getElementById('tryAgainBtn').addEventListener('click', () => startGame(gameMode));
document.getElementById('campaignEndlessBtn').addEventListener('click', () => startGame('campaign_endless'));
document.getElementById('goToMenuBtn').addEventListener('click', showMainMenu);
