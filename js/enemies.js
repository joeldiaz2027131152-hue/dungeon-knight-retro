/* ==========================================================================
   DUNGEON KNIGHT - OBSTÁCULOS Y ENEMIGOS MENORES (enemies.js)
   ========================================================================== */

import { audio } from './audio.js';
import { particles } from './particles.js';

// ==========================================================================
// ÍTEMS SOLTADOS (Loot: Monedas doradas y Pociones de salud que rebotan)
// ==========================================================================
export class LootItem {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.type = type; // 'coin' o 'heart'

        // Lanzamiento inicial y gravedad
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -5 - Math.random() * 3;
        this.gravity = 0.45;
        this.bounceCount = 0;
        this.isGrounded = false;
        
        this.life = 400; // Desaparece si no se recoge en ~7 segundos
        this.pulseTime = 0;
    }

    update(floorY, platforms = []) {
        // Las monedas normales y curaciones expiran, pero los frascos, almas y llaves únicos nunca desaparecen para evitar perder mejoras permanentes!
        if (!['coin', 'heart', 'great_heart', 'berry', 'violet_berry'].includes(this.type)) {
            this.life = Math.max(this.life, 400); // Mantener vida siempre arriba
        } else {
            this.life--;
        }
        this.pulseTime += 0.08;

        if (!this.isGrounded) {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;

            // Detección de colisión con plataformas flotantes (one-way)
            if (this.vy >= 0 && platforms.length > 0) {
                for (let plat of platforms) {
                    if (this.x + this.width > plat.x &&
                        this.x < plat.x + plat.width &&
                        this.y + this.height >= plat.y &&
                        this.y + this.height - this.vy <= plat.y + 10) {
                        
                        this.y = plat.y - this.height;
                        if (this.bounceCount < 2) {
                            this.vy = -this.vy * 0.45; // Rebote
                            this.vx *= 0.6;
                            this.bounceCount++;
                        } else {
                            this.vy = 0;
                            this.vx = 0;
                            this.isGrounded = true;
                        }
                        return;
                    }
                }
            }

            // Detección de suelo
            if (this.y + this.height >= floorY) {
                this.y = floorY - this.height;
                if (this.bounceCount < 2) {
                    this.vy = -this.vy * 0.45; // Rebote
                    this.vx *= 0.6;
                    this.bounceCount++;
                } else {
                    this.vy = 0;
                    this.vx = 0;
                    this.isGrounded = true;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        const pulse = Math.sin(this.pulseTime) * 2;
        
        // Parpadeo cuando le queda poca vida
        if (this.life < 100 && Math.floor(this.life / 6) % 2 === 0) {
            ctx.restore();
            return;
        }

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 2, 6, 2, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.translate(this.x + this.width/2, this.y + this.height/2 + pulse);

        if (this.type === 'coin') {
            // Dibujar Moneda Dorada Reluciente
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#b89700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            
            // Núcleo brillante
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -2, 3, 3);
        } else if (this.type === 'red_coin') {
            // Dibujar Moneda Roja (Vida)
            ctx.fillStyle = '#ff3333';
            ctx.strokeStyle = '#990000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -2, 3, 3);
        } else if (this.type === 'green_coin') {
            // Dibujar Moneda Verde (Estamina)
            ctx.fillStyle = '#00ff66';
            ctx.strokeStyle = '#008833';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -2, 3, 3);
        } else if (this.type === 'grey_coin') {
            // Dibujar Moneda Gris (Daño)
            ctx.fillStyle = '#b0b0b0';
            ctx.strokeStyle = '#5a5a6a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -2, 3, 3);
        } else if (this.type === 'heart') {
            // Dibujar Poción de Vida Roja Gótica
            ctx.fillStyle = '#111'; // Tapón
            ctx.fillRect(-2, -7, 4, 3);
            ctx.fillStyle = '#a3a3a3'; // Cristal
            ctx.strokeRect(-4, -4, 8, 8);
            
            ctx.fillStyle = '#ff0033'; // Líquido curativo brillante
            ctx.fillRect(-3, -2, 6, 5);
            ctx.fillStyle = '#ffffff'; // Destello del cristal
            ctx.fillRect(-2, -2, 2, 2);
        } else if (this.type === 'great_heart') {
            // Dibujar Poción de Vida Mayor Morada/Azul
            ctx.fillStyle = '#111'; // Tapón
            ctx.fillRect(-2, -7, 4, 3);
            ctx.fillStyle = '#a3a3a3'; // Cristal
            ctx.strokeRect(-4, -4, 8, 8);
            
            ctx.fillStyle = '#6633ff'; // Líquido curativo mayor morado
            ctx.fillRect(-3, -2, 6, 5);
            ctx.fillStyle = '#ffffff'; // Destello del cristal
            ctx.fillRect(-2, -2, 2, 2);
        } else if (this.type === 'sword') {
            // Dibujar Espada de Fuego
            ctx.save();
            ctx.rotate(Math.PI / 4); // Rotada 45 grados

            // Empuñadura
            ctx.fillStyle = '#d1a115'; // Oro
            ctx.fillRect(-1, 5, 2, 4); // Mango
            ctx.fillRect(-3, 4, 6, 2); // Guarda

            // Hoja templada (Rojo/morado brillante de magma)
            ctx.fillStyle = '#ff0033'; // Crimson
            ctx.fillRect(-1.5, -7, 3, 11);
            
            // Núcleo brillante
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-0.5, -6, 1, 10);

            ctx.restore();
            
            // Aura brillante a su alrededor
            ctx.strokeStyle = 'rgba(255, 51, 51, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 9 + Math.sin(this.pulseTime * 2) * 1.5, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'storm_sword') {
            // Dibujar Espada de la Tormenta
            ctx.save();
            ctx.rotate(Math.PI / 4);

            ctx.fillStyle = '#f4f7ff';
            ctx.fillRect(-1.5, 5, 3, 5);
            ctx.fillStyle = '#7fdfff';
            ctx.fillRect(-4, 4, 8, 2);

            ctx.fillStyle = '#9ee8ff';
            ctx.fillRect(-2, -10, 4, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-0.5, -9, 1, 13);
            ctx.restore();

            ctx.strokeStyle = 'rgba(158, 232, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 10 + Math.sin(this.pulseTime * 3) * 2, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'shield') {
            // Dibujar Escudo Reforzado
            ctx.fillStyle = '#2f7dff';
            ctx.strokeStyle = '#d9ecff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(8, -4);
            ctx.lineTo(6, 5);
            ctx.lineTo(0, 9);
            ctx.lineTo(-6, 5);
            ctx.lineTo(-8, -4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -5, 2, 10);
            ctx.fillRect(-5, -1, 10, 2);

            ctx.strokeStyle = 'rgba(120, 200, 255, 0.65)';
            ctx.beginPath();
            ctx.arc(0, 0, 11 + Math.sin(this.pulseTime * 2) * 1.5, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'flask') {
            // Dibujar Frasco Alquímico (para mejorar poción)
            ctx.fillStyle = '#d1a115'; // Tapón dorado
            ctx.fillRect(-2, -8, 4, 3);
            ctx.fillStyle = '#e3e3e3'; // Cristal
            ctx.strokeRect(-5, -5, 10, 10);
            
            ctx.fillStyle = '#00ffff'; // Líquido azul/celeste brillante
            ctx.fillRect(-4, -2, 8, 6);
            ctx.fillStyle = '#ffffff'; // Destello
            ctx.fillRect(-2, -3, 2, 2);
            
            // Aura brillante celeste
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 10 + Math.sin(this.pulseTime * 2) * 1.5, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'forest_key') {
            // Dibujar Llave Goblínica Verde/Dorada
            ctx.fillStyle = '#d1a115'; // Oro/Bronce
            ctx.fillRect(-2, -6, 4, 3); // Cabeza de la llave
            ctx.fillStyle = '#00ff66'; // Destello mágico verde
            ctx.fillRect(-3, -3, 6, 2);
            ctx.fillStyle = '#d1a115';
            ctx.fillRect(-1, -1, 2, 8); // Cuerpo de la llave
            ctx.fillRect(1, 3, 2, 2);   // Dientes de la llave
            ctx.fillRect(1, 5, 2, 2);
            
            // Aura brillante verde esmeralda
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 10 + Math.sin(this.pulseTime * 2) * 1.5, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'berry') {
            // Dibujar Baya Roja (pequeña baya carmesí gótica con hojas verdes)
            ctx.fillStyle = '#1e824c'; // Hoja verde
            ctx.fillRect(-3, -5, 2, 3);
            ctx.fillRect(1, -5, 2, 3);

            ctx.fillStyle = '#ff2255'; // Baya carmesí brillante
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            // Destello blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1.5, -1.5, 2, 2);

            // Aura brillante roja
            ctx.strokeStyle = 'rgba(255, 51, 85, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 8 + Math.sin(this.pulseTime * 2) * 1.2, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'violet_berry') {
            // Dibujar Baya Violeta del mundo 3
            ctx.fillStyle = '#1e824c';
            ctx.fillRect(-3, -5, 2, 3);
            ctx.fillRect(1, -5, 2, 3);

            ctx.fillStyle = '#9b4dff';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f2e7ff';
            ctx.fillRect(-1.5, -1.5, 2, 2);

            ctx.strokeStyle = 'rgba(184, 92, 255, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 8 + Math.sin(this.pulseTime * 2) * 1.2, 0, Math.PI*2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ==========================================================================
// CAJA DE MADERA ROMPIBLE (Crate)
// ==========================================================================
export class Crate {
    constructor(x, y, customDrop = null) {
        this.x = x;
        this.y = y;
        this.width = 38;
        this.height = 38;
        this.active = true;
        this.hp = 1;
        this.customDrop = customDrop;
    }

    takeDamage() {
        if (!this.active) return null;
        this.active = false;
        
        audio.playCrateBreak();
        particles.spawnWoodSplinters(this.x + this.width/2, this.y + this.height/2, 14);

        if (this.customDrop) {
            return new LootItem(this.x + this.width/2 - 8, this.y + this.height/2 - 8, this.customDrop);
        }

        // Decidir loot: 20% de probabilidad de tirar algo (15% Moneda, 5% Poción de Vida) para que solo aparezcan en 1 o 2 cajas por nivel
        const rand = Math.random();
        if (rand < 0.15) {
            return new LootItem(this.x + this.width/2 - 8, this.y + this.height/2 - 8, 'coin');
        } else if (rand < 0.20) {
            return new LootItem(this.x + this.width/2 - 8, this.y + this.height/2 - 8, 'heart');
        }
        return null;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        
        // Sombra de la caja
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(this.x + 2, this.y + this.height - 3, this.width - 4, 4);

        // Cuerpo de madera (Marrón medio con bordes oscuros)
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#4e2f15'; // Bordes oscuros
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Tablas y Refuerzos en X retro
        ctx.strokeStyle = '#5c3317';
        ctx.lineWidth = 2.5;
        // Tablas interiores horizontales
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height * 0.33);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.33);
        ctx.moveTo(this.x, this.y + this.height * 0.66);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.66);
        // Cruz de refuerzo de madera gótica
        ctx.moveTo(this.x + 3, this.y + 3);
        ctx.lineTo(this.x + this.width - 3, this.y + this.height - 3);
        ctx.moveTo(this.x + this.width - 3, this.y + 3);
        ctx.lineTo(this.x + 3, this.y + this.height - 3);
        ctx.stroke();

        // Pequeños remaches metálicos oscuros
        ctx.fillStyle = '#2e2e2e';
        ctx.fillRect(this.x + 4, this.y + 4, 3, 3);
        ctx.fillRect(this.x + this.width - 7, this.y + 4, 3, 3);
        ctx.fillRect(this.x + 4, this.y + this.height - 7, 3, 3);
        ctx.fillRect(this.x + this.width - 7, this.y + this.height - 7, 3, 3);

        ctx.restore();
    }
}

