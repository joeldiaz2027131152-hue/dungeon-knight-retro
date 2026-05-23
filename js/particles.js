/* ==========================================================================
   DUNGEON KNIGHT - MOTOR DE PARTÍCULAS VISUALES (particles.js)
   ========================================================================== */

class Particle {
    constructor(x, y, vx, vy, size, color, maxLife, gravity = 0, drag = 0.98, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.gravity = gravity;
        this.drag = drag;
        this.shape = shape; // 'circle', 'square', 'line', 'triangle'
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.vy += this.gravity;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.spin;
        this.life--;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        
        ctx.beginPath();
        if (this.shape === 'circle') {
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'square') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.shape === 'line') {
            ctx.lineWidth = this.size;
            ctx.moveTo(-this.size * 2, 0);
            ctx.lineTo(this.size * 2, 0);
            ctx.stroke();
        } else if (this.shape === 'triangle') {
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size, this.size);
            ctx.lineTo(-this.size, this.size);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color, fontSize = 10, isCritical = false) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        this.isCritical = isCritical;
        this.life = 60; // 1 segundo a 60 FPS
        this.maxLife = 60;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -2 - Math.random() * 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy *= 0.95; // Se frena al subir
        this.life--;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        
        ctx.font = `${this.isCritical ? 'bold ' : ''}${this.fontSize}px "Press Start 2P", monospace`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        
        // Efecto terremoto sutil para críticos
        let ox = 0, oy = 0;
        if (this.isCritical) {
            ox = (Math.random() - 0.5) * 3;
            oy = (Math.random() - 0.5) * 3;
        }

        ctx.fillText(this.text, this.x + ox, this.y + oy);
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.texts = [];
    }

    update() {
        // Actualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Actualizar textos flotantes
        for (let i = this.texts.length - 1; i >= 0; i--) {
            this.texts[i].update();
            if (this.texts[i].life <= 0) {
                this.texts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Dibujar partículas
        this.particles.forEach(p => p.draw(ctx));
        // Dibujar textos flotantes
        this.texts.forEach(t => t.draw(ctx));
    }

    // Limpiar todo al reiniciar
    clear() {
        this.particles = [];
        this.texts = [];
    }

    // ==========================================================================
    // Generadores Específicos de Efectos (Juice)
    // ==========================================================================

    // 1. Polvo al correr, saltar, caer o rodar (nubes de humo gris/blanco suave)
    spawnDust(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 1.5;
            const vy = -0.5 - Math.random() * 1.0;
            const size = 3 + Math.random() * 5;
            const life = 15 + Math.random() * 20;
            const color = `rgb(${160 + Math.random()*40}, ${160 + Math.random()*40}, ${160 + Math.random()*40})`;
            
            this.particles.push(new Particle(
                x, y, vx, vy, size, color, life, 0, 0.96, 'circle'
            ));
        }
    }

    // 2. Chispas metálicas al bloquear con escudo (chispas lineales amarillas/naranjas)
    spawnSparks(x, y, count = 10, directionX = 0) {
        for (let i = 0; i < count; i++) {
            // Si hay dirección, proyectar la mayoría en esa dirección
            const vx = (directionX * (2 + Math.random() * 6)) + (Math.random() - 0.5) * 4;
            const vy = -3 - Math.random() * 5;
            const size = 2 + Math.random() * 2;
            const life = 20 + Math.random() * 15;
            const color = Math.random() > 0.3 ? '#ffd700' : '#ff7700'; // Dorado y Naranja

            this.particles.push(new Particle(
                x, y, vx, vy, size, color, life, 0.25, 0.97, 'line'
            ));
        }
    }

    // 3. Astillas de madera de cajas rotas (cuadrados marrones que rebotan con gravedad)
    spawnWoodSplinters(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 6;
            const vy = -4 - Math.random() * 6;
            const size = 3 + Math.random() * 5;
            const life = 35 + Math.random() * 25;
            
            // Variaciones de colores de madera
            const woodColors = ['#8b5a2b', '#cd853f', '#deb887', '#5c3317'];
            const color = woodColors[Math.floor(Math.random() * woodColors.length)];

            this.particles.push(new Particle(
                x, y, vx, vy, size, color, life, 0.35, 0.98, 'square'
            ));
        }
    }

    // 4. Huesos/Sangre oscura al dañar enemigos
    spawnEnemyHit(x, y, count = 8, isSkeleton = true) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 5;
            const vy = -2 - Math.random() * 4;
            const size = 2 + Math.random() * 4;
            const life = 25 + Math.random() * 20;
            
            // Esqueleto -> Partículas blancas de hueso. Otros -> Partículas rojas de sangre oscura
            const color = isSkeleton 
                ? (Math.random() > 0.4 ? '#e0e0e0' : '#b0b0b0')
                : '#7a0010';

            this.particles.push(new Particle(
                x, y, vx, vy, size, color, life, 0.25, 0.98, 'square'
            ));
        }
    }

    // 5. Fuego dinámico para Antorchas y Hoguera (Ascendente, cambia de color de amarillo a rojo y negro)
    spawnFire(x, y, scale = 1.0, isHoguera = false) {
        // Generar 1 o 2 partículas de fuego por frame para cada fuente
        const count = isHoguera ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * (0.8 * scale);
            const vy = -1 - Math.random() * (1.8 * scale);
            const size = (3 + Math.random() * 5) * scale;
            const life = 20 + Math.random() * 15;
            
            // Gradiente de fuego: Amarillo -> Naranja -> Rojo
            const rand = Math.random();
            const color = rand > 0.7 ? '#fff700' : (rand > 0.3 ? '#ff8000' : '#ff0000');

            this.particles.push(new Particle(
                x, y, vx, vy, size, color, life, -0.05, 0.95, 'circle'
            ));
        }
    }

    // 6. Destellos mágicos al recolectar monedas o sanar (Círculos dorados o verdes pequeños)
    spawnCollectGlow(x, y, color = '#ffd700', count = 8) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 3;
            const vy = (Math.random() - 0.5) * 3;
            const size = 1.5 + Math.random() * 2.5;
            const life = 15 + Math.random() * 15;

            this.particles.push(new Particle(
                x, y, vx, vy, size, color, life, 0, 0.96, 'circle'
            ));
        }
    }

    // 7. Texto de Daño Flotante
    addFloatingText(x, y, text, color, fontSize = 10, isCritical = false) {
        this.texts.push(new FloatingText(x, y, text, color, fontSize, isCritical));
    }
}

export const particles = new ParticleSystem();
export default particles;
