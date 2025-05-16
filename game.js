// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Game state
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let level = 1;
let experience = 0;
let experienceToNextLevel = 100;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let obstacles = [];
let powerUps = [];
let gameMode = 'classic'; // classic, survival, timeAttack
let difficulty = 'normal'; // easy, normal, hard
let timeRemaining = 0;
let isPaused = false;
let lastObstacleSpawn = 0;
let upgrades = {
    speed: 1,
    shield: 0,
    weapon: 0,
    engine: 1
};

// Game settings
const gameSettings = {
    classic: {
        obstacleSpeed: 0.5,
        obstacleSpawnInterval: 1000,
        timeLimit: Infinity
    },
    survival: {
        obstacleSpeed: 0.7,
        obstacleSpawnInterval: 800,
        timeLimit: Infinity
    },
    timeAttack: {
        obstacleSpeed: 0.6,
        obstacleSpawnInterval: 900,
        timeLimit: 120 // 2 minutes
    }
};

// UI Elements
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const levelElement = document.createElement('div');
const expBar = document.createElement('div');
const coinsElement = document.createElement('div');
const timeElement = document.createElement('div');
const pauseMenu = document.createElement('div');

// Setup UI elements
function setupUI() {
    // Level display
    levelElement.style.position = 'absolute';
    levelElement.style.top = '20px';
    levelElement.style.right = '20px';
    levelElement.style.color = '#000080';
    levelElement.style.fontSize = '16px';
    levelElement.style.fontFamily = 'MS Sans Serif, Tahoma, Arial, sans-serif';
    levelElement.style.fontWeight = 'bold';
    levelElement.style.background = '#C0C0C0';
    levelElement.style.border = '2px outset #fff';
    levelElement.style.padding = '4px 12px';
    levelElement.style.boxShadow = '2px 2px 0 #808080';
    document.body.appendChild(levelElement);

    // Experience bar
    expBar.style.position = 'absolute';
    expBar.style.top = '50px';
    expBar.style.left = '20px';
    expBar.style.width = '200px';
    expBar.style.height = '8px';
    expBar.style.backgroundColor = '#fff';
    expBar.style.border = '2px inset #808080';
    expBar.style.borderRadius = '0';
    document.body.appendChild(expBar);

    const expFill = document.createElement('div');
    expFill.style.width = '0%';
    expFill.style.height = '100%';
    expFill.style.backgroundColor = '#000080';
    expFill.style.borderRadius = '0';
    expFill.id = 'expFill';
    expBar.appendChild(expFill);

    // Coins display
    coinsElement.style.position = 'absolute';
    coinsElement.style.top = '20px';
    coinsElement.style.left = '50%';
    coinsElement.style.transform = 'translateX(-50%)';
    coinsElement.style.color = '#000080';
    coinsElement.style.fontSize = '16px';
    coinsElement.style.fontFamily = 'MS Sans Serif, Tahoma, Arial, sans-serif';
    coinsElement.style.fontWeight = 'bold';
    coinsElement.style.background = '#C0C0C0';
    coinsElement.style.border = '2px outset #fff';
    coinsElement.style.padding = '4px 12px';
    coinsElement.style.boxShadow = '2px 2px 0 #808080';
    document.body.appendChild(coinsElement);

    // Time display
    timeElement.style.position = 'absolute';
    timeElement.style.top = '20px';
    timeElement.style.right = '20px';
    timeElement.style.color = '#000080';
    timeElement.style.fontSize = '16px';
    timeElement.style.fontFamily = 'MS Sans Serif, Tahoma, Arial, sans-serif';
    timeElement.style.fontWeight = 'bold';
    timeElement.style.background = '#C0C0C0';
    timeElement.style.border = '2px outset #fff';
    timeElement.style.padding = '4px 12px';
    timeElement.style.boxShadow = '2px 2px 0 #808080';
    document.body.appendChild(timeElement);

    // Pause menu
    pauseMenu.style.position = 'absolute';
    pauseMenu.style.top = '50%';
    pauseMenu.style.left = '50%';
    pauseMenu.style.transform = 'translate(-50%, -50%)';
    pauseMenu.style.backgroundColor = '#C0C0C0';
    pauseMenu.style.padding = '24px';
    pauseMenu.style.border = '2px outset #fff';
    pauseMenu.style.borderRadius = '0';
    pauseMenu.style.boxShadow = '4px 4px 0 #808080';
    pauseMenu.style.display = 'none';
    pauseMenu.style.fontFamily = 'MS Sans Serif, Tahoma, Arial, sans-serif';
    document.body.appendChild(pauseMenu);
}

