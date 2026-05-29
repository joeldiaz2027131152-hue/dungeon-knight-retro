/* ==========================================================================
   DUNGEON KNIGHT - EL JEFE ESQUELETO GIGANTE (boss.js)
   ========================================================================== */

import { audio } from './audio.js';
import { particles } from './particles.js';

// ==========================================================================
// PROYECTIL: CRÁNEO DE FUEGO DEL JEFE (Spawneado en ataque de invocación)
// ==========================================================================
export class BossProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
        this.damage = 6;
        this.life = 180; // ~3 segundos
        this.pulseTime = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.pulseTime += 0.15;

        // Emitir pequeñas partículas de fuego detrás
        if (this.life % 4 === 0) {
            particles.spawnFire(this.x + this.width/2, this.y + this.height/2, 0.7);
        }

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        const scale = 1.0 + Math.sin(this.pulseTime) * 0.15;
        ctx.scale(scale, scale);

        // Halo de fuego exterior
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI*2);
        ctx.fill();

        // Cráneo interior pequeño
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#111'; // ojos
        ctx.fillRect(-3, -3, 2, 2);
        ctx.fillRect(1, -3, 2, 2);
        ctx.fillRect(-2, 2, 4, 2); // mandíbula

        ctx.restore();
    }
}

// ==========================================================================
// ONDA DE CHOQUE TERRESTRE (Shockwave - Obliga a saltar)
// ==========================================================================
export class Shockwave {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 36; // Alta para obligar a saltar bien alto
        this.vx = direction * 5.0; // Velocidad de avance
        this.active = true;
        this.damage = 10;
        this.life = 120; // Recorrido de ~2 segundos
    }

    update() {
        this.x += this.vx;
        this.life--;

        // Humo/polvo a su paso
        if (this.life % 3 === 0) {
            particles.spawnDust(this.x + this.width/2, this.y + this.height, 2);
        }

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height);

        // Onda sísmica de fuego/roca (estilo picos que avanzan)
        const grad = ctx.createLinearGradient(-this.width/2, -this.height, this.width/2, 0);
        grad.addColorStop(0, '#ff3300');
        grad.addColorStop(0.5, '#ffd700');
        grad.addColorStop(1, '#660000');

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#220000';
        ctx.lineWidth = 1.5;

        // Triángulo/Pico de energía sísmica
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(0, -this.height - (Math.random() * 5)); // Flickeo dinámico de altura
        ctx.lineTo(this.width/2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

// ==========================================================================
// CLASE PRINCIPAL DEL JEFE: EL REY ESQUELETO GIGANTE
// ==========================================================================
export class SkeletonBoss {
    constructor(x, y) {
        // Dimensiones Gigantes
        this.x = x;
        this.y = y;
        this.width = 110;
        this.height = 135;

        // Vida masiva del boss
        this.maxHp = 300;
        this.hp = 300;
        
        // Fases
        this.phase = 1; // Fase 1 normal, Fase 2 furia roja por debajo de 50% HP
        
        // Inteligencia Artificial (Estados)
        // 'idle', 'chase', 'slamPre', 'slamStrike', 'summon', 'leapPre', 'leapAir', 'leapSlam', 'hurt', 'dead'
        this.state = 'idle';
        this.stateTimer = 60; // frames
        this.facing = -1; // Comienza mirando a la izquierda (hacia el héroe)
        
        // Físicas y movimiento
        this.vx = 0;
        this.vy = 0;
        this.speed = 1.9;
        this.gravity = 0.5;
        this.isGrounded = false;
        
        // Ataques e Hitboxes
        this.cooldowns = {
            slam: 0,
            summon: 60,
            leap: 0
        };

        this.hurtTimer = 0;
        this.animTime = 0;
        this.wingAngle = 0;
        this.wingFlapSpeed = 0.05;
        
        // Referencia para generar proyectiles y ondas sísmicas en el bucle
        this.spawnedProjectiles = [];
        this.spawnedShockwaves = [];
        this.shouldTriggerShake = false; // Flag para sacudir la pantalla
    }

    update(player, arenaLeft, arenaRight, floorY) {
        if (this.hp <= 0) {
            this.state = 'dead';
            this.vx = 0;
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                this.vy = 0;
            }
            return;
        }

        // Ticks de cooldown y efectos
        if (this.hurtTimer > 0) this.hurtTimer--;
        Object.keys(this.cooldowns).forEach(k => {
            if (this.cooldowns[k] > 0) this.cooldowns[k]--;
        });

        // Cambiar a Fase 2 (Furia por debajo de 50% HP)
        if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed = 2.8; // Más rápido
            particles.addFloatingText(this.x + this.width/2, this.y - 30, "PHASE II: RED FURY", "#ff0033", 14, true);
            audio.playBonfire(); // Sonido mágico dramático
            this.shouldTriggerShake = true;
            
            // Explosión de chispas rojas
            particles.spawnSparks(this.x + this.width/2, this.y + this.height/2, 30, 0);
        }

        // Animación dinámica de las alas gigantes
        this.wingAngle = Math.sin(this.animTime * this.wingFlapSpeed) * 0.35;
        this.animTime++;

        // Mantener gravedad para los saltos
        if (!this.isGrounded) {
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                this.vy = 0;
                this.isGrounded = true;
                
                // Si venía de una caída por Leap Attack
                if (this.state === 'leapAir') {
                    this.triggerLeapLand(player, floorY);
                }
            }
        }

        // --- Máquina de Estados de IA ---
        this.stateTimer--;

        // Determinar orientación (siempre mirar al jugador a menos que esté embistiendo)
        if (this.state !== 'leapAir' && this.state !== 'leapSlam') {
            this.facing = (player.x < this.x + this.width/2) ? -1 : 1;
        }

        if (this.stateTimer <= 0) {
            this.chooseNextState(player, floorY);
        }

        // Ejecutar comportamiento continuo de cada estado
        this.executeStateBehavior(player, floorY);

        // Clampar posición y velocidad dentro de los límites de la arena
        if (this.x < arenaLeft) {
            this.x = arenaLeft;
            this.vx = 0;
        } else if (this.x + this.width > arenaRight) {
            this.x = arenaRight - this.width;
            this.vx = 0;
        }
    }

    chooseNextState(player, floorY) {
        const dx = Math.abs((player.x + player.width/2) - (this.x + this.width/2));
        
        // Máquina de estados agresiva
        if (this.state === 'idle' || this.state === 'chase') {
            if (dx < 190 && this.cooldowns.slam <= 0) {
                // Golpe de martillo a corta/media distancia — rango ampliado
                this.state = 'slamPre';
                this.stateTimer = 28; // Carga más rápida
                this.vx = 0;
            } else if (dx > 250 && this.cooldowns.leap <= 0 && this.phase === 2) {
                // Ataque de salto largo (Fase 2 únicamente)
                this.state = 'leapPre';
                this.stateTimer = 35;
                this.vx = 0;
            } else if (this.cooldowns.summon <= 0 && Math.random() > 0.55) {
                // Invocar proyectiles — menos frecuente para que se acerque más
                this.state = 'summon';
                this.stateTimer = 45;
                this.vx = 0;
            } else {
                // Siempre perseguir si el jugador está a más de 100px
                this.state = 'chase';
                this.stateTimer = 35 + Math.random() * 25;
            }
        } else {
            // Tras un ataque: breve pausa y vuelve a perseguir
            this.state = dx > 120 ? 'chase' : 'idle';
            this.stateTimer = 15 + Math.random() * 15;
            this.vx = 0;
        }
    }

    executeStateBehavior(player, floorY) {
        // Efecto aura de fuego de Fase 2
        if (this.phase === 2 && this.hp > 0 && Math.random() > 0.5) {
            particles.spawnFire(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 1.2, true);
        }

        switch (this.state) {
            case 'chase':
                // Perseguir al jugador horizontalmente con velocidad dinámica
                const dirX = (player.x + player.width/2 < this.x + this.width/2) ? -1 : 1;
                this.vx = dirX * this.speed;
                this.x += this.vx;
                
                // Detenerse solo cuando está muy cerca (zona de ataque)
                const distance = Math.abs((player.x + player.width/2) - (this.x + this.width/2));
                if (distance < 100) {
                    this.vx = 0;
                    this.state = 'idle';
                    this.stateTimer = 5; // Pausa brevísima antes de atacar
                }
                break;

            case 'slamPre':
                // Carga de martillazo (tiembla un poco cargando)
                this.x += (Math.random() - 0.5) * 2;
                break;

            case 'slamStrike':
                // Frame en que el martillo golpea de verdad
                if (this.stateTimer === 18) { // Sincronizado con la caída visual
                    this.triggerHammerImpact(player, floorY);
                }
                break;

            case 'summon':
                // Invocar proyectiles
                if (this.stateTimer === 25) { // Momento de liberación
                    this.triggerSummonFire();
                }
                // Tiembla con chispas mágicas
                this.x += (Math.random() - 0.5) * 1.5;
                if (this.stateTimer % 5 === 0) {
                    particles.spawnCollectGlow(this.x + this.width/2, this.y + 20, '#ff3300', 3);
                }
                break;

            case 'leapPre':
                // Cargar gran salto (Fase 2)
                this.x += (Math.random() - 0.5) * 3;
                if (this.stateTimer === 1) {
                    // Impulso vertical y horizontal hacia el jugador
                    this.vy = -14.0;
                    const pCenterX = player.x + player.width/2;
                    const bCenterX = this.x + this.width/2;
                    this.vx = (pCenterX - bCenterX) * 0.038; // calcular parábola aproximada
                    this.isGrounded = false;
                    this.state = 'leapAir';
                    this.stateTimer = 200; // Máximo en el aire
                    audio.playJump();
                }
                break;

            case 'leapAir':
                // En el aire
                this.x += this.vx;
                // Partículas cayendo
                if (this.stateTimer % 3 === 0) {
                    particles.spawnCollectGlow(this.x + this.width/2, this.y + this.height - 10, '#ff3300', 3);
                }
                break;

            case 'leapSlam':
                // Fase de recuperación tras el impacto del gran salto
                this.vx = 0;
                break;

            case 'idle':
            default:
                this.vx = 0;
                break;
        }
    }

    // ==========================================================================
    // ATAQUES Y ACCIONES DEL JEFE
    // ==========================================================================

    // 1. Golpe de Martillo
    triggerHammerImpact(player, floorY) {
        audio.playDeath(); // Ruido profundo del martillazo
        this.shouldTriggerShake = true;
        
        // Chispas del impacto de roca
        const impactX = this.x + this.width/2 + (this.facing * 85);
        particles.spawnWoodSplinters(impactX, floorY, 15); // astillas grises que simulan piedra
        particles.spawnDust(impactX, floorY - 5, 12);
        
        // Cooldown
        this.cooldowns.slam = 80; // ~1.3 segundos (más agresivo)

        // Comprobar daño al jugador si está cerca del área del impacto
        const hammerHitRange = 70;
        const playerCenterX = player.x + player.width/2;
        const distToImpact = Math.abs(playerCenterX - impactX);

        if (distToImpact < hammerHitRange && player.y + player.height >= floorY - 15) {
            // El jugador es dañado e impulsado
            player.takeDamage(14, this.facing * 6.0, impactX);
        }

        // Si está en Fase 2, ¡generar dos ondas de choque sísmicas laterales!
        if (this.phase === 2) {
            this.spawnedShockwaves.push(new Shockwave(impactX, floorY - 36, 1)); // Onda a la derecha
            this.spawnedShockwaves.push(new Shockwave(impactX, floorY - 36, -1)); // Onda a la izquierda
            audio.playBonfire(); // Sonido de fuego mágico
        }
    }

    // 2. Invocar Calaveras de Fuego
    triggerSummonFire() {
        audio.playBonfire();
        
        const spawnX = this.x + this.width/2;
        const spawnY = this.y + 20;

        // Disparar 3 proyectiles en abanico hacia donde mire
        const projCount = this.phase === 2 ? 4 : 2;
        const speed = 4.5;
        
        if (projCount === 2) {
            this.spawnedProjectiles.push(new BossProjectile(spawnX, spawnY, this.facing * speed, -1));
            this.spawnedProjectiles.push(new BossProjectile(spawnX, spawnY, this.facing * speed, 1));
        } else {
            // Abanico amplio en fase 2
            this.spawnedProjectiles.push(new BossProjectile(spawnX, spawnY, this.facing * speed, -2.2));
            this.spawnedProjectiles.push(new BossProjectile(spawnX, spawnY, this.facing * speed, -0.7));
            this.spawnedProjectiles.push(new BossProjectile(spawnX, spawnY, this.facing * speed, 0.7));
            this.spawnedProjectiles.push(new BossProjectile(spawnX, spawnY, this.facing * speed, 2.2));
        }
        
        this.cooldowns.summon = 180; // 3 segundos
    }

    // 3. Caída e Impacto del Salto (Leap Attack)
    triggerLeapLand(player, floorY) {
        this.state = 'leapSlam';
        this.stateTimer = 45; // Frames de recuperación inmovilizado
        this.vx = 0;
        this.vy = 0;
        
        audio.playDeath();
        this.shouldTriggerShake = true;
        this.cooldowns.leap = 300; // 5 segundos de recarga para este ataque masivo

        const impactX = this.x + this.width/2;
        // Explosión de fuego y polvo en la zona de aterrizaje
        particles.spawnWoodSplinters(impactX, floorY, 25);
        particles.spawnDust(impactX, floorY - 5, 20);
        
        // Fuego masivo a los lados
        for (let i = 0; i < 8; i++) {
            particles.spawnFire(impactX + (Math.random() - 0.5) * 80, floorY - 10, 1.8, true);
        }

        // Comprobar colisión directa de aplastamiento
        const pCenterX = player.x + player.width/2;
        const dist = Math.abs(pCenterX - impactX);

        if (dist < 90 && player.y + player.height >= floorY - 30) {
            // Daño brutal y knockback extremo
            player.takeDamage(18, (player.x < impactX ? -1 : 1) * 8.0, impactX);
        }
    }

    // Recibir Daño (El jugador lo golpea)
    takeDamage(amount) {
        if (this.hp <= 0) return;

        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 12;

        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, true);
        particles.addFloatingText(
            this.x + this.width/2 + (Math.random()-0.5)*30,
            this.y - 10,
            `-${amount}`,
            "#ffd700", // Amarillo dorado para el boss
            12,
            true // Crítico
        );

        if (this.hp <= 0) {
            // Muerte épica
            audio.playDeath();
            this.shouldTriggerShake = true;
            this.vx = 0;
            this.vy = -4; // Pequeño salto de muerte
            this.isGrounded = false;
        }
    }

    // ==========================================================================
    // DIBUJADO PROCEDURAL DEL JEFE GIGANTE (Pixel Art Gótico)
    // ==========================================================================
    draw(ctx) {
        ctx.save();

        // Parpadeo al recibir daño
        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        // Dibujar Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 4, this.width * 0.4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        // Movimiento bobbing lento de flotación del torso
        const floatBob = Math.sin(this.animTime * 0.05) * 4;

        // 1. DIBUJAR ALAS GIGANTES DE GÁRGOLA (Capa trasera)
        ctx.save();
        ctx.translate(x + w / 2, y + 55 + floatBob);
        
        ctx.fillStyle = '#1d1726'; // Morado oscuro/negro
        ctx.strokeStyle = '#0e0b12';
        ctx.lineWidth = 2.5;

        // Ala Izquierda
        ctx.save();
        ctx.scale(-1, 1); // Espejar para la izquierda
        ctx.rotate(this.wingAngle);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(85, -35); // Envergadura
        ctx.lineTo(75, 15);
        ctx.lineTo(40, 20);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Huesos de la estructura del ala
        ctx.strokeStyle = '#4e3f5c';
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(85, -35);
        ctx.moveTo(10, 0); ctx.lineTo(75, 15);
        ctx.moveTo(10, 0); ctx.lineTo(40, 20);
        ctx.stroke();
        ctx.restore();

        // Ala Derecha
        ctx.save();
        ctx.rotate(this.wingAngle);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(85, -35);
        ctx.lineTo(75, 15);
        ctx.lineTo(40, 20);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Estructura ósea ala derecha
        ctx.strokeStyle = '#4e3f5c';
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(85, -35);
        ctx.moveTo(10, 0); ctx.lineTo(75, 15);
        ctx.moveTo(10, 0); ctx.lineTo(40, 20);
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        // 2. TORSO / CAJA TORÁCICA ANCHA DE ACERO GÓTICO
        ctx.save();
        ctx.translate(x + w/2, y + h/2 + floatBob);
        ctx.scale(this.facing, 1);

        // Armadura de hombros (Hombreras góticas de placas de hierro)
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(-35, -28, 70, 16);
        ctx.fillStyle = '#3a3a46'; // Sombras
        ctx.fillRect(-37, -25, 12, 10);
        ctx.fillRect(25, -25, 12, 10);

        // Costillas Gigantes de Hueso Oscuro
        ctx.fillStyle = '#dcdce5';
        ctx.fillRect(-18, -12, 36, 32); // Estructura columna central del boss
        
        ctx.fillStyle = '#b8b8c4'; // Huecos/Costillas
        ctx.fillRect(-26, -6, 52, 4);
        ctx.fillRect(-28, 2, 56, 4);
        ctx.fillRect(-24, 10, 48, 4);
        ctx.fillRect(-20, 18, 40, 4);
        
        // Núcleo de Energía en el Pecho (Rojo brillante). En fase 2 brilla violento
        const coreColor = (this.phase === 2 && Math.floor(this.animTime / 5) % 2 === 0) ? '#ff6666' : '#ff0033';
        ctx.fillStyle = coreColor;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = this.phase === 2 ? 15 : 6;
        ctx.beginPath();
        ctx.arc(0, -6, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0; // Desactivar

        // Pelvis de placas
        ctx.fillStyle = '#4a4a58';
        ctx.fillRect(-18, 24, 36, 8);

        // 3. BRAZO GIGANTE DERECHO QUE EMPUÑA EL MARTILLO
        ctx.save();
        ctx.translate(-28, -14); // Conectado al hombro derecho

        // Rotación del brazo según estado de martillazo
        let armAngle = Math.PI * 0.15; // Posición normal
        if (this.state === 'slamPre') {
            // Elevar martillo hacia atrás
            armAngle = -Math.PI * 0.45;
        } else if (this.state === 'slamStrike') {
            // Caída violenta según tiempo
            const progress = (18 - this.stateTimer) / 18;
            armAngle = -Math.PI * 0.45 + (progress * Math.PI * 0.95);
        } else if (this.state === 'leapAir') {
            // En el aire lleva el martillo apuntado abajo
            armAngle = Math.PI * 0.35;
        }
        ctx.rotate(armAngle);

        // Dibujar brazo óseo gordo
        ctx.fillStyle = '#dcdce5';
        ctx.fillRect(-6, 0, 12, 28);
        
        // Mango de Madera del Martillo Gigante
        ctx.fillStyle = '#5c3a21'; // Marrón madera
        ctx.fillRect(-3, 10, 6, 75); // Mango largo de 75px

        // Cabeza del Martillo de Piedra Rúnica Gigante
        ctx.fillStyle = '#5c5c68'; // Roca gris oscuro
        ctx.strokeStyle = '#2d2d35';
        ctx.lineWidth = 3;
        
        // Caja de piedra principal
        ctx.fillRect(-22, 65, 44, 34);
        ctx.strokeRect(-22, 65, 44, 34);
        
        // Runas brillantes grabadas en el martillo (Fase 2 rojas, Fase 1 amarillas)
        ctx.fillStyle = this.phase === 2 ? '#ff3300' : '#ffd700';
        ctx.fillRect(-12, 76, 24, 3);
        ctx.fillRect(-4, 70, 8, 24);

        ctx.restore();

        // 4. BRAZO IZQUIERDO MENACIANTE FLOATING
        ctx.save();
        ctx.translate(28, -14);
        // Hombro a mano oscilando de forma siniestra
        const leftArmAngle = Math.sin(this.animTime * 0.08) * 0.25 + 0.3;
        ctx.rotate(leftArmAngle);
        ctx.fillStyle = '#dcdce5';
        ctx.fillRect(-4, 0, 8, 26); // Antebrazo
        // Garras de esqueleto gigantes
        ctx.fillStyle = '#b8b8c4';
        ctx.fillRect(-6, 26, 12, 6);
        ctx.restore();

        ctx.restore(); // Restaurar translate del torso

        // 5. CRÁNEO GIGANTE DEL REY ESQUELETO (Flota arriba con corona)
        ctx.save();
        ctx.translate(x + w / 2, y + 24 + floatBob * 1.3); // Flota más que el cuerpo
        ctx.scale(this.facing, 1);

        // Cráneo (Hueso blanco premium)
        ctx.fillStyle = '#eef0f8';
        ctx.strokeStyle = '#b0b2c0';
        ctx.lineWidth = 1.5;
        
        // Base de cabeza redonda
        ctx.beginPath();
        ctx.arc(0, -6, 22, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Mandíbula e inferior
        ctx.fillRect(-14, 8, 28, 14);
        ctx.strokeRect(-14, 8, 28, 14);

        // Cuencas oculares vacías con llamas
        ctx.fillStyle = '#0b0b0f';
        ctx.fillRect(-13, -4, 8, 7);
        ctx.fillRect(5, -4, 8, 7);
        
        // Destellos de ojos (Phase 2 -> Fuego rojo gigante; Phase 1 -> Fuego amarillo)
        const eyeColor = this.phase === 2 ? '#ff0033' : '#ff9900';
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-9, -1, 3.5, 0, Math.PI*2);
        ctx.arc(9, -1, 3.5, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0; // Apagar sombra

        // Nariz esquelética (triángulo invertido negro)
        ctx.fillStyle = '#0b0b0f';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(-3, 7);
        ctx.lineTo(3, 7);
        ctx.closePath();
        ctx.fill();

        // Dientes grandes
        ctx.fillStyle = '#0b0b0f';
        ctx.fillRect(-10, 16, 2, 4);
        ctx.fillRect(-5, 16, 2, 4);
        ctx.fillRect(0, 16, 2, 4);
        ctx.fillRect(5, 16, 2, 4);
        ctx.fillRect(8, 16, 2, 4);

        // Corona Real de Oro Gótica (Corona con picos y joyas rojas)
        ctx.fillStyle = '#d1a115'; // Oro
        ctx.strokeStyle = '#7c5f08';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(-22, -18);
        ctx.lineTo(-24, -36); // pico izq
        ctx.lineTo(-12, -26);
        ctx.lineTo(0, -42);  // pico central supremo
        ctx.lineTo(12, -26);
        ctx.lineTo(24, -36);  // pico der
        ctx.lineTo(22, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Joyas rojas en la corona
        ctx.fillStyle = '#ff0033';
        ctx.beginPath();
        ctx.arc(0, -28, 3.5, 0, Math.PI*2);
        ctx.arc(-18, -25, 2.5, 0, Math.PI*2);
        ctx.arc(18, -25, 2.5, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();

        ctx.restore(); // Final
    }
}
export default SkeletonBoss;

// ==========================================================================
// PROYECTIL: BOLA DE FUEGO VOLCÁNICA
// ==========================================================================
export class VolcanicProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
        this.damage = 8;
        this.life = 180;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        if (this.life % 3 === 0) {
            particles.spawnFire(this.x + this.width/2, this.y + this.height/2, 0.9);
        }

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);

        // Halo de fuego interior/exterior
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI*2);
        ctx.fill();

        // Núcleo blanco caliente
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================================================
// METEORITO VOLCÁNICO (Cae del techo de forma aleatoria en Fase 2)
// ==========================================================================
export class VolcanicMeteor {
    constructor(x, y, targetX) {
        this.x = x;
        this.y = y;
        this.width = 22;
        this.height = 22;
        this.targetX = targetX;
        
        // Caer en diagonal hacia el jugador
        this.vx = (targetX - x) * 0.015;
        this.vy = 4.8;
        this.active = true;
        this.damage = 10;
    }

    update(floorY) {
        this.x += this.vx;
        this.y += this.vy;

        if (Math.random() > 0.4) {
            particles.spawnFire(this.x + this.width/2, this.y + this.height/2, 1.1);
        }

        // Colisionar con el suelo
        if (this.y + this.height >= floorY) {
            this.explode(floorY);
        }
    }

    explode(floorY) {
        this.active = false;
        particles.spawnSparks(this.x + this.width/2, floorY, 12, 0);
        audio.playHit();
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);

        // Dibujar roca ígnea rugosa
        ctx.fillStyle = '#220808';
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-5, -11);
        ctx.lineTo(6, -9);
        ctx.lineTo(11, 2);
        ctx.lineTo(3, 10);
        ctx.lineTo(-7, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Núcleo brillante
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-4, -4, 8, 8);

        ctx.restore();
    }
}

