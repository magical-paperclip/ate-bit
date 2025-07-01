document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    Game.init();
});

window.Game = {
    scene: null,
    cam: null,
    renderer: null,
    ship: null,
    currentScreen: 'mainMenu',
    stars: null,
    stuff: [],

    
    vel: { x: 0, y: 0, z: 0 },
    acc: 0.008,
    drag: 0.985,
    maxSpd: 12.0,
    bankAngle: 0,
    pitch: 0,
    yaw: 0,
    thrust: 0,
    mouse: {
        x: 0,
        y: 0,
        sensitivity: 0.002,
        locked: false,
        smoothingX: 0,
        smoothingY: 0
    },
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        KeyW: false,
        KeyA: false,
        KeyS: false,
        KeyD: false
    },

    init: function() {
        console.log('Game initialized!');
        this.setupScene();
        this.buildShip();
        this.makeStars();
        this.spawnStuff();
        this.bindKeys();
        this.bindMouse();
        this.loop();
        var loading = document.getElementById('loadingScreen');
        if (loading) loading.style.display = 'none';
        this.showScreen('mainMenu');
        this.bindUI();
    },

    setupScene: function() {
        this.scene = new THREE.Scene();
        this.createDynamicBackground();
        
        this.cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cam.position.z = 5;
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = false;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.renderer.domElement.tabIndex = 0;
        this.renderer.domElement.style.outline = 'none';
        document.body.appendChild(this.renderer.domElement);
        
        setTimeout(() => {
            this.renderer.domElement.focus();
        }, 100);
        
        window.addEventListener('resize', () => {
            this.cam.aspect = window.innerWidth / window.innerHeight;
            this.cam.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Realistic space lighting - minimal ambient (cosmic background radiation)
        const ambLight = new THREE.AmbientLight(0x1a1a2e, 0.15);
        this.scene.add(ambLight);
        
        // Distant star light (directional, cool white)
        const starLight = new THREE.DirectionalLight(0xfff8e7, 0.8);
        starLight.position.set(10, 5, 8);
        starLight.castShadow = false; // Better performance
        this.scene.add(starLight);
        
        // Secondary fill light (simulating reflected starlight)
        const fillLight = new THREE.DirectionalLight(0x4a5f7a, 0.3);
        fillLight.position.set(-5, -3, -5);
        this.scene.add(fillLight);
    },

    buildShip: function() {
        this.ship = new THREE.Group();
        
        // Realistic materials with proper lighting response
        const hullMat = new THREE.MeshLambertMaterial({ 
            color: 0xd0d0d0,
            emissive: 0x111111
        });
        const cockpitMat = new THREE.MeshLambertMaterial({ 
            color: 0x1a3d7a, 
            transparent: true, 
            opacity: 0.85,
            emissive: 0x0a1530
        });
        const engineMat = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            emissive: 0x0a0a0a
        });
        const wingMat = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a,
            emissive: 0x101010
        });
        const accentMat = new THREE.MeshLambertMaterial({ 
            color: 0xff6600,
            emissive: 0x331100
        });
        
        const hullGeo = new THREE.CylinderGeometry(0.15, 0.1, 1.2, 6);
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.rotation.z = Math.PI / 2;
        this.ship.add(hull);
        
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0x0066cc });
        const stripeGeo = new THREE.CylinderGeometry(0.16, 0.11, 0.2, 6);
        
        const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe1.rotation.z = Math.PI / 2;
        stripe1.position.x = 0.2;
        this.ship.add(stripe1);
        
        const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe2.rotation.z = Math.PI / 2;
        stripe2.position.x = -0.1;
        this.ship.add(stripe2);
        
        const cockpitGeo = new THREE.SphereGeometry(0.18, 6, 4);
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.x = 0.5;
        cockpit.scale.set(1, 0.8, 0.8);
        this.ship.add(cockpit);
        
        const wingGeo = new THREE.BoxGeometry(0.3, 0.05, 0.8);
        
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(-0.2, 0, -0.4);
        this.ship.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.set(-0.2, 0, 0.4);
        this.ship.add(rightWing);
        
        const tipGeo = new THREE.SphereGeometry(0.06, 6, 6);
        
        const leftTip = new THREE.Mesh(tipGeo, accentMat);
        leftTip.position.set(-0.35, 0, -0.4);
        this.ship.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeo, accentMat);
        rightTip.position.set(-0.35, 0, 0.4);
        this.ship.add(rightTip);
        
        const engineGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 6);
        
        const leftEngine = new THREE.Mesh(engineGeo, engineMat);
        leftEngine.rotation.z = Math.PI / 2;
        leftEngine.position.set(-0.65, 0, -0.15);
        this.ship.add(leftEngine);
        
        const rightEngine = new THREE.Mesh(engineGeo, engineMat);
        rightEngine.rotation.z = Math.PI / 2;
        rightEngine.position.set(-0.65, 0, 0.15);
        this.ship.add(rightEngine);
        
        const mainEngineGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 6);
        const mainEngine = new THREE.Mesh(mainEngineGeo, engineMat);
        mainEngine.rotation.z = Math.PI / 2;
        mainEngine.position.set(-0.7, 0, 0);
        this.ship.add(mainEngine);
        
        // Realistic engine exhaust effects
        const thrustGeo = new THREE.ConeGeometry(0.04, 0.25, 8);
        const thrustMat = new THREE.MeshBasicMaterial({ 
            color: 0x88aaff,
            transparent: true,
            opacity: 0.0 // Start invisible
        });
        
        const leftThrust = new THREE.Mesh(thrustGeo, thrustMat.clone());
        leftThrust.rotation.z = -Math.PI / 2;
        leftThrust.position.set(-0.9, 0, -0.15);
        leftThrust.userData.type = 'thrust';
        leftThrust.userData.engineId = 'left';
        this.ship.add(leftThrust);
        
        const rightThrust = new THREE.Mesh(thrustGeo, thrustMat.clone());
        rightThrust.rotation.z = -Math.PI / 2;
        rightThrust.position.set(-0.9, 0, 0.15);
        rightThrust.userData.type = 'thrust';
        rightThrust.userData.engineId = 'right';
        this.ship.add(rightThrust);
        
        const mainThrust = new THREE.Mesh(thrustGeo, thrustMat.clone());
        mainThrust.rotation.z = -Math.PI / 2;
        mainThrust.position.x = -0.95;
        mainThrust.scale.set(1.4, 1.6, 1.4);
        mainThrust.userData.type = 'thrust';
        mainThrust.userData.engineId = 'main';
        this.ship.add(mainThrust);
        
        const lightGeo = new THREE.SphereGeometry(0.03, 4, 4);
        
        const topLight = new THREE.Mesh(lightGeo, accentMat.clone());
        topLight.position.set(0.2, 0.18, 0);
        topLight.userData.type = 'blinky';
        this.ship.add(topLight);
        
        const bottomLight = new THREE.Mesh(lightGeo, accentMat.clone());
        bottomLight.position.set(0.2, -0.18, 0);
        bottomLight.userData.type = 'blinky';
        this.ship.add(bottomLight);
        
        const navMat = new THREE.MeshBasicMaterial({ color: 0x00aa44 });
        const navLight = new THREE.Mesh(lightGeo, navMat);
        navLight.position.set(0.45, 0, 0);
        navLight.userData.type = 'nav';
        this.ship.add(navLight);
        
        this.ship.position.set(0, 0, 0);
        this.scene.add(this.ship);
    },

    createDynamicBackground: function() {
        // Simple solid color background
        this.scene.background = new THREE.Color(0x000511);
    },





    makeStars: function() {
        // Realistic distant star field
        const count = 2000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Stars are VERY far away - create sphere around player
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = 800 + Math.random() * 200; // Very distant
            
            pos[i3] = radius * Math.sin(theta) * Math.cos(phi);
            pos[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            pos[i3 + 2] = radius * Math.cos(theta);

            // Realistic star colors based on stellar classification
            const starType = Math.random();
            if (starType < 0.6) {
                // Main sequence stars (white/yellow)
                const temp = 0.8 + Math.random() * 0.2;
                colors[i3] = temp;
                colors[i3 + 1] = temp * 0.95;
                colors[i3 + 2] = temp * 0.85;
            } else if (starType < 0.85) {
                // Blue giants
                colors[i3] = 0.7 + Math.random() * 0.2;
                colors[i3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i3 + 2] = 0.95 + Math.random() * 0.05;
            } else {
                // Red giants
                colors[i3] = 0.9 + Math.random() * 0.1;
                colors[i3 + 1] = 0.6 + Math.random() * 0.3;
                colors[i3 + 2] = 0.4 + Math.random() * 0.2;
            }

            // Realistic apparent magnitude distribution
            const magnitude = Math.random();
            if (magnitude < 0.1) {
                sizes[i] = 2.0; // Bright stars
            } else if (magnitude < 0.3) {
                sizes[i] = 1.5; // Medium stars
            } else {
                sizes[i] = 1.0; // Dim stars
            }
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);
    },

    tickStars: function() {
        if (!this.stars) return;

        // Stars are distant and move very slowly relative to ship
        // Only update star positions if ship has moved significantly
        if (!this.starTick) this.starTick = 0;
        this.starTick++;
        if (this.starTick % 20 !== 0) return; // Much less frequent updates
        
        const pos = this.stars.geometry.attributes.position.array;
        const count = pos.length / 3;
        const camX = this.cam.position.x;
        const camY = this.cam.position.y;
        const camZ = this.cam.position.z;

        // Stars are very far away, so they barely move relative to ship
        const maxDist = 1000; // Much larger distance before regenerating
        
        // Only update a few stars per frame for performance
        const batch = Math.ceil(count / 20);
        const start = (this.starTick % 20) * batch;
        const end = Math.min(start + batch, count);

        for (let i = start; i < end; i++) {
            const i3 = i * 3;
            
            // Check if star is too close (shouldn't happen with distant stars)
            const px = pos[i3] - camX;
            const py = pos[i3 + 1] - camY;
            const pz = pos[i3 + 2] - camZ;
            const dist = Math.sqrt(px*px + py*py + pz*pz);
            
            // Only regenerate if star got too close (very rare)
            if (dist < 500) {
                // Place star back at distant sphere
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;
                const radius = 800 + Math.random() * 200;
                
                pos[i3] = camX + radius * Math.sin(theta) * Math.cos(phi);
                pos[i3 + 1] = camY + radius * Math.sin(theta) * Math.sin(phi);
                pos[i3 + 2] = camZ + radius * Math.cos(theta);
            }
        }

        this.stars.geometry.attributes.position.needsUpdate = true;
    },



    spawnStuff: function() {
        const count = 8;
        for (let i = 0; i < count; i++) {
            this.makeRandomThing();
        }
    },

    makeRandomThing: function() {
        const rnd = Math.random();
        let geo, mat, thing;
        
        // Simple crystalline asteroids - no transparent effects
        if (rnd < 0.4) {
            const sz = Math.random() * 1.5 + 0.8;
            geo = new THREE.OctahedronGeometry(sz, 1);
            mat = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.55 + Math.random() * 0.4, 0.8, 0.6),
                emissive: new THREE.Color().setHSL(0.55 + Math.random() * 0.4, 0.3, 0.1)
            });
            
            thing = new THREE.Mesh(geo, mat);
            
        } else if (rnd < 0.7) {
            const sz = Math.random() * 1.2 + 0.6;
            geo = new THREE.IcosahedronGeometry(sz, 1);
            mat = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.15 + Math.random() * 0.7, 0.9, 0.6),
                emissive: new THREE.Color().setHSL(0.15 + Math.random() * 0.7, 0.2, 0.05)
            });
            
            thing = new THREE.Mesh(geo, mat);
            
        } else {
            const sz = Math.random() * 1.8 + 1.0;
            geo = new THREE.TorusGeometry(sz, sz * 0.2, 8, 16);
            mat = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.8 + Math.random() * 0.2, 1.0, 0.7),
                emissive: new THREE.Color().setHSL(0.8 + Math.random() * 0.2, 0.3, 0.1)
            });
            
            thing = new THREE.Mesh(geo, mat);
        }
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 80;
        const height = (Math.random() - 0.5) * 40;
        
        thing.position.x = this.cam.position.x + Math.cos(angle) * dist;
        thing.position.y = this.cam.position.y + height;
        thing.position.z = this.cam.position.z + Math.sin(angle) * dist * 0.5;
        
        thing.rotation.x = Math.random() * Math.PI * 2;
        thing.rotation.y = Math.random() * Math.PI * 2;
        thing.rotation.z = Math.random() * Math.PI * 2;
        
        thing.userData = {
            spin: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            drift: {
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.005
            },
            type: 'asteroid'
        };
        
        this.scene.add(thing);
        this.stuff.push(thing);
        return thing;
    },

    tickStuff: function() {
        const maxDist = 200;
        const camPos = this.cam.position;
        const t = Date.now() * 0.001;
        
        if (!this.stuffTick) this.stuffTick = 0;
        this.stuffTick++;
        const shouldAnim = this.stuffTick % 2 === 0;
        
        for (let i = this.stuff.length - 1; i >= 0; i--) {
            const thing = this.stuff[i];
            
            // Bulletproof safety checks
            if (!thing || !thing.userData || !thing.position || !thing.rotation) {
                console.warn('Removing invalid object from stuff array');
                this.stuff.splice(i, 1);
                if (thing && this.scene) {
                    this.scene.remove(thing);
                }
                continue;
            }
            
            const data = thing.userData;
            
            // Safe rotation updates
            try {
                if (data.spin && typeof data.spin === 'object') {
                    thing.rotation.x += data.spin.x || 0;
                    thing.rotation.y += data.spin.y || 0;
                    thing.rotation.z += data.spin.z || 0;
                }
            } catch (e) {
                console.warn('Error updating rotation:', e);
            }
            
            // Safe position updates
            try {
                if (data.drift && typeof data.drift === 'object') {
                    thing.position.x += (data.drift.x || 0);
                    thing.position.y += (data.drift.y || 0);
                    thing.position.z += (data.drift.z || 0);
                }
            } catch (e) {
                console.warn('Error updating position:', e);
            }
            
            // Safe animation updates
            if (shouldAnim && Math.random() < 0.1) {
                try {
                    if (thing.material && thing.material.opacity !== undefined) {
                        thing.material.opacity = Math.min(1.0, thing.material.opacity);
                    }
                } catch (e) {
                    console.warn('Error updating material:', e);
                }
            }
            
            // Clean simple rotation for asteroids
            if (shouldAnim && Math.random() < 0.1) {
                try {
                    if (thing.material && thing.material.emissive) {
                        // Subtle emissive pulse for crystals
                        const pulse = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
                        thing.material.emissive.multiplyScalar(pulse);
                    }
                } catch (e) {
                    console.warn('Error updating material:', e);
                }
            }
            
            // Safe trail spawning
            try {
                if (Math.random() < 0.001 && thing.position) {
                    this.spawnTrail(thing.position);
                }
            } catch (e) {
                console.warn('Error spawning trail:', e);
            }
            
            // Safe distance check and cleanup
            try {
                if (thing.position && camPos) {
                    const dist = thing.position.distanceTo(camPos);
                    
                    if (dist > maxDist) {
                        this.scene.remove(thing);
                        this.stuff.splice(i, 1);
                        this.makeRandomThing();
                    }
                }
            } catch (e) {
                console.warn('Error checking distance:', e);
                // Remove problematic object
                this.stuff.splice(i, 1);
                if (this.scene) {
                    this.scene.remove(thing);
                }
            }
        }
    },

        spawnTrail: function(pos) {
        if (Math.random() > 0.3) return; // Spawn fewer trails
        
        const geo = new THREE.SphereGeometry(0.02, 3, 3);
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0x6699ff,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(geo, mat);
        
        trail.position.copy(pos);
        trail.position.add(new THREE.Vector3(
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1
        ));
        
        trail.userData = {
            life: 1.0
        };
        
        this.scene.add(trail);
        this.stuff.push(trail);
        
        setTimeout(() => {
            this.scene.remove(trail);
            const idx = this.stuff.indexOf(trail);
            if (idx > -1) this.stuff.splice(idx, 1);
        }, 1000);
    },



    bindKeys: function() {
        const self = this;
        
        window.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD') {
                e.preventDefault();
                if (e.key.startsWith('Arrow')) {
                    self.keys[e.key] = true;
                } else {
                    self.keys[e.code] = true;
                }
            }
        });

        window.addEventListener('keyup', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD') {
                e.preventDefault();
                if (e.key.startsWith('Arrow')) {
                    self.keys[e.key] = false;
                } else {
                    self.keys[e.code] = false;
                }
            }
        });
        
        window.addEventListener('keydown', function(e) {
            switch(e.keyCode) {
                case 37: // Arrow Left
                    e.preventDefault();
                    self.keys.ArrowLeft = true;
                    break;
                case 38: // Arrow Up
                    e.preventDefault();
                    self.keys.ArrowUp = true;
                    break;
                case 39: // Arrow Right
                    e.preventDefault();
                    self.keys.ArrowRight = true;
                    break;
                case 40: // Arrow Down
                    e.preventDefault();
                    self.keys.ArrowDown = true;
                    break;
                case 87: // W key
                    e.preventDefault();
                    self.keys.KeyW = true;
                    break;
                case 65: // A key
                    e.preventDefault();
                    self.keys.KeyA = true;
                    break;
                case 83: // S key
                    e.preventDefault();
                    self.keys.KeyS = true;
                    break;
                case 68: // D key
                    e.preventDefault();
                    self.keys.KeyD = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', function(e) {
            switch(e.keyCode) {
                case 37: // Arrow Left
                    e.preventDefault();
                    self.keys.ArrowLeft = false;
                    break;
                case 38: // Arrow Up
                    e.preventDefault();
                    self.keys.ArrowUp = false;
                    break;
                case 39: // Arrow Right
                    e.preventDefault();
                    self.keys.ArrowRight = false;
                    break;
                case 40: // Arrow Down
                    e.preventDefault();
                    self.keys.ArrowDown = false;
                    break;
                case 87: // W key
                    e.preventDefault();
                    self.keys.KeyW = false;
                    break;
                case 65: // A key
                    e.preventDefault();
                    self.keys.KeyA = false;
                    break;
                case 83: // S key
                    e.preventDefault();
                    self.keys.KeyS = false;
                    break;
                case 68: // D key
                    e.preventDefault();
                    self.keys.KeyD = false;
                    break;
            }
        });
    },

    bindMouse: function() {
        const canvas = this.renderer.domElement;
        const self = this;
        
        // Click to lock mouse pointer (flight sim style)
        canvas.addEventListener('click', function() {
            if (!self.mouse.locked) {
                canvas.requestPointerLock();
            }
        });
        
        // Pointer lock change events
        document.addEventListener('pointerlockchange', function() {
            self.mouse.locked = document.pointerLockElement === canvas;
            console.log('Mouse lock:', self.mouse.locked ? 'ON' : 'OFF');
        });
        
        // Mouse movement for pitch and yaw
        document.addEventListener('mousemove', function(e) {
            if (!self.mouse.locked || self.currentScreen !== 'gameUI') return;
            
            // Get mouse movement delta
            const deltaX = e.movementX || 0;
            const deltaY = e.movementY || 0;
            
            // Apply sensitivity and smooth the input
            const targetSmoothingX = deltaX * self.mouse.sensitivity;
            const targetSmoothingY = deltaY * self.mouse.sensitivity;
            
            // Smooth mouse input to prevent jittery movement
            self.mouse.smoothingX += (targetSmoothingX - self.mouse.smoothingX) * 0.3;
            self.mouse.smoothingY += (targetSmoothingY - self.mouse.smoothingY) * 0.3;
            
            // Apply to ship rotation
            self.yaw += self.mouse.smoothingX;
            self.pitch += self.mouse.smoothingY;
            
            // Limit pitch to prevent flipping upside down
            const maxPitch = Math.PI / 3; // 60 degrees
            self.pitch = Math.max(-maxPitch, Math.min(maxPitch, self.pitch));
        });
        
        // Escape key to unlock mouse
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && self.mouse.locked) {
                document.exitPointerLock();
            }
        });
        
        // Mouse wheel for sensitivity adjustment
        canvas.addEventListener('wheel', function(e) {
            if (self.mouse.locked) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.0001 : -0.0001;
                self.mouse.sensitivity = Math.max(0.0005, Math.min(0.005, self.mouse.sensitivity + delta));
                console.log('Mouse sensitivity:', self.mouse.sensitivity.toFixed(4));
            }
        });
    },

    move: function() {
        // Advanced flight simulator physics with mouse controls
        const dt = 1/60; // Delta time for 60fps consistency
        
        // Main engine thrust (keyboard controlled)
        let mainThrust = 0;
        if (this.keys.ArrowUp || this.keys.KeyW) mainThrust = 4.0; // Main engines
        if (this.keys.ArrowDown || this.keys.KeyS) mainThrust = -1.5; // Reverse thrusters
        
        // Roll control (keyboard - A/D for banking)
        let targetBank = 0;
        if (this.keys.ArrowLeft || this.keys.KeyA) targetBank = Math.PI / 4; // 45 degrees
        if (this.keys.ArrowRight || this.keys.KeyD) targetBank = -Math.PI / 4;
        
        // Mouse controls pitch and yaw (already updated in bindMouse)
        // Pitch is limited to prevent loops, yaw is unlimited for full 360° control
        
        // Realistic engine spool-up
        this.thrust += (mainThrust - this.thrust) * 0.12;
        
        // Calculate ship's forward direction based on yaw and pitch
        const cosYaw = Math.cos(this.yaw);
        const sinYaw = Math.sin(this.yaw);
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        
        // Forward vector in world space
        const forwardX = cosYaw * cosPitch;
        const forwardY = sinPitch;
        const forwardZ = sinYaw * cosPitch;
        
        // Apply thrust in forward direction
        const forwardForce = this.thrust * this.acc;
        this.vel.x += forwardX * forwardForce;
        this.vel.y += forwardY * forwardForce;
        this.vel.z += forwardZ * forwardForce;
        
        // Realistic space drag (minimal)
        this.vel.x *= this.drag;
        this.vel.y *= this.drag;
        this.vel.z *= this.drag;
        
        // Velocity limiting
        const totalSpeed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y + this.vel.z * this.vel.z);
        if (totalSpeed > this.maxSpd) {
            const ratio = this.maxSpd / totalSpeed;
            this.vel.x *= ratio;
            this.vel.y *= ratio;
            this.vel.z *= ratio;
        }
        
        // Update ship position
        this.ship.position.x += this.vel.x * dt * 60;
        this.ship.position.y += this.vel.y * dt * 60;
        this.ship.position.z += this.vel.z * dt * 60;
        
        // Smooth banking transition
        this.bankAngle += (targetBank - this.bankAngle) * 0.08;
        
        // Apply realistic ship orientation (yaw, pitch, bank)
        this.ship.rotation.order = 'YXZ'; // Yaw first, then pitch, then bank
        this.ship.rotation.y = this.yaw;
        this.ship.rotation.x = this.pitch;
        this.ship.rotation.z = this.bankAngle;
        
        // Advanced camera system - first person cockpit view
        const followSpeed = 0.15;
        const cockpitOffset = 2.5; // Distance behind ship nose
        
        // Calculate camera position relative to ship orientation
        const camOffsetX = -forwardX * cockpitOffset;
        const camOffsetY = -forwardY * cockpitOffset + 0.2; // Slightly above center
        const camOffsetZ = -forwardZ * cockpitOffset;
        
        const targetCamX = this.ship.position.x + camOffsetX;
        const targetCamY = this.ship.position.y + camOffsetY;
        const targetCamZ = this.ship.position.z + camOffsetZ;
        
        // Smooth camera following
        this.cam.position.x += (targetCamX - this.cam.position.x) * followSpeed;
        this.cam.position.y += (targetCamY - this.cam.position.y) * followSpeed;
        this.cam.position.z += (targetCamZ - this.cam.position.z) * followSpeed;
        
        // Camera looks in ship's forward direction
        const lookAtX = this.ship.position.x + forwardX * 100;
        const lookAtY = this.ship.position.y + forwardY * 100;
        const lookAtZ = this.ship.position.z + forwardZ * 100;
        
        this.cam.lookAt(lookAtX, lookAtY, lookAtZ);
        
        // Apply banking to camera for realistic cockpit feel
        this.cam.rotation.z = this.bankAngle * 0.6;
        
        // Speed-based FOV with more dramatic effect
        const baseFOV = 75;
        const speedFactor = Math.min(totalSpeed / this.maxSpd, 1.0);
        const speedFOV = speedFactor * 15; // More dramatic speed effect
        this.cam.fov = baseFOV + speedFOV;
        this.cam.updateProjectionMatrix();
    },

    loop: function() {
        var self = this;
        
        // Ensure consistent frame timing for smooth movement
        const targetFrameTime = 1000 / 60; // 60 FPS
        const now = performance.now();
        
        if (!this.lastFrameTime) this.lastFrameTime = now;
        const elapsed = now - this.lastFrameTime;
        
        // Only run if enough time has passed for smooth 60fps
        if (elapsed >= targetFrameTime - 1) {
            this.lastFrameTime = now;
            
            if (!this.fps) {
                this.fps = {
                    frames: 0,
                    last: Date.now(),
                    current: 60
                };
            }
            
            this.fps.frames++;
            const fpsNow = Date.now();
            if (fpsNow - this.fps.last >= 1000) {
                this.fps.current = Math.round((this.fps.frames * 1000) / (fpsNow - this.fps.last));
                this.fps.frames = 0;
                this.fps.last = fpsNow;
                
                if (this.currentScreen === 'gameUI') {
                    const el = document.getElementById('fpsDisplay');
                    if (el) {
                        el.textContent = `FPS: ${this.fps.current}`;
                    }
                    
                    // Update realistic HUD
                    this.updateSpaceshipHUD();
                }
            }
            
            if (this.currentScreen === 'gameUI') {
                this.tickShip();
                this.tickStars();
                this.tickStuff();
                this.move();
            }
            
            this.renderer.render(this.scene, this.cam);
        }
        
        requestAnimationFrame(function() { self.loop(); });
    },
    
    tickShip: function() {
        if (!this.ship) return;
        
        if (!this.shipTick) this.shipTick = 0;
        this.shipTick++;
        if (this.shipTick % 2 !== 0) return;
        
        // Get current control inputs for realistic engine effects
        const mainEngineActive = this.keys.ArrowUp || this.keys.KeyW;
        const reverseEngineActive = this.keys.ArrowDown || this.keys.KeyS;
        const thrustLevel = Math.abs(this.thrust);
        
        this.ship.children.forEach(kid => {
            if (kid.userData && kid.userData.type === 'thrust') {
                const engineId = kid.userData.engineId;
                
                // Realistic engine exhaust based on actual thrust
                if (engineId === 'main') {
                    if (mainEngineActive && thrustLevel > 0.1) {
                        kid.material.opacity = Math.min(0.9, thrustLevel * 0.25);
                        kid.scale.set(1.4, 1.6 + thrustLevel * 0.4, 1.4);
                        // Blue-white hot exhaust for main engine
                        kid.material.color.setRGB(0.6 + thrustLevel * 0.3, 0.7 + thrustLevel * 0.2, 1.0);
                    } else {
                        kid.material.opacity = 0.0;
                        kid.scale.set(1.4, 1.6, 1.4);
                    }
                } else {
                    // Side engines for maneuvering
                    if (mainEngineActive && thrustLevel > 0.05) {
                        kid.material.opacity = Math.min(0.7, thrustLevel * 0.2);
                        kid.scale.set(1.0, 1.0 + thrustLevel * 0.3, 1.0);
                        // Slightly cooler exhaust for smaller engines
                        kid.material.color.setRGB(0.5 + thrustLevel * 0.2, 0.6 + thrustLevel * 0.2, 1.0);
                    } else {
                        kid.material.opacity = 0.0;
                        kid.scale.set(1.0, 1.0, 1.0);
                    }
                }
            }
            
            if (kid.userData && kid.userData.type === 'blinky') {
                // Realistic navigation lights
                kid.material.color.setRGB(1, 0.4, 0);
            }
            
            if (kid.userData && kid.userData.type === 'nav') {
                // Realistic position lights
                kid.material.color.setRGB(0, 0.7, 0.3);
            }
        });
    },

    updateSpaceshipHUD: function() {
        if (this.currentScreen !== 'gameUI') return;
        
        // Calculate flight parameters
        const totalVelocity = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y + this.vel.z * this.vel.z);
        const velocityMS = totalVelocity * 100;
        const altitude = Math.abs(this.ship.position.y) * 10;
        const thrustPercent = Math.round((Math.abs(this.thrust) / 4.0) * 100);
        const bankDegrees = (this.bankAngle * 180 / Math.PI);
        const pitchDegrees = (this.pitch * 180 / Math.PI);
        const yawDegrees = (this.yaw * 180 / Math.PI) % 360;
        
        // Update HUD elements
        const velEl = document.getElementById('velocityDisplay');
        if (velEl) {
            velEl.textContent = `VELOCITY: ${velocityMS.toFixed(2)} m/s`;
        }
        
        const altEl = document.getElementById('altitudeDisplay');
        if (altEl) {
            altEl.textContent = `ALTITUDE: ${altitude.toFixed(1)} km`;
        }
        
        const thrustEl = document.getElementById('thrustDisplay');
        if (thrustEl) {
            thrustEl.textContent = `THRUST: ${thrustPercent}%`;
        }
        
        const attEl = document.getElementById('attitudeDisplay');
        if (attEl) {
            attEl.textContent = `BANK: ${bankDegrees.toFixed(1)}° | PITCH: ${pitchDegrees.toFixed(1)}°`;
        }
        
        const mouseEl = document.getElementById('mouseStatusDisplay');
        if (mouseEl) {
            if (this.mouse.locked) {
                mouseEl.textContent = `MOUSE: LOCKED | SENS: ${this.mouse.sensitivity.toFixed(3)}`;
                mouseEl.style.color = '#00ff00';
            } else {
                mouseEl.textContent = 'MOUSE: CLICK TO LOCK';
                mouseEl.style.color = '#ff6600';
            }
        }
        
        const coordEl = document.getElementById('coordinatesDisplay');
        if (coordEl) {
            coordEl.textContent = `HDG: ${yawDegrees.toFixed(0)}° | X: ${this.ship.position.x.toFixed(1)} Y: ${this.ship.position.y.toFixed(1)}`;
        }
    },

    showScreen: function(id) {
        const screens = [
            'mainMenu',
            'gameUI',
            'shop',
            'achievements',
            'dailyChallenge',
            'bossRush',
            'specialWeapons',
            'spaceStation',
            'environmentalHazards'
        ];
        
        screens.forEach(screen => {
            const el = document.getElementById(screen);
            if (el) {
                if (screen === 'mainMenu') {
                    el.style.display = 'none';
                } else {
                    el.style.display = 'none';
                }
            }
        });

        const target = document.getElementById(id);
        if (target) {
            if (id === 'mainMenu') {
                target.style.display = 'flex';
            } else if (id === 'gameUI') {
                target.style.display = 'block';
                setTimeout(() => {
                    if (this.renderer && this.renderer.domElement) {
                        this.renderer.domElement.focus();
                        console.log('Canvas focused for keyboard input');
                    }
                }, 100);
            } else {
                target.style.display = 'block';
            }
            this.currentScreen = id;
            console.log(`Switched to screen: ${id}`);
        } else {
            console.error(`Screen not found: ${id}`);
        }
    },

    bindUI: function() {
        const startBtn = document.getElementById('startGame');
        const shopBtn = document.getElementById('openShop');
        const achievBtn = document.getElementById('viewAchievements');
        const dailyBtn = document.getElementById('dailyChallenge');
        const bossBtn = document.getElementById('bossRush');

        const closeShopBtn = document.getElementById('closeShop');
        const closeBossBtn = document.getElementById('closeBossRush');
        const startBossBtn = document.getElementById('startBossRush');
        const leaveBtn = document.getElementById('leaveStation');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('Start Game clicked');
                this.showScreen('gameUI');
            });
        }

        if (shopBtn) {
            shopBtn.addEventListener('click', () => {
                console.log('Open Shop clicked');
                this.showScreen('shop');
            });
        }

        if (achievBtn) {
            achievBtn.addEventListener('click', () => {
                console.log('View Achievements clicked');
                this.showScreen('achievements');
            });
        }

        if (dailyBtn) {
            dailyBtn.addEventListener('click', () => {
                console.log('Daily Challenge clicked');
                this.showScreen('dailyChallenge');
            });
        }

        if (bossBtn) {
            bossBtn.addEventListener('click', () => {
                console.log('Boss Rush clicked');
                this.showScreen('bossRush');
            });
        }

        if (closeShopBtn) {
            closeShopBtn.addEventListener('click', () => {
                this.showScreen('mainMenu');
            });
        }

        if (closeBossBtn) {
            closeBossBtn.addEventListener('click', () => {
                this.showScreen('mainMenu');
            });
        }

        if (startBossBtn) {
            startBossBtn.addEventListener('click', () => {
                console.log('Starting Boss Rush...');
                this.showScreen('gameUI');
            });
        }

        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                this.showScreen('gameUI');
            });
        }

        const shopStuff = document.querySelectorAll('.shopItem');
        shopStuff.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.getAttribute('data-item');
                console.log(`Shop item clicked: ${type}`);
            });
        });

        const stationStuff = document.querySelectorAll('.stationService');
        stationStuff.forEach(service => {
            service.addEventListener('click', () => {
                const type = service.getAttribute('data-service');
                console.log(`Station service clicked: ${type}`);
            });
        });

        // Add export button functionality
        this.addExportBtn();
    },

    addExportBtn: function() {
        console.log('Creating export button...');
        
        // Create export button
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Ship Model';
        exportBtn.id = 'exportShipBtn';
        exportBtn.style.position = 'fixed';
        exportBtn.style.top = '20px';
        exportBtn.style.right = '20px';
        exportBtn.style.zIndex = '9999';
        exportBtn.style.padding = '12px 20px';
        exportBtn.style.backgroundColor = '#4a90e2';
        exportBtn.style.color = 'white';
        exportBtn.style.border = '2px solid #2c5aa0';
        exportBtn.style.borderRadius = '8px';
        exportBtn.style.cursor = 'pointer';
        exportBtn.style.fontFamily = 'Arial, sans-serif';
        exportBtn.style.fontSize = '16px';
        exportBtn.style.fontWeight = 'bold';
        exportBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        exportBtn.style.transition = 'all 0.3s ease';
        
        // Hover effects
        exportBtn.addEventListener('mouseenter', () => {
            exportBtn.style.backgroundColor = '#357abd';
            exportBtn.style.transform = 'translateY(-2px)';
        });
        
        exportBtn.addEventListener('mouseleave', () => {
            exportBtn.style.backgroundColor = '#4a90e2';
            exportBtn.style.transform = 'translateY(0)';
        });
        
        exportBtn.addEventListener('click', () => {
            console.log('Export button clicked!');
            this.exportShipModel();
        });
        
        document.body.appendChild(exportBtn);
        console.log('Export button added to page');
        
        // Double check it's visible
        setTimeout(() => {
            const btn = document.getElementById('exportShipBtn');
            if (btn) {
                console.log('Export button confirmed visible');
            } else {
                console.error('Export button not found after creation');
            }
        }, 1000);
    },

    exportShipModel: function() {
        if (!this.ship) {
            console.error('Ship not found');
            return;
        }

        // Create a clean copy of the ship for export (without animations/effects)
        const exportShip = this.ship.clone();
        
        // Reset any animated properties to default state
        exportShip.rotation.set(0, 0, 0);
        exportShip.position.set(0, 0, 0);
        
        // Clean up animated children (reset scales, rotations, etc.)
        exportShip.children.forEach(child => {
            if (child.userData && child.userData.type === 'thrust') {
                child.scale.set(1, 1, 1);
                child.material.opacity = 0.8;
            }
            if (child.userData && child.userData.type === 'blinky') {
                // Reset to base orange color
                child.material.color.setHex(0xff6600);
            }
            if (child.userData && child.userData.type === 'nav') {
                // Reset to base green color
                child.material.color.setHex(0x00aa44);
            }
        });

        // Use GLTFExporter if available, otherwise fall back to OBJ
        if (typeof THREE.GLTFExporter !== 'undefined') {
            this.exportAsGLTF(exportShip);
        } else {
            // Try to load GLTFExporter dynamically
            this.loadGLTFExporter().then(() => {
                this.exportAsGLTF(exportShip);
            }).catch(() => {
                console.warn('GLTF Exporter not available, trying OBJ export');
                this.exportAsOBJ(exportShip);
            });
        }
    },

    loadGLTFExporter: function() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/exporters/GLTFExporter.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    exportAsGLTF: function(shipModel) {
        const exporter = new THREE.GLTFExporter();
        
        const options = {
            binary: false,
            includeCustomExtensions: false
        };
        
        exporter.parse(shipModel, (result) => {
            const output = JSON.stringify(result, null, 2);
            this.downloadFile(output, 'spaceship.gltf', 'application/json');
            console.log('Ship exported as GLTF');
        }, (error) => {
            console.error('Error exporting GLTF:', error);
        }, options);
    },

    exportAsOBJ: function(shipModel) {
        // Simple OBJ export fallback
        let objData = '# Spaceship Model\n';
        let vertexIndex = 1;
        
        shipModel.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const geo = child.geometry;
                const pos = geo.attributes.position;
                
                if (pos) {
                    // Export vertices
                    for (let i = 0; i < pos.count; i++) {
                        const x = pos.getX(i);
                        const y = pos.getY(i);
                        const z = pos.getZ(i);
                        objData += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
                    }
                    
                    // Export faces (simple triangulation)
                    const indexAttr = geo.index;
                    if (indexAttr) {
                        for (let i = 0; i < indexAttr.count; i += 3) {
                            const a = indexAttr.getX(i) + vertexIndex;
                            const b = indexAttr.getX(i + 1) + vertexIndex;
                            const c = indexAttr.getX(i + 2) + vertexIndex;
                            objData += `f ${a} ${b} ${c}\n`;
                        }
                    }
                    
                    vertexIndex += pos.count;
                }
            }
        });
        
        this.downloadFile(objData, 'spaceship.obj', 'text/plain');
        console.log('Ship exported as OBJ');
    },

    downloadFile: function(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}; 