// ==========================================================================
// PICOS EN EL SUELO (Ground Spikes - Trampa baja que obliga a saltar)
// ==========================================================================
export class Spikes {
    constructor(x, y, count = 2) {
        this.x = x;
        this.y = y;
        this.spikeWidth = 20;
        this.width = this.spikeWidth * count;
        this.height = 20;
        this.damage = 10;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#4a4a5a'; // Acero desgastado
        ctx.strokeStyle = '#1d1d24'; // Bordes oxidados
        ctx.lineWidth = 1.5;

        // Dibujar múltiples picos consecutivos en triángulo
        const count = this.width / this.spikeWidth;
        for (let i = 0; i < count; i++) {
            const sx = this.x + (i * this.spikeWidth);
            ctx.beginPath();
            ctx.moveTo(sx, this.y + this.height);
            ctx.lineTo(sx + this.spikeWidth / 2, this.y); // Punta
            ctx.lineTo(sx + this.spikeWidth, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Sangre decorativa en algunas puntas
            if ((i + sx) % 3 === 0) {
                ctx.fillStyle = '#8b0000';
                ctx.beginPath();
                ctx.moveTo(sx + this.spikeWidth / 2, this.y);
                ctx.lineTo(sx + this.spikeWidth / 2 - 3, this.y + 6);
                ctx.lineTo(sx + this.spikeWidth / 2 + 3, this.y + 6);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#4a4a5a'; // Restaurar
            }
        }
        ctx.restore();
    }
}

// ==========================================================================
// CUCHILLA PENDULAR (Ceiling Blade - Trampa alta que exige agacharse/rodar)
// ==========================================================================
export class CeilingBlade {
    constructor(x, anchorY, length = 180) {
        this.anchorX = x;
        this.anchorY = anchorY;
        this.length = length;
        this.bladeRadius = 24;
        
        // Péndulo oscila físicamente
        this.angle = 0;
        this.speed = 0.020;
        this.time = Math.random() * 100; // Desfase
        this.maxAngle = Math.PI * 0.35; // 63 grados de amplitud

        // Posición actual de la cuchilla peligrosa (se calcula en update)
        this.x = x;
        this.y = anchorY + length;
        this.width = this.bladeRadius * 2;
        this.height = this.bladeRadius * 2;
        this.damage = 15;
    }

    update() {
        this.time += this.speed;
        this.angle = Math.sin(this.time) * this.maxAngle;

        // Calcular posición de la punta de la cuchilla giratoria
        this.x = this.anchorX + Math.sin(this.angle) * this.length - this.bladeRadius;
        this.y = this.anchorY + Math.cos(this.angle) * this.length - this.bladeRadius;
    }

    // Colisión de círculo a caja (Para golpear al jugador de forma muy precisa)
    checkCollision(player) {
        const cx = this.x + this.bladeRadius;
        const cy = this.y + this.bladeRadius;

        // Encontrar punto más cercano en el rectángulo del jugador
        const closestX = Math.max(player.x, Math.min(cx, player.x + player.width));
        const closestY = Math.max(player.y, Math.min(cy, player.y + player.height));

        // Distancia
        const distX = cx - closestX;
        const distY = cy - closestY;
        const distanceSquared = (distX * distX) + (distY * distY);

        return distanceSquared < (this.bladeRadius * this.bladeRadius);
    }

    draw(ctx) {
        const cx = this.x + this.bladeRadius;
        const cy = this.y + this.bladeRadius;

        ctx.save();
        
        // 1. Dibujar Soporte en el Techo (anclaje gótico)
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(this.anchorX - 10, this.anchorY, 20, 8);
        ctx.strokeStyle = '#1a1a24';
        ctx.strokeRect(this.anchorX - 10, this.anchorY, 20, 8);

        // 2. Dibujar Cadena/Cadalso de hierro
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.anchorX, this.anchorY + 8);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Dibujar remaches de cadena a lo largo
        ctx.fillStyle = '#1d1d24';
        const chainLinkCount = 8;
        for (let i = 1; i < chainLinkCount; i++) {
            const ratio = i / chainLinkCount;
            const lx = this.anchorX + (cx - this.anchorX) * ratio;
            const ly = this.anchorY + 8 + (cy - (this.anchorY + 8)) * ratio;
            ctx.beginPath();
            ctx.arc(lx, ly, 3.5, 0, Math.PI*2);
            ctx.fill();
        }

        // 3. Dibujar la Gran Cuchilla Circular
        ctx.translate(cx, cy);
        ctx.rotate(this.angle * 4); // La cuchilla rueda locamente mientras oscila

        // Cuerpo de la sierra metálica
        ctx.fillStyle = '#7a7a8a';
        ctx.strokeStyle = '#2d2d3a';
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        const teeth = 12;
        const outerRad = this.bladeRadius;
        const innerRad = this.bladeRadius * 0.7;

        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
            