// Update UI
function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    levelElement.textContent = `Level ${level}`;
    coinsElement.textContent = `Coins: ${coins}`;
    document.getElementById('expFill').style.width = `${(experience / experienceToNextLevel) * 100}%`;
    
    if (gameMode === 'timeAttack') {
        timeElement.textContent = `Time: ${Math.ceil(timeRemaining)}s`;
    }
}

// Create power-up
function createPowerUp() {
    const types = ['shield', 'speed', 'weapon', 'coin'];
    const type = types[Math.random() * types.length];
    const geometry = new THREE.OctahedronGeometry(0.5);
    const material = new THREE.MeshPhongMaterial({
        color: type === 'shield' ? 0x000080 : 
               type === 'speed' ? 0xC0C0C0 :
               type === 'weapon' ? 0x808080 : 0xFFFFFF,
        shininess: 0,
        specular: 0x808080
    });
    const powerUp = new THREE.Mesh(geometry, material);
    powerUp.position.x = (Math.random() - 0.5) * 10;
    powerUp.position.y = (Math.random() - 0.5) * 10;
    powerUp.position.z = -50;
    powerUp.userData = { type };
    scene.add(powerUp);
    powerUps.push(powerUp);
}

// Apply power-up effect
function applyPowerUp(type) {
    switch(type) {
        case 'shield':
            upgrades.shield = Math.min(upgrades.shield + 1, 3);
            break;
        case 'speed':
            upgrades.speed = Math.min(upgrades.speed + 0.2, 2);
            break;
        case 'weapon':
            upgrades.weapon = Math.min(upgrades.weapon + 1, 3);
            break;
        case 'coin':
            coins += 10;
            localStorage.setItem('coins', coins);
            break;
    }
}

// Level up
function levelUp() {
    level++;
    experience = 0;
    experienceToNextLevel = Math.floor(experienceToNextLevel * 1.5);
    
    // Increase difficulty
    gameSettings[gameMode].obstacleSpeed *= 1.1;
    gameSettings[gameMode].obstacleSpawnInterval *= 0.9;
    
    // Show level up effect
    const levelUpEffect = document.createElement('div');
    levelUpEffect.textContent = `Level Up! ${level}`;
    levelUpEffect.style.position = 'absolute';
    levelUpEffect.style.top = '50%';
    levelUpEffect.style.left = '50%';
    levelUpEffect.style.transform = 'translate(-50%, -50%)';
    levelUpEffect.style.color = '#00ff00';
    levelUpEffect.style.fontSize = '48px';
    levelUpEffect.style.animation = 'fadeOut 2s forwards';
    document.body.appendChild(levelUpEffect);
    
    setTimeout(() => levelUpEffect.remove(), 2000);
}

// Game modes
function setGameMode(mode) {
    gameMode = mode;
    timeRemaining = gameSettings[mode].timeLimit;
    document.getElementById('mainMenu').style.display = 'none';
    resetGame();
}

// Pause game
function togglePause() {
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'block' : 'none';
}

// Save game progress
function saveProgress() {
    localStorage.setItem('highScore', highScore);
    localStorage.setItem('coins', coins);
    localStorage.setItem('level', level);
    localStorage.setItem('experience', experience);
    localStorage.setItem('upgrades', JSON.stringify(upgrades));
}

// Load game progress
function loadProgress() {
    highScore = localStorage.getItem('highScore') || 0;
    coins = parseInt(localStorage.getItem('coins')) || 0;
    level = parseInt(localStorage.getItem('level')) || 1;
    experience = parseInt(localStorage.getItem('experience')) || 0;
    upgrades = JSON.parse(localStorage.getItem('upgrades')) || {
        speed: 1,
        shield: 0,
        weapon: 0,
        engine: 1
    };
    updateUpgradeDisplays();
}

