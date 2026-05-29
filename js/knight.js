/* ==========================================================================
   DUNGEON KNIGHT - FÍSICAS Y ANIMACIÓN DEL CABALLERO (knight.js)
   ========================================================================== */

import { audio } from './audio.js';
import { particles } from './particles.js';

export class Knight {
    constructor(x, y) {
        // Posicionamiento y dimensiones base
        this.x = x;
        this.y = y;
        this.baseWidth = 40;
        this.baseHeight = 58;
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        // Físicas
        this.vx = 0;
        this.vy = 0;
        this.speed = 4.0;
        this.jumpForce = -11.0;
        this.gravity = 0.5;
        this.friction = 0.82;

        // Estados vitales
        this.maxHp = 100;
        this.hp = 100;
        this.maxStamina = 100;
        this.stamina = 100;
        this.coins = 0;
        this.potions = 1;
        this.greatPotions = 0;
        this.berries = 0;
        this.violetBerries = 0;

        // Niveles de estadísticas y almas (Mejoras permanentes)
        this.hpLevel = 1;
        this.staminaLevel = 1;
        this.damageLevel = 1;
        this.redCoins = 0;
        this.greenCoins = 0;
        this.greyCoins = 0;

        // Estado del juego
        this.isGrounded = false;
        this.isCrouching = false;
        this.isBlocking = false;
        this.isRolling = false;
        this.isAttacking = false;
        
        this.facing = 1; // 1 = Derecha, -1 = Izquierda
        
        // Timers y contadores de animación
        this.rollTimer = 0;
        this.rollDuration = 24; // frames (~0.4s)
        this.rollSpeed = 6.5;

        this.attackTimer = 0;
        this.attackDuration = 15; // frames (~0.25s)
        this.attackCooldown = 0;

        this.hurtTimer = 0;
        this.invincibleTimer = 0;
        this.animFrame = 0;
        this.animTime = 0;

        // Estadísticas de combate para victoria
        this.statsCratesBroken = 0;
        this.statsEnemiesKilled = 0;
        this.statsDamageBlocked = 0;
        this.jumpConsumed = false;
        this.rollConsumed = false;
        this.attackConsumed = false;
        this.hitTargets = [];

        // Mecánica de Gancho (Grappling Hook)
        this.isHooked = false;
        this.hookX = 0;
        this.hookY = 0;
        this.hookTargetPlat = null;
        this.platformDropTimer = 0;

        // Mecánica de Ataque Cargado
        this.chargeTimer = 0;
        this.chargeDuration = 60; // 60 frames = 1 segundo
        this.isChargedStriking = false;

        // Armas e inventario
        this.weapon = 'rusty'; // 'rusty' o 'legendary'
        this.shield = 'steel'; // 'steel' o 'reinforced'
        this.hasLegendarySword = false;
        this.hasStormSword = false;
        this.hasReinforcedShield = false;
        this.shieldProtectionBonus = 0;
        this.potionLevel = 1;
        this.flasks = 0;
        this.hasForestKey = false;
        this.hookRangeBonus = 0;
        this.berryHealBonus = 0;
        this.thunderRelicReady = false;
    }

    updateUpgradedStats() {
        const oldMaxHp = this.maxHp;
        this.maxHp = 100 + (this.hpLevel - 1) * 20; // 100 a 180 (Nivel 5)
        if (this.maxHp > oldMaxHp) {
            this.hp += (this.maxHp - oldMaxHp);
        }

        const oldMaxStamina = this.maxStamina;
        this.maxStamina = 100 + (this.staminaLevel - 1) * 15; // 100 a 160
        if (this.maxStamina > oldMaxStamina) {
            this.stamina += (this.maxStamina - oldMaxStamina);
        } else if (this.stamina > this.maxStamina) {
            this.stamina = this.maxStamina;
        }
    }

    getShieldStaminaRegenMultiplier() {
        return this.shield === 'reinforced' ? 1.05 : 1;
    }