            // Punta de la sierra
            ctx.lineTo(Math.cos(angle) * outerRad, Math.sin(angle) * outerRad);
            // Hueco
            ctx.lineTo(Math.cos(nextAngle) * innerRad, Math.sin(nextAngle) * innerRad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Detalle interior
        ctx.fillStyle = '#4a4a55';
        ctx.beginPath();
        ctx.arc(0, 0, innerRad * 0.5, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#d1a115'; // Remache central de oro
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================================================
// ENEMIGO MURCIÉLAGO (Vuela a altura media, movimiento sinusoidal de patrulla)
// ==========================================================================
export class BatEnemy {
    constructor(x, y, isFireBat = false) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.width = 32;
        this.height = 24;
        this.isFireBat = isFireBat;
        
        this.vx = -1.6; // Empieza volando a la izquierda
        this.sineSpeed = 0.08;
        this.sineTimer = Math.random() * 100;
        this.sineAmplitude = 18;

        this.maxHp = this.isFireBat ? 80 : 65;
        this.hp = this.maxHp;
        this.active = true;
        this.damage = 8;
        
        this.animFrame = 0;
        this.animTime = 0;

        if (this.isFireBat) {
            this.fireTimer = Math.random() * 100 + 100; // Cada 3-4 segundos
            this.damage = 10;
        }
    }

    update(player, arrows) {
        if (!this.active) return;

        // Vuelo sinusoidal
        this.sineTimer += this.sineSpeed;
        this.x += this.vx;
        this.y = this.baseY + Math.sin(this.sineTimer) * this.sineAmplitude;

        // Animación de alas (rápida)
        this.animTime++;
        if (this.animTime >= 5) {
            this.animFrame = (this.animFrame + 1) % 3;
            this.animTime = 0;
        }

        // Lógica de disparo del murciélago de fuego
        if (this.isFireBat && player && arrows) {
            this.fireTimer--;

            // Emitir chispitas de fuego pasivas mientras vuela
            if (this.animTime === 0 && Math.random() > 0.4) {
                particles.spawnFire(this.x + this.width/2, this.y + this.height/2, 0.5, true);
            }

            if (this.fireTimer <= 0) {
                const distToPlayer = Math.abs(this.x - player.x);
                if (distToPlayer < 450) {
                    this.fireTimer = Math.random() * 120 + 130; // Reset (3-4 segundos)

                    const fireX = this.x + this.width/2 - 7;
                    const fireY = this.y + this.height - 4;
                    const dx = (player.x + player.width/2) - (this.x + this.width/2);
                    const dirX = dx > 0 ? 1 : -1;

                    // Proyectil diagonal hacia el caballero
                    const fireVx = dirX * 1.8;
                    const fireVy = 3.2;

                    arrows.push(new FireballProjectile(fireX, fireY, fireVx, fireVy, 12));
                    
                    audio.playHit(); // Sonido retro de disparo
                    particles.spawnFire(this.x + this.width/2, this.y + this.height, 1.2, true);
                    particles.addFloatingText(this.x + this.width/2, this.y - 12, "SPIT!", "#ff5500", 8, false);
                } else {
                    this.fireTimer = 30; // Volver a chequear pronto si estaba lejos
                }
            }
        }
    }

    takeDamage(amount = 30) {
        if (!this.active) return null;
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 12;

        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 6, false);
        particles.addFloatingText(this.x + this.width/2, this.y - 5, `-${amount}`, "#ff3333");

        if (this.hp > 0) return null;

        this.active = false;
        
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, false);
        particles.addFloatingText(this.x + this.width/2, this.y - 5, "SLAY", "#ff3333");

        // Soltar moneda al morir
        return new LootItem(this.x + this.width/2 - 8, this.y + this.height/2, 'coin');
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.vx > 0 ? -1 : 1, 1); // Orientar al volar

        // Pequeña sombra flotante en el suelo
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        // Se dibuja a una distancia estimada abajo
        ctx.fillRect(-10, 45 - Math.sin(this.sineTimer)*4, 20, 2);

        // Dibujar Murciélago Pixelado
        ctx.fillStyle = this.isFireBat ? '#e65c00' : '#2b233a'; // Cuerpo naranja de fuego o morado oscuro
        ctx.fillRect(-6, -6, 12, 10);
        
        // Cara y ojos de vampiro brillantes
        ctx.fillStyle = '#111';
        ctx.fillRect(-4, -6, 8, 4);
        ctx.fillStyle = this.isFireBat ? '#ffd700' : '#ff0033'; // Ojos amarillos de fuego o rojos
        ctx.fillRect(-3, -5, 1, 1);
        ctx.fillRect(2, -5, 1, 1);

        // Orejas
        ctx.fillStyle = this.isFireBat ? '#e65c00' : '#2b233a';
        ctx.fillRect(-5, -9, 2, 3);
        ctx.fillRect(3, -9, 2, 3);

        // Alas de membrana animadas según frame
        ctx.fillStyle = this.isFireBat ? '#ff3300' : '#1d1726'; // Alas rojas de lava o membranas oscuras
        if (this.animFrame === 0) {
            // Alas extendidas hacia arriba
            ctx.beginPath();
            ctx.moveTo(-6, -2);
            ctx.lineTo(-18, -12);
            ctx.lineTo(-14, -2);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(6, -2);
            ctx.lineTo(18, -12);
            ctx.lineTo(14, -2);
            ctx.closePath();
            ctx.fill();
        } else if (this.animFrame === 1) {
            // Alas horizontales
            ctx.fillRect(-18, -4, 12, 4);
            ctx.fillRect(6, -4, 12, 4);
        } else {
            // Alas replegadas hacia abajo
            ctx.beginPath();
            ctx.moveTo(-6, 2);
            ctx.lineTo(-15, 8);
            ctx.lineTo(-11, 0);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(6, 2);
            ctx.lineTo(15, 8);
            ctx.lineTo(11, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==========================================================================
// ENEMIGO ESQUELETO PEQUEÑO (Patrulla el suelo de un lado a otro y resiste 2 golpes)
// ==========================================================================
export class SkeletonMinion {
    constructor(x, y, hasArmor = false) {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 54;
        this.armorType = hasArmor === 'full' ? 'full' : (hasArmor === 'helmetless' ? 'helmetless' : (hasArmor ? 'armored' : 'normal'));
        this.hasArmor = this.armorType === 'armored' || this.armorType === 'full';

        this.vx = -1.1; // Patrulla a la izquierda inicialmente
        this.gravity = 0.5;
        this.vy = 0;
        
        this.maxHp = (this.armorType === 'full' || this.armorType === 'armored') ? 54 : (this.armorType === 'helmetless' ? 90 : 70);
        this.hp = this.maxHp;
        this.active = true;
        this.damage = 12;

        this.hurtTimer = 0;
        this.animFrame = 0;
        this.animTime = 0;
    }

    update(player) {
        if (!this.active) return;

        if (this.hurtTimer > 0) this.hurtTimer--;

        // Si tiene armadura y el jugador está cerca, perseguirlo agresivamente
        if (this.hasArmor && player) {
            const dx = (player.x + player.width/2) - (this.x + this.width/2);
            const dy = Math.abs(player.y - this.y);
            const dist = Math.abs(dx);

            if (dist < 320 && dy < 140) {
                // Perseguir al caballero a velocidad rápida
                this.vx = dx >= 0 ? 1.8 : -1.8;
                // Acelerar animación de correr
                this.animTime += 0.5;
            } else {
                // Si pierde de vista, volver a velocidad normal de patrullaje
                if (Math.abs(this.vx) > 1.2 || this.vx === 0) {
                    this.vx = this.vx >= 0 ? 1.1 : -1.1;
                }
            }
        }

        // Movimiento terrestre
        this.x += this.vx;

        // Físicas básicas (caída)
        this.vy += this.gravity;
        this.y += this.vy;

        // Animación de caminata bobbing de esqueleto
        this.animTime++;
        if (this.animTime >= 8) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTime = 0;
        }
    }

    takeDamage(amount) {
        if (!this.active) return;

        let displayDamage = amount;
        if (this.hasArmor) {
            // 55% de reducción de daño por tener armadura de placas
            displayDamage = Math.max(1, Math.round(amount * 0.45));
            particles.spawnSparks(this.x + this.width/2, this.y + this.height/2, 8, 0);
            particles.addFloatingText(this.x + this.width/2, this.y - 20, "DEFENDIDO", "#a0a0b0", 8, false);
            audio.playBlock(); // Sonido metálico de armadura bloqueando
        } else {
            audio.playHit();
        }

        this.hp = Math.max(0, this.hp - displayDamage);
        this.hurtTimer = 15;
        
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, true);
        particles.addFloatingText(this.x + this.width/2, this.y - 12, `-${displayDamage}`, this.hasArmor ? "#a0a0b0" : "#ffffff", 9, false);

        // Empujar ligeramente en dirección opuesta
        this.vx = (this.vx > 0 ? -0.8 : 0.8);

        if (this.hp <= 0) {
            this.active = false;
            // Explosión grande de huesos
            audio.playCrateBreak(); // Sonido crujiente
            particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 16, true);
            particles.addFloatingText(this.x + this.width/2, this.y - 12, "BONED", "#b89700", 10, true);
            
            // Suelta siempre una moneda
            return new LootItem(this.x + this.width/2 - 8, this.y + this.height - 20, 'coin');
        }
        return null;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.vx > 0 ? -1 : 1, 1); // Orientar