// Update upgrade displays
function updateUpgradeDisplays() {
    document.getElementById('speedLevel').textContent = Math.floor(upgrades.speed * 5);
    document.getElementById('shieldLevel').textContent = upgrades.shield;
    document.getElementById('weaponLevel').textContent = upgrades.weapon;
    document.getElementById('engineLevel').textContent = upgrades.engine;
}

// Modify the upgrade functions to update displays
function upgradeSpeed() {
    if (coins >= 10 && upgrades.speed < 2) {
        coins -= 10;
        upgrades.speed = Math.min(upgrades.speed + 0.2, 2);
        saveProgress();
        showUpgradeEffect('Speed Upgraded!');
        updateUpgradeDisplays();
    } else if (coins < 10) {
        showMessage('Not enough coins!');
    } else {
        showMessage('Max level reached!');
    }
}

function upgradeShield() {
    if (coins >= 20 && upgrades.shield < 3) {
        coins -= 20;
        upgrades.shield = Math.min(upgrades.shield + 1, 3);
        saveProgress();
        showUpgradeEffect('Shield Upgraded!');
        updateUpgradeDisplays();
    } else if (coins < 20) {
        showMessage('Not enough coins!');
    } else {
        showMessage('Max level reached!');
    }
}

function upgradeWeapon() {
    if (coins >= 30 && upgrades.weapon < 3) {
        coins -= 30;
        upgrades.weapon = Math.min(upgrades.weapon + 1, 3);
        saveProgress();
        showUpgradeEffect('Weapon Upgraded!');
        updateUpgradeDisplays();
    } else if (coins < 30) {
        showMessage('Not enough coins!');
    } else {
        showMessage('Max level reached!');
    }
}

function upgradeEngine() {
    if (coins >= 15 && upgrades.engine < 3) {
        coins -= 15;
        upgrades.engine = Math.min(upgrades.engine + 1, 3);
        saveProgress();
        showUpgradeEffect('Engine Upgraded!');
        updateUpgradeDisplays();
    } else if (coins < 15) {
        showMessage('Not enough coins!');
    } else {
        showMessage('Max level reached!');
    }
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Create spaceship with classic Windows look
const spaceshipGeometry = new THREE.ConeGeometry(0.5, 2, 4);
const spaceshipMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x000080, // Classic Windows blue
    shininess: 0, // Flat look
    specular: 0xC0C0C0 // Light gray highlight
});
const spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);
spaceship.rotation.x = Math.PI / 2;
scene.add(spaceship);

// Classic particle effects
const particleCount = 100; // Lower for retro look
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);
const particleColors = new Float32Array(particleCount * 3);
const particleVelocities = [];
const particleLifetimes = new Float32Array(particleCount);

// Classic color palette
const fireColors = [
    new THREE.Color(0.75, 0.75, 0.75), // Light gray
    new THREE.Color(1, 1, 1),          // White
    new THREE.Color(0, 0, 1),          // Blue
    new THREE.Color(0, 0, 0.5)         // Dark blue
];

for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = 0;
    particlePositions[i * 3 + 1] = 0;
    particlePositions[i * 3 + 2] = 0;
    
    // Random size between 0.1 and 0.4
    particleSizes[i] = Math.random() * 0.3 + 0.1;
    
    // Random lifetime between 0.5 and 1.5 seconds
    particleLifetimes[i] = Math.random() + 0.5;
    
    // Random initial velocity with more spread
    particleVelocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        z: Math.random() * 0.3 + 0.2
    });
    
    // Set initial color
    const color = fireColors[Math.floor(Math.random() * fireColors.length)];
    particleColors[i * 3] = color.r;
    particleColors[i * 3 + 1] = color.g;
    particleColors[i * 3 + 2] = color.b;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMaterial = new THREE.PointsMaterial({
    size: 0.5,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    vertexColors: true
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// Classic stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF, // White
    size: 0.12,
    transparent: false,
    opacity: 1
});
const starsVertices = [];
for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Camera position
camera.position.z = 5;

// Movement variables
const speed = 0.1;
const rotationSpeed = 0.03;
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