// ==========================================================================
// JEFE DEL MUNDO 2: EL DEMONIO ÍGNEO (Fire Demon Boss)
// ==========================================================================
export class FireDemonBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 145;

        this.maxHp = 420;
        this.hp = 420;
        this.phase = 1;

        // 'idle', 'chase', 'chargePre', 'chargeStrike', 'meteorPre', 'meteorStrike', 'wavePre', 'waveStrike', 'dead'
        this.state = 'idle';
        this.stateTimer = 80;
        this.facing = -1;

        this.vx = 0;
        this.vy = 0;
        this.speed = 1.6;
        this.gravity = 0.55;
        this.isGrounded = false;

        this.cooldowns = {
            charge: 0,
            meteor: 0,
            wave: 0
        };

        this.hurtTimer = 0;
        this.animTime = 0;
        this.wingAngle = 0;
        this.wingFlapSpeed = 0.07;

        this.spawnedProjectiles = [];
        this.spawnedMeteors = [];
        this.spawnedShockwaves = [];
        this.shouldTriggerShake = false;
    }

    update(player, arenaLeft, arenaRight, floorY) {
        if (this.hp <= 0) {
            this.state = 'dead';
            this.vx = 0;
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                this.vy = 0;
            }
            return;
        }

        // Ticks
        if (this.hurtTimer > 0) this.hurtTimer--;
        Object.keys(this.cooldowns).forEach(k => {
            if (this.cooldowns[k] > 0) this.cooldowns[k]--;
        });

        // Fase 2 Furia (debajo del 50% HP)
        if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed = 2.4;
            particles.addFloatingText(this.x + this.width/2, this.y - 30, "MUNDO ARDIENTE: FURIA ÍGNEA", "#ff2200", 14, true);
            audio.playBonfire();
            this.shouldTriggerShake = true;
            particles.spawnSparks(this.x + this.width/2, this.y + this.height/2, 35, 0);
        }

        // Flap de alas
        this.wingAngle = Math.sin(this.animTime * this.wingFlapSpeed) * 0.4;
        this.animTime++;

        // Gravedad
        if (!this.isGrounded) {
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                this.vy = 0;
                this.isGrounded = true;
            }
        }

        this.stateTimer--;

        if (this.state !== 'chargeStrike' && this.state !== 'dead') {
            this.facing = (player.x < this.x + this.width/2) ? -1 : 1;
        }

        if (this.stateTimer <= 0) {
            this.chooseNextState(player, floorY);
        }

        this.executeStateBehavior(player, floorY);

        // Límites de la arena
        if (this.x < arenaLeft) {
            this.x = arenaLeft;
            this.vx = 0;
        } else if (this.x + this.width > arenaRight) {
            this.x = arenaRight - this.width;
            this.vx = 0;
        }
    }

    chooseNextState(player, floorY) {
        const dx = Math.abs((player.x + player.width/2) - (this.x + this.width/2));

        if (this.state === 'idle' || this.state === 'chase') {
            if (dx < 180 && this.cooldowns.charge <= 0) {
                // Embestida ígnea
                this.state = 'chargePre';
                this.stateTimer = 40;
                this.vx = 0;
            } else if (this.phase === 2 && this.cooldowns.meteor <= 0 && Math.random() > 0.4) {
                // Lluvia de meteoritos de Fase 2
                this.state = 'meteorPre';
                this.stateTimer = 45;
                this.vx = 0;
            } else if (this.cooldowns.wave <= 0) {
                // Ondas de lava terrestres
                this.state = 'wavePre';
                this.stateTimer = 35;
                this.vx = 0;
            } else {
                this.state = 'chase';
                this.stateTimer = 40 + Math.random() * 40;
            }
        } else {
            this.state = 'idle';
            this.stateTimer = 30 + Math.random() * 20;
            this.vx = 0;
        }
    }

    executeStateBehavior(player, floorY) {
        // Partículas permanentes de fuego en Fase 2
        if (this.phase === 2 && this.hp > 0 && Math.random() > 0.4) {
            particles.spawnFire(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 1.4, true);
        }

        // Actualizar meteoritos
        for (let i = this.spawnedMeteors.length - 1; i >= 0; i--) {
            const met = this.spawnedMeteors[i];
            met.update(floorY);
            if (!met.active) {
                this.spawnedMeteors.splice(i, 1);
            }
        }

        switch (this.state) {
            case 'chase':
                const dirX = (player.x + player.width/2 < this.x + this.width/2) ? -1 : 1;
                this.vx = dirX * this.speed;
                this.x += this.vx;

                if (Math.abs((player.x + player.width/2) - (this.x + this.width/2)) < 90) {
                    this.vx = 0;
                    this.state = 'idle';
                    this.stateTimer = 10;
                }
                break;

            case 'chargePre':
                // Temblar preparándose
                this.x += (Math.random() - 0.5) * 3;
                if (this.stateTimer === 1) {
                    // Cargar directo
                    this.state = 'chargeStrike';
                    this.stateTimer = 25;
                    this.vx = this.facing * 9.5; // Embestida superveloz
                    audio.playDeath();
                }
                break;

            case 'chargeStrike':
                this.x += this.vx;
                // Emitir fuego detrás
                particles.spawnFire(this.x + this.width/2, this.y + this.height - 20, 1.5, true);
                
                // Comprobar colisión directa con el jugador durante la embestida
                if (Math.abs((player.x + player.width/2) - (this.x + this.width/2)) < 80) {
                    player.takeDamage(15, this.facing * 7.5, this.x + this.width/2);
                    this.vx = 0;
                    this.state = 'idle';
                    this.stateTimer = 20;
                }
                
                if (this.stateTimer === 1) {
                    this.cooldowns.charge = 200; // 3.3s cooldown
                }
                break;

            case 'meteorPre':
                this.x += (Math.random() - 0.5) * 2;
                if (this.stateTimer === 1) {
                    this.state = 'meteorStrike';
                    this.stateTimer = 60;
                    this.triggerMeteorRain(player, floorY);
                }
                break;

            case 'meteorStrike':
                this.vx = 0;
                break;

            case 'wavePre':
                this.x += (Math.random() - 0.5) * 1.5;
                if (this.stateTimer === 1) {
                    this.state = 'waveStrike';
                    this.stateTimer = 40;
                    this.triggerLavaWaves(player, floorY);
                }
                break;

            case 'waveStrike':
                this.vx = 0;
                break;

            case 'idle':
            default:
                this.vx = 0;
                break;
        }
    }

    triggerMeteorRain(player, floorY) {
        audio.playBonfire();
        this.shouldTriggerShake = true;
        
        // Spawnear 3 o 4 meteoros cayendo en diagonal desde el cielo sobre el jugador
        const count = 4;
        for (let i = 0; i < count; i++) {
            const startX = this.x + this.width/2 + (i - 1.5) * 150;
            const targetX = player.x + (Math.random() - 0.5) * 80;
            this.spawnedMeteors.push(new VolcanicMeteor(startX, -50, targetX));
        }

        this.cooldowns.meteor = 360; // 6 segundos
    }

    triggerLavaWaves(player, floorY) {
        audio.playBonfire();
        
        const spawnX = this.x + this.width/2;
        const spawnY = this.y + 40;
        const speed = 5.2;

        if (this.phase === 1) {
            // Fase 1: Solo dispara 2 bolas de fuego diagonales
            this.spawnedProjectiles.push(new VolcanicProjectile(spawnX, spawnY, this.facing * speed, -1.0));
            this.spawnedProjectiles.push(new VolcanicProjectile(spawnX, spawnY, this.facing * speed, 1.0));

            // Generar una onda de magma terrestre gigante en la dirección de mira
            this.spawnedShockwaves.push(new Shockwave(spawnX, floorY - 36, this.facing));

            this.cooldowns.wave = 300; // 5 segundos (60 FPS * 5)
        } else {
            // Fase 2: Furia - Dispara 3 bolas de fuego diagonales masivas y más rápido
            this.spawnedProjectiles.push(new VolcanicProjectile(spawnX, spawnY, this.facing * speed, -1.5));
            this.spawnedProjectiles.push(new VolcanicProjectile(spawnX, spawnY, this.facing * speed, 0));
            this.spawnedProjectiles.push(new VolcanicProjectile(spawnX, spawnY, this.facing * speed, 1.5));

            // Generar una onda de magma terrestre gigante en la dirección de mira
            this.spawnedShockwaves.push(new Shockwave(spawnX, floorY - 36, this.facing));

            this.cooldowns.wave = 180; // 3 segundos
        }
    }

    takeDamage(amount) {
        if (this.hp <= 0) return;

        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 10;

        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 10, true);
        particles.addFloatingText(
            this.x + this.width/2 + (Math.random()-0.5)*35,
            this.y - 10,
            `-${amount}`,
            "#ff4400",
            12,
            true
        );

        if (this.hp <= 0) {
            audio.playDeath();
            this.shouldTriggerShake = true;
            this.vx = 0;
            this.vy = -4.5;
            this.isGrounded = false;
        }
    }

    draw(ctx) {
        // Dibujar meteoritos activos de este jefe
        this.spawnedMeteors.forEach(met => met.draw(ctx));

        ctx.save();

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 4, this.width * 0.42, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        const floatBob = Math.sin(this.animTime * 0.06) * 5;

        // 1. ALAS GIGANTES DE FUEGO (Capa trasera)
        ctx.save();
        ctx.translate(x + w / 2, y + 60 + floatBob);
        
        ctx.fillStyle = '#5c1000'; // Rojo volcánico oscuro
        ctx.strokeStyle = '#ff3300'; // Bordes de lava
        ctx.lineWidth = 3;

        // Ala Izquierda
        ctx.save();
        ctx.scale(-1, 1);
        ctx.rotate(this.wingAngle);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(95, -45); 
        ctx.lineTo(80, 20);
        ctx.lineTo(45, 25);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Membrana encendida
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(25, -5);
        ctx.lineTo(85, -35);
        ctx.lineTo(70, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Ala Derecha
        ctx.save();
        ctx.rotate(this.wingAngle);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(95, -45); 
        ctx.lineTo(80, 20);
        ctx.lineTo(45, 25);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(25, -5);
        ctx.lineTo(85, -35);
        ctx.lineTo(70, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // 2. TORSO DE ROCA DE MAGMA
        ctx.save();
        ctx.translate(x + w/2, y + h/2 + floatBob);
        ctx.scale(this.facing, 1);

        // Hombreras volcánicas con picos
        ctx.fillStyle = '#220a05';
        ctx.fillRect(-40, -30, 80, 18);
        ctx.fillStyle = '#ff3300'; // Pico de fuego izq
        ctx.beginPath();
        ctx.moveTo(-35, -30); ctx.lineTo(-42, -45); ctx.lineTo(-25, -30);
        ctx.closePath(); ctx.fill();
        // Pico de fuego der
        ctx.beginPath();
        ctx.moveTo(35, -30); ctx.lineTo(42, -45); ctx.lineTo(25, -30);
        ctx.closePath(); ctx.fill();

        // Costillas/Estructura de magma
        ctx.fillStyle = '#2a110a';
        ctx.fillRect(-22, -12, 44, 35);
        
        ctx.fillStyle = '#ff4400'; // Bandas calientes
        ctx.fillRect(-30, -4, 60, 4);
        ctx.fillRect(-32, 4, 64, 4);
        ctx.fillRect(-28, 12, 56, 4);
        ctx.fillRect(-22, 20, 44, 4);

        // Corazón llameante brillante
        const flameColor = (Math.floor(this.animTime / 4) % 2 === 0) ? '#ffea00' : '#ff3300';
        ctx.fillStyle = flameColor;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = this.phase === 2 ? 20 : 8;
        ctx.beginPath();
        ctx.arc(0, -6, 11, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cinturón/Pelvis
        ctx.fillStyle = '#220a05';
        ctx.fillRect(-20, 26, 40, 10);

        // Brazo izquierdo (Siniestro goteando lava)
        ctx.save();
        ctx.translate(34, -14);
        ctx.rotate(Math.sin(this.animTime * 0.09) * 0.2 + 0.4);
        ctx.fillStyle = '#220a05';
        ctx.fillRect(-5, 0, 10, 28);
        ctx.fillStyle = '#ff3300'; // Mano encendida
        ctx.fillRect(-7, 28, 14, 8);
        ctx.restore();

        // Brazo derecho (Empuña el Látigo / Cetro de Lava)
        ctx.save();
        ctx.translate(-34, -14);
        let rightAngle = Math.PI * 0.2;
        if (this.state === 'chargePre') rightAngle = -Math.PI * 0.35;
        if (this.state === 'wavePre') rightAngle = -Math.PI * 0.5;
        ctx.rotate(rightAngle);
        ctx.fillStyle = '#220a05';
        ctx.fillRect(-6, 0, 12, 30);

        // Cetro de Lava
        ctx.fillStyle = '#ffd700'; // Mango
        ctx.fillRect(-2, 10, 4, 80);
        
        ctx.fillStyle = '#ff2200'; // Cabeza del cetro (Sol de lava)
        ctx.beginPath();
        ctx.arc(0, 90, 15, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 90, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // 3. CABEZA DE DEMONIO CON CUERNOS GIGANTES
        ctx.save();
        ctx.translate(x + w / 2, y + 26 + floatBob * 1.25);
        ctx.scale(this.facing, 1);

        // Cabeza
        ctx.fillStyle = '#220a05';
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -6, 24, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        ctx.fillRect(-15, 8, 30, 12);

        // Cuernos de Lava Gigantes
        ctx.fillStyle = '#ff3300';
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1.5;
        // Cuerno Izquierdo
        ctx.beginPath();
        ctx.moveTo(-18, -18);
        ctx.quadraticCurveTo(-38, -48, -48, -32);
        ctx.quadraticCurveTo(-32, -28, -12, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Cuerno Derecho
        ctx.beginPath();
        ctx.moveTo(18, -18);
        ctx.quadraticCurveTo(38, -48, 48, -32);
        ctx.quadraticCurveTo(32, -28, 12, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ojos brillantes amarillos
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-12, -6, 7, 5);
        ctx.fillRect(5, -6, 7, 5);
        ctx.fillStyle = '#ffffff'; // pupila blanca ardiente
        ctx.fillRect(-9, -4, 2, 2);
        ctx.fillRect(8, -4, 2, 2);

        // Mandíbula/Boca (Fuego latiendo)
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-8, 8, 16, 4);

        ctx.restore();

        ctx.restore();
    }
}

// ==========================================================================
// EL JEFE DEL MUNDO 3: EL DUENDE GIGANTE (GiantGoblinBoss)
// ==========================================================================
export class GiantGoblinBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 110;
        this.height = 135;

        this.maxHp = 550; // HP fuerte de Mundo 3
        this.hp = 550;
        this.phase = 1;
        
        // Estados: 'idle', 'chase', 'slashPre', 'slashStrike', 'block', 'leapPre', 'leapAir', 'leapSlam', 'dead'
        this.state = 'idle';
        this.stateTimer = 80;
        this.facing = -1;

        this.vx = 0;
        this.vy = 0;
        this.speed = 1.8;
        this.gravity = 0.55;
        this.isGrounded = false;

        this.cooldowns = {
            slash: 0,
            leap: 0,
            block: 0
        };
        this.isBlocking = false;
        this.hurtTimer = 0;
        this.animTime = 0;
        
        this.spawnedProjectiles = [];
        this.spawnedShockwaves = [];
        this.shouldTriggerShake = false;
    }

    update(player, arenaLeft, arenaRight, floorY) {
        if (this.hp <= 0) {
            this.state = 'dead';
            this.vx = 0;
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                this.vy = 0;
            }
            return;
        }

        if (this.hurtTimer > 0) this.hurtTimer--;
        Object.keys(this.cooldowns).forEach(k => {
            if (this.cooldowns[k] > 0) this.cooldowns[k]--;
        });

        // Fase 2 Furia Verde (por debajo de 50% HP)
        if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed = 2.6;
            particles.addFloatingText(this.x + this.width/2, this.y - 30, "BOSQUE MÍSTICO: FURIA VERDE", "#2ecc71", 14, true);
            audio.playBonfire();
            this.shouldTriggerShake = true;
            particles.spawnSparks(this.x + this.width/2, this.y + this.height/2, 35, 0);
        }

        this.animTime++;

        // Gravedad
        if (!this.isGrounded) {
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                this.vy = 0;
                this.isGrounded = true;
            }
        }

        // Bloqueo Proactivo:
        // Si el jugador está atacando a rango cercano de frente, el duende levanta su escudo
        if (player && this.cooldowns.block <= 0 && this.state !== 'dead' && this.state !== 'slashPre' && this.state !== 'slashStrike') {
            const dx = (player.x + player.width/2) - (this.x + this.width/2);
            const dist = Math.abs(dx);
            const isPlayerAttacking = player.isAttacking;
            const isFrontal = (dx > 0 && this.facing === 1) || (dx < 0 && this.facing === -1);
            
            if (dist < 180 && isPlayerAttacking && isFrontal) {
                this.state = 'block';
                this.isBlocking = true;
                this.stateTimer = this.phase === 2 ? 15 : 25; // Cubrirse brevemente
                this.cooldowns.block = this.phase === 2 ? 60 : 100;
                this.vx = 0;
            }
        }

        // Bucle de Inteligencia Artificial (Estados)
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            this.isBlocking = false; // Resetear bloqueo al cambiar

            if (this.state === 'idle') {
                this.state = 'chase';
                this.stateTimer = 80 + Math.random() * 40;
            } else if (this.state === 'chase') {
                const dx = player ? (player.x + player.width/2 - (this.x + this.width/2)) : 0;
                const dist = Math.abs(dx);

                if (dist < 100 && this.cooldowns.slash <= 0) {
                    this.state = 'slashPre';
                    this.stateTimer = 22; // Frames de anticipación
                    this.vx = 0;
                } else if (dist > 180 && this.cooldowns.leap <= 0) {
                    this.state = 'leapPre';
                    this.stateTimer = 18;
                    this.vx = 0;
                } else {
                    this.state = 'idle';
                    this.stateTimer = 30 + Math.random() * 30;
                    this.vx = 0;
                }
            } else if (this.state === 'slashPre') {
                this.state = 'slashStrike';
                this.stateTimer = 24;
                this.cooldowns.slash = this.phase === 2 ? 50 : 90;
                audio.playDeath(); // Sonido retro profundo
                
                // Embestida frontal
                this.vx = this.facing * 4.0;
            } else if (this.state === 'slashStrike' || this.state === 'block') {
                this.state = 'idle';
                this.stateTimer = 30 + Math.random() * 30;
                this.vx = 0;
            } else if (this.state === 'leapPre') {
                this.state = 'leapAir';
                this.stateTimer = 45;
                this.isGrounded = false;
                this.vy = -12.5; // Salto vertical alto
                const dx = player ? (player.x - this.x) : 0;
                this.vx = dx > 0 ? 3.8 : -3.8;
            } else if (this.state === 'leapAir') {
                this.state = 'leapSlam';
                this.stateTimer = 20;
                this.vx = 0;
                this.vy = 12.0; // Caída sísmica veloz
            } else if (this.state === 'leapSlam') {
                this.state = 'idle';
                this.stateTimer = 40;
                this.cooldowns.leap = this.phase === 2 ? 120 : 180;
            }
        }

        // Movimientos
        if (this.state === 'chase' && player) {
            const dx = (player.x + player.width/2) - (this.x + this.width/2);
            this.facing = dx > 0 ? 1 : -1;
            this.vx = this.facing * this.speed;
        } else if (this.state === 'leapAir' && player) {
            const dx = (player.x + player.width/2) - (this.x + this.width/2);
            this.vx = dx > 0 ? 3.5 : -3.5;
        } else if (this.state !== 'chase' && this.state !== 'slashStrike' && this.state !== 'leapAir') {
            this.vx = 0;
        }

        // Aplicar colisiones de límites
        this.x += this.vx;
        if (this.x < arenaLeft) {
            this.x = arenaLeft;
            this.vx = 0;
        }
        if (this.x + this.width > arenaRight) {
            this.x = arenaRight - this.width;
            this.vx = 0;
        }

        // Efectos del ataque sísmico al tocar suelo
        if (this.state === 'leapSlam' && this.vy === 0 && this.isGrounded && this.stateTimer > 0) {
            this.shouldTriggerShake = true;
            audio.playCrateBreak();
            
            // Emitir dos ondas sísmicas a los lados (ondas goblínicas verdes)
            this.spawnedShockwaves.push(new Shockwave(this.x, floorY - 36, -5.5));
            this.spawnedShockwaves.push(new Shockwave(this.x + this.width, floorY - 36, 5.5));
            
            particles.spawnSparks(this.x + this.width/2, floorY, 20, 0);
            particles.addFloatingText(this.x + this.width/2, this.y - 20, "SEISMIC CRUSH!", "#2ecc71", 11, true);
            
            this.state = 'idle';
            this.stateTimer = 40;
            this.cooldowns.leap = this.phase === 2 ? 120 : 180;
        }
    }

    takeDamage(amount, knockbackX, sourceX) {
        if (this.hp <= 0) return false;

        // Comprobar si está bloqueando direccionalmente frente al jugador
        const isPlayerInFront = (sourceX > this.x + this.width/2 && this.facing === 1) || (sourceX < this.x + this.width/2 && this.facing === -1);
        if ((this.state === 'block' || this.isBlocking) && isPlayerInFront) {
            audio.playBlock(); // Sonido metálico
            particles.spawnSparks(this.facing === 1 ? this.x + this.width : this.x, this.y + this.height/2, 8, -this.facing);
            particles.addFloatingText(this.x + this.width/2, this.y - 20, "BLOCKED", "#00ffff", 10, true);
            return false; // NO RECIBE DAÑO
        }

        // Recibir daño real
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 18;

        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 14, false);
        particles.addFloatingText(this.x + this.width/2, this.y - 25, `-${amount}`, "#ff2200", 12, true);

        this.shouldTriggerShake = true;
        return true;
    }

    getAttackHitbox() {
        if (this.state !== 'slashStrike' || this.stateTimer < 8 || this.stateTimer > 20) {
            return null;
        }
        const hitW = 85;
        const hitH = this.height - 20;
        return {
            x: this.facing === 1 ? this.x + this.width - 10 : this.x - hitW + 10,
            y: this.y + 10,
            width: hitW,
            height: hitH
        };
    }

    draw(ctx) {
        if (this.hp <= 0) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height - 10);
            ctx.fillStyle = '#1c2b1e'; // Sombra
            ctx.fillRect(-60, 0, 120, 6);
            
            ctx.fillStyle = '#27ae60'; // Tumbado cuerpo verde
            ctx.fillRect(-50, -16, 100, 16);
            
            ctx.fillStyle = '#784212'; // Ropa/Chaleco
            ctx.fillRect(-30, -16, 60, 16);
            
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(-55, -28, 20, 4); // Espada rota
            
            ctx.restore();
            return;
        }

        ctx.save();

        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        if (this.phase === 2) {
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 15;
        } else if (this.state === 'block') {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 2, 45, 8, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.facing, 1);

        const xOffset = -this.width/2;
        const yOffset = -this.height/2;

        // 1. Cabeza gigante verde
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(xOffset + 30, yOffset + 10, 50, 45);

        // Orejas goblin gigantes
        ctx.beginPath();
        ctx.moveTo(xOffset + 30, yOffset + 25);
        ctx.lineTo(xOffset + 5, yOffset + 15);
        ctx.lineTo(xOffset + 30, yOffset + 35);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xOffset + 80, yOffset + 25);
        ctx.lineTo(xOffset + 105, yOffset + 15);
        ctx.lineTo(xOffset + 80, yOffset + 35);
        ctx.closePath();
        ctx.fill();

        // Ojos rojos malvados
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(xOffset + 55, yOffset + 22, 10, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(xOffset + 59, yOffset + 22, 2, 8);

        // Nariz goblin
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(xOffset + 60, yOffset + 30);
        ctx.lineTo(xOffset + 75, yOffset + 36);
        ctx.lineTo(xOffset + 60, yOffset + 42);
        ctx.closePath();
        ctx.fill();

        // 2. Cuerpo colosal con armadura marrón/oro
        ctx.fillStyle = '#784212';
        ctx.fillRect(xOffset + 20, yOffset + 55, 70, 50);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(xOffset + 35, yOffset + 55, 4, 50);
        ctx.fillRect(xOffset + 71, yOffset + 55, 4, 50);

        ctx.fillStyle = '#34495e';
        ctx.fillRect(xOffset + 20, yOffset + 95, 70, 10);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(xOffset + 50, yOffset + 93, 10, 14);

        // 3. Piernas y Zapatos
        ctx.fillStyle = '#2ecc71';
        const bounce = (this.state === 'chase' && Math.floor(this.animTime / 8) % 2 === 0) ? 6 : 0;
        ctx.fillRect(xOffset + 25, yOffset + 105 - bounce, 18, 25);
        ctx.fillRect(xOffset + 67, yOffset + 105 + bounce, 18, 25);

        ctx.fillStyle = '#4a2700';
        ctx.fillRect(xOffset + 15, yOffset + 126 - bounce, 30, 9);
        ctx.fillRect(xOffset + 65, yOffset + 126 + bounce, 30, 9);

        // 4. Armamento
        if (this.state === 'block' || this.isBlocking) {
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(xOffset + 75, yOffset + 25, 25, 65);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.strokeRect(xOffset + 75, yOffset + 25, 25, 65);
            
            ctx.fillStyle = '#9b1e1e';
            ctx.fillRect(xOffset + 85, yOffset + 35, 5, 45);
            ctx.fillRect(xOffset + 80, yOffset + 50, 15, 5);
        } else {
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(xOffset - 10, yOffset + 45, 22, 50);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2;
            ctx.strokeRect(xOffset - 10, yOffset + 45, 22, 50);
        }

        ctx.save();
        if (this.state === 'slashPre') {
            ctx.translate(xOffset + 85, yOffset + 50);
            ctx.rotate(-Math.PI * 0.45);
        } else if (this.state === 'slashStrike') {
            const strikeProgress = (24 - this.stateTimer) / 24;
            ctx.translate(xOffset + 85, yOffset + 55);
            ctx.rotate(-Math.PI * 0.3 + strikeProgress * Math.PI * 1.15);
        } else {
            ctx.translate(xOffset + 85, yOffset + 75);
            ctx.rotate(Math.PI * 0.15);
        }

        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-4, 0, 8, 18);
        ctx.fillRect(-16, 18, 32, 6);
        
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(-7, -85, 14, 85);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -80, 4, 80);

        ctx.restore();

        ctx.restore();
    }
}