        // Efecto rojo de daño
        if (this.hurtTimer > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
        }

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, this.height/2 - 2, 12, 3, 0, 0, Math.PI*2);
        ctx.fill();

        const x = -this.width / 2;
        const y = -this.height / 2;

        const bob = (this.animFrame === 1 || this.animFrame === 3) ? 2 : 0;

        // 1. Dibujar Costillas y Columna (Blanco Hueso)
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(x + 14, y + 16 + bob, 6, 18); // columna
        
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 10, y + 20 + bob, 14, 3); // costilla 1
        ctx.fillRect(x + 10, y + 25 + bob, 14, 3); // costilla 2
        ctx.fillRect(x + 11, y + 30 + bob, 12, 3); // pelvis

        // 2. Piernas de hueso
        ctx.fillStyle = '#d0d0d0';
        // Pierna Izquierda patrullando
        const lLegOffset = (this.animFrame === 1) ? 3 : ((this.animFrame === 3) ? -3 : 0);
        ctx.fillRect(x + 10 + lLegOffset, y + 34, 4, 15);
        ctx.fillRect(x + 8 + lLegOffset, y + 49, 7, 5); // pie
        
        // Pierna Derecha
        const rLegOffset = (this.animFrame === 1) ? -3 : ((this.animFrame === 3) ? 3 : 0);
        ctx.fillRect(x + 20 + rLegOffset, y + 34, 4, 15);
        ctx.fillRect(x + 19 + rLegOffset, y + 49, 7, 5); // pie

        // 3. Brazos con espada rota de hueso
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 4, y + 18 + bob, 6, 12); // brazo trasero oscilando

        // Brazo delantero empuñando una pequeña daga de hierro oxidada
        ctx.fillRect(x + 24, y + 20 + bob, 6, 8);
        ctx.fillStyle = '#8b5a2b'; // mango
        ctx.fillRect(x + 30, y + 22 + bob, 3, 4);
        ctx.fillStyle = '#5a5a5a'; // hoja oxidada
        ctx.fillRect(x + 33, y + 12 + bob, 3, 14);

        // 4. Cabeza: Cráneo Esquelético
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(x + 10, y + 2 + bob, 14, 14);
        
        // Cuencas oculares negras con brillo rojo malvado
        ctx.fillStyle = '#111111';
        ctx.fillRect(x + 12, y + 6 + bob, 4, 4);
        ctx.fillRect(x + 18, y + 6 + bob, 4, 4);
        ctx.fillStyle = '#ff3333'; // brillo rojo
        ctx.fillRect(x + 13, y + 7 + bob, 1, 1);
        ctx.fillRect(x + 19, y + 7 + bob, 1, 1);

        // Mandíbula/Dientes
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 12, y + 13 + bob, 10, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 14, y + 13 + bob, 1, 2);
        ctx.fillRect(x + 17, y + 13 + bob, 1, 2);
        ctx.fillRect(x + 20, y + 13 + bob, 1, 2);

        // 5. Dibujar Armadura de Placas de Acero (Si tiene armadura)
        if (this.hasArmor || this.armorType === 'helmetless') {
            ctx.fillStyle = '#8e8e9e'; // Acero gris metálico
            
            // Pechera principal
            ctx.fillRect(x + 8, y + 18 + bob, 18, 14);
            
            // Brillo metálico claro
            ctx.fillStyle = '#c8c8d8';
            ctx.fillRect(x + 12, y + 18 + bob, 3, 14);

            // Hombreras (Pauldrons)
            ctx.fillStyle = '#5a5a6a';
            ctx.fillRect(x + 4, y + 16 + bob, 6, 6);
            ctx.fillRect(x + 24, y + 16 + bob, 6, 6);

            if (this.hasArmor) {
                // Casco gótico
                ctx.fillStyle = '#8e8e9e';
                ctx.fillRect(x + 8, y - 1 + bob, 18, 10);
                
                // Cresta de casco (Acero oscuro)
                ctx.fillStyle = '#4e4e5a';
                ctx.fillRect(x + 15, y - 5 + bob, 4, 4);

                // Visor (Negro con pequeña ranura de brillo de ojos malvados rojos visible)
                ctx.fillStyle = '#111111';
                ctx.fillRect(x + 10, y + 3 + bob, 14, 4);
                ctx.fillStyle = '#ff0033'; // Brillo rojo del visor
                ctx.fillRect(x + 13, y + 4 + bob, 8, 2);
            }
        }

        ctx.restore();
    }
}