// Create obstacle
function createObstacle() {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xC0C0C0, // Classic Windows gray
        shininess: 0,
        specular: 0x808080
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.x = (Math.random() - 0.5) * 10;
    obstacle.position.y = (Math.random() - 0.5) * 10;
    obstacle.position.z = -50;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Update particles with more realistic fire behavior
function updateParticles() {
    const positions = particles.geometry.attributes.position.array;
    const sizes = particles.geometry.attributes.size.array;
    const colors = particles.geometry.attributes.color.array;
    const currentTime = Date.now() / 1000; // Convert to seconds

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Update position with turbulence
        positions[i3] += particleVelocities[i].x + (Math.random() - 0.5) * 0.05;
        positions[i3 + 1] += particleVelocities[i].y + (Math.random() - 0.5) * 0.05;
        positions[i3 + 2] += particleVelocities[i].z;

        // Reset particles that are too far behind or have expired
        if (positions[i3 + 2] > 2 || currentTime - particleLifetimes[i] > 1.5) {
            // Reset position to engine
            positions[i3] = spaceship.position.x + (Math.random() - 0.5) * 0.2;
            positions[i3 + 1] = spaceship.position.y + (Math.random() - 0.5) * 0.2;
            positions[i3 + 2] = spaceship.position.z + 1;
            
            // Reset velocity with more variation
            particleVelocities[i].x = (Math.random() - 0.5) * 0.2;
            particleVelocities[i].y = (Math.random() - 0.5) * 0.2;
            particleVelocities[i].z = Math.random() * 0.3 + 0.2;
            
            // Reset lifetime
            particleLifetimes[i] = currentTime;
            
            // Reset size
            sizes[i] = Math.random() * 0.3 + 0.1;
            
            // Reset color to a random fire color
            const color = fireColors[Math.floor(Math.random() * fireColors.length)];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        // Fade out particles based on their lifetime
        const age = currentTime - particleLifetimes[i];
        const opacity = Math.max(0, 1 - (age / 1.5));
        
        // Update color based on age (transition from yellow to red)
        colors[i3] = Math.min(1, colors[i3] + age * 0.2);     // Increase red
        colors[i3 + 1] = Math.max(0, colors[i3 + 1] - age * 0.3); // Decrease green
        colors[i3 + 2] = Math.max(0, colors[i3 + 2] - age * 0.2); // Decrease blue
        
        // Shrink particles as they age
        sizes[i] *= 0.98;
    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.size.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;
}

// Check collision between spaceship and obstacle
function checkCollision(spaceship, obstacle) {
    // Ignore collision if the obstacle is too far behind or ahead
    if (Math.abs(obstacle.position.z - spaceship.position.z) > 2) {
        return false;
    }
    
    const distance = spaceship.position.distanceTo(obstacle.position);
    return distance < 1.5; // Collision threshold
}

// Event listeners for controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        togglePause();
    }
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Keyboard navigation state
let currentFocusIndex = 0;
let currentButtonGroup = null;

// Initialize keyboard navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', handleKeyboardNavigation);
}

// Handle keyboard navigation
function handleKeyboardNavigation(event) {
    if (gameOver) {
        handleGameOverNavigation(event);
    } else if (document.getElementById('mainMenu').style.display !== 'none') {
        handleMainMenuNavigation(event);
    }
}

// Handle navigation in game over screen
function handleGameOverNavigation(event) {
    const buttons = document.querySelectorAll('#gameOver button');
    if (!buttons.length) return;

    switch(event.key) {
        case 'ArrowUp':
            currentFocusIndex = (currentFocusIndex - 1 + buttons.length) % buttons.length;
            updateButtonFocus(buttons);
            break;
        case 'ArrowDown':
            currentFocusIndex = (currentFocusIndex + 1) % buttons.length;
            updateButtonFocus(buttons);
            break;
        case 'Enter':
            buttons[currentFocusIndex].click();
            break;
    }
}

// Handle navigation in main menu
function handleMainMenuNavigation(event) {
    const buttons = document.querySelectorAll('.gameMode');
    if (!buttons.length) return;

    switch(event.key) {
        case 'ArrowUp':
            currentFocusIndex = (currentFocusIndex - 1 + buttons.length) % buttons.length;
            updateButtonFocus(buttons);
            break;
        case 'ArrowDown':
            currentFocusIndex = (currentFocusIndex + 1) % buttons.length;
            updateButtonFocus(buttons);
            break;
        case 'Enter':
            buttons[currentFocusIndex].click();
            break;
    }
}

