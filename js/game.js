/* ==========================================================================
   DUNGEON KNIGHT - MOTOR PRINCIPAL DEL JUEGO (game.js)
   ========================================================================== */

import { audio } from './audio.js';
import { particles } from './particles.js';
import { Knight } from './knight.js';
import { Crate, Spikes, CeilingBlade, BatEnemy, SkeletonMinion, Platform, FireTrap, SkeletonArcher } from './enemies.js';
import { SkeletonBoss } from './boss.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Elementos de la UI
        this.domStartMenu = document.getElementById('start-menu');
        this.domGameOver = document.getElementById('game-over-screen');
        this.domVictory = document.getElementById('victory-screen');
        this.domPause = document.getElementById('pause-screen');
        this.domBonfireScreen = document.getElementById('bonfire-screen');
        this.domBonfirePrompt = document.getElementById('bonfire-prompt');
        this.domInventoryPopup = document.getElementById('inventory-popup');
        this.domHud = document.getElementById('hud');
        this.domBossHud = document.getElementById('boss-hud');
        this.domGamepad = document.getElementById('mobile-gamepad');

        this.shopCoins = document.getElementById('shop-coins');
        this.shopHp = document.getElementById('shop-hp');
        this.inventoryBadge = document.getElementById('inventory-badge');
        this.slotPotionQty = document.getElementById('slot-potion-qty');

        // Botones
        this.btnStart = document.getElementById('btn-start');
        this.btnRespawn = document.getElementById('btn-respawn');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnResume = document.getElementById('btn-resume');
        this.btnMute = document.getElementById('btn-mute');
        this.btnPauseRestart = document.getElementById('btn-pause-restart');
        this.btnPauseMenu = document.getElementById('btn-pause-menu');
        this.btnPauseHud = document.getElementById('btn-pause-hud');
        this.btnInventoryHud = document.getElementById('btn-inventory-hud');
        this.btnPotionHud = document.getElementById('btn-potion-hud');
        this.slotPotion = document.getElementById('slot-potion');
        
        // Botones de la tienda
        this.btnShopRest = document.getElementById('btn-shop-rest');
        this.btnShopBuy = document.getElementById('btn-shop-buy');
        this.btnShopExit = document.getElementById('btn-shop-exit');
        this.btnInteractBonfire = document.getElementById('btn-interact-bonfire');

        this.isPaused = false;
        this.isShopOpen = false;

        // Entidades y Nivel
        this.player = null;
        this.boss = null;
        
        this.level = 1; // Nivel 1 = Pasillo, Nivel 2 = Catacumbas, Nivel 3 = Cámara del Jefe
        this.levelWidth = 2500;
        this.levelHeight = 540;
        this.floorY = 445; // Suelo firme

        // Listas de entidades activas
        this.crates = [];
        this.spikes = [];
        this.blades = [];
        this.bats = [];
        this.skeletons = [];
        this.lootItems = [];
        
        // Entidades de Nivel 2
        this.platforms = [];
        this.fireTraps = [];
        this.archers = [];
        this.arrows = [];

        // Checkpoint avanzado estilo Souls-like
        this.latestLitBonfire = {
            level: 1,
            x: 80,
            y: 445 - 58,
            lit: false
        };

        // Hoguera activa
        this.bonfire = {
            x: 2280,
            y: 380,
            width: 48,
            height: 65,
            lit: false,
            animTime: 0
        };

        // Estado de entrada (teclado y móvil)
        this.input = {
            left: false,
            right: false,
            jump: false,
            down: false,
            attack: false,
            block: false,
            roll: false
        };

        // Cámara y Efectos
        this.cameraX = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.freezeTimer = 0; // Hit stop

        this.state = 'menu'; // 'menu', 'playing', 'gameover', 'victory'
        this.gameTime = 0;

        // Antorchas de fondo (detalles estéticos)
        this.torches = [
            { x: 150, y: 220 },
            { x: 550, y: 220 },
            { x: 950, y: 220 },
            { x: 1350, y: 220 },
            { x: 1750, y: 220 },
            { x: 2150, y: 220 }
        ];

        this.setupEventListeners();
        this.checkMobile();
        
        // Iniciar Bucle
        this.lastTime = 0;
        requestAnimationFrame((time) => this.loop(time));
    }

    // Comprobar si el jugador usa un móvil para mostrar el Gamepad táctil
    checkMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || (window.innerWidth <= 1024);
        if (isMobile) {
            this.domGamepad.classList.remove('hidden');
        }
    }

    setupEventListeners() {
        // --- Controles de Teclado ---
        window.addEventListener('keydown', (e) => {
            // Tecla de Pausa (Escape o P) durante el juego
            if ((e.code === 'Escape' || e.code === 'KeyP') && this.state === 'playing') {
                e.preventDefault();
                if (this.isShopOpen) {
                    this.closeBonfireShop();
                } else {
                    this.togglePause();
                }
                return;
            }

            // Tecla de Inventario (I)
            if (e.code === 'KeyI' && this.state === 'playing' && !this.isPaused) {
                e.preventDefault();
                this.toggleInventory();
                return;
            }

            // Tecla de Poción rápida (Q)
            if (e.code === 'KeyQ' && this.state === 'playing' && !this.isPaused && !this.isShopOpen) {
                e.preventDefault();
                this.quickUsePotion();
                return;
            }

            // Tecla de interactuar con la hoguera (E)
            if (e.code === 'KeyE' && this.state === 'playing' && !this.isPaused) {
                e.preventDefault();
                this.handleBonfireInteraction();
                return;
            }

            // Tecla de lanzar gancho (F)
            if (e.code === 'KeyF' && this.state === 'playing' && !this.isPaused && !this.isShopOpen) {
                e.preventDefault();
                this.player.fireHook(this.platforms);
                return;
            }

            if (this.state !== 'playing' || this.isPaused || this.isShopOpen) return;
            
            // Prevenir scroll
            if (['Space', 'ArrowUp', 'ArrowDown', 'KeyS', 'KeyW'].includes(e.code)) {
                e.preventDefault();
            }

            switch (e.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    this.input.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.input.right = true;
                    break;
                case 'KeyW':
                case 'Space':
                case 'ArrowUp':
                    this.input.jump = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.input.down = true;
                    break;
                case 'KeyJ':
                    this.input.attack = true;
                    break;
                case 'KeyK':
                    this.input.block = true;
                    break;
                case 'KeyL':
                    this.input.roll = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    this.input.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.input.right = false;
                    break;
                case 'KeyW':
                case 'Space':
                case 'ArrowUp':
                    this.input.jump = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.input.down = false;
                    break;
                case 'KeyJ':
                    this.input.attack = false;
                    break;
                case 'KeyK':
                    this.input.block = false;
                    break;
                case 'KeyL':
                    this.input.roll = false;
                    break;
            }
        });

        // Click en canvas también ataca si no estamos cubiertos
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state === 'playing' && !this.isPaused) {
                this.input.attack = true;
            }
        });
        this.canvas.addEventListener('mouseup', () => {
            this.input.attack = false;
        });

        // --- Controles Táctiles Móviles ---
        const bindButton = (elementId, inputProp) => {
            const btn = document.getElementById(elementId);
            if (!btn) return;
            
            const startPress = (e) => {
                e.preventDefault();
                this.input[inputProp] = true;
            };
            const endPress = (e) => {
                e.preventDefault();
                this.input[inputProp] = false;
            };

            btn.addEventListener('touchstart', startPress);
            btn.addEventListener('touchend', endPress);
            btn.addEventListener('mousedown', startPress);
            btn.addEventListener('mouseup', endPress);
        };

        bindButton('btn-left', 'left');
        bindButton('btn-right', 'right');
        bindButton('btn-jump', 'jump');
        bindButton('btn-crouch', 'down');
        bindButton('btn-attack', 'attack');
        bindButton('btn-block', 'block');
        bindButton('btn-roll', 'roll');

        // Botón de Gancho Móvil
        const btnHook = document.getElementById('btn-hook');
        if (btnHook) {
            const triggerHook = (e) => {
                e.preventDefault();
                if (this.state === 'playing' && !this.isPaused && !this.isShopOpen) {
                    this.player.fireHook(this.platforms);
                }
            };
            btnHook.addEventListener('touchstart', triggerHook);
            btnHook.addEventListener('mousedown', triggerHook);
        }

        // --- Botones de Menú ---
        this.btnStart.addEventListener('click', () => this.startGame());
        this.btnRespawn.addEventListener('click', () => this.respawnPlayer());
        this.btnRestart.addEventListener('click', () => this.restartGame());
        this.btnPauseRestart.addEventListener('click', () => this.restartGame());
        this.btnPauseMenu.addEventListener('click', () => this.goToMainMenu());

        // Botones de Pausa
        this.btnPauseHud.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el click se interprete como ataque
            this.togglePause();
        });
        this.btnResume.addEventListener('click', () => this.togglePause());
        this.btnMute.addEventListener('click', () => this.toggleMute());
        // Botones de la Tienda de la Hoguera
        this.btnInteractBonfire.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleBonfireInteraction();
        });
        this.btnShopRest.addEventListener('click', () => this.restAtBonfire());
        this.btnShopBuy.addEventListener('click', () => this.buyPotionFromShop());
        this.btnShopExit.addEventListener('click', () => this.closeBonfireShop());

        // Botones de Inventario (Bulto)
        this.btnInventoryHud.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleInventory();
        });
        this.btnPotionHud.addEventListener('click', (e) => {
            e.stopPropagation();
            this.quickUsePotion();
        });
        this.slotPotion.addEventListener('click', () => {
            this.quickUsePotion();
        });
    }

    startGame() {
        audio.init();
        audio.startMusic();
        
        this.latestLitBonfire = {
            level: 1,
            x: 80,
            y: 445 - 58,
            lit: false
        };

        this.player = new Knight(80, this.floorY - 60);
        this.level = 1;
        this.gameTime = 0;
        this.isPaused = false;
        this.isShopOpen = false;
        this.domPause.classList.add('hidden');
        this.domGameOver.classList.add('hidden');
        this.domVictory.classList.add('hidden');
        this.domBonfireScreen.classList.add('hidden');
        this.domBonfirePrompt.classList.add('hidden');
        this.domInventoryPopup.classList.add('hidden');
        
        // Sincronizar texto de botón de silenciar en pausa
        this.btnMute.innerText = audio.isMuted ? "SONIDO: OFF" : "SONIDO: ON";

        this.initLevel(1);
        
        this.state = 'playing';
        this.domStartMenu.classList.add('hidden');
        this.domHud.classList.remove('hidden');
    }

    initLevel(levelNum) {
        this.level = levelNum;
        
        // Limpiar entidades antiguas
        this.crates = [];
        this.spikes = [];
        this.blades = [];
        this.bats = [];
        this.skeletons = [];
        this.lootItems = [];
        this.platforms = [];
        this.fireTraps = [];
        this.archers = [];
        this.arrows = [];
        particles.clear();
        
        if (levelNum === 1) {
            // Inicializar Nivel 1 (El Pasillo con plataformas, obstáculos y cofres)
            this.levelWidth = 2500;
            
            // Cajas Rompibles (Crates) colocación estratégica
            this.crates.push(new Crate(250, this.floorY - 38));
            this.crates.push(new Crate(720, this.floorY - 38));
            this.crates.push(new Crate(1080, this.floorY - 38));
            this.crates.push(new Crate(1080, this.floorY - 76)); // Doble caja apilada
            this.crates.push(new Crate(1550, this.floorY - 38));
            this.crates.push(new Crate(1850, this.floorY - 38));
            
            // Obstáculos bajos (Spikes / Picos de suelo)
            this.spikes.push(new Spikes(460, this.floorY - 20, 2));
            this.spikes.push(new Spikes(900, this.floorY - 20, 3));
            this.spikes.push(new Spikes(1400, this.floorY - 20, 2));
            this.spikes.push(new Spikes(1750, this.floorY - 20, 4));

            // Obstáculos altos (CeilingBlade / Péndulo gigante gótico)
            this.blades.push(new CeilingBlade(600, 20, 260));
            this.blades.push(new CeilingBlade(1250, 20, 280));
            this.blades.push(new CeilingBlade(1650, 20, 260));
            
            // Enemigos voladores (Murciélagos)
            this.bats.push(new BatEnemy(350, this.floorY - 90));
            this.bats.push(new BatEnemy(800, this.floorY - 110));
            this.bats.push(new BatEnemy(1350, this.floorY - 120));
            this.bats.push(new BatEnemy(1950, this.floorY - 100));

            // Enemigos terrestres (Esqueletos pequeños)
            this.skeletons.push(new SkeletonMinion(660, this.floorY - 54));
            this.skeletons.push(new SkeletonMinion(1150, this.floorY - 54));
            this.skeletons.push(new SkeletonMinion(1500, this.floorY - 54));
            this.skeletons.push(new SkeletonMinion(2050, this.floorY - 54));

            // Hoguera checkpoint Nivel 1
            this.bonfire = {
                x: 2280,
                y: 380,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 1 && this.latestLitBonfire.lit,
                animTime: 0
            };

            this.domBossHud.classList.add('hidden');
        } else if (levelNum === 2) {
            // Inicializar Nivel 2 (Las Catacumbas)
            this.levelWidth = 2200;

            // Plataformas flotantes
            this.platforms.push(new Platform(280, 340, 160)); // Bajada a 340
            this.platforms.push(new Platform(500, 210, 160)); // Bajada a 210
            this.platforms.push(new Platform(780, 290, 180));
            this.platforms.push(new Platform(1050, 180, 200));
            this.platforms.push(new Platform(1350, 280, 160));
            this.platforms.push(new Platform(1600, 190, 180));

            // Cajas Rompibles
            this.crates.push(new Crate(320, 302)); // Plataforma 1
            this.crates.push(new Crate(540, 172)); // Plataforma 2
            this.crates.push(new Crate(820, 252)); // Plataforma 3
            this.crates.push(new Crate(1400, 242)); // Plataforma 5
            this.crates.push(new Crate(100, this.floorY - 38)); // Suelo
            this.crates.push(new Crate(1300, this.floorY - 38)); // Suelo

            // Trampas de Fuego
            this.fireTraps.push(new FireTrap(450, this.floorY - 16));
            this.fireTraps.push(new FireTrap(950, this.floorY - 16));
            this.fireTraps.push(new FireTrap(1500, this.floorY - 16));

            // Esqueletos Arqueros
            this.archers.push(new SkeletonArcher(520, 210 - 54)); // Plataforma 2
            this.archers.push(new SkeletonArcher(1080, 180 - 54)); // Plataforma 4
            this.archers.push(new SkeletonArcher(1620, 190 - 54)); // Plataforma 6
            this.archers.push(new SkeletonArcher(900, this.floorY - 54)); // Suelo

            // Enemigos voladores (Murciélagos)
            this.bats.push(new BatEnemy(400, 120));
            this.bats.push(new BatEnemy(850, 150));
            this.bats.push(new BatEnemy(1200, 110));
            this.bats.push(new BatEnemy(1700, 130));

            // Esqueletos normales patrullando
            this.skeletons.push(new SkeletonMinion(680, this.floorY - 54));
            this.skeletons.push(new SkeletonMinion(1400, this.floorY - 54));

            // Picos
            this.spikes.push(new Spikes(700, this.floorY - 20, 2));
            this.spikes.push(new Spikes(1650, this.floorY - 20, 3));

            // Hoguera Checkpoint Nivel 2
            this.bonfire = {
                x: 1950,
                y: 380,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 2 && this.latestLitBonfire.lit,
                animTime: 0
            };

            this.domBossHud.classList.add('hidden');
        } else {
            // Inicializar Nivel 3 (Cámara del Jefe gigante)
            this.levelWidth = 960;
            
            this.boss = new SkeletonBoss(650, this.floorY - 135);
            
            // Cajas de apoyo en las esquinas de la arena
            this.crates.push(new Crate(50, this.floorY - 38));
            this.crates.push(new Crate(870, this.floorY - 38));

            this.bonfire = null;

            this.domBossHud.classList.remove('hidden');
            this.updateBossHud();
        }
    }

    respawnPlayer() {
        this.state = 'playing';
        this.domGameOver.classList.add('hidden');
        
        // Resetear estadísticas del caballero excepto las acumuladas de cajas/monedas
        this.player.hp = this.player.maxHp;
        this.player.stamina = this.player.maxStamina;
        this.player.isRolling = false;
        this.player.isAttacking = false;
        this.player.isCrouching = false;
        this.player.height = this.player.baseHeight;
        this.player.vx = 0;
        this.player.vy = 0;

        if (this.latestLitBonfire.lit) {
            // Cargar el nivel de la última hoguera encendida
            this.initLevel(this.latestLitBonfire.level);
            // Reaparecer al lado de esa hoguera
            this.player.x = this.latestLitBonfire.x - 30;
            this.player.y = this.floorY - this.player.height;
        } else {
            // Al inicio del juego
            this.player.x = 80;
            this.player.y = this.floorY - this.player.height;
            this.initLevel(1);
        }
    }

    restartGame() {
        this.domVictory.classList.add('hidden');
        this.startGame();
    }

    goToMainMenu() {
        this.state = 'menu';
        this.isPaused = false;
        this.isShopOpen = false;
        
        audio.stopMusic();
        
        this.domPause.classList.add('hidden');
        this.domGameOver.classList.add('hidden');
        this.domVictory.classList.add('hidden');
        this.domBonfireScreen.classList.add('hidden');
        this.domBonfirePrompt.classList.add('hidden');
        this.domInventoryPopup.classList.add('hidden');
        this.domHud.classList.add('hidden');
        
        this.domStartMenu.classList.remove('hidden');
    }

    triggerGameOver() {
        this.state = 'gameover';
        
        // Rellenar estadísticas de fin
        document.getElementById('stat-coins').innerText = this.player.coins;
        document.getElementById('stat-crates').innerText = this.player.statsCratesBroken;
        document.getElementById('stat-enemies').innerText = this.player.statsEnemiesKilled;

        this.domGameOver.classList.remove('hidden');
    }

    triggerVictory() {
        this.state = 'victory';
        audio.stopMusic();
        audio.playWin();

        // Calcular Rango
        const seconds = Math.floor(this.gameTime / 60);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        document.getElementById('stat-time').innerText = timeStr;
        document.getElementById('stat-victory-coins').innerText = this.player.coins;
        document.getElementById('stat-blocked').innerText = Math.round(this.player.statsDamageBlocked);

        this.domVictory.classList.remove('hidden');
    }

    // Bucle Principal del Juego (Game Loop)
    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        if (this.state === 'playing' && !this.isPaused && !this.isShopOpen) {
            this.update();
        }
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    // ==========================================================================
    // ACTUALIZACIÓN DE FÍSICAS Y MECÁNICAS
    // ==========================================================================
    update() {
        this.gameTime++;

        // 1. Manejo del Hit Stop (Micro pausa al impactar para ganar peso visual)
        if (this.freezeTimer > 0) {
            this.freezeTimer--;
            return;
        }

        // 2. Actualizar Jugador
        this.player.update(this.input);

        // Sacudida de pantalla (Screen Shake) gatillada por jugador
        if (this.player.shouldTriggerShake) {
            this.shakeTimer = 18;
            this.shakeIntensity = 6;
            this.player.shouldTriggerShake = false;
        }

        // Límites de nivel para el jugador
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.levelWidth) {
            if (this.level === 1) {
                // Ir al Nivel 2 (Las Catacumbas)
                this.initLevel(2);
                this.player.x = 80;
                this.player.y = this.floorY - this.player.height;
            } else if (this.level === 2) {
                // Ir al Nivel 3 (Cámara del Jefe)
                this.initLevel(3);
                this.player.x = 80;
                this.player.y = this.floorY - this.player.height;
            } else {
                this.player.x = this.levelWidth - this.player.width;
            }
        }

        // Colisión con suelo firme
        if (this.player.y + this.player.height >= this.floorY) {
            this.player.y = this.floorY - this.player.height;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        // --- Colisiones con Plataformas Flotantes (Nivel 2) ---
        if (this.level === 2) {
            this.platforms.forEach(plat => {
                // Si el jugador está bajando de la plataforma, ignorar colisiones
                if (this.player.platformDropTimer > 0) return;

                const playerBottom = this.player.y + this.player.height;
                if (this.player.x + this.player.width > plat.x &&
                    this.player.x < plat.x + plat.width &&
                    playerBottom >= plat.y &&
                    playerBottom - this.player.vy <= plat.y + 8 &&
                    this.player.vy >= 0) {
                    
                    // Si el jugador presiona agacharse/abajo mientras está en cualquier parte de la plataforma, bajar de ella
                    if (this.input.down) {
                        this.player.platformDropTimer = 15; // Ignorar colisión por 15 frames para bajar libremente
                        this.player.y += 12; // Mover al caballero por debajo del límite de la plataforma
                        this.player.isGrounded = false;
                        this.player.vy = 2.0; // Impulso inicial de caída
                        return;
                    }

                    this.player.y = plat.y - this.player.height;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                }
            });

            // Colisiones de enemigos y arqueros con plataformas
            const checkEntityPlatformCollision = (entity) => {
                this.platforms.forEach(plat => {
                    const bottom = entity.y + entity.height;
                    if (entity.x + entity.width > plat.x &&
                        entity.x < plat.x + plat.width &&
                        bottom >= plat.y &&
                        bottom - entity.vy <= plat.y + 8 &&
                        entity.vy >= 0) {
                        entity.y = plat.y - entity.height;
                        entity.vy = 0;
                        
                        if (entity instanceof SkeletonMinion) {
                            if (entity.x < plat.x || entity.x + entity.width > plat.x + plat.width) {
                                entity.vx = -entity.vx;
                            }
                        }
                    }
                });
            };

            this.skeletons.forEach(s => checkEntityPlatformCollision(s));
            this.archers.forEach(a => checkEntityPlatformCollision(a));
            this.crates.forEach(c => {
                // Permitir que las cajas se asienten en plataformas
                this.platforms.forEach(plat => {
                    const bottom = c.y + c.height;
                    if (c.x + c.width > plat.x && c.x < plat.x + plat.width && bottom >= plat.y && bottom <= plat.y + 10) {
                        c.y = plat.y - c.height;
                    }
                });
            });
        }

        // 3. Actualizar Enemigos y Obstáculos del Camino (Nivel 1 y 2)
        if (this.level === 1 || this.level === 2) {
            // Actualizar Cuchillas (Solo Nivel 1)
            if (this.level === 1) {
                this.blades.forEach(b => {
                    b.update();
                    // Colisión letal
                    if (b.checkCollision(this.player)) {
                        this.player.takeDamage(b.damage, (this.player.x + this.player.width/2 > b.x + b.bladeRadius ? 4.5 : -4.5), b.x + b.bladeRadius);
                    }
                });
            }

            // Actualizar Murciélagos
            this.bats.forEach(bat => {
                bat.update();
                // Colisión cuerpo a cuerpo
                if (bat.active && this.checkAABBCollision(this.player, bat)) {
                    this.player.takeDamage(bat.damage, (this.player.x + this.player.width/2 > bat.x + bat.width/2 ? 3.0 : -3.0), bat.x + bat.width/2);
                }
            });

            // Actualizar Esqueletos pequeños
            this.skeletons.forEach(s => {
                s.update();
                
                // Colisión con suelo
                if (s.y + s.height >= this.floorY) {
                    s.y = this.floorY - s.height;
                    s.vy = 0;
                }

                // Invertir patrullaje en los bordes de la pantalla o límites
                if (s.x < 100 || s.x > this.levelWidth - 300) {
                    s.vx = -s.vx;
                }

                // Colisión con el jugador
                if (s.active && this.checkAABBCollision(this.player, s)) {
                    this.player.takeDamage(s.damage, (this.player.x + this.player.width/2 > s.x + s.width/2 ? 4.5 : -4.5), s.x + s.width/2);
                }
            });

            // Actualizar Picos (Spikes)
            this.spikes.forEach(s => {
                if (this.checkAABBCollision(this.player, s)) {
                    this.player.takeDamage(s.damage, (this.player.x + this.player.width/2 > s.x + s.width/2 ? 4.0 : -4.0), s.x + s.width/2);
                }
            });

            // Actualizar la Hoguera (Checkpoint)
            if (this.bonfire) {
                this.bonfire.animTime += 0.12;
                const distToHoguera = Math.abs((this.player.x + this.player.width/2) - (this.bonfire.x + this.bonfire.width/2));
                
                if (distToHoguera < 75) {
                    // Mostrar botón flotante en HUD para interactuar
                    this.domBonfirePrompt.classList.remove('hidden');

                    // Si pasamos cerca y no está encendida, se enciende por primera vez
                    if (!this.bonfire.lit) {
                        this.bonfire.lit = true;
                        this.latestLitBonfire.level = this.level;
                        this.latestLitBonfire.x = this.bonfire.x;
                        this.latestLitBonfire.y = this.floorY - this.player.height;
                        this.latestLitBonfire.lit = true;

                        audio.playBonfire();
                        this.shakeTimer = 15;
                        this.shakeIntensity = 2;
                        particles.spawnCollectGlow(this.bonfire.x + this.bonfire.width/2, this.bonfire.y + 40, '#ff6600', 25);
                    }
                } else {
                    // Ocultar si estamos lejos
                    if (this.domBonfirePrompt.classList.contains('hidden') === false && distToHoguera >= 75) {
                        this.domBonfirePrompt.classList.add('hidden');
                    }
                    if (this.isShopOpen) {
                        this.closeBonfireShop();
                    }
                }

                if (this.bonfire.lit) {
                    // Emitir partículas de fuego
                    particles.spawnFire(this.bonfire.x + this.bonfire.width/2, this.bonfire.y + 42, 1.2, true);
                }
            }
        }

        // --- Actualizar Trampas, Arqueros y Flechas (Nivel 2) ---
        if (this.level === 2) {
            // Trampas de Fuego
            this.fireTraps.forEach(ft => ft.update(this.player));

            // Esqueletos Arqueros
            this.archers.forEach(a => {
                a.update(this.player, this.arrows);
                
                // Colisión cuerpo a cuerpo con el jugador
                if (a.active && this.checkAABBCollision(this.player, a)) {
                    this.player.takeDamage(a.damage, (this.player.x + this.player.width/2 > a.x + a.width/2 ? 3.0 : -3.0), a.x + a.width/2);
                }
                
                // Colisión básica de suelo
                if (a.y + a.height >= this.floorY) {
                    a.y = this.floorY - a.height;
                    a.vy = 0;
                }
            });

            // Proyectiles de Flechas
            for (let i = this.arrows.length - 1; i >= 0; i--) {
                const arrow = this.arrows[i];
                arrow.update();

                // Colisión con el jugador (daño y retroceso)
                if (arrow.active && this.checkAABBCollision(this.player, arrow)) {
                    this.player.takeDamage(arrow.damage, (arrow.vx > 0 ? 3.5 : -3.5), arrow.x);
                    arrow.active = false;
                }

                // Chocar con cajas
                this.crates.forEach(c => {
                    if (c.active && this.checkAABBCollision(arrow, c)) {
                        arrow.active = false;
                    }
                });

                // Descartar si sale de pantalla o inactiva
                if (arrow.x < 0 || arrow.x > this.levelWidth || !arrow.active) {
                    this.arrows.splice(i, 1);
                }
            }
        }

        // 4. Actualizar el Jefe Final Gigante (Nivel 3 únicamente)
        if (this.level === 3 && this.boss) {
            this.boss.update(this.player, 0, this.levelWidth, this.floorY);

            // Sacudida de pantalla gatillada por golpes del jefe
            if (this.boss.shouldTriggerShake) {
                this.shakeTimer = 22;
                this.shakeIntensity = 8;
                this.boss.shouldTriggerShake = false;
                this.freezeTimer = 3; // hitstop
            }

            // Colisión directa del cuerpo del jefe
            if (this.boss.hp > 0 && this.checkAABBCollision(this.player, this.boss)) {
                this.player.takeDamage(12, (this.player.x + this.player.width/2 > this.boss.x + this.boss.width/2 ? 5.0 : -5.0), this.boss.x + this.boss.width/2);
            }

            // Actualizar proyectiles del jefe
            for (let i = this.boss.spawnedProjectiles.length - 1; i >= 0; i--) {
                const proj = this.boss.spawnedProjectiles[i];
                proj.update();
                
                // Colisión con jugador
                if (proj.active && this.checkAABBCollision(this.player, proj)) {
                    this.player.takeDamage(proj.damage, (this.player.x + this.player.width/2 > proj.x + proj.width/2 ? 3.5 : -3.5), proj.x + proj.width/2);
                    proj.active = false;
                }

                if (!proj.active) {
                    this.boss.spawnedProjectiles.splice(i, 1);
                }
            }

            // Actualizar ondas de choque sísmicas
            for (let i = this.boss.spawnedShockwaves.length - 1; i >= 0; i--) {
                const shock = this.boss.spawnedShockwaves[i];
                shock.update();

                // Colisión con jugador
                if (shock.active && this.checkAABBCollision(this.player, shock)) {
                    this.player.takeDamage(shock.damage, (shock.vx > 0 ? 5.5 : -5.5), shock.x);
                    shock.active = false;
                }

                if (!shock.active) {
                    this.boss.spawnedShockwaves.splice(i, 1);
                }
            }

            // Si el jefe es derrotado
            if (this.boss.hp <= 0 && this.boss.state === 'dead' && this.boss.vy === 0) {
                // Cámara lenta al final y victoria
                setTimeout(() => this.triggerVictory(), 2000);
                this.boss = null; // Detener bucle de boss
            }

            this.updateBossHud();
        }

        // 5. Actualizar Cajas Rompibles (Colisiones físicas básicas para subirse a ellas)
        this.crates.forEach(c => {
            if (!c.active) return;

            // Evitar que el jugador atraviese la caja horizontalmente
            if (this.checkAABBCollision(this.player, c)) {
                // Determinar lado de colisión
                const pBottom = this.player.y + this.player.height;
                const cBottom = c.y + c.height;
                
                // Si cae arriba de la caja
                if (pBottom - this.player.vy <= c.y + 10 && this.player.vy > 0) {
                    this.player.y = c.y - this.player.height;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                } else {
                    // Empuje lateral
                    if (this.player.x + this.player.width / 2 < c.x + c.width / 2) {
                        this.player.x = c.x - this.player.width;
                    } else {
                        this.player.x = c.x + c.width;
                    }
                }
            }

            // Esqueletos rebotan en las cajas
            this.skeletons.forEach(s => {
                if (s.active && this.checkAABBCollision(s, c)) {
                    s.vx = -s.vx;
                }
            });
        });

        // 6. DETECCIÓN DE ATAQUES (Ataque con Espada del Caballero)
        const attackBox = this.player.getAttackHitbox();
        if (attackBox) {
            // Atacar Cajas Rompibles
            this.crates.forEach(c => {
                if (c.active && !this.player.hitTargets.includes(c) && this.checkAABBCollision(attackBox, c)) {
                    this.player.hitTargets.push(c);
                    const loot = c.takeDamage();
                    this.player.statsCratesBroken++;
                    this.freezeTimer = 5; // hit stop
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar Murciélagos
            this.bats.forEach(b => {
                if (b.active && !this.player.hitTargets.includes(b) && this.checkAABBCollision(attackBox, b)) {
                    this.player.hitTargets.push(b);
                    const loot = b.takeDamage();
                    this.player.statsEnemiesKilled++;
                    this.freezeTimer = 4;
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar Esqueletos Pequeños
            this.skeletons.forEach(s => {
                if (s.active && !this.player.hitTargets.includes(s) && this.checkAABBCollision(attackBox, s)) {
                    this.player.hitTargets.push(s);
                    const loot = s.takeDamage(30); // Daño directo con espada
                    if (s.hp <= 0) this.player.statsEnemiesKilled++;
                    this.freezeTimer = 6;
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar Esqueletos Arqueros (Nivel 2)
            this.archers.forEach(a => {
                if (a.active && !this.player.hitTargets.includes(a) && this.checkAABBCollision(attackBox, a)) {
                    this.player.hitTargets.push(a);
                    const loot = a.takeDamage(30);
                    if (a.hp <= 0) this.player.statsEnemiesKilled++;
                    this.freezeTimer = 6;
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar al Jefe Gigante (Nivel 3)
            if (this.level === 3 && this.boss && this.boss.hp > 0 && !this.player.hitTargets.includes(this.boss)) {
                if (this.checkAABBCollision(attackBox, this.boss)) {
                    this.player.hitTargets.push(this.boss);
                    this.boss.takeDamage(15);
                    this.freezeTimer = 7;
                }
            }
        }

        // 7. Actualizar Ítems del Suelo (Monedas/Curas que caen)
        // Caja de colisión virtual para recoger monedas (siempre usa la altura base completa y se asegura de tocar el suelo si el jugador está en el suelo o plataforma)
        const virtualPlayerBox = {
            x: this.player.x,
            y: this.player.y - 15,
            width: this.player.width,
            height: this.player.baseHeight + 25
        };

        for (let i = this.lootItems.length - 1; i >= 0; i--) {
            const item = this.lootItems[i];
            item.update(this.floorY);

            // Colisión / Recolectar por el caballero
            if (this.checkAABBCollision(virtualPlayerBox, item)) {
                if (item.type === 'coin') {
                    this.player.addCoin();
                } else if (item.type === 'heart') {
                    this.player.heal(25);
                }
                item.life = 0; // Marcar eliminado
            }

            if (item.life <= 0) {
                this.lootItems.splice(i, 1);
            }
        }

        // 8. Actualizar Partículas
        particles.update();

        // Torches emitir fuego de fondo
        this.torches.forEach(t => {
            if (t.x < this.cameraX + 960 && t.x > this.cameraX - 100) {
                particles.spawnFire(t.x, t.y, 0.7);
            }
        });

        // 9. Actualizar Cámara de Seguimiento (Smooth follow)
        const targetCamX = this.player.x - 960 * 0.35; // Mantener héroe a la izquierda del centro
        this.cameraX = this.cameraX * 0.9 + targetCamX * 0.1;
        
        // Limitar cámara a las dimensiones del nivel
        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.cameraX));

        // 10. Actualizar Interfaz (HUD)
        this.updateHud();

        // 11. Manejar Muerte del Héroe
        if (this.player.hp <= 0 && this.state === 'playing') {
            setTimeout(() => this.triggerGameOver(), 1500);
        }
    }

    // ==========================================================================
    // RENDERIZADO VISUAL EN EL CANVAS
    // ==========================================================================
    draw() {
        this.ctx.save();

        // Limpiar
        this.ctx.fillStyle = '#0d0c10';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sacudida de pantalla (Screen Shake)
        let dx = 0, dy = 0;
        if (this.shakeTimer > 0) {
            dx = (Math.random() - 0.5) * this.shakeIntensity;
            dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeTimer--;
        }
        this.ctx.translate(dx, dy);

        // --- RENDERIZADO CAPAS DE FONDO (Paralaje atmosférico) ---
        this.drawBackground();

        // --- APLICAR DESPLAZAMIENTO DE CÁMARA JUEGO ---
        this.ctx.translate(-Math.round(this.cameraX), 0);

        // 1. Dibujar Hoguera en Nivel 1 y 2
        if ((this.level === 1 || this.level === 2) && this.bonfire) {
            this.drawBonfire();
        }

        // 1.5. Dibujar Plataformas y Trampas del Nivel 2
        if (this.level === 2) {
            this.platforms.forEach(p => p.draw(this.ctx));
            this.fireTraps.forEach(ft => ft.draw(this.ctx));
        }

        // 2. Dibujar Obstáculos y Cajas
        this.spikes.forEach(s => s.draw(this.ctx));
        this.crates.forEach(c => c.draw(this.ctx));
        
        if (this.level === 1) {
            this.blades.forEach(b => b.draw(this.ctx));
        }

        // 3. Dibujar Enemigos
        this.bats.forEach(b => b.draw(this.ctx));
        this.skeletons.forEach(s => s.draw(this.ctx));
        
        if (this.level === 2) {
            this.archers.forEach(a => a.draw(this.ctx));
            this.arrows.forEach(arr => arr.draw(this.ctx));
        }

        // 4. Dibujar al Jefe Final Gigante (Nivel 3)
        if (this.level === 3 && this.boss) {
            // Ondas de choque sísmicas
            this.boss.spawnedShockwaves.forEach(sw => sw.draw(this.ctx));
            
            this.boss.draw(this.ctx);
            
            // Proyectiles del jefe
            this.boss.spawnedProjectiles.forEach(p => p.draw(this.ctx));
        }

        // 5. Dibujar botín tirado (Loot)
        this.lootItems.forEach(item => item.draw(this.ctx));

        // 5.5. Dibujar cadena del gancho si el caballero está colgado
        if (this.player && this.player.isHooked) {
            this.drawHookChain();
        }

        // 6. Dibujar Caballero Héroe
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // 7. Dibujar Capa Superior de Partículas (fuego, astillas, etc.)
        particles.draw(this.ctx);

        this.ctx.restore(); // Restaurar translate cámara y sacudidas
    }

    // Dibujado del Checkpoint de Hoguera
    drawBonfire() {
        const bx = this.bonfire.x;
        const by = this.bonfire.y;

        this.ctx.save();
        
        // Piedras del círculo base
        this.ctx.fillStyle = '#4a4a58';
        this.ctx.strokeStyle = '#2d2d3a';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(bx + 4, by + 50, 40, 15);
        this.ctx.strokeRect(bx + 4, by + 50, 40, 15);

        // Troncos cruzados
        this.ctx.fillStyle = '#5c3a21';
        this.ctx.fillRect(bx + 10, by + 36, 6, 20);
        this.ctx.fillRect(bx + 32, by + 36, 6, 20);
        
        this.ctx.save();
        this.ctx.translate(bx + 24, by + 46);
        this.ctx.rotate(Math.PI * 0.25);
        this.ctx.fillRect(-3, -15, 6, 30);
        this.ctx.rotate(-Math.PI * 0.5);
        this.ctx.fillRect(-3, -15, 6, 30);
        this.ctx.restore();

        // Si está encendida dibujamos espada clavada y espada ardiendo
        if (this.bonfire.lit) {
            // Espada clavada estilo Dark Souls
            this.ctx.save();
            this.ctx.translate(bx + 24, by + 34);
            this.ctx.rotate(Math.PI * 0.08);

            this.ctx.fillStyle = '#ffd700'; // Mango oro
            this.ctx.fillRect(-2, -18, 4, 6);
            this.ctx.fillRect(-6, -12, 12, 2);
            this.ctx.fillStyle = '#b0b0b0'; // Filo clavado
            this.ctx.fillRect(-2, -10, 4, 25);
            this.ctx.restore();
            
            // Fuego ardiente núcleo procedural
            const fBob = Math.sin(this.bonfire.animTime * 1.5) * 3;
            
            this.ctx.fillStyle = 'rgba(255, 128, 0, 0.45)';
            this.ctx.beginPath();
            this.ctx.arc(bx + 24, by + 34 + fBob, 16, 0, Math.PI*2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawHookChain() {
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        const hx = this.player.hookX;
        const hy = this.player.hookY;

        this.ctx.save();
        
        // 1. Dibujar línea de acero de la cadena
        this.ctx.strokeStyle = '#5a5a6a';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py);
        this.ctx.lineTo(hx, hy);
        this.ctx.stroke();

        // 2. Dibujar eslabones de cadena retro
        this.ctx.fillStyle = '#1d1d24';
        const dx = hx - px;
        const dy = hy - py;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const links = Math.floor(dist / 14);

        for (let i = 0; i <= links; i++) {
            const ratio = i / links;
            const lx = px + dx * ratio;
            const ly = py + dy * ratio;
            
            this.ctx.fillStyle = i % 2 === 0 ? '#8e8e9e' : '#5a5a6a';
            this.ctx.beginPath();
            this.ctx.arc(lx, ly, 3, 0, Math.PI*2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#111';
            this.ctx.beginPath();
            this.ctx.arc(lx, ly, 1.2, 0, Math.PI*2);
            this.ctx.fill();
        }

        // 3. Dibujar punta del gancho dorada
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(hx, hy, 5, 0, Math.PI*2);
        this.ctx.fill();

        this.ctx.restore();
    }

    // Dibujado de Fondo Atmosférico (Arcos góticos y columnas con paralaje)
    drawBackground() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Gradiente del fondo lejano
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
        if (this.level === 1) {
            bgGrad.addColorStop(0, '#06050a');
            bgGrad.addColorStop(0.5, '#120d18');
            bgGrad.addColorStop(1, '#08060c');
        } else if (this.level === 2) {
            bgGrad.addColorStop(0, '#060202');
            bgGrad.addColorStop(0.6, '#180a08');
            bgGrad.addColorStop(1, '#2c0f05'); // Catacumbas ígneas (Fuego latente abajo)
        } else {
            // Nivel 3 (Jefe) - Espectral verde oscuro
            bgGrad.addColorStop(0, '#020604');
            bgGrad.addColorStop(0.5, '#08140e');
            bgGrad.addColorStop(1, '#030806');
        }
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, w, h);

        // 2. Capa lejana (Paralaje 0.12x)
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX * 0.12), 0);
        
        if (this.level === 1) {
            this.ctx.fillStyle = 'rgba(20, 14, 26, 0.5)';
            const archWidth = 240;
            const totalArches = Math.ceil(this.levelWidth / archWidth) + 1;
            for (let i = 0; i < totalArches; i++) {
                const ax = i * archWidth;
                this.ctx.fillRect(ax + 10, 80, 20, h - 80);
                this.ctx.fillRect(ax + archWidth - 30, 80, 20, h - 80);
                this.ctx.beginPath();
                this.ctx.arc(ax + archWidth/2, 100, archWidth/2 - 20, Math.PI, 0);
                this.ctx.lineTo(ax + archWidth - 20, 80);
                this.ctx.lineTo(ax + 20, 80);
                this.ctx.closePath();
                this.ctx.fill();
            }
        } else if (this.level === 2) {
            // Estructuras de ladrillo de las catacumbas (Rojo oscuro)
            this.ctx.fillStyle = 'rgba(38, 16, 12, 0.55)';
            const columnWidth = 180;
            const totalCols = Math.ceil(this.levelWidth / columnWidth) + 1;
            for (let i = 0; i < totalCols; i++) {
                const cx = i * columnWidth;
                this.ctx.fillRect(cx + 20, 50, 35, h - 50); // Columnas medievales gruesas
                
                // Arcos apuntados de ladrillo
                this.ctx.beginPath();
                this.ctx.moveTo(cx + 20, 90);
                this.ctx.lineTo(cx + columnWidth/2, 60);
                this.ctx.lineTo(cx + columnWidth - 20, 90);
                this.ctx.closePath();
                this.ctx.fill();
            }
        } else {
            // Nivel 3 (Cámara del Jefe) - Ventanales espectrales
            this.ctx.fillStyle = 'rgba(12, 28, 20, 0.45)';
            const winWidth = 320;
            const totalWins = Math.ceil(this.levelWidth / winWidth) + 1;
            for (let i = 0; i < totalWins; i++) {
                const wx = i * winWidth;
                this.ctx.beginPath();
                this.ctx.moveTo(wx + 80, h - 80);
                this.ctx.lineTo(wx + 80, 150);
                this.ctx.quadraticCurveTo(wx + winWidth/2, 60, wx + winWidth - 80, 150);
                this.ctx.lineTo(wx + winWidth - 80, h - 80);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
        this.ctx.restore();

        // 3. Capa media de Columnas y Antorchas (Paralaje 0.45x)
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX * 0.45), 0);
        
        if (this.level === 1 || this.level === 2) {
            this.ctx.fillStyle = this.level === 1 ? '#1c1524' : '#281310';
            this.ctx.strokeStyle = this.level === 1 ? '#0d0a11' : '#140604';
            this.ctx.lineWidth = 3;

            this.torches.forEach(t => {
                // Dibujar columna de piedra
                this.ctx.fillRect(t.x - 22, 60, 44, h - 60);
                this.ctx.strokeRect(t.x - 22, 60, 44, h - 60);

                if (this.level === 2) {
                    // Grietas de magma brillantes
                    this.ctx.fillStyle = '#ff3300';
                    this.ctx.fillRect(t.x - 18, 120, 4, 30);
                    this.ctx.fillRect(t.x + 14, 180, 4, 45);
                    this.ctx.fillRect(t.x - 8, 280, 6, 20);
                    this.ctx.fillStyle = '#281310'; // restaurar
                }

                // Antorcha de metal
                this.ctx.fillStyle = '#4a4a58';
                this.ctx.fillRect(t.x - 4, t.y, 8, 18);
                this.ctx.fillStyle = '#2d2d35';
                this.ctx.fillRect(t.x - 6, t.y - 4, 12, 6);
                
                // Halo de luz cálido
                const lightRad = 25 + Math.sin(this.gameTime * 0.1) * 3;
                const haloGrad = this.ctx.createRadialGradient(t.x, t.y - 12, 2, t.x, t.y - 12, lightRad);
                if (this.level === 1) {
                    haloGrad.addColorStop(0, 'rgba(255, 120, 0, 0.4)');
                    haloGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
                } else {
                    // Magma rojo brillante en las catacumbas
                    haloGrad.addColorStop(0, 'rgba(255, 50, 0, 0.5)');
                    haloGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                }
                
                this.ctx.fillStyle = haloGrad;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y - 12, lightRad, 0, Math.PI * 2);
                this.ctx.fill();
            });
        } else {
            // Nivel 3 (Boss Room) - Ventanales iluminados por rayos verdes espectrales
            this.torches.forEach(t => {
                const lightRad = 60 + Math.sin(this.gameTime * 0.05) * 6;
                const haloGrad = this.ctx.createRadialGradient(t.x, t.y, 5, t.x, t.y, lightRad);
                haloGrad.addColorStop(0, 'rgba(0, 255, 120, 0.2)');
                haloGrad.addColorStop(1, 'rgba(0, 255, 50, 0)');
                this.ctx.fillStyle = haloGrad;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, lightRad, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        this.ctx.restore();

        // 4. Suelo de Ladrillos (Capa 1.0x)
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX), 0);
        
        // Bloques de piedra oscuros del suelo
        if (this.level === 1) {
            this.ctx.fillStyle = '#28252e';
        } else if (this.level === 2) {
            this.ctx.fillStyle = '#211a18'; // Piedra volcánica oscura
        } else {
            this.ctx.fillStyle = '#16241a'; // Piedra verde espectral
        }
        this.ctx.fillRect(0, this.floorY, this.levelWidth, h - this.floorY);
        
        this.ctx.strokeStyle = this.level === 1 ? '#18151c' : (this.level === 2 ? '#100a08' : '#0a120e');
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, this.floorY, this.levelWidth, h - this.floorY);

        // Baldosas retro
        this.ctx.strokeStyle = this.level === 1 ? '#18151c' : (this.level === 2 ? '#ff4400' : '#0a120e'); // Magma brillante en Nivel 2
        this.ctx.lineWidth = this.level === 2 ? 1.5 : 2.5;
        this.ctx.beginPath();
        
        const tileWidth = 64;
        const totalTiles = this.levelWidth / tileWidth;
        for (let i = 0; i < totalTiles; i++) {
            const tx = i * tileWidth;
            this.ctx.moveTo(tx, this.floorY);
            this.ctx.lineTo(tx, h);
            
            const midY = this.floorY + (h - this.floorY) / 2;
            this.ctx.moveTo(tx - tileWidth/2, midY);
            this.ctx.lineTo(tx + tileWidth/2, midY);
        }
        this.ctx.stroke();

        // Brillo difuso del magma en Nivel 2
        if (this.level === 2) {
            this.ctx.fillStyle = 'rgba(255, 68, 0, 0.08)';
            this.ctx.fillRect(0, this.floorY, this.levelWidth, 12);
        }

        // Decoración de hierro en Nivel 3
        if (this.level === 3) {
            this.ctx.fillStyle = '#1c1c24';
            this.ctx.fillRect(20, 100, 20, this.floorY - 100);
            this.ctx.strokeStyle = '#000';
            this.ctx.strokeRect(20, 100, 20, this.floorY - 100);
            for(let j=120; j<this.floorY; j+=35) {
                this.ctx.fillStyle = '#3a3a46';
                this.ctx.fillRect(15, j, 30, 6);
            }
        }

        this.ctx.restore();
    }

    // ==========================================================================
    // MÉTODOS AUXILIARES: COLISIONES E INTERFAZ HUD
    // ==========================================================================
    checkAABBCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    updateHud() {
        // Vida y Estamina en interfaz (HUD)
        const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        const stPercent = Math.max(0, (this.player.stamina / this.player.maxStamina) * 100);

        document.getElementById('player-hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('player-st-bar').style.width = `${stPercent}%`;

        // Pequeño delay a la sombra de vida para dramatismo
        setTimeout(() => {
            const shadow = document.getElementById('player-hp-shadow');
            if (shadow) shadow.style.width = `${hpPercent}%`;
        }, 350);

        // Contador de Monedas formateado
        const formattedCoins = this.player.coins.toString().padStart(3, '0');
        document.getElementById('coin-count').innerText = formattedCoins;

        // Sincronizar Bulto (Inventario)
        if (this.player) {
            this.inventoryBadge.innerText = this.player.potions;
            this.slotPotionQty.innerText = 'x' + this.player.potions;
            
            // Si no tiene pociones, atenuar el contador
            this.inventoryBadge.style.opacity = (this.player.potions === 0) ? '0.3' : '1.0';
        }
    }

    updateBossHud() {
        if (!this.boss) return;
        const bossHpPercent = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
        document.getElementById('boss-hp-bar').style.width = `${bossHpPercent}%`;

        setTimeout(() => {
            const shadow = document.getElementById('boss-hp-shadow');
            if (shadow) shadow.style.width = `${bossHpPercent}%`;
        }, 450);
    }

    togglePause() {
        if (this.state !== 'playing') return;
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.domPause.classList.remove('hidden');
            audio.stopMusic();
        } else {
            this.domPause.classList.add('hidden');
            if (!audio.isMuted) {
                audio.startMusic();
            }
        }
    }

    toggleMute() {
        audio.isMuted = !audio.isMuted;
        this.btnMute.innerText = audio.isMuted ? "SONIDO: OFF" : "SONIDO: ON";
        
        if (audio.isMuted) {
            audio.stopMusic();
        } else if (!this.isPaused && this.state === 'playing') {
            audio.startMusic();
        }
    }

    // ==========================================================================
    // TIENDA Y DESCANSO EN LA HOGUERA
    // ==========================================================================
    handleBonfireInteraction() {
        if (this.state !== 'playing' || (this.level !== 1 && this.level !== 2)) return;
        
        const distToHoguera = Math.abs((this.player.x + this.player.width/2) - (this.bonfire.x + this.bonfire.width/2));
        if (distToHoguera >= 75) return; // Muy lejos de la hoguera

        this.isShopOpen = !this.isShopOpen;

        if (this.isShopOpen) {
            this.domBonfireScreen.classList.remove('hidden');
            this.updateShopDetails();
            audio.stopMusic();
        } else {
            this.closeBonfireShop();
        }
    }

    closeBonfireShop() {
        this.isShopOpen = false;
        this.domBonfireScreen.classList.add('hidden');
        if (!audio.isMuted) {
            audio.startMusic();
        }
    }

    updateShopDetails() {
        this.shopCoins.innerText = this.player.coins.toString().padStart(3, '0');
        this.shopHp.innerText = `${this.player.hp} / ${this.player.maxHp}`;
    }

    restAtBonfire() {
        if (this.player.hp <= 0) return;
        
        // Descanso cura 100% vida y estamina gratis
        this.player.hp = this.player.maxHp;
        this.player.stamina = this.player.maxStamina;
        
        // Reaparecer todos los enemigos, trampas, plataformas y cajas llamando a initLevel para el nivel actual
        this.initLevel(this.level);

        this.lootItems = []; // Limpiar monedas sueltas antiguas
        
        audio.playBonfire(); // Sonido de hoguera
        particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff6600', 20);
        
        // Mostrar texto flotante del reset del mundo
        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "MUNDO REINICIADO", "#ff6600", 11, true);
        
        this.updateHud();
        this.updateShopDetails();
    }

    buyPotionFromShop() {
        if (this.player.hp <= 0) return;

        // Validar si tiene suficientes monedas (Cuesta 10 monedas)
        const potionCost = 10;
        if (this.player.coins < potionCost) {
            // No tiene monedas suficientes: reproducir sonido sordo
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "NO COINS!", "#ffd700", 11, true);
            return;
        }

        // Realizar compra (se añade al bulto)
        this.player.coins -= potionCost;
        this.player.potions++;
        
        audio.playBonfire(); // Sonido mágico
        particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#00ff66', 15);
        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "+1 POCIÓN", "#00ff66", 11, true);
        
        this.updateHud();
        this.updateShopDetails();
    }

    toggleInventory() {
        if (this.state !== 'playing' || this.isPaused) return;
        
        const isOpen = !this.domInventoryPopup.classList.contains('hidden');
        if (isOpen) {
            this.domInventoryPopup.classList.add('hidden');
        } else {
            this.domInventoryPopup.classList.remove('hidden');
            this.updateHud(); // Sincronizar cantidades al abrir
        }
    }

    quickUsePotion() {
        if (this.state !== 'playing' || this.isPaused) return;

        if (this.player.potions <= 0) {
            // No tiene pociones: sonido de aviso y texto flotante
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "SIN POCIONES!", "#ff3333", 9, true);
            return;
        }

        if (this.player.hp >= this.player.maxHp) {
            // HP ya al máximo
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "VIDA LLENA!", "#00ff66", 9, false);
            return;
        }

        // Usar poción
        const success = this.player.usePotion();
        if (success) {
            this.updateHud();
            // Actualizar tienda de hoguera si estuviera abierta
            if (this.isShopOpen) {
                this.updateShopDetails();
            }
        }
    }
}

// Inicializar el juego al cargar
window.addEventListener('load', () => {
    new Game();
});