    update(input) {
        // Regenerar Estamina (Más lenta para incentivar el uso de bayas)
        if (this.stamina < this.maxStamina && !this.isBlocking) {
            const regenAmount = 0.14 * this.getShieldStaminaRegenMultiplier();
            this.stamina = Math.min(this.maxStamina, this.stamina + regenAmount);
        }

        // Reducir timers
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hurtTimer > 0) this.hurtTimer--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.platformDropTimer > 0) this.platformDropTimer--;

        // Manejar Físicas del Gancho
        if (this.isHooked) {
            const px = this.x + this.width / 2;
            const py = this.y + this.height / 2;
            const dx = this.hookX - px;
            const dy = this.hookY - py;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 25) {
                // ¡Llegamos a la plataforma!
                // Colocar al caballero parado firmemente encima de ella
                if (this.hookTargetPlat) {
                    this.y = this.hookTargetPlat.y - this.height;
                    this.x = this.hookX - this.width / 2;
                }
                this.isHooked = false;
                this.hookTargetPlat = null;
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = true;
                
                audio.playJump(); // Sonido retro suave de llegada
                particles.spawnDust(this.x + this.width / 2, this.y + this.height, 4);
            } else {
                // Moverse rápidamente hacia el gancho
                const pullSpeed = 9.5;
                this.vx = (dx / dist) * pullSpeed;
                this.vy = (dy / dist) * pullSpeed;
                this.x += this.vx;
                this.y += this.vy;
                
                // Si el jugador presiona saltar, atacar o rodar, cancela el gancho
                if (input.jump || input.attack || input.roll) {
                    this.releaseHook(input.jump); // Aporta impulso extra si salta
                }
            }
            return; // Ignorar física estándar de gravedad/teclas al colgarse
        }

        // Manejar Rodamiento (Invulnerabilidad y movimiento forzado)
        if (this.isRolling) {
            this.rollTimer--;
            this.vx = this.facing * this.rollSpeed;
            this.vy = 0; // No le afecta la gravedad en rodada en el aire para simplificar
            this.invincibleTimer = 2; // Invulnerable durante la rodada
            
            // Generar partículas de polvo al rodar
            if (this.rollTimer % 4 === 0) {
                particles.spawnDust(this.x + this.width/2, this.y + this.height, 2);
            }

            if (this.rollTimer <= 0) {
                this.isRolling = false;
                this.height = this.baseHeight; // Recuperar altura normal
            }
            
            // Aplicar velocidad del rodamiento
            this.x += this.vx;
            return; // Saltarse otros controles mientras rueda
        }

        // Manejar Ataque
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.isChargedStriking = false;
            }
        }

        // --- Controles de Entrada ---

        // 1. Agacharse (Teclas S, abajo, o botón virtual)
        const wantCrouch = input.down && this.isGrounded && !this.isAttacking;
        if (wantCrouch) {
            if (!this.isCrouching) {
                this.isCrouching = true;
                this.height = this.baseHeight * 0.55; // Reducir altura del hitbox
                this.y += this.baseHeight * 0.45; // Desplazar hacia abajo para no flotar
            }
            this.vx *= 0.5; // Moverse súper lento al estar agachado
        } else {
            if (this.isCrouching) {
                // Verificar si hay espacio arriba para pararse (opcional, por ahora levantarse directo)
                this.isCrouching = false;
                this.y -= this.baseHeight * 0.45;
                this.height = this.baseHeight;
            }
        }

        // 2. Bloquear (Tecla K, o botón virtual)
        this.isBlocking = input.block && this.isGrounded && !this.isCrouching && !this.isAttacking;

        // 3. Movimiento Lateral (WASD / Flechas)
        if (!this.isCrouching) {
            if (input.left) {
                this.vx = this.isBlocking ? -this.speed * 0.35 : -this.speed;
                this.facing = -1;
            } else if (input.right) {
                this.vx = this.isBlocking ? this.speed * 0.35 : this.speed;
                this.facing = 1;
            } else {
                this.vx *= this.friction; // Aplicar fricción al soltar teclas
            }
        }

        // 4. Saltar (Tecla W, Espacio, o botón virtual)
        if (input.jump) {
            if (!this.jumpConsumed) {
                if (this.isGrounded && !this.isCrouching && !this.isBlocking && !this.isAttacking) {
                    this.vy = this.jumpForce;
                    this.isGrounded = false;
                    this.jumpConsumed = true; // Consumido hasta que suelte el botón
                    audio.playJump();
                    particles.spawnDust(this.x + this.width / 2, this.y + this.height, 6);
                }
            }
        } else {
            this.jumpConsumed = false; // Resetear cuando se suelta el botón
        }

        // 5. Rodar / Esquivar (Tecla L, o botón virtual)
        if (input.roll) {
            if (!this.rollConsumed) {
                if (this.isGrounded && !this.isRolling && this.stamina >= 35 && !this.isAttacking) {
                    this.isRolling = true;
                    this.isCrouching = false;
                    this.rollTimer = this.rollDuration;
                    this.stamina -= 35;
                    this.height = this.baseHeight * 0.55; // Agachado al rodar
                    audio.playJump(); // Sonido rápido de esquiva
                    particles.spawnDust(this.x + this.width/2, this.y + this.height, 4);
                    this.rollConsumed = true; // Consumido hasta que suelte el botón
                }
            }
        } else {
            this.rollConsumed = false; // Resetear cuando se suelta el botón
        }

        // 6. Atacar (Tecla J, click, o botón virtual)
        if (input.attack) {
            if (!this.attackConsumed) {
                if (!this.isAttacking && !this.isBlocking && !this.isRolling && this.attackCooldown <= 0) {
                    this.isAttacking = true;
                    this.attackTimer = this.attackDuration;
                    this.attackCooldown = 22; // Cooldown de ataque
                    this.hitTargets = []; // Limpiar lista de enemigos golpeados en esta ráfaga
                    audio.playSwordSwing();
                    
                    // Impulso hacia adelante en ataque
                    this.vx += this.facing * 2.0;
                    this.attackConsumed = true; // Consumido hasta que suelte el botón
                }
            } else {
                // Si ya está consumido (botón presionado de forma continua), acumular carga
                if (!this.isRolling && !this.isBlocking && !this.isCrouching && this.hp > 0) {
                    this.chargeTimer++;
                    if (this.chargeTimer >= this.chargeDuration) {
                        this.chargeTimer = this.chargeDuration; // Limitar al máximo
                        // Emitir destellos dorados si está completamente cargado
                        if (Math.random() < 0.15) {
                            particles.spawnCollectGlow(this.x + this.width/2, this.y + this.height/2, '#ffd700', 1);
                        }
                    } else {
                        // Partículas celestes mientras carga
                        if (Math.random() < 0.1) {
                            particles.spawnCollectGlow(this.x + this.width/2, this.y + this.height/2, '#00ffcc', 1);
                        }
                    }
                }
            }
        } else {
            // Si suelta el botón y estaba completamente cargado, desatar ataque cargado!
            if (this.chargeTimer >= this.chargeDuration) {
                this.triggerChargedAttack();
            }
            this.chargeTimer = 0;
            this.attackConsumed = false; // Resetear cuando se suelta el botón
        }

        // Aplicar Gravedad
        this.vy += this.gravity;

        // Limitar velocidades extremas
        if (this.vy > 12) this.vy = 12;

        // Actualizar posiciones
        this.x += this.vx;
        this.y += this.vy;

        // Animación bobbing (caminar)
        if (Math.abs(this.vx) > 0.5 && this.isGrounded) {
            this.animTime += 1;
            if (this.animTime >= 6) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animTime = 0;
                // Pequeño humo de polvo al correr
                if (this.animFrame % 2 === 0) {
                    particles.spawnDust(this.x + (this.facing === 1 ? 0 : this.width), this.y + this.height, 1);
                }
            }
        } else {
            this.animFrame = 0;
            this.animTime = 0;
        }
    }

    // Desatar Ataque Cargado
    triggerChargedAttack() {
        const staminaCost = 35;
        if (this.stamina < staminaCost || this.isRolling || this.isBlocking || this.hp <= 0) {
            particles.addFloatingText(this.x + this.width/2, this.y - 20, "NO STAMINA", "#ff3333", 9);
            return;
        }
        this.stamina = Math.max(0, this.stamina - staminaCost);
        this.isAttacking = true;
        this.isChargedStriking = true; // Activar estado cargado
        this.attackTimer = 18; // Duración ligeramente mayor
        this.attackCooldown = 30; // Mayor cooldown
        this.hitTargets = []; // Limpiar enemigos golpeados
        
        audio.playDeath(); // Sonido profundo de impacto (reutilizado de forma retro)
        
        // Fuerte impulso hacia adelante
        this.vx += this.facing * 5.5;
        this.vy = -1.5; // Pequeño impulso aéreo
        
        particles.addFloatingText(this.x + this.width/2, this.y - 25, "CHARGED SLASH!", "#ffd700", 12, true);
        
        // Sacudir la pantalla
        this.shouldTriggerShake = true;
        
        // Explosión masiva de chispas doradas al frente
        particles.spawnSparks(this.x + (this.facing === 1 ? this.width : 0), this.y + this.height/2, 20, this.facing);
    }

    // Ataque Hitbox (Caja de ataque frente al caballero)
    getAttackHitbox() {
        // Para ataques cargados, la ventana de impacto es un poco más larga (entre 4 y 15 frames)
        const maxFrame = this.isChargedStriking ? 15 : 12;
        if (!this.isAttacking || this.attackTimer < 4 || this.attackTimer > maxFrame) {
            return null;
        }
        
        // La caja es significativamente más grande para el ataque cargado
        const hitWidth = this.isChargedStriking ? 75 : 40;
        const hitHeight = this.isChargedStriking ? this.height + 15 : this.height - 10;
        const hitY = this.isChargedStriking ? this.y - 10 : this.y + 5;
        
        return {
            x: this.facing === 1 ? this.x + this.width - 5 : this.x - hitWidth + 5,
            y: hitY,
            width: hitWidth,
            height: hitHeight
        };
    }

    // Recibir Daño (Mecánica de salud, retroceso e invencibilidad)
    takeDamage(amount, knockbackX, sourceX) {
        if (this.hp <= 0 || this.invincibleTimer > 0) return false;

        // 1. Verificar si está bloqueando direccionalmente
        const isDamageFromFront = (sourceX > this.x && this.facing === 1) || (sourceX < this.x && this.facing === -1);
        const blockStaminaCost = 5;
        if (this.isBlocking && isDamageFromFront && this.stamina >= blockStaminaCost) {
            this.stamina = Math.max(0, this.stamina - blockStaminaCost);
            this.statsDamageBlocked += amount;
            
            // Bloqueo exitoso: Reducir daño a 0, hacer chispas de metal y pequeño empujón
            audio.playBlock();
            particles.spawnSparks(
                this.facing === 1 ? this.x + this.width : this.x,
                this.y + this.height / 2,
                8,
                -this.facing
            );
            particles.addFloatingText(this.x + this.width/2, this.y - 15, "BLOCKED", "#0088ff");
            
            this.vx = -this.facing * 2.0; // Knockback reducido
            this.invincibleTimer = 15; // Pequeño margen de invulnerabilidad
            return false; // No recibió daño real
        }

        // 2. Recibir Daño Real
        const finalAmount = Math.max(1, Math.round(amount));
        this.hp = Math.max(0, this.hp - finalAmount);
        this.hurtTimer = 18;
        this.invincibleTimer = 35; // Frames de inmunidad tras golpe
        
        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 10, false);
        particles.addFloatingText(this.x + this.width/2, this.y - 15, `-${finalAmount}`, "#ff3333", 12, true);

        // Sacudida de pantalla (se maneja en game.js usando este flag)
        this.shouldTriggerShake = true;

        // Aplicar retroceso vertical y horizontal
        this.vy = -3.5;
        this.vx = knockbackX;
        this.isGrounded = false;

        if (this.hp <= 0) {
            audio.playDeath();
        }
        return true;
    }

    // Sanar (Poción de vida)
    heal(amount) {
        if (this.hp <= 0) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        audio.playBonfire(); // Sonido mágico de sanar
        particles.spawnCollectGlow(this.x + this.width/2, this.y + this.height/2, '#00ff66', 12);
        particles.addFloatingText(this.x + this.width/2, this.y - 15, `+${amount} HP`, "#00ff66", 11);
    }

    // Beber poción de vida del bulto
    usePotion() {
        if (this.hp <= 0 || this.potions <= 0) return false;
        
        this.potions--;
        // Curar porcentaje de la vida máxima basado en el nivel de poción
        const percentage = this.potionLevel === 1 ? 0.25 : 0.35;
        const amount = Math.round(this.maxHp * percentage);
        this.heal(amount);
        return true;
    }

    // Beber poción mayor del bulto
    useGreatPotion() {
        if (this.hp <= 0 || this.greatPotions <= 0) return false;

        this.greatPotions--;
        const amount = Math.round(this.maxHp * 0.65);
        this.heal(amount);
        return true;
    }

    // Comer bayas silvestres guardadas en la bolsa
    useBerry() {
        if (this.hp <= 0 || this.berries <= 0) return false;

        this.berries--;
        const amount = Math.round(this.maxHp * (0.10 + this.berryHealBonus));
        this.heal(amount);
        return true;
    }

    useVioletBerry() {
        if (this.hp <= 0 || this.violetBerries <= 0) return false;

        this.violetBerries--;
        const hpAmount = Math.round(this.maxHp * (0.15 + this.berryHealBonus));
        const staminaAmount = Math.round(this.maxStamina * 0.10);
        this.heal(hpAmount);
        this.stamina = Math.min(this.maxStamina, this.stamina + staminaAmount);
        particles.addFloatingText(this.x + this.width/2, this.y - 32, `+${staminaAmount} ST`, "#b85cff", 9);
        return true;
    }

    // Recolectar Monedas
    addCoin() {
        this.coins++;
        particles.spawnCollectGlow(this.x + this.width/2, this.y + this.height/2, '#ffd700', 4);
    }

    // Lanzar Gancho de Escalar hacia la plataforma más cercana arriba
    fireHook(platforms) {
        if (this.isRolling || this.hp <= 0) return;

        if (this.isHooked) {
            this.releaseHook(false);
            return;
        }

        const px = this.x + this.width / 2;
        const py = this.y + this.height / 2;
        let closestPlat = null;
        let minDist = 999999;
        let targetX = 0;
        let targetY = 0;

        platforms.forEach(plat => {
            // Buscamos colgarse de la parte superior de la plataforma
            const platCenterX = plat.x + plat.width / 2;
            const platTopY = plat.y;

            const dx = platCenterX - px;
            const dy = platTopY - py;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Debe estar por encima (dy < 10) y dentro del alcance del gancho.
            const hookRange = 280 + (this.hookRangeBonus || 0);
            if (dy < 10 && dist < hookRange && dist < minDist) {
                minDist = dist;
                closestPlat = plat;
                targetX = platCenterX;
                targetY = platTopY;
            }
        });

        if (closestPlat) {
            this.isHooked = true;
            this.hookX = targetX;
            this.hookY = targetY;
            this.hookTargetPlat = closestPlat; // Guardar referencia de la plataforma objetivo
            audio.playJump(); // Reproducir sonido retro
            
            // Estimular las lianas si es una plataforma de madera del bosque
            if (closestPlat.style === 'wood' && closestPlat._vines) {
                closestPlat._vines.forEach(v => {
                    v.swayTime = 4.0;
                });
            }

            // Efectos visuales de enganche
            particles.spawnSparks(targetX, targetY, 6, 0);
            // Destello extra de chispas verdes de hojas
            if (closestPlat.style === 'wood') {
                particles.spawnCollectGlow(targetX, targetY, '#3cb83a', 8);
            }
            particles.addFloatingText(px, py - 20, "HOOK!", "#00ffcc", 10, true);
        } else {
            particles.addFloatingText(px, py - 20, "NO TARGET", "#ff3333", 9, false);
        }
    }

    releaseHook(giveBoost = false) {
        this.isHooked = false;
        this.hookTargetPlat = null;
        if (giveBoost) {
            this.vy = -7.5; // Impulso hacia arriba espectacular para catapultarse
            audio.playJump();
            particles.spawnDust(this.x + this.width/2, this.y + this.height, 4);
        }
    }

    // ==========================================================================
    // DIBUJADO PROCEDURAL DEL CABALLERO (Estilo Pixel Art Retro)
    // ==========================================================================
    draw(ctx, isLightningActive = false) {
        if (this.hp <= 0) {
            this.drawDead(ctx);
            return;
        }

        ctx.save();

        // Parpadeo de invulnerabilidad
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        // Efecto rojo al ser golpeado, aura de rayo al destellar, o aura al cargar ataque
        if (this.hurtTimer > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
        } else if (isLightningActive) {
            // El héroe resplandece en cian brillante al caer el rayo
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 24;
        } else if (this.chargeTimer > 0) {
            if (this.chargeTimer >= this.chargeDuration) {
                // Brillo dorado al estar completamente cargado
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 12;
            } else {
                // Brillo celeste al estar cargando
                ctx.shadowColor = '#00ffcc';
                ctx.shadowBlur = 8;
            }
        }

        // Dibujar Sombra en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 2, this.baseWidth * 0.45, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Espejado según hacia dónde mire (facing)
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.facing, 1);

        const xOffset = -this.width / 2;
        const yOffset = -this.height / 2;

        if (this.isRolling) {
            this.drawRolling(ctx, xOffset, yOffset);
        } else if (this.isCrouching) {
            this.drawCrouching(ctx, xOffset, yOffset);
        } else {
            this.drawNormal(ctx, xOffset, yOffset);
        }

        ctx.restore(); // restaurar espejo
        ctx.restore(); // restaurar principal save

        // Dibujar la barra retro de carga arriba del caballero
        if (this.chargeTimer > 0) {
            const barW = 32;
            const barH = 5;
            const bx = this.x + this.width/2 - barW/2;
            const by = this.y - 18; // Colocar arriba del hitbox
            
            ctx.fillStyle = '#111';
            ctx.fillRect(bx, by, barW, barH);
            
            const progress = this.chargeTimer / this.chargeDuration;
            const fillW = barW * progress;
            
            if (this.chargeTimer >= this.chargeDuration) {
                // Parpadeo en blanco/dorado al estar lleno
                ctx.fillStyle = (Math.floor(this.chargeTimer / 4) % 2 === 0) ? '#ffffff' : '#ffd700';
            } else {
                ctx.fillStyle = '#00ffcc'; // Celeste de carga
            }
            ctx.fillRect(bx, by, fillW, barH);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, barW, barH);
        }
    }

    // Dibujo en estado normal (Parado/Corriendo/Atacando/Bloqueando)
    drawNormal(ctx, x, y) {
        const bounce = (this.animFrame === 1 || this.animFrame === 3) && this.isGrounded ? 3 : 0;
        const runningOffset = this.animFrame === 1 ? 1 : (this.animFrame === 3 ? -1 : 0);

        // 1. Capa trasera: Capa del caballero (roja o azul oscuro)
        ctx.fillStyle = '#6b1111'; // Rojo oscuro
        ctx.fillRect(x + 5 - runningOffset, y + 16 + bounce, 12, 30);
        
        // 2. Piernas y Botas (Acero)
        ctx.fillStyle = '#3e3e4a'; // Metal oscuro
        // Pierna Izquierda
        ctx.fillRect(x + 10 + runningOffset, y + 42 - bounce, 8, 12);
        // Pierna Derecha
        ctx.fillRect(x + 22 - runningOffset, y + 42 + bounce, 8, 12);
        ctx.fillStyle = '#1d1d24'; // Bordes/Zapatos
        ctx.fillRect(x + 8 + runningOffset, y + 52 - bounce, 11, 6);
        ctx.fillRect(x + 21 - runningOffset, y + 52 + bounce, 11, 6);

        // 3. Pecho / Armadura (Gris Acero brillante)
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(x + 8, y + 18 + bounce, 24, 25);
        ctx.fillStyle = '#a3a3c2'; // Brillo
        ctx.fillRect(x + 12, y + 18 + bounce, 6, 25);
        
        // Cinturón dorado
        ctx.fillStyle = '#d1a115';
        ctx.fillRect(x + 8, y + 36 + bounce, 24, 4);

        // 4. Cabeza: Casco de Caballero
        ctx.fillStyle = '#7a7a8a'; // Casco acero
        ctx.fillRect(x + 10, y + bounce, 20, 18);
        ctx.fillStyle = '#4e4e5a'; // Sombra
        ctx.fillRect(x + 10, y + 14 + bounce, 20, 4);
        
        // Visor Casco (Negro con ranura roja brillante gótica)
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 18, y + 4 + bounce, 12, 6);
        ctx.fillStyle = '#ff0000'; // Ranura brillante
        ctx.fillRect(x + 22, y + 6 + bounce, 6, 2);

        // Pluma decorativa en el casco (Roja retro)
        ctx.fillStyle = '#9b1e1e';
        ctx.beginPath();
        ctx.moveTo(x + 12, y + bounce);
        ctx.lineTo(x + 3, y - 6 + bounce);
        ctx.lineTo(x + 10, y - 8 + bounce);
        ctx.closePath();
        ctx.fill();

        // 5. Escudo (si está bloqueando se dibuja al frente, si no, al hombro)
        if (this.isBlocking) {
            ctx.fillStyle = '#5c5c6d'; // Escudo acero
            ctx.fillRect(x + 26, y + 10 + bounce, 10, 28);
            ctx.fillStyle = '#d1a115'; // Borde dorado
            ctx.fillRect(x + 34, y + 10 + bounce, 4, 28);
            ctx.fillRect(x + 26, y + 10 + bounce, 10, 3);
            ctx.fillRect(x + 26, y + 35 + bounce, 10, 3);
            
            // Cruz o emblema en el escudo
            ctx.fillStyle = '#9b1e1e';
            ctx.fillRect(x + 30, y + 16 + bounce, 2, 16);
            ctx.fillRect(x + 28, y + 23 + bounce, 6, 2);
        } else {
            // Escudo en el brazo trasero
            ctx.fillStyle = '#4e4e5a';
            ctx.fillRect(x + 2, y + 16 + bounce, 6, 22);
            ctx.fillStyle = '#9b1e1e'; // Emblema detrás
            ctx.fillRect(x + 4, y + 22 + bounce, 2, 10);
        }

        // 6. Espada (Ataque o parada pasiva)
        if (this.isAttacking) {
            this.drawSwordSlash(ctx, x, y, bounce);
        } else if (!this.isBlocking) {
            // Dibujar espada descansando en la mano delantera
            ctx.save();
            ctx.translate(x + 26, y + 28 + bounce);
            ctx.rotate(Math.PI * 0.15); // Inclinación en descanso
            
            if (this.weapon === 'storm') {
                ctx.fillStyle = '#f4f7ff';
                ctx.fillRect(-2, 0, 4, 6);
                ctx.fillStyle = '#7fdfff';
                ctx.fillRect(-8, 0, 16, 2.5);

                ctx.fillStyle = '#9ee8ff';
                ctx.fillRect(-3, -38, 6, 38);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-1, -36, 2, 36);
            } else if (this.weapon === 'legendary') {
                // Mango de oro
                ctx.fillStyle = '#d1a115';
                ctx.fillRect(-2, 0, 4, 6);
                ctx.fillRect(-8, 0, 16, 2.5); // Guarda más ancha
                
                // Hoja de fuego templado de magma
                ctx.fillStyle = '#ff2200'; // Rojo fuego vivo
                ctx.fillRect(-3, -34, 6, 34); // Hoja más larga y ancha
                ctx.fillStyle = '#ffd700'; // Destello interior dorado/amarillo
                ctx.fillRect(-1, -32, 2, 32);
            } else {
                // Mango dorado
                ctx.fillStyle = '#d1a115';
                ctx.fillRect(-2, 0, 4, 6);
                ctx.fillRect(-6, 0, 12, 2);
                
                // Hoja plateada
                ctx.fillStyle = '#e3e3e3';
                ctx.fillRect(-2, -26, 4, 26);
                ctx.fillStyle = '#b0b0b0'; // Filo oscuro
                ctx.fillRect(0, -26, 2, 26);
            }
            ctx.restore();
        }
    }

    // Dibujo en estado agachado (Crouching)
    drawCrouching(ctx, x, y) {
        // En agachado reducimos la altura corporal. y es el límite del hitbox reducido.
        const cy = y + 10;
        
        // Capa
        ctx.fillStyle = '#6b1111';
        ctx.fillRect(x + 4, cy + 8, 12, 18);

        // Piernas encogidas
        ctx.fillStyle = '#1d1d24';
        ctx.fillRect(x + 6, cy + 20, 28, 8); // Base

        // Armadura
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(x + 8, cy + 6, 24, 15);
        ctx.fillStyle = '#a3a3c2';
        ctx.fillRect(x + 12, cy + 6, 6, 15);

        // Cabeza baja
        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(x + 12, cy - 8, 16, 14);
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 20, cy - 4, 8, 5);
        ctx.fillStyle = '#ff0000'; // Ranura
        ctx.fillRect(x + 23, cy - 3, 4, 2);

        // Escudo bajo
        ctx.fillStyle = '#5c5c6d';
        ctx.fillRect(x + 24, cy + 2, 10, 18);
        ctx.fillStyle = '#d1a115';
        ctx.fillRect(x + 32, cy + 2, 2, 18);
    }

    // Dibujo al rodar (Rolling - Bola acorazada rotando)
    drawRolling(ctx, x, y) {
        // Hacemos que gire según el temporizador de la rodada
        ctx.save();
        ctx.translate(0, 5); // Centrar en el hitbox agachado
        ctx.rotate((this.facing * (this.rollTimer / this.rollDuration) * Math.PI * 4));

        // Dibujar esfera metálica con marcas de armadura
        ctx.fillStyle = '#7a7a8a';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Reflejos metálicos en espiral
        ctx.strokeStyle = '#a3a3c2';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 0.5);
        ctx.stroke();

        // Banda dorada del escudo girando
        ctx.strokeStyle = '#d1a115';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 16, Math.PI, Math.PI * 1.5);
        ctx.stroke();

        // Capa roja envolviendo
        ctx.strokeStyle = '#6b1111';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 17, Math.PI * 0.5, Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    // Ráfaga y Espada en ataque
    drawSwordSlash(ctx, x, y, bounce) {
        ctx.save();
        ctx.translate(x + 22, y + 20 + bounce);
        
        // Rotación de la espada según frame de ataque
        // attackTimer va de 15 a 0. Golpe definitivo ocurre en el medio (~8)
        const progress = (15 - this.attackTimer) / 15;
        const angle = -Math.PI * 0.4 + (progress * Math.PI * 1.25);
        ctx.rotate(angle);

        // Dibujar espada atacando
        if (this.weapon === 'storm') {
            ctx.fillStyle = '#f4f7ff';
            ctx.fillRect(-2, 0, 4, 8);
            ctx.fillStyle = '#7fdfff';
            ctx.fillRect(-10, 8, 20, 4);
            ctx.fillStyle = '#9ee8ff';
            ctx.fillRect(-4, -48, 8, 48);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1.5, -46, 3, 44);
        } else if (this.weapon === 'legendary') {
            ctx.fillStyle = '#d1a115'; // Mango de oro
            ctx.fillRect(-2, 0, 4, 8);
            ctx.fillRect(-10, 8, 20, 4); // Guarda más grande
            ctx.fillStyle = '#ff2200'; // Hoja de energía de magma
            ctx.fillRect(-4, -42, 8, 42); // Hoja más larga y ancha
            ctx.fillStyle = '#ffea00'; // Filo de fuego amarillo brillante
            ctx.fillRect(-1.5, -40, 3, 38);
        } else {
            ctx.fillStyle = '#d1a115'; // Mango
            ctx.fillRect(-2, 0, 4, 8);
            ctx.fillRect(-8, 8, 16, 3);
            ctx.fillStyle = '#fff'; // Hoja brillante de ataque
            ctx.fillRect(-3, -32, 6, 32);
        }

        ctx.restore();

        // Dibujar el arco de ataque (Slash arc) - Solo en frames centrales
        if (this.attackTimer >= 4 && this.attackTimer <= 11) {
            ctx.save();
            ctx.translate(x + 28, y + 16);
            ctx.globalAlpha = 0.7;
            
            // Si es un ataque cargado, el espadazo es dorado y mucho más grande!
            let slashRadius = this.isChargedStriking ? 58 : 38;
            if (this.weapon === 'storm') {
                slashRadius = this.isChargedStriking ? 82 : 56;
            } else if (this.weapon === 'legendary') {
                slashRadius = this.isChargedStriking ? 75 : 50;
            }
            const startAngle = this.isChargedStriking ? -Math.PI * 0.45 : -Math.PI * 0.4;
            const endAngle = this.isChargedStriking ? Math.PI * 0.45 : Math.PI * 0.4;
            
            const slashGrad = ctx.createRadialGradient(0, 0, 10, 15, 0, slashRadius);
            if (this.weapon === 'storm') {
                slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
                slashGrad.addColorStop(0.35, 'rgba(158, 232, 255, 0.9)');
                slashGrad.addColorStop(0.75, 'rgba(60, 160, 255, 0.65)');
                slashGrad.addColorStop(1, 'rgba(60, 160, 255, 0)');
            } else if (this.weapon === 'legendary') {
                if (this.isChargedStriking) {
                    slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.99)');  // Núcleo brillante blanco fuego
                    slashGrad.addColorStop(0.25, 'rgba(255, 200, 0, 0.95)'); // Amarillo incandescente
                    slashGrad.addColorStop(0.65, 'rgba(255, 60, 0, 0.85)');  // Naranja magma vivo
                    slashGrad.addColorStop(1, 'rgba(160, 0, 0, 0)');         // Rojo ceniza desvanecido
                } else {
                    slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');  // Núcleo blanco
                    slashGrad.addColorStop(0.45, 'rgba(255, 90, 0, 0.85)');  // Naranja ígneo
                    slashGrad.addColorStop(1, 'rgba(160, 0, 0, 0)');         // Rojo ceniza
                }
            } else {
                if (this.isChargedStriking) {
                    slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)'); // Núcleo brillante
                    slashGrad.addColorStop(0.4, 'rgba(255, 215, 0, 0.85)'); // Dorado intenso
                    slashGrad.addColorStop(0.8, 'rgba(255, 102, 0, 0.5)');  // Naranja fuego
                    slashGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                } else {
                    slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                    slashGrad.addColorStop(0.5, 'rgba(100, 200, 255, 0.6)');
                    slashGrad.addColorStop(1, 'rgba(0, 100, 255, 0)');
                }
            }

            ctx.fillStyle = slashGrad;
            ctx.beginPath();
            // Arco de ataque en dirección de facing
            ctx.arc(10, 0, slashRadius, startAngle, endAngle);
            ctx.lineTo(10, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // Muerte del caballero (Tumbado en el suelo, espada clavada rota)
    drawDead(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height - 12);

        // Dibujar caballero tumbado (rectángulos horizontales)
        ctx.fillStyle = '#6b1111'; // Capa aplastada
        ctx.fillRect(-24, 0, 42, 6);

        ctx.fillStyle = '#4e4e5a'; // Armadura opaca
        ctx.fillRect(-20, -8, 36, 8);
        
        ctx.fillStyle = '#3e3e4a'; // Casco tumbado
        ctx.fillRect(8, -12, 14, 12);
        ctx.fillStyle = '#111'; // Visor apagado
        ctx.fillRect(14, -8, 6, 4);

        // Escudo roto a un lado
        ctx.fillStyle = '#5c5c6d';
        ctx.beginPath();
        ctx.arc(-16, -2, 10, Math.PI, Math.PI * 2);
        ctx.fill();

        // Espada clavada rota en el suelo
        ctx.translate(-30, -10);
        ctx.rotate(-Math.PI * 0.15);
        ctx.fillStyle = '#d1a115';
        ctx.fillRect(-2, 12, 4, 6); // mango
        ctx.fillRect(-5, 12, 10, 2);
        ctx.fillStyle = '#888'; // Hoja de piedra / rota
        ctx.fillRect(-2, 0, 4, 12);

        ctx.restore();
    }
}
export default Knight;