// Update button focus
function updateButtonFocus(buttons) {
    buttons.forEach((button, index) => {
        if (index === currentFocusIndex) {
            button.classList.add('focused');
            button.focus();
        } else {
            button.classList.remove('focused');
        }
    });
}

// Reset focus state
function resetFocusState() {
    currentFocusIndex = 0;
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.classList.remove('focused'));
    if (buttons.length > 0) {
        buttons[0].classList.add('focused');
    }
}

// Modify the showMainMenu function
function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('gameOver').style.display = 'none';
    resetFocusState();
}

// Modify the resetGame function
function resetGame() {
    gameOver = false;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    spaceship.position.set(0, 0, 0);
    spaceship.rotation.set(Math.PI / 2, 0, 0);
    
    // Remove all obstacles
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    
    gameOverElement.style.display = 'none';
    resetFocusState();
}

// Make resetGame available globally
window.resetGame = resetGame;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!gameOver && !isPaused) {
        // Movement controls with speed upgrade
        const currentSpeed = speed * upgrades.speed;
        if (keys.w) spaceship.position.z -= currentSpeed;
        if (keys.s) spaceship.position.z += currentSpeed;
        if (keys.a) spaceship.position.x -= currentSpeed;
        if (keys.d) spaceship.position.x += currentSpeed;
        if (keys.ArrowLeft) spaceship.rotation.y += rotationSpeed;
        if (keys.ArrowRight) spaceship.rotation.y -= rotationSpeed;
        if (keys.ArrowUp) spaceship.rotation.x += rotationSpeed;
        if (keys.ArrowDown) spaceship.rotation.x -= rotationSpeed;

        // Update particles
        updateParticles();

        // Spawn obstacles and power-ups
        const currentTime = Date.now();
        if (currentTime - lastObstacleSpawn > gameSettings[gameMode].obstacleSpawnInterval) {
            createObstacle();
            if (Math.random() < 0.2) createPowerUp();
            lastObstacleSpawn = currentTime;
        }

        // Update time for time attack mode
        if (gameMode === 'timeAttack') {
            timeRemaining -= 1/60;
            if (timeRemaining <= 0) {
                gameOver = true;
                finalScoreElement.textContent = score;
                gameOverElement.style.display = 'block';
            }
        }

        // Update obstacles and power-ups
        updateObstacles();
        updatePowerUps();

        // Update UI
        updateUI();
    }

    // Update camera position to follow spaceship
    camera.position.x = spaceship.position.x;
    camera.position.y = spaceship.position.y + 2;
    camera.position.z = spaceship.position.z + 5;
    camera.lookAt(spaceship.position);

    renderer.render(scene, camera);
}

// Initialize game
setupUI();
loadProgress();
animate();

// Animation error handling
function safeCreateElement(type, className) {
    try {
        const element = document.createElement(type);
        if (className) element.className = className;
        return element;
    } catch (error) {
        console.error('Error creating element:', error);
        return null;
    }
}

function safeRemoveElement(element) {
    try {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    } catch (error) {
        console.error('Error removing element:', error);
    }
}

// Enhanced animation functions with error handling
function showUpgradeEffect(text) {
    try {
        const effect = safeCreateElement('div', 'upgrade-effect');
        if (!effect) return;

        effect.textContent = text;
        effect.style.position = 'absolute';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.color = '#000080';
        effect.style.fontSize = '36px';
        effect.style.fontFamily = 'Orbitron, sans-serif';
        effect.style.textShadow = '0 0 10px rgba(0, 120, 212, 0.5)';
        effect.style.animation = 'upgradeAnimation 1.5s forwards';
        effect.style.zIndex = '1000';
        
        document.body.appendChild(effect);
        
        // Use requestAnimationFrame for smoother animation
        let startTime = null;
        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / 1500;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                safeRemoveElement(effect);
            }
        }
        requestAnimationFrame(animate);
    } catch (error) {
        console.error('Error showing upgrade effect:', error);
    }
}

