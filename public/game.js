// Game namespace
const Game = {
    // Constants
    CONSTANTS: {
        FPS: 60,
        COLLISION_THRESHOLD: 1.5,
        MAX_LEVEL: 10,
        MAX_UPGRADES: {
            speed: 2,
            shield: 3,
            weapon: 3,
            engine: 3
        }
    },

    // State management
    state: {
        gameOver: false,
        score: 0,
        highScore: localStorage.getItem('highScore') || 0,
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        coins: parseInt(localStorage.getItem('coins')) || 0,
        gameMode: 'classic',
        difficulty: 'normal',
        timeRemaining: 0,
        isPaused: false,
        lastObstacleSpawn: 0,
        upgrades: {
            speed: 1,
            shield: 0,
            weapon: 0,
            engine: 1
        },
        specialWeapons: {
            laser: { unlocked: false, ammo: 0 },
            missile: { unlocked: false, ammo: 0 },
            plasma: { unlocked: false, ammo: 0 }
        },
        checkpoints: [],
        currentCheckpoint: null,
        bossRushProgress: 0,
        environmentalHazards: {
            asteroids: [],
            nebula: [],
            blackHoles: []
        },
        achievements: {
            bossDefeated: false,
            perfectRun: false,
            speedster: false,
            collector: false
        },
        galacticConquest: {
            sectors: [],
            currentSector: 0,
            conqueredSectors: new Set(),
            resources: {
                credits: 0,
                minerals: 0,
                energy: 0
            }
        },
        spaceStations: {
            current: null,
            missions: [],
            inventory: [],
            reputation: 0
        },
        shipCustomization: {
            hull: 'default',
            engine: 'default',
            weapons: 'default',
            paint: 'default',
            decals: []
        },
        spaceWeather: {
            current: 'clear',
            intensity: 0,
            effects: []
        },
        companionDrones: {
            active: [],
            available: []
        }
    },

    // Game controls
    keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    },

    // THREE.js objects
    scene: null,
    camera: null,
    renderer: null,
    spaceship: null,
    obstacles: [],
    powerUps: [],
    particles: [],
    engineTrails: [],
    boss: null,
    bossHealth: 0,
    clock: new THREE.Clock(),
    animationFrameId: null,

    // Cached geometries and materials
    geometries: {
        spaceship: new THREE.ConeGeometry(0.5, 2, 4),
        obstacle: new THREE.SphereGeometry(0.5, 8, 8),
        powerUp: new THREE.OctahedronGeometry(0.5)
    },
    materials: {
        spaceship: new THREE.MeshPhongMaterial({
            color: 0x000080,
            shininess: 0,
            specular: 0xC0C0C0
        }),
        obstacle: new THREE.MeshPhongMaterial({
            color: 0xC0C0C0,
            shininess: 0,
            specular: 0x808080
        }),
        powerUp: {
            shield: new THREE.MeshPhongMaterial({
                color: 0x000080,
                shininess: 0,
                specular: 0x808080
            }),
            speed: new THREE.MeshPhongMaterial({
                color: 0xC0C0C0,
                shininess: 0,
                specular: 0x808080
            }),
            weapon: new THREE.MeshPhongMaterial({
                color: 0x808080,
                shininess: 0,
                specular: 0x808080
            }),
            timeSlow: new THREE.MeshPhongMaterial({
                color: 0x00FFFF,
                shininess: 0,
                specular: 0x808080
            })
        }
    },

    // Game settings
    settings: {
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
            timeLimit: 120
        },
        bossBattle: {
            obstacleSpeed: 0.4,
            obstacleSpawnInterval: 1500,
            timeLimit: 300,
            bossHealth: 1000
        },
        bossRush: {
            obstacleSpeed: 0.8,
            obstacleSpawnInterval: 600,
            timeLimit: 600,
            bossHealth: 2000,
            bossCount: 3
        },
        galacticConquest: {
            sectorCount: 10,
            sectorSize: 1000,
            resourceSpawnRate: 0.1,
            enemySpawnRate: 0.2
        }
    },

    // Performance optimizations
    performance: {
        lastFrameTime: 0,
        frameCount: 0,
        fps: 0,
        
        update() {
            const now = performance.now();
            this.frameCount++;
            
            if (now - this.lastFrameTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
        }
    },

    // Error handling
    errorHandler: {
        errors: [],
        maxErrors: 100,
        
        log(error) {
            console.error('Game error:', error);
            this.errors.push({
                timestamp: new Date(),
                message: error.message,
                stack: error.stack
            });
            
            if (this.errors.length > this.maxErrors) {
                this.errors.shift();
            }
            
            this.showErrorToUser(error);
        },
        
        showErrorToUser(error) {
            const message = document.createElement('div');
            message.className = 'error-message';
            message.textContent = 'An error occurred. Please refresh the page.';
            document.body.appendChild(message);
            
            setTimeout(() => message.remove(), 5000);
        }
    },

    // Memory management
    memoryManager: {
        objects: new Set(),
        
        track(object) {
            this.objects.add(object);
        },
        
        untrack(object) {
            this.objects.delete(object);
        },
        
        cleanup() {
            this.objects.forEach(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.objects.clear();
        }
    },

    // Add performance monitoring
    performanceMonitor: {
        startTime: Date.now(),
        frameTimes: [],
        
        logFrameTime(time) {
            this.frameTimes.push(time);
            if (this.frameTimes.length > 60) {
                this.frameTimes.shift();
            }
            
            const average = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
            if (average > 16.67) { // 60 FPS = 16.67ms per frame
                console.warn('Performance warning: Frame time above 16.67ms');
            }
        }
    },

    // Initialize game
    async init() {
        console.log('Starting game initialization...');
        try {
            console.log('Starting load progress...');
            await this.loadProgress();
            console.log('Load progress complete');
            
            console.log('Setting up Three.js...');
            this.setupThreeJS();
            console.log('Three.js setup complete');
            
            console.log('Setting up UI...');
            this.setupUI();
            console.log('UI setup complete');
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('Event listeners setup complete');
            
            console.log('Starting animation loop...');
            this.animate();
            console.log('Animation loop started');
            
            // Show main menu after initialization
            const mainMenu = document.getElementById('mainMenu');
            console.log('Main menu element:', mainMenu);
            if (mainMenu) {
                mainMenu.style.display = 'block';
                console.log('Main menu displayed');
            } else {
                console.error('Main menu element not found!');
            }
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
            this.handleError(error);
        }
    },

    // Load progress
    loadProgress() {
        console.log('Starting load progress...');
        const loading = document.getElementById('loading');
        console.log('Loading element:', loading);
        
        if (loading) {
            let progress = 0;
            loading.innerHTML = 'Loading game assets... 0%';
            
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    progress += 25;
                    loading.innerHTML = `Loading game assets... ${progress}%`;
                    console.log(`Loading progress: ${progress}%`);
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                        loading.style.display = 'none';
                        console.log('Loading complete, hiding loading screen');
                        resolve();
                    }
                }, 100);
            });
        }
        console.log('No loading element found, skipping loading screen');
        return Promise.resolve();
    },

    // Setup Three.js
    setupThreeJS() {
        console.log('Setting up Three.js scene...');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        console.log('Three.js renderer added to document');

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        console.log('Lights added to scene');

        // Create spaceship
        this.spaceship = new THREE.Mesh(this.geometries.spaceship, this.materials.spaceship);
        this.spaceship.rotation.x = Math.PI / 2;
        this.scene.add(this.spaceship);
        console.log('Spaceship added to scene');

        // Create stars
        this.createStars();
        console.log('Stars created');

        // Set camera position
        this.camera.position.z = 5;
        console.log('Camera position set');
    },

    // Create stars
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
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
        this.scene.add(stars);
    },

    // Setup UI
    setupUI() {
        console.log('Setting up UI elements...');
        // Hide loading screen
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
            console.log('Loading screen hidden');
        }
        
        // Show main menu
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.style.display = 'block';
            console.log('Main menu displayed');
        }
    },

    // Setup event listeners
    setupEventListeners() {
        window.addEventListener('resize', this.handleResize.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        window.addEventListener('beforeunload', this.cleanup.bind(this));
    },

    // Handle window resize
    handleResize() {
        try {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        } catch (error) {
            console.error('Error handling window resize:', error);
        }
    },

    // Handle key down
    handleKeyDown(event) {
        if (this.keys.hasOwnProperty(event.key)) {
            this.keys[event.key] = true;
        }
        if (event.key === 'Escape') {
            this.togglePause();
        }
    },

    // Handle key up
    handleKeyUp(event) {
        if (this.keys.hasOwnProperty(event.key)) {
            this.keys[event.key] = false;
        }
    },

    // Animation loop
    animate() {
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        if (this.state.gameOver || this.state.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.render();
    },

    // Update game state
    update(deltaTime) {
        if (this.state.isPaused) return;
        
        this.updateSpaceship();
        this.updateObstacles();
        this.updatePowerUps();
        this.updateParticles();
        this.updateEnvironmentalHazards();
        this.updateCheckpoints();
        this.updateSpaceWeather();
        this.updateCompanionDrones();
        this.checkCollisions();
        this.updateUI();
        
        if (this.state.gameMode === 'bossRush') {
            this.updateBossRush();
        } else if (this.state.gameMode === 'galacticConquest') {
            this.updateGalacticConquest();
        }
        
        this.performance.update();
    },

    // Update particles
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= 0.016;
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(i, 1);
            } else {
                particle.mesh.position.add(particle.velocity);
                particle.mesh.material.opacity = particle.life;
            }
        }
    },

    // Update obstacles
    updateObstacles() {
        const now = Date.now();
        if (now - this.state.lastObstacleSpawn > this.settings[this.state.gameMode].obstacleSpawnInterval) {
            this.createObstacle();
            this.state.lastObstacleSpawn = now;
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.position.z += this.settings[this.state.gameMode].obstacleSpeed;
            
            if (obstacle.position.z > 10) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
            }
        }
    },

    // Update power-ups
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.position.z += 0.3;
            
            if (powerUp.position.z > 10) {
                this.scene.remove(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
    },

    // Update spaceship
    updateSpaceship() {
        const speed = 0.1 * this.state.upgrades.speed;
        
        if (this.keys.w) this.spaceship.position.z -= speed;
        if (this.keys.s) this.spaceship.position.z += speed;
        if (this.keys.a) this.spaceship.position.x -= speed;
        if (this.keys.d) this.spaceship.position.x += speed;
        
        if (this.keys.ArrowLeft) this.spaceship.rotation.z += 0.05;
        if (this.keys.ArrowRight) this.spaceship.rotation.z -= 0.05;
        if (this.keys.ArrowUp) this.spaceship.rotation.x += 0.05;
        if (this.keys.ArrowDown) this.spaceship.rotation.x -= 0.05;
    },

    // Update boss
    updateBoss() {
        if (this.boss && this.state.gameMode === 'bossBattle') {
            // Boss movement and attack patterns
            this.boss.position.x = Math.sin(Date.now() * 0.001) * 2;
            this.boss.position.y = Math.cos(Date.now() * 0.001) * 2;
        }
    },

    // Update UI
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.state.score}`;
        document.getElementById('level').textContent = `Level ${this.state.level}`;
        
        const expPercentage = (this.state.experience / this.state.experienceToNextLevel) * 100;
        document.getElementById('expFill').style.width = `${expPercentage}%`;
    },

    // Check collisions
    checkCollisions() {
        // Check obstacle collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (this.spaceship.position.distanceTo(obstacle.position) < this.CONSTANTS.COLLISION_THRESHOLD) {
                if (this.state.upgrades.shield > 0) {
                    this.state.upgrades.shield--;
                    this.scene.remove(obstacle);
                    this.obstacles.splice(i, 1);
                } else {
                    this.gameOver();
                }
            }
        }

        // Check power-up collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.spaceship.position.distanceTo(powerUp.position) < this.CONSTANTS.COLLISION_THRESHOLD) {
                this.applyPowerUp(powerUp.type);
                this.scene.remove(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
    },

    // Check achievements
    checkAchievements() {
        // Implement achievement checks here
    },

    // Create obstacle
    createObstacle() {
        const obstacle = new THREE.Mesh(this.geometries.obstacle, this.materials.obstacle);
        obstacle.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            -20
        );
        this.scene.add(obstacle);
        this.obstacles.push(obstacle);
    },

    // Apply power-up
    applyPowerUp(type) {
        switch (type) {
            case 'shield':
                this.state.upgrades.shield++;
                break;
            case 'speed':
                this.state.upgrades.speed++;
                break;
            case 'weapon':
                this.state.upgrades.weapon++;
                break;
            case 'timeSlow':
                // Implement time slow effect
                break;
        }
    },

    // Game over
    gameOver() {
        this.state.gameOver = true;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = this.state.score;
        
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('highScore', this.state.highScore);
        }
    },

    // Toggle pause
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        document.getElementById('pauseMenu').style.display = this.state.isPaused ? 'block' : 'none';
    },

    // Show message
    showMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.style.position = 'fixed';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        messageElement.style.color = '#ffffff';
        messageElement.style.padding = '20px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.zIndex = '1000';
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        setTimeout(() => messageElement.remove(), 3000);
    },

    // Cleanup resources
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
    },

    // Error handling
    handleError(error) {
        console.error('Game error:', error);
        // Show user-friendly error message
        this.showMessage('An error occurred. Please refresh the page.');
    },

    // New methods for special weapons
    fireSpecialWeapon(type) {
        if (!this.state.specialWeapons[type].unlocked || this.state.specialWeapons[type].ammo <= 0) return;
        
        const weapon = this.state.specialWeapons[type];
        weapon.ammo--;
        
        switch(type) {
            case 'laser':
                this.createLaserBeam();
                break;
            case 'missile':
                this.createMissile();
                break;
            case 'plasma':
                this.createPlasmaBlast();
                break;
        }
        
        this.updateUI();
    },

    createLaserBeam() {
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 50, 8);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const laser = new THREE.Mesh(geometry, material);
        laser.position.copy(this.spaceship.position);
        laser.rotation.copy(this.spaceship.rotation);
        this.scene.add(laser);
        this.particles.push(laser);
        
        // Remove laser after 0.5 seconds
        setTimeout(() => {
            this.scene.remove(laser);
            this.particles = this.particles.filter(p => p !== laser);
        }, 500);
    },

    // New method for space stations
    createSpaceStation() {
        const stationGeometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
        const stationMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            shininess: 0.5,
            emissive: 0x404040
        });
        const station = new THREE.Mesh(stationGeometry, stationMaterial);
        
        station.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );
        
        this.scene.add(station);
        this.state.spaceStations.current = station;
        this.generateStationMissions();
    },

    generateStationMissions() {
        const missionTypes = ['delivery', 'combat', 'exploration', 'mining'];
        this.state.spaceStations.missions = missionTypes.map(type => ({
            type,
            reward: Math.floor(Math.random() * 1000),
            difficulty: Math.floor(Math.random() * 3) + 1,
            completed: false
        }));
    },

    // New method for environmental hazards
    createEnvironmentalHazard(type) {
        switch(type) {
            case 'asteroid':
                this.createAsteroidField();
                break;
            case 'nebula':
                this.createNebula();
                break;
            case 'blackHole':
                this.createBlackHole();
                break;
        }
    },

    createAsteroidField() {
        for (let i = 0; i < 20; i++) {
            const size = Math.random() * 2 + 1;
            const geometry = new THREE.DodecahedronGeometry(size, 0);
            const material = new THREE.MeshPhongMaterial({
                color: 0x808080,
                shininess: 0.3
            });
            const asteroid = new THREE.Mesh(geometry, material);
            
            asteroid.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            );
            
            asteroid.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.scene.add(asteroid);
            this.environmentalHazards.asteroids.push(asteroid);
        }
    },

    updateEnvironmentalHazards() {
        // Update asteroid positions
        this.environmentalHazards.asteroids.forEach(asteroid => {
            asteroid.rotation.x += 0.01;
            asteroid.rotation.y += 0.01;
            asteroid.position.z -= 0.5;
            
            if (asteroid.position.z < -50) {
                this.scene.remove(asteroid);
                this.environmentalHazards.asteroids = 
                    this.environmentalHazards.asteroids.filter(a => a !== asteroid);
            }
        });
    },

    updateCheckpoints() {
        this.checkpoints.forEach(station => {
            station.rotation.y += 0.005;
            
            // Check if spaceship is near checkpoint
            const distance = this.spaceship.position.distanceTo(station.position);
            if (distance < 10 && this.state.currentCheckpoint !== station) {
                this.state.currentCheckpoint = station;
                this.showMessage('Checkpoint reached!');
                this.state.score += 500;
            }
        });
    },

    updateBossRush() {
        if (this.state.bossRushProgress >= this.settings.bossRush.bossCount) {
            this.gameOver(true);
            return;
        }
        
        if (!this.boss) {
            this.createBoss();
        }
        
        this.updateBoss();
    },

    // New methods for Galactic Conquest
    initGalacticConquest() {
        for (let i = 0; i < this.settings.galacticConquest.sectorCount; i++) {
            this.state.galacticConquest.sectors.push({
                id: i,
                type: this.getRandomSectorType(),
                resources: this.generateSectorResources(),
                enemies: this.generateSectorEnemies(),
                completed: false
            });
        }
    },

    getRandomSectorType() {
        const types = ['asteroid', 'nebula', 'void', 'star', 'planet'];
        return types[Math.floor(Math.random() * types.length)];
    },

    generateSectorResources() {
        return {
            credits: Math.floor(Math.random() * 1000),
            minerals: Math.floor(Math.random() * 500),
            energy: Math.floor(Math.random() * 200)
        };
    },

    // Space Station methods
    createSpaceStation() {
        const stationGeometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
        const stationMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            shininess: 0.5,
            emissive: 0x404040
        });
        const station = new THREE.Mesh(stationGeometry, stationMaterial);
        
        station.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );
        
        this.scene.add(station);
        this.state.spaceStations.current = station;
        this.generateStationMissions();
    },

    generateStationMissions() {
        const missionTypes = ['delivery', 'combat', 'exploration', 'mining'];
        this.state.spaceStations.missions = missionTypes.map(type => ({
            type,
            reward: Math.floor(Math.random() * 1000),
            difficulty: Math.floor(Math.random() * 3) + 1,
            completed: false
        }));
    },

    // Ship Customization methods
    customizeShip(part, style) {
        this.state.shipCustomization[part] = style;
        this.updateShipAppearance();
    },

    updateShipAppearance() {
        const { hull, engine, weapons, paint, decals } = this.state.shipCustomization;
        
        // Update ship geometry based on hull
        this.spaceship.geometry.dispose();
        this.spaceship.geometry = this.getHullGeometry(hull);
        
        // Update materials based on paint and decals
        this.spaceship.material.dispose();
        this.spaceship.material = this.getShipMaterial(paint, decals);
    },

    // Space Weather methods
    updateSpaceWeather() {
        const weatherTypes = ['clear', 'solar_flare', 'ion_storm', 'meteor_shower'];
        if (Math.random() < 0.01) { // 1% chance to change weather
            this.state.spaceWeather.current = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            this.applyWeatherEffects();
        }
    },

    applyWeatherEffects() {
        const { current, intensity } = this.state.spaceWeather;
        switch(current) {
            case 'solar_flare':
                this.createSolarFlareEffect(intensity);
                break;
            case 'ion_storm':
                this.createIonStormEffect(intensity);
                break;
            case 'meteor_shower':
                this.createMeteorShower(intensity);
                break;
        }
    },

    // Companion Drone methods
    createCompanionDrone(type) {
        const droneGeometry = new THREE.OctahedronGeometry(0.5);
        const droneMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x004400
        });
        const drone = new THREE.Mesh(droneGeometry, droneMaterial);
        
        drone.position.copy(this.spaceship.position);
        drone.position.x += 2;
        
        this.scene.add(drone);
        this.state.companionDrones.active.push({
            mesh: drone,
            type,
            behavior: this.getDroneBehavior(type)
        });
    },

    updateCompanionDrones() {
        this.state.companionDrones.active.forEach(drone => {
            const behavior = drone.behavior;
            const targetPosition = behavior.getTargetPosition(this.spaceship.position);
            drone.mesh.position.lerp(targetPosition, 0.1);
            
            if (behavior.shouldAttack()) {
                this.fireDroneWeapon(drone);
            }
        });
    },

    getDroneBehavior(type) {
        return {
            getTargetPosition: (shipPos) => {
                // Different positioning based on drone type
                switch(type) {
                    case 'combat':
                        return new THREE.Vector3(
                            shipPos.x + Math.sin(Date.now() * 0.001) * 3,
                            shipPos.y + Math.cos(Date.now() * 0.001) * 3,
                            shipPos.z
                        );
                    case 'support':
                        return new THREE.Vector3(
                            shipPos.x - 2,
                            shipPos.y,
                            shipPos.z
                        );
                    default:
                        return shipPos.clone();
                }
            },
            shouldAttack: () => {
                return type === 'combat' && Math.random() < 0.1;
            }
        };
    },

    // Update method modifications
    update(deltaTime) {
        if (this.state.isPaused) return;
        
        this.updateSpaceship();
        this.updateObstacles();
        this.updatePowerUps();
        this.updateParticles();
        this.updateEnvironmentalHazards();
        this.updateCheckpoints();
        this.updateSpaceWeather();
        this.updateCompanionDrones();
        this.checkCollisions();
        this.updateUI();
        
        if (this.state.gameMode === 'bossRush') {
            this.updateBossRush();
        } else if (this.state.gameMode === 'galacticConquest') {
            this.updateGalacticConquest();
        }
        
        this.performance.update();
    }
};

// Initialize game when window loads
window.addEventListener('load', () => Game.init());

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        performance: Game.performance,
        errorHandler: Game.errorHandler,
        memoryManager: Game.memoryManager,
        performanceMonitor: Game.performanceMonitor
    };
} 