// ==========================================================================
// PLATAFORMAS DE PIEDRA FLOTANTES (Gothic Stone Platforms)
// ==========================================================================
export class Platform {
    constructor(x, y, width, height = 25, style = 'stone') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.style = style;
        // Para las lianas: posiciones fijas aleatorias por instancia
        this._vines = [];
        if (style === 'wood' || style === 'bridge') {
            const count = Math.max(2, Math.floor(width / 28));
            for (let i = 0; i < count; i++) {
                this._vines.push({
                    xOff: 8 + (i / count) * (width - 16),
                    len: 18 + Math.floor(Math.random() * 28),
                    sway: Math.random() * Math.PI * 2,
                    swayTime: 0
                });
            }
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.style === 'bridge') {
            // === PUENTE COLGANTE DE MADERA, SOGA Y LIANAS ===
            const now = performance.now ? performance.now() / 1000 : 0;

            // Sogas superiores e inferiores
            ctx.strokeStyle = '#9b7a45';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 4);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y + 10, this.x + this.width, this.y + 4);
            ctx.moveTo(this.x, this.y + this.height - 3);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y + this.height + 4, this.x + this.width, this.y + this.height - 3);
            ctx.stroke();

            // Tablones del puente
            const plankW = 18;
            for (let bx = this.x + 4; bx < this.x + this.width - 4; bx += plankW) {
                const sag = Math.sin(((bx - this.x) / this.width) * Math.PI) * 4;
                ctx.fillStyle = '#6f4524';
                ctx.fillRect(bx, this.y + 6 + sag, plankW - 4, Math.max(6, this.height - 8));
                ctx.strokeStyle = '#3b2208';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx, this.y + 6 + sag, plankW - 4, Math.max(6, this.height - 8));
            }

            // Nudos de soga
            ctx.fillStyle = '#c09a55';
            for (let bx = this.x + 10; bx < this.x + this.width; bx += 42) {
                const sag = Math.sin(((bx - this.x) / this.width) * Math.PI) * 4;
                ctx.fillRect(bx, this.y + 2 + sag, 5, 5);
            }

            // Lianas colgando debajo del puente
            for (const vine of this._vines) {
                const swayX = Math.sin(now * 0.9 + vine.sway) * 3;
                const vx = this.x + vine.xOff;
                const vy = this.y + this.height;
                const len = Math.max(14, vine.len - 10);

                ctx.strokeStyle = '#2d6e29';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(vx, vy);
                ctx.quadraticCurveTo(vx + swayX * 0.5, vy + len * 0.5, vx + swayX, vy + len);
                ctx.stroke();

                ctx.fillStyle = '#3cb83a';
                ctx.beginPath();
                ctx.ellipse(vx + swayX - 4, vy + len * 0.65, 4, 2.5, -0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4cce4a';
                ctx.beginPath();
                ctx.ellipse(vx + swayX, vy + len, 5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (this.style === 'wood') {
            // === PLATAFORMA DE MADERA CON LIANAS ===
            // Cuerpo de madera oscura
            ctx.fillStyle = '#5c3a1e';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Contorno grueso
            ctx.strokeStyle = '#3b2208';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Vetas de madera horizontales
            const plankW = 36;
            const totalPlanks = Math.ceil(this.width / plankW);
            for (let i = 0; i < totalPlanks; i++) {
                const bx = this.x + i * plankW;
                // Línea de separación de tablones
                if (i > 0 && bx < this.x + this.width) {
                    ctx.fillStyle = '#3b2208';
                    ctx.fillRect(bx, this.y, 2, this.height);
                }
                // Veta de luz en el tablón
                ctx.fillStyle = '#7a4e28';
                ctx.fillRect(bx + 3, this.y + 3, Math.min(plankW - 8, this.x + this.width - bx - 6), 3);
            }

            // Borde superior brillante (musgo verde)
            ctx.fillStyle = '#3d8b37';
            ctx.fillRect(this.x, this.y, this.width, 4);
            // Manchas de musgo más oscuro
            ctx.fillStyle = '#2a6127';
            for (let m = 6; m < this.width; m += 22) {
                ctx.fillRect(this.x + m, this.y, 10, 4);
            }

            // Lianas colgantes con hojas
            const now = performance.now ? performance.now() / 1000 : 0;
            for (const vine of this._vines) {
                if (vine.swayTime > 0) {
                    vine.swayTime -= 0.035; // decaimiento suave
                } else {
                    vine.swayTime = 0;
                }
                const activeSwayAmt = 3 + (vine.swayTime * 6.5);
                const activeFreq = 0.8 + (vine.swayTime * 1.6);
                const swayX = Math.sin(now * activeFreq + vine.sway) * activeSwayAmt;
                const vx = this.x + vine.xOff;
                const vy = this.y + this.height;

                // Tallo de la liana (línea verde oscuro)
                ctx.strokeStyle = '#2d6e29';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(vx, vy);
                ctx.quadraticCurveTo(vx + swayX * 0.5, vy + vine.len * 0.5, vx + swayX, vy + vine.len);
                ctx.stroke();

                // Hojas a lo largo del tallo
                const leafPositions = [0.3, 0.6, 0.9];
                for (const t of leafPositions) {
                    const lx = vx + swayX * t;
                    const ly = vy + vine.len * t;
                    // Hoja izquierda
                    ctx.fillStyle = '#3cb83a';
                    ctx.beginPath();
                    ctx.ellipse(lx - 6, ly, 5, 3, -0.4, 0, Math.PI * 2);
                    ctx.fill();
                    // Hoja derecha
                    ctx.fillStyle = '#2fa32d';
                    ctx.beginPath();
                    ctx.ellipse(lx + 6, ly, 5, 3, 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Hoja final (grande) al extremo
                ctx.fillStyle = '#4cce4a';
                ctx.beginPath();
                ctx.ellipse(vx + swayX, vy + vine.len, 6, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }

        } else {
            // === PLATAFORMA DE PIEDRA (estilo original) ===
            ctx.fillStyle = '#3a3542';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.strokeStyle = '#1d1924';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Bloques de piedra
            ctx.fillStyle = '#564f63';
            const blockSize = 32;
            const totalBlocks = Math.ceil(this.width / blockSize);
            for (let i = 0; i < totalBlocks; i++) {
                const bx = this.x + (i * blockSize);
                ctx.fillRect(bx + 2, this.y + 2, Math.min(blockSize - 4, this.x + this.width - bx - 4), 3);
                ctx.fillStyle = '#1d1924';
                if (i > 0 && bx < this.x + this.width) {
                    ctx.fillRect(bx, this.y, 2, this.height);
                }
                ctx.fillStyle = '#564f63';
            }

            // Musgo gótico inferior
            ctx.fillStyle = '#221929';
            for (let j = 4; j < this.width; j += 16) {
                ctx.fillRect(this.x + j, this.y + this.height - 4, 8, 4);
            }
        }

        ctx.restore();
    }
}

// ==========================================================================
// TRAMPA DE FUEGO TERRESTRE (Fire Trap)
// ==========================================================================
export class FireTrap {
    constructor(x, y, width = 45) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 16;
        this.damage = 1.2; // Daño continuo por frame

        // Estado del ciclo de fuego
        this.state = 0; // 0 = Inactivo, 1 = Advertencia, 2 = Activo
        this.timer = 0;
        this.cycleDurations = [180, 60, 90]; // Tiempos para cada estado (Inactivo, Advertencia, Activo)
    }

    update(player) {
        this.timer++;
        if (this.timer >= this.cycleDurations[this.state]) {
            this.state = (this.state + 1) % 3;
            this.timer = 0;
        }

        const cx = this.x + this.width / 2;

        if (this.state === 1) {
            // Estado advertencia: soltar chispas pequeñas
            if (Math.random() < 0.25) {
                particles.spawnFire(cx + (Math.random() - 0.5) * this.width, this.y, 0.4);
            }
        } else if (this.state === 2) {
            // Estado activo: emitir fuego potente
            particles.spawnFire(cx + (Math.random() - 0.5) * this.width, this.y, 1.3);
            if (Math.random() < 0.2) {
                particles.spawnCollectGlow(cx + (Math.random() - 0.5) * this.width, this.y - 30, '#ff4500', 1);
            }

            // Colisión con el jugador (daño de fuego pesado)
            if (this.checkCollision(player)) {
                player.takeDamage(10, (player.x + player.width/2 > cx ? 4.0 : -4.0), cx);
            }
        }
    }

    checkCollision(player) {
        // Altura del fuego activo sube aprox 70px
        const fireHeight = 70;
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y - fireHeight;
    }

    draw(ctx) {
        ctx.save();

        // 1. Dibujar Rejilla metálica de la trampa en el suelo
        ctx.fillStyle = '#26242e';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#131117';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Ranuras metálicas
        ctx.fillStyle = '#131117';
        for (let i = 6; i < this.width; i += 10) {
            ctx.fillRect(this.x + i, this.y + 2, 4, this.height - 4);
        }

        // 2. Dibujar efectos visuales según estado
        if (this.state === 1) {
            // Advertencia: brillo rojo/naranja latente
            const alpha = 0.4 + Math.sin(this.timer * 0.15) * 0.3;
            ctx.fillStyle = `rgba(255, 68, 0, ${alpha})`;
            ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        } else if (this.state === 2) {
            // Núcleo de fuego ardiente
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + this.width/2 - 6, this.y + 4, 12, this.height - 8);
        }

        ctx.restore();
    }
}

// ==========================================================================
// PROYECTIL DE FLECHA (Arrow Projectile)
// ==========================================================================
export class ArrowProjectile {
    constructor(x, y, vx, damage = 10, vy = 0) {
        this.x = x;
        this.y = y;
        this.width = 18;
        this.height = 6;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Orientar flecha en la dirección exacta de su velocidad 2D
        ctx.rotate(Math.atan2(this.vy, this.vx));

        // Astil de madera de la flecha
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(-9, -1, 14, 2);

        // Plumas traseras (blancas)
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(-9, -3, 3, 2);
        ctx.fillRect(-9, 1, 3, 2);

        // Punta de hierro
        ctx.fillStyle = '#8e8e9e';
        ctx.beginPath();
        ctx.moveTo(5, -3);
        ctx.lineTo(9, 0);
        ctx.lineTo(5, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================================================
// PROYECTIL: BOLA DE FUEGO DEL MURCIÉLAGO (Spit fire)
// ==========================================================================
export class FireballProjectile {
    constructor(x, y, vx, vy, damage = 10) {
        this.x = x;
        this.y = y;
        this.width = 14;
        this.height = 14;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.active = true;
        this.animTime = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.animTime += 0.2;
        
        // Emitir pequeñas partículas de fuego detrás
        if (Math.random() > 0.4) {
            particles.spawnFire(this.x + this.width/2, this.y + this.height/2, 0.6);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);

        // Halo de fuego palpitante
        const pulse = 1.0 + Math.sin(this.animTime) * 0.15;
        ctx.scale(pulse, pulse);

        // Gradiente de fuego radial
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 7);
        grad.addColorStop(0, '#ffffff'); // Núcleo blanco
        grad.addColorStop(0.3, '#ffcc00'); // Amarillo brillante
        grad.addColorStop(0.7, '#ff3300'); // Naranja fuego
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================================================
// ENEMIGO ESQUELETO ARQUERO (Patrulla o se queda quieto y dispara flechas)
// ==========================================================================
export class SkeletonArcher {
    constructor(x, y, hasArmor = false) {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 54;
        this.armorType = hasArmor === 'full' ? 'full' : (hasArmor === 'helmetless' ? 'helmetless' : (hasArmor ? 'armored' : 'normal'));
        this.hasArmor = this.armorType === 'armored' || this.armorType === 'full';

        this.vx = 0; // Se queda parado por defecto si no patrulla o persigue
        this.gravity = 0.5;
        this.vy = 0;

        this.maxHp = (this.armorType === 'full' || this.armorType === 'armored') ? 54 : (this.armorType === 'helmetless' ? 90 : 60);
        this.hp = this.maxHp;
        this.active = true;
        this.damage = 10;

        this.hurtTimer = 0;
        this.facing = -1; // -1 = Izquierda, 1 = Derecha
        
        // Estado de la IA del arquero
        this.aiState = 0; // 0 = Espera/Patrulla, 1 = Tensando Arco, 2 = Cooldown tras disparo
        this.aiTimer = 0;
        this.shootRange = 620;
        this.shootHeightRange = 330;
    }

    update(player, arrows) {
        if (!this.active) return;

        if (this.hurtTimer > 0) this.hurtTimer--;

        // Físicas básicas
        this.vy += this.gravity;
        this.y += this.vy;

        // Determinar orientación y comportamiento hacia el jugador
        const distToPlayerX = player ? player.x + player.width/2 - (this.x + this.width/2) : 0;
        const distToPlayerY = player ? Math.abs((player.y + player.height/2) - (this.y + this.height/2)) : 0;
        
        // Distancia euclidiana 2D para una detección circular perfecta
        const dist = Math.sqrt(distToPlayerX * distToPlayerX + distToPlayerY * distToPlayerY);
        
        // Disparar solo cuando detecta al jugador cerca, evitando lluvia de flechas desde todo el mapa.
        if (player && Math.abs(distToPlayerX) < this.shootRange && distToPlayerY < this.shootHeightRange && dist < this.shootRange + 80) {
            this.facing = distToPlayerX > 0 ? 1 : -1;
            
            // Los arqueros acorazados no caminan hacia el jugador, defienden su posición de forma estática
            this.vx = 0;

            if (this.aiState === 0) {
                this.aiState = 1;
                this.aiTimer = 0;
            }
        } else {
            this.vx = 0;
        }

        // Aplicar movimiento
        this.x += this.vx;

        // Lógica de estados de la IA
        this.aiTimer++;
        if (this.aiState === 1) {
            // Tensando arco
            if (this.aiTimer >= 45) {
                // ¡Disparar flecha!
                const arrowX = this.facing === 1 ? this.x + this.width + 5 : this.x - 20;
                const arrowY = this.y + 18;
                
                // Calcular vector dirección al centro del Caballero para disparo diagonal
                const targetX = player.x + player.width/2;
                const targetY = player.y + player.height/2;
                const dx = targetX - arrowX;
                const dy = targetY - arrowY;
                const distToTarget = Math.sqrt(dx*dx + dy*dy) || 1;
                
                const speed = 7.5;
                const arrowVx = (dx / distToTarget) * speed;
                const arrowVy = (dy / distToTarget) * speed;
                
                arrows.push(new ArrowProjectile(arrowX, arrowY, arrowVx, this.damage, arrowVy));
                
                audio.playSwordSwing(); // Sonido rápido
                
                this.aiState = 2; // Entrar en cooldown
                this.aiTimer = 0;
            }
        } else if (this.aiState === 2) {
            // Cooldown tras disparo
            if (this.aiTimer >= 80) {
                this.aiState = 0;
                this.aiTimer = 0;
            }
        }
    }

    takeDamage(amount) {
        if (!this.active) return null;

        let displayDamage = amount;
        if (this.hasArmor) {
            // 55% de reducción de daño por tener armadura de placas
            displayDamage = Math.max(1, Math.round(amount * 0.45));
            particles.spawnSparks(this.x + this.width/2, this.y + this.height/2, 8, 0);
            particles.addFloatingText(this.x + this.width/2, this.y - 20, "DEFENDIDO", "#a0a0b0", 8, false);
            audio.playBlock(); // Sonido metálico de armadura bloqueando
        } else {
            audio.playHit();
        }

        this.hp = Math.max(0, this.hp - displayDamage);
        this.hurtTimer = 15;

        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, true);
        particles.addFloatingText(this.x + this.width/2, this.y - 12, `-${displayDamage}`, this.hasArmor ? "#a0a0b0" : "#ffffff", 9, false);

        if (this.hp <= 0) {
            this.active = false;
            audio.playCrateBreak();
            particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 16, true);
            particles.addFloatingText(this.x + this.width/2, this.y - 12, "BONED", "#b89700", 10, true);
            
            // Suelta una moneda
            return new LootItem(this.x + this.width/2 - 8, this.y + this.height - 20, 'coin');
        }
        return null;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.facing, 1);

        if (this.hurtTimer > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
        }

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, this.height/2 - 2, 12, 3, 0, 0, Math.PI*2);
        ctx.fill();

        const x = -this.width / 2;
        const y = -this.height / 2;

        // Dibujar cuerpo de esqueleto arquero (color hueso amarillento para catacumbas)
        ctx.fillStyle = '#e2dfd2';
        ctx.fillRect(x + 14, y + 16, 6, 18); // columna
        
        ctx.fillStyle = '#c5c2b5';
        ctx.fillRect(x + 10, y + 20, 14, 3); // costillas
        ctx.fillRect(x + 10, y + 25, 14, 3);
        ctx.fillRect(x + 11, y + 30, 12, 3); // pelvis

        // Piernas
        ctx.fillRect(x + 10, y + 34, 4, 15);
        ctx.fillRect(x + 8, y + 49, 7, 5);
        ctx.fillRect(x + 20, y + 34, 4, 15);
        ctx.fillRect(x + 19, y + 49, 7, 5);

        // Cráneo
        ctx.fillStyle = '#e2dfd2';
        ctx.fillRect(x + 10, y + 2, 14, 14);
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 12, y + 6, 4, 4);
        ctx.fillRect(x + 18, y + 6, 4, 4);
        ctx.fillStyle = '#ff8800'; // Ojos de fuego naranja
        ctx.fillRect(x + 13, y + 7, 1, 1);
        ctx.fillRect(x + 19, y + 7, 1, 1);

        // Mandíbula
        ctx.fillStyle = '#c5c2b5';
        ctx.fillRect(x + 12, y + 13, 10, 3);

        // Brazo trasero y delantero sosteniendo el Arco
        ctx.fillStyle = '#c5c2b5';
        
        if (this.aiState === 1) {
            // TENSANDO ARCO
            ctx.fillRect(x + 20, y + 18, 12, 4);
            
            ctx.strokeStyle = '#8b5a2b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x + 32, y + 20, 16, -Math.PI*0.5, Math.PI*0.5);
            ctx.stroke();

            ctx.strokeStyle = '#e6e6e6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 32, y + 4);
            ctx.lineTo(x + 16, y + 20);
            ctx.lineTo(x + 32, y + 36);
            ctx.stroke();

            ctx.fillStyle = '#ff8800';
            ctx.fillRect(x + 14, y + 19, 16, 2);
            ctx.fillRect(x + 30, y + 18, 3, 4);
        } else {
            // ESTADO DE ESPERA / COOLDOWN
            ctx.fillRect(x + 22, y + 20, 4, 12);
            
            ctx.strokeStyle = '#8b5a2b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x + 24, y + 34, 12, -Math.PI*0.4, Math.PI*0.6);
            ctx.stroke();
            
            ctx.strokeStyle = '#e6e6e6';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + 28, y + 22);
            ctx.lineTo(x + 28, y + 44);
            ctx.stroke();
        }

        // 5. Dibujar Armadura de Placas de Acero (Si tiene armadura)
        if (this.hasArmor || this.armorType === 'helmetless') {
            ctx.fillStyle = '#8e8e9e'; // Acero gris metálico
            
            // Pechera principal
            ctx.fillRect(x + 8, y + 18, 18, 14);
            
            // Brillo metálico claro
            ctx.fillStyle = '#c8c8d8';
            ctx.fillRect(x + 12, y + 18, 3, 14);

            if (this.hasArmor) {
                // Casco gótico
                ctx.fillStyle = '#8e8e9e';
                ctx.fillRect(x + 8, y - 1, 18, 10);
                
                // Cresta del casco
                ctx.fillStyle = '#4e4e5a';
                ctx.fillRect(x + 15, y - 5, 4, 4);

                // Visor (Negro con ranura de brillo de ojos malvados naranja visible)
                ctx.fillStyle = '#111111';
                ctx.fillRect(x + 10, y + 3, 14, 4);
                ctx.fillStyle = '#ff8800'; // Brillo naranja del visor
                ctx.fillRect(x + 13, y + 4, 8, 2);
            }
        }

        ctx.restore();
    }
}

