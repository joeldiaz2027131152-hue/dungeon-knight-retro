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
        this.speed = 1.3;
        this.gravity = 0.5;
        this.isGrounded = false;
        
        // Ataques e Hitboxes
        this.cooldowns = {
            slam: 0,
            summon: 0,
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
            this.speed = 2.0; // Más rápido
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
        
        // Cooldowns iniciales altos para evitar spam
        if (this.state === 'idle' || this.state === 'chase') {
            if (dx < 160 && this.cooldowns.slam <= 0) {
                // Golpe de martillo a corta distancia
                this.state = 'slamPre';
                this.stateTimer = 35; // Tiempo de carga
                this.vx = 0;
            } else if (dx > 300 && this.cooldowns.leap <= 0 && this.phase === 2) {
                // Ataque de salto largo (Fase 2 únicamente)
                this.state = 'leapPre';
                this.stateTimer = 40;
                this.vx = 0;
            } else if (this.cooldowns.summon <= 0 && Math.random() > 0.4) {
                // Invocar proyectiles a distancia
                this.state = 'summon';
                this.stateTimer = 50;
                this.vx = 0;
            } else {
                // Si no hay ataques disponibles, perseguir o reposicionar
                this.state = 'chase';
                this.stateTimer = 50 + Math.random() * 40;
            }
        } else {
            // Regresar a reposo
            this.state = 'idle';
            this.stateTimer = 25 + Math.random() * 25;
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
                // Perseguir al jugador horizontalmente
                const dirX = (player.x + player.width/2 < this.x + this.width/2) ? -1 : 1;
                this.vx = dirX * this.speed;
                this.x += this.vx;
                
                // Detenerse si está muy cerca
                const distance = Math.abs((player.x + player.width/2) - (this.x + this.width/2));
                if (distance < 80) {
                    this.vx = 0;
                    this.state = 'idle';
                    this.stateTimer = 10;
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
        this.cooldowns.slam = 120; // 2 segundos

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
