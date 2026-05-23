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

    update(floorY) {
        this.life--;
        this.pulseTime += 0.08;

        if (!this.isGrounded) {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;

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
        }

        ctx.restore();
    }
}

// ==========================================================================
// CAJA DE MADERA ROMPIBLE (Crate)
// ==========================================================================
export class Crate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 38;
        this.height = 38;
        this.active = true;
        this.hp = 1;
    }

    takeDamage() {
        if (!this.active) return null;
        this.active = false;
        
        audio.playCrateBreak();
        particles.spawnWoodSplinters(this.x + this.width/2, this.y + this.height/2, 14);

        // Decidir loot: 75% Moneda, 25% Poción de Vida
        const lootType = Math.random() > 0.25 ? 'coin' : 'heart';
        return new LootItem(this.x + this.width/2 - 8, this.y + this.height/2 - 8, lootType);
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
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.width = 32;
        this.height = 24;
        
        this.vx = -1.6; // Empieza volando a la izquierda
        this.sineSpeed = 0.08;
        this.sineTimer = Math.random() * 100;
        this.sineAmplitude = 18;

        this.hp = 1; // Muere de un golpe
        this.active = true;
        this.damage = 8;
        
        this.animFrame = 0;
        this.animTime = 0;
    }

    update() {
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
    }

    takeDamage() {
        if (!this.active) return;
        this.active = false;
        
        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, false);
        particles.addFloatingText(this.x + this.width/2, this.y - 5, "SLAY", "#ff3333");
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
        ctx.fillStyle = '#2b233a'; // Cuerpo morado oscuro
        ctx.fillRect(-6, -6, 12, 10);
        
        // Cara y ojos de vampiro brillantes
        ctx.fillStyle = '#111';
        ctx.fillRect(-4, -6, 8, 4);
        ctx.fillStyle = '#ff0033'; // Ojos rojos
        ctx.fillRect(-3, -5, 1, 1);
        ctx.fillRect(2, -5, 1, 1);

        // Orejas
        ctx.fillStyle = '#2b233a';
        ctx.fillRect(-5, -9, 2, 3);
        ctx.fillRect(3, -9, 2, 3);

        // Alas de membrana animadas según frame
        ctx.fillStyle = '#1d1726'; // Interior del ala oscura
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
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 54;

        this.vx = -1.1; // Patrulla a la izquierda inicialmente
        this.gravity = 0.5;
        this.vy = 0;
        
        this.maxHp = 20;
        this.hp = 20;
        this.active = true;
        this.damage = 12;

        this.hurtTimer = 0;
        this.animFrame = 0;
        this.animTime = 0;
    }

    update() {
        if (!this.active) return;

        if (this.hurtTimer > 0) this.hurtTimer--;

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
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 15;
        
        audio.playHit();
        particles.spawnEnemyHit(this.x + this.width/2, this.y + this.height/2, 8, true);
        particles.addFloatingText(this.x + this.width/2, this.y - 12, `-${amount}`, "#ffffff", 9, false);

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

        ctx.restore();
    }
}