// ==========================================================================
// COFRE DE TESORO (Treasure Chest)
// ==========================================================================
export class TreasureChest {
    constructor(x, y, contentType = 'coins') {
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 30;
        this.opened = false;
        this.contentType = contentType; // 'coins', 'potion', 'great_potion', 'legendary_sword' o 'shield'
    }

    open() {
        if (this.opened) return null;
        this.opened = true;
        audio.playBonfire(); // Sonido mágico de apertura!
        
        // Generar chispas de colores
        particles.spawnSparks(this.x + this.width/2, this.y + this.height/2, 15, 0);
        
        const items = [];
        if (this.contentType === 'coins') {
            // Un botín de exactamente 5 monedas
            const coinsCount = 5;
            for (let i = 0; i < coinsCount; i++) {
                items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'coin'));
            }
        } else if (this.contentType === 'potion') {
            // Una única poción menor
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'heart'));
        } else if (this.contentType === 'great_potion') {
            // Una poción mayor (se usa en el cofre legendario final de nivel 4)
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'great_heart'));
        } else if (this.contentType === 'berry') {
            // Baya roja para curarse cuando el jugador quiera
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'berry'));
        } else if (this.contentType === 'violet_berry') {
            // Baya violeta con vida y estamina
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'violet_berry'));
        } else if (this.contentType === 'legendary_sword') {
            // La Espada de Fuego final
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'sword'));
        } else if (this.contentType === 'shield') {
            // Escudo reforzado escondido en el Mundo 2
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'shield'));
        } else if (this.contentType === 'red_coin') {
            // Alma Roja de Vida
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'red_coin'));
        } else if (this.contentType === 'green_coin') {
            // Alma Verde de Estamina
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'green_coin'));
        } else if (this.contentType === 'grey_coin') {
            // Alma Gris de Daño
            items.push(new LootItem(this.x + this.width/2 - 8, this.y - 10, 'grey_coin'));
        }
        return items;
    }

    draw(ctx) {
        ctx.save();
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(this.x + 2, this.y + this.height - 3, this.width - 4, 4);

        if (!this.opened) {
            // Cofre Cerrado (Madera con adornos dorados)
            ctx.fillStyle = '#5c3a21'; // Madera oscura
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.strokeStyle = '#ffd700'; // Bordes dorados góticos
            ctx.lineWidth = 2.5;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Cerradura retro de metal
            ctx.fillStyle = '#222';
            ctx.fillRect(this.x + this.width/2 - 4, this.y + 10, 8, 8);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(this.x + this.width/2 - 2, this.y + 12, 4, 4);
        } else {
            // Cofre Abierto
            // Tapa inclinada hacia atrás
            ctx.fillStyle = '#442816';
            ctx.fillRect(this.x, this.y - 10, this.width, 10);
            ctx.strokeStyle = '#b89700';
            ctx.strokeRect(this.x, this.y - 10, this.width, 10);
            
            // Oro/luz brillando en el interior
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(this.x + 2, this.y, this.width - 4, 6);
            
            // Caja base
            ctx.fillStyle = '#5c3a21';
            ctx.fillRect(this.x, this.y + 6, this.width, this.height - 6);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y + 6, this.width, this.height - 6);
        }

        ctx.restore();
    }
}