// ==========================================================================
// MINI BOSS SECRETO MUNDO 4: CENTINELA DEL CIELO
// ==========================================================================
export class SkySentinelMiniBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 58;
        this.height = 76;
        this.maxHp = 350;
        this.hp = 350;
        this.active = true;
        this.damage = 18;
        this.facing = -1;
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.5;
        this.isGrounded = false;
        this.hurtTimer = 0;
        this.attackTimer = 0;
        this.cooldown = 80;
        this.windCooldown = 100;
        this.animTime = 0;
    }

    update(player, floorY, arrows) {
        if (!this.active) return;

        if (this.hurtTimer > 0) this.hurtTimer--;
        if (this.cooldown > 0) this.cooldown--;
        if (this.windCooldown > 0) this.windCooldown--;
        if (this.attackTimer > 0) this.attackTimer--;
        this.animTime++;

        const dx = player ? (player.x + player.width / 2) - (this.x + this.width / 2) : 0;
        const dist = Math.abs(dx);
        this.facing = dx >= 0 ? 1 : -1;

        if (player && player.hp > 0 && this.windCooldown <= 0 && dist > 110 && dist < 450) {
            this.windCooldown = 140 + Math.random() * 50;

            const projX = this.facing === 1 ? this.x + this.width : this.x - 24;
            const projY = this.y + this.height / 2 - 8;

            const targetX = player.x + player.width / 2;
            const targetY = player.y + player.height / 2;
            const angle = Math.atan2(targetY - projY, targetX - projX);
            const speed = 4.8;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            if (arrows) {
                arrows.push(new WindGustProjectile(projX, projY, vx, vy, this.damage - 4));
                audio.playSwordSwing();
                particles.spawnDust(projX, projY, 5);
                particles.addFloatingText(this.x + this.width / 2, this.y - 20, "WIND SLICE!", "#d9f6ff", 9, true);
            }
        }

        if (dist > 80) {
            this.vx = this.facing * 1.6;
        } else {
            this.vx = 0;
            if (this.cooldown <= 0) {
                this.attackTimer = 24;
                this.cooldown = 90;
                audio.playSwordSwing();
            }
        }

        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.height >= floorY) {
            this.y = floorY - this.height;
            this.vy = 0;
            this.isGrounded = true;
        }
    }

    takeDamage(amount) {
        if (!this.active) return null;
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 14;

        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width / 2, this.y + this.height / 2, 12, true);
        particles.addFloatingText(this.x + this.width / 2, this.y - 18, `-${amount}`, "#d9f6ff", 10, true);

        if (this.hp <= 0) {
            this.active = false;
            audio.playDeath();
            particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 28, 0);
            particles.addFloatingText(this.x + this.width / 2, this.y - 28, "CENTINELA CAÍDO", "#9ee8ff", 12, true);
            return { type: 'red_coin', x: this.x + this.width / 2 - 8, y: this.y + 12 };
        }

        return null;
    }

    getAttackHitbox() {
        if (this.attackTimer < 8 || this.attackTimer > 18) return null;
        return {
            x: this.facing === 1 ? this.x + this.width - 6 : this.x - 48 + 6,
            y: this.y + 12,
            width: 48,
            height: 42
        };
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.facing, 1);

        const pulse = Math.sin(this.animTime * 0.12) * 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 - 2, 28, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d8edf5';
        ctx.fillRect(-18, -26 + pulse, 36, 48);
        ctx.fillStyle = '#78d9ff';
        ctx.fillRect(-14, -22 + pulse, 28, 8);
        ctx.fillStyle = '#f8fbff';
        ctx.fillRect(-12, -42 + pulse, 24, 18);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, -36 + pulse, 10, 4);

        ctx.fillStyle = '#b7c7d6';
        ctx.fillRect(-24, -12 + pulse, 8, 28);
        ctx.fillRect(16, -12 + pulse, 8, 28);

        ctx.strokeStyle = 'rgba(126, 217, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -4 + pulse, 34, 0, Math.PI * 2);
        ctx.stroke();

        if (this.attackTimer > 0) {
            ctx.fillStyle = '#9ee8ff';
            ctx.fillRect(18, -4 + pulse, 42, 5);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(20, -3 + pulse, 38, 2);
        }

        ctx.restore();
    }
}