function showMessage(text) {
    try {
        const message = safeCreateElement('div', 'game-message');
        if (!message) return;

        message.textContent = text;
        message.style.position = 'absolute';
        message.style.top = '30%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = '#000080';
        message.style.fontSize = '24px';
        message.style.fontFamily = 'Orbitron, sans-serif';
        message.style.textShadow = '0 0 10px rgba(0, 120, 212, 0.5)';
        message.style.animation = 'messageAnimation 1s forwards';
        message.style.zIndex = '1000';
        
        document.body.appendChild(message);
        
        let startTime = null;
        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / 1000;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                safeRemoveElement(message);
            }
        }
        requestAnimationFrame(animate);
    } catch (error) {
        console.error('Error showing message:', error);
    }
}

// Classic CSS animations and buttons
try {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes upgradeAnimation {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes messageAnimation {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
        .upgrade-effect, .game-message {
            color: #000080 !important;
            background: #C0C0C0 !important;
            border: 2px outset #fff !important;
            font-family: 'MS Sans Serif', Tahoma, Arial, sans-serif !important;
            font-size: 18px !important;
            font-weight: bold !important;
            box-shadow: 2px 2px 0 #808080 !important;
            padding: 8px 16px !important;
            border-radius: 0 !important;
        }
        button {
            font-family: 'MS Sans Serif', Tahoma, Arial, sans-serif !important;
            font-size: 16px !important;
            font-weight: bold !important;
            background: #C0C0C0 !important;
            color: #000080 !important;
            border: 2px outset #fff !important;
            border-radius: 0 !important;
            box-shadow: 2px 2px 0 #808080 !important;
            padding: 4px 16px !important;
            margin: 4px !important;
        }
        button:focus, button:hover {
            background: #000080 !important;
            color: #fff !important;
            outline: none !important;
        }
    `;
    document.head.appendChild(style);
} catch (error) {
    console.error('Error adding CSS animations:', error);
}

// Modify collision handling to include explosion effect
function handleCollision(obstacle) {
    // Create explosion effect at the obstacle's position
    createExplosionEffect(obstacle.position.clone());
    
    // Remove the obstacle from the scene and array
    scene.remove(obstacle);
    obstacles = obstacles.filter(o => o !== obstacle);
    
    if (upgrades.shield > 0) {
        upgrades.shield--;
        showMessage('Shield Absorbed Hit!');
        updateUpgradeDisplays();
    } else {
        gameOver = true;
        finalScoreElement.textContent = score;
        gameOverElement.style.display = 'block';
    }
}

// Modify power-up collection to include effect
function collectPowerUp(powerUp) {
    createPowerUpEffect(powerUp.position, powerUp.userData.type);
    applyPowerUp(powerUp.userData.type);
    scene.remove(powerUp);
    powerUps = powerUps.filter(p => p !== powerUp);
    showUpgradeEffect(`${powerUp.userData.type.toUpperCase()} Power-Up!`);
}

// Update the collision check in the animation loop
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.position.z += gameSettings[gameMode].obstacleSpeed;
        
        // Only check collision if the obstacle is in front of the spaceship
        if (obstacle.position.z < spaceship.position.z + 2) {
            if (checkCollision(spaceship, obstacle)) {
                handleCollision(obstacle);
            }
        }
        
        // Remove obstacles that are too far behind
        if (obstacle.position.z > 5) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
            score += 10;
            experience += 10;
            
            if (experience >= experienceToNextLevel) {
                levelUp();
            }
        }
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.position.z += gameSettings[gameMode].obstacleSpeed;
        powerUp.rotation.y += 0.02;
        
        // Only check collision if the power-up is in front of the spaceship
        if (powerUp.position.z < spaceship.position.z + 2) {
            if (checkCollision(spaceship, powerUp)) {
                collectPowerUp(powerUp);
            }
        }
        
        // Remove power-ups that are too far behind
        if (powerUp.position.z > 5) {
            scene.remove(powerUp);
            powerUps.splice(i, 1);
        }
    }
}

// Initialize keyboard navigation when the game starts
initKeyboardNavigation(); 