// ==========================================================================
// PUERTA SECRETA (Secret Door - Entrada al nivel 4)
// ==========================================================================
export class SecretDoor {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.active = true;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();

        // Arco gótico de piedra con portal morado
        ctx.fillStyle = '#100518'; // Portal oscuro
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = '#b642f5'; // Borde morado brillante
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Arco interior de piedra
        ctx.strokeStyle = '#5f2b8a';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 20, 18, Math.PI, 0);
        ctx.stroke();

        // Runas flickeando
        if (Math.random() > 0.4) {
            ctx.fillStyle = '#d473ff';
            ctx.fillRect(this.x + 10, this.y + 25, 4, 4);
            ctx.fillRect(this.x + 26, this.y + 35, 4, 4);
            ctx.fillRect(this.x + 18, this.y + 45, 4, 4);
        }

        ctx.restore();
    }
}

// ==========================================================================
// ESTALACTITA DE LAVA (Lava Stalactite - Trampa de gotas del Mundo 2)
// ==========================================================================
export class LavaDroplet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 12;
        this.vy = 0;
        this.gravity = 0.28;
        this.active = true;
        this.damage = 10; // Hace 10% de daño (manejado dinámicamente)
    }

    update(platforms, floorY) {
        this.vy += this.gravity;
        this.y += this.vy;
        
        // Emitir pequeñas partículas de humo/chispa rojas
        if (Math.random() > 0.6) {
            particles.spawnFire(this.x + this.width/2, this.y + this.height/2, 0.4);
        }

        // Colisión con plataformas de piedra (solid/one-way)
        for (let plat of platforms) {
            if (this.vy > 0 &&
                this.x + this.width > plat.x &&
                this.x < plat.x + plat.width &&
                this.y + this.height >= plat.y &&
                this.y + this.height - this.vy <= plat.y + 10) {
                this.explode();
                break;
            }
        }

        // Colisión con el suelo principal
        if (this.y + this.height >= floorY) {
            this.explode();
        }
    }

    explode() {
        this.active = false;
        // Pequeña explosión de chispas de lava
        particles.spawnSparks(this.x + this.width/2, this.y + this.height, 6, 0);
        audio.playHit(); // Sonido sutil
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.fillStyle = '#ff4400';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        
        // Forma de lágrima retro
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height*0.7, this.x + this.width/2, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height*0.7, this.x + this.width/2, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Destello interior blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + this.width/2 - 1, this.y + this.height*0.4, 2, 4);
        ctx.restore();
    }
}

export class LavaStalactite {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 24;
        this.droplets = [];
        this.dropCooldown = 120 + Math.random() * 90; // Gotear cada 2-3.5 segundos
    }

    update(platforms, floorY) {
        this.dropCooldown--;
        if (this.dropCooldown <= 0) {
            this.droplets.push(new LavaDroplet(this.x + this.width/2 - 5, this.y + this.height));
            this.dropCooldown = 150 + Math.random() * 100;
        }

        for (let i = this.droplets.length - 1; i >= 0; i--) {
            const drop = this.droplets[i];
            drop.update(platforms, floorY);
            if (!drop.active) {
                this.droplets.splice(i, 1);
            }
        }
    }

    checkCollision(player) {
        for (let drop of this.droplets) {
            if (drop.active && 
                drop.x + drop.width > player.x &&
                drop.x < player.x + player.width &&
                drop.y + drop.height > player.y &&
                drop.y < player.y + player.height) {
                
                drop.explode();
                // 10% del daño de la vida máxima
                const finalDamage = Math.max(5, Math.round(player.maxHp * 0.1));
                player.takeDamage(finalDamage, 0, drop.x + drop.width/2);
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        // Dibujar el pico de la estalactita (roca volcánica roja-grisácea)
        const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        grad.addColorStop(0, '#3a2d2d');
        grad.addColorStop(0.5, '#4e3333');
        grad.addColorStop(1, '#ff3300'); // Punta de lava incandescente

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#221111';
        ctx.lineWidth = 1.5;

        // Triángulo invertido para la estalactita
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width/2, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Dibujar las gotas activas
        this.droplets.forEach(drop => drop.draw(ctx));
    }
}

/* ==========================================================================
   NUEVOS ENEMIGOS DEL MUNDO 3 (BOSQUE GOBLÍNICO)
   ========================================================================== */

// 1. DUENDE CON ESPADA (GoblinSwordsman)
export class GoblinSwordsman {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 54;

        this.vx = -1.2; // Patrulla a la izquierda inicialmente
        this.gravity = 0.5;
        this.vy = 0;
        
        this.maxHp = 90; // Resiste 2-3 golpes según arma equipada
        this.hp = this.maxHp;
        this.active = true;
        this.damage = 12;

        this.hurtTimer = 0;
        this.animFrame = 0;
        this.animTime = 0;
        
        this.chaseRange = 320;
    }

    update(player) {
        if (!this.active) return;

        if (this.hurtTimer > 0) this.hurtTimer--;

        // Gravedad
        this.vy += this.gravity;
        this.y += this.vy;

        // IA de Persecución
        if (player) {
            const dx = (player.x + player.width/2) - (this.x + this.width/2);
            const dy = Math.abs(player.y - this.y);
            const dist = Math.abs(dx);

            if (dist < this.chaseRange && dy < 100) {
                // Perseguir al caballero con velocidad incrementada
                this.vx = dx > 0 ? 1.8 : -1.8;
            } else {
                // Patrullar perezosamente
                if (Math.abs(this.vx) > 1.3) {
                    this.vx = this.vx > 0 ? 1.2 : -1.2;
                }
            }
        }

        this.x += this.vx;

        // Animación de caminata gótica
        this.animTime++;
        if (this.animTime >= 6) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTime = 0;
        }
    }

    takeDamage(amount) {
        if (!this.active) return null;
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 15;
        
        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, true);
        particles.addFloatingText(this.x + this.width/2, this.y - 12, `-${amount}`, "#ffffff", 9, false);

        // Empujar ligeramente
        this.vx = this.vx > 0 ? -1.0 : 1.0;

        if (this.hp <= 0) {
            this.active = false;
            audio.playCrateBreak();
            particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 16, true);
            particles.addFloatingText(this.x + this.width/2, this.y - 12, "DEFEATED", "#2ecc71", 10, true);
            
            return new LootItem(this.x + this.width/2 - 8, this.y + this.height - 20, 'coin');
        }
        return null;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 2, 14, 3, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.vx > 0 ? 1 : -1, 1); // Orientar al caminar
        
        const xOffset = -this.width/2;
        const yOffset = -this.height/2;
        
        if (this.hurtTimer > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
        }

        // Cabeza goblínica verde
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(xOffset + 8, yOffset + 6, 18, 16);
        
        // Orejas largas
        ctx.beginPath();
        ctx.moveTo(xOffset + 8, yOffset + 12);
        ctx.lineTo(xOffset, yOffset + 8);
        ctx.lineTo(xOffset + 8, yOffset + 16);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(xOffset + 26, yOffset + 12);
        ctx.lineTo(xOffset + 34, yOffset + 8);
        ctx.lineTo(xOffset + 26, yOffset + 16);
        ctx.closePath();
        ctx.fill();

        // Ojos rojos malvados
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(xOffset + 18, yOffset + 10, 4, 3);
        
        // Chaleco de cuero marrón
        ctx.fillStyle = '#784212';
        ctx.fillRect(xOffset + 6, yOffset + 22, 22, 22);
        
        // Piernas verdes
        const bounce = (this.animFrame === 1 || this.animFrame === 3) ? 3 : 0;
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(xOffset + 4, yOffset + 44 - bounce, 8, 10);
        ctx.fillRect(xOffset + 22, yOffset + 44 + bounce, 8, 10);
        
        // Zapatos marrones
        ctx.fillStyle = '#4a2700';
        ctx.fillRect(xOffset + 2, yOffset + 52 - bounce, 11, 3);
        ctx.fillRect(xOffset + 21, yOffset + 52 + bounce, 11, 3);

        // Daga/Espada de acero
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(xOffset + 24, yOffset + 26, 14, 4);
        ctx.fillStyle = '#d35400'; // Mango
        ctx.fillRect(xOffset + 21, yOffset + 26, 3, 4);
        
        ctx.restore();
    }
}