export class WindGustProjectile {
    constructor(x, y, vx, vy, damage = 12) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.active = true;
        this.animTime = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.animTime += 0.15;
        if (Math.random() < 0.25) {
            particles.spawnDust(this.x + this.width/2, this.y + this.height/2, 1);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.animTime);

        ctx.strokeStyle = '#d9f6ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 30; i++) {
            const angle = 0.2 * i;
            const r = 2.5 * Math.sqrt(i);
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.restore();
    }
}

class SkyBoltProjectile {
    constructor(x, y, vx, vy, damage = 14) {
        this.x = x;
        this.y = y;
        this.width = 18;
        this.height = 18;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.active = true;
        this.life = 150;
        this.animTime = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.animTime += 0.25;
        if (this.life <= 0) this.active = false;
        if (Math.random() < 0.35) {
            particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 1, 0);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.animTime);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -9, 4, 18);
        ctx.fillStyle = '#9ee8ff';
        ctx.fillRect(-9, -2, 18, 4);
        ctx.strokeStyle = 'rgba(158, 232, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

export class FallenAngelBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 92;
        this.height = 138;
        this.maxHp = 760;
        this.hp = this.maxHp;
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.55;
        this.facing = -1;
        this.state = 'idle';
        this.attackTimer = 0;
        this.cooldown = 90;
        this.burstCooldown = 140;
        this.dashTimer = 0;
        this.hurtTimer = 0;
        this.animTime = 0;
        this.spawnedProjectiles = [];
        this.spawnedShockwaves = [];
        this.shouldTriggerShake = false;
        this.phase = 1;
    }

    update(player, arenaLeft, arenaRight, floorY) {
        this.animTime++;

        if (this.state === 'dead') {
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                this.vy = 0;
            }
            return;
        }

        if (this.hurtTimer > 0) this.hurtTimer--;
        if (this.cooldown > 0) this.cooldown--;
        if (this.burstCooldown > 0) this.burstCooldown--;
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.dashTimer > 0) this.dashTimer--;

        if (this.hp < this.maxHp * 0.5) this.phase = 2;

        const playerCenter = player.x + player.width / 2;
        const selfCenter = this.x + this.width / 2;
        const dx = playerCenter - selfCenter;
        const dist = Math.abs(dx);
        this.facing = dx >= 0 ? 1 : -1;

        if (this.dashTimer > 0) {
            this.vx = this.facing * (this.phase === 2 ? 5.0 : 4.0);
        } else if (this.cooldown <= 0 && dist < 230) {
            this.state = 'slash';
            this.attackTimer = 24;
            this.dashTimer = 18;
            this.cooldown = this.phase === 2 ? 70 : 90;
            this.shouldTriggerShake = true;
            audio.playSwordSwing();
        } else {
            this.state = 'idle';
            this.vx = Math.max(-2.0, Math.min(2.0, dx * 0.012));
        }

        if (this.burstCooldown <= 0 && dist < 720) {
            this.castStormBurst(player);
            this.burstCooldown = this.phase === 2 ? 95 : 135;
        }

        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < arenaLeft + 120) this.x = arenaLeft + 120;
        if (this.x + this.width > arenaRight - 120) this.x = arenaRight - 120 - this.width;
        if (this.y + this.height >= floorY) {
            this.y = floorY - this.height;
            this.vy = 0;
        }
    }

    castStormBurst(player) {
        const spawnX = this.x + this.width / 2 - 9;
        const spawnY = this.y + 34;
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const baseAngle = Math.atan2(targetY - spawnY, targetX - spawnX);
        const speed = this.phase === 2 ? 5.0 : 4.2;
        const spread = this.phase === 2 ? [-0.35, 0, 0.35] : [-0.18, 0.18];

        spread.forEach(offset => {
            const angle = baseAngle + offset;
            this.spawnedProjectiles.push(new SkyBoltProjectile(
                spawnX,
                spawnY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                this.phase === 2 ? 16 : 13
            ));
        });

        audio.playThunder();
        particles.addFloatingText(this.x + this.width / 2, this.y - 22, "TORMENTA!", "#9ee8ff", 10, true);
    }

    takeDamage(amount, knockbackX = 0) {
        if (this.state === 'dead') return;

        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 14;
        this.x += knockbackX * 2;
        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width / 2, this.y + this.height / 2, 16, true);
        particles.addFloatingText(this.x + this.width / 2, this.y - 18, `-${amount}`, "#9ee8ff", 11, true);

        if (this.hp <= 0) {
            this.state = 'dead';
            this.vx = 0;
            this.vy = -5.5;
            this.shouldTriggerShake = true;
            audio.playDeath();
            particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 40, 0);
            particles.addFloatingText(this.x + this.width / 2, this.y - 30, "ÁNGEL CAÍDO", "#ffffff", 13, true);
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        const wingPulse = Math.sin(this.animTime * 0.08) * 5;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.facing, 1);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 - 4, 48, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.phase === 2 ? '#4b1025' : '#26364f';
        ctx.fillRect(-58, -34 + wingPulse, 42, 66);
        ctx.fillRect(16, -34 - wingPulse, 42, 66);
        ctx.fillStyle = this.phase === 2 ? '#9e2445' : '#6aa6c9';
        ctx.fillRect(-64, -20 + wingPulse, 18, 78);
        ctx.fillRect(46, -20 - wingPulse, 18, 78);

        ctx.fillStyle = '#cfd8df';
        ctx.fillRect(-24, -44, 48, 78);
        ctx.fillStyle = '#111827';
        ctx.fillRect(-20, -38, 40, 18);
        ctx.fillStyle = this.phase === 2 ? '#ff5577' : '#9ee8ff';
        ctx.fillRect(-12, -32, 8, 5);
        ctx.fillRect(5, -32, 8, 5);

        ctx.fillStyle = '#f8fbff';
        ctx.fillRect(-18, -68, 36, 24);
        ctx.fillStyle = this.phase === 2 ? '#ff3355' : '#ffffff';
        ctx.fillRect(-13, -62, 7, 5);
        ctx.fillRect(6, -62, 7, 5);

        ctx.strokeStyle = this.phase === 2 ? '#ff5577' : '#d9f6ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(20, -10);
        ctx.lineTo(72, this.attackTimer > 0 ? -8 : 16);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(68, (this.attackTimer > 0 ? -12 : 12), 20, 6);

        ctx.strokeStyle = 'rgba(158, 232, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -16, 48 + Math.sin(this.animTime * 0.1) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