// 2. DUENDE CON ARCO (GoblinArcher)
export class GoblinArcher {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 54;

        this.vx = 0; // Se queda parado en su plataforma
        this.gravity = 0.5;
        this.vy = 0;

        this.maxHp = 90;
        this.hp = this.maxHp;
        this.active = true;
        this.damage = 10;

        this.hurtTimer = 0;
        this.facing = -1; // -1 = Izquierda, 1 = Derecha
        
        this.aiState = 0; // 0 = Espera, 1 = Tensando Arco, 2 = Cooldown
        this.aiTimer = 0;
        this.shootRange = 9999;
    }

    update(player, arrows) {
        if (!this.active) return;

        if (this.hurtTimer > 0) this.hurtTimer--;

        this.vy += this.gravity;
        this.y += this.vy;

        // Detectar jugador
        if (player) {
            const distToPlayerX = player.x + player.width/2 - (this.x + this.width/2);
            this.facing = distToPlayerX > 0 ? 1 : -1;
            
            if (this.aiState === 0) {
                this.aiState = 1;
                this.aiTimer = 0;
            }
        }

        this.aiTimer++;
        if (this.aiState === 1) {
            if (this.aiTimer >= 40) { // Dispara más rápido que el arquero común
                const arrowX = this.facing === 1 ? this.x + this.width + 5 : this.x - 20;
                const arrowY = this.y + 18;
                const targetX = player.x + player.width/2;
                const targetY = player.y + player.height/2;
                const dx = targetX - arrowX;
                const dy = targetY - arrowY;
                const distToTarget = Math.sqrt(dx*dx + dy*dy) || 1;
                const speed = 8.0;
                const arrowVx = (dx / distToTarget) * speed;
                const arrowVy = (dy / distToTarget) * speed;
                
                // Dispara una flecha rápida apuntando al jugador
                arrows.push(new ArrowProjectile(arrowX, arrowY, arrowVx, this.damage, arrowVy));
                audio.playSwordSwing();
                
                this.aiState = 2;
                this.aiTimer = 0;
            }
        } else if (this.aiState === 2) {
            if (this.aiTimer >= 70) {
                this.aiState = 0;
                this.aiTimer = 0;
            }
        }
    }

    takeDamage(amount) {
        if (!this.active) return null;
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 15;
        
        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, true);
        particles.addFloatingText(this.x + this.width/2, this.y - 12, `-${amount}`, "#ffffff", 9, false);

        if (this.hp <= 0) {
            this.active = false;
            audio.playCrateBreak();
            particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 16, true);
            particles.addFloatingText(this.x + this.width/2, this.y - 12, "DEFEATED", "#2ecc71", 10, true);
            
            return new LootItem(this.x + this.width/2 - 8, this.y + this.height - 20, 'coin');
        }
        return null;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 2, 14, 3, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.facing, 1);
        
        const xOffset = -this.width/2;
        const yOffset = -this.height/2;
        
        if (this.hurtTimer > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
        }

        // Cabeza verde
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(xOffset + 8, yOffset + 6, 18, 16);
        
        // Capucha verde oscura goblínica
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(xOffset + 6, yOffset + 2, 22, 6);
        
        // Orejas
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(xOffset + 8, yOffset + 12);
        ctx.lineTo(xOffset, yOffset + 8);
        ctx.lineTo(xOffset + 8, yOffset + 16);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(xOffset + 26, yOffset + 12);
        ctx.lineTo(xOffset + 34, yOffset + 8);
        ctx.lineTo(xOffset + 26, yOffset + 16);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffd700'; // Ojos amarillos
        ctx.fillRect(xOffset + 18, yOffset + 10, 4, 3);
        
        // Túnica verde bosque
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(xOffset + 6, yOffset + 22, 22, 22);
        
        // Piernas
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(xOffset + 8, yOffset + 44, 7, 10);
        ctx.fillRect(xOffset + 19, yOffset + 44, 7, 10);
        
        // Arco de madera rústico
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(xOffset + 26, yOffset + 30, 12, -Math.PI*0.4, Math.PI*0.4);
        ctx.stroke();

        ctx.restore();
    }
}

// 3. PÁJARO DE CAZA (ChasingBird)
export class ChasingBird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 24;

        this.maxHp = 65;
        this.hp = this.maxHp;
        this.active = true;
        this.damage = 8;
        
        this.chaseSpeed = 2.2;
        this.sineTimer = Math.random() * 100;
        this.animFrame = 0;
        this.animTime = 0;
        
        this.chaseRange = 500;
        this.targetX = x; // Para orientación
    }

    update(player) {
        if (!this.active) return;

        if (player) {
            const dx = (player.x + player.width/2) - (this.x + this.width/2);
            const dy = (player.y + player.height/2) - (this.y + this.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < this.chaseRange) {
                // Persecución activa en ángulo hacia el jugador
                this.x += (dx / dist) * this.chaseSpeed;
                this.y += (dy / dist) * this.chaseSpeed;
                this.targetX = player.x;
            } else {
                // Vuelo sinusoidal patrullando hacia la izquierda
                this.sineTimer += 0.08;
                this.x -= 1.2;
                this.y += Math.sin(this.sineTimer) * 0.5;
                this.targetX = this.x - 10;
            }
        }
    }

    takeDamage(amount = 30) {
        if (!this.active) return null;
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 12;
        
        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 6, false);
        particles.addFloatingText(this.x + this.width/2, this.y - 5, `-${amount}`, "#ff3333");

        if (this.hp > 0) return null;

        this.active = false;
        
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, false);
        particles.addFloatingText(this.x + this.width/2, this.y - 5, "SLAY", "#ff3333");

        // Soltar moneda al morir
        return new LootItem(this.x + this.width/2 - 8, this.y + this.height/2, 'coin');
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.x < this.targetX ? -1 : 1, 1); // Orientación

        // Wings flap
        this.animTime++;
        if (this.animTime >= 6) {
            this.animFrame = (this.animFrame + 1) % 3;
            this.animTime = 0;
        }

        // Sombra leve
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 40, 10, 2, 0, 0, Math.PI*2);
        ctx.fill();

        // Cuerpo redondo (Plumas rojas)
        ctx.fillStyle = '#b33939';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Ojos amarillos pequeños
        ctx.fillStyle = '#f7d794';
        ctx.fillRect(4, -4, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(5, -3, 1, 1);

        // Pico amarillo gótico
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath();
        ctx.moveTo(8, -1);
        ctx.lineTo(14, 2);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.fill();

        // Alas aleteando
        ctx.fillStyle = '#8c2d2d';
        ctx.beginPath();
        if (this.animFrame === 0) {
            ctx.ellipse(-4, -6, 5, 8, -Math.PI/6, 0, Math.PI*2);
        } else if (this.animFrame === 1) {
            ctx.ellipse(-5, 0, 8, 4, 0, 0, Math.PI*2);
        } else {
            ctx.ellipse(-4, 6, 5, 8, Math.PI/6, 0, Math.PI*2);
        }
        ctx.fill();

        ctx.restore();
    }
}
