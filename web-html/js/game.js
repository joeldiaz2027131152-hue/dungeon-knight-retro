/* ==========================================================================
   DUNGEON KNIGHT - MOTOR PRINCIPAL DEL JUEGO (game.js)
   ========================================================================== */

import { audio } from './audio.js';
import { particles } from './particles.js';
import { Knight } from './knight.js';
import { Crate, Spikes, CeilingBlade, BatEnemy, SkeletonMinion, Platform, FireTrap, SkeletonArcher, SecretDoor, TreasureChest, LootItem, LavaStalactite, GoblinSwordsman, GoblinArcher, ChasingBird, SpectralPortal, VoidPlatform, SpectralWraith, WhiteKnight, WingedWhiteKnight } from './enemies.js';
import { SkeletonBoss, FireDemonBoss, GiantGoblinBoss, SkySentinelMiniBoss, FallenAngelBoss, DoppelgangerBoss, WhiteArchonBoss } from './boss.js';

class WindCurrent {
    constructor(x, y, width, height, strength = -1.15, duration = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.strength = strength;
        this.pulse = Math.random() * Math.PI * 2;
        this.duration = duration;
        this.active = true;
    }

    update() {
        if (this.duration === null) return;
        this.duration--;
        if (this.duration <= 0) this.active = false;
    }

    applyTo(player) {
        if (!this.active || !player) return false;
        const overlaps = player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y;
        if (!overlaps) return false;
        if (player.isGrounded || player.vy >= -0.5) return false;

        player.vy = Math.max(player.vy + this.strength, -9.5);
        player.isGrounded = false;
        return true;
    }

    draw(ctx, gameTime) {
        if (!this.active) return;
        ctx.save();
        const alpha = 0.18 + Math.sin(gameTime * 0.08 + this.pulse) * 0.04;
        const grad = ctx.createLinearGradient(this.x, this.y + this.height, this.x, this.y);
        grad.addColorStop(0, `rgba(120, 220, 255, ${alpha})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = 'rgba(180, 240, 255, 0.45)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const x = this.x + 12 + i * (this.width / 4);
            const offset = Math.sin(gameTime * 0.08 + i + this.pulse) * 8;
            ctx.beginPath();
            ctx.moveTo(x + offset, this.y + this.height - 8);
            ctx.quadraticCurveTo(x - 18, this.y + this.height * 0.55, x + 10 + offset, this.y + 8);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class CrumblingPlatform extends Platform {
    constructor(x, y, width, height = 20) {
        super(x, y, width, height, 'stone');
        this.active = true;
        this.crumbleTimer = 0;
        this.respawnTimer = 0;
    }

    stepOn() {
        if (this.active && this.crumbleTimer === 0) {
            this.crumbleTimer = 70;
        }
    }

    update() {
        if (this.crumbleTimer > 0) {
            this.crumbleTimer--;
            if (this.crumbleTimer <= 0) {
                this.active = false;
                this.respawnTimer = 240;
                particles.spawnDust(this.x + this.width / 2, this.y, 10);
                audio.playCrateBreak();
            }
        } else if (!this.active && this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.active = true;
                particles.spawnCollectGlow(this.x + this.width / 2, this.y, '#9ee8ff', 8);
            }
        }
    }

    draw(ctx) {
        if (!this.active) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            super.draw(ctx);
            ctx.restore();
            return;
        }

        super.draw(ctx);
        ctx.save();
        const shake = this.crumbleTimer > 0 ? Math.sin(this.crumbleTimer * 0.7) * 2 : 0;
        ctx.strokeStyle = this.crumbleTimer > 0 ? '#ffdd88' : '#1d1924';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 18 + shake, this.y + 3);
        ctx.lineTo(this.x + 42 + shake, this.y + this.height - 4);
        ctx.moveTo(this.x + this.width - 28 - shake, this.y + 4);
        ctx.lineTo(this.x + this.width - 56 - shake, this.y + this.height - 5);
        ctx.stroke();
        ctx.restore();
    }
}

class StormElevatorPlatform extends Platform {
    constructor(x, startY, targetY, width = 150, height = 22) {
        super(x, startY, width, height, 'wood');
        this.startY = startY;
        this.targetY = targetY;
        this.active = false;
        this.moving = false;
        this.reachedTop = false;
        this.lastDy = 0;
    }

    activate() {
        this.active = true;
    }

    startMoving() {
        if (this.active && !this.reachedTop) {
            this.moving = true;
        }
    }

    update(player = null) {
        this.lastDy = 0;
        if (!this.active || this.reachedTop) return;
        if (!this.moving) {
            if (!player) return;
            const playerBottom = player.y + player.height;
            const horizontalOverlap = player.x + player.width > this.x + 8 && player.x < this.x + this.width - 8;
            const standingOnTop = horizontalOverlap && playerBottom >= this.y - 10 && playerBottom <= this.y + this.height + 18 && player.vy >= -0.5;
            if (!standingOnTop) return;
            this.moving = true;
        }
        const dy = this.targetY - this.y;
        if (Math.abs(dy) < 1.2) {
            this.lastDy = this.targetY - this.y;
            this.y = this.targetY;
            this.reachedTop = true;
            this.carryPlayer(player);
            return;
        }
        this.lastDy = Math.sign(dy) * Math.min(2.4, Math.abs(dy));
        this.y += this.lastDy;
        this.carryPlayer(player);
    }

    carryPlayer(player) {
        if (!player || this.lastDy === 0) return;
        const playerBottom = player.y + player.height;
        const horizontalOverlap = player.x + player.width > this.x + 8 && player.x < this.x + this.width - 8;
        const riding = horizontalOverlap && playerBottom >= this.y - 20 && playerBottom <= this.y + this.height + 28;
        if (!riding) return;
        player.y = this.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.fillStyle = '#153f25';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#5dff8a';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#8dffab';
        for (let bx = this.x + 8; bx < this.x + this.width - 8; bx += 28) {
            ctx.fillRect(bx, this.y + 6, 18, 5);
        }
        if (this.active && !this.moving && !this.reachedTop) {
            ctx.fillStyle = '#8dffab';
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('SUBE', this.x + this.width / 2, this.y - 8);
        }
        ctx.restore();
    }
}

class WindCrystal {
    constructor(x, y, unlockDoorId = null, windConfig = null) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 32;
        this.active = true;
        this.unlockDoorId = unlockDoorId;
        this.windConfig = windConfig;
        this.pulse = Math.random() * Math.PI * 2;
    }

    takeDamage(game) {
        if (!this.active) return;
        this.active = false;
        audio.playBonfire();
        particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#9ee8ff', 18);
        particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 14, 0);
        const wind = this.windConfig || {
            x: this.x - 34,
            y: this.y - 260,
            width: 92,
            height: 310,
            strength: -1.28,
            duration: 520
        };
        game.windCurrents.push(new WindCurrent(wind.x, wind.y, wind.width, wind.height, wind.strength, wind.duration));

        if (this.unlockDoorId) {
            const door = game.treasureDoors.find(d => d.id === this.unlockDoorId);
            if (door) {
                door.unlocked = true;
                particles.addFloatingText(door.x + door.width / 2, door.y - 18, "TESORO ABIERTO", "#ffd700", 10, true);
            }
        }
    }

    draw(ctx, gameTime) {
        if (!this.active) return;
        const glow = 0.5 + Math.sin(gameTime * 0.12 + this.pulse) * 0.18;
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#9ee8ff';
        ctx.fillStyle = `rgba(158, 232, 255, ${glow})`;
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y);
        ctx.lineTo(this.x + 24, this.y + 12);
        ctx.lineTo(this.x + 18, this.y + 32);
        ctx.lineTo(this.x + 5, this.y + 32);
        ctx.lineTo(this.x, this.y + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

class LightningTrap {
    constructor(x, y, height = 260) {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = height;
        this.phase = Math.floor(Math.random() * 130);
        this.damage = 14;
    }

    update() {
        this.phase = (this.phase + 1) % 150;
    }

    isWarning() {
        return this.phase >= 96 && this.phase < 122;
    }

    isStriking() {
        return this.phase >= 122 && this.phase < 140;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#243044';
        ctx.fillRect(this.x - 8, this.y - 10, this.width + 16, 12);
        ctx.fillRect(this.x - 8, this.y + this.height - 2, this.width + 16, 12);
        if (this.isWarning()) {
            ctx.fillStyle = 'rgba(158, 232, 255, 0.25)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        if (this.isStriking()) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#9ee8ff';
            ctx.fillStyle = 'rgba(158, 232, 255, 0.82)';
            ctx.fillRect(this.x + 10, this.y, 14, this.height);
            ctx.fillStyle = '#ffffff';
            for (let y = this.y + 8; y < this.y + this.height; y += 38) {
                ctx.fillRect(this.x + (y % 2 ? 4 : 18), y, 10, 22);
            }
        }
        ctx.restore();
    }
}

class VoidCrystal {
    constructor(x, y, radius = 430) {
        this.x = x;
        this.y = y;
        this.width = 26;
        this.height = 34;
        this.radius = radius;
        this.cooldown = 0;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update(game) {
        this.pulse += 0.08;
        if (this.cooldown > 0) this.cooldown--;
        if (!game?.player || this.cooldown > 0) return;

        const dx = game.player.x + game.player.width / 2 - (this.x + this.width / 2);
        const dy = game.player.y + game.player.height / 2 - (this.y + this.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) > 72) return;

        this.cooldown = 420;
        let revealed = 0;
        game.platforms.forEach(plat => {
            if (!(plat instanceof VoidPlatform)) return;
            const pdx = plat.x + plat.width / 2 - (this.x + this.width / 2);
            const pdy = plat.y + plat.height / 2 - (this.y + this.height / 2);
            if (Math.sqrt(pdx * pdx + pdy * pdy) <= this.radius) {
                plat.reveal(540);
                revealed++;
            }
        });

        if (revealed > 0) {
            audio.playPortal();
            particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#b642f5', 18);
            particles.addFloatingText(this.x + this.width / 2, this.y - 14, "PUENTE REVELADO", "#b642f5", 9, true);
        }
    }

    draw(ctx) {
        const active = this.cooldown <= 0;
        const glow = active ? 0.55 + Math.sin(this.pulse) * 0.18 : 0.18;
        ctx.save();
        ctx.globalAlpha = active ? 1 : 0.55;
        ctx.shadowBlur = active ? 12 : 4;
        ctx.shadowColor = '#b642f5';
        ctx.fillStyle = `rgba(182, 66, 245, ${glow})`;
        ctx.beginPath();
        ctx.moveTo(this.x + 13, this.y);
        ctx.lineTo(this.x + 26, this.y + 12);
        ctx.lineTo(this.x + 18, this.y + 34);
        ctx.lineTo(this.x + 7, this.y + 34);
        ctx.lineTo(this.x, this.y + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d9f6ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

class LoreTablet {
    constructor(x, y, message) {
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 52;
        this.message = message;
    }

    read(player) {
        const parts = this.message.split('|');
        parts.forEach((line, i) => {
            particles.addFloatingText(player.x + player.width / 2, player.y - 36 - i * 18, line, '#d9f6ff', 8, i === 0);
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#252632';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#9ee8ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#9ee8ff';
        ctx.fillRect(this.x + 9, this.y + 10, 18, 3);
        ctx.fillRect(this.x + 8, this.y + 22, 20, 3);
        ctx.fillRect(this.x + 12, this.y + 34, 12, 3);
        ctx.restore();
    }
}

class TreasureDoor {
    constructor(x, y, id, reward = 'coins') {
        this.x = x;
        this.y = y;
        this.width = 46;
        this.height = 60;
        this.id = id;
        this.reward = reward;
        this.unlocked = false;
        this.opened = false;
    }

    open(game) {
        if (!this.unlocked || this.opened) return;
        this.opened = true;
        audio.playBonfire();
        particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 18);
        const dropType = this.reward === 'great_potion' ? 'great_heart' : (this.reward === 'violet_berry' ? 'violet_berry' : 'coin');
        const count = this.reward === 'coins' ? 6 : 1;
        for (let i = 0; i < count; i++) {
            const loot = new LootItem(this.x + this.width / 2 - 8, this.y + 8, dropType);
            if (this.reward === 'great_potion') loot.preserveType = true;
            game.lootItems.push(loot);
        }
    }

    draw(ctx) {
        if (this.opened) return;
        ctx.save();
        ctx.fillStyle = this.unlocked ? '#2b2412' : '#151923';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = this.unlocked ? '#ffd700' : '#536070';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.unlocked ? '#ffd700' : '#536070';
        ctx.fillRect(this.x + 18, this.y + 28, 10, 8);
        ctx.restore();
    }
}

class WindSentinel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.width = 36;
        this.height = 42;
        this.maxHp = 70;
        this.hp = 70;
        this.active = true;
        this.damage = 10;
        this.facing = -1;
        this.hurtTimer = 0;
        this.animTime = Math.random() * 100;
        this.driftX = x;
        this.driftY = y;
    }

    update(player) {
        if (!this.active) return;
        if (this.hurtTimer > 0) this.hurtTimer--;
        this.animTime++;

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            this.facing = dx >= 0 ? 1 : -1;

            if (dist < 560) {
                const speed = dist < 120 ? 1.25 : 1.85;
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
                if (this.animTime % 12 === 0) {
                    particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#9ee8ff', 2);
                }
                return;
            }
        }

        const hoverY = this.baseY + Math.sin(this.animTime * 0.06) * 18;
        this.x += (this.driftX - this.x) * 0.025;
        this.y += (hoverY - this.y) * 0.04;
    }

    takeDamage(amount) {
        if (!this.active) return null;
        this.hp = Math.max(0, this.hp - amount);
        this.hurtTimer = 12;
        audio.playHit();
        particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 10, 0);
        particles.addFloatingText(this.x + this.width / 2, this.y - 12, `-${amount}`, '#9ee8ff', 9, false);
        if (this.hp <= 0) {
            this.active = false;
            audio.playDeath();
            particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#9ee8ff', 14);
            return new LootItem(this.x + this.width / 2 - 8, this.y + this.height - 12, 'coin');
        }
        return null;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        if (this.hurtTimer > 0) ctx.globalAlpha = 0.55;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.facing, 1);
        ctx.fillStyle = 'rgba(158, 232, 255, 0.24)';
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d9f6ff';
        ctx.fillRect(-10, -14, 20, 28);
        ctx.fillStyle = '#26364f';
        ctx.fillRect(-7, -9, 14, 8);
        ctx.strokeStyle = '#9ee8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 30 + Math.sin(this.animTime * 0.12) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class RelicPedestal {
    constructor(x, y, id, name, description, color = '#ffd700') {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 46;
        this.id = id;
        this.name = name;
        this.description = description;
        this.color = color;
        this.collected = false;
        this.pulse = Math.random() * Math.PI * 2;
    }

    draw(ctx, gameTime) {
        if (this.collected) return;
        const glow = 0.55 + Math.sin(gameTime * 0.1 + this.pulse) * 0.2;
        ctx.save();
        ctx.fillStyle = '#24202a';
        ctx.fillRect(this.x, this.y + 22, this.width, 24);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y + 22, this.width, 24);
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = glow;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 14, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + this.width / 2 - 2, this.y + 9, 4, 10);
        ctx.restore();
    }
}

class ChallengeDoor {
    constructor(x, y, id, label, type = 'survive', reward = 'coins', options = {}) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 64;
        this.id = id;
        this.label = label;
        this.type = type;
        this.reward = reward;
        this.options = options;
        this.started = false;
        this.completed = false;
        this.opened = false;
        this.failed = false;
        this.timer = options.duration || 600;
        this.spawnedEnemies = [];
        this.finalEnemy = null;
        this.finalSpawned = false;
        this.playerHpOnStart = null;
        this.instantRewardClaimed = false;
        this.waveIndex = -1;
        this.currentWaveEnemies = [];
    }

    start(game) {
        if (this.completed || this.opened || this.started) return;
        this.failed = false;
        this.started = true;
        this.timer = this.options.duration || 600;
        this.playerHpOnStart = game.player ? game.player.hp : null;
        audio.playThunder();
        particles.addFloatingText(this.x + this.width / 2, this.y - 18, this.label, '#ffd700', 9, true);

        if (this.options.waves?.length) {
            this.spawnWave(game, 0);
        } else if (this.type === 'defeat' || this.options.enemies) {
            const enemies = this.options.enemies || [
                new SkeletonMinion(this.x - 90, this.y + this.height - 54),
                new SkeletonMinion(this.x + 120, this.y + this.height - 54)
            ];
            enemies.forEach(enemy => this.addChallengeEnemy(game, enemy));
        }
    }

    spawnWave(game, waveIndex) {
        const wave = this.options.waves?.[waveIndex];
        if (!wave) return;

        this.waveIndex = waveIndex;
        this.currentWaveEnemies = [];

        const enemies = typeof wave.enemies === 'function' ? wave.enemies(game) : (wave.enemies || []);
        const offsets = wave.offsets || [-150, 150, -230, 230, -310, 310];
        enemies.forEach((enemy, index) => {
            if (wave.nearPlayer && game.player) {
                const offset = offsets[index % offsets.length];
                enemy.spawnX = Math.max(80, Math.min(game.levelWidth - 120, game.player.x + offset));
                enemy.spawnY = Math.min(game.player.y, game.floorY - enemy.height);
                enemy.spawnVx = offset < 0 ? 1.1 : -1.1;
            }
            this.addChallengeEnemy(game, enemy);
            this.currentWaveEnemies.push(enemy);
        });

        audio.playThunder();
        particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 14);
        particles.addFloatingText(this.x + this.width / 2, this.y - 26, wave.label || `HORDA ${waveIndex + 1}`, '#ffd700', 9, true);
    }

    addChallengeEnemy(game, enemy) {
        if (enemy.spawnX === undefined) {
            enemy.spawnX = enemy.x;
            enemy.spawnY = enemy.y;
            enemy.spawnVx = enemy.vx || 0;
        }
        enemy.x = enemy.spawnX;
        enemy.y = enemy.spawnY;
        enemy.vx = enemy.spawnVx;
        enemy.vy = 0;
        enemy.hp = enemy.maxHp || enemy.hp;
        enemy.active = true;
        enemy.challengeId = this.id;
        this.spawnedEnemies.push(enemy);
        if (enemy.isFlyingEnemy) {
            game.windSentinels.push(enemy);
        } else if (enemy instanceof SkeletonArcher || enemy instanceof GoblinArcher) {
            game.archers.push(enemy);
        } else {
            game.skeletons.push(enemy);
        }
    }

    spawnFinalEnemy(game) {
        if (this.finalSpawned || !this.options.finalEnemy) return;
        this.finalSpawned = true;
        const enemy = this.options.finalEnemy;
        this.finalEnemy = enemy;
        this.addChallengeEnemy(game, enemy);
        audio.playThunder();
        particles.spawnCollectGlow(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff3333', 24);
        particles.addFloatingText(enemy.x + enemy.width / 2, enemy.y - 22, 'CAMPEÓN DE CENIZA', '#ff3333', 11, true);
    }

    update(game) {
        if (!this.started || this.completed || this.opened) return;

        if (this.options.failOnDamage && game.player && this.playerHpOnStart !== null && game.player.hp < this.playerHpOnStart) {
            this.fail(game);
            return;
        }

        if (this.type === 'survive') {
            this.timer--;
            if (this.timer <= 0) {
                this.complete(game);
            } else if (this.timer % 90 === 0) {
                particles.addFloatingText(this.x + this.width / 2, this.y - 22, `${Math.ceil(this.timer / 60)}s`, '#9ee8ff', 8, false);
            }
        } else if (this.type === 'defeat') {
            if (this.options.waves?.length) {
                const currentWaveDefeated = this.currentWaveEnemies.every(enemy => !enemy.active || enemy.hp <= 0);
                if (currentWaveDefeated) {
                    if (this.waveIndex < this.options.waves.length - 1) {
                        this.spawnWave(game, this.waveIndex + 1);
                    } else {
                        this.complete(game);
                    }
                }
                return;
            }

            const firstWaveDefeated = this.spawnedEnemies
                .filter(enemy => enemy !== this.finalEnemy)
                .every(enemy => !enemy.active || enemy.hp <= 0);

            if (firstWaveDefeated && this.options.finalEnemy && !this.finalSpawned) {
                this.spawnFinalEnemy(game);
                return;
            }

            const finalDefeated = !this.options.finalEnemy || (this.finalEnemy && (!this.finalEnemy.active || this.finalEnemy.hp <= 0));
            if (firstWaveDefeated && finalDefeated) {
                this.complete(game);
            }
        }
    }

    cleanupSpawned(game) {
        const spawned = new Set(this.spawnedEnemies);
        game.skeletons = game.skeletons.filter(enemy => !spawned.has(enemy));
        game.archers = game.archers.filter(enemy => !spawned.has(enemy));
        game.windSentinels = game.windSentinels.filter(enemy => !spawned.has(enemy));
        this.spawnedEnemies.forEach(enemy => {
            enemy.active = false;
            enemy.challengeId = null;
        });
        this.spawnedEnemies = [];
        this.finalEnemy = null;
        this.finalSpawned = false;
        this.instantRewardClaimed = false;
        this.waveIndex = -1;
        this.currentWaveEnemies = [];
    }

    fail(game) {
        this.started = false;
        this.failed = true;
        this.timer = this.options.duration || 600;
        this.cleanupSpawned(game);
        audio.playHit();
        particles.addFloatingText(this.x + this.width / 2, this.y - 18, 'RETO FALLIDO', '#ff3333', 10, true);
        particles.addFloatingText(this.x + this.width / 2, this.y, 'Pulsa E para reiniciar', '#ffd700', 7, false);
    }

    reset(game) {
        this.started = false;
        this.failed = false;
        this.completed = false;
        this.timer = this.options.duration || 600;
        this.playerHpOnStart = null;
        this.cleanupSpawned(game);
    }

    complete(game) {
        this.completed = true;
        this.started = false;
        this.failed = false;
        if (this.options.cleanupOnComplete) {
            this.cleanupSpawned(game);
        }
        if (this.options.instantReward && !this.instantRewardClaimed && game.player) {
            this.instantRewardClaimed = true;
            if (this.options.instantReward === 'green_coin') {
                game.player.greenCoins++;
                particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#00ff66', 16);
                particles.addFloatingText(this.x + this.width / 2, this.y - 36, 'ALMA VERDE OBTENIDA', '#00ff66', 11, true);
            } else if (this.options.instantReward === 'red_coin') {
                game.player.redCoins++;
                particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#ff3333', 16);
                particles.addFloatingText(this.x + this.width / 2, this.y - 36, 'ALMA ROJA OBTENIDA', '#ff3333', 11, true);
            } else if (this.options.instantReward === 'grey_coin') {
                game.player.greyCoins++;
                particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#b0b0b0', 16);
                particles.addFloatingText(this.x + this.width / 2, this.y - 36, 'ALMA GRIS OBTENIDA', '#b0b0b0', 11, true);
            }
            game.updateInventoryUI();
        }
        if (this.options.coinRewardOnComplete) {
            for (let i = 0; i < this.options.coinRewardOnComplete; i++) {
                game.lootItems.push(new LootItem(this.x + this.width / 2 - 8, this.y + 10, 'coin'));
            }
        }
        game.completedChallenges.add(this.id);
        if (this.options.autoOpenOnComplete) {
            this.opened = true;
            game.openedChallengeDoors.add(this.id);
        }
        audio.playBonfire();
        particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 22);
        particles.addFloatingText(this.x + this.width / 2, this.y - 18, 'DESAFÍO SUPERADO', '#ffd700', 10, true);
        game.saveGame();
    }

    open(game) {
        if (!this.completed || this.opened) return;
        this.opened = true;
        game.completedChallenges.add(this.id);
        game.openedChallengeDoors.add(this.id);
        audio.playBonfire();
        particles.spawnCollectGlow(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 18);

        if (this.reward === 'none') {
            // Algunos retos entregan el premio directamente al derrotar al enemigo final.
        } else if (this.reward.startsWith('relic:')) {
            const relicId = this.reward.split(':')[1];
            game.awardRelic(relicId, this.x + this.width / 2, this.y - 10);
        } else {
            const type = this.reward === 'great_potion' ? 'great_heart' :
                (this.reward === 'violet_berry' ? 'violet_berry' :
                (this.reward === 'green_coin' ? 'green_coin' :
                (this.reward === 'grey_coin' ? 'grey_coin' : 'coin')));
            const count = this.reward === 'coins' ? (this.options.coinReward ?? 8) : 1;
            for (let i = 0; i < count; i++) {
                game.lootItems.push(new LootItem(this.x + this.width / 2 - 8, this.y + 10, type));
            }
        }
        game.saveGame();
    }

    draw(ctx, gameTime) {
        if (this.opened) return;
        ctx.save();
        const activeGlow = this.started ? 0.35 + Math.sin(gameTime * 0.18) * 0.15 : 0;
        const isAshHunt = this.id === 'w2-ash-hunt-door';
        const idleColor = isAshHunt ? '#3a2605' : '#161822';
        const borderColor = isAshHunt ? '#ffd700' : '#8aa0b8';
        if (isAshHunt && !this.completed) {
            const glow = 0.18 + Math.sin(gameTime * 0.12) * 0.08;
            ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
            ctx.fillRect(this.x - 8, this.y - 8, this.width + 16, this.height + 16);
        }
        ctx.fillStyle = this.failed ? '#2a1010' : (this.completed ? '#2e2414' : idleColor);
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = this.failed ? '#ff3333' : (this.completed ? '#ffd700' : (this.started ? '#ff5555' : borderColor));
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.completed ? '#ffd700' : borderColor;
        ctx.fillRect(this.x + 10, this.y + 14, 28, 4);
        ctx.fillRect(this.x + 16, this.y + 30, 16, 4);
        if (isAshHunt && !this.completed) {
            ctx.fillStyle = '#fff1a8';
            ctx.fillRect(this.x + 21, this.y + 42, 6, 10);
            ctx.fillStyle = '#ffcc33';
            ctx.fillRect(this.x + 18, this.y + 8, 12, 4);
            ctx.fillRect(this.x + 14, this.y + 22, 20, 4);
        }
        if (this.started) {
            ctx.fillStyle = `rgba(255, 85, 85, ${activeGlow})`;
            ctx.fillRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);
        }
        ctx.restore();
    }
}

class Game {
    constructor() {
        try {
            window.gameInstance = this; // Exponer instancia globalmente para failsafe de clicks inline
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
        this.domLevelIndicator = document.getElementById('hud-level-indicator');
        this.domBossHud = document.getElementById('boss-hud');
        this.domGamepad = document.getElementById('mobile-gamepad');
        this.domWorldTransition = document.getElementById('world-transition-screen');

        // MAPA MÁGICO DE VIAJE RÁPIDO
        this.domMagicMapScreen = document.getElementById('magic-map-screen');
        this.btnMapClose = document.getElementById('btn-map-close');
        this.btnMapWorld1 = document.getElementById('btn-map-world-1');
        this.btnMapWorld2 = document.getElementById('btn-map-world-2');
        this.btnMapWorld3 = document.getElementById('btn-map-world-3');
        this.btnMapWorld4 = document.getElementById('btn-map-world-4');
        this.btnMapWorld5 = document.getElementById('btn-map-world-5');
        this.btnMapWorld6 = document.getElementById('btn-map-world-6');
        this.mapLevelsList = document.getElementById('map-levels-list');
        this.mapWorldTitle = document.getElementById('map-world-title');
        this.slotMagicMap = document.getElementById('slot-magic-map');
        this.isMagicMapOpen = false;

        this.mapData = {
            1: [
                { levelNum: 1, name: "Nivel 1-1 (El Pasillo Gótico)", hasBonfire: true, spawnX: 2280 },
                { levelNum: 2, name: "Nivel 1-2 (Las Cúpulas)", hasBonfire: true, spawnX: 1950 },
                { levelNum: 3, name: "Nivel 1-3 (El Retorno)", hasBonfire: false },
                { levelNum: 4, name: "Nivel 1-4 (La Cripta)", hasBonfire: true, spawnX: 1180 },
                { levelNum: 5, name: "Nivel 1-5 (Jefe)", hasBonfire: true, spawnX: 480, requiresBoss: 'bossDefeated' }
            ],
            2: [
                { levelNum: 6, name: "Nivel 2-1 (Catacumbas)", hasBonfire: true, spawnX: 115 },
                { levelNum: 7, name: "Nivel 2-2 (Cámara de Lava)", hasBonfire: false },
                { levelNum: 8, name: "Nivel 2-3 (Hondonada Ígnea)", hasBonfire: true, spawnX: 2350 },
                { levelNum: 9, name: "Nivel 2-4 (El Descenso)", hasBonfire: false },
                { levelNum: 10, name: "Nivel 2-5 (Cámara de Fuego)", hasBonfire: true, spawnX: 2620 },
                { levelNum: 11, name: "Nivel 2-6 (Jefe)", hasBonfire: true, spawnX: 480, requiresBoss: 'boss2Defeated' }
            ],
            3: [
                { levelNum: 12, name: "Nivel 3-1 (Sendero del Bosque)", hasBonfire: true, spawnX: 115 },
                { levelNum: 13, name: "Nivel 3-2 (Espesura Goblínica)", hasBonfire: false },
                { levelNum: 14, name: "Nivel 3-3 (Cúpulas de los Árboles)", hasBonfire: true, spawnX: 1885 },
                { levelNum: 15, name: "Nivel 3-4 (Pantano Sombrío)", hasBonfire: false },
                { levelNum: 16, name: "Nivel 3-5 (Laberinto de Raíces)", hasBonfire: false },
                { levelNum: 17, name: "Nivel 3-6 (Claro de la Hoguera)", hasBonfire: true, spawnX: 2780 },
                { levelNum: 18, name: "Nivel 3-7 (Jefe)", hasBonfire: true, spawnX: 480, requiresBoss: 'boss3Defeated' }
            ],
            4: [
                { levelNum: 19, name: "Nivel 4-1 (Entrada Fortaleza)", hasBonfire: true, spawnX: 120 },
                { levelNum: 20, name: "Nivel 4-2 (Torres del Viento)", hasBonfire: true, spawnX: 360 },
                { levelNum: 21, name: "Nivel 4-3 (Salón Cristales)", hasBonfire: false },
                { levelNum: 22, name: "Nivel 4-4 (Murallas Suspendidas)", hasBonfire: true, spawnX: 170 },
                { levelNum: 23, name: "Nivel 4-5 (Biblioteca Invertida)", hasBonfire: false },
                { levelNum: 24, name: "Nivel 4-6 (Última Hoguera)", hasBonfire: true, spawnX: 150 },
                { levelNum: 25, name: "Nivel 4-7 (Trono de la Tormenta)", hasBonfire: true, spawnX: 220, requiresBoss: 'boss4Defeated' }
            ],
            5: [
                { levelNum: 27, name: "Nivel 5-1 (Umbral del Vacío)", hasBonfire: true, spawnX: 120 },
                { levelNum: 28, name: "Nivel 5-2 (Catacumbas de Cristal)", hasBonfire: false },
                { levelNum: 29, name: "Nivel 5-3 (Abismo de los Espectros)", hasBonfire: false },
                { levelNum: 30, name: "Nivel 5-4 (Torres Gemelas)", hasBonfire: true, spawnX: 120 },
                { levelNum: 31, name: "Nivel 5-5 (Laberinto de Portales)", hasBonfire: false },
                { levelNum: 32, name: "Nivel 5-6 (Puente Espectral)", hasBonfire: false },
                { levelNum: 33, name: "Nivel 5-7 (Antesala del Reflejo)", hasBonfire: true, spawnX: 680 },
                { levelNum: 34, name: "Nivel 5-8 (El Espejo del Alma)", hasBonfire: true, spawnX: 150 }
            ],
            6: [
                { levelNum: 35, name: "Nivel 6-1 (Nubes del Alba Negra)", hasBonfire: true, spawnX: 120 },
                { levelNum: 36, name: "Nivel 6-2 (Puentes de Alabastro)", hasBonfire: false },
                { levelNum: 37, name: "Nivel 6-3 (Reto del Alba)", hasBonfire: true, spawnX: 120 },
                { levelNum: 38, name: "Nivel 6-4 (Jardines Suspendidos)", hasBonfire: false },
                { levelNum: 39, name: "Nivel 6-5 (Capilla del Ala Negra)", hasBonfire: true, spawnX: 120 },
                { levelNum: 40, name: "Nivel 6-6 (Escaleras de Nube)", hasBonfire: false },
                { levelNum: 41, name: "Nivel 6-7 (Hoguera del Cielo Roto)", hasBonfire: true, spawnX: 120 },
                { levelNum: 42, name: "Nivel 6-8 (Prueba del Castillo Blanco)", hasBonfire: false },
                { levelNum: 43, name: "Nivel 6-9 (Ultima Nube)", hasBonfire: true, spawnX: 120 },
                { levelNum: 44, name: "Nivel 6-10 (Arconte del Alba Negra)", hasBonfire: true, spawnX: 150, requiresBoss: 'boss6Defeated' }
            ]
        };

        // Subinventario lateral
        this.equippedWeaponSlot = document.getElementById('equipped-weapon-slot');
        this.equippedShieldSlot = document.getElementById('equipped-shield-slot');
        this.equippedRelicSlot = document.getElementById('equipped-relic-slot');
        this.domSubgridPopup = document.getElementById('inventory-subgrid-popup');
        this.domSubgridTitle = document.getElementById('subgrid-title');
        this.domSubgridGrid = document.getElementById('subgrid-grid');
        this.domSubgridDesc = document.getElementById('subgrid-desc');
        this.subgridType = null; // 'weapon', 'shield', 'relic' o 'consumable'
        this.consumablesSectionTitle = document.getElementById('consumables-section-title');

        this.shopCoins = document.getElementById('shop-coins');
        this.shopHp = document.getElementById('shop-hp');
        this.shopStamina = document.getElementById('shop-stamina');
        this.shopRedCoins = document.getElementById('shop-red-coins');
        this.shopGreenCoins = document.getElementById('shop-green-coins');
        this.shopGreyCoins = document.getElementById('shop-grey-coins');
        this.inventoryBadge = document.getElementById('inventory-badge');
        this.slotPotionQty = document.getElementById('slot-potion-qty');
        this.slotGreatPotionQty = document.getElementById('slot-great-potion-qty');
        this.slotBerryQty = document.getElementById('slot-berry-qty');
        this.slotVioletBerryQty = document.getElementById('slot-violet-berry-qty');

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
        this.btnGreatPotionHud = document.getElementById('btn-great-potion-hud');
        this.btnBerryHud = document.getElementById('btn-berry-hud');
        this.slotPotion = document.getElementById('slot-potion');
        this.slotGreatPotion = document.getElementById('slot-great-potion');
        this.slotBerry = document.getElementById('slot-berry');
        this.slotVioletBerry = document.getElementById('slot-violet-berry');
        this.slotConsumablesBag = document.getElementById('slot-consumables-bag');

        // Botones de la tienda
        this.btnShopRest = document.getElementById('btn-shop-rest');
        this.btnShopBuy = document.getElementById('btn-shop-buy');
        this.btnShopBuyGreat = document.getElementById('btn-shop-buy-great');
        this.btnShopExit = document.getElementById('btn-shop-exit');
        this.btnInteractBonfire = document.getElementById('btn-interact-bonfire');
        this.btnUpgradeHp = document.getElementById('btn-upgrade-hp');
        this.btnUpgradeStamina = document.getElementById('btn-upgrade-stamina');
        this.btnUpgradeDamage = document.getElementById('btn-upgrade-damage');
        this.btnUpgradePotion = document.getElementById('btn-upgrade-potion');

        this.isPaused = false;
        this.isShopOpen = false;
        this.saveKey = 'dungeonKnightSaveV1';
        this.openedChests = new Set();
        this.openedTreasureDoors = new Set();
        this.greatPotionShopPurchased = false;
        this.acquiredRelics = new Set();
        this.equippedRelics = new Set();
        this.unlockedStormRelicPuzzle = false;
        this.completedChallenges = new Set();
        this.openedChallengeDoors = new Set();
        this.levelMedals = new Set();
        this.activeLoreNote = null;
        this.world6Cinematic = null;

        // Entidades y Nivel
        this.player = null;
        this.boss = null;

        this.level = 1; // Mundo 1 = gótico, Mundo 2 = lava
        this.levelWidth = 2500;
        this.levelHeight = 750;
        this.floorY = 445; // Suelo firme

        // Listas de entidades activas
        this.crates = [];
        this.spikes = [];
        this.blades = [];
        this.bats = [];
        this.skeletons = [];
        this.lootItems = [];
        this.chests = [];
        this.secretDoor = null;
        this.secretRoomDoor = null;
        this.bossDefeated = false; // Flag para evitar que el boss 1 reviva
        this.boss2Defeated = false; // Flag para evitar que el boss 2 reviva
        this.boss3Defeated = false; // Flag para evitar que el boss 3 reviva
        this.boss4Defeated = false; // Flag para evitar que el boss 4 reviva
        this.world5BossDefeated = false; // Desbloquea capacidad extra de pociones para Mundo 6+
        this.boss6Defeated = false; // Flag para evitar que el boss 6 reviva
        this.world4MiniBossDefeated = false;

        // Entidades de Nivel 2
        this.platforms = [];
        this.fireTraps = [];
        this.archers = [];
        this.arrows = [];
        this.lavaStalactites = [];
        this.windCurrents = [];
        this.windCrystals = [];
        this.voidCrystals = [];
        this.lightningTraps = [];
        this.loreTablets = [];
        this.treasureDoors = [];
        this.windSentinels = [];
        this.relicPedestals = [];
        this.challengeDoors = [];
        this.miniBosses = [];
        this.spectralPortals = [];
        this.spectralWraiths = [];
        this.activeFireDots = [];

        // Checkpoint avanzado estilo Souls-like
        this.latestLitBonfire = {
            level: 1,
            x: 80,
            y: 445 - 58,
            lit: false
        };
        this.litBonfires = [1]; // Por defecto, Nivel 1-1 inicia como hoguera disponible

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
        this.cameraY = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.freezeTimer = 0; // Hit stop

        // Sistema de Relámpagos (Mundo 3)
        this.lightningTimer = 0;
        this.lightningFlashDuration = 0;
        this.lightningBoltX = 0;

        this.state = 'menu'; // 'menu', 'playing', 'gameover', 'victory'
        this.gameTime = 0;
        this.gameOverTriggered = false;

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
        this.refreshStartButton();

        // Iniciar Bucle
        this.lastTime = 0;
        requestAnimationFrame((time) => this.loop(time));
        } catch (err) {
            console.error("CRITICAL STARTUP ERROR:", err);
            alert("ERROR CRÍTICO AL INICIAR EL JUEGO:\n" + err.message + "\n\n" + err.stack);
        }
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
                } else if (this.isMagicMapOpen) {
                    this.closeMagicMap();
                } else {
                    this.togglePause();
                }
                return;
            }

            // Tecla de Inventario (I)
            if ((e.code === 'KeyI' || e.key.toLowerCase() === 'i') && this.state === 'playing') {
                e.preventDefault();
                if (this.isMagicMapOpen) {
                    this.closeMagicMap();
                } else if (!this.isPaused) {
                    this.toggleInventory();
                }
                return;
            }

            if (e.code === 'KeyE' && this.state === 'world6_cinematic') {
                e.preventDefault();
                if (e.repeat) return;
                this.finishWorld6Cinematic();
                return;
            }

            // Tecla de Poción rápida (Q)
            if (e.code === 'KeyQ' && this.state === 'playing' && !this.isPaused && !this.isShopOpen) {
                e.preventDefault();
                this.quickUsePotion();
                return;
            }

            // Tecla de Poción Mayor rápida (G)
            if (e.code === 'KeyG' && this.state === 'playing' && !this.isPaused && !this.isShopOpen) {
                e.preventDefault();
                this.quickUseGreatPotion();
                return;
            }

            // Tecla de Bayas rápidas (H)
            if (e.code === 'KeyH' && this.state === 'playing' && !this.isPaused && !this.isShopOpen) {
                e.preventDefault();
                this.quickUseBerry();
                return;
            }

            // Tecla de interactuar (E)
            if (e.code === 'KeyE' && this.state === 'playing' && !this.isPaused) {
                e.preventDefault();
                if (e.repeat) return;
                this.handleInteraction();
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

        // Botón de continuar en la transición de mundo (Mundo 1 -> Mundo 2 -> Mundo 3)
        const btnWTContinue = document.getElementById('btn-world-transition-continue');
        if (btnWTContinue) {
            btnWTContinue.addEventListener('click', () => {
                this.completeWorldTransition();
            });
        }

        // Botones de Pausa
        this.btnPauseHud.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el click se interprete como ataque
            this.togglePause();
        });
        this.btnResume.addEventListener('click', () => this.togglePause());
        this.btnMute.addEventListener('click', () => this.toggleMute());
        // Botón de Interacción Flotante
        this.btnInteractBonfire.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleInteraction();
        });
        this.btnShopRest.addEventListener('click', () => this.restAtBonfire());
        this.btnShopBuy.addEventListener('click', () => this.buyPotionFromShop());
        this.btnShopBuyGreat.addEventListener('click', () => this.buyGreatPotionFromShop());
        this.btnShopExit.addEventListener('click', () => this.closeBonfireShop());
        this.btnUpgradeHp.addEventListener('click', () => this.upgradeStat('hp'));
        this.btnUpgradeStamina.addEventListener('click', () => this.upgradeStat('stamina'));
        this.btnUpgradeDamage.addEventListener('click', () => this.upgradeStat('damage'));
        this.btnUpgradePotion.addEventListener('click', () => this.upgradeStat('potion'));

        // Botones de Inventario (Bulto)
        this.btnInventoryHud.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleInventory();
        });
        this.btnPotionHud.addEventListener('click', (e) => {
            e.stopPropagation();
            this.quickUsePotion();
        });
        this.btnGreatPotionHud.addEventListener('click', (e) => {
            e.stopPropagation();
            this.quickUseGreatPotion();
        });
        if (this.btnBerryHud) {
            this.btnBerryHud.addEventListener('click', (e) => {
                e.stopPropagation();
                this.quickUseBerry();
            });
        }
        this.slotPotion.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openSubgrid('consumable');
        });
        this.slotGreatPotion.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openSubgrid('consumable');
        });
        if (this.slotBerry) {
            this.slotBerry.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSubgrid('consumable');
            });
        }

        // --- Botones de Mapa Mágico ---
        if (this.slotMagicMap) {
            console.log("Registrando click y touchstart para slotMagicMap:", this.slotMagicMap);
            const handleMapSlotTrigger = (e) => {
                console.log("=== Disparador del slot del mapa activado! ===");
                e.stopPropagation();
                e.preventDefault();
                this.openMagicMap();
            };
            this.slotMagicMap.addEventListener('click', handleMapSlotTrigger);
            this.slotMagicMap.addEventListener('touchstart', handleMapSlotTrigger);
        }
        if (this.btnMapClose) {
            this.btnMapClose.addEventListener('click', () => {
                this.closeMagicMap();
            });
        }
        if (this.btnMapWorld1) {
            this.btnMapWorld1.addEventListener('click', () => this.selectMapWorld(1));
        }
        if (this.btnMapWorld2) {
            this.btnMapWorld2.addEventListener('click', () => this.selectMapWorld(2));
        }
        if (this.btnMapWorld3) {
            this.btnMapWorld3.addEventListener('click', () => this.selectMapWorld(3));
        }
        if (this.btnMapWorld4) {
            this.btnMapWorld4.addEventListener('click', () => this.selectMapWorld(4));
        }
        if (this.btnMapWorld5) {
            this.btnMapWorld5.addEventListener('click', () => this.selectMapWorld(5));
        }

        if (this.consumablesSectionTitle) {
            this.consumablesSectionTitle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSubgrid('consumable');
            });
        }

        // Click en el cuadro de armas
        if (this.equippedWeaponSlot) {
            this.equippedWeaponSlot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSubgrid('weapon');
            });
        }

        // Click en el cuadro de escudos
        if (this.equippedShieldSlot) {
            this.equippedShieldSlot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSubgrid('shield');
            });
        }

        if (this.equippedRelicSlot) {
            this.equippedRelicSlot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSubgrid('relic');
            });
        }

        if (this.slotConsumablesBag) {
            this.slotConsumablesBag.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSubgrid('consumable');
            });
        }
    }

    startGame() {
        audio.init();
        audio.startMusic();

        const saveData = this.loadSaveData();
        this.litBonfires = saveData?.litBonfires || [1];
        this.latestLitBonfire = saveData?.latestLitBonfire || {
            level: 1,
            x: 80,
            y: 445 - 58,
            lit: false
        };
        this.latestLitBonfire.level = this.normalizeLevelNumber(this.latestLitBonfire.level);

        this.player = new Knight(80, this.floorY - 60);
        this.level = this.normalizeLevelNumber(saveData?.level);
        this.bossDefeated = !!saveData?.bossDefeated;
        this.boss2Defeated = !!saveData?.boss2Defeated;
        this.boss3Defeated = !!saveData?.boss3Defeated;
        this.boss4Defeated = !!saveData?.boss4Defeated;
        this.world5BossDefeated = !!saveData?.world5BossDefeated || this.level >= 35 || (saveData?.litBonfires || []).includes(35);
        this.boss6Defeated = !!saveData?.boss6Defeated;
        this.openedChests = new Set(saveData?.openedChests || []);
        this.openedTreasureDoors = new Set(saveData?.openedTreasureDoors || []);
        this.greatPotionShopPurchased = !!saveData?.greatPotionShopPurchased;
        this.acquiredRelics = new Set(saveData?.acquiredRelics || []);
        this.equippedRelics = new Set(saveData?.equippedRelics || []);
        this.unlockedStormRelicPuzzle = !!saveData?.unlockedStormRelicPuzzle;
        this.completedChallenges = new Set(saveData?.completedChallenges || []);
        this.openedChallengeDoors = new Set(saveData?.openedChallengeDoors || []);
        this.levelMedals = new Set(saveData?.levelMedals || []);
        this.gameTime = 0;
        this.isPaused = false;
        this.isShopOpen = false;
        this.gameOverTriggered = false;
        this.domPause.classList.add('hidden');
        this.domGameOver.classList.add('hidden');
        this.domVictory.classList.add('hidden');
        this.domBonfireScreen.classList.add('hidden');
        this.domBonfirePrompt.classList.add('hidden');
        this.domInventoryPopup.classList.add('hidden');
        if (this.domWorldTransition) this.domWorldTransition.classList.add('hidden');

        // Sincronizar texto de botón de silenciar en pausa
        this.btnMute.innerText = audio.isMuted ? "SONIDO: OFF" : "SONIDO: ON";

        this.initLevel(this.level);
        if (saveData) {
            try {
                this.applySaveData(saveData);
            } catch (err) {
                console.error("Error al aplicar la partida guardada, iniciando partida limpia:", err);
                try {
                    localStorage.removeItem(this.saveKey);
                } catch (localErr) {}
                this.level = 1;
                this.enterLevelAtStart(1);
            }
        } else {
            this.movePlayerToLevelStart(80);
        }

        this.state = 'playing';
        this.domStartMenu.classList.add('hidden');
        this.domHud.classList.remove('hidden');
        this.applyRelicEffects();
        this.updateHud();
    }

    refreshStartButton() {
        if (!this.btnStart) return;
        this.btnStart.innerText = this.loadSaveData() ? 'CONTINUAR AVENTURA' : 'INICIAR AVENTURA';
    }

    loadSaveData() {
        try {
            const raw = localStorage.getItem(this.saveKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('No se pudo cargar el autoguardado:', e);
            return null;
        }
    }

    normalizeLevelNumber(levelNum) {
        const parsed = Number(levelNum);
        return Number.isInteger(parsed) && parsed >= 1 && parsed <= 44 ? parsed : 1;
    }

    resetTransientStateForLevelStart() {
        this.isPaused = false;
        this.isShopOpen = false;
        this.freezeTimer = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.input.left = false;
        this.input.right = false;
        this.input.jump = false;
        this.input.down = false;
        this.input.attack = false;
        this.input.block = false;
        this.input.roll = false;

        if (this.player) {
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.isRolling = false;
            this.player.isAttacking = false;
            this.player.isHooked = false;
            this.player.isCrouching = false;
            this.player.height = this.player.baseHeight;
        }
    }

    movePlayerToLevelStart(x = 80) {
        if (!this.player) return;
        this.resetTransientStateForLevelStart();
        const spawn = this.getSafeLevelStartPoint(x);
        this.player.x = spawn.x;
        this.player.y = spawn.y;
        this.resolvePlayerSpawnOverlap();
        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 960 * 0.35));
        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 540 * 0.42));
    }

    enterLevelAtStart(levelNum, x = 80) {
        this.initLevel(levelNum);
        this.movePlayerToLevelStart(x);
    }

    isAbyssLevel(level = this.level) {
        return level >= 27 && level <= 33;
    }

    getSafeLevelStartPoint(x = 80) {
        if (this.level === 26) {
            return { x, y: -1450 - this.player.height };
        }

        if (!this.isAbyssLevel()) {
            return { x, y: this.floorY - this.player.height };
        }

        const platform = this.findSafePlatformNearX(x);
        if (!platform) {
            return { x, y: this.floorY - this.player.height };
        }

        return {
            x: Math.max(platform.x + 8, Math.min(platform.x + platform.width - this.player.width - 8, x)),
            y: platform.y - this.player.height
        };
    }

    findSafePlatformNearX(x, includeVoid = false) {
        const candidates = this.platforms
            .filter(plat => !plat.hidden && plat.active !== false && (includeVoid || !(plat instanceof VoidPlatform)))
            .sort((a, b) => {
                const aContains = x >= a.x && x <= a.x + a.width ? 0 : 1;
                const bContains = x >= b.x && x <= b.x + b.width ? 0 : 1;
                if (aContains !== bContains) return aContains - bContains;
                return Math.abs((a.x + a.width / 2) - x) - Math.abs((b.x + b.width / 2) - x);
            });
        return candidates[0] || null;
    }

    syncWorldFiveTwoVoidPlatforms() {
        if (this.level !== 28) return;
        const voidPlatforms = this.platforms.filter(plat => plat instanceof VoidPlatform);
        if (voidPlatforms.length === 0) return;

        const sharedTimer = Math.max(...voidPlatforms.map(plat => plat.visibleTimer || 0));
        if (sharedTimer <= 0) return;

        voidPlatforms.forEach(plat => {
            plat.visibleTimer = sharedTimer;
        });
    }

    resolvePlayerSpawnOverlap() {
        if (!this.player) return;

        for (const crate of this.crates) {
            if (!crate.active || !this.checkAABBCollision(this.player, crate)) continue;

            const rightSide = crate.x + crate.width + 8;
            const leftSide = crate.x - this.player.width - 8;
            this.player.x = rightSide + this.player.width <= this.levelWidth
                ? rightSide
                : Math.max(0, leftSide);
        }
    }

    stabilizeKeyLoot(loot, source) {
        if (!loot) return loot;
        const shouldStabilize = ['forest_key', 'void_key'].includes(loot.type) || this.isAbyssLevel();
        if (!shouldStabilize) return loot;

        const sourceCenterX = source.x + source.width / 2;
        const sourceBottom = source.y + source.height;
        const platform = this.platforms
            .filter(plat => sourceCenterX >= plat.x - 8 &&
                sourceCenterX <= plat.x + plat.width + 8 &&
                Math.abs(plat.y - sourceBottom) < 28)
            .sort((a, b) => Math.abs(a.y - sourceBottom) - Math.abs(b.y - sourceBottom))[0];

        const surfaceY = platform ? platform.y : this.floorY;
        const minX = platform ? platform.x + 4 : 4;
        const maxX = platform ? platform.x + platform.width - loot.width - 4 : this.levelWidth - loot.width - 4;

        loot.x = Math.max(minX, Math.min(maxX, sourceCenterX - loot.width / 2));
        loot.y = surfaceY - loot.height;
        loot.vx = 0;
        loot.vy = 0;
        loot.bounceCount = 2;
        loot.isGrounded = true;
        loot.life = Number.POSITIVE_INFINITY;

        return loot;
    }

    collectConsumableToInventory(item, x = this.player.x + this.player.width / 2, y = this.player.y - 30) {
        if (!this.player || !item) return false;
        this.normalizeHealthLoot(item);

        if (item.type === 'heart') {
            this.player.potions++;
            particles.addFloatingText(x, y, "+1 POCIÓN", "#00ff66", 11, true);
        } else if (item.type === 'great_heart') {
            this.player.greatPotions++;
            particles.addFloatingText(x, y, "+1 POCIÓN MAYOR", "#aa55ff", 11, true);
        } else if (item.type === 'berry') {
            this.player.berries++;
            particles.addFloatingText(x, y, "+1 BAYA ROJA", "#ff3355", 11, true);
        } else if (item.type === 'violet_berry') {
            this.player.violetBerries++;
            particles.addFloatingText(x, y, "+1 BAYA VIOLETA", "#b85cff", 11, true);
        } else {
            return false;
        }

        const glowColor = item.type === 'violet_berry' ? '#b85cff' : (item.type === 'berry' ? '#ff3355' : '#00ff66');
        particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, glowColor, 12);
        audio.playBonfire();
        this.updateHud();
        if (this.subgridType === 'consumable' && this.domSubgridPopup && !this.domSubgridPopup.classList.contains('hidden')) {
            this.populateSubgrid('consumable');
        }
        this.saveGame();
        return true;
    }

    normalizeHealthLoot(item) {
        if (!item) return item;
        if (item.preserveType) return item;

        if (item.type === 'heart' || item.type === 'great_heart') {
            item.type = this.level >= 12 ? 'violet_berry' : 'berry';
        }

        return item;
    }

    getChestId(chest, level = this.level) {
        return `${level}:${Math.round(chest.x)}:${Math.round(chest.y)}:${chest.contentType || 'unknown'}`;
    }

    applyPersistentTreasureState() {
        this.chests.forEach(chest => {
            chest.persistentId = this.getChestId(chest);
            if (this.openedChests.has(chest.persistentId)) {
                chest.opened = true;
                chest.hidden = false;
            }
        });

        this.treasureDoors.forEach(door => {
            if (this.openedTreasureDoors.has(door.id)) {
                door.unlocked = true;
                door.opened = true;
            }
        });

        this.relicPedestals.forEach(relic => {
            relic.collected = this.acquiredRelics.has(relic.id);
        });

        this.challengeDoors.forEach(door => {
            if (this.completedChallenges.has(door.id)) {
                door.completed = true;
                door.started = false;
            }
            if (this.openedChallengeDoors.has(door.id)) {
                door.completed = true;
                door.opened = true;
                door.started = false;
            }
        });
    }

    markChestOpened(chest) {
        const chestId = chest.persistentId || this.getChestId(chest);
        chest.persistentId = chestId;
        this.openedChests.add(chestId);
    }

    markTreasureDoorOpened(door) {
        if (!door?.id) return;
        this.openedTreasureDoors.add(door.id);
    }

    getRelicInfo(id) {
        const relics = {
            wind_hook: {
                name: 'Reliquia del Viento',
                description: 'El gancho alcanza mas lejos.',
                color: '#9ee8ff',
                icon: '🌀'
            },
            ash_berry: {
                name: 'Reliquia de Ceniza',
                description: 'Las bayas curan un poco mas.',
                color: '#ff7755',
                icon: '🔥'
            },
            storm_oath: {
                name: 'Juramento del Trueno',
                description: 'Primer cargado tras descansar: +16 dano. Luego la espada gana +8 dano.',
                color: '#d9f6ff',
                icon: '⚡'
            },
            moon: {
                name: 'Reliquia Lunar',
                description: 'Una vez por descanso, evita un golpe mortal y deja al caballero con 1 HP.',
                color: '#b8d7ff',
                icon: '🌙'
            }
        };
        return relics[id] || { name: 'Reliquia Antigua', description: 'Poder olvidado.', color: '#ffd700', icon: '◇' };
    }

    applyRelicEffects() {
        if (!this.player) return;
        this.equippedRelics = new Set(Array.from(this.equippedRelics || []).filter(id => this.acquiredRelics.has(id)).slice(0, 1));
        this.player.hookRangeBonus = this.equippedRelics.has('wind_hook') ? 70 : 0;
        this.player.berryHealBonus = this.equippedRelics.has('ash_berry') ? 0.05 : 0;
        if (this.equippedRelics.has('storm_oath') && this.player.thunderRelicReady === undefined) {
            this.player.thunderRelicReady = true;
        }
        if (!this.equippedRelics.has('storm_oath')) {
            this.player.thunderRelicReady = false;
        }
        this.player.lunarGraceEnabled = this.equippedRelics.has('moon');
        if (this.player.lunarGraceReady === undefined) {
            this.player.lunarGraceReady = true;
        }
    }

    awardRelic(id, x = this.player.x + this.player.width / 2, y = this.player.y - 25) {
        if (this.acquiredRelics.has(id)) {
            particles.addFloatingText(x, y, 'RELIQUIA YA OBTENIDA', '#b0b0b0', 8, false);
            return;
        }

        const info = this.getRelicInfo(id);
        this.acquiredRelics.add(id);
        if (this.equippedRelics.size === 0) {
            this.equippedRelics.add(id);
        }
        this.applyRelicEffects();
        if (id === 'storm_oath' && this.equippedRelics.has('storm_oath')) this.player.thunderRelicReady = true;
        audio.playBonfire();
        particles.spawnCollectGlow(x, y, info.color, 24);
        particles.addFloatingText(x, y - 18, info.name.toUpperCase(), info.color, 10, true);
        particles.addFloatingText(x, y, info.description, '#ffffff', 7, false);
        this.saveGame();
    }

    applyChestEvent(chest) {
        if (!chest?.eventType) return;

        if (chest.eventType === 'ambush') {
            particles.addFloatingText(chest.x + chest.width / 2, chest.y - 25, '¡COFRE MALDITO!', '#ff3333', 11, true);
            audio.playDeath();
            const left = new SkeletonMinion(chest.x - 80, chest.y - 54);
            const right = new SkeletonArcher(chest.x + 95, chest.y - 54);
            this.skeletons.push(left);
            this.archers.push(right);
        } else if (chest.eventType === 'lightning') {
            particles.addFloatingText(chest.x + chest.width / 2, chest.y - 25, '¡TRAMPA RÚNICA!', '#9ee8ff', 10, true);
            audio.playThunder();
            this.lightningTraps.push(new LightningTrap(chest.x - 10, chest.y - 260, 260));
        }
    }

    spawnBossCoins(count, centerX, y) {
        for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 10;
            const coin = new LootItem(centerX - 8 + spread, y - 18 - (i % 3) * 6, 'coin');
            coin.vx = spread * 0.035;
            coin.vy = -5.5 - (i % 4) * 0.45;
            this.lootItems.push(coin);
        }
        particles.addFloatingText(centerX, y - 52, `+${count} MONEDAS`, '#ffd700', 10, true);
    }

    checkLevelMedals(levelNum) {
        if (!this.player || !Number.isInteger(levelNum)) return;

        const enemyClear = [...this.skeletons, ...this.archers, ...this.bats, ...this.windSentinels]
            .every(enemy => !enemy.active || enemy.hp <= 0);
        const treasureClear = this.chests.every(chest => chest.opened) &&
            this.treasureDoors.every(door => door.opened) &&
            this.relicPedestals.every(relic => relic.collected);

        const awards = [];
        if (enemyClear) awards.push(['enemy', 'MEDALLA: LIMPIEZA TOTAL', '#ffdd88']);
        if (treasureClear) awards.push(['secret', 'MEDALLA: BUSCADOR', '#9ee8ff']);

        awards.forEach(([kind, text, color], index) => {
            const key = `${levelNum}:${kind}`;
            if (this.levelMedals.has(key)) return;
            this.levelMedals.add(key);
            particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 35 - index * 18, text, color, 9, true);
        });

        if (awards.length > 0) this.saveGame();
    }

    addWorld3BridgeBetween(left, right) {
        if (!left || !right) return;

        const start = left.x + left.width;
        const width = right.x - start;
        if (width <= 18) return;

        const y = Math.min(left.y, right.y) + Math.abs(left.y - right.y) * 0.5 + 4;
        this.platforms.push(new Platform(start, y, width, 14, 'bridge'));
    }

    getBonfireRespawnPoint(fallbackX = 80) {
        if (!this.bonfire || !this.player) {
            if (this.player && this.isAbyssLevel()) {
                const platform = this.findSafePlatformNearX(fallbackX);
                if (platform) {
                    return {
                        x: Math.max(platform.x + 8, Math.min(platform.x + platform.width - this.player.width - 8, fallbackX)),
                        y: platform.y - this.player.height
                    };
                }
            }
            return {
                x: fallbackX,
                y: this.floorY - (this.player?.height || 58)
            };
        }

        return {
            x: this.bonfire.x,
            y: this.bonfire.y + this.bonfire.height - this.player.height
        };
    }

    completeWorldTransition() {
        const nextLevel = this.level === 5 ? 6 : (this.level === 11 ? 12 : (this.level === 18 ? 19 : null));
        if (!nextLevel) {
            if (this.domWorldTransition) this.domWorldTransition.classList.add('hidden');
            this.state = 'playing';
            return;
        }

        this.latestLitBonfire = {
            level: nextLevel,
            x: 115,
            y: this.floorY - (this.player?.height || 58),
            lit: true
        };

        this.enterLevelAtStart(nextLevel);
        this.latestLitBonfire.y = this.player.y;
        if (this.bonfire) this.bonfire.lit = true;
        if (this.domWorldTransition) this.domWorldTransition.classList.add('hidden');
        this.state = 'playing';
        this.saveGame();
        audio.startMusic();
    }

    saveGame() {
        if (!this.player) return;

        const saveData = {
            version: 1,
            level: this.level,
            x: this.player.x,
            y: this.player.y,
            latestLitBonfire: this.latestLitBonfire,
            bossDefeated: this.bossDefeated,
            boss2Defeated: this.boss2Defeated,
            boss3Defeated: this.boss3Defeated,
            boss4Defeated: this.boss4Defeated,
            world5BossDefeated: this.world5BossDefeated,
            boss6Defeated: this.boss6Defeated,
            world4MiniBossDefeated: this.world4MiniBossDefeated,
            litBonfires: this.litBonfires,
            openedChests: Array.from(this.openedChests),
            openedTreasureDoors: Array.from(this.openedTreasureDoors),
            greatPotionShopPurchased: this.greatPotionShopPurchased,
            acquiredRelics: Array.from(this.acquiredRelics),
            equippedRelics: Array.from(this.equippedRelics),
            unlockedStormRelicPuzzle: this.unlockedStormRelicPuzzle,
            completedChallenges: Array.from(this.completedChallenges),
            openedChallengeDoors: Array.from(this.openedChallengeDoors),
            levelMedals: Array.from(this.levelMedals),
            player: {
                hp: this.player.hp,
                stamina: this.player.stamina,
                coins: this.player.coins,
                potions: this.player.potions,
                maxPotions: this.player.maxPotions,
                greatPotions: this.player.greatPotions,
                berries: this.player.berries,
                violetBerries: this.player.violetBerries,
                weapon: this.player.weapon,
                shield: this.player.shield,
                hasStormSword: this.player.hasStormSword,
                hasLegendarySword: this.player.hasLegendarySword,
                hasReinforcedShield: this.player.hasReinforcedShield,
                statsCratesBroken: this.player.statsCratesBroken,
                statsEnemiesKilled: this.player.statsEnemiesKilled,
                statsDamageBlocked: this.player.statsDamageBlocked,
                lunarGraceReady: this.player.lunarGraceReady,
                hpLevel: this.player.hpLevel,
                staminaLevel: this.player.staminaLevel,
                damageLevel: this.player.damageLevel,
                redCoins: this.player.redCoins,
                greenCoins: this.player.greenCoins,
                greyCoins: this.player.greyCoins,
                potionLevel: this.player.potionLevel,
                flasks: this.player.flasks,
                hasForestKey: this.player.hasForestKey,
                hasVoidKey: this.player.hasVoidKey
            }
        };

        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            this.refreshStartButton();
        } catch (e) {
            console.warn('No se pudo guardar la partida:', e);
        }
    }

    clearSave() {
        try {
            localStorage.removeItem(this.saveKey);
            this.refreshStartButton();
        } catch (e) {
            console.warn('No se pudo borrar el autoguardado:', e);
        }
    }

    applySaveData(saveData) {
        if (!saveData || !this.player) return;

        this.boss3Defeated = !!saveData.boss3Defeated;
        this.boss2Defeated = !!saveData.boss2Defeated;
        this.boss4Defeated = !!saveData.boss4Defeated;
        this.world5BossDefeated = !!saveData.world5BossDefeated || (saveData.level || 1) >= 35 || (saveData.litBonfires || []).includes(35);
        this.boss6Defeated = !!saveData.boss6Defeated;
        this.world4MiniBossDefeated = !!saveData.world4MiniBossDefeated;
        this.openedChests = new Set(saveData.openedChests || []);
        this.openedTreasureDoors = new Set(saveData.openedTreasureDoors || []);
        this.greatPotionShopPurchased = !!saveData.greatPotionShopPurchased;
        this.acquiredRelics = new Set(saveData.acquiredRelics || []);
        this.equippedRelics = new Set(saveData.equippedRelics || []);
        this.unlockedStormRelicPuzzle = !!saveData.unlockedStormRelicPuzzle;
        this.completedChallenges = new Set(saveData.completedChallenges || []);
        this.openedChallengeDoors = new Set(saveData.openedChallengeDoors || []);
        this.levelMedals = new Set(saveData.levelMedals || []);
        this.applyPersistentTreasureState();
        const savedPlayer = saveData.player || {};
        this.player.hpLevel = savedPlayer.hpLevel ?? 1;
        this.player.staminaLevel = savedPlayer.staminaLevel ?? 1;
        this.player.damageLevel = savedPlayer.damageLevel ?? 1;
        this.player.redCoins = savedPlayer.redCoins ?? 0;
        this.player.greenCoins = savedPlayer.greenCoins ?? 0;
        this.player.greyCoins = savedPlayer.greyCoins ?? 0;
        this.player.potionLevel = savedPlayer.potionLevel ?? 1;
        this.player.flasks = savedPlayer.flasks ?? 0;
        this.player.coins = savedPlayer.coins ?? 0;
        this.player.potions = savedPlayer.potions ?? 1;
        this.player.maxPotions = this.getMaxMinorPotions();
        this.player.greatPotions = savedPlayer.greatPotions ?? 0;
        this.player.berries = savedPlayer.berries ?? 0;
        this.player.violetBerries = savedPlayer.violetBerries ?? 0;
        this.player.hasLegendarySword = !!savedPlayer.hasLegendarySword;
        this.player.hasStormSword = !!savedPlayer.hasStormSword;
        this.player.weapon = savedPlayer.weapon || (this.player.hasStormSword ? 'storm' : (this.player.hasLegendarySword ? 'legendary' : 'rusty'));
        this.player.hasReinforcedShield = !!savedPlayer.hasReinforcedShield;
        this.player.shield = savedPlayer.shield || (this.player.hasReinforcedShield ? 'reinforced' : 'steel');
        this.player.shieldProtectionBonus = 0;
        this.player.updateUpgradedStats();
        this.player.hp = Math.min(this.player.maxHp, savedPlayer.hp ?? this.player.maxHp);
        this.player.stamina = Math.min(this.player.maxStamina, savedPlayer.stamina ?? this.player.maxStamina);
        this.player.lunarGraceReady = savedPlayer.lunarGraceReady ?? true;
        this.player.statsCratesBroken = savedPlayer.statsCratesBroken ?? 0;
        this.player.statsEnemiesKilled = savedPlayer.statsEnemiesKilled ?? 0;
        this.player.statsDamageBlocked = savedPlayer.statsDamageBlocked ?? 0;
        this.player.hasForestKey = !!savedPlayer.hasForestKey;
        this.player.hasVoidKey = !!savedPlayer.hasVoidKey;

        if (this.latestLitBonfire?.lit && this.latestLitBonfire.level === this.level) {
            const bonfireSpawn = this.getBonfireRespawnPoint(this.latestLitBonfire.x);
            this.latestLitBonfire.x = bonfireSpawn.x;
            this.latestLitBonfire.y = bonfireSpawn.y;
            this.player.x = Math.max(0, bonfireSpawn.x - 30);
            this.player.y = bonfireSpawn.y;
            if (this.bonfire) this.bonfire.lit = true;
        } else {
            this.player.x = saveData.x ?? 80;
            this.player.y = saveData.y ?? (this.floorY - this.player.height);
            if (this.isAbyssLevel() && this.player.y + this.player.height >= this.floorY - 2) {
                const spawn = this.getSafeLevelStartPoint(this.player.x);
                this.player.x = spawn.x;
                this.player.y = spawn.y;
            }
        }

        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isRolling = false;
        this.player.isAttacking = false;
        this.player.isHooked = false;
        this.applyRelicEffects();
        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 960 * 0.35));
        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 540 * 0.42));
    }

    setupWorld6SkyLevel(levelNum) {
        const sub = levelNum - 34;
        const hasBonfire = [1, 3, 5, 7, 9].includes(sub);
        const levelNames = {
            2: 'PUENTES DE ALABASTRO',
            3: 'RETO DEL ALBA',
            4: 'JARDINES SUSPENDIDOS',
            5: 'CAPILLA DEL ALA NEGRA',
            6: 'ESCALERAS DE NUBE',
            7: 'HOGUERA DEL CIELO ROTO',
            8: 'PRUEBA DEL CASTILLO BLANCO',
            9: 'ULTIMA NUBE'
        };

        this.levelWidth = sub === 8 ? 3400 : 3000;
        this.levelHeight = sub >= 6 ? 980 : 900;
        this.bonfire = hasBonfire ? {
            x: 120,
            y: this.floorY - 95,
            width: 48,
            height: 65,
            lit: this.latestLitBonfire.level === levelNum && this.latestLitBonfire.lit,
            animTime: 0
        } : null;

        const exitPlatformY = sub % 2 === 0 ? this.floorY - 180 : this.floorY - 120;
        this.exitDoor = { x: this.levelWidth - 230, y: exitPlatformY - 60, width: 40, height: 60 };

        const cloudRows = [
            { x: 40, y: this.floorY - 30, w: 360 },
            { x: 470, y: this.floorY - 120, w: 220 },
            { x: 820, y: this.floorY - 220, w: 230 },
            { x: 1210, y: this.floorY - 145, w: 260 },
            { x: 1600, y: this.floorY - 270, w: 230 },
            { x: 1980, y: this.floorY - 180, w: 260 },
            { x: 2360, y: this.floorY - 310, w: 230 },
            { x: this.levelWidth - 290, y: exitPlatformY, w: 250 }
        ];

        cloudRows.forEach(row => this.platforms.push(new Platform(row.x, row.y, row.w, 22, 'stone')));

        if (sub >= 4) {
            this.platforms.push(new CrumblingPlatform(1120, this.floorY - 320, 150));
            this.platforms.push(new CrumblingPlatform(1780, this.floorY - 390, 150));
        }
        if (sub >= 6) {
            this.platforms.push(new Platform(620, this.floorY - 360, 190, 22, 'stone'));
            this.platforms.push(new Platform(1420, this.floorY - 480, 180, 22, 'stone'));
            this.platforms.push(new Platform(2140, this.floorY - 520, 210, 22, 'stone'));
        }

        this.windCurrents.push(new WindCurrent(735, this.floorY - 300, 58, 230, -1.05));
        if (sub >= 4) this.windCurrents.push(new WindCurrent(1500, this.floorY - 455, 60, 300, -1.08));
        if (sub >= 8) this.windCurrents.push(new WindCurrent(2580, this.floorY - 520, 60, 335, -1.12));

        this.lightningTraps.push(new LightningTrap(1090, this.floorY - 250, 220));
        if (sub >= 5) this.lightningTraps.push(new LightningTrap(1870, this.floorY - 420, 300));
        if (sub >= 8) this.lightningTraps.push(new LightningTrap(2760, this.floorY - 520, 360));

        this.skeletons.push(new WhiteKnight(570, this.floorY - 120 - 58, sub >= 5 ? 'heavy' : 'blade'));
        this.skeletons.push(new WhiteKnight(1320, this.floorY - 145 - 58, 'blade'));
        this.skeletons.push(new WhiteKnight(2050, this.floorY - 180 - 58, sub >= 7 ? 'heavy' : 'blade'));
        if (sub >= 4) this.skeletons.push(new WhiteKnight(2425, this.floorY - 310 - 58, 'blade'));

        this.windSentinels.push(new WingedWhiteKnight(910, this.floorY - 335, 'blade'));
        if (sub >= 5) this.windSentinels.push(new WingedWhiteKnight(1720, this.floorY - 450, 'heavy'));
        if (sub >= 7) this.windSentinels.push(new WingedWhiteKnight(2500, this.floorY - 520, 'blade'));

        if (sub === 2) {
            this.chests.push(new TreasureChest(2020, this.floorY - 180 - 36, 'violet_berry'));
        } else if (sub === 4) {
            this.chests.push(new TreasureChest(1450, this.floorY - 480 - 36, 'great_potion'));
        } else if (sub === 6) {
            this.chests.push(new TreasureChest(2180, this.floorY - 520 - 36, 'storm_potion'));
        } else if (sub === 9) {
            this.chests.push(new TreasureChest(2385, this.floorY - 310 - 36, 'great_potion'));
        }

        if (sub === 3) {
            this.challengeDoors.push(new ChallengeDoor(1545, this.floorY - 270 - 64, 'w6-3-dawn-trial', 'DERROTA LA GUARDIA DEL ALBA', 'defeat', 'coins', {
                coinReward: 10,
                cleanupOnComplete: false,
                enemies: [
                    new WhiteKnight(1250, this.floorY - 145 - 58, 'heavy'),
                    new WhiteKnight(1750, this.floorY - 270 - 58, 'blade'),
                    new WingedWhiteKnight(1960, this.floorY - 410, 'blade')
                ]
            }));
        }

        if (sub === 5) {
            this.challengeDoors.push(new ChallengeDoor(1545, this.floorY - 270 - 64, 'w6-5-black-wing', 'ROMPE EL SELLO DEL ALA NEGRA', 'defeat', 'none', {
                cleanupOnComplete: false,
                enemies: [
                    new WhiteKnight(1200, this.floorY - 145 - 58, 'blade'),
                    new WingedWhiteKnight(1780, this.floorY - 420, 'blade')
                ],
                finalEnemy: new WingedWhiteKnight(2140, this.floorY - 520, 'mini'),
                instantReward: 'green_coin'
            }));
        }

        if (sub === 8) {
            this.challengeDoors.push(new ChallengeDoor(2540, this.floorY - 310 - 64, 'w6-8-white-castle', 'SOBREVIVE A LA LUZ CAIDA', 'defeat', 'coins', {
                coinReward: 10,
                cleanupOnComplete: false,
                enemies: [
                    new WhiteKnight(1950, this.floorY - 180 - 58, 'heavy'),
                    new WhiteKnight(2400, this.floorY - 310 - 58, 'blade'),
                    new WingedWhiteKnight(2880, this.floorY - 560, 'heavy')
                ]
            }));
        }

        this.domBossHud.classList.add('hidden');
        particles.addFloatingText(80, this.floorY - 140, `MUNDO 6-${sub}: ${levelNames[sub]}`, '#ffffff', 14, true);
    }

    initLevel(levelNum) {
        this.level = levelNum;
        this.levelHeight = 750;
        this.forestDoorUnlocked = false;

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
        this.chests = [];
        this.lavaStalactites = [];
        this.windCurrents = [];
        this.windCrystals = [];
        this.voidCrystals = [];
        this.lightningTraps = [];
        this.loreTablets = [];
        this.treasureDoors = [];
        this.windSentinels = [];
        this.relicPedestals = [];
        this.challengeDoors = [];
        this.miniBosses = [];
        this.spectralPortals = [];
        this.spectralWraiths = [];
        this.activeFireDots = [];
        this.secretDoor = null;
        this.secretRoomDoor = null;
        this.exitDoor = null;
        this.world4Lever = null;
        this.world3StormSecretTablet = null;
        this.world3StormElevator = null;
        this.world3StormLever = null;
        this.world3StormChest = null;
        this.world3StormSecretPlatforms = [];
        this.world4SecretGate = null;
        this.world4SecretReturnDoor = null;
        this.world4MainBoundaryWall = null;
        this.world4SecretRoomBounds = null;
        this.world4MoonRace = null;
        this.world4MoonRacePlatform = null;
        this.world4MoonRaceChest = null;
        this.world5TransitionLever = null;
        this.world5TransitionElevator = null;
        this.boss = null;
        this.shieldSecretDoor = null;
        this.shieldReturnDoor = null;
        this.shieldRoomTriggerCrates = null;
        particles.clear();

        if (levelNum === 1) {
            // Inicializar Nivel 1-1 (El Pasillo con plataformas, obstáculos y cofres)
            this.levelWidth = 2500;

            // Plataformas secretas (Habitaciones pequeñas de almas)
            this.platforms.push(new Platform(920, 200, 180));
            this.platforms.push(new Platform(1750, 180, 180));
            this.loreTablets.push(new LoreTablet(420, this.floorY - 52, "Cuando las cuatro coronas cayeron,|el mundo aprendio a temer la oscuridad.|Los lideres aun viven,|pero sus almas ya no les pertenecen.|Si encuentras las hogueras,|sigue su luz.|Cada llama recuerda el camino|hacia el primer trono encadenado."));

            // Cajas Rompibles (Crates)
            this.crates.push(new Crate(250, this.floorY - 38));
            this.crates.push(new Crate(720, this.floorY - 38));
            this.crates.push(new Crate(1080, this.floorY - 38));
            this.crates.push(new Crate(1080, this.floorY - 76)); // Doble caja
            this.crates.push(new Crate(1550, this.floorY - 38));
            this.crates.push(new Crate(940, 200 - 38)); // Caja en secret 1
            this.crates.push(new Crate(1770, 180 - 38)); // Caja en secret 2

            // Único cofre del nivel (monedas de oro en la plataforma secreta)
            this.chests.push(new TreasureChest(1000, 200 - 30, 'coins'));
            this.loreTablets.push(new LoreTablet(1720, 180 - 52, "El primer juramento se gana|sin huir del filo."));
            this.challengeDoors.push(new ChallengeDoor(1840, 180 - 64, 'w1-oath-door', 'SOBREVIVE AL JURAMENTO', 'survive', 'relic:wind_hook', { duration: 420 }));
            this.challengeDoors[this.challengeDoors.length - 1].options.failOnDamage = true;
            this.challengeDoors[this.challengeDoors.length - 1].options.cleanupOnComplete = true;
            this.challengeDoors[this.challengeDoors.length - 1].options.enemies = [
                new SkeletonArcher(1720, 180 - 54),
                new SkeletonArcher(1980, 180 - 54)
            ];

            // Obstáculos bajos (Spikes)
            this.spikes.push(new Spikes(460, this.floorY - 20, 2));
            this.spikes.push(new Spikes(900, this.floorY - 20, 3));
            this.spikes.push(new Spikes(1400, this.floorY - 20, 2));
            this.spikes.push(new Spikes(1750, this.floorY - 20, 4));

            // Obstáculos altos (CeilingBlade)
            this.blades.push(new CeilingBlade(600, 20, 260));
            this.blades.push(new CeilingBlade(1250, 20, 280));
            this.blades.push(new CeilingBlade(1650, 20, 260));

            // Enemigos voladores (Murciélagos)
            this.bats.push(new BatEnemy(350, this.floorY - 90));
            this.bats.push(new BatEnemy(800, this.floorY - 110));
            this.bats.push(new BatEnemy(1350, this.floorY - 120));
            this.bats.push(new BatEnemy(1950, this.floorY - 100));

            // Enemigos terrestres
            this.skeletons.push(new SkeletonMinion(760, this.floorY - 54));
            this.skeletons.push(new SkeletonMinion(1150, this.floorY - 54, 'helmet'));
            this.skeletons.push(new SkeletonMinion(1500, this.floorY - 54));
            const oathGuard = new SkeletonMinion(2050, this.floorY - 54, 'helmet');
            oathGuard.eliteType = 'storm';
            this.skeletons.push(oathGuard);

            // Hoguera checkpoint Nivel 1-1
            this.bonfire = {
                x: 2280,
                y: 380,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 1 && this.latestLitBonfire.lit,
                animTime: 0
            };

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 1-1", "#b642f5", 14, true);

        } else if (levelNum === 2) {
            // Inicializar Nivel 1-2 (Pasillo gótico con plataformas)
            this.levelWidth = 2200;

            // Plataformas flotantes
            this.platforms.push(new Platform(280, 340, 160));
            this.platforms.push(new Platform(500, 210, 160));
            this.platforms.push(new Platform(780, 290, 180));
            this.platforms.push(new Platform(1050, 180, 200));
            this.platforms.push(new Platform(1350, 280, 160));
            this.platforms.push(new Platform(1600, 190, 180));

            // Habitaciones/Plataformas secretas altas (acceso con gancho)
            this.platforms.push(new Platform(600, 80, 180));
            this.platforms.push(new Platform(1180, 80, 180));

            // Cajas Rompibles
            this.crates.push(new Crate(320, 302)); // Plataforma 1
            this.crates.push(new Crate(540, 172)); // Plataforma 2
            this.crates.push(new Crate(1400, 242)); // Plataforma 5
            this.crates.push(new Crate(100, this.floorY - 38)); // Suelo
            this.crates.push(new Crate(1300, this.floorY - 38)); // Suelo
            this.crates.push(new Crate(620, 80 - 38)); // Caja en secret 1
            this.crates.push(new Crate(1200, 80 - 38)); // Caja en secret 2

            // Único cofre del nivel (Alma Roja de Vida en la habitación secreta)
            this.chests.push(new TreasureChest(660, 80 - 30, 'red_coin')); // ALMA ROJA (Vida)

            // Trampas de Fuego
            this.fireTraps.push(new FireTrap(450, this.floorY - 16));
            this.fireTraps.push(new FireTrap(950, this.floorY - 16));
            this.fireTraps.push(new FireTrap(1500, this.floorY - 16));

            // Esqueletos Arqueros
            this.archers.push(new SkeletonArcher(520, 210 - 54)); // Plataforma 2
            this.archers.push(new SkeletonArcher(1080, 180 - 54)); // Plataforma 4
            this.archers.push(new SkeletonArcher(1620, 190 - 54)); // Plataforma 6
            this.archers.push(new SkeletonArcher(900, this.floorY - 54)); // Suelo

            // Enemigos voladores (Murciélagos normales)
            this.bats.push(new BatEnemy(400, 120));
            this.bats.push(new BatEnemy(850, 150));
            this.bats.push(new BatEnemy(1200, 110));
            this.bats.push(new BatEnemy(1700, 130));

            // Esqueletos normales patrullando
            this.skeletons.push(new SkeletonMinion(780, this.floorY - 54));
            this.skeletons.push(new SkeletonMinion(1400, this.floorY - 54, 'helmet'));

            // Picos
            this.spikes.push(new Spikes(700, this.floorY - 20, 2));
            this.spikes.push(new Spikes(1650, this.floorY - 20, 3));

            // Hoguera Checkpoint Nivel 1-2
            this.bonfire = {
                x: 1950,
                y: 380,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 2 && this.latestLitBonfire.lit,
                animTime: 0
            };

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 1-2", "#b642f5", 14, true);

        } else if (levelNum === 3) {
            // Inicializar Nivel 1-3 [NUEVO] (Pasillo de plataformas medievales largo y espaciado)
            this.levelWidth = 2600;

            // Plataformas flotantes
            this.platforms.push(new Platform(300, 320, 180));
            this.platforms.push(new Platform(600, 200, 160));
            this.platforms.push(new Platform(900, 300, 180));
            this.platforms.push(new Platform(1200, 180, 200));
            this.platforms.push(new Platform(1500, 285, 160));
            this.platforms.push(new Platform(1800, 190, 180));
            this.platforms.push(new Platform(2100, 300, 180));

            // Cajas y cofres
            this.crates.push(new Crate(350, 282)); // En plataforma 1
            this.crates.push(new Crate(1250, 142)); // En plataforma 4
            this.crates.push(new Crate(2150, 262)); // En plataforma 7
            // Único cofre del nivel (Cambiado a Monedas, en la plataforma secreta)
            this.chests.push(new TreasureChest(1850, 190 - 30, 'coins'));

            // Enemigos en el suelo
            this.spikes.push(new Spikes(750, this.floorY - 20, 2));
            this.spikes.push(new Spikes(1650, this.floorY - 20, 3));
            this.skeletons.push(new SkeletonMinion(400, this.floorY - 54));
            this.skeletons.push(new SkeletonMinion(1300, this.floorY - 54, 'helmet'));

            // Enemigos patrullando directamente sobre las plataformas de piedra!
            this.archers.push(new SkeletonArcher(620, 200 - 54));
            this.archers.push(new SkeletonArcher(1220, 180 - 54));
            this.skeletons.push(new SkeletonMinion(920, 300 - 54));
            this.skeletons.push(new SkeletonMinion(1820, 190 - 54, 'helmet'));
            this.bats.push(new BatEnemy(500, 100));
            this.bats.push(new BatEnemy(1400, 110));

            // Hoguera al final (Removida por balanceo de dificultad)
            this.bonfire = null;

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 1-3", "#b642f5", 14, true);

        } else if (levelNum === 4) {
            // Inicializar Nivel 1-4 (Cripta gótica secreta - Antes Nivel 4)
            this.levelWidth = 1400;

            // Plataformas flotantes
            this.platforms.push(new Platform(200, 320, 160));
            this.platforms.push(new Platform(480, 210, 160));
            this.platforms.push(new Platform(750, 300, 160));
            this.platforms.push(new Platform(1020, 200, 160));

            // Habitaciones/Plataformas secretas altas (acceso con gancho)
            this.platforms.push(new Platform(350, 90, 180));
            this.platforms.push(new Platform(880, 90, 180));

            // Cajas
            this.crates.push(new Crate(250, 282)); // En plataforma 1
            this.crates.push(new Crate(1060, 162)); // En plataforma 4
            this.crates.push(new Crate(370, 90 - 38)); // Caja en secret 1
            this.crates.push(new Crate(900, 90 - 38)); // Caja en secret 2

            // Trampas
            this.fireTraps.push(new FireTrap(600, this.floorY - 16));
            this.spikes.push(new Spikes(380, this.floorY - 20, 3));
            this.spikes.push(new Spikes(900, this.floorY - 20, 3));
            this.blades.push(new CeilingBlade(700, 20, 270));

            // Esqueletos Arqueros
            this.archers.push(new SkeletonArcher(500, 210 - 54));
            this.archers.push(new SkeletonArcher(1040, 200 - 54));
            this.archers.push(new SkeletonArcher(800, this.floorY - 54));

            // Murciélagos
            this.bats.push(new BatEnemy(300, 130));
            this.bats.push(new BatEnemy(900, 110));

            // Esqueletos (reubicados a la derecha para dar tiempo a reaccionar)
            this.skeletons.push(new SkeletonMinion(280, 320 - 54));
            this.skeletons.push(new SkeletonMinion(770, 300 - 54, 'helmet'));
            this.skeletons.push(new SkeletonMinion(450, this.floorY - 54));

            // Portal de salida final
            this.exitDoor = {
                x: 1320,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            this.bonfire = {
                x: 1180,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 4 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 1-4", "#b642f5", 14, true);

        } else if (levelNum === 5) {
            // Inicializar Nivel 1-5 [NUEVO] (Cámara del Rey Esqueleto)
            this.levelWidth = 960;

            // Cajas de apoyo en las esquinas de la arena
            this.crates.push(new Crate(50, this.floorY - 38));
            this.crates.push(new Crate(870, this.floorY - 38));

            if (this.bossDefeated) {
                this.boss = null;
                this.bonfire = {
                    x: 480,
                    y: 380,
                    width: 48,
                    height: 65,
                    lit: true,
                    animTime: 0
                };
                this.exitDoor = {
                    x: 820,
                    y: this.floorY - 60,
                    width: 40,
                    height: 60
                };
                this.domBossHud.classList.add('hidden');

                if (this.player && !this.player.hasLegendarySword) {
                    this.chests.push(new TreasureChest(340, this.floorY - 30, 'legendary_sword'));
                }
            } else {
                this.boss = new SkeletonBoss(650, this.floorY - 135);
                this.bonfire = null;
                this.exitDoor = null;
                this.domBossHud.classList.remove('hidden');
                this.updateBossHud();
            }

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 1-5 (JEFE)", "#ffd700", 14, true);

        } else if (levelNum === 6) {
            // Inicializar Nivel 2-1 (Catacumbas de Lava Verticales - Anterior Nivel 5)
            this.levelWidth = 2350;
            this.levelHeight = 1200;

            // Plataformas flotantes
            this.platforms.push(new Platform(150, 330, 160));
            this.platforms.push(new Platform(360, 230, 160));
            this.platforms.push(new Platform(180, 130, 160));
            this.platforms.push(new Platform(420, 100, 200));
            this.platforms.push(new Platform(680, 200, 180));

            // Escaleras hacia terraza intermedia
            this.platforms.push(new Platform(900, 300, 260, 25));
            this.platforms.push(new Platform(940, 265, 200, 15));
            this.platforms.push(new Platform(980, 230, 160, 15));
            this.platforms.push(new Platform(1020, 195, 120, 15));
            this.platforms.push(new Platform(1060, 160, 80, 15));
            this.platforms.push(new Platform(1100, 125, 150, 25));

            // Subida vertical extrema
            this.platforms.push(new Platform(1280, 60, 180, 25));
            this.platforms.push(new Platform(1480, -20, 160, 25));
            this.platforms.push(new Platform(1240, -105, 170, 25));
            this.platforms.push(new Platform(1000, -190, 190, 25));
            this.platforms.push(new Platform(1250, -280, 200, 25));
            this.platforms.push(new Platform(1440, -320, 150, 20));
            this.platforms.push(new Platform(1520, -360, 260, 25)); // Plataforma superior con el portal

            // Nuevas plataformas súper elevadas para exploración vertical
            this.platforms.push(new Platform(1600, -480, 150));
            this.platforms.push(new Platform(1350, -540, 160));
            this.platforms.push(new Platform(1100, -600, 150));
            this.platforms.push(new Platform(850, -540, 160));
            this.platforms.push(new Platform(600, -480, 180));

            // Ruta secreta
            this.platforms.push(new Platform(1810, -445, 120, 20));
            this.platforms.push(new Platform(1990, -455, 280, 25));

            // Habitaciones secretas de almas
            this.platforms.push(new Platform(300, -80, 180));
            this.platforms.push(new Platform(1100, -80, 180));

            // Portal de salida final
            this.exitDoor = {
                x: 1700,
                y: -360 - 60,
                width: 40,
                height: 60
            };

            // Cajas
            this.crates.push(new Crate(200, 292));
            this.crates.push(new Crate(460, 62));
            this.crates.push(new Crate(720, 162));
            this.crates.push(new Crate(920, 262));
            this.crates.push(new Crate(1320, 22));
            this.crates.push(new Crate(1560, -398));
            this.crates.push(new Crate(320, -80 - 38));
            this.crates.push(new Crate(1120, -80 - 38));
            this.crates.push(new Crate(620, -480 - 38)); // Caja alta
            this.crates.push(new Crate(1620, -480 - 38)); // Caja alta

            // Cofre de Tesoro: Único cofre (Cambiado a Monedas, en la plataforma central más alta del cielo)
            this.chests.push(new TreasureChest(1150, -600 - 30, 'coins'));

            // Obstáculos
            this.spikes.push(new Spikes(300, this.floorY - 20, 3));
            this.spikes.push(new Spikes(750, this.floorY - 20, 3));
            this.fireTraps.push(new FireTrap(550, this.floorY - 16));
            this.fireTraps.push(new FireTrap(1120, this.floorY - 16));

            // Murciélagos de Fuego
            this.bats.push(new BatEnemy(420, 70, true));
            this.bats.push(new BatEnemy(600, 120, true));
            this.bats.push(new BatEnemy(850, 80, true));
            this.bats.push(new BatEnemy(1320, -70, true));
            this.bats.push(new BatEnemy(1580, -250, true));
            this.bats.push(new BatEnemy(1100, -620, true)); // Murciélago de fuego alto

            // Esqueletos: la mayoria caen de un golpe con la espada de fuego; armadura completa aguanta dos.
            const skHigh = new SkeletonMinion(880, -540 - 54, 'full');
            this.skeletons.push(skHigh); // Esqueleto alto

            const sk1 = new SkeletonMinion(230, 330 - 54);
            this.skeletons.push(sk1);

            const sk2 = new SkeletonMinion(300, this.floorY - 54);
            this.skeletons.push(sk2);

            const sk3 = new SkeletonMinion(700, this.floorY - 54);
            this.skeletons.push(sk3);

            const sk4 = new SkeletonMinion(1290, 60 - 54, 'full');
            this.skeletons.push(sk4);

            const sk5 = new SkeletonMinion(1540, -360 - 54);
            this.skeletons.push(sk5);

            const arc1 = new SkeletonArcher(480, 100 - 54);
            arc1.hp = 40; arc1.maxHp = 40;
            this.archers.push(arc1);

            const arc2 = new SkeletonArcher(730, 200 - 54);
            arc2.hp = 40; arc2.maxHp = 40;
            this.archers.push(arc2);

            const arc3 = new SkeletonArcher(900, this.floorY - 54);
            arc3.hp = 40; arc3.maxHp = 40;
            this.archers.push(arc3);

            const arc4 = new SkeletonArcher(1260, -105 - 54);
            arc4.hp = 40; arc4.maxHp = 40;
            this.archers.push(arc4);

            const arcHigh = new SkeletonArcher(1380, -540 - 54);
            arcHigh.hp = 40; arcHigh.maxHp = 40;
            this.archers.push(arcHigh); // Arquero alto

            // Hoguera inicial del Mundo 2-1
            this.bonfire = {
                x: 115,
                y: 380,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 6 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.loreTablets.push(new LoreTablet(360, this.floorY - 52, "Bajo la ceniza duerme un fuego|que no obedece a ningun rey."));
            this.secretDoor = null;
            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 2-1", "#ff6600", 14, true);

        } else if (levelNum === 7) {
            // Inicializar Nivel 2-2 (Nivel de lava largo con Estalactitas y Alma Verde)
            this.levelWidth = 3000;
            this.levelHeight = 1100;

            // Plataformas flotantes en zigzag y capas elevadas
            this.platforms.push(new Platform(250, 340, 160));
            this.platforms.push(new Platform(500, 240, 160));
            this.platforms.push(new Platform(780, 320, 180));
            this.platforms.push(new Platform(1050, 200, 200));
            this.platforms.push(new Platform(1350, 300, 160));
            this.platforms.push(new Platform(1600, 210, 180));
            this.platforms.push(new Platform(1900, 310, 160));
            this.platforms.push(new Platform(2150, 200, 180));
            this.platforms.push(new Platform(2400, 320, 160));
            this.platforms.push(new Platform(2650, 220, 180));

            // Nuevas plataformas súper elevadas (enriquecimiento vertical)
            this.platforms.push(new Platform(1400, -80, 160));
            this.platforms.push(new Platform(1650, -180, 180));
            this.platforms.push(new Platform(1900, -280, 160));
            this.platforms.push(new Platform(2150, -180, 180));
            this.platforms.push(new Platform(2400, -80, 160));

            // Habitación secreta alta para el Alma Verde
            this.platforms.push(new Platform(1180, 50, 180));

            // Estalactitas de lava que gotean magma
            this.lavaStalactites.push(new LavaStalactite(300, 40));
            this.lavaStalactites.push(new LavaStalactite(800, 30));
            this.lavaStalactites.push(new LavaStalactite(1400, 40));
            this.lavaStalactites.push(new LavaStalactite(1950, 20));
            this.lavaStalactites.push(new LavaStalactite(2450, 30));

            // Cajas y el único cofre con Alma Verde
            this.crates.push(new Crate(280, 302));
            this.crates.push(new Crate(1200, 50 - 38)); // Caja protegiendo el cofre
            this.crates.push(new Crate(1420, -80 - 38)); // Caja alta
            this.crates.push(new Crate(2420, -80 - 38)); // Caja alta
            // Único cofre con Alma Verde (en la plataforma central más alta del cielo)
            this.chests.push(new TreasureChest(1950, -280 - 30, 'green_coin'));
            this.loreTablets.push(new LoreTablet(2155, -180 - 52, "La ceniza cura al que|se atreve a cruzar la llama."));
            this.loreTablets.push(new LoreTablet(1240, this.floorY - 52, "La puerta dorada llama|a tres guardias de ceniza."));
            this.challengeDoors.push(new ChallengeDoor(1320, this.floorY - 64, 'w2-ash-hunt-door', 'DERROTA A LOS GUARDIAS DE CENIZA', 'defeat', 'relic:ash_berry', {
                enemies: [
                    Object.assign(new SkeletonMinion(520, 240 - 54, 'helmet'), { visualTint: 'gold', hp: 90, maxHp: 90, chaseOnSight: true, chaseRange: 420, chaseHeightRange: 170, chaseSpeed: 1.9 }),
                    Object.assign(new SkeletonMinion(1660, -180 - 54, 'helmet'), { visualTint: 'gold', hp: 135, maxHp: 135, chaseOnSight: true, chaseRange: 420, chaseHeightRange: 170, chaseSpeed: 1.85 }),
                    Object.assign(new SkeletonMinion(2640, 220 - 54, 'helmet'), { visualTint: 'gold', hp: 90, maxHp: 90, chaseOnSight: true, chaseRange: 420, chaseHeightRange: 170, chaseSpeed: 1.9 })
                ],
                finalEnemy: Object.assign(new SkeletonMinion(1500, this.floorY - 78, 'full'), {
                    width: 54,
                    height: 78,
                    visualTint: 'red',
                    visualScale: 1.35,
                    visualGroundedSprite: true,
                    weaponStyle: 'greatsword',
                    shieldHits: 1,
                    hp: 180,
                    maxHp: 180,
                    damage: 13,
                    chaseOnSight: true,
                    chaseRange: 520,
                    chaseHeightRange: 180,
                    chaseSpeed: 2.05,
                    specialAttack: 'ash_greatsword',
                    specialTimer: 110
                })
            }));

            // Trampas y enemigos
            this.fireTraps.push(new FireTrap(650, this.floorY - 16));
            this.fireTraps.push(new FireTrap(1500, this.floorY - 16));
            this.spikes.push(new Spikes(950, this.floorY - 20, 3));
            this.spikes.push(new Spikes(1750, this.floorY - 20, 3));

            this.bats.push(new BatEnemy(450, 100, true));
            this.bats.push(new BatEnemy(1350, 120, true));
            this.bats.push(new BatEnemy(2200, 110, true));
            this.bats.push(new BatEnemy(1900, -360, true)); // Murciélago alto

            // Enemigos en plataformas
            this.archers.push(new SkeletonArcher(520, 240 - 54));
            this.skeletons.push(new SkeletonMinion(1620, 210 - 54));
            this.archers.push(new SkeletonArcher(2670, 220 - 54));

            // Nuevos enemigos en plataformas altas
            const skHigh = new SkeletonMinion(2180, -180 - 54, 'full');
            skHigh.eliteType = 'storm';
            this.skeletons.push(skHigh); // Esqueleto alto

            const arcHigh = new SkeletonArcher(1680, -180 - 54);
            arcHigh.hp = 40; arcHigh.maxHp = 40;
            this.archers.push(arcHigh); // Arquero alto

            // Salida
            this.exitDoor = {
                x: 2880,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            this.bonfire = null;
            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 2-2", "#ff6600", 14, true);

        } else if (levelNum === 8) {
            // Inicializar Nivel 2-3 (Ascenso vertical a gran escala con gancho, Escudo y Habitación Secreta)
            this.levelWidth = 4600;
            this.levelHeight = 1300;

            // Constelación de plataformas para escalar
            this.platforms.push(new Platform(200, 340, 180));
            this.platforms.push(new Platform(450, 240, 160));
            this.platforms.push(new Platform(700, 140, 180));
            this.platforms.push(new Platform(950, 40, 200));

            // Sección vertical de grappling extremo
            this.platforms.push(new Platform(1200, -60, 180));
            this.platforms.push(new Platform(1450, -160, 160));
            this.platforms.push(new Platform(1700, -260, 180));
            this.platforms.push(new Platform(1950, -360, 200));

            // Plataforma alta con el portal de entrada a la Habitación Secreta
            this.platforms.push(new Platform(2200, -440, 220));

            // Plataformas adicionales súper elevadas (enriquecimiento vertical)
            this.platforms.push(new Platform(1900, -520, 160));
            this.platforms.push(new Platform(1600, -600, 180));
            this.platforms.push(new Platform(1300, -680, 160));
            this.platforms.push(new Platform(1000, -600, 180));
            this.platforms.push(new Platform(700, -520, 160));

            // Plataformas de retorno
            this.platforms.push(new Platform(1800, 280, 200));
            this.platforms.push(new Platform(2100, 180, 200));

            // Elementos de la Habitación Secreta (completamente aislados y lejanos a x >= 4000 para invisibilidad)
            this.platforms.push(new Platform(4000, this.floorY - 180, 520, 20)); // Techo de piedra
            this.chests.push(new TreasureChest(4250, this.floorY - 30, 'shield')); // Único cofre (Escudo) en la recámara
            this.shieldSecretDoor = null; // Aparece al romper las dos cajas específicas
            this.shieldReturnDoor = new SecretDoor(4050, this.floorY - 60);

            // Estalactitas
            this.lavaStalactites.push(new LavaStalactite(500, 60));
            this.lavaStalactites.push(new LavaStalactite(1000, 20));
            this.lavaStalactites.push(new LavaStalactite(1500, -40));
            this.lavaStalactites.push(new LavaStalactite(1800, -100));

            // Cajas y Cajas desencadenadoras
            this.crates.push(new Crate(220, 302));
            const trig1 = new Crate(2220, -440 - 38);
            const trig2 = new Crate(2258, -440 - 38);
            this.crates.push(trig1);
            this.crates.push(trig2);
            this.shieldRoomTriggerCrates = [trig1, trig2];

            // Cajas en plataformas altas
            this.crates.push(new Crate(720, -520 - 38));
            this.crates.push(new Crate(1920, -520 - 38));

            // Fosa de picos grande en el suelo de la fosa central
            this.spikes.push(new Spikes(500, this.floorY - 20, 4));
            this.spikes.push(new Spikes(1000, this.floorY - 20, 4));
            this.spikes.push(new Spikes(1500, this.floorY - 20, 4));

            // Enemigos estándar
            this.bats.push(new BatEnemy(800, 100, true));
            this.bats.push(new BatEnemy(1400, 0, true));
            this.bats.push(new BatEnemy(2000, -150, true));
            this.archers.push(new SkeletonArcher(720, 140 - 54));
            this.archers.push(new SkeletonArcher(1720, -260 - 54));

            // Enemigos en plataformas altas
            this.archers.push(new SkeletonArcher(1630, -600 - 54));
            this.skeletons.push(new SkeletonMinion(1030, -600 - 54, 'full'));
            this.bats.push(new BatEnemy(1300, -750, true));

            // Hoguera checkpoint al final
            this.bonfire = {
                x: 2350,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 8 && this.latestLitBonfire.lit,
                animTime: 0
            };

            this.exitDoor = {
                x: 2480,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 2-3", "#ff6600", 14, true);

        } else if (levelNum === 9) {
            // Inicializar Nivel 2-4 (Caverna de lava con salida detrás de cajas y Cofre de Monedas)
            this.levelWidth = 2800;
            this.levelHeight = 1150;

            // Plataformas flotantes dispuestas en varios niveles
            this.platforms.push(new Platform(300, 320, 180));
            this.platforms.push(new Platform(550, 220, 180));
            this.platforms.push(new Platform(800, 120, 180));

            this.platforms.push(new Platform(1100, 300, 160));
            this.platforms.push(new Platform(1350, 180, 200));
            this.platforms.push(new Platform(1650, 80, 180));

            this.platforms.push(new Platform(1950, 290, 180));
            this.platforms.push(new Platform(2200, 190, 180));

            // Nuevas plataformas súper elevadas (enriquecimiento vertical)
            this.platforms.push(new Platform(1300, -80, 160));
            this.platforms.push(new Platform(1550, -180, 180));
            this.platforms.push(new Platform(1800, -280, 160));
            this.platforms.push(new Platform(2050, -180, 180));
            this.platforms.push(new Platform(2300, -80, 160));

            // Estalactitas
            this.lavaStalactites.push(new LavaStalactite(400, 30));
            this.lavaStalactites.push(new LavaStalactite(1200, 20));
            this.lavaStalactites.push(new LavaStalactite(1800, 40));
            this.lavaStalactites.push(new LavaStalactite(2300, 20));

            // Cajas
            this.crates.push(new Crate(320, 282));
            this.crates.push(new Crate(1380, 142));
            this.crates.push(new Crate(1320, -80 - 38)); // Caja alta
            this.crates.push(new Crate(2320, -80 - 38)); // Caja alta

            // Único cofre con monedas (5 monedas) en la plataforma central más alta del cielo
            this.chests.push(new TreasureChest(1850, -280 - 30, 'coins'));

            this.crates.push(new Crate(2550, this.floorY - 38));
            this.crates.push(new Crate(2550, this.floorY - 76)); // Caja apilada
            this.crates.push(new Crate(2588, this.floorY - 38)); // Caja de soporte

            this.exitDoor = {
                x: 2680,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            this.spikes.push(new Spikes(950, this.floorY - 20, 4));
            this.spikes.push(new Spikes(1750, this.floorY - 20, 4));
            this.bats.push(new BatEnemy(1200, 130, true));
            this.bats.push(new BatEnemy(2000, 100, true));
            this.bats.push(new BatEnemy(2050, -260, true)); // Murciélago alto

            this.archers.push(new SkeletonArcher(570, 220 - 54));
            this.archers.push(new SkeletonArcher(1370, 180 - 54));
            this.skeletons.push(new SkeletonMinion(1970, 290 - 54));

            // Nuevos enemigos en plataformas altas
            const skHigh = new SkeletonMinion(1820, -280 - 54, 'full');
            this.skeletons.push(skHigh); // Esqueleto alto

            const arcHigh = new SkeletonArcher(1580, -180 - 54);
            arcHigh.hp = 40; arcHigh.maxHp = 40;
            this.archers.push(arcHigh); // Arquero alto

            this.bonfire = null;
            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 2-4", "#ff6600", 14, true);

        } else if (levelNum === 10) {
            // Inicializar Nivel 2-5 (Pista de obstáculos extremas con Cofre de Poción)
            this.levelWidth = 2900;
            this.levelHeight = 1150;

            // Plataformas móviles y fijas para un recorrido de obstáculos de magma
            this.platforms.push(new Platform(200, 330, 160));
            this.platforms.push(new Platform(450, 220, 160));
            this.platforms.push(new Platform(700, 310, 160));
            this.platforms.push(new Platform(950, 200, 160));
            this.platforms.push(new Platform(1200, 290, 160));
            this.platforms.push(new Platform(1450, 180, 160));
            this.platforms.push(new Platform(1700, 300, 160));
            this.platforms.push(new Platform(1950, 190, 160));
            this.platforms.push(new Platform(2200, 310, 160));
            this.platforms.push(new Platform(2450, 200, 160));

            // Nuevas plataformas súper elevadas (enriquecimiento vertical)
            this.platforms.push(new Platform(400, -80, 160));
            this.platforms.push(new Platform(650, -180, 180));
            this.platforms.push(new Platform(900, -280, 160));
            this.platforms.push(new Platform(1150, -180, 180));
            this.platforms.push(new Platform(1400, -80, 160));

            // Estalactitas constantes
            this.lavaStalactites.push(new LavaStalactite(300, 40));
            this.lavaStalactites.push(new LavaStalactite(800, 30));
            this.lavaStalactites.push(new LavaStalactite(1350, 40));
            this.lavaStalactites.push(new LavaStalactite(1850, 30));
            this.lavaStalactites.push(new LavaStalactite(2350, 40));

            // Obstáculos extremos y el único cofre con Poción
            this.fireTraps.push(new FireTrap(600, this.floorY - 16));
            this.fireTraps.push(new FireTrap(1350, this.floorY - 16));
            this.fireTraps.push(new FireTrap(2100, this.floorY - 16));
            this.spikes.push(new Spikes(950, this.floorY - 20, 3));
            this.spikes.push(new Spikes(1750, this.floorY - 20, 3));
            this.spikes.push(new Spikes(2500, this.floorY - 20, 3));

            // Cajas
            this.crates.push(new Crate(420, -80 - 38)); // Caja alta
            this.crates.push(new Crate(1420, -80 - 38)); // Caja alta

            // Único cofre con poción curativa de emergencia (en la plataforma central más alta del cielo)
            this.chests.push(new TreasureChest(950, -280 - 30, 'potion'));

            this.bats.push(new BatEnemy(600, 120, true));
            this.bats.push(new BatEnemy(1800, 100, true));
            this.bats.push(new BatEnemy(900, -360, true)); // Murciélago alto

            this.archers.push(new SkeletonArcher(970, 200 - 54));
            this.archers.push(new SkeletonArcher(2470, 200 - 54));

            // Nuevos enemigos en plataformas altas
            const skHigh = new SkeletonMinion(920, -280 - 54, 'full');
            this.skeletons.push(skHigh); // Esqueleto alto

            const arcHigh = new SkeletonArcher(680, -180 - 54);
            arcHigh.hp = 40; arcHigh.maxHp = 40;
            this.archers.push(arcHigh); // Arquero alto

            this.exitDoor = {
                x: 2750,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            this.bonfire = {
                x: 2620,
                y: 380,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 10 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 2-5", "#ff6600", 14, true);

        } else if (levelNum === 11) {
            // Inicializar Nivel 2-6 [NUEVO] (Cámara del Demonio Ígneo)
            this.levelWidth = 960;

            this.crates.push(new Crate(50, this.floorY - 38));
            this.crates.push(new Crate(870, this.floorY - 38));

            if (this.boss2Defeated) {
                this.boss = null;
                this.bonfire = {
                    x: 480,
                    y: 380,
                    width: 48,
                    height: 65,
                    lit: true,
                    animTime: 0
                };
                this.exitDoor = {
                    x: 820,
                    y: this.floorY - 60,
                    width: 40,
                    height: 60
                };
                this.domBossHud.classList.add('hidden');
            } else {
                this.boss = new FireDemonBoss(650, this.floorY - 145);
                this.bonfire = null;
                this.exitDoor = null;
                this.domBossHud.classList.remove('hidden');
                this.updateBossHud();
            }

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 2-6 (JEFE)", "#ff2200", 14, true);

        } else if (levelNum === 12) {
            // Nivel 3-1 (El Sendero del Bosque)
            this.levelWidth = 3000;
            this.levelHeight = 1500; // Extendida un 15% verticalmente

            this.bonfire = {
                x: 115,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 12 && this.latestLitBonfire.lit,
                animTime: 0
            };

            this.exitDoor = {
                x: 2850,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };
            this.loreTablets.push(new LoreTablet(280, this.floorY - 52, "El bosque no esta en silencio.|Esta escogiendo a quien deja pasar."));

            // === PARKOUR MIXTO: salto normal + gancho ===
            // Zona baja — alcanzable a saltos (parkour)
            this.platforms.push(new Platform(380, 290, 150, 25, 'wood'));
            this.platforms.push(new Platform(580, 200, 140, 25, 'wood'));
            this.platforms.push(new Platform(780, 290, 150, 25, 'wood'));
            this.platforms.push(new Platform(980, 180, 150, 25, 'wood'));
            this.platforms.push(new Platform(1180, 290, 140, 25, 'wood'));

            // Zona media — mezcla salto y gancho
            this.platforms.push(new Platform(1380, 100, 150, 25, 'wood'));
            this.platforms.push(new Platform(1600, 200, 150, 25, 'wood'));
            this.platforms.push(new Platform(1820, 60, 150, 25, 'wood'));
            this.platforms.push(new Platform(2040, 180, 150, 25, 'wood'));

            // Zona alta — escalada con gancho vertical épica (tiers extendidos)
            this.platforms.push(new Platform(2100, -250, 150, 25, 'wood')); // requiere gancho
            this.platforms.push(new Platform(2350, -420, 150, 25, 'wood')); // requiere gancho
            this.platforms.push(new Platform(2600, -280, 150, 25, 'wood')); // requiere gancho
            this.platforms.push(new Platform(2700, -500, 150, 25, 'wood')); // tier superior final del cofre
            this.chests.push(new TreasureChest(2740, -500 - 30, 'coins')); // Único cofre
            this.loreTablets.push(new LoreTablet(2310, -420 - 52, "Si el rayo no te mata,|puede jurarte lealtad."));

            // Puentes entre plataformas existentes del mundo 3-1
            this.addWorld3BridgeBetween(this.platforms[0], this.platforms[2]);
            this.addWorld3BridgeBetween(this.platforms[2], this.platforms[4]);
            this.addWorld3BridgeBetween(this.platforms[6], this.platforms[8]);

            // Cajas en zonas accesibles
            this.crates.push(new Crate(410, 252));
            this.crates.push(new Crate(1210, 252));
            this.crates.push(new Crate(2060, 142));

            // Spikes en el suelo
            this.spikes.push(new Spikes(700, this.floorY - 20, 3));
            this.spikes.push(new Spikes(1700, this.floorY - 20, 3));

            // Enemigos
            this.skeletons.push(new GoblinSwordsman(850, this.floorY - 54, 'blade'));
            const stormGoblin = new GoblinSwordsman(2000, this.floorY - 54, 'wood_shield');
            stormGoblin.eliteType = 'storm';
            stormGoblin.hp = Math.max(stormGoblin.hp || 0, 85);
            stormGoblin.maxHp = stormGoblin.hp;
            this.skeletons.push(stormGoblin);
            this.archers.push(new GoblinArcher(410, 290 - 54));
            this.archers.push(new GoblinArcher(1610, 200 - 54));
            this.archers.push(new GoblinArcher(2360, -420 - 54)); // En la plataforma de altura
            this.bats.push(new ChasingBird(1100, 50));
            this.bats.push(new ChasingBird(2300, -150));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 3-1", "#00ff66", 14, true);

        } else if (levelNum === 13) {
            // Nivel 3-2 (La Espesura Goblínica)
            this.levelWidth = 3100;
            this.levelHeight = 1500; // Extendida un 15% verticalmente

            this.bonfire = null; // Sin hoguera por petición del usuario
            this.exitDoor = {
                x: 2020,
                y: 190 - 60,
                width: 40,
                height: 60
            };

            // === PARKOUR MIXTO ===
            // Plataformas bajas — saltables
            this.platforms.push(new Platform(360, 300, 150, 25, 'wood'));
            this.platforms.push(new Platform(540, 210, 140, 25, 'wood'));
            this.platforms.push(new Platform(720, 310, 150, 25, 'wood'));
            this.platforms.push(new Platform(920, 200, 150, 25, 'wood'));
            this.platforms.push(new Platform(1120, 310, 140, 25, 'wood'));
            this.platforms.push(new Platform(1320, 190, 150, 25, 'wood'));

            // Zona media — mezcla gancho y salto
            this.platforms.push(new Platform(1520, 80, 150, 25, 'wood'));
            this.platforms.push(new Platform(1760, 210, 150, 25, 'wood'));
            this.platforms.push(new Platform(2000, 190, 150, 25, 'wood')); // puerta aquí
            this.platforms.push(new Platform(2240, 60, 150, 25, 'wood'));

            // Zona alta — escalada con gancho y tiers elevados
            this.platforms.push(new Platform(2300, -250, 150, 25, 'wood'));
            this.platforms.push(new Platform(2520, -420, 150, 25, 'wood'));
            this.platforms.push(new Platform(2950, -500, 150, 25, 'wood'));// cofre en la copa final
            this.chests.push(new TreasureChest(2990, -500 - 30, 'coins'));
            this.chests[this.chests.length - 1].eventType = 'ambush';
            this.loreTablets.push(new LoreTablet(2920, -500 - 52, "La copa guarda premios|y tambien dientes."));

            // Puentes entre plataformas existentes del mundo 3-2
            this.addWorld3BridgeBetween(this.platforms[0], this.platforms[2]);
            this.addWorld3BridgeBetween(this.platforms[2], this.platforms[4]);
            this.addWorld3BridgeBetween(this.platforms[7], this.platforms[8]);

            // Cajas
            this.crates.push(new Crate(390, 262));
            this.crates.push(new Crate(1150, 272, 'ambush')); // ¡Caja trampa sorpresa con Emboscada!
            this.crates.push(new Crate(2090, 152)); // Corregido: caja alejada de la puerta

            // Spikes y Fire traps
            this.spikes.push(new Spikes(850, this.floorY - 20, 3));
            this.spikes.push(new Spikes(2100, this.floorY - 20, 4));
            this.fireTraps.push(new FireTrap(530, this.floorY - 16));
            this.fireTraps.push(new FireTrap(1600, this.floorY - 16));

            // Enemigos
            this.skeletons.push(new GoblinSwordsman(700, this.floorY - 54, 'blade'));
            this.skeletons.push(new GoblinSwordsman(2100, this.floorY - 54, 'armored'));
            this.archers.push(new GoblinArcher(370, 300 - 54));
            this.archers.push(new GoblinArcher(1330, 190 - 54));
            this.archers.push(new GoblinArcher(1770, 210 - 54));
            this.archers.push(new GoblinArcher(2530, -420 - 54));
            this.bats.push(new ChasingBird(500, 80));
            this.bats.push(new ChasingBird(1800, -60));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 3-2", "#00ff66", 14, true);

        } else if (levelNum === 14) {
            // Nivel 3-3 (Las Cúpulas de los Árboles) + **EL PUZZLE DE LA LLAVE AL LÍMITE DEL GANCHO**
            this.levelWidth = 3600;
            this.levelHeight = 1500; // Extendida un 15% verticalmente

            this.bonfire = {
                x: 1885,
                y: 50 - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 14 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = {
                x: 3480,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            // === PARKOUR MIXTO + PUZZLE DE LA LLAVE ===
            // Zona baja/media — saltable
            this.platforms.push(new Platform(370, 300, 150, 25, 'wood'));
            this.platforms.push(new Platform(540, 200, 140, 25, 'wood'));
            this.platforms.push(new Platform(720, 300, 150, 25, 'wood'));
            this.platforms.push(new Platform(900, 180, 150, 25, 'wood'));
            this.platforms.push(new Platform(1100, 300, 140, 25, 'wood'));
            this.platforms.push(new Platform(1300, 170, 150, 25, 'wood'));

            // Zona media
            this.platforms.push(new Platform(1550, 60, 150, 25, 'wood'));
            this.platforms.push(new Platform(1880, 50, 150, 25, 'wood'));  // Hoguera aquí
            this.platforms.push(new Platform(2120, 190, 140, 25, 'wood'));
            this.platforms.push(new Platform(2360, -50, 150, 25, 'wood'));

            // Zona alta de tiers (acceso con gancho épico en vertical)
            this.platforms.push(new Platform(2550, -180, 150, 25, 'wood')); // requiere gancho
            this.platforms.push(new Platform(2750, -320, 150, 25, 'wood')); // requiere gancho

            // **Plataforma A** — desde donde se lanza el salto de fe
            this.platforms.push(new Platform(2950, -320, 150, 25, 'wood'));
            this.chests.push(new TreasureChest(2990, -320 - 30, 'coins')); // Único cofre

            // **Plataforma B (LLAVE)** — al límite extremo de la distancia del gancho (277px)
            // Borde derecho de A: x=2950+150=3100.
            // Si el jugador salta cubriendo ~160px de velocidad horizontal, se ubica en x=3260.
            // B comienza en x=3480, con centro en x=3535.
            // Distancia del gancho en el aire: 3535 - 3260 = 275px, altura dy = 35px.
            // Distancia Euclidiana: Math.sqrt(275^2 + 35^2) = 277px (límite de 280px).
            this.platforms.push(new Platform(3480, -355, 110, 25, 'wood'));
            this.crates.push(new Crate(3510, -355 - 38, 'forest_key'));

            // Puentes entre plataformas existentes del mundo 3-3
            this.addWorld3BridgeBetween(this.platforms[0], this.platforms[2]);
            this.addWorld3BridgeBetween(this.platforms[2], this.platforms[4]);
            this.addWorld3BridgeBetween(this.platforms[6], this.platforms[7]);

            // Cajas
            this.crates.push(new Crate(400, 262));
            this.crates.push(new Crate(1110, 262));
            this.crates.push(new Crate(2130, 152));

            // Spikes
            this.spikes.push(new Spikes(680, this.floorY - 20, 3));
            this.spikes.push(new Spikes(2040, this.floorY - 20, 4));

            // Enemigos
            this.skeletons.push(new GoblinSwordsman(500, this.floorY - 54, 'wood_shield'));
            this.skeletons.push(new GoblinSwordsman(1700, this.floorY - 54, 'blade'));
            this.archers.push(new GoblinArcher(380, 300 - 54));
            this.archers.push(new GoblinArcher(910, 180 - 54));
            this.archers.push(new GoblinArcher(2560, -180 - 54));
            this.bats.push(new ChasingBird(600, 70));
            this.bats.push(new ChasingBird(1600, -120));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 3-3", "#00ff66", 14, true);

        } else if (levelNum === 15) {
            // Nivel 3-4 (El Pantano Sombrío)
            this.levelWidth = 3300;
            this.levelHeight = 3300; // Altura extra para el ascensor secreto del trueno

            this.bonfire = null; // Sin hoguera por petición del usuario
            this.exitDoor = {
                x: 2020,
                y: 185 - 60,
                width: 40,
                height: 60
            };
            this.world3StormSecretTablet = new LoreTablet(2070, this.floorY - 52, "No todo camino|nace en el suelo.");
            this.world3StormSecretTablet.secretType = 'storm_puzzle';
            this.loreTablets.push(this.world3StormSecretTablet);
            this.world3StormChest = new TreasureChest(2148, -2380 - 30, 'storm_relic');
            this.world3StormChest.requiresStormPuzzle = true;
            this.world3StormChest.unlocked = this.unlockedStormRelicPuzzle || this.acquiredRelics.has('storm_oath');
            this.world3StormChest.hidden = !this.world3StormChest.unlocked && !this.acquiredRelics.has('storm_oath');
            this.chests.push(this.world3StormChest);
            if (this.acquiredRelics.has('storm_oath')) {
                this.world3StormChest.opened = true;
                this.world3StormChest.hidden = false;
            }
            const stormSecretVisible = this.unlockedStormRelicPuzzle || this.acquiredRelics.has('storm_oath');

            // === PARKOUR MIXTO ===
            // Zona baja — saltable
            this.platforms.push(new Platform(360, 295, 150, 25, 'wood'));
            this.platforms.push(new Platform(540, 195, 140, 25, 'wood'));
            this.platforms.push(new Platform(720, 300, 150, 25, 'wood'));
            this.platforms.push(new Platform(920, 185, 150, 25, 'wood'));
            this.platforms.push(new Platform(1120, 300, 140, 25, 'wood'));
            this.platforms.push(new Platform(1320, 175, 150, 25, 'wood'));

            // Zona media — mezcla gancho y salto
            this.platforms.push(new Platform(1520, 70, 150, 25, 'wood'));
            this.platforms.push(new Platform(1760, 200, 150, 25, 'wood'));
            this.platforms.push(new Platform(2000, 185, 150, 25, 'wood')); // puerta aquí
            this.platforms.push(new Platform(2240, 55, 150, 25, 'wood'));

            // Zona alta — tiers elevados y copas de los árboles
            this.platforms.push(new Platform(2300, -250, 150, 25, 'wood'));
            this.platforms.push(new Platform(2520, -420, 150, 25, 'wood'));
            this.platforms.push(new Platform(2750, -580, 150, 25, 'wood'));
            this.platforms.push(new Platform(2950, -700, 150, 25, 'wood'));// cofre en la cima extrema
            this.chests.push(new TreasureChest(2990, -700 - 30, 'coins'));
            this.world3StormElevator = new StormElevatorPlatform(3120, -700, -2200, 170, 22);
            if (stormSecretVisible) {
                this.world3StormElevator.activate();
            } else {
                this.world3StormElevator.hidden = true;
            }
            this.platforms.push(this.world3StormElevator);
            this.world3StormSecretPlatforms = [
                new Platform(2920, -2220, 150, 22, 'wood'),
                new Platform(2660, -2365, 140, 22, 'wood'),
                new Platform(2400, -2510, 140, 22, 'wood'),
                new Platform(2140, -2380, 160, 22, 'wood')
            ];
            this.world3StormSecretPlatforms.forEach(platform => {
                platform.hidden = !stormSecretVisible;
                this.platforms.push(platform);
            });
            this.world3StormLever = {
                x: 2205,
                y: -2380 - 32,
                width: 24,
                height: 32,
                visible: stormSecretVisible,
                activated: this.unlockedStormRelicPuzzle || this.acquiredRelics.has('storm_oath')
            };

            // Puentes entre plataformas existentes del mundo 3-4
            this.addWorld3BridgeBetween(this.platforms[0], this.platforms[2]);
            this.addWorld3BridgeBetween(this.platforms[2], this.platforms[4]);
            this.addWorld3BridgeBetween(this.platforms[7], this.platforms[8]);

            // Cajas
            this.crates.push(new Crate(390, 257));
            this.crates.push(new Crate(1130, 262));
            this.crates.push(new Crate(2090, 147, 'ambush')); // ¡Caja trampa con emboscada goblin justo antes de la puerta!

            // Spikes, fire traps y cuchillas
            this.spikes.push(new Spikes(900, this.floorY - 20, 4));
            this.spikes.push(new Spikes(2500, this.floorY - 20, 4));
            this.fireTraps.push(new FireTrap(680, this.floorY - 16));
            this.blades.push(new CeilingBlade(650, 20, 250));
            this.blades.push(new CeilingBlade(1600, 20, 260));

            // Enemigos
            this.skeletons.push(new GoblinSwordsman(1500, this.floorY - 54, 'armored'));
            this.archers.push(new GoblinArcher(370, 295 - 54));
            this.archers.push(new GoblinArcher(1770, 200 - 54));
            this.archers.push(new GoblinArcher(2760, -580 - 54));
            this.bats.push(new ChasingBird(950, 90));
            this.bats.push(new ChasingBird(2100, -70));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 3-4", "#00ff66", 14, true);

        } else if (levelNum === 16) {
            // Nivel 3-5 (El Laberinto de Raíces) + **EL PORTÓN CERRADO**
            this.levelWidth = 3500;
            this.levelHeight = 1500; // Extendida un 15% verticalmente

            this.bonfire = null;
            this.exitDoor = {
                x: 3380,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            // === PARKOUR MIXTO ===
            // Zona baja — saltable
            this.platforms.push(new Platform(370, 305, 150, 25, 'wood'));
            this.platforms.push(new Platform(550, 195, 140, 25, 'wood'));
            this.platforms.push(new Platform(730, 305, 150, 25, 'wood'));
            this.platforms.push(new Platform(920, 185, 150, 25, 'wood'));
            this.platforms.push(new Platform(1110, 305, 140, 25, 'wood'));
            this.platforms.push(new Platform(1300, 180, 150, 25, 'wood'));

            // Zona media — mezcla
            this.platforms.push(new Platform(1500, 75, 150, 25, 'wood'));
            this.platforms.push(new Platform(1740, 210, 150, 25, 'wood'));
            this.platforms.push(new Platform(1980, 60, 150, 25, 'wood'));
            this.platforms.push(new Platform(2220, 195, 150, 25, 'wood'));
            this.platforms.push(new Platform(2460, 50, 150, 25, 'wood'));

            // Zona alta — tiers elevados góticos forestales
            this.platforms.push(new Platform(2500, -220, 150, 25, 'wood'));
            this.platforms.push(new Platform(2720, -390, 150, 25, 'wood'));
            this.platforms.push(new Platform(2950, -560, 150, 25, 'wood'));
            this.platforms.push(new Platform(3170, -720, 150, 25, 'wood'));// cofre final
            this.chests.push(new TreasureChest(3210, -720 - 30, 'coins'));

            // Puentes entre plataformas existentes del mundo 3-5
            this.addWorld3BridgeBetween(this.platforms[0], this.platforms[2]);
            this.addWorld3BridgeBetween(this.platforms[2], this.platforms[4]);
            this.addWorld3BridgeBetween(this.platforms[6], this.platforms[8]);

            // Cajas
            this.crates.push(new Crate(400, 267));
            this.crates.push(new Crate(1260, 267, 'ambush')); // ¡Caja trampa sorpresa con emboscada!
            this.crates.push(new Crate(2230, 157));

            // Fire traps & spikes
            this.fireTraps.push(new FireTrap(530, this.floorY - 16));
            this.fireTraps.push(new FireTrap(1800, this.floorY - 16));
            this.spikes.push(new Spikes(870, this.floorY - 20, 3));
            this.spikes.push(new Spikes(2250, this.floorY - 20, 3));

            // Enemigos
            this.skeletons.push(new GoblinSwordsman(900, this.floorY - 54, 'blade'));
            this.skeletons.push(new GoblinSwordsman(2400, this.floorY - 54, 'wood_shield'));
            this.archers.push(new GoblinArcher(550, 195 - 54));
            this.archers.push(new GoblinArcher(1740, 210 - 54));
            this.archers.push(new GoblinArcher(2950, 85 - 54));
            this.bats.push(new ChasingBird(500, 90));
            this.bats.push(new ChasingBird(1750, -70));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 3-5", "#00ff66", 14, true);

        } else if (levelNum === 17) {
            // Nivel 3-6 (El Claro de la Hoguera) con hoguera final interactiva
            this.levelWidth = 3100;
            this.levelHeight = 1500; // Extendida un 15% verticalmente

            // === PARKOUR MIXTO ===
            // Zona baja — saltable
            this.platforms.push(new Platform(380, 295, 150, 25, 'wood'));
            this.platforms.push(new Platform(560, 190, 140, 25, 'wood'));
            this.platforms.push(new Platform(740, 295, 150, 25, 'wood'));
            this.platforms.push(new Platform(930, 180, 150, 25, 'wood'));
            this.platforms.push(new Platform(1120, 295, 140, 25, 'wood'));

            // Zona media — mezcla
            this.platforms.push(new Platform(1320, 80, 150, 25, 'wood'));
            this.platforms.push(new Platform(1560, 210, 150, 25, 'wood'));
            this.platforms.push(new Platform(1800, 65, 150, 25, 'wood'));
            this.platforms.push(new Platform(2040, 200, 150, 25, 'wood'));

            // Zona alta — tiers elevados y cúpulas del bosque
            this.platforms.push(new Platform(2040, -150, 150, 25, 'wood'));
            this.platforms.push(new Platform(2280, -320, 150, 25, 'wood'));
            this.platforms.push(new Platform(2520, -490, 150, 25, 'wood'));
            this.platforms.push(new Platform(2750, -650, 150, 25, 'wood'));// cofre final
            this.chests.push(new TreasureChest(2790, -650 - 30, 'coins'));

            // Dos puentes entre plataformas existentes del mundo 3-6
            this.addWorld3BridgeBetween(this.platforms[0], this.platforms[2]);
            this.addWorld3BridgeBetween(this.platforms[2], this.platforms[4]);
            this.addWorld3BridgeBetween(this.platforms[5], this.platforms[7]);
            this.addWorld3BridgeBetween(this.platforms[6], this.platforms[8]);

            // Cajas
            this.crates.push(new Crate(410, 257));
            this.crates.push(new Crate(1120, 257));

            this.spikes.push(new Spikes(900, this.floorY - 20, 3));
            this.spikes.push(new Spikes(2100, this.floorY - 20, 3));

            this.skeletons.push(new GoblinSwordsman(700, this.floorY - 54, 'armored'));
            this.archers.push(new GoblinArcher(560, 190 - 54));
            this.archers.push(new GoblinArcher(1560, 210 - 54));
            this.archers.push(new GoblinArcher(2520, 90 - 54));
            this.bats.push(new ChasingBird(1100, 50));

            // Hoguera Checkpoint justo antes del jefe final
            this.bonfire = {
                x: 2780,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 17 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.loreTablets.push(new LoreTablet(2660, this.floorY - 52, "Cuando el gigante caiga,|el cielo abrira otra guerra."));

            this.exitDoor = {
                x: 2940,
                y: this.floorY - 60,
                width: 40,
                height: 60
            };

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 3-6", "#00ff66", 14, true);

        } else if (levelNum === 18) {
            // Nivel 3-7 (Cámara del Duende Gigante - JEFE FINAL MUNDO 3)
            this.levelWidth = 960;
            this.levelHeight = 750;

            this.crates.push(new Crate(50, this.floorY - 38));
            this.crates.push(new Crate(870, this.floorY - 38));

            // Plataformas altas de respiro: alcanzables con gancho desde la arena
            this.platforms.push(new Platform(145, this.floorY - 205, 150, 25, 'wood'));
            this.platforms.push(new Platform(665, this.floorY - 205, 150, 25, 'wood'));

            if (this.boss3Defeated) {
                this.boss = null;
                this.bonfire = {
                    x: 480,
                    y: 380,
                    width: 48,
                    height: 65,
                    lit: true,
                    animTime: 0
                };
                this.exitDoor = {
                    x: 820,
                    y: this.floorY - 60,
                    width: 40,
                    height: 60
                };
                this.domBossHud.classList.add('hidden');
            } else {
                this.boss = new GiantGoblinBoss(650, this.floorY - 135);
                this.bonfire = null;
                this.exitDoor = null;
                this.domBossHud.classList.remove('hidden');
                this.updateBossHud();
            }

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 3-7 (JEFE)", "#00ff66", 14, true);
        } else if (levelNum === 19) {
            // Nivel 4-1 (Entrada a la Fortaleza Celestial)
            this.levelWidth = 3000;
            this.levelHeight = 1200;
            this.bonfire = {
                x: 120,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 19 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 2860, y: 85, width: 40, height: 60 };

            // Escalinata vertical de piedra conectando el suelo a las alturas
            this.platforms.push(new Platform(300, 340, 120, 20));
            this.platforms.push(new Platform(450, 260, 120, 20));
            this.platforms.push(new Platform(600, 180, 120, 20));

            // Gran puente gótico aéreo de piedra
            this.platforms.push(new Platform(750, 100, 550, 20));

            // Más plataformas e interconexiones verticales
            this.platforms.push(new Platform(1400, 220, 150, 20));
            this.platforms.push(new Platform(1650, 300, 150, 20));
            this.platforms.push(new Platform(1900, 200, 150, 20));

            // Segundo puente aéreo gigante
            this.platforms.push(new Platform(2150, 100, 500, 20));
            this.platforms.push(new Platform(2750, 145, 200, 20));

            // Súper ráfagas de viento para impulsar saltos y acrobacias
            this.windCurrents.push(new WindCurrent(500, -100, 100, this.floorY + 100, -1.1));
            this.windCurrents.push(new WindCurrent(1800, -100, 100, this.floorY + 100, -1.15));
            this.platforms.push(new CrumblingPlatform(1325, 145, 115, 20));
            this.platforms.push(new CrumblingPlatform(2020, 150, 120, 20));
            this.windCrystals.push(new WindCrystal(1460, 188));
            this.lightningTraps.push(new LightningTrap(1710, 115, 315));
            this.windSentinels.push(new WindSentinel(1510, 135));
            this.loreTablets.push(new LoreTablet(360, this.floorY - 52, "El castillo no cayo.|Se nego a tocar la tierra."));
            this.loreTablets.push(new LoreTablet(2180, 100 - 52, "El trono prueba dos veces.|Cuando cae la primera guardia,|la segunda aparece junto a tu sombra."));
            const makeVaultKnight = (x, y, variant) => {
                const enemy = new SkeletonMinion(x, y, variant);
                enemy.chaseOnSight = true;
                enemy.chaseRange = 620;
                enemy.chaseHeightRange = 260;
                enemy.chaseSpeed = variant === 'knight_full' ? 1.9 : 2.15;
                return enemy;
            };
            const makeVaultArcher = (x, y) => {
                const archer = new SkeletonArcher(x, y, 'helmetless');
                archer.shootRange = 560;
                archer.shootHeightRange = 300;
                return archer;
            };
            this.challengeDoors.push(new ChallengeDoor(2450, 100 - 64, 'w4-throne-hordes', 'DERROTA LAS HORDAS DEL TRONO', 'defeat', 'none', {
                autoOpenOnComplete: true,
                coinRewardOnComplete: 10,
                waves: [
                    {
                        label: 'PRIMERA HORDA',
                        enemies: [
                            makeVaultKnight(2320, 100 - 54, 'knight_full'),
                            makeVaultKnight(2580, 100 - 54, 'knight_full')
                        ]
                    },
                    {
                        label: 'SEGUNDA HORDA',
                        nearPlayer: true,
                        offsets: [-135, 135, -235, 235],
                        enemies: [
                            makeVaultKnight(0, 0, 'knight_light'),
                            makeVaultKnight(0, 0, 'knight_light'),
                            makeVaultArcher(0, 0),
                            makeVaultArcher(0, 0)
                        ]
                    }
                ]
            }));

            this.crates.push(new Crate(1230, 100 - 38));
            this.chests.push(new TreasureChest(640, 180 - 30, 'coins'));
            this.chests.push(new TreasureChest(2480, 100 - 30, 'coins'));
            this.chests[this.chests.length - 1].requiresChallenge = 'w4-throne-hordes';
            this.chests[this.chests.length - 1].coinCount = 15;
            this.spikes.push(new Spikes(1480, this.floorY - 20, 3));
            this.blades.push(new CeilingBlade(1160, -80, 210));

            // Incremento masivo de patrullas enemigas blindadas y arqueros angulares
            this.skeletons.push(new SkeletonMinion(600, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1200, this.floorY - 54, 'iron_shield'));
            this.skeletons.push(new SkeletonMinion(1900, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1000, 100 - 54, 'knight_full')); // Patrullando puente
            this.skeletons.push(new SkeletonMinion(2300, 100 - 54, 'knight_light')); // Patrullando puente 2

            this.archers.push(new SkeletonArcher(780, 100 - 54));
            this.archers.push(new SkeletonArcher(1220, 100 - 54, 'helmetless'));
            this.archers.push(new SkeletonArcher(2180, 100 - 54, 'full'));
            this.archers.push(new SkeletonArcher(2600, 100 - 54));

            this.bats.push(new BatEnemy(900, 50));
            this.bats.push(new BatEnemy(1500, 150));
            this.bats.push(new BatEnemy(2100, 50));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 4-1", "#9ee8ff", 14, true);
        } else if (levelNum === 20) {
            // Nivel 4-2 (Torres del Viento)
            this.levelWidth = 3200;
            this.levelHeight = 1650;
            this.bonfire = {
                x: 360,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 20 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 3000, y: -150 - 60, width: 40, height: 60 };

            // Escalinatas góticas en zigzag
            this.platforms.push(new Platform(300, 315, 140, 20));
            this.platforms.push(new Platform(500, 220, 140, 20));
            this.platforms.push(new Platform(700, 120, 140, 20));
            this.platforms.push(new Platform(900, 20, 140, 20));
            this.platforms.push(new Platform(1100, -80, 140, 20));

            // Pasarela aérea gigante de magma
            this.platforms.push(new Platform(1300, -180, 600, 20));

            // Descenso y ascenso final hacia la torre de salida
            this.platforms.push(new Platform(2000, -80, 150, 20));
            this.platforms.push(new Platform(2200, 20, 150, 20));
            this.platforms.push(new Platform(2400, 120, 150, 20));
            this.platforms.push(new Platform(2600, 0, 150, 20));
            this.platforms.push(new Platform(2800, -100, 150, 20));
            this.platforms.push(new Platform(2950, -150, 150, 20));

            // Ráfagas verticales de viento
            this.windCurrents.push(new WindCurrent(800, -300, 120, this.floorY + 300, -1.2));
            this.windCurrents.push(new WindCurrent(2100, -300, 120, this.floorY + 300, -1.18));
            this.platforms.push(new CrumblingPlatform(1870, -80, 120, 20));
            this.platforms.push(new Platform(2535, -545, 150, 20));
            this.platforms.push(new Platform(2790, -745, 155, 20));
            this.windCrystals.push(new WindCrystal(2460, this.floorY - 32, 'w4-2-cache', {
                x: 2418,
                y: -980,
                width: 120,
                height: this.floorY + 980,
                strength: -1.55,
                duration: 780
            }));
            this.lightningTraps.push(new LightningTrap(2075, -250, 300));
            this.lightningTraps.push(new LightningTrap(2715, -745, 260));
            this.treasureDoors.push(new TreasureDoor(2835, -805, 'w4-2-cache', 'great_potion'));
            this.windSentinels.push(new WindSentinel(1180, -170));
            this.loreTablets.push(new LoreTablet(430, this.floorY - 52, "Las torres cantan|cuando el viento tiene hambre."));

            // Trampas en el suelo
            this.spikes.push(new Spikes(800, this.floorY - 20, 3));
            this.spikes.push(new Spikes(1600, this.floorY - 20, 4));
            this.blades.push(new CeilingBlade(1550, -420, 230));
            this.blades.push(new CeilingBlade(2500, -210, 210));
            this.chests.push(new TreasureChest(1120, -80 - 30, 'coins'));
            this.chests.push(new TreasureChest(2240, 20 - 30, 'coins'));

            // Enemigos
            this.skeletons.push(new SkeletonMinion(500, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1500, this.floorY - 54, 'iron_shield'));
            this.skeletons.push(new SkeletonMinion(2500, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1600, -180 - 54, 'knight_full')); // En el puente aéreo

            this.archers.push(new SkeletonArcher(720, 120 - 54));
            this.archers.push(new SkeletonArcher(1400, -180 - 54, 'helmetless'));
            this.archers.push(new SkeletonArcher(1800, -180 - 54, 'full'));
            this.archers.push(new SkeletonArcher(2750, 0 - 54));

            this.bats.push(new BatEnemy(600, -50));
            this.bats.push(new BatEnemy(1200, -150));
            this.bats.push(new BatEnemy(1800, -250));
            this.bats.push(new BatEnemy(2400, -50));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 4-2", "#9ee8ff", 14, true);
        } else if (levelNum === 21) {
            // Nivel 4-3 (Salón de Cristales Suspendidos)
            this.levelWidth = 3300;
            this.levelHeight = 1450;
            this.bonfire = null;
            this.exitDoor = { x: 3120, y: -260 - 60, width: 40, height: 60 };

            // Doble cubierta de plataformas y puentes cruzados
            this.platforms.push(new Platform(350, 300, 150, 20));
            this.platforms.push(new Platform(550, 200, 150, 20));
            this.platforms.push(new Platform(750, 100, 150, 20));

            // Puente de Doble Cubierta
            this.platforms.push(new Platform(950, 0, 800, 20)); // Cubierta inferior
            this.platforms.push(new Platform(1100, -150, 500, 20)); // Cubierta superior

            // Conexiones de salida en zigzag
            this.platforms.push(new Platform(1850, -50, 150, 20));
            this.platforms.push(new Platform(2050, 50, 150, 20));
            this.platforms.push(new Platform(2250, -50, 150, 20));
            this.platforms.push(new Platform(2450, -150, 150, 20));
            this.platforms.push(new Platform(2650, -250, 150, 20));
            this.platforms.push(new Platform(2900, -260, 250, 20));

            // Ráfagas verticales
            this.windCurrents.push(new WindCurrent(650, -200, 120, this.floorY + 200, -1.18));
            this.windCurrents.push(new WindCurrent(2150, -350, 120, this.floorY + 350, -1.22));
            this.platforms.push(new CrumblingPlatform(1760, -50, 120, 20));
            this.windCrystals.push(new WindCrystal(980, -32));
            this.lightningTraps.push(new LightningTrap(2180, -260, 360));
            this.windSentinels.push(new WindSentinel(2760, -330));
            this.loreTablets.push(new LoreTablet(420, this.floorY - 52, "Los cristales no alumbran.|Vigilan lo que robamos del cielo."));

            this.crates.push(new Crate(1540, -150 - 38));
            this.spikes.push(new Spikes(1400, this.floorY - 20, 4));
            this.spikes.push(new Spikes(2320, this.floorY - 20, 3));
            this.blades.push(new CeilingBlade(1280, -360, 220));
            this.blades.push(new CeilingBlade(2380, -330, 190));
            this.chests.push(new TreasureChest(1180, -150 - 30, 'berry'));
            this.chests.push(new TreasureChest(2760, this.floorY - 30, 'coins'));

            // Enemigos
            this.skeletons.push(new SkeletonMinion(600, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1300, this.floorY - 54, 'iron_shield'));
            this.skeletons.push(new SkeletonMinion(2000, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1200, 0 - 54, 'knight_full'));
            this.skeletons.push(new SkeletonMinion(1500, -150 - 54, 'knight_light'));

            this.archers.push(new SkeletonArcher(1000, 0 - 54));
            this.archers.push(new SkeletonArcher(1350, -150 - 54, 'helmetless'));
            this.archers.push(new SkeletonArcher(1650, 0 - 54, 'full'));
            this.archers.push(new SkeletonArcher(2500, -150 - 54));

            this.bats.push(new BatEnemy(800, -100));
            this.bats.push(new BatEnemy(1400, -250));
            this.bats.push(new BatEnemy(2200, -100));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 4-3", "#9ee8ff", 14, true);
        } else if (levelNum === 22) {
            // Nivel 4-4 (Murallas Suspendidas + Mini Boss Secreto con Palanca y Puerta Rúnica)
            this.levelWidth = 5900;
            this.levelHeight = 2100;
            this.bonfire = {
                x: 170,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 22 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 3420, y: -80, width: 40, height: 60 };

            // Plataformas estándar del nivel
            this.platforms.push(new Platform(340, 300, 170, 25));
            this.platforms.push(new Platform(620, 200, 170, 25));
            this.platforms.push(new Platform(920, 95, 180, 25));
            this.platforms.push(new Platform(1230, -25, 170, 25));
            this.platforms.push(new Platform(1540, 95, 180, 25));
            this.platforms.push(new Platform(1880, -40, 180, 25));
            this.platforms.push(new Platform(2220, -170, 190, 25));
            this.platforms.push(new Platform(2580, -300, 190, 25));
            this.platforms.push(new Platform(3000, -170, 190, 25));
            this.platforms.push(new Platform(3380, -20, 170, 25));

            // Plataformas intermedias de escalada añadidas para el rediseño a gran escala
            this.platforms.push(new Platform(480, 250, 120, 20));
            this.platforms.push(new Platform(780, 150, 120, 20));
            this.platforms.push(new Platform(1080, 30, 120, 20));
            this.platforms.push(new Platform(1380, -90, 120, 20));
            this.platforms.push(new Platform(1720, -100, 120, 20));
            this.platforms.push(new Platform(2050, -220, 120, 20));

            // Plataforma del acceso secreto y pared que corta el mapa principal tras la salida
            this.platforms.push(new Platform(2760, -170, 120, 25));
            this.world4SecretGate = { x: 2820, y: -230, width: 46, height: 60, visible: false, opened: false };
            this.world4MainBoundaryWall = { x: 3630, y: -250, width: 46, height: 700 };

            // Ruta secreta: corriente vertical + parkour alto hasta la palanca
            this.windCurrents.push(new WindCurrent(2945, -1080, 115, this.floorY + 1080, -1.35));
            this.platforms.push(new Platform(3100, -850, 240, 25));
            this.platforms.push(new Platform(2860, -960, 130, 20));
            this.platforms.push(new Platform(2580, -1060, 120, 20));
            this.platforms.push(new Platform(2290, -945, 170, 25));
            this.world4Lever = { x: 2350, y: -945 - 32, width: 24, height: 32, activated: false };

            // Habitación secreta oscura: se entra por puerta, con parkour y mini boss al final
            this.world4SecretRoomBounds = { x: 4180, y: -1120, width: 1660, height: 640 };
            this.platforms.push(new Platform(4220, -500, 1560, 28));
            this.platforms.push(new Platform(4260, -620, 240, 24));
            this.platforms.push(new Platform(4580, -730, 150, 20));
            this.platforms.push(new Platform(4820, -845, 150, 20));
            this.platforms.push(new Platform(5080, -735, 150, 20));
            this.platforms.push(new Platform(5340, -620, 390, 24));
            if (this.world4MiniBossDefeated) {
                this.world4SecretReturnDoor = { x: 5685, y: -500 - 60, width: 46, height: 60, visible: true };
            }

            // Corrientes normales y enemigos normales (densidad de combate fuertemente incrementada)
            this.windCurrents.push(new WindCurrent(760, -160, 115, this.floorY + 160, -1.12));
            this.windCurrents.push(new WindCurrent(2410, -440, 125, this.floorY + 440, -1.15));
            this.platforms.push(new CrumblingPlatform(2400, -235, 120, 20));
            this.windCrystals.push(new WindCrystal(2605, -1092));
            this.lightningTraps.push(new LightningTrap(4700, -1010, 500));
            this.windSentinels.push(new WindSentinel(4940, -680));
            this.loreTablets.push(new LoreTablet(1940, -92, "Nadie encuentra al centinela.|El centinela encuentra al cobarde."));
            this.loreTablets.push(new LoreTablet(4320, -552, "Si la antorcha aun arde aqui,|algo mas antiguo respira cerca."));

            this.skeletons.push(new SkeletonMinion(900, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(500, this.floorY - 54, 'iron_shield'));
            this.skeletons.push(new SkeletonMinion(1400, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(2300, this.floorY - 54, 'knight_full'));
            this.skeletons.push(new SkeletonMinion(1540, 95 - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(2220, -170 - 54, 'iron_shield'));

            this.archers.push(new SkeletonArcher(1890, -40 - 54, 'helmetless'));
            this.archers.push(new SkeletonArcher(620, 200 - 54));
            this.archers.push(new SkeletonArcher(1230, -25 - 54, 'full'));
            this.archers.push(new SkeletonArcher(2580, -300 - 54));
            this.archers.push(new SkeletonArcher(3000, -170 - 54, 'full'));

            this.bats.push(new BatEnemy(2550, -360));
            this.bats.push(new BatEnemy(800, -200));
            this.bats.push(new BatEnemy(1600, -400));
            this.bats.push(new BatEnemy(2200, -300));
            this.bats.push(new BatEnemy(2800, -500));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 4-4", "#9ee8ff", 14, true);
        } else if (levelNum === 23) {
            // Nivel 4-5 (Biblioteca Invertida: rutas altas, cofres falsamente seguros y viento lateral)
            this.levelWidth = 3800;
            this.levelHeight = 1800;
            this.bonfire = null;
            this.exitDoor = { x: 3630, y: -360 - 60, width: 40, height: 60 };

            this.platforms.push(new Platform(260, 325, 170, 22));
            this.platforms.push(new Platform(520, 210, 170, 22));
            this.platforms.push(new Platform(820, 80, 190, 22));
            this.platforms.push(new Platform(1120, -60, 540, 22));
            this.platforms.push(new Platform(1780, -190, 180, 22));
            this.platforms.push(new Platform(2050, -60, 170, 22));
            this.platforms.push(new Platform(2330, -210, 190, 22));
            this.platforms.push(new Platform(2630, -340, 190, 22));
            this.platforms.push(new Platform(2920, -220, 190, 22));
            this.platforms.push(new Platform(3220, -360, 190, 22));
            this.platforms.push(new Platform(3560, -360, 230, 22));
            this.platforms.push(new Platform(1460, -520, 220, 22));
            this.platforms.push(new Platform(1740, -650, 220, 22));
            this.world4MoonRacePlatform = new Platform(3525, -685, 250, 22);
            this.world4MoonRacePlatform.hidden = !this.completedChallenges.has('w4-moon-race');
            this.world4MoonRacePlatform.requiresHookBonus = true;
            this.platforms.push(this.world4MoonRacePlatform);
            this.world4MoonRace = {
                id: 'w4-moon-race',
                x: 3405,
                y: -360 - 64,
                width: 48,
                height: 64,
                active: false,
                failed: false,
                completed: this.completedChallenges.has('w4-moon-race'),
                timer: 1080,
                startX: 120,
                startY: this.floorY - (this.player?.height || 58),
                finishButton: { x: 3638, y: -685 - 32, width: 24, height: 32, visible: this.completedChallenges.has('w4-moon-race') }
            };
            this.world4MoonRaceChest = new TreasureChest(3616, -685 - 30, 'moon_relic');
            this.world4MoonRaceChest.hidden = !this.completedChallenges.has('w4-moon-race') && !this.acquiredRelics.has('moon');
            this.chests.push(this.world4MoonRaceChest);
            if (this.acquiredRelics.has('moon')) {
                this.world4MoonRaceChest.opened = true;
                this.world4MoonRaceChest.hidden = false;
            }

            this.windCurrents.push(new WindCurrent(620, -120, 110, this.floorY + 120, -1.16));
            this.windCurrents.push(new WindCurrent(1680, -760, 120, this.floorY + 760, -1.28));
            this.windCurrents.push(new WindCurrent(2760, -520, 120, this.floorY + 520, -1.22));
            this.platforms.push(new CrumblingPlatform(2240, -130, 110, 20));
            this.windCrystals.push(new WindCrystal(1775, -682, 'w4-5-cache'));
            this.lightningTraps.push(new LightningTrap(3045, -520, 330));
            this.treasureDoors.push(new TreasureDoor(3320, -420, 'w4-5-cache', 'violet_berry'));
            this.windSentinels.push(new WindSentinel(1860, -520));
            this.loreTablets.push(new LoreTablet(600, this.floorY - 52, "Las paginas flotan porque|la gravedad tambien le teme a este lugar."));

            this.spikes.push(new Spikes(980, this.floorY - 20, 4));
            this.spikes.push(new Spikes(2100, this.floorY - 20, 5));
            this.blades.push(new CeilingBlade(1330, -300, 220));
            this.blades.push(new CeilingBlade(2470, -520, 210));
            this.crates.push(new Crate(1600, -60 - 38, 'ambush'));
            this.chests.push(new TreasureChest(1505, -520 - 30, 'coins'));
            this.chests.push(new TreasureChest(1810, -650 - 30, 'violet_berry'));
            this.chests.push(new TreasureChest(3335, -360 - 30, 'coins'));

            this.skeletons.push(new SkeletonMinion(640, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1320, -60 - 54, 'iron_shield'));
            this.skeletons.push(new SkeletonMinion(2400, -210 - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(2940, this.floorY - 54, 'knight_full'));
            this.archers.push(new SkeletonArcher(850, 80 - 54));
            this.archers.push(new SkeletonArcher(1500, -60 - 54, 'helmetless'));
            this.archers.push(new SkeletonArcher(2660, -340 - 54, 'full'));
            this.archers.push(new SkeletonArcher(3565, -360 - 54));
            this.bats.push(new BatEnemy(1200, -180));
            this.bats.push(new BatEnemy(1900, -420));
            this.bats.push(new BatEnemy(2850, -520));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 4-5", "#9ee8ff", 14, true);
        } else if (levelNum === 24) {
            // Nivel 4-6 (Última Hoguera: gauntlet de preparación antes del jefe final)
            this.levelWidth = 3900;
            this.levelHeight = 1850;
            this.bonfire = {
                x: 150,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 24 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 3710, y: -190 - 60, width: 40, height: 60 };

            this.platforms.push(new Platform(340, 300, 160, 22));
            this.platforms.push(new Platform(620, 170, 170, 22));
            this.platforms.push(new Platform(940, 35, 180, 22));
            this.platforms.push(new Platform(1260, -105, 190, 22));
            this.platforms.push(new Platform(1600, 35, 190, 22));
            this.platforms.push(new Platform(1940, -115, 190, 22));
            this.platforms.push(new Platform(2280, -265, 210, 22));
            this.platforms.push(new Platform(2650, -130, 190, 22));
            this.platforms.push(new Platform(3000, -300, 210, 22));
            this.platforms.push(new Platform(3360, -190, 190, 22));
            this.platforms.push(new Platform(3660, -190, 220, 22));
            this.platforms.push(new Platform(2420, -610, 260, 22));

            this.windCurrents.push(new WindCurrent(760, -230, 115, this.floorY + 230, -1.18));
            this.windCurrents.push(new WindCurrent(2110, -420, 120, this.floorY + 420, -1.22));
            this.windCurrents.push(new WindCurrent(2550, -760, 130, this.floorY + 760, -1.32));
            this.windCurrents.push(new WindCurrent(3180, -480, 120, this.floorY + 480, -1.18));
            this.platforms.push(new CrumblingPlatform(2800, -220, 120, 22));
            this.windCrystals.push(new WindCrystal(2470, -642));
            this.lightningTraps.push(new LightningTrap(3510, -480, 420));
            this.windSentinels.push(new WindSentinel(3180, -420));
            this.loreTablets.push(new LoreTablet(240, this.floorY - 52, "Ultima hoguera.|Despues de esto solo responde la tormenta."));

            this.spikes.push(new Spikes(1140, this.floorY - 20, 4));
            this.spikes.push(new Spikes(1780, this.floorY - 20, 4));
            this.spikes.push(new Spikes(2860, this.floorY - 20, 5));
            this.blades.push(new CeilingBlade(1320, -350, 230));
            this.blades.push(new CeilingBlade(2340, -590, 230));
            this.blades.push(new CeilingBlade(3120, -560, 210));
            this.crates.push(new Crate(2440, -610 - 38));
            this.chests.push(new TreasureChest(2540, -610 - 30, 'great_potion'));
            this.chests.push(new TreasureChest(2100, this.floorY - 30, 'coins'));

            this.skeletons.push(new SkeletonMinion(640, this.floorY - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(1320, this.floorY - 54, 'iron_shield'));
            this.skeletons.push(new SkeletonMinion(1980, -115 - 54, 'knight_light'));
            this.skeletons.push(new SkeletonMinion(3030, -300 - 54, 'knight_full'));
            this.archers.push(new SkeletonArcher(960, 35 - 54));
            this.archers.push(new SkeletonArcher(1620, 35 - 54, 'helmetless'));
            this.archers.push(new SkeletonArcher(2300, -265 - 54, 'full'));
            this.archers.push(new SkeletonArcher(3370, -190 - 54));
            this.bats.push(new BatEnemy(820, -140));
            this.bats.push(new BatEnemy(1880, -250));
            this.bats.push(new BatEnemy(2730, -470));
            this.bats.push(new BatEnemy(3320, -390));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 4-6", "#9ee8ff", 14, true);
        } else if (levelNum === 25) {
            // Nivel 4-7 (Trono de la Tormenta: jefe final del castillo flotante)
            this.levelWidth = 1800;
            this.levelHeight = 1050;
            this.bonfire = this.boss4Defeated ? {
                x: 220,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 25 && this.latestLitBonfire.lit,
                animTime: 0
            } : null;
            this.exitDoor = this.boss4Defeated ? { x: 1640, y: this.floorY - 60, width: 40, height: 60 } : null;

            this.platforms.push(new Platform(420, 260, 180, 22));
            this.platforms.push(new Platform(720, 165, 190, 22));
            this.platforms.push(new Platform(1040, 260, 180, 22));
            this.platforms.push(new Platform(760, -20, 260, 22));
            this.windCurrents.push(new WindCurrent(610, 40, 115, this.floorY - 40, -1.12));
            this.windCurrents.push(new WindCurrent(1120, 40, 115, this.floorY - 40, -1.12));
            this.loreTablets.push(new LoreTablet(320, this.floorY - 52, "El trono esta vacio.|La tormenta solo tomo prestada una corona."));

            if (!this.boss4Defeated) {
                this.boss = new FallenAngelBoss(1180, this.floorY - 138);
                this.domBossHud.classList.remove('hidden');
                this.updateBossHud();
            } else {
                this.domBossHud.classList.add('hidden');
            }

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 4-7 (JEFE)", "#9ee8ff", 14, true);
        } else if (levelNum === 26) {
            // Nivel 26: La Recámara del Ascensor (Mundo 4-Transition)
            this.levelWidth = 1200;
            this.levelHeight = 2200; // Pozo vertical masivo de descenso (1500px de caída de cámara)
            this.bonfire = null; // Sin hoguera aquí

            // Repisa de entrada superior
            this.platforms.push(new Platform(50, -1450, 320, 25));

            // Palanca interactuable del ascensor en la repisa superior
            this.world5TransitionLever = { x: 260, y: -1450 - 32, width: 24, height: 32, activated: false };

            // Plataforma móvil del Ascensor Gótico
            this.world5TransitionElevator = {
                x: 420,
                y: -1450,
                width: 200,
                height: 25,
                startY: -1450,
                targetY: 400,
                moving: false,
                reachedBottom: false
            };

            // Repisa inferior del pozo
            this.platforms.push(new Platform(700, 400, 450, 25));

            // ---- NUEVA ADICIÓN: PLATAFORMAS DE EXPLORACIÓN Y TRAMPAS ----
            // Trampa de picos en el fondo izquierdo del pozo (peligro al caer del ascensor)
            this.spikes.push(new Spikes(50, 400, 19));

            // Repisa izquierda intermedia (con cofre/caja de recompensa)
            this.platforms.push(new Platform(50, -850, 140, 22, 'stone'));
            this.crates.push(new Crate(90, -850 - 32));

            // Repisa derecha intermedia
            this.platforms.push(new Platform(1010, -320, 140, 22, 'stone'));
            this.crates.push(new Crate(1050, -320 - 32));

            // Repisa izquierda inferior
            this.platforms.push(new Platform(80, 100, 140, 22, 'stone'));
            this.crates.push(new Crate(120, 100 - 32));
            // -------------------------------------------------------------

            // La Gran Puerta Espectral / Vórtice Violeta
            this.exitDoor = {
                x: 950,
                y: 400 - 60,
                width: 60,
                height: 60
            };

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "EL DESCENSO", "#9ee8ff", 14, true);
        } else if (levelNum === 27) {
            // Nivel 27: Umbral del Vacío (Mundo 5-1)
            this.levelWidth = 2400;
            this.levelHeight = 750;
            this.bonfire = {
                x: 98,
                y: this.floorY - 80 - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 27 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 2240, y: this.floorY - 80 - 60, width: 40, height: 60 };

            // Inicializar listas espectrales
            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Plataformas normales de piedra del abismo
            this.platforms.push(new Platform(50, this.floorY - 80, 220, 22, 'stone'));
            this.platforms.push(new Platform(250, this.floorY - 80, 160, 22, 'stone'));
            this.platforms.push(new Platform(500, this.floorY - 160, 180, 22, 'stone'));
            this.platforms.push(new Platform(735, this.floorY - 56, 130, 22, 'stone'));

            // Portales enlazados
            this.spectralPortals.push(new SpectralPortal(780, this.floorY - 120, 1200, 180, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1200, 180, 780, this.floorY - 120, 'horizontal'));

            this.platforms.push(new Platform(1120, 244, 200, 22, 'stone'));
            this.platforms.push(new Platform(1450, 180, 160, 22, 'stone'));

            // Portales enlazados
            this.spectralPortals.push(new SpectralPortal(1500, 116, 1800, this.floorY - 140, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1800, this.floorY - 140, 1500, 116, 'horizontal'));

            this.platforms.push(new Platform(1750, this.floorY - 76, 160, 22, 'stone'));
            this.platforms.push(new Platform(1990, this.floorY - 125, 150, 22, 'stone'));
            this.platforms.push(new Platform(2180, this.floorY - 80, 190, 22, 'stone'));

            // Plataformas invisibles VoidPlatform que sirven para cruzar los picos intermedios
            this.platforms.push(new VoidPlatform(920, this.floorY - 100, 120));
            this.platforms.push(new VoidPlatform(1070, this.floorY - 160, 120));

            // Enemigos
            this.spectralWraiths.push(new SpectralWraith(550, this.floorY - 210, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(1480, 80, 'staff'));

            // Cajas y tesoros
            this.crates.push(new Crate(300, this.floorY - 80 - 32));
            this.crates.push(new Crate(332, this.floorY - 80 - 32));
            this.chests.push(new TreasureChest(560, this.floorY - 160 - 36, 'storm_potion'));

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-1: UMBRAL DEL VACÍO", "#b642f5", 14, true);
        } else if (levelNum === 28) {
            // Nivel 28: Catacumbas de Cristal (Mundo 5-2)
            this.levelWidth = 2200;
            this.levelHeight = 750;
            this.bonfire = null;
            this.exitDoor = { x: 2050, y: this.floorY - 90 - 60, width: 40, height: 60 };

            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Plataforma inicial
            this.platforms.push(new Platform(50, this.floorY - 80, 220, 22, 'stone'));

            // Plataformas invisibles que el Caballero debe revelar con el escudo
            this.platforms.push(new VoidPlatform(340, this.floorY - 130, 110));
            this.platforms.push(new VoidPlatform(520, this.floorY - 180, 110));
            this.platforms.push(new VoidPlatform(700, this.floorY - 220, 110));
            this.platforms.push(new VoidPlatform(880, this.floorY - 180, 110));
            this.platforms.push(new VoidPlatform(1060, this.floorY - 130, 110));
            this.voidCrystals.push(new VoidCrystal(1240, this.floorY - 125));

            // Repisa central firme
            this.platforms.push(new Platform(1250, this.floorY - 90, 250, 22, 'stone'));

            // Segundo tramo de plataformas invisibles
            this.platforms.push(new VoidPlatform(1560, this.floorY - 140, 120));
            this.platforms.push(new VoidPlatform(1740, this.floorY - 190, 120));
            this.platforms.push(new Platform(1980, this.floorY - 90, 180, 22, 'stone'));

            // Enemigos
            this.spectralWraiths.push(new SpectralWraith(520, this.floorY - 320, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(880, this.floorY - 320, 'staff'));
            this.spectralWraiths.push(new SpectralWraith(1320, this.floorY - 240, 'blade'));

            this.crates.push(new Crate(1280, this.floorY - 90 - 32));
            this.crates.push(new Crate(1312, this.floorY - 90 - 32));
            this.chests.push(new TreasureChest(1420, this.floorY - 90 - 36, 'berry_relic'));

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-2: CATACUMBAS DE CRISTAL", "#b642f5", 14, true);
        } else if (levelNum === 29) {
            // Nivel 29: El Abismo de los Espectros (Mundo 5-3)
            this.levelWidth = 2600;
            this.levelHeight = 750;
            this.bonfire = null;
            this.exitDoor = { x: 2450, y: this.floorY - 70 - 60, width: 40, height: 60 };

            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Plataformas fijas góticas muy separadas (requiere grappling hook / gancho)
            this.platforms.push(new Platform(50, this.floorY - 70, 160, 22, 'stone'));
            this.platforms.push(new Platform(380, this.floorY - 180, 140, 22, 'stone'));
            this.platforms.push(new Platform(750, this.floorY - 240, 140, 22, 'stone'));
            this.platforms.push(new Platform(1120, this.floorY - 180, 140, 22, 'stone'));
            this.platforms.push(new Platform(1480, this.floorY - 240, 140, 22, 'stone'));
            this.platforms.push(new Platform(1850, this.floorY - 180, 140, 22, 'stone'));

            // Repisa final
            this.platforms.push(new Platform(2220, this.floorY - 70, 320, 22, 'stone'));

            // Tres espectros SpectralWraith patrullando el abismo
            this.spectralWraiths.push(new SpectralWraith(500, this.floorY - 290, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(1200, this.floorY - 290, 'staff'));
            this.spectralWraiths.push(new SpectralWraith(1900, this.floorY - 290, 'blade'));

            this.crates.push(new Crate(2300, this.floorY - 70 - 32));
            this.chests.push(new TreasureChest(2240, this.floorY - 70 - 36, 'storm_potion'));

            this.loreTablets.push(new LoreTablet(100, this.floorY - 122, "Los espectros se alimentan de la luz.|Solo el acero sagrado puede disipar su esencia."));

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-3: EL ABISMO DE LOS ESPECTROS", "#b642f5", 14, true);
        } else if (levelNum === 30) {
            // Nivel 30: Torres Gemelas de Energía (Mundo 5-4)
            this.levelWidth = 2600;
            this.levelHeight = 2400; // Escalada vertical y laberinto de portales
            this.bonfire = {
                x: 120,
                y: this.floorY - 25 - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 30 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 1200, y: this.floorY - 25 - 60, width: 40, height: 60 };

            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Base
            this.platforms.push(new Platform(50, this.floorY - 25, 450, 25, 'stone'));
            this.platforms.push(new Platform(900, this.floorY - 25, 450, 25, 'stone'));

            // Torre Izquierda - repisas
            this.platforms.push(new Platform(150, this.floorY - 250, 160, 22, 'stone'));
            this.platforms.push(new Platform(80, this.floorY - 500, 160, 22, 'stone'));
            this.platforms.push(new Platform(150, this.floorY - 750, 160, 22, 'stone'));

            // Torre Derecha - repisas
            this.platforms.push(new Platform(1050, this.floorY - 250, 160, 22, 'stone'));
            this.platforms.push(new Platform(1120, this.floorY - 500, 160, 22, 'stone'));
            this.platforms.push(new Platform(1050, this.floorY - 750, 160, 22, 'stone'));
            this.platforms.push(new Platform(560, this.floorY - 980, 280, 22, 'stone'));

            // Cámaras pequeñas del laberinto espectral
            this.platforms.push(new Platform(1510, this.floorY - 660, 430, 22, 'stone'));
            this.platforms.push(new Platform(1540, this.floorY - 1060, 520, 22, 'stone'));
            this.platforms.push(new Platform(2160, this.floorY - 1290, 150, 22, 'stone'));
            this.platforms.push(new Platform(1580, this.floorY - 1880, 780, 24, 'stone'));

            // Portales de cruce vertical cruzados
            this.spectralPortals.push(new SpectralPortal(220, this.floorY - 90, 1100, this.floorY - 320, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1100, this.floorY - 320, 220, this.floorY - 90, 'horizontal'));

            this.spectralPortals.push(new SpectralPortal(1080, this.floorY - 570, 120, this.floorY - 820, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(120, this.floorY - 820, 1080, this.floorY - 570, 'horizontal'));

            // Laberinto superior: cada puerta exige elegir el siguiente cuarto correcto
            this.spectralPortals.push(new SpectralPortal(1158, this.floorY - 750 - 64, 1540, this.floorY - 660 - 64, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1540, this.floorY - 660 - 64, 1158, this.floorY - 750 - 64, 'horizontal'));

            this.spectralPortals.push(new SpectralPortal(1880, this.floorY - 660 - 64, 1580, this.floorY - 1060 - 64, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1580, this.floorY - 1060 - 64, 1880, this.floorY - 660 - 64, 'horizontal'));

            this.spectralPortals.push(new SpectralPortal(710, this.floorY - 980 - 64, 1760, this.floorY - 1060 - 64, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1760, this.floorY - 1060 - 64, 710, this.floorY - 980 - 64, 'horizontal'));

            // Portal secreto: está alto y requiere gancho desde la segunda cámara
            this.spectralPortals.push(new SpectralPortal(2210, this.floorY - 1290 - 64, 1660, this.floorY - 1880 - 64, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(2220, this.floorY - 1880 - 64, 1120, this.floorY - 750 - 64, 'horizontal'));

            // Enemigos
            this.spectralWraiths.push(new SpectralWraith(250, this.floorY - 450, 'staff'));
            this.spectralWraiths.push(new SpectralWraith(650, this.floorY - 520, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(1100, this.floorY - 650, 'staff'));
            this.spectralWraiths.push(new SpectralWraith(1600, this.floorY - 730, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(1840, this.floorY - 735, 'staff'));
            this.spectralWraiths.push(new SpectralWraith(1660, this.floorY - 1130, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(1950, this.floorY - 1140, 'staff'));

            if (!this.player?.hasVoidKey) {
                const voidWarden = new SpectralWraith(1940, this.floorY - 1880 - 70, 'staff');
                voidWarden.isMiniBoss = true;
                voidWarden.maxHp = 500;
                voidWarden.hp = 500;
                voidWarden.damage = 17;
                voidWarden.width = 56;
                voidWarden.height = 68;
                voidWarden.speed = 1.35;
                voidWarden.chaseRange = 820;
                voidWarden.attackCooldown = 105;
                voidWarden.customDrop = 'void_key';
                this.spectralWraiths.push(voidWarden);
            }

            this.crates.push(new Crate(950, this.floorY - 25 - 32));
            this.chests.push(new TreasureChest(980, this.floorY - 25 - 36, 'storm_potion'));
            this.chests.push(new TreasureChest(1710, this.floorY - 660 - 36, 'violet_berry'));
            this.crates.push(new Crate(1590, this.floorY - 1060 - 32));
            this.crates.push(new Crate(2020, this.floorY - 1060 - 32));
            this.loreTablets.push(new LoreTablet(590, this.floorY - 1014, "Las puertas del vacío no siempre avanzan.|La llave duerme donde el gancho alcanza la sombra."));

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-4: TORRES GEMELAS DE ENERGÍA", "#b642f5", 14, true);
        } else if (levelNum === 31) {
            // Nivel 31: El Laberinto de los 6 Portales (Mundo 5-5)
            this.levelWidth = 3800;
            this.levelHeight = 750;
            this.bonfire = null;
            this.exitDoor = { x: 2600, y: this.floorY - 80 - 60, width: 40, height: 60 };

            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Repisas fijas
            this.platforms.push(new Platform(50, this.floorY - 80, 200, 22, 'stone')); // Inicio
            this.platforms.push(new Platform(440, this.floorY - 120, 240, 22, 'stone')); // Sala A (extendida a la izquierda para alejar el cofre del portal)
            this.platforms.push(new Platform(1000, this.floorY - 200, 180, 22, 'stone')); // Sala B
            this.platforms.push(new Platform(1500, this.floorY - 120, 180, 22, 'stone')); // Sala C
            this.platforms.push(new Platform(2000, this.floorY - 200, 220, 22, 'stone')); // Sala Llave
            this.platforms.push(new Platform(2500, this.floorY - 80, 250, 22, 'stone')); // Salida

            // Red de portales laberíntica
            this.spectralPortals.push(new SpectralPortal(180, this.floorY - 144, 1020, this.floorY - 264, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1020, this.floorY - 264, 180, this.floorY - 144, 'horizontal'));

            this.spectralPortals.push(new SpectralPortal(600, this.floorY - 184, 1520, this.floorY - 184, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(1520, this.floorY - 184, 600, this.floorY - 184, 'horizontal'));

            this.spectralPortals.push(new SpectralPortal(1120, this.floorY - 264, 2050, this.floorY - 264, 'horizontal'));
            this.spectralPortals.push(new SpectralPortal(2050, this.floorY - 264, 1120, this.floorY - 264, 'horizontal'));

            // Enemigos
            this.spectralWraiths.push(new SpectralWraith(580, this.floorY - 250, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(1580, this.floorY - 250, 'staff'));
            this.spectralWraiths.push(new SpectralWraith(2100, this.floorY - 300, 'blade'));

            // Cámara del cofre falso: castigo corto con escudo como recompensa.
            this.platforms.push(new Platform(3180, this.floorY - 80, 520, 22, 'stone'));
            this.spectralPortals.push(new SpectralPortal(3600, this.floorY - 144, 2520, this.floorY - 144, 'horizontal'));
            this.spectralWraiths.push(new SpectralWraith(3280, this.floorY - 210, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(3500, this.floorY - 220, 'staff'));

            // Cofre de recompensa con poción sagrada en la sala del final
            this.chests.push(new TreasureChest(2180, this.floorY - 200 - 36, 'storm_potion'));
            this.chests.push(new TreasureChest(460, this.floorY - 120 - 36, 'false_shield'));
            this.chests.push(new TreasureChest(3300, this.floorY - 80 - 36, 'shield'));
            this.crates.push(new Crate(2550, this.floorY - 80 - 32));

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-5: EL LABERINTO DE LOS PORTALES", "#b642f5", 14, true);
        } else if (levelNum === 32) {
            // Nivel 32: Puente de la Tormenta Espectral (Mundo 5-6)
            this.levelWidth = 3200;
            this.levelHeight = 750;
            this.bonfire = null;
            this.exitDoor = { x: 3000, y: this.floorY - 80 - 60, width: 40, height: 60 };

            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Inicio y fin fijos
            this.platforms.push(new Platform(50, this.floorY - 80, 220, 22, 'stone'));
            this.platforms.push(new Platform(2920, this.floorY - 80, 240, 22, 'stone'));

            // Puente largo de VoidPlatforms y CrumblingPlatforms
            this.platforms.push(new VoidPlatform(300, this.floorY - 130, 140));
            this.platforms.push(new CrumblingPlatform(480, this.floorY - 130, 120));
            this.platforms.push(new VoidPlatform(640, this.floorY - 130, 140));
            this.platforms.push(new CrumblingPlatform(820, this.floorY - 130, 120));
            this.platforms.push(new VoidPlatform(980, this.floorY - 130, 140));
            this.voidCrystals.push(new VoidCrystal(1185, this.floorY - 124, 520));

            // Plataforma intermedia firme
            this.platforms.push(new Platform(1160, this.floorY - 90, 250, 22, 'stone'));

            this.platforms.push(new VoidPlatform(1450, this.floorY - 130, 140));
            this.platforms.push(new CrumblingPlatform(1630, this.floorY - 130, 120));
            this.platforms.push(new VoidPlatform(1790, this.floorY - 130, 140));
            this.platforms.push(new CrumblingPlatform(1970, this.floorY - 130, 120));
            this.platforms.push(new VoidPlatform(2130, this.floorY - 130, 140));
            this.voidCrystals.push(new VoidCrystal(2335, this.floorY - 124, 520));

            // Segunda plataforma firme
            this.platforms.push(new Platform(2310, this.floorY - 90, 250, 22, 'stone'));

            this.platforms.push(new VoidPlatform(2600, this.floorY - 140, 140));
            this.platforms.push(new CrumblingPlatform(2780, this.floorY - 140, 120));

            // Enemigos
            this.spectralWraiths.push(new SpectralWraith(800, this.floorY - 260, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(1250, this.floorY - 300, 'staff'));
            this.spectralWraiths.push(new SpectralWraith(1800, this.floorY - 260, 'blade'));
            this.spectralWraiths.push(new SpectralWraith(2350, this.floorY - 300, 'staff'));

            this.crates.push(new Crate(1200, this.floorY - 90 - 32));
            this.chests.push(new TreasureChest(2350, this.floorY - 90 - 36, 'storm_potion'));

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-6: PUENTE DE LA TORMENTA ESPECTRAL", "#b642f5", 14, true);
        } else if (levelNum === 33) {
            // Nivel 33: Antesala del Reflejo (Mundo 5-7)
            this.levelWidth = 1400;
            this.levelHeight = 750;

            // Hoguera de descanso gótica final antes del jefe
            this.bonfire = {
                x: 680,
                y: this.floorY - 25 - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 33 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 1200, y: this.floorY - 25 - 60, width: 40, height: 60 };

            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Plataformas fijas de piedra
            this.platforms.push(new Platform(50, this.floorY - 25, 1300, 25, 'stone'));

            this.crates.push(new Crate(350, this.floorY - 25 - 32));
            this.crates.push(new Crate(382, this.floorY - 25 - 32));

            // La gran tablilla del lore del Doppelgänger
            this.loreTablets.push(new LoreTablet(500, this.floorY - 52, "Mira profundamente al cristal.|En el abismo mas profundo, tu mayor enemigo eres tu mismo.|Tu reflejo imitara tus virtudes y tus pecados."));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-7: ANTESALA DEL REFLEJO", "#b642f5", 14, true);
        } else if (levelNum === 34) {
            // Nivel 34: El Espejo del Alma (Mundo 5-8: JEFE FINAL)
            this.levelWidth = 1400;
            this.levelHeight = 750;
            this.bonfire = {
                x: 150,
                y: this.floorY - 65,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 34 && this.litBonfires.includes(34),
                animTime: 0
            };
            this.exitDoor = null; // Se abre la victoria al vencerlo!

            this.spectralPortals = [];
            this.spectralWraiths = [];

            // Plataformas de energía espectral en la arena
            this.platforms.push(new Platform(380, this.floorY - 160, 220, 22, 'stone'));
            this.platforms.push(new Platform(800, this.floorY - 160, 220, 22, 'stone'));
            this.platforms.push(new Platform(590, this.floorY - 300, 220, 22, 'stone'));

            // Spawnea el Doppelgänger
            this.boss = new DoppelgangerBoss(1000, this.floorY - 58);
            this.domBossHud.classList.remove('hidden');

            // Cambiar título del HUD del jefe
            const nameLabel = document.getElementById('boss-name-label');
            if (nameLabel) nameLabel.innerText = "TU PROPIO REFLEJO (DOPPELGÄNGER)";

            particles.addFloatingText(80, this.floorY - 120, "MUNDO 5-8: EL ESPEJO DEL ALMA", "#b642f5", 14, true);
        } else if (levelNum === 35) {
            // Nivel 35: Nubes del Alba Negra (Mundo 6-1)
            this.levelWidth = 2400;
            this.levelHeight = 850;
            this.bonfire = {
                x: 120,
                y: this.floorY - 95,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 35 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = { x: 2165, y: this.floorY - 160 - 60, width: 40, height: 60 };

            this.platforms.push(new Platform(40, this.floorY - 30, 360, 24, 'stone'));
            this.platforms.push(new Platform(520, this.floorY - 120, 220, 22, 'stone'));
            this.platforms.push(new Platform(880, this.floorY - 210, 230, 22, 'stone'));
            this.platforms.push(new Platform(1240, this.floorY - 130, 260, 22, 'stone'));
            this.platforms.push(new Platform(1700, this.floorY - 250, 260, 22, 'stone'));
            this.platforms.push(new Platform(2100, this.floorY - 160, 220, 22, 'stone'));

            this.loreTablets.push(new LoreTablet(225, this.floorY - 82, "Los cuatro lideres juraron proteger este mundo.|Cada uno guardaba una corona, una tierra y un destino.|Pero desde las profundidades desperto una voluntad oscura.|Los vencio uno por uno, no para destruirlos,|sino para usar sus almas como cadenas.|Ya has liberado al primer lider.|Aun quedan tres tronos bajo el dominio de esa sombra.|Y cuando caiga el ultimo...|se abrira el camino hacia quien los controla."));
            this.chests.push(new TreasureChest(920, this.floorY - 210 - 36, 'storm_potion'));
            this.windCurrents.push(new WindCurrent(760, this.floorY - 300, 58, 230, -1.02));
            this.lightningTraps.push(new LightningTrap(1130, this.floorY - 270, 230));
            this.skeletons.push(new WhiteKnight(600, this.floorY - 120 - 58, 'blade'));
            this.skeletons.push(new WhiteKnight(1320, this.floorY - 130 - 58, 'blade'));
            this.windSentinels.push(new WingedWhiteKnight(1780, this.floorY - 410, 'blade'));

            this.domBossHud.classList.add('hidden');
            particles.addFloatingText(80, this.floorY - 140, "MUNDO 6-1: NUBES DEL ALBA NEGRA", "#ffffff", 14, true);
        } else if (levelNum >= 36 && levelNum <= 43) {
            this.setupWorld6SkyLevel(levelNum);
        } else if (levelNum === 44) {
            // Nivel 44: Arconte del Alba Negra (Mundo 6-10)
            this.levelWidth = 1800;
            this.levelHeight = 850;
            this.bonfire = {
                x: 150,
                y: this.floorY - 95,
                width: 48,
                height: 65,
                lit: this.latestLitBonfire.level === 44 && this.latestLitBonfire.lit,
                animTime: 0
            };
            this.exitDoor = null;

            this.platforms.push(new Platform(40, this.floorY - 30, 410, 24, 'stone'));
            this.platforms.push(new Platform(600, this.floorY - 170, 250, 22, 'stone'));
            this.platforms.push(new Platform(1030, this.floorY - 250, 250, 22, 'stone'));
            this.platforms.push(new Platform(1350, this.floorY - 110, 260, 22, 'stone'));

            if (this.boss6Defeated) {
                particles.addFloatingText(80, this.floorY - 140, "MUNDO 6-10: ARCONTE PURIFICADO", "#ffffff", 14, true);
                this.domBossHud.classList.add('hidden');
            } else {
                this.boss = new WhiteArchonBoss(1120, this.floorY - 250 - 92);
                this.domBossHud.classList.remove('hidden');
                const nameLabel = document.getElementById('boss-name-label');
                if (nameLabel) nameLabel.innerText = "ARCONTE DEL ALBA NEGRA";
                particles.addFloatingText(80, this.floorY - 140, "MUNDO 6-10: ARCONTE DEL ALBA NEGRA", "#ffffff", 14, true);
            }
        }

        // Generar antorchas dinámicamente basadas en el ancho del nivel
        this.torches = [];
        const torchInterval = 380;
        const totalTorches = Math.ceil(this.levelWidth / torchInterval);
        for (let i = 0; i < totalTorches; i++) {
            this.torches.push({ x: 150 + i * torchInterval, y: 220 });
        }

        this.applyPersistentTreasureState();

        // Failsafe: Asegurar que el estado encendido de la hoguera es persistente
        if (this.bonfire) {
            this.bonfire.lit = this.litBonfires.includes(levelNum);
        }
    }

    respawnPlayer() {
        this.state = 'playing';
        this.gameOverTriggered = false;
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
            this.resetTransientStateForLevelStart();
            this.player.x = this.latestLitBonfire.x - 30;
            this.player.y = this.latestLitBonfire.y ?? (this.floorY - this.player.height);
            if (this.isAbyssLevel() && this.player.y + this.player.height >= this.floorY - 2) {
                const spawn = this.getSafeLevelStartPoint(this.latestLitBonfire.x || 80);
                this.player.x = spawn.x;
                this.player.y = spawn.y;
            }
            this.resolvePlayerSpawnOverlap();
            this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 960 * 0.35));
            this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 540 * 0.42));
        } else {
            // Al inicio del juego
            this.enterLevelAtStart(1);
        }
    }

    restartGame() {
        this.domVictory.classList.add('hidden');
        this.clearSave();
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
        if (this.domWorldTransition) this.domWorldTransition.classList.add('hidden');
        this.domHud.classList.add('hidden');

        this.domStartMenu.classList.remove('hidden');
        this.refreshStartButton();
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
        if (this.level === 34) {
            this.world5BossDefeated = true;
            if (this.player) {
                this.player.maxPotions = this.getMaxMinorPotions();
                particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 42, "BOLSA DE POCIONES 5/5", "#00ff66", 11, true);
            }
            this.saveGame();
            this.startWorld6Cinematic();
            return;
        }

        this.state = 'victory';
        audio.stopMusic();
        audio.playWin();
        this.saveGame();

        // Personalizar título según el nivel superado
        const victorySubtitle = document.querySelector('#victory-screen h2');
        if (victorySubtitle) {
            victorySubtitle.innerText = this.level === 34
                ? '¡EL ESPEJO DEL ALMA SE HA ROTO! ¡EL VACÍO HA SIDO SUPERADO!'
                : '¡LA FORTALEZA CELESTIAL HA CAÍDO! ¡CAMPAÑA COMPLETADA!';
            victorySubtitle.style.fontSize = '8px';
        }

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

    startWorld6Cinematic() {
        this.state = 'world6_cinematic';
        this.world6Cinematic = { frame: 0, autoFinished: false };
        this.activeLoreNote = null;
        this.domHud.classList.add('hidden');
        if (this.domBossHud) this.domBossHud.classList.add('hidden');
        if (this.domVictory) this.domVictory.classList.add('hidden');
        audio.stopMusic();
        audio.playThunder();
    }

    finishWorld6Cinematic() {
        if (this.state !== 'world6_cinematic') return;
        if ((this.world6Cinematic?.frame || 0) < 540) return;

        this.world6Cinematic = null;
        this.state = 'playing';
        this.domHud.classList.remove('hidden');
        this.enterLevelAtStart(35, 120);
        if (!this.litBonfires.includes(35)) this.litBonfires.push(35);
        if (this.bonfire) {
            const spawn = this.getBonfireRespawnPoint(this.bonfire.x);
            this.latestLitBonfire = {
                level: 35,
                x: spawn.x,
                y: spawn.y,
                lit: true
            };
            this.bonfire.lit = true;
        }
        this.activeLoreNote = this.createWorld6LoreNote();
        this.saveGame();
        audio.startMusic();
    }

    createWorld6LoreNote() {
        return {
            title: 'CARTA ENTRE LAS NUBES',
            lines: [
                'Los cuatro lideres juraron proteger este mundo.',
                'Cada uno guardaba una corona, una tierra y un destino.',
                '',
                'Pero desde las profundidades desperto una voluntad oscura.',
                'Los vencio uno por uno, no para destruirlos,',
                'sino para usar sus almas como cadenas.',
                '',
                'Ya has liberado al primer lider.',
                'Aun quedan tres tronos bajo el dominio de esa sombra.',
                'Y cuando caiga el ultimo...',
                'se abrira el camino hacia quien los controla.'
            ]
        };
    }

    drawCinematicCharacter(ctx, x, y, options = {}) {
        const scale = options.scale ?? 1;
        const facing = options.facing ?? 1;
        const alpha = options.alpha ?? 1;
        const pose = options.pose || 'stand';
        const dark = options.variant === 'doppel';
        const jump = pose === 'jump';
        const kneel = pose === 'kneel';
        const fallen = pose === 'fallen';

        const armor = dark ? '#24102f' : '#cfd7e8';
        const armorLight = dark ? '#5d247a' : '#f4f7ff';
        const cloth = dark ? '#09040f' : '#26364f';
        const glow = dark ? '#ff00ff' : '#9ee8ff';
        const skin = dark ? '#e8d7ff' : '#f1d2aa';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.scale(facing * scale, scale);

        if (fallen) {
            ctx.rotate(Math.PI * 0.42);
            ctx.translate(6, 8);
        } else if (kneel) {
            ctx.rotate(Math.PI * 0.08);
            ctx.translate(0, 10);
        } else if (jump) {
            ctx.rotate(-Math.PI * 0.12);
        }

        ctx.shadowBlur = dark ? 22 : 12;
        ctx.shadowColor = glow;
        ctx.fillStyle = `rgba(${dark ? '255, 0, 255' : '158, 232, 255'}, ${dark ? 0.14 : 0.10})`;
        ctx.beginPath();
        ctx.ellipse(0, -32, 35, 56, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cape.
        ctx.fillStyle = cloth;
        ctx.beginPath();
        ctx.moveTo(-16, -50);
        ctx.quadraticCurveTo(-32, -20, -18, 26);
        ctx.lineTo(18, 26);
        ctx.quadraticCurveTo(30, -22, 14, -50);
        ctx.closePath();
        ctx.fill();

        // Legs.
        ctx.fillStyle = dark ? '#12061a' : '#1f2c44';
        if (kneel) {
            ctx.fillRect(-13, 6, 10, 28);
            ctx.fillRect(4, 18, 24, 9);
        } else if (jump) {
            ctx.fillRect(-13, 8, 9, 24);
            ctx.fillRect(5, 7, 9, 28);
        } else {
            ctx.fillRect(-13, 4, 10, 34);
            ctx.fillRect(5, 4, 10, 34);
        }

        // Armor torso.
        const chestGrad = ctx.createLinearGradient(0, -58, 0, 8);
        chestGrad.addColorStop(0, armorLight);
        chestGrad.addColorStop(0.55, armor);
        chestGrad.addColorStop(1, dark ? '#16091f' : '#7e8aa0');
        ctx.fillStyle = chestGrad;
        ctx.beginPath();
        ctx.moveTo(-18, -48);
        ctx.lineTo(18, -48);
        ctx.lineTo(14, 8);
        ctx.lineTo(-14, 8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = dark ? '#ff66ff' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.lineTo(0, 4);
        ctx.stroke();

        // Arms.
        ctx.strokeStyle = armorLight;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-16, -35);
        ctx.lineTo(kneel ? -30 : -27, kneel ? -5 : -18);
        ctx.moveTo(16, -35);
        ctx.lineTo(jump ? 34 : 28, jump ? -48 : -14);
        ctx.stroke();

        // Sword.
        ctx.strokeStyle = glow;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(jump ? 34 : 26, jump ? -48 : -16);
        ctx.lineTo(jump ? 64 : 50, jump ? -75 : -46);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(jump ? 60 : 47, jump ? -80 : -50, 8, 10);

        // Helmet/head.
        ctx.fillStyle = skin;
        ctx.fillRect(-11, -66, 22, 20);
        ctx.fillStyle = dark ? '#1a0828' : '#dce6ff';
        ctx.fillRect(-15, -73, 30, 18);
        ctx.fillStyle = glow;
        ctx.fillRect(-8, -63, 16, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -76, 4, 9);

        ctx.restore();
    }

    drawCinematicCastle(ctx, x, y, scale = 1, auraAlpha = 0.75) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.shadowBlur = 34;
        ctx.shadowColor = `rgba(8, 0, 15, ${auraAlpha})`;
        ctx.fillStyle = `rgba(0, 0, 0, ${auraAlpha})`;
        ctx.beginPath();
        ctx.ellipse(120, 72, 180, 155, 0, 0, Math.PI * 2);
        ctx.fill();

        const stoneGrad = ctx.createLinearGradient(0, -120, 0, 170);
        stoneGrad.addColorStop(0, '#ffffff');
        stoneGrad.addColorStop(0.5, '#dbe7f5');
        stoneGrad.addColorStop(1, '#91a7c7');
        ctx.fillStyle = stoneGrad;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#ffffff';

        const towers = [
            { x: 8, y: 10, w: 40, h: 128, spire: 48 },
            { x: 52, y: -42, w: 54, h: 180, spire: 70 },
            { x: 116, y: -88, w: 62, h: 226, spire: 90 },
            { x: 188, y: -20, w: 48, h: 158, spire: 58 }
        ];
        towers.forEach(tower => {
            ctx.fillRect(tower.x, tower.y, tower.w, tower.h);
            ctx.beginPath();
            ctx.moveTo(tower.x, tower.y);
            ctx.lineTo(tower.x + tower.w / 2, tower.y - tower.spire);
            ctx.lineTo(tower.x + tower.w, tower.y);
            ctx.closePath();
            ctx.fill();
        });

        ctx.fillRect(34, 46, 190, 92);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(8, 0, 15, 0.82)';
        ctx.lineWidth = 4;
        towers.forEach(tower => ctx.strokeRect(tower.x, tower.y, tower.w, tower.h));
        ctx.strokeRect(34, 46, 190, 92);

        ctx.fillStyle = '#090212';
        for (let i = 0; i < 7; i++) {
            const wx = 56 + i * 24;
            ctx.fillRect(wx, 70 + (i % 2) * 12, 8, 22);
        }
        ctx.beginPath();
        ctx.arc(128, 137, 24, Math.PI, 0);
        ctx.lineTo(152, 138);
        ctx.lineTo(104, 138);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawWorld6Cinematic() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const data = this.world6Cinematic || { frame: 0 };
        data.frame++;
        this.world6Cinematic = data;
        const t = data.frame;

        ctx.save();
        ctx.fillStyle = '#03020a';
        ctx.fillRect(0, 0, w, h);

        const chamberGrad = ctx.createLinearGradient(0, 0, 0, h);
        chamberGrad.addColorStop(0, '#08020f');
        chamberGrad.addColorStop(0.55, '#15051f');
        chamberGrad.addColorStop(1, '#050208');
        ctx.fillStyle = chamberGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#1a1022';
        ctx.fillRect(0, h - 92, w, 92);
        ctx.strokeStyle = '#5d2a7a';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, h - 92, w, 92);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        for (let i = 0; i < 6; i++) {
            const colX = 70 + i * 170;
            ctx.fillRect(colX, 66, 22, h - 158);
            ctx.fillRect(colX - 13, 66, 48, 12);
            ctx.fillRect(colX - 18, h - 105, 58, 13);
        }
        ctx.fillStyle = 'rgba(158, 232, 255, 0.08)';
        for (let i = 0; i < 5; i++) {
            const beamX = 120 + i * 165;
            ctx.beginPath();
            ctx.moveTo(beamX, 0);
            ctx.lineTo(beamX + 95, h - 92);
            ctx.lineTo(beamX + 35, h - 92);
            ctx.lineTo(beamX - 40, 0);
            ctx.closePath();
            ctx.fill();
        }

        if (t > 120) {
            const crack = Math.min(1, (t - 120) / 140);
            ctx.strokeStyle = `rgba(217, 246, 255, ${0.35 + crack * 0.45})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 10; i++) {
                const startX = 120 + i * 78;
                const length = 35 + crack * (70 + i * 6);
                ctx.beginPath();
                ctx.moveTo(startX, h - 88);
                ctx.lineTo(startX + Math.sin(i * 2.1) * 22, h - 88 - length * 0.35);
                ctx.lineTo(startX + Math.cos(i) * 42, h - 88 - length);
                ctx.stroke();
            }
        }

        const dgX = w / 2 - 120;
        const dgY = h - 128;
        const fall = Math.min(1, t / 140);
        ctx.save();
        ctx.globalAlpha = t > 210 ? Math.max(0.16, 1 - (t - 210) / 120) : 1;
        const doppelPose = t < 68 ? 'stand' : (t < 140 ? 'kneel' : 'fallen');
        this.drawCinematicCharacter(ctx, dgX, dgY + fall * 18, {
            scale: 1.05,
            facing: 1,
            variant: 'doppel',
            pose: doppelPose
        });
        ctx.restore();

        if (t < 360) {
            this.drawCinematicCharacter(ctx, w / 2 + 52, h - 124, {
                scale: 1,
                facing: 1,
                variant: 'hero',
                pose: t > 280 ? 'kneel' : 'stand',
                alpha: t > 330 ? Math.max(0, 1 - (t - 330) / 40) : 1
            });
        }

        if (t > 210) {
            const hole = Math.min(1, (t - 210) / 150);
            const cx = w / 2;
            const cy = h - 118;
            const radius = 20 + hole * 145;
            const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
            grad.addColorStop(0, '#000000');
            grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.98)');
            grad.addColorStop(0.72, 'rgba(92, 20, 130, 0.48)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 18; i++) {
                const a = i * Math.PI * 2 / 18 + t * 0.025;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * (radius + 20), cy + Math.sin(a) * (radius + 20));
                ctx.lineTo(cx + Math.cos(a + 0.18) * (radius * 0.45), cy + Math.sin(a + 0.18) * (radius * 0.45));
                ctx.stroke();
            }
        }

        if (t > 330) {
            const portal = Math.min(1, (t - 330) / 110);
            const cx = w / 2 + 190;
            const cy = h - 210;
            const glow = 38 + portal * 95;
            const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, glow);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.32, 'rgba(255, 255, 255, 0.92)');
            grad.addColorStop(0.74, 'rgba(158, 232, 255, 0.32)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, glow, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, 26 + portal * 18, 0, Math.PI * 2);
            ctx.stroke();

            const jump = Math.min(1, Math.max(0, (t - 360) / 120));
            const px = w / 2 - 36 + jump * 205;
            const py = h - 135 - Math.sin(jump * Math.PI) * 105 - jump * 54;
            this.drawCinematicCharacter(ctx, px, py, {
                scale: 0.92 + jump * 0.22,
                facing: 1,
                variant: 'hero',
                pose: 'jump',
                alpha: 1 - Math.max(0, (t - 455) / 70)
            });
        }

        if (t > 470) {
            const sky = Math.min(1, (t - 470) / 100);
            ctx.globalAlpha = sky;
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
            skyGrad.addColorStop(0, '#dff6ff');
            skyGrad.addColorStop(0.55, '#8ec7ff');
            skyGrad.addColorStop(1, '#ffffff');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            for (let i = 0; i < 9; i++) {
                const x = 50 + i * 118 + Math.sin(t * 0.01 + i) * 12;
                const y = 260 + Math.sin(i * 1.7) * 55;
                ctx.beginPath();
                ctx.ellipse(x, y, 70, 24, 0, 0, Math.PI * 2);
                ctx.ellipse(x + 42, y - 8, 52, 20, 0, 0, Math.PI * 2);
                ctx.ellipse(x - 44, y + 4, 44, 18, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            this.drawCinematicCastle(ctx, w - 300, 118, 0.92, 0.72);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.arc(w - 185, 190, 210, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        const caption = t < 170
            ? 'El reflejo cae... pero el mundo no respira en paz.'
            : (t < 330
                ? 'El salon se abre como una herida del vacio.'
                : (t < 510
                    ? 'Una luz responde desde algun lugar imposible.'
                    : 'MUNDO 6: LAS NUBES DEL ALBA NEGRA'));
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
        ctx.fillRect(70, h - 74, w - 140, 44);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(70, h - 74, w - 140, 44);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(caption, w / 2, h - 47);

        if (t >= 540) {
            ctx.fillStyle = Math.floor(t / 24) % 2 === 0 ? '#ffffff' : '#9ee8ff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillText("ENTRANDO AL MUNDO 6-1...", w / 2, h - 96);
            if (!data.autoFinished) {
                data.autoFinished = true;
                this.world6Cinematic = data;
                setTimeout(() => this.finishWorld6Cinematic(), 650);
            }
        }

        ctx.restore();
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
        this.platforms.forEach(plat => {
            if (typeof plat.update === 'function') plat.update(this.player);
        });
        this.voidCrystals.forEach(crystal => crystal.update(this));

        // Revelación de VoidPlatforms y Teletransporte de Portales Espectrales
        if (this.platforms.length > 0) {
            this.platforms.forEach(plat => {
                if (plat instanceof VoidPlatform) {
                    if (this.player.isBlocking) {
                        const dx = (this.player.x + this.player.width/2) - (plat.x + plat.width/2);
                        const dy = (this.player.y + this.player.height/2) - (plat.y + plat.height/2);
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 150) {
                            if (this.level === 28) {
                                this.platforms.forEach(other => {
                                    if (other instanceof VoidPlatform) other.reveal(540);
                                });
                            } else {
                                plat.reveal();
                            }
                        }
                    }
                    if (this.level === 31 && this.lightningFlashDuration > 0) {
                        plat.reveal();
                    }
                }
            });
        }

        if (this.arrows.length > 0) {
            this.arrows.forEach(arr => {
                this.platforms.forEach(plat => {
                    if (plat instanceof VoidPlatform) {
                        const overlaps = arr.x < plat.x + plat.width &&
                                         arr.x + arr.width > plat.x &&
                                         arr.y < plat.y + plat.height &&
                                         arr.y + arr.height > plat.y;
                        if (overlaps) {
                            plat.reveal();
                        }
                    }
                });
            });
        }
        this.syncWorldFiveTwoVoidPlatforms();

        if (this.spectralPortals && this.spectralPortals.length > 0) {
            this.spectralPortals.forEach(portal => {
                portal.update();
            });
        }

        // Pared invisible/visible que evita caminar al área técnica de la sala secreta desde el suelo.
        if (this.level === 22 && this.world4MainBoundaryWall) {
            const wall = this.world4MainBoundaryWall;
            if (this.checkAABBCollision(this.player, wall)) {
                if (this.player.x + this.player.width / 2 < wall.x + wall.width / 2) {
                    this.player.x = wall.x - this.player.width;
                } else {
                    this.player.x = wall.x + wall.width;
                }
                this.player.vx = 0;
            }
        }

        if (this.level === 22 && this.world4SecretRoomBounds) {
            const room = this.world4SecretRoomBounds;
            const inSecretRoomX = this.player.x + this.player.width > room.x && this.player.x < room.x + room.width;
            if (inSecretRoomX && this.player.y > -320) {
                this.player.x = 4310;
                this.player.y = -500 - this.player.height;
                this.player.vx = 0;
                this.player.vy = 0;
                particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 20, "REGRESO AL BORDE", "#9ee8ff", 9, false);
            }
        }

        // --- Actualizar Elevador del Descenso (Nivel 26) ---
        if (this.level === 26 && this.world5TransitionElevator) {
            const elevator = this.world5TransitionElevator;

            if (elevator.moving) {
                // Sonido rítmico de cadenas chirriantes
                if (Math.random() < 0.05) {
                    audio.playElevator();
                }

                // Desplazamiento del elevador hacia abajo
                elevator.y += 2.0;
            }

            // Plataforma sólida y arrastre del Caballero si está encima
            const playerBottom = this.player.y + this.player.height;
            const horizontalOverlap = this.player.x + this.player.width > elevator.x - 5 && this.player.x < elevator.x + elevator.width + 5;
            const standingOnElevator = horizontalOverlap &&
                playerBottom >= elevator.y - 12 &&
                playerBottom <= elevator.y + elevator.height + 20 &&
                this.player.vy >= 0;

            if (standingOnElevator) {
                this.player.y = elevator.y - this.player.height;
                this.player.vy = 0;
                this.player.isGrounded = true;
            }

            // Detener el elevador al llegar al final
            if (elevator.moving && elevator.y >= elevator.targetY) {
                elevator.y = elevator.targetY;
                elevator.reachedBottom = true;
                elevator.moving = false;
                audio.playCrateBreak(); // Clank metálico al encajar al fondo
                this.shakeTimer = 18;
                this.shakeIntensity = 2.5;
                particles.addFloatingText(elevator.x + elevator.width/2, elevator.y - 15, "¡DESCENSO COMPLETADO!", "#9ee8ff", 11, true);
            }
        }

        let inWindCurrent = false;
        for (let i = this.windCurrents.length - 1; i >= 0; i--) {
            const current = this.windCurrents[i];
            if (typeof current.update === 'function') current.update();
            if (current.active === false) {
                this.windCurrents.splice(i, 1);
                continue;
            }
            if (current.applyTo(this.player)) inWindCurrent = true;
        }
        if (inWindCurrent && this.gameTime % 8 === 0) {
            particles.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 1);
        }

        this.lightningTraps.forEach(trap => {
            trap.update();
            if (trap.isStriking() && this.player.hp > 0 && this.checkAABBCollision(this.player, trap)) {
                this.player.takeDamage(trap.damage, (this.player.x + this.player.width / 2 > trap.x + trap.width / 2 ? 4.0 : -4.0), trap.x + trap.width / 2);
            }
        });

        this.windSentinels.forEach(sentinel => {
            sentinel.update(this.player);
            if (sentinel.active && this.checkAABBCollision(this.player, sentinel)) {
                this.player.takeDamage(sentinel.damage, (this.player.x + this.player.width / 2 > sentinel.x + sentinel.width / 2 ? 3.5 : -3.5), sentinel.x + sentinel.width / 2);
            }
        });

        this.challengeDoors.forEach(door => door.update(this));
        this.updateWorld4MoonRace();

        // Sacudida de pantalla (Screen Shake) gatillada por jugador
        if (this.player.shouldTriggerShake) {
            this.shakeTimer = 18;
            this.shakeIntensity = 6;
            this.player.shouldTriggerShake = false;
        }

        // Límites de nivel para el jugador
        if (this.player.x < 0) this.player.x = 0;

        // Límites invisibles para la habitación secreta en el nivel 8 (2-3)
        if (this.level === 8) {
            // Zona principal: no pasar de x = 2560 si se está en la zona principal
            if (this.player.x > 2560 && this.player.x < 3500) {
                this.player.x = 2560;
            }
            // Habitación secreta: no salir a la izquierda de x = 4000 si se está en la recámara
            if (this.player.x < 4000 && this.player.x > 3500) {
                this.player.x = 4000;
            }
        }

        if (this.player.x + this.player.width > this.levelWidth) {
            if (this.level === 1) {
                // Ir al Nivel 1-2
                this.checkLevelMedals(this.level);
                this.enterLevelAtStart(2);
                this.saveGame();
            } else if (this.level === 2) {
                // Ir al Nivel 1-3
                this.checkLevelMedals(this.level);
                this.enterLevelAtStart(3);
                this.saveGame();
            } else if (this.level === 3) {
                // Ir al Nivel 1-4
                this.checkLevelMedals(this.level);
                this.enterLevelAtStart(4);
                this.saveGame();
            } else {
                this.player.x = this.levelWidth - this.player.width;
            }
        }

        // Colisión con suelo firme. En el Mundo 5 el suelo es abismo: solo salvan las plataformas.
        if (this.isAbyssLevel()) {
            if (this.player.y > this.floorY + 120 && this.player.hp > 0) {
                this.player.hp = 0;
                this.player.vx = 0;
                this.player.vy = 0;
                audio.playDeath();
                particles.addFloatingText(this.player.x + this.player.width / 2, this.floorY - 45, "ABISMO", "#b642f5", 13, true);
            }
        } else if (this.player.y + this.player.height >= this.floorY) {
            this.player.y = this.floorY - this.player.height;
            this.player.vy = 0;
            this.player.isGrounded = true;
        }

        // --- Colisiones con Plataformas Flotantes ---
        if (this.platforms.length > 0) {
            this.platforms.forEach(plat => {
                if (plat.hidden || plat.active === false || (plat.visibleTimer !== undefined && plat.visibleTimer === 0)) return;
                if (this.player.platformDropTimer > 0) return;

                const playerBottom = this.player.y + this.player.height;
                if (this.player.x + this.player.width > plat.x &&
                    this.player.x < plat.x + plat.width &&
                    playerBottom >= plat.y &&
                    playerBottom - this.player.vy <= plat.y + 20 &&
                    this.player.vy >= 0) {

                    if (this.input.down) {
                        this.player.platformDropTimer = 15;
                        this.player.y += 12;
                        this.player.isGrounded = false;
                        this.player.vy = 2.0;
                        return;
                    }

                    this.player.y = plat.y - this.player.height;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                    if (plat instanceof CrumblingPlatform) plat.stepOn();
                    if (plat instanceof StormElevatorPlatform) plat.startMoving();
                }
            });
        }

        // Colisiones de enemigos y arqueros con plataformas
        const checkEntityPlatformCollision = (entity) => {
            this.platforms.forEach(plat => {
                if (plat.hidden || plat.active === false || (plat.visibleTimer !== undefined && plat.visibleTimer === 0)) return;
                const bottom = entity.y + entity.height;
                if (entity.x + entity.width > plat.x &&
                    entity.x < plat.x + plat.width &&
                    bottom >= plat.y &&
                    bottom - entity.vy <= plat.y + 20 &&
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
            this.platforms.forEach(plat => {
                if (plat.hidden || plat.active === false || (plat.visibleTimer !== undefined && plat.visibleTimer === 0)) return;
                const bottom = c.y + c.height;
                if (c.x + c.width > plat.x && c.x < plat.x + plat.width && bottom >= plat.y && bottom <= plat.y + 10) {
                    c.y = plat.y - c.height;
                }
            });
        });
        // 3. Actualizar Enemigos y Obstáculos del Camino (Uncondicional)
        // Actualizar Cuchillas
        this.blades.forEach(b => {
            b.update();
            // Colisión letal
            if (b.checkCollision(this.player)) {
                this.player.takeDamage(b.damage, (this.player.x + this.player.width/2 > b.x + b.bladeRadius ? 4.5 : -4.5), b.x + b.bladeRadius);
            }
        });

        // Actualizar Murciélagos
        this.bats.forEach(bat => {
            bat.update(this.player, this.arrows);
            // Colisión cuerpo a cuerpo
            if (bat.active && this.checkAABBCollision(this.player, bat)) {
                this.player.takeDamage(bat.damage, (this.player.x + this.player.width/2 > bat.x + bat.width/2 ? 3.0 : -3.0), bat.x + bat.width/2);
            }
        });

        // Actualizar Espectros (SpectralWraith)
        if (this.spectralWraiths && this.spectralWraiths.length > 0) {
            this.spectralWraiths.forEach(w => {
                w.update(this.player, this);
                if (w.active && this.checkAABBCollision(this.player, w)) {
                    this.player.takeDamage(w.damage, (this.player.x + this.player.width/2 > w.x + w.width/2 ? 3.0 : -3.0), w.x + w.width/2);
                }
            });
        }

        // Actualizar Esqueletos pequeños y Goblins
        this.skeletons.forEach(s => {
            s.update(this.player);

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

            if (s.active && s.specialAttack === 'ash_greatsword') {
                s.specialTimer = (s.specialTimer ?? 120) - 1;
                const dx = (this.player.x + this.player.width / 2) - (s.x + s.width / 2);
                const dy = Math.abs((this.player.y + this.player.height / 2) - (s.y + s.height / 2));
                const dir = dx >= 0 ? 1 : -1;
                if (Math.abs(dx) < 330 && dy < 130 && s.specialTimer === 42) {
                    s.vx = dir * 3.2;
                    particles.spawnSparks(s.x + s.width / 2, s.y + 12, 10, 0);
                    particles.addFloatingText(s.x + s.width / 2, s.y - 30, 'ESPADÓN', '#ffcc66', 10, true);
                    audio.playSwordSwing();
                }
                if (Math.abs(dx) < 185 && dy < 105 && s.specialTimer === 18) {
                    audio.playCrateBreak();
                    this.shakeTimer = Math.max(this.shakeTimer, 14);
                    this.shakeIntensity = Math.max(this.shakeIntensity, 4);
                    for (let p = 0; p < 10; p++) {
                        particles.spawnFire(s.x + s.width / 2 + dir * (20 + p * 8), s.y + s.height - 8, 0.9);
                    }
                    this.player.takeDamage(12, dir * 5.0, s.x + s.width / 2);
                }
                if (s.specialTimer <= 0) {
                    s.specialTimer = 135;
                }
            }

            if (s.active && s.eliteType === 'storm' && this.gameTime % 120 === 0) {
                const dx = (this.player.x + this.player.width / 2) - (s.x + s.width / 2);
                const dy = (this.player.y + this.player.height / 2) - (s.y + s.height / 2);
                if (Math.sqrt(dx * dx + dy * dy) < 135) {
                    audio.playThunder();
                    particles.spawnSparks(s.x + s.width / 2, s.y + s.height / 2, 12, 0);
                    this.player.takeDamage(8, dx >= 0 ? 3.5 : -3.5, s.x + s.width / 2);
                }
            }
        });

        this.miniBosses.forEach(mb => {
            mb.update(this.player, this.floorY, this.arrows);

            this.platforms.forEach(plat => {
                if (plat.hidden || plat.active === false) return;
                const bottom = mb.y + mb.height;
                if (mb.x + mb.width > plat.x &&
                    mb.x < plat.x + plat.width &&
                    bottom >= plat.y &&
                    bottom - mb.vy <= plat.y + 20 &&
                    mb.vy >= 0) {
                    mb.y = plat.y - mb.height;
                    mb.vy = 0;
                    mb.isGrounded = true;
                }
            });

            if (mb.active && this.checkAABBCollision(this.player, mb)) {
                this.player.takeDamage(mb.damage, (this.player.x + this.player.width / 2 > mb.x + mb.width / 2 ? 4.5 : -4.5), mb.x + mb.width / 2);
            }

            const miniHit = mb.getAttackHitbox ? mb.getAttackHitbox() : null;
            if (miniHit && this.checkAABBCollision(this.player, miniHit)) {
                this.player.takeDamage(mb.damage + 4, mb.facing * 5.5, mb.x + mb.width / 2);
            }
        });

        // Actualizar Picos (Spikes)
        this.spikes.forEach(sp => {
            if (this.player.hp > 0 && this.checkAABBCollision(this.player, sp)) {
                // Si está rodando, es invulnerable a los picos
                if (this.player.isRolling) return;

                this.player.takeDamage(sp.damage, (this.player.x + this.player.width/2 > sp.x + sp.width/2 ? 4.0 : -4.0), sp.x + sp.width/2);
            }
        });

        // Generar la puerta de la habitación secreta en el Nivel 8 si se rompen las cajas triggers
        if (this.level === 8 && !this.shieldSecretDoor && this.shieldRoomTriggerCrates && this.shieldRoomTriggerCrates.every(c => !c.active)) {
            this.shieldSecretDoor = new SecretDoor(2238, -440 - 60);
            audio.playBonfire(); // Sonido mágico
            particles.addFloatingText(this.player.x, this.player.y - 40, "¡HABITACIÓN SECRETA REVELADA!", "#ffd700", 12, true);
        }

        // Proximidad interactiva general
        let nearInteractive = false;
        let interactiveText = "";
        let loreNearby = false;

        if (this.level === 22 && this.world4SecretGate?.visible) {
            const door = this.world4SecretGate;
            const distX = Math.abs((this.player.x + this.player.width/2) - (door.x + door.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (door.y + door.height/2));
            if (distX < 70 && distY < 90) {
                nearInteractive = true;
                interactiveText = "🚪 ENTRAR A LA CÁMARA SECRETA (PULSA 'E') 🚪";
            }
        }

        if (this.level === 22 && this.world4SecretReturnDoor?.visible) {
            const door = this.world4SecretReturnDoor;
            const distX = Math.abs((this.player.x + this.player.width/2) - (door.x + door.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (door.y + door.height/2));
            if (distX < 70 && distY < 90) {
                nearInteractive = true;
                interactiveText = "🚪 VOLVER AL MUNDO 4-4 (PULSA 'E') 🚪";
            }
        }

        for (const tablet of this.loreTablets) {
            const distX = Math.abs((this.player.x + this.player.width / 2) - (tablet.x + tablet.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (tablet.y + tablet.height / 2));
            if (distX < 70 && distY < 80) {
                nearInteractive = true;
                loreNearby = true;
                interactiveText = "📜 LEER INSCRIPCIÓN (PULSA 'E') 📜";
                break;
            }
        }

        for (const door of this.treasureDoors) {
            if (door.opened) continue;
            const distX = Math.abs((this.player.x + this.player.width / 2) - (door.x + door.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (door.y + door.height / 2));
            if (distX < 72 && distY < 88) {
                nearInteractive = true;
                interactiveText = door.unlocked ? "🚪 ABRIR CÁMARA DE TESORO (PULSA 'E') 🚪" : "🔒 PUERTA SELLADA POR CRISTAL 🔒";
                break;
            }
        }

        for (const relic of this.relicPedestals) {
            if (relic.collected) continue;
            const distX = Math.abs((this.player.x + this.player.width / 2) - (relic.x + relic.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (relic.y + relic.height / 2));
            if (distX < 70 && distY < 85) {
                nearInteractive = true;
                interactiveText = `✨ TOMAR ${relic.name.toUpperCase()} (PULSA 'E') ✨`;
                break;
            }
        }

        if (this.level === 23 && this.world4MoonRace) {
            const race = this.world4MoonRace;
            const playerCX = this.player.x + this.player.width / 2;
            const playerCY = this.player.y + this.player.height / 2;

            if (race.active && race.finishButton?.visible) {
                const button = race.finishButton;
                const distX = Math.abs(playerCX - (button.x + button.width / 2));
                const distY = Math.abs(playerCY - (button.y + button.height / 2));
                if (distX < 70 && distY < 85) {
                    nearInteractive = true;
                    interactiveText = "🌙 TERMINAR CARRERA LUNAR (PULSA 'E') 🌙";
                }
            }

            if (!race.completed && !race.active) {
                const distX = Math.abs(playerCX - (race.x + race.width / 2));
                const distY = Math.abs(playerCY - (race.y + race.height / 2));
                if (distX < 82 && distY < 100) {
                    nearInteractive = true;
                    interactiveText = race.failed ? "🌙 REINICIAR CARRERA LUNAR (PULSA 'E') 🌙" : "🌙 INICIAR CARRERA LUNAR (PULSA 'E') 🌙";
                }
            }
        }

        for (const door of this.challengeDoors) {
            if (door.opened) continue;
            const distX = Math.abs((this.player.x + this.player.width / 2) - (door.x + door.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (door.y + door.height / 2));
            if (distX < 82 && distY < 100) {
                nearInteractive = true;
                if (door.completed) {
                    interactiveText = "🏆 RECLAMAR PREMIO DEL DESAFÍO (PULSA 'E') 🏆";
                } else if (door.started) {
                    interactiveText = "⚔️ DESAFÍO EN CURSO ⚔️";
                } else {
                    interactiveText = "⚔️ INICIAR DESAFÍO (PULSA 'E') ⚔️";
                }
                break;
            }
        }

        // 1. Proximidad a los Cofres
        if (this.chests) {
            this.chests.forEach(chest => {
                if (!chest.hidden && !chest.opened) {
                    const distX = Math.abs((this.player.x + this.player.width/2) - (chest.x + chest.width/2));
                    const distY = Math.abs(this.player.y - chest.y);
                    if (distX < 75 && distY < 60) {
                        nearInteractive = true;
                        interactiveText = chest.requiresChallenge && !this.completedChallenges.has(chest.requiresChallenge)
                            ? "🔒 COFRE SELLADO POR EL RETO 🔒"
                            : "📦 ABRIR COFRE DE TESORO (PULSA 'E') 📦";
                    }
                }
            });
        }

        // 2. Proximidad al Portal/Puerta Secreta (Nivel 3)
        if (this.level === 3 && this.secretDoor) {
            const distX = Math.abs((this.player.x + this.player.width/2) - (this.secretDoor.x + this.secretDoor.width/2));
            if (distX < 75) {
                nearInteractive = true;
                interactiveText = "🚪 ENTRAR A LA CRIPTA SECRETA (PULSA 'E') 🚪";
            }
        }

        // 2b. Proximidad a puertas de la habitación secreta (Nivel 8)
        if (this.level === 8) {
            if (this.shieldSecretDoor) {
                const distX = Math.abs((this.player.x + this.player.width/2) - (this.shieldSecretDoor.x + this.shieldSecretDoor.width/2));
                const distY = Math.abs((this.player.y + this.player.height/2) - (this.shieldSecretDoor.y + this.shieldSecretDoor.height/2));
                if (distX < 60 && distY < 80) {
                    nearInteractive = true;
                    interactiveText = "🚪 ENTRAR A LA HABITACIÓN SECRETA (PULSA 'E') 🚪";
                }
            }
            if (this.shieldReturnDoor) {
                const distX = Math.abs((this.player.x + this.player.width/2) - (this.shieldReturnDoor.x + this.shieldReturnDoor.width/2));
                const distY = Math.abs((this.player.y + this.player.height/2) - (this.shieldReturnDoor.y + this.shieldReturnDoor.height/2));
                if (distX < 60 && distY < 80) {
                    nearInteractive = true;
                    interactiveText = "🚪 VOLVER AL MAPA (PULSA 'E') 🚪";
                }
            }
        }

        // 3. Proximidad a puertas de salida
        if (this.exitDoor && !loreNearby) {
            const distX = Math.abs((this.player.x + this.player.width/2) - (this.exitDoor.x + this.exitDoor.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (this.exitDoor.y + this.exitDoor.height/2));
            if (distX < 80 && distY < 95) {
                nearInteractive = true;
                if (this.level === 4) {
                    interactiveText = "🚪 ENTRAR A LA CÁMARA DEL JEFE (PULSA 'E') 🚪";
                } else if (this.level === 5) {
                    interactiveText = "🚪 VIAJAR AL MUNDO 2 (PULSA 'E') 🚪";
                } else if (this.level === 11) {
                    interactiveText = "🚪 VIAJAR AL MUNDO 3 (PULSA 'E') 🚪";
                } else if (this.level === 26) {
                    interactiveText = "🚪 ENTRAR AL MUNDO 5 (PULSA 'E') 🚪";
                } else if (this.level === 30 && !this.player.hasVoidKey) {
                    interactiveText = "🔒 SALIDA SELLADA: FALTA LA LLAVE DEL VACÍO 🔒";
                } else if (this.level >= 35 && this.level <= 43) {
                    interactiveText = `🚪 AVANZAR AL MUNDO 6-${this.level - 33} (PULSA 'E') 🚪`;
                } else if (this.level >= 27 && this.level <= 33) {
                    interactiveText = `🚪 AVANZAR AL MUNDO 5-${this.level - 25} (PULSA 'E') 🚪`;
                } else if (this.level >= 19 && this.level <= 25) {
                    interactiveText = `🚪 AVANZAR AL MUNDO 4-${this.level - 17} (PULSA 'E') 🚪`;
                } else if (this.level >= 12) {
                    interactiveText = `🚪 AVANZAR AL MUNDO 3-${this.level - 10} (PULSA 'E') 🚪`;
                } else {
                    interactiveText = `🚪 AVANZAR AL MUNDO 2-${this.level - 4} (PULSA 'E') 🚪`;
                }
            }
        }

        // 4. Proximidad a la Hoguera
        if (this.bonfire) {
            this.bonfire.animTime += 0.12;
            const playerCX = this.player.x + this.player.width / 2;
            const playerCY = this.player.y + this.player.height / 2;
            const bonfireCX = this.bonfire.x + this.bonfire.width / 2;
            const bonfireCY = this.bonfire.y + this.bonfire.height / 2;
            const distToHoguera = Math.sqrt(
                Math.pow(playerCX - bonfireCX, 2) +
                Math.pow(playerCY - bonfireCY, 2)
            );

            if (distToHoguera < 90) {
                nearInteractive = true;
                interactiveText = "🔥 ABRIR TIENDA / DESCANSAR (PULSA 'E') 🔥";

                // Si pasamos cerca y no está encendida, se enciende por primera vez
                if (!this.bonfire.lit) {
                    this.bonfire.lit = true;
                    const bonfireSpawn = this.getBonfireRespawnPoint(this.bonfire.x);
                    this.latestLitBonfire.level = this.level;
                    this.latestLitBonfire.x = bonfireSpawn.x;
                    this.latestLitBonfire.y = bonfireSpawn.y;
                    this.latestLitBonfire.lit = true;

                    if (!this.litBonfires.includes(this.level)) {
                        this.litBonfires.push(this.level);
                    }

                    this.saveGame();

                    audio.playBonfire();
                    this.shakeTimer = 15;
                    this.shakeIntensity = 2;
                    particles.spawnCollectGlow(this.bonfire.x + this.bonfire.width/2, this.bonfire.y + 40, '#ff6600', 25);
                }
            } else {
                if (this.isShopOpen) {
                    this.closeBonfireShop();
                }
            }

            if (this.bonfire.lit) {
                // Emitir partículas de fuego
                particles.spawnFire(this.bonfire.x + this.bonfire.width/2, this.bonfire.y + 42, 1.2, true);
            }
        }

        // 5. Proximidad a Pociones o Bayas en el suelo (para recolección manual)
        if (!nearInteractive) {
            for (let i = 0; i < this.lootItems.length; i++) {
                const item = this.normalizeHealthLoot(this.lootItems[i]);
                if (item.type === 'heart' || item.type === 'great_heart' || item.type === 'berry' || item.type === 'violet_berry') {
                    const distX = Math.abs((this.player.x + this.player.width/2) - (item.x + item.width/2));
                    const distY = Math.abs((this.player.y + this.player.height/2) - (item.y + item.height/2));
                    if (distX < 55 && distY < 55) {
                        nearInteractive = true;
                        if (item.type === 'heart') {
                            interactiveText = "🍎 GUARDAR POCIÓN EN BOLSA (PULSA 'E') 🍎";
                        } else if (item.type === 'great_heart') {
                            interactiveText = "🧪 GUARDAR POCIÓN MAYOR (PULSA 'E') 🧪";
                        } else if (item.type === 'violet_berry') {
                            interactiveText = "🫐 GUARDAR BAYA VIOLETA (PULSA 'E') 🫐";
                        } else {
                            interactiveText = "🍓 GUARDAR BAYA ROJA (PULSA 'E') 🍓";
                        }
                        break;
                    }
                }
            }
        }

        // Actualizar la visibilidad y texto del prompt interactivo
        if (nearInteractive) {
            this.domBonfirePrompt.classList.remove('hidden');
            this.btnInteractBonfire.innerHTML = interactiveText;
        } else {
            this.domBonfirePrompt.classList.add('hidden');
        }

        // --- Actualizar Trampas, Arqueros y Flechas ---
        if (this.fireTraps.length > 0 || this.archers.length > 0 || this.arrows.length > 0 || this.lavaStalactites.length > 0) {
            // Trampas de Fuego
            this.fireTraps.forEach(ft => ft.update(this.player));

            // Estalactitas de Lava
            this.lavaStalactites.forEach(ls => {
                ls.update(this.platforms, this.floorY);
                if (this.player.hp > 0) {
                    ls.checkCollision(this.player);
                }
            });

            // Esqueletos Arqueros
            const archerViewport = {
                x: this.cameraX,
                y: this.cameraY,
                width: this.canvas.width,
                height: this.canvas.height
            };
            this.archers.forEach(a => {
                a.update(this.player, this.arrows, archerViewport);

                // Colisión cuerpo a cuerpo con el jugador
                if (a.active && this.checkAABBCollision(this.player, a)) {
                    this.player.takeDamage(a.damage, (this.player.x + this.player.width/2 > a.x + a.width/2 ? 3.0 : -3.0), a.x + a.width/2);
                }

                if (a.active && a.eliteType === 'storm' && this.gameTime % 150 === 0) {
                    particles.spawnSparks(a.x + a.width / 2, a.y + a.height / 2, 8, 0);
                    a.damage = Math.max(a.damage, 14);
                }

                // Colisión con plataformas o suelo
                let onPlatform = false;
                for (let plat of this.platforms) {
                    if (plat.hidden || plat.active === false) continue;
                    if (a.vy >= 0 &&
                        a.x + a.width > plat.x &&
                        a.x < plat.x + plat.width &&
                        a.y + a.height >= plat.y &&
                        a.y + a.height - a.vy <= plat.y + 20) {
                        a.y = plat.y - a.height;
                        a.vy = 0;
                        onPlatform = true;
                        break;
                    }
                }
                if (!onPlatform && a.y + a.height >= this.floorY) {
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
                    // Defensa activa con Escudo (Dirección de mira correcta)
                    const isFacingArrow = (arrow.vx > 0 && this.player.facing === -1) || (arrow.vx < 0 && this.player.facing === 1);

                    if (this.player.isBlocking && isFacingArrow) {
                        this.player.takeDamage(arrow.damage, 0, arrow.x);
                        arrow.active = false;
                    } else {
                        const knockDir = arrow.vx > 0 ? 4.0 : -4.0;
                        this.player.takeDamage(arrow.damage, knockDir, arrow.x);
                        arrow.active = false;
                    }
                }

                // Destruir al chocar con plataformas sólidas
                for (let plat of this.platforms) {
                    if (plat.hidden || plat.active === false) continue;
                    if (arrow.active &&
                        arrow.x > plat.x &&
                        arrow.x < plat.x + plat.width &&
                        arrow.y > plat.y &&
                        arrow.y < plat.y + 15) {
                        arrow.active = false;
                        particles.spawnSparks(arrow.x, arrow.y, 4, 0);
                    }
                }

                // Destruir al chocar con el suelo principal
                if (arrow.active && arrow.y >= this.floorY) {
                    arrow.active = false;
                    // Spawnea una ráfaga de chispas de fuego al chocar con el suelo
                    for (let p = 0; p < 8; p++) {
                        particles.spawnFire(arrow.x + arrow.width / 2, this.floorY, 1.2, true);
                    }
                }

                // Descartar si sale de pantalla o inactiva
                if (arrow.x < 0 || arrow.x > this.levelWidth || !arrow.active) {
                    this.arrows.splice(i, 1);
                }
            }
        }

        // 4.1 Actualizar DoppelgangerBoss (Nivel 34: Final de Mundo 5)
        if (this.level === 34 && this.boss) {
            this.boss.update(this.player, 0, this.levelWidth, this.floorY, this);

            if (this.boss.shouldTriggerShake) {
                this.shakeTimer = 22;
                this.shakeIntensity = 8;
                this.boss.shouldTriggerShake = false;
                this.freezeTimer = 3;
            }

            // Daño de cuerpo a cuerpo solo cuando NO está atacando (el slash aplica el daño propio)
            if (this.boss.hp > 0 && this.boss.state !== 'dead' && this.boss.state !== 'slash' &&
                this.player.invincibleTimer <= 0 && this.checkAABBCollision(this.player, this.boss)) {
                this.player.takeDamage(8, (this.player.x + this.player.width/2 > this.boss.x + this.boss.width/2 ? 3.5 : -3.5), this.boss.x + this.boss.width/2);
            }
            const phaseTwin = this.boss.phaseTwin;
            if (phaseTwin && phaseTwin.hp > 0 && phaseTwin.state !== 'dead' && phaseTwin.state !== 'slash' &&
                this.player.invincibleTimer <= 0 && this.checkAABBCollision(this.player, phaseTwin)) {
                this.player.takeDamage(6, (this.player.x + this.player.width/2 > phaseTwin.x + phaseTwin.width/2 ? 3.0 : -3.0), phaseTwin.x + phaseTwin.width/2);
            }

            if (this.boss.voidRocks) {
                this.boss.voidRocks.forEach(rock => {
                    if (rock.active && this.checkAABBCollision(this.player, rock)) {
                        this.player.takeDamage(rock.damage, (this.player.x + this.player.width / 2 > rock.x + rock.width / 2 ? 3.5 : -3.5), rock.x + rock.width / 2);
                        rock.active = false;
                        particles.spawnSparks(rock.x + rock.width / 2, rock.y + rock.height / 2, 10, 0);
                    }
                });
            }

            const twinDefeated = !this.boss.phaseTwin || this.boss.phaseTwin.state === 'dead';
            if (this.boss.hp <= 0 && this.boss.state === 'dead' && this.boss.vy === 0 && twinDefeated) {
                this.triggerVictory();
            }

            // Actualizar HUD del jefe
            this.updateBossHud();
        }

        // 4.2 Actualizar Arconte del Alba Negra (Nivel 44: Final de Mundo 6)
        if (this.level === 44 && this.boss) {
            this.boss.update(this.player, 0, this.levelWidth, this.floorY, this);

            if (this.boss.shouldTriggerShake) {
                this.shakeTimer = 24;
                this.shakeIntensity = 8;
                this.boss.shouldTriggerShake = false;
                this.freezeTimer = 4;
            }

            if (this.boss.hp > 0 && this.boss.state !== 'dead' &&
                this.player.invincibleTimer <= 0 && this.checkAABBCollision(this.player, this.boss)) {
                const contactDamage = this.boss.phase === 2 ? 18 : 15;
                this.player.takeDamage(contactDamage, (this.player.x + this.player.width / 2 > this.boss.x + this.boss.width / 2 ? 4.5 : -4.5), this.boss.x + this.boss.width / 2);
            }

            for (let i = this.boss.spawnedProjectiles.length - 1; i >= 0; i--) {
                const proj = this.boss.spawnedProjectiles[i];
                proj.update();
                if (proj.active && this.checkAABBCollision(this.player, proj)) {
                    this.player.takeDamage(proj.damage, (this.player.x + this.player.width / 2 > proj.x + proj.width / 2 ? 3.5 : -3.5), proj.x + proj.width / 2);
                    proj.active = false;
                }
                if (!proj.active) this.boss.spawnedProjectiles.splice(i, 1);
            }

            if (this.boss.hp <= 0 && this.boss.state === 'dead' && this.boss.vy === 0 && !this.boss6Defeated) {
                this.boss6Defeated = true;
                this.lootItems.push(new LootItem(this.boss.x + this.boss.width / 2 - 8, this.floorY - 52, 'grey_coin'));
                this.spawnBossCoins(20, this.boss.x + this.boss.width / 2, this.floorY - 45);
                particles.spawnCollectGlow(this.boss.x + this.boss.width / 2, this.floorY - 45, '#ffffff', 32);
                particles.addFloatingText(this.boss.x + this.boss.width / 2, this.floorY - 95, "SEGUNDO ESPIRITU MALIGNO PURIFICADO", "#ffffff", 12, true);
                audio.playWin();
                this.boss = null;
                this.domBossHud.classList.add('hidden');
                this.saveGame();
            }

            if (this.boss) {
                this.updateBossHud();
            }
        }

        // 4. Actualizar el Jefe Final (Niveles 5, 11, 18 y 25)
        if ((this.level === 5 || this.level === 11 || this.level === 18 || this.level === 25) && this.boss) {
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
                const contactDamage = this.level === 25 ? (this.boss.phase === 2 ? 18 : 15) : 12;
                this.player.takeDamage(contactDamage, (this.player.x + this.player.width/2 > this.boss.x + this.boss.width/2 ? 5.0 : -5.0), this.boss.x + this.boss.width/2);
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
                audio.playWin(); // Sonido de victoria retro

                if (this.level === 5) {
                    this.bossDefeated = true; // Marcar jefe 1 como derrotado

                    // Spawnear la hoguera y el portal hacia el Mundo 2!
                    this.bonfire = {
                        x: 480,
                        y: 380,
                        width: 48,
                        height: 65,
                        lit: false,
                        animTime: 0
                    };
                    this.exitDoor = {
                        x: 820,
                        y: this.floorY - 60,
                        width: 40,
                        height: 60
                    };

                    // Spawnear cofre con la espada de fuego en la arena
                    this.chests.push(new TreasureChest(340, this.floorY - 30, 'legendary_sword'));

                    // Spawnear la moneda gris de daño (moneda especial)
                    this.lootItems.push(new LootItem(480 + 24, this.floorY - 50, 'grey_coin'));
                    this.spawnBossCoins(10, 480 + 24, this.floorY - 45);

                    particles.spawnCollectGlow(480 + 24, 380 + 40, '#ffd700', 30);
                    particles.spawnCollectGlow(820 + 20, this.floorY - 30, '#ffd700', 30);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡REY ESQUELETO DESTRUIDO!", "#ffd700", 13, true);
                } else if (this.level === 11) {
                    this.boss2Defeated = true; // Marcar jefe 2 como derrotado

                    // Spawnear la hoguera y el portal hacia el Mundo 3!
                    this.bonfire = {
                        x: 480,
                        y: 380,
                        width: 48,
                        height: 65,
                        lit: false, // Apagada al principio, el jugador la puede encender
                        animTime: 0
                    };
                    this.exitDoor = {
                        x: 820,
                        y: this.floorY - 60,
                        width: 40,
                        height: 60
                    };

                    // Spawnear el frasco alquímico de mejora de poción (en lugar del alma gris)
                    this.lootItems.push(new LootItem(480 + 24, this.floorY - 50, 'flask'));
                    this.spawnBossCoins(15, 480 + 24, this.floorY - 45);

                    particles.spawnCollectGlow(480 + 24, 380 + 40, '#00ffff', 30);
                    particles.spawnCollectGlow(820 + 20, this.floorY - 30, '#00ff66', 30);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡DEMONIO ÍGNEO DESTRUIDO!", "#ff2200", 13, true);
                } else if (this.level === 18) {
                    this.boss3Defeated = true; // Marcar jefe 3 como derrotado

                    // Spawnear la hoguera y portal hacia el Mundo 4
                    this.bonfire = {
                        x: 480,
                        y: 380,
                        width: 48,
                        height: 65,
                        lit: false, // Apagada al principio
                        animTime: 0
                    };
                    this.exitDoor = {
                        x: 820,
                        y: this.floorY - 60,
                        width: 40,
                        height: 60
                    };

                    // Spawnear la moneda gris de daño final (Alma Gris)
                    this.lootItems.push(new LootItem(480 + 24, this.floorY - 50, 'grey_coin'));
                    this.spawnBossCoins(20, 480 + 24, this.floorY - 45);

                    particles.spawnCollectGlow(480 + 24, 380 + 40, '#b0b0b0', 30);
                    particles.spawnCollectGlow(820 + 20, this.floorY - 30, '#9ee8ff', 30);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡DUENDE GIGANTE DESTRUIDO!", "#00ff66", 13, true);
                } else if (this.level === 25) {
                    this.boss4Defeated = true; // Marcar jefe 4 como derrotado

                    this.bonfire = {
                        x: 220,
                        y: this.floorY - 65,
                        width: 48,
                        height: 65,
                        lit: false,
                        animTime: 0
                    };
                    this.exitDoor = {
                        x: 1640,
                        y: this.floorY - 60,
                        width: 40,
                        height: 60
                    };

                    this.lootItems.push(new LootItem(500, this.floorY - 50, 'storm_sword'));
                    this.spawnBossCoins(20, 500, this.floorY - 45);

                    particles.spawnCollectGlow(220 + 24, this.floorY - 25, '#9ee8ff', 30);
                    particles.spawnCollectGlow(1640 + 20, this.floorY - 30, '#ffffff', 34);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡TRONO DE LA TORMENTA PURIFICADO!", "#9ee8ff", 12, true);
                }

                this.boss = null; // Detener bucle de boss
                this.domBossHud.classList.add('hidden'); // Ocultar HUD del jefe
                this.saveGame();
            }

            if (this.boss) {
                this.updateBossHud();
            }
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
                    if (loot) {
                        if (loot.type === 'ambush') {
                            // Emboscada Goblínica Sorpresa
                            particles.addFloatingText(c.x + c.width/2, c.y - 20, "⚠️ ¡EMBOSCADA! ⚠️", "#ff2200", 12, true);
                            audio.playDeath();

                            // Spawnear un Goblin Swordsman en la posición de la caja
                            this.skeletons.push(new GoblinSwordsman(c.x, c.y - 30));
                            particles.spawnDust(c.x + c.width/2, c.y + c.height/2, 12);
                        } else {
                            this.lootItems.push(this.stabilizeKeyLoot(this.normalizeHealthLoot(loot), c));
                        }
                    }
                }
            });

            // Romper cristales de viento: activan corrientes temporales o tesoros sellados
            this.windCrystals.forEach(c => {
                if (c.active && !this.player.hitTargets.includes(c) && this.checkAABBCollision(attackBox, c)) {
                    this.player.hitTargets.push(c);
                    c.takeDamage(this);
                    this.freezeTimer = 5;
                }
            });

            // Atacar Murciélagos
            this.bats.forEach(b => {
                if (b.active && !this.player.hitTargets.includes(b) && this.checkAABBCollision(attackBox, b)) {
                    this.player.hitTargets.push(b);
                    let damage = this.player.isChargedStriking ? 35 : 24;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 48 : 34;
                        if (this.player.isChargedStriking) {
                            this.applyFireDot(b);
                        }
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 60 : 42;
                        if (this.player.isChargedStriking) {
                            this.applyElectricDot(b);
                        }
                    }
                    damage += (this.player.damageLevel - 1) * 4;
                    damage = this.applyThunderRelicBonus(damage, b);
                    damage = this.applyStormRelicSwordBonus(damage);
                    const loot = b.takeDamage(damage);
                    if (!b.active) this.player.statsEnemiesKilled++;
                    this.freezeTimer = 4;
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar centinelas de viento flotantes
            this.windSentinels.forEach(sentinel => {
                if (sentinel.active && !this.player.hitTargets.includes(sentinel) && this.checkAABBCollision(attackBox, sentinel)) {
                    this.player.hitTargets.push(sentinel);
                    let damage = this.player.isChargedStriking ? 50 : 30;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 45 : 45;
                        if (this.player.isChargedStriking) {
                            this.applyFireDot(sentinel);
                        }
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 82 : 58;
                        if (this.player.isChargedStriking) {
                            this.applyElectricDot(sentinel);
                        }
                    }
                    damage += (this.player.damageLevel - 1) * 8;
                    damage = this.applyThunderRelicBonus(damage, sentinel);
                    damage = this.applyStormRelicSwordBonus(damage);
                    const loot = sentinel.takeDamage(damage);
                    if (!sentinel.active) this.player.statsEnemiesKilled++;
                    this.freezeTimer = this.player.isChargedStriking ? 10 : 6;
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar Espectros (SpectralWraith)
            if (this.spectralWraiths && this.spectralWraiths.length > 0) {
                this.spectralWraiths.forEach(w => {
                    if (w.active && !this.player.hitTargets.includes(w) && this.checkAABBCollision(attackBox, w)) {
                        this.player.hitTargets.push(w);
                        let damage = this.player.isChargedStriking ? 50 : 30;
                        if (this.player.weapon === 'legendary') {
                            damage = this.player.isChargedStriking ? 45 : 45;
                            if (this.player.isChargedStriking) this.applyFireDot(w);
                        } else if (this.player.weapon === 'storm') {
                            damage = this.player.isChargedStriking ? 82 : 58;
                            if (this.player.isChargedStriking) this.applyElectricDot(w);
                        }
                        damage += (this.player.damageLevel - 1) * 8;
                        damage = this.applyThunderRelicBonus(damage, w);
                        damage = this.applyStormRelicSwordBonus(damage);

                        const loot = w.takeDamage(damage);
                        if (!w.active) {
                            this.player.statsEnemiesKilled++;
                            // Revelar VoidPlatforms cercanas al morir el wraith
                            this.platforms.forEach(plat => {
                                if (plat instanceof VoidPlatform) {
                                    const dx = w.x - plat.x;
                                    const dy = w.y - plat.y;
                                    if (Math.sqrt(dx*dx + dy*dy) < 250) plat.reveal();
                                }
                            });
                            this.syncWorldFiveTwoVoidPlatforms();
                        }
                        this.freezeTimer = this.player.isChargedStriking ? 10 : 6;
                        if (loot) this.lootItems.push(loot);
                    }
                });
            }

            // Atacar Esqueletos Pequeños
            this.skeletons.forEach(s => {
                if (s.active && !this.player.hitTargets.includes(s) && this.checkAABBCollision(attackBox, s)) {
                    this.player.hitTargets.push(s);
                    let damage = this.player.isChargedStriking ? 50 : 30;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 45 : 45; // No extra direct damage on charged strike, it is applied as DoT!
                        if (this.player.isChargedStriking) {
                            this.applyFireDot(s);
                        }
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 82 : 58;
                        if (this.player.isChargedStriking) {
                            this.applyElectricDot(s);
                        }
                    }
                    damage += (this.player.damageLevel - 1) * 8;
                    damage = this.applyThunderRelicBonus(damage, s);
                    damage = this.applyStormRelicSwordBonus(damage);
                    if (this.level >= 19 && this.level <= 24 && this.player.isChargedStriking) {
                        damage = Math.max(damage, (s.hp || 0) * 3);
                    }
                    const loot = s.takeDamage(damage); // Daño directo con espada
                    if (s.hp <= 0) this.player.statsEnemiesKilled++;
                    this.freezeTimer = this.player.isChargedStriking ? 10 : 6;
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar Esqueletos Arqueros (Nivel 2)
            this.archers.forEach(a => {
                if (a.active && !this.player.hitTargets.includes(a) && this.checkAABBCollision(attackBox, a)) {
                    this.player.hitTargets.push(a);
                    let damage = this.player.isChargedStriking ? 50 : 30;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 45 : 45;
                        if (this.player.isChargedStriking) {
                            this.applyFireDot(a);
                        }
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 82 : 58;
                        if (this.player.isChargedStriking) {
                            this.applyElectricDot(a);
                        }
                    }
                    damage += (this.player.damageLevel - 1) * 8;
                    damage = this.applyThunderRelicBonus(damage, a);
                    damage = this.applyStormRelicSwordBonus(damage);
                    if (this.level >= 19 && this.level <= 24 && this.player.isChargedStriking) {
                        damage = Math.max(damage, (a.hp || 0) * 3);
                    }
                    const loot = a.takeDamage(damage);
                    if (a.hp <= 0) this.player.statsEnemiesKilled++;
                    this.freezeTimer = this.player.isChargedStriking ? 10 : 6;
                    if (loot) this.lootItems.push(loot);
                }
            });

            // Atacar al Jefe Gigante
            if ((this.level === 5 || this.level === 11 || this.level === 18 || this.level === 25) && this.boss && this.boss.hp > 0 && !this.player.hitTargets.includes(this.boss)) {
                if (this.checkAABBCollision(attackBox, this.boss)) {
                    this.player.hitTargets.push(this.boss);
                    let damage = this.player.isChargedStriking ? 25 : 15;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 35 : 25; // 35 de daño directo cargado
                        if (this.player.isChargedStriking) {
                            this.applyFireDot(this.boss);
                        }
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 55 : 35;
                        if (this.player.isChargedStriking) {
                            this.applyElectricDot(this.boss);
                        }
                    }
                    damage += (this.player.damageLevel - 1) * 4;
                    damage = this.applyThunderRelicBonus(damage, this.boss);
                    damage = this.applyStormRelicSwordBonus(damage);

                    // Pasar la dirección de empuje y la posición central del jugador para bloquear con escudo
                    this.boss.takeDamage(damage, (this.player.x + this.player.width/2 > this.boss.x + this.boss.width/2 ? 1 : -1), this.player.x + this.player.width/2);
                    this.freezeTimer = this.player.isChargedStriking ? 12 : 7;
                }
            }

            // Atacar al Doppelgänger (Nivel 34)
            if (this.level === 34 && this.boss && this.boss.hp > 0 && this.boss.state !== 'dead' && !this.player.hitTargets.includes(this.boss)) {
                if (this.checkAABBCollision(attackBox, this.boss)) {
                    this.player.hitTargets.push(this.boss);
                    let damage = this.player.isChargedStriking ? 25 : 15;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 35 : 25;
                        if (this.player.isChargedStriking) this.applyFireDot(this.boss);
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 55 : 35;
                        if (this.player.isChargedStriking) this.applyElectricDot(this.boss);
                    }
                    damage += (this.player.damageLevel - 1) * 4;
                    damage = this.applyThunderRelicBonus(damage, this.boss);
                    damage = this.applyStormRelicSwordBonus(damage);
                    this.boss.takeDamage(damage, (this.player.x + this.player.width/2 > this.boss.x + this.boss.width/2 ? 1 : -1), this.player);
                    this.freezeTimer = this.player.isChargedStriking ? 12 : 7;
                }
            }
            const doppelTwin = this.level === 34 && this.boss ? this.boss.phaseTwin : null;
            if (doppelTwin && doppelTwin.hp > 0 && doppelTwin.state !== 'dead' && !this.player.hitTargets.includes(doppelTwin)) {
                if (this.checkAABBCollision(attackBox, doppelTwin)) {
                    this.player.hitTargets.push(doppelTwin);
                    let damage = this.player.isChargedStriking ? 25 : 15;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 35 : 25;
                        if (this.player.isChargedStriking) this.applyFireDot(doppelTwin);
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 55 : 35;
                        if (this.player.isChargedStriking) this.applyElectricDot(doppelTwin);
                    }
                    damage += (this.player.damageLevel - 1) * 4;
                    damage = this.applyThunderRelicBonus(damage, doppelTwin);
                    damage = this.applyStormRelicSwordBonus(damage);
                    doppelTwin.takeDamage(damage, (this.player.x + this.player.width/2 > doppelTwin.x + doppelTwin.width/2 ? 1 : -1), this.player);
                    this.freezeTimer = this.player.isChargedStriking ? 12 : 7;
                }
            }

            // Atacar al Arconte del Alba Negra (Nivel 44)
            if (this.level === 44 && this.boss && this.boss.hp > 0 && this.boss.state !== 'dead' && !this.player.hitTargets.includes(this.boss)) {
                if (this.checkAABBCollision(attackBox, this.boss)) {
                    this.player.hitTargets.push(this.boss);
                    let damage = this.player.isChargedStriking ? 25 : 15;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 35 : 25;
                        if (this.player.isChargedStriking) this.applyFireDot(this.boss);
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 55 : 35;
                        if (this.player.isChargedStriking) this.applyElectricDot(this.boss);
                    }
                    damage += (this.player.damageLevel - 1) * 4;
                    damage = this.applyThunderRelicBonus(damage, this.boss);
                    damage = this.applyStormRelicSwordBonus(damage);
                    this.boss.takeDamage(damage, (this.player.x + this.player.width / 2 > this.boss.x + this.boss.width / 2 ? 1 : -1), this.player);
                    this.freezeTimer = this.player.isChargedStriking ? 12 : 7;
                }
            }

            this.miniBosses.forEach(mb => {
                if (mb.active && !this.player.hitTargets.includes(mb) && this.checkAABBCollision(attackBox, mb)) {
                    this.player.hitTargets.push(mb);
                    let damage = this.player.isChargedStriking ? 25 : 15;
                    if (this.player.weapon === 'legendary') {
                        damage = this.player.isChargedStriking ? 35 : 25; // 35 de daño directo cargado
                        if (this.player.isChargedStriking) {
                            this.applyFireDot(mb);
                        }
                    } else if (this.player.weapon === 'storm') {
                        damage = this.player.isChargedStriking ? 55 : 35;
                        if (this.player.isChargedStriking) {
                            this.applyElectricDot(mb);
                        }
                    }
                    damage += (this.player.damageLevel - 1) * 4;
                    damage = this.applyThunderRelicBonus(damage, mb);
                    damage = this.applyStormRelicSwordBonus(damage);
                    const drop = mb.takeDamage(damage);
                    this.freezeTimer = this.player.isChargedStriking ? 12 : 7;
                    if (drop) {
                        this.world4MiniBossDefeated = true;
                        this.lootItems.push(new LootItem(drop.x, drop.y, drop.type));
                        if (this.level === 22) {
                            this.revealWorld4SecretReturnDoor();
                        }
                        this.saveGame();
                    }
                }
            });
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
                const item = this.normalizeHealthLoot(this.lootItems[i]);
            item.update(this.isAbyssLevel() ? Number.POSITIVE_INFINITY : this.floorY, this.platforms);

            if (this.checkAABBCollision(virtualPlayerBox, item)) {
                if (item.type === 'coin') {
                    this.player.addCoin();
                } else if (item.type === 'red_coin') {
                    this.player.redCoins++;
                    particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff3333', 10);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡ALMA ROJA DE VIDA!", "#ff3333", 11, true);
                    audio.playBonfire();
                } else if (item.type === 'green_coin') {
                    this.player.greenCoins++;
                    particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#00ff66', 10);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡ALMA VERDE DE ESTAMINA!", "#00ff66", 11, true);
                    audio.playBonfire();
                } else if (item.type === 'grey_coin') {
                    this.player.greyCoins++;
                    particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#b0b0b0', 10);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡ALMA GRIS DE DAÑO!", "#b0b0b0", 11, true);
                    audio.playBonfire();
                } else if (item.type === 'flask') {
                    this.player.flasks++;
                    particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#00ffff', 10);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡FRASCO ALQUÍMICO RECOGIDO!", "#00ffff", 11, true);
                    audio.playBonfire();
                } else if (item.type === 'heart') {
                    this.collectConsumableToInventory(item);
                } else if (item.type === 'great_heart') {
                    this.collectConsumableToInventory(item);
                } else if (item.type === 'berry') {
                    this.collectConsumableToInventory(item);
                } else if (item.type === 'violet_berry') {
                    this.collectConsumableToInventory(item);
                } else if (item.type === 'sword') {
                    this.player.hasLegendarySword = true;
                    // Se requiere equipar manualmente en el bulto/inventario (no se auto-equipa al recoger)
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡ESPADA DE FUEGO ENCONTRADA!", "#ff0033", 14, true);
                    audio.playBonfire(); // Sonido mágico celestial de logro
                    this.updateInventoryUI(); // Actualizar interfaz del inventario
                } else if (item.type === 'storm_sword') {
                    this.player.hasStormSword = true;
                    // Se requiere equipar manualmente en el bulto/inventario (no se auto-equipa al recoger)
                    particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#9ee8ff', 18);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡ESPADA DE LA TORMENTA ENCONTRADA!", "#9ee8ff", 14, true);
                    audio.playBonfire();
                    this.updateInventoryUI();
                    this.saveGame();
                } else if (item.type === 'shield') {
                    this.awardReinforcedShield(this.player.x + this.player.width/2, this.player.y - 30);
                } else if (item.type === 'forest_key') {
                    this.player.hasForestKey = true;
                    particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ffd700', 14);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡LLAVE DEL BOSQUE!", "#ffd700", 13, true);
                    audio.playBonfire();
                    this.updateInventoryUI(); // Mostrar la llave en el inventario/bulto
                    this.saveGame();
                } else if (item.type === 'void_key') {
                    this.player.hasVoidKey = true;
                    particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#b642f5', 18);
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡LLAVE DEL VACÍO!", "#b642f5", 13, true);
                    audio.playBonfire();
                    this.updateInventoryUI();
                    this.saveGame();
                }
                item.life = 0; // Marcar eliminado
            }

            if (item.life <= 0) {
                this.lootItems.splice(i, 1);
            }
        }

        // Clima del Mundo 3 (Lluvia, Hojas y Rayos espontáneos con Truenos)
        if (this.level >= 12) {
            // 1. Generar lluvia inclinada continua (3 gotas por frame)
            for (let r = 0; r < 3; r++) {
                const rx = this.cameraX + Math.random() * 1160 - 100;
                const ry = this.cameraY - 20;
                particles.spawnRain(rx, ry);
            }

            // 2. Generar hojas otoñales mecidas por el viento
            if (Math.random() < 0.12) {
                const lx = this.cameraX + Math.random() * 1160 - 100;
                const ly = this.cameraY - 20;
                particles.spawnLeaf(lx, ly);
            }

            // 3. Sistema de Relámpagos espontáneos con sacudidas y truenos
            if (!this.lightningTimer) {
                this.lightningTimer = 350 + Math.random() * 450; // cada 6-13 segundos
                this.lightningFlashDuration = 0;
            }
            this.lightningTimer--;

            if (this.lightningTimer <= 0) {
                this.lightningFlashDuration = 18;
                this.lightningBoltX = this.cameraX + 100 + Math.random() * 760;
                audio.playThunder(); // Trueno procedimental Web Audio API
                this.shakeTimer = 22;
                this.shakeIntensity = 4.0;
                this.lightningTimer = 350 + Math.random() * 450;
            }

            if (this.lightningFlashDuration > 0) {
                this.lightningFlashDuration--;
            }
        }

        // Actualizar daño por fuego continuo (DoT)
        this.updateFireDots();

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

        const targetCamY = this.player.y - 540 * 0.42; // Subir la pantalla cuando el caballero escala
        this.cameraY = this.cameraY * 0.9 + targetCamY * 0.1;

        // Limitar cámara a las dimensiones del nivel
        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.cameraX));
        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.cameraY));

        // 10. Actualizar Interfaz (HUD)
        this.updateHud();

        // 11. Manejar Muerte del Héroe
        if (this.player.hp <= 0 && this.state === 'playing' && !this.gameOverTriggered) {
            this.gameOverTriggered = true;
            setTimeout(() => this.triggerGameOver(), 1500);
        }
    }

    applyFireDot(enemy) {
        this.applyElementalDot(enemy, 'fire');
    }

    applyThunderRelicBonus(baseDamage, enemy) {
        if (!this.player?.isChargedStriking || !this.player.thunderRelicReady || !this.equippedRelics.has('storm_oath')) {
            return baseDamage;
        }

        this.player.thunderRelicReady = false;
        this.player.stormRelicJustTriggered = true;
        particles.spawnSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 18, 0);
        particles.addFloatingText(enemy.x + enemy.width / 2, enemy.y - 35, 'JURAMENTO DEL TRUENO', '#d9f6ff', 9, true);
        audio.playThunder();
        return baseDamage + 16;
    }

    applyStormRelicSwordBonus(baseDamage) {
        if (!this.equippedRelics?.has('storm_oath') || this.player?.thunderRelicReady) {
            return baseDamage;
        }
        if (this.player?.stormRelicJustTriggered) {
            this.player.stormRelicJustTriggered = false;
            return baseDamage;
        }
        return baseDamage + 8;
    }

    applyElectricDot(enemy) {
        this.applyElementalDot(enemy, 'electric');
    }

    applyElementalDot(enemy, type = 'fire') {
        if (!enemy || enemy.hp <= 0) return;
        if (enemy.active === false) return;

        // Evitar acumular múltiples DOTs del mismo tipo en el mismo enemigo.
        // Si ya tiene uno activo, se refresca a 5 segundos.
        const existing = this.activeFireDots.find(dot => dot.enemy === enemy && dot.type === type);
        if (existing) {
            existing.framesRemaining = 300;
            existing.nextTickFrames = 60; // Reiniciar también el temporizador del siguiente tick
            return;
        }

        this.activeFireDots.push({
            enemy: enemy,
            type,
            framesRemaining: 300, // 5 segundos a 60 FPS
            nextTickFrames: 60    // 1 segundo
        });

        const isElectric = type === 'electric';
        const text = isElectric ? "¡ELECTROCUTADO!" : "¡QUEMADURA!";
        const color = isElectric ? "#9ee8ff" : "#ff5500";

        for (let i = 0; i < 8; i++) {
            const px = enemy.x + enemy.width/2 + (Math.random() - 0.5)*20;
            const py = enemy.y + enemy.height/2 + (Math.random() - 0.5)*20;
            if (isElectric) {
                particles.spawnSparks(px, py, 1, 0);
            } else {
                particles.spawnFire(px, py, 1.2);
            }
        }

        particles.addFloatingText(enemy.x + enemy.width/2, enemy.y - 25, text, color, 10, true);
    }

    updateFireDots() {
        if (!this.activeFireDots) return;

        for (let i = this.activeFireDots.length - 1; i >= 0; i--) {
            const dot = this.activeFireDots[i];
            const enemy = dot.enemy;
            const isElectric = dot.type === 'electric';
            const dotColor = isElectric ? "#9ee8ff" : "#ff5500";

            // Si el enemigo ya no está activo o ha muerto, removemos el DOT
            if (enemy.active === false || enemy.hp <= 0) {
                this.activeFireDots.splice(i, 1);
                continue;
            }

            dot.framesRemaining--;
            dot.nextTickFrames--;

            // Emitir partículas pasivas en el aire sobre el cuerpo del enemigo
            if (this.gameTime % 4 === 0) {
                const px = enemy.x + Math.random() * enemy.width;
                const py = enemy.y + Math.random() * enemy.height;
                if (isElectric) {
                    particles.spawnSparks(px, py, 1, 0);
                } else {
                    particles.spawnFire(px, py, 0.6);
                }
            }

            if (dot.nextTickFrames <= 0) {
                dot.nextTickFrames = 60; // Tick cada 1 segundo (60 frames)

                // Aplicar exactamente 5 de daño por segundo durante 5 segundos.
                const originalArmor = enemy.hasArmor;
                enemy.hasArmor = false;

                // Interceptar addFloatingText para pintar el daño del elemento correcto.
                const originalAddFloatingText = particles.addFloatingText;
                particles.addFloatingText = function(x, y, text, color, fontSize, isCritical) {
                    const finalColor = text.startsWith("-") ? dotColor : color;
                    originalAddFloatingText.call(particles, x, y, text, finalColor, fontSize, isCritical);
                };

                // Aplicar daño
                const loot = enemy.takeDamage(5);

                // Restaurar comportamientos originales
                enemy.hasArmor = originalArmor;
                particles.addFloatingText = originalAddFloatingText;

                // Si el enemigo suelta botín al morir (p. ej. esqueleto pequeño/arquero/goblin), lo añadimos
                if (loot) {
                    if (loot.type) {
                        if (loot.x !== undefined && loot.y !== undefined) {
                            if (typeof loot.draw === 'function') {
                                this.lootItems.push(loot);
                            } else {
                                // Es el drop del miniboss (plain drop object)
                                this.world4MiniBossDefeated = true;
                                this.lootItems.push(new LootItem(loot.x, loot.y, loot.type));
                                if (this.level === 22) {
                                    this.revealWorld4SecretReturnDoor();
                                }
                                this.saveGame();
                            }
                        }
                    }
                }

                // Spawnear impacto extra del elemento.
                for (let k = 0; k < 6; k++) {
                    const px = enemy.x + enemy.width/2 + (Math.random() - 0.5)*16;
                    const py = enemy.y + enemy.height/2 + (Math.random() - 0.5)*16;
                    if (isElectric) {
                        particles.spawnSparks(px, py, 1, 0);
                    } else {
                        particles.spawnFire(px, py, 0.8);
                    }
                }
            }

            // Si expira la duración total (5 segundos = 300 frames)
            if (dot.framesRemaining <= 0) {
                this.activeFireDots.splice(i, 1);
            }
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

        if (this.state === 'world6_cinematic') {
            this.drawWorld6Cinematic();
            this.ctx.restore();
            return;
        }

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

        // Dibujar Rayo de fondo en el Mundo 3 (detrás de plataformas/personajes)
        if (this.level >= 12 && this.lightningFlashDuration > 0) {
            this.drawLightningBolt(this.ctx, this.lightningBoltX);
        }

        // --- APLICAR DESPLAZAMIENTO DE CÁMARA JUEGO ---
        this.ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

        if (this.level === 22) {
            this.drawWorld4SecretRoom();
        }

        // 1. Dibujar Hoguera (si está activa)
        if (this.bonfire) {
            this.drawBonfire();
        }

        // 1.2. Dibujar Puerta Secreta (si está activa en Nivel 3)
        if (this.secretDoor) {
            this.secretDoor.draw(this.ctx);
        }

        // Dibujar puertas secretas en Nivel 8
        if (this.level === 8) {
            if (this.shieldSecretDoor) this.shieldSecretDoor.draw(this.ctx);
            if (this.shieldReturnDoor) this.shieldReturnDoor.draw(this.ctx);
        }

        if (this.secretRoomDoor) {
            this.drawSecretRoomDoor();
        }

        if (this.level === 22) {
            this.drawWorld4SecretDoors();
            this.drawWorld4BoundaryWall();
        }

        if (this.level === 15 && this.world3StormLever?.visible) {
            const lever = this.world3StormLever;
            this.ctx.save();
            this.ctx.fillStyle = '#162033';
            this.ctx.fillRect(lever.x, lever.y + 20, 24, 12);
            this.ctx.strokeStyle = lever.activated ? '#d9f6ff' : '#9ee8ff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(lever.x, lever.y + 20, 24, 12);
            this.ctx.fillStyle = '#d9f6ff';
            this.ctx.fillRect(lever.x + 8, lever.y + 16, 8, 6);
            this.ctx.strokeStyle = lever.activated ? '#ffd700' : '#d9f6ff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(lever.x + 12, lever.y + 18);
            if (lever.activated) {
                this.ctx.lineTo(lever.x + 20, lever.y + 24);
                this.ctx.arc(lever.x + 20, lever.y + 24, 4, 0, Math.PI * 2);
            } else {
                this.ctx.lineTo(lever.x + 4, lever.y + 4);
                this.ctx.arc(lever.x + 4, lever.y + 4, 4, 0, Math.PI * 2);
            }
            this.ctx.stroke();
            this.ctx.fillStyle = lever.activated ? '#ffd700' : '#d9f6ff';
            this.ctx.fill();
            this.ctx.restore();
        }

        // 1.3. Dibujar Cofres de Tesoro
        if (this.chests) {
            this.chests.forEach(c => {
                if (!c.hidden) c.draw(this.ctx);
            });
        }
        this.treasureDoors.forEach(d => d.draw(this.ctx));
        this.loreTablets.forEach(t => t.draw(this.ctx));
        this.challengeDoors.forEach(d => d.draw(this.ctx, this.gameTime));
        this.relicPedestals.forEach(r => r.draw(this.ctx, this.gameTime));

        // 1.4. Dibujar Portal de Salida final del Nivel 4 o 5
        if (this.exitDoor && this.level !== 26) {
            this.ctx.save();
            const ex = this.exitDoor.x;
            const ey = this.exitDoor.y;

            // Arco de piedra del portal
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(ex, ey, 40, 60);

            // Núcleo del portal de oro brillante
            const portalGrad = this.ctx.createRadialGradient(ex + 20, ey + 30, 5, ex + 20, ey + 30, 25);
            portalGrad.addColorStop(0, '#fff');
            portalGrad.addColorStop(0.5, '#ffd700');
            portalGrad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = portalGrad;
            this.ctx.fillRect(ex + 2, ey + 2, 36, 56);

            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(ex, ey, 40, 60);

            // Si una salida especial sigue bloqueada, dibujar candado
            if ((this.level === 16 && !this.forestDoorUnlocked) || (this.level === 30 && !this.player?.hasVoidKey)) {
                // Dibujar una reja de hierro gótica cruzada en rojo/gris sobre el portal
                this.ctx.strokeStyle = this.level === 30 ? '#7b3fd1' : '#4e4e5e';
                this.ctx.lineWidth = 4;
                // Dibujar X de hierro
                this.ctx.beginPath();
                this.ctx.moveTo(ex, ey);
                this.ctx.lineTo(ex + 40, ey + 60);
                this.ctx.moveTo(ex + 40, ey);
                this.ctx.lineTo(ex, ey + 60);
                this.ctx.stroke();

                // Dibujar candado dorado central con ojo de cerradura
                this.ctx.fillStyle = this.level === 30 ? '#b642f5' : '#d1a115';
                this.ctx.fillRect(ex + 12, ey + 20, 16, 16);
                this.ctx.strokeStyle = this.level === 30 ? '#d9f6ff' : '#8b6914';
                this.ctx.strokeRect(ex + 12, ey + 20, 16, 16);

                // Ojo de la cerradura
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(ex + 19, ey + 24, 2, 5);
                this.ctx.beginPath();
                this.ctx.arc(ex + 20, ey + 24, 2, 0, Math.PI*2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        // 1.5. Dibujar Plataformas y Trampas (si existen)
        if (this.platforms.length > 0 || this.fireTraps.length > 0 || this.windCurrents.length > 0 || this.windCrystals.length > 0 || this.lightningTraps.length > 0) {
            this.windCurrents.forEach(wc => wc.draw(this.ctx, this.gameTime));
            this.platforms.forEach(p => {
                if (!p.hidden) p.draw(this.ctx);
            });
            this.fireTraps.forEach(ft => ft.draw(this.ctx));
            this.lightningTraps.forEach(trap => trap.draw(this.ctx));
            this.windCrystals.forEach(crystal => crystal.draw(this.ctx, this.gameTime));
        }

        // Dibujar Palanca de Transición (Nivel 26)
        if (this.level === 26 && this.world5TransitionLever) {
            const lever = this.world5TransitionLever;
            this.ctx.save();
            this.ctx.fillStyle = '#3e3d45';
            this.ctx.fillRect(lever.x, lever.y + 20, 24, 12);
            this.ctx.strokeStyle = '#1b1a20';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(lever.x, lever.y + 20, 24, 12);

            this.ctx.fillStyle = '#0f0e12';
            this.ctx.fillRect(lever.x + 8, lever.y + 16, 8, 6);

            this.ctx.strokeStyle = '#9ee8ff'; // Color de energía celeste místico
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            if (!lever.activated) {
                this.ctx.moveTo(lever.x + 12, lever.y + 18);
                this.ctx.lineTo(lever.x + 4, lever.y + 4);
                this.ctx.stroke();
                this.ctx.fillStyle = '#9ee8ff';
                this.ctx.beginPath();
                this.ctx.arc(lever.x + 4, lever.y + 4, 4, 0, Math.PI*2);
                this.ctx.fill();
            } else {
                this.ctx.moveTo(lever.x + 12, lever.y + 18);
                this.ctx.lineTo(lever.x + 20, lever.y + 24);
                this.ctx.stroke();
                this.ctx.fillStyle = '#b642f5'; // Violeta al activarse
                this.ctx.beginPath();
                this.ctx.arc(lever.x + 20, lever.y + 24, 4, 0, Math.PI*2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        // Dibujar Plataforma del Elevador de Transición (Nivel 26)
        if (this.level === 26 && this.world5TransitionElevator) {
            const elevator = this.world5TransitionElevator;
            this.ctx.save();

            // Dibujar Cadenas metálicas pesadas en el fondo
            this.ctx.strokeStyle = 'rgba(80, 80, 95, 0.45)';
            this.ctx.lineWidth = 4;

            // Cadena izquierda
            this.ctx.beginPath();
            this.ctx.moveTo(elevator.x + 15, -1700);
            this.ctx.lineTo(elevator.x + 15, elevator.y);
            this.ctx.stroke();

            // Cadena derecha
            this.ctx.beginPath();
            this.ctx.moveTo(elevator.x + elevator.width - 15, -1700);
            this.ctx.lineTo(elevator.x + elevator.width - 15, elevator.y);
            this.ctx.stroke();

            // Dibujar eslabones dibujando líneas discontinuas
            this.ctx.strokeStyle = 'rgba(50, 50, 60, 0.65)';
            this.ctx.lineWidth = 6;
            this.ctx.setLineDash([8, 12]);
            this.ctx.beginPath();
            this.ctx.moveTo(elevator.x + 15, -1700);
            this.ctx.lineTo(elevator.x + 15, elevator.y);
            this.ctx.moveTo(elevator.x + elevator.width - 15, -1700);
            this.ctx.lineTo(elevator.x + elevator.width - 15, elevator.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset

            // Plataforma del ascensor: Piedra negra con decoraciones góticas violetas
            this.ctx.fillStyle = '#1c1b22'; // Piedra oscura
            this.ctx.fillRect(elevator.x, elevator.y, elevator.width, elevator.height);
            this.ctx.strokeStyle = '#b642f5'; // Borde rúnico violeta
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(elevator.x, elevator.y, elevator.width, elevator.height);

            // Runa o emblema central
            this.ctx.fillStyle = '#8f34d1';
            this.ctx.fillRect(elevator.x + elevator.width/2 - 20, elevator.y + 4, 40, elevator.height - 8);
            this.ctx.restore();
        }

        // Dibujar la Gran Puerta Espectral (Vórtice Violeta/Negro) en el Nivel 26
        if (this.level === 26 && this.exitDoor) {
            const door = this.exitDoor;
            this.ctx.save();

            const cx = door.x + door.width / 2;
            const cy = door.y + door.height / 2;

            // 1. Destello exterior radial
            const radGrad = this.ctx.createRadialGradient(cx, cy, 5, cx, cy, 45);
            radGrad.addColorStop(0, 'rgba(150, 60, 255, 0.8)');
            radGrad.addColorStop(0.5, 'rgba(100, 30, 200, 0.4)');
            radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = radGrad;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 45, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Anillo exterior rúnico
            this.ctx.strokeStyle = '#b642f5';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 32, 0, Math.PI * 2);
            this.ctx.stroke();

            // 3. Vórtice espiral concéntrico giratorio
            this.ctx.translate(cx, cy);
            this.ctx.rotate(this.gameTime * 0.04); // Girar constantemente

            this.ctx.strokeStyle = '#8f34d1';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                this.ctx.rotate(Math.PI / 2);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.bezierCurveTo(8, -8, 16, -16, 28, 0);
                this.ctx.stroke();
            }

            // 4. Centro del vórtice: Negro absoluto
            this.ctx.fillStyle = '#0a090e';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        // Dibujar Palanca Gótica (Mundo 4)
        if (this.level === 22 && this.world4Lever) {
            const lever = this.world4Lever;
            this.ctx.save();
            // Dibujar base gris oscura
            this.ctx.fillStyle = '#3e3d45';
            this.ctx.fillRect(lever.x, lever.y + 20, 24, 12);
            this.ctx.strokeStyle = '#1b1a20';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(lever.x, lever.y + 20, 24, 12);

            // Dibujar ranura
            this.ctx.fillStyle = '#0f0e12';
            this.ctx.fillRect(lever.x + 8, lever.y + 16, 8, 6);

            // Dibujar manija
            this.ctx.strokeStyle = '#ff3300';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            if (!lever.activated) {
                // Apuntando arriba-izquierda
                this.ctx.moveTo(lever.x + 12, lever.y + 18);
                this.ctx.lineTo(lever.x + 4, lever.y + 4);
                this.ctx.stroke();
                // Pomo esférico rojo
                this.ctx.fillStyle = '#ff2200';
                this.ctx.beginPath();
                this.ctx.arc(lever.x + 4, lever.y + 4, 4, 0, Math.PI*2);
                this.ctx.fill();
            } else {
                // Apuntando abajo-derecha (activada)
                this.ctx.moveTo(lever.x + 12, lever.y + 18);
                this.ctx.lineTo(lever.x + 20, lever.y + 24);
                this.ctx.stroke();
                // Pomo esférico naranja de energía
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.beginPath();
                this.ctx.arc(lever.x + 20, lever.y + 24, 4, 0, Math.PI*2);
                this.ctx.fill();
            }

            // Prompt interactivo si el Caballero está cerca
            const distX = Math.abs((this.player.x + this.player.width/2) - (lever.x + lever.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (lever.y + lever.height/2));
            if (distX < 60 && distY < 60 && !lever.activated) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = "8px 'Press Start 2P', monospace";
                this.ctx.textAlign = 'center';
                // Añadir un pequeño brillo
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = '#ffd700';
                this.ctx.fillText("PULSAR E", lever.x + 12, lever.y - 10);
            }
            this.ctx.restore();
        }

        if (this.level === 23) {
            this.drawWorld4MoonRace();
        }

        // Dibujar Portón Rúnico Secreto (Mundo 4)
        if (this.level === 22 && this.world4SecretGate?.legacyGate) {
            const gate = this.world4SecretGate;
            this.ctx.save();

            const doorY = gate.currentY !== undefined ? gate.currentY : gate.y;

            // Cuerpo de la puerta de piedra gótica (gradiente)
            const grad = this.ctx.createLinearGradient(gate.x, doorY, gate.x + gate.width, doorY);
            grad.addColorStop(0, '#2e2c35');
            grad.addColorStop(0.5, '#484552');
            grad.addColorStop(1, '#2e2c35');

            this.ctx.fillStyle = grad;
            this.ctx.fillRect(gate.x, doorY, gate.width, gate.height);

            this.ctx.strokeStyle = '#151419';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(gate.x, doorY, gate.width, gate.height);

            // Ladrillos tallados en la piedra
            this.ctx.strokeStyle = '#151419';
            this.ctx.lineWidth = 1.5;
            for (let ly = 15; ly < gate.height; ly += 25) {
                this.ctx.beginPath();
                this.ctx.moveTo(gate.x, doorY + ly);
                this.ctx.lineTo(gate.x + gate.width, doorY + ly);
                this.ctx.stroke();
            }

            // Runas celestes brillantes talladas
            if (!gate.opened) {
                this.ctx.shadowBlur = 6;
                this.ctx.shadowColor = '#00ffff';
                this.ctx.fillStyle = '#00ffff';

                this.ctx.font = "8px monospace";
                this.ctx.textAlign = 'center';
                this.ctx.fillText("ᚱ", gate.x + gate.width/2, doorY + 30);
                this.ctx.fillText("ᚢ", gate.x + gate.width/2, doorY + 60);
                this.ctx.fillText("ᚾ", gate.x + gate.width/2, doorY + 90);
                this.ctx.fillText("ᛒ", gate.x + gate.width/2, doorY + 120);
            }
            this.ctx.restore();
        }

        // 2. Dibujar Obstáculos y Cajas
        this.spikes.forEach(s => s.draw(this.ctx));
        this.crates.forEach(c => c.draw(this.ctx));

        this.blades.forEach(b => b.draw(this.ctx));

        this.voidCrystals.forEach(crystal => crystal.draw(this.ctx));

        if (this.spectralPortals && this.spectralPortals.length > 0) {
            this.spectralPortals.forEach(portal => portal.draw(this.ctx));
        }
        if (this.spectralWraiths && this.spectralWraiths.length > 0) {
            this.spectralWraiths.forEach(w => w.draw(this.ctx));
        }

        // 3. Dibujar Enemigos
        this.bats.forEach(b => b.draw(this.ctx));
        this.windSentinels.forEach(s => s.draw(this.ctx));
        this.skeletons.forEach(s => s.draw(this.ctx));
        this.archers.forEach(a => a.draw(this.ctx));
        this.miniBosses.forEach(mb => mb.draw(this.ctx));
        this.arrows.forEach(arr => arr.draw(this.ctx));

        // 4. Dibujar al Jefe Final Gigante (Nivel 5, 11, 18, 25 y Doppelgänger 34)
        if (this.boss) {
            // Ondas de choque sísmicas (solo SkeletonKingBoss las tiene)
            if (this.boss.spawnedShockwaves) {
                this.boss.spawnedShockwaves.forEach(sw => sw.draw(this.ctx));
            }

            this.boss.draw(this.ctx);

            // Proyectiles del jefe (solo SkeletonKingBoss los tiene)
            if (this.boss.spawnedProjectiles) {
                this.boss.spawnedProjectiles.forEach(p => p.draw(this.ctx));
            }
        }

        // 5. Dibujar botín tirado (Loot)
        this.lootItems.forEach(item => item.draw(this.ctx));

        // 5.5. Dibujar cadena del gancho si el caballero está colgado
        if (this.player && this.player.isHooked) {
            this.drawHookChain();
        }

        // 6. Dibujar Caballero Héroe
        if (this.player) {
            this.player.draw(this.ctx, this.lightningFlashDuration > 0);
        }

        // 7. Dibujar Capa Superior de Partículas (fuego, astillas, etc.)
        particles.draw(this.ctx);

        // Destello de Relámpago en todo el viewport en el Mundo 3
        if (this.level >= 12 && this.lightningFlashDuration > 0) {
            this.ctx.fillStyle = `rgba(240, 252, 255, ${0.42 * (this.lightningFlashDuration / 18)})`;
            this.ctx.fillRect(this.cameraX, this.cameraY - 200, 960, 750);
        }

        this.ctx.restore(); // Restaurar translate cámara y sacudidas
        this.drawLoreNote();
    }

    showLoreNote(tablet) {
        if (!tablet) return;
        const lines = tablet.message.split('|').map(line => line.trim()).filter(Boolean);
        this.activeLoreNote = {
            title: 'INSCRIPCIÓN ANTIGUA',
            lines
        };
        audio.playBonfire();
    }

    drawLoreNote() {
        if (!this.activeLoreNote) return;

        const note = this.activeLoreNote;
        const ctx = this.ctx;
        const width = 620;
        const height = 118 + note.lines.length * 24;
        const x = (this.canvas.width - width) / 2;
        const y = 54;

        ctx.save();
        ctx.fillStyle = 'rgba(10, 8, 12, 0.78)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#261d16';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#3a2a1e';
        ctx.fillRect(x + 8, y + 8, width - 16, height - 16);
        ctx.strokeStyle = '#d9b36a';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        ctx.strokeStyle = '#6f5634';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 12, y + 12, width - 24, height - 24);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd98a';
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText(note.title, x + width / 2, y + 36);

        ctx.fillStyle = '#f5e3bd';
        ctx.font = "9px 'Press Start 2P', monospace";
        note.lines.forEach((line, index) => {
            ctx.fillText(line, x + width / 2, y + 72 + index * 25);
        });

        ctx.fillStyle = '#9ee8ff';
        ctx.font = "7px 'Press Start 2P', monospace";
        ctx.fillText("Pulsa E para cerrar", x + width / 2, y + height - 20);
        ctx.restore();
    }

    // Dibujado procedimental ramificado de relámpagos pixelados en el fondo del Bosque
    drawLightningBolt(ctx, x) {
        ctx.save();
        ctx.strokeStyle = 'rgba(235, 248, 255, 0.95)';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3 + Math.random() * 2.5;

        ctx.beginPath();
        let curX = x;
        let curY = -250; // Comienza en el cielo alto
        ctx.moveTo(curX, curY);

        while (curY < this.floorY) {
            const nextY = curY + 22 + Math.random() * 32;
            const nextX = curX + (Math.random() - 0.5) * 45;
            ctx.lineTo(nextX, nextY);

            // 22% de probabilidad de generar una rama secundaria ramificada
            if (Math.random() < 0.22) {
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(nextX, nextY);
                ctx.lineTo(nextX + (Math.random() - 0.5) * 55, nextY + 35);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(nextX, nextY);
            }

            curX = nextX;
            curY = nextY;
        }
        ctx.stroke();

        // Espectacular resplandor de impacto radial difuso donde pega el rayo (curX, curY)
        ctx.save();
        ctx.shadowBlur = 0; // Desactivar shadowBlur nativo lento para el relleno grande
        const radGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, 160);
        radGrad.addColorStop(0, 'rgba(0, 255, 255, 0.55)');
        radGrad.addColorStop(0.3, 'rgba(0, 255, 255, 0.22)');
        radGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, 160, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
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

    drawWorld4SecretRoom() {
        if (!this.world4SecretRoomBounds) return;
        const room = this.world4SecretRoomBounds;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(3, 5, 10, 0.96)';
        this.ctx.fillRect(room.x, room.y, room.width, room.height);
        this.ctx.strokeStyle = '#1c2c3d';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(room.x, room.y, room.width, room.height);

        // Bloques de piedra de fondo para que se sienta como cámara real, no vacío.
        this.ctx.strokeStyle = 'rgba(120, 160, 190, 0.16)';
        this.ctx.lineWidth = 1;
        for (let y = room.y + 80; y < room.y + room.height - 30; y += 70) {
            this.ctx.beginPath();
            this.ctx.moveTo(room.x + 20, y);
            this.ctx.lineTo(room.x + room.width - 20, y);
            this.ctx.stroke();
        }
        for (let x = room.x + 90; x < room.x + room.width - 20; x += 140) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, room.y + 30);
            this.ctx.lineTo(x, room.y + room.height - 30);
            this.ctx.stroke();
        }

        const torchXs = [room.x + 120, room.x + 420, room.x + 740, room.x + 1080, room.x + 1420];
        torchXs.forEach((x, index) => {
            const y = room.y + 105 + (index % 2) * 55;
            const flicker = Math.sin(this.gameTime * 0.16 + index) * 3;
            this.ctx.fillStyle = '#3d2515';
            this.ctx.fillRect(x - 4, y, 8, 34);
            this.ctx.fillStyle = 'rgba(255, 130, 40, 0.22)';
            this.ctx.beginPath();
            this.ctx.arc(x, y - 3, 42 + flicker, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ff7a22';
            this.ctx.beginPath();
            this.ctx.ellipse(x, y - 6, 8, 16 + flicker, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffe88a';
            this.ctx.beginPath();
            this.ctx.ellipse(x + 1, y - 7, 4, 9, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.fillRect(room.x, -500, room.width, 32);
        this.ctx.fillStyle = 'rgba(80, 105, 126, 0.18)';
        for (let x = room.x + 50; x < room.x + room.width - 50; x += 120) {
            this.ctx.fillRect(x, -494, 72, 4);
        }
        this.ctx.restore();
    }

    drawWorld4SecretDoors() {
        const drawPortal = (door, label, color) => {
            if (!door || door.visible === false) return;
            const pulse = 0.45 + Math.sin(this.gameTime * 0.08) * 0.18;
            this.ctx.save();
            this.ctx.fillStyle = '#061019';
            this.ctx.fillRect(door.x, door.y, door.width, door.height);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = color;
            this.ctx.strokeRect(door.x, door.y, door.width, door.height);
            this.ctx.beginPath();
            this.ctx.arc(door.x + door.width / 2, door.y + 20, 18, Math.PI, 0);
            this.ctx.stroke();
            this.ctx.fillStyle = `rgba(158, 232, 255, ${pulse})`;
            this.ctx.fillRect(door.x + 8, door.y + 16, door.width - 16, door.height - 24);

            const distX = Math.abs((this.player.x + this.player.width / 2) - (door.x + door.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (door.y + door.height / 2));
            if (distX < 70 && distY < 90) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = "8px 'Press Start 2P', monospace";
                this.ctx.textAlign = 'center';
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = '#ffd700';
                this.ctx.fillText(label, door.x + door.width / 2, door.y - 12);
            }
            this.ctx.restore();
        };

        drawPortal(this.world4SecretGate, "ENTRAR", '#9ee8ff');
        drawPortal(this.world4SecretReturnDoor, "VOLVER", '#ffd700');
    }

    drawWorld4BoundaryWall() {
        const wall = this.world4MainBoundaryWall;
        if (!wall) return;
        this.ctx.save();
        this.ctx.fillStyle = '#151923';
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        this.ctx.strokeStyle = '#2b394a';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        this.ctx.fillStyle = 'rgba(158, 232, 255, 0.25)';
        for (let y = wall.y + 24; y < wall.y + wall.height; y += 52) {
            this.ctx.fillRect(wall.x + 8, y, wall.width - 16, 3);
        }
        this.ctx.restore();
    }

    drawSecretRoomDoor() {
        const door = this.secretRoomDoor;
        if (!door) return;

        this.ctx.save();

        // Cámara secreta excavada en roca volcánica.
        this.ctx.fillStyle = 'rgba(12, 5, 3, 0.92)';
        this.ctx.fillRect(door.x - 18, door.y - 12, 330, 105);
        this.ctx.strokeStyle = '#4a1708';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(door.x - 18, door.y - 12, 330, 105);

        // Puerta de entrada lateral con borde de magma.
        this.ctx.fillStyle = '#110604';
        this.ctx.fillRect(door.x, door.y, door.width, door.height);
        const pulse = 0.35 + Math.sin(this.gameTime * 0.08) * 0.15;
        this.ctx.strokeStyle = `rgba(255, 85, 0, ${pulse + 0.45})`;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(door.x, door.y, door.width, door.height);

        this.ctx.beginPath();
        this.ctx.arc(door.x + door.width / 2, door.y + 20, 18, Math.PI, 0);
        this.ctx.stroke();

        // Respiraderos bajos de lava dentro de la habitación.
        this.ctx.fillStyle = '#ff3300';
        this.ctx.fillRect(door.x + 74, door.y + 80, 42, 4);
        this.ctx.fillRect(door.x + 188, door.y + 80, 58, 4);

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
        const isWorldOne = this.level >= 1 && this.level <= 4;
        const isWorldTwoLava = (this.level >= 6 && this.level <= 10) || this.level === 11;
        const isWorldThreeForest = this.level >= 12 && this.level <= 17;
        const isWorldFourSkyCastle = this.level >= 19 && this.level <= 25;
        const isWorldFiveAbyss = this.isAbyssLevel();
        const isWorldSixSky = this.level >= 35;
        const isBossOne = this.level === 5;
        const isBossTwo = this.level === 11;
        const isBossThree = this.level === 18;

        // 1. Gradiente del fondo lejano
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
        if (isWorldOne) {
            bgGrad.addColorStop(0, '#06050a');
            bgGrad.addColorStop(0.5, '#120d18');
            bgGrad.addColorStop(1, '#08060c');
        } else if (isWorldTwoLava) {
            if (isBossTwo) {
                bgGrad.addColorStop(0, '#080101');
                bgGrad.addColorStop(0.5, '#1c0704');
                bgGrad.addColorStop(1, '#0d0202');
            } else {
                bgGrad.addColorStop(0, '#060202');
                bgGrad.addColorStop(0.6, '#180a08');
                bgGrad.addColorStop(1, '#2c0f05'); // Catacumbas de lava (fuego latente abajo)
            }
        } else if (isBossOne) {
            // Nivel 5 (Jefe 1) - Espectral verde oscuro
            bgGrad.addColorStop(0, '#020604');
            bgGrad.addColorStop(0.5, '#08140e');
            bgGrad.addColorStop(1, '#030806');
        } else if (isWorldThreeForest || isBossThree) {
            // Nivel 12-18 (Mundo 3) - Gradiente bosque verde místico muy oscuro
            bgGrad.addColorStop(0, '#010603');
            bgGrad.addColorStop(0.5, '#05190b');
            bgGrad.addColorStop(1, '#020804');
        } else if (isWorldFourSkyCastle) {
            bgGrad.addColorStop(0, '#06101f');
            bgGrad.addColorStop(0.5, '#111d32');
            bgGrad.addColorStop(1, '#07101c');
        } else if (isWorldFiveAbyss) {
            bgGrad.addColorStop(0, '#02030a');
            bgGrad.addColorStop(0.45, '#070014');
            bgGrad.addColorStop(1, '#000000');
        } else if (isWorldSixSky) {
            bgGrad.addColorStop(0, '#dff8ff');
            bgGrad.addColorStop(0.5, '#86c6ff');
            bgGrad.addColorStop(1, '#f8fbff');
        }
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, w, h);

        // 2. Capa lejana (Paralaje 0.12x)
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX * 0.12), -Math.round(this.cameraY * 0.08));

        if (isWorldOne) {
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
        } else if (isWorldTwoLava && !isBossTwo) {
            // Estructuras de ladrillo de las catacumbas de lava (rojo oscuro) para niveles comunes del mundo 2
            this.ctx.fillStyle = 'rgba(38, 16, 12, 0.55)';
            const columnWidth = 180;
            const totalCols = Math.ceil(this.levelWidth / columnWidth) + 1;
            for (let i = 0; i < totalCols; i++) {
                const cx = i * columnWidth;
                const columnTop = -250;
                this.ctx.fillRect(cx + 20, columnTop, 35, h - columnTop); // Columnas medievales gruesas

                // Arcos apuntados de ladrillo
                this.ctx.beginPath();
                const archY = 90;
                const peakY = 60;
                this.ctx.moveTo(cx + 20, archY);
                this.ctx.lineTo(cx + columnWidth/2, peakY);
                this.ctx.lineTo(cx + columnWidth - 20, archY);
                this.ctx.closePath();
                this.ctx.fill();
            }
        } else if (isBossOne || isBossTwo || isBossThree) {
            // Nivel 5, 11 y 18 (Cámaras del Jefe) - Ventanales espectrales
            this.ctx.fillStyle = isBossOne ? 'rgba(12, 28, 20, 0.45)' : (isBossTwo ? 'rgba(55, 15, 5, 0.45)' : 'rgba(10, 42, 22, 0.45)');
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
        } else if (isWorldThreeForest) {
            // Siluetas de pinos y árboles ancestrales en la lejanía
            this.ctx.fillStyle = 'rgba(8, 26, 14, 0.4)';
            const treeSpacing = 280;
            const totalTrees = Math.ceil(this.levelWidth / treeSpacing) + 1;
            for (let i = 0; i < totalTrees; i++) {
                const tx = i * treeSpacing;
                // Dibujar un tronco grueso
                this.ctx.fillRect(tx + 40, -100, 32, h + 100);
                // Dibujar copas de pino
                this.ctx.beginPath();
                this.ctx.moveTo(tx + 56, 40);
                this.ctx.lineTo(tx + 6, 180);
                this.ctx.lineTo(tx + 106, 180);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.moveTo(tx + 56, 100);
                this.ctx.lineTo(tx - 14, 260);
                this.ctx.lineTo(tx + 126, 260);
                this.ctx.closePath();
                this.ctx.fill();
            }
        } else if (isWorldFourSkyCastle) {
            this.ctx.fillStyle = 'rgba(180, 220, 255, 0.12)';
            const towerSpacing = 340;
            const totalTowers = Math.ceil(this.levelWidth / towerSpacing) + 1;
            for (let i = 0; i < totalTowers; i++) {
                const tx = i * towerSpacing;
                this.ctx.fillRect(tx + 60, -260, 56, h + 260);
                this.ctx.beginPath();
                this.ctx.moveTo(tx + 48, -260);
                this.ctx.lineTo(tx + 88, -330);
                this.ctx.lineTo(tx + 128, -260);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.fillRect(tx + 80, 120, 18, 70);
            }
        } else if (isWorldSixSky) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
            for (let i = 0; i < 12; i++) {
                const cx = i * 220 + Math.sin(this.gameTime * 0.006 + i) * 18;
                const cy = 130 + (i % 4) * 54;
                this.ctx.beginPath();
                this.ctx.ellipse(cx, cy, 84, 24, 0, 0, Math.PI * 2);
                this.ctx.ellipse(cx + 50, cy - 8, 58, 20, 0, 0, Math.PI * 2);
                this.ctx.ellipse(cx - 56, cy + 5, 50, 18, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }

            const castleX = 1650;
            const castleY = 120;
            this.ctx.save();
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = '#09000f';
            this.ctx.fillStyle = '#f9fbff';
            this.ctx.fillRect(castleX, castleY, 170, 160);
            this.ctx.fillRect(castleX + 28, castleY - 70, 42, 70);
            this.ctx.fillRect(castleX + 108, castleY - 96, 48, 96);
            this.ctx.beginPath();
            this.ctx.moveTo(castleX + 28, castleY - 70);
            this.ctx.lineTo(castleX + 49, castleY - 118);
            this.ctx.lineTo(castleX + 70, castleY - 70);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(castleX + 108, castleY - 96);
            this.ctx.lineTo(castleX + 132, castleY - 150);
            this.ctx.lineTo(castleX + 156, castleY - 96);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            this.ctx.beginPath();
            this.ctx.arc(castleX + 88, castleY + 58, 230, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.restore();

        // 3. Capa media de Columnas y Antorchas (Paralaje 0.45x)
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX * 0.45), -Math.round(this.cameraY * 0.25));

        if (isWorldOne || (isWorldTwoLava && !isBossTwo)) {
            this.ctx.fillStyle = isWorldOne ? '#1c1524' : '#281310';
            this.ctx.strokeStyle = isWorldOne ? '#0d0a11' : '#140604';
            this.ctx.lineWidth = 3;

            this.torches.forEach(t => {
                // Dibujar columna de piedra
                const columnTop = -250;
                this.ctx.fillRect(t.x - 22, columnTop, 44, h - columnTop);
                this.ctx.strokeRect(t.x - 22, columnTop, 44, h - columnTop);

                if (isWorldTwoLava) {
                    // Grietas de magma brillantes
                    this.ctx.fillStyle = '#ff3300';
                    this.ctx.fillRect(t.x - 18, 120, 4, 30);
                    this.ctx.fillRect(t.x + 14, 180, 4, 45);
                    this.ctx.fillRect(t.x - 8, 280, 6, 20);
                    this.ctx.fillStyle = '#281310'; // restaurar lava
                }

                // Antorcha de metal
                this.ctx.fillStyle = '#4a4a58';
                this.ctx.fillRect(t.x - 4, t.y, 8, 18);
                this.ctx.fillStyle = '#2d2d35';
                this.ctx.fillRect(t.x - 6, t.y - 4, 12, 6);

                // Halo de luz cálido
                const lightRad = 25 + Math.sin(this.gameTime * 0.1) * 3;
                const haloGrad = this.ctx.createRadialGradient(t.x, t.y - 12, 2, t.x, t.y - 12, lightRad);
                if (isWorldOne) {
                    haloGrad.addColorStop(0, 'rgba(255, 120, 0, 0.4)');
                    haloGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
                } else if (isWorldTwoLava) {
                    // Magma rojo brillante en las catacumbas
                    haloGrad.addColorStop(0, 'rgba(255, 50, 0, 0.5)');
                    haloGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                }

                this.ctx.fillStyle = haloGrad;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y - 12, lightRad, 0, Math.PI * 2);
                this.ctx.fill();
            });
        } else if (isWorldThreeForest) {
            // Troncos de pinos gruesos con ramas y farolas colgantes
            this.ctx.fillStyle = '#112215'; // Madera oscura de pino
            this.ctx.strokeStyle = '#050c07';
            this.ctx.lineWidth = 3;

            this.torches.forEach(t => {
                const columnTop = -250;
                this.ctx.fillRect(t.x - 18, columnTop, 36, h - columnTop);
                this.ctx.strokeRect(t.x - 18, columnTop, 36, h - columnTop);

                // Ramas colgantes decorativas a la izquierda
                this.ctx.fillStyle = '#112215';
                this.ctx.fillRect(t.x - 18, t.y - 40, -40, 10);
                this.ctx.strokeRect(t.x - 18, t.y - 40, -40, 10);

                // Farola colgando de la rama
                this.ctx.fillStyle = '#3a3a46'; // Metal
                this.ctx.fillRect(t.x - 48, t.y - 30, 8, 14); // Soporte
                this.ctx.fillRect(t.x - 52, t.y - 16, 16, 4); // Tapa
                this.ctx.fillStyle = '#00ff66'; // Cristal luminoso
                this.ctx.fillRect(t.x - 50, t.y - 12, 12, 10);

                // Halo de luz verde mística
                const lightRad = 32 + Math.sin(this.gameTime * 0.08) * 4;
                const haloGrad = this.ctx.createRadialGradient(t.x - 44, t.y - 7, 2, t.x - 44, t.y - 7, lightRad);
                haloGrad.addColorStop(0, 'rgba(0, 255, 102, 0.45)');
                haloGrad.addColorStop(1, 'rgba(0, 255, 50, 0)');

                this.ctx.fillStyle = haloGrad;
                this.ctx.beginPath();
                this.ctx.arc(t.x - 44, t.y - 7, lightRad, 0, Math.PI * 2);
                this.ctx.fill();
            });
        } else if (isWorldFourSkyCastle) {
            this.ctx.fillStyle = '#18243a';
            this.ctx.strokeStyle = '#6da8d6';
            this.ctx.lineWidth = 2;
            this.torches.forEach(t => {
                const columnTop = -420;
                this.ctx.fillRect(t.x - 18, columnTop, 36, h - columnTop);
                this.ctx.strokeRect(t.x - 18, columnTop, 36, h - columnTop);
                this.ctx.fillStyle = '#9ee8ff';
                this.ctx.fillRect(t.x - 8, t.y - 18, 16, 16);
                const lightRad = 38 + Math.sin(this.gameTime * 0.07) * 5;
                const haloGrad = this.ctx.createRadialGradient(t.x, t.y - 10, 2, t.x, t.y - 10, lightRad);
                haloGrad.addColorStop(0, 'rgba(158, 232, 255, 0.45)');
                haloGrad.addColorStop(1, 'rgba(158, 232, 255, 0)');
                this.ctx.fillStyle = haloGrad;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y - 10, lightRad, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#18243a';
            });
        } else if (isBossOne || isBossTwo || isBossThree) {
            // Nivel 5, 11 y 18 (Cámaras del Jefe) - Ventanales iluminados por rayos espectrales
            this.torches.forEach(t => {
                const lightRad = 60 + Math.sin(this.gameTime * 0.05) * 6;
                const haloGrad = this.ctx.createRadialGradient(t.x, t.y, 5, t.x, t.y, lightRad);
                if (isBossOne) {
                    haloGrad.addColorStop(0, 'rgba(0, 255, 120, 0.2)');
                    haloGrad.addColorStop(1, 'rgba(0, 255, 50, 0)');
                } else if (isBossTwo) {
                    // Boss 2: Rojo magma / fuego
                    haloGrad.addColorStop(0, 'rgba(255, 60, 0, 0.25)');
                    haloGrad.addColorStop(1, 'rgba(200, 20, 0, 0)');
                } else if (isBossThree) {
                    // Boss 3: Verde místico brillante forestal
                    haloGrad.addColorStop(0, 'rgba(0, 255, 102, 0.3)');
                    haloGrad.addColorStop(1, 'rgba(0, 200, 50, 0)');
                }
                this.ctx.fillStyle = haloGrad;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, lightRad, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        this.ctx.restore();

        // 4. Suelo de Ladrillos (Capa 1.0x)
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

        // Bloques de piedra oscuros del suelo
        if (isWorldOne) {
            this.ctx.fillStyle = '#28252e';
        } else if (isWorldTwoLava) {
            this.ctx.fillStyle = '#211a18'; // Piedra volcánica oscura
        } else if (isBossOne || isBossThree) {
            this.ctx.fillStyle = '#16241a'; // Piedra verde espectral
        } else if (isWorldThreeForest) {
            this.ctx.fillStyle = '#1c2b1e'; // Piedra musgosa verde muy oscura
        } else if (isWorldFourSkyCastle) {
            this.ctx.fillStyle = '#263248';
        } else if (isWorldSixSky) {
            this.ctx.fillStyle = '#f8fbff';
        }
        if (isWorldFiveAbyss) {
            const voidGrad = this.ctx.createLinearGradient(0, this.floorY - 70, 0, h);
            voidGrad.addColorStop(0, 'rgba(182, 66, 245, 0.16)');
            voidGrad.addColorStop(0.35, 'rgba(20, 0, 36, 0.38)');
            voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
            this.ctx.fillStyle = voidGrad;
            this.ctx.fillRect(0, this.floorY - 70, this.levelWidth, h - this.floorY + 70);
            this.ctx.strokeStyle = 'rgba(182, 66, 245, 0.28)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([18, 20]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.floorY);
            this.ctx.lineTo(this.levelWidth, this.floorY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.restore();
            return;
        }

        this.ctx.fillRect(0, this.floorY, this.levelWidth, h - this.floorY);

        this.ctx.strokeStyle = isWorldOne ? '#18151c' : (isWorldTwoLava ? '#100a08' : ((isWorldThreeForest || isBossThree) ? '#122015' : (isWorldFourSkyCastle ? '#6da8d6' : (isWorldSixSky ? '#d9f6ff' : '#0a120e'))));
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, this.floorY, this.levelWidth, h - this.floorY);

        // Baldosas retro
        this.ctx.strokeStyle = isWorldOne ? '#18151c' : (isWorldTwoLava ? '#ff4400' : ((isWorldThreeForest || isBossThree) ? '#2d5a37' : (isWorldFourSkyCastle ? '#9ee8ff' : (isWorldSixSky ? '#ffffff' : '#0a120e')))); // Baldosas verdes en Mundo 3 // Magma brillante en Mundo 2
        this.ctx.lineWidth = isWorldTwoLava ? 1.5 : 2.5;
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

        // Brillo difuso del magma
        if (isWorldTwoLava) {
            this.ctx.fillStyle = 'rgba(255, 68, 0, 0.08)';
            this.ctx.fillRect(0, this.floorY, this.levelWidth, 12);
        }

        // Decoración de hierro en Nivel 5 / 11
        if (this.level === 5 || this.level === 11) {
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

        // Textos numéricos encima de las barras
        const hpText = document.getElementById('player-hp-text');
        const stText = document.getElementById('player-st-text');
        if (hpText) hpText.innerText = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
        if (stText) stText.innerText = `${Math.ceil(this.player.stamina)}/${this.player.maxStamina}`;

        // Indicador de Nivel
        if (this.domLevelIndicator) {
            let worldNum = 1;
            let levelSubNum = this.level;
            if (this.level >= 35) {
                worldNum = 6;
                levelSubNum = this.level - 34;
            } else if (this.level >= 27) {
                worldNum = 5;
                levelSubNum = this.level - 26;
            } else if (this.level === 26) {
                worldNum = 5;
                levelSubNum = 0;
            } else if (this.level >= 19) {
                worldNum = 4;
                levelSubNum = this.level - 18;
            } else if (this.level >= 12) {
                worldNum = 3;
                levelSubNum = this.level - 11;
            } else if (this.level >= 6) {
                worldNum = 2;
                levelSubNum = this.level - 5;
            }
            this.domLevelIndicator.innerText = `NIVEL ${worldNum}-${levelSubNum}`;
        }

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
            const totalPotions = this.player.potions + this.player.greatPotions + this.player.berries + this.player.violetBerries;
            this.inventoryBadge.innerText = totalPotions;
            this.slotPotionQty.innerText = 'x' + this.player.potions;

            if (this.slotGreatPotionQty) this.slotGreatPotionQty.innerText = 'x' + this.player.greatPotions;
            if (this.slotGreatPotion) this.slotGreatPotion.style.display = 'none';
            if (this.slotBerryQty) this.slotBerryQty.innerText = 'x' + this.player.berries;
            if (this.slotBerry) {
                if (this.player.berries > 0) {
                    this.slotBerry.classList.remove('hidden');
                    this.slotBerry.style.display = '';
                } else {
                    this.slotBerry.classList.add('hidden');
                    this.slotBerry.style.display = 'none';
                }
            }
            if (this.slotVioletBerryQty) this.slotVioletBerryQty.innerText = 'x' + this.player.violetBerries;
            if (this.slotVioletBerry) {
                if (this.player.violetBerries > 0) {
                    this.slotVioletBerry.classList.remove('hidden');
                    this.slotVioletBerry.style.display = '';
                } else {
                    this.slotVioletBerry.classList.add('hidden');
                    this.slotVioletBerry.style.display = 'none';
                }
            }

            // Si no tiene pociones en total, atenuar el bulto
            this.inventoryBadge.style.opacity = (totalPotions === 0) ? '0.3' : '1.0';

            // Atenuar botones rápidos del HUD si no hay existencias
            this.btnPotionHud.style.opacity = (this.player.potions === 0) ? '0.3' : '1.0';
            if (this.btnGreatPotionHud) this.btnGreatPotionHud.style.opacity = (this.player.greatPotions === 0) ? '0.3' : '1.0';
            if (this.btnBerryHud) this.btnBerryHud.style.opacity = (this.player.berries === 0 && this.player.violetBerries === 0) ? '0.3' : '1.0';

            // Actualizar inventario interactivo de armas
            this.updateInventoryUI();
        }
    }

    updateInventoryUI() {
        if (!this.player) return;

        // 1. Obtener elementos DOM
        const equippedIcon = document.getElementById('equipped-weapon-icon');
        const equippedName = document.getElementById('equipped-weapon-name');
        const shieldSlot = document.getElementById('equipped-shield-slot');
        const shieldIcon = document.getElementById('equipped-shield-icon');
        const shieldName = document.getElementById('equipped-shield-name');
        const relicSlot = document.getElementById('equipped-relic-slot');
        const relicIcon = document.getElementById('equipped-relic-icon');
        const relicName = document.getElementById('equipped-relic-name');

        // 2. Actualizar sección superior "ARMA PRINCIPAL"
        if (equippedIcon && equippedName) {
            if (this.player.weapon === 'storm') {
                equippedIcon.innerText = '⚡';
                equippedIcon.style.filter = 'drop-shadow(0 0 4px #9ee8ff)';
                equippedName.innerText = 'Espada de la Tormenta';
                equippedName.style.color = '#9ee8ff';
            } else if (this.player.weapon === 'legendary') {
                equippedIcon.innerText = '🗡️';
                equippedIcon.style.filter = 'sepia(1) saturate(20) hue-rotate(320deg) brightness(0.85) drop-shadow(0 0 3px red)';
                equippedName.innerText = 'Espada de Fuego';
                equippedName.style.color = '#ff3333';
            } else {
                equippedIcon.innerText = '🗡️';
                equippedIcon.style.filter = 'none';
                equippedName.innerText = 'Espada Oxidada';
                equippedName.style.color = '#ffffff';
            }
        }

        // 3. Actualizar sección "ESCUDO"
        if (shieldSlot && shieldIcon && shieldName) {
            if (this.player.shield === 'reinforced') {
                shieldIcon.innerText = '🛡️';
                shieldIcon.style.filter = 'drop-shadow(0 0 3px #66ccff)';
                shieldName.innerText = 'Escudo Reforzado +5% REC';
                shieldName.style.color = '#66ccff';
                shieldSlot.style.borderColor = '#66ccff';
                shieldSlot.style.boxShadow = '0 0 8px rgba(102, 204, 255, 0.45)';
            } else {
                shieldIcon.innerText = '🛡️';
                shieldIcon.style.filter = 'none';
                shieldName.innerText = 'Escudo de Acero';
                shieldName.style.color = '#a0a0b0';
                shieldSlot.style.borderColor = '#5c5c6d';
                shieldSlot.style.boxShadow = '0 0 6px rgba(92, 92, 109, 0.3)';
            }
        }

        if (relicSlot && relicIcon && relicName) {
            const activeRelic = Array.from(this.equippedRelics || [])[0];
            if (activeRelic) {
                const info = this.getRelicInfo(activeRelic);
                relicIcon.innerText = info.icon;
                relicIcon.style.filter = `drop-shadow(0 0 4px ${info.color})`;
                relicName.innerText = info.name;
                relicName.style.color = info.color;
                relicSlot.style.borderColor = info.color;
                relicSlot.style.boxShadow = `0 0 8px ${info.color}66`;
            } else {
                relicIcon.innerText = '◇';
                relicIcon.style.filter = 'none';
                relicName.innerText = 'Sin Reliquia';
                relicName.style.color = '#d9b36a';
                relicSlot.style.borderColor = '#7a5a22';
                relicSlot.style.boxShadow = '0 0 6px rgba(255, 215, 0, 0.2)';
            }
        }

        // 4. Mostrar estado de "OBJETOS CLAVE" (Llave del Bosque)
        const keyItemsSection = document.getElementById('key-items-section');
        if (keyItemsSection) {
            keyItemsSection.style.display = 'block';
            const keySlot = document.getElementById('slot-forest-key');
            const keyQty = document.getElementById('slot-forest-key-qty');
            if (keyQty) keyQty.innerText = this.player.hasForestKey ? 'x1' : 'x0';
            if (keySlot) {
            if (this.player.hasForestKey) {
                // Aplicar un brillo dorado al icono de la llave para destacarla
                keySlot.classList.remove('empty-slot');
                keySlot.classList.add('active-slot');
                keySlot.style.borderColor = '#c8a000';
                keySlot.style.boxShadow = '0 0 8px rgba(200, 160, 0, 0.6)';
                keySlot.title = 'Llave del Bosque — Abre la puerta sellada del Nivel 3-5';
                const keyIcon = typeof keySlot.querySelector === 'function' ? keySlot.querySelector('.slot-icon') : null;
                if (keyIcon) keyIcon.style.filter = 'drop-shadow(0 0 3px gold)';
            } else {
                keySlot.classList.add('empty-slot');
                keySlot.classList.remove('active-slot');
                keySlot.style.borderColor = '#4a4a5a';
                keySlot.style.boxShadow = 'none';
                keySlot.title = 'Llave del Bosque — Todavía no la tienes';
                const keyIcon = typeof keySlot.querySelector === 'function' ? keySlot.querySelector('.slot-icon') : null;
                if (keyIcon) keyIcon.style.filter = 'grayscale(1)';
            }
            }
            const voidKeySlot = document.getElementById('slot-void-key');
            const voidKeyQty = document.getElementById('slot-void-key-qty');
            if (voidKeyQty) voidKeyQty.innerText = this.player.hasVoidKey ? 'x1' : 'x0';
            if (voidKeySlot) {
            if (this.player.hasVoidKey) {
                voidKeySlot.classList.remove('empty-slot');
                voidKeySlot.classList.add('active-slot');
                voidKeySlot.style.borderColor = '#b642f5';
                voidKeySlot.style.boxShadow = '0 0 8px rgba(182, 66, 245, 0.65)';
                voidKeySlot.title = 'Llave del Vacío — Abre la salida sellada del Mundo 5-4';
                const voidKeyIcon = typeof voidKeySlot.querySelector === 'function' ? voidKeySlot.querySelector('.slot-icon') : null;
                if (voidKeyIcon) voidKeyIcon.style.filter = 'drop-shadow(0 0 3px #b642f5)';
            } else {
                voidKeySlot.classList.add('empty-slot');
                voidKeySlot.classList.remove('active-slot');
                voidKeySlot.style.borderColor = '#4a4a5a';
                voidKeySlot.style.boxShadow = 'none';
                voidKeySlot.title = 'Llave del Vacío — Todavía no la tienes';
                const voidKeyIcon = typeof voidKeySlot.querySelector === 'function' ? voidKeySlot.querySelector('.slot-icon') : null;
                if (voidKeyIcon) voidKeyIcon.style.filter = 'grayscale(1)';
            }
            }
        }
    }

    openSubgrid(type) {
        if (!this.domSubgridPopup) return;
        this.domSubgridPopup.classList.remove('hidden');
        this.subgridType = type;
        this.populateSubgrid(type);
    }

    toggleSubgrid(type) {
        if (!this.domSubgridPopup) return;

        if (this.domSubgridPopup.classList.contains('hidden') || this.subgridType !== type) {
            this.openSubgrid(type);
        } else {
            this.domSubgridPopup.classList.add('hidden');
            this.subgridType = null;
        }
    }

    populateSubgrid(type) {
        if (!this.player || !this.domSubgridGrid) return;

        // Limpiar el subgrid
        this.domSubgridGrid.innerHTML = '';
        this.subgridType = type;

        if (type === 'weapon') {
            if (this.domSubgridTitle) this.domSubgridTitle.innerText = 'ARMAS';
            if (this.domSubgridDesc) this.domSubgridDesc.innerText = 'Pasa el cursor o toca una espada para ver su daño e historia.';

            const weaponsList = [
                { id: 'rusty', name: 'Espada Oxidada', icon: '🗡️', unlocked: true, desc: 'Daño: 30 normal / 50 cargado. Origen: equipo inicial del caballero, gastada por demasiadas tumbas abiertas.' },
                { id: 'legendary', name: 'Espada de Fuego', icon: '🗡️', unlocked: this.player.hasLegendarySword, desc: 'Daño: 45 normal. Ataque cargado aplica fuego continuo: 5 dmg/seg por 5s.' },
                { id: 'storm', name: 'Espada de la Tormenta', icon: '⚡', unlocked: this.player.hasStormSword, desc: 'Daño: 58 normal / 82 cargado. Ataque cargado aplica electricidad: 5 dmg/seg por 5s. Origen: Ángel Caído de la Tormenta.' },
                { id: 'frost', name: 'Daga de Hielo', icon: '❄️', unlocked: false, desc: 'Congela a los enemigos con su filo helado. (Futuro)' },
                { id: 'poison', name: 'Espada de Veneno', icon: '🧪', unlocked: false, desc: 'Imbuida con veneno letal de araña. (Futuro)' },
                { id: 'spectral', name: 'Cetro Espectral', icon: '🔮', unlocked: false, desc: 'Arma mágica que canaliza almas perdidas. (Futuro)' }
            ];

            weaponsList.forEach(item => {
                const slotEl = document.createElement('div');
                const isEquipped = (this.player.weapon === item.id);
                const isUnlocked = item.unlocked;

                slotEl.className = 'inventory-slot';
                if (!isUnlocked) {
                    slotEl.classList.add('locked-slot');
                } else {
                    slotEl.classList.add('active-slot');
                    slotEl.classList.add('unlocked-slot');
                }
                if (isEquipped) {
                    slotEl.classList.add('equipped-highlight');
                }

                slotEl.innerHTML = `
                    <span class="slot-icon" style="${item.id === 'legendary' ? 'filter: sepia(1) saturate(20) hue-rotate(320deg) brightness(0.85) drop-shadow(0 0 3px red);' : (item.id === 'storm' ? 'filter: drop-shadow(0 0 4px #9ee8ff);' : '')}">${item.icon}</span>
                    <span class="slot-qty" style="background: ${isEquipped ? 'rgba(0, 255, 102, 0.85)' : (isUnlocked ? 'rgba(255, 215, 0, 0.85)' : 'rgba(0,0,0,0.8)')}; color: ${isEquipped ? '#fff' : (isUnlocked ? '#111' : '#888')};">${isEquipped ? 'USANDO' : (isUnlocked ? 'LISTO' : 'BLOQ')}</span>
                `;

                // Hover handlers para la descripción
                slotEl.addEventListener('mouseenter', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerHTML = `<strong style="color: var(--gold);">${item.name}</strong><br>${item.desc}`;
                    }
                });
                slotEl.addEventListener('mouseleave', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerText = 'Pasa el cursor o toca una espada para ver su daño e historia.';
                    }
                });

                // Click handler
                slotEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerHTML = `<strong style="color: var(--gold);">${item.name}</strong><br>${item.desc}`;
                    }
                    if (!isUnlocked) {
                        audio.playHit();
                        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "¡BLOQUEADO!", "#ff3333", 8);
                    } else if (!isEquipped) {
                        this.player.weapon = item.id;
                        if (item.id === 'legendary') {
                            audio.playBonfire(); // Sonido celestial
                            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "¡ESPADA DE FUEGO!", "#ff3333", 9, true);
                        } else if (item.id === 'storm') {
                            audio.playBonfire();
                            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "¡ESPADA DE TORMENTA!", "#9ee8ff", 9, true);
                        } else {
                            audio.playSwordSwing();
                            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "ESPADA OXIDADA", "#cccccc", 8);
                        }
                        this.updateInventoryUI();
                        this.populateSubgrid('weapon'); // Refrescar subgrid
                        this.saveGame();
                    }
                });

                this.domSubgridGrid.appendChild(slotEl);
            });

        } else if (type === 'shield') {
            if (this.domSubgridTitle) this.domSubgridTitle.innerText = 'ESCUDOS';
            if (this.domSubgridDesc) this.domSubgridDesc.innerText = 'Elige un escudo para equiparlo.';

            const shieldsList = [
                { id: 'steel', name: 'Escudo de Acero', icon: '🛡️', unlocked: true, desc: 'Escudo básico de acero templado.' },
                { id: 'reinforced', name: 'Escudo Reforzado', icon: '💠', unlocked: this.player.hasReinforcedShield, desc: 'Regenera la estamina un 5% más rápido al equiparlo.' },
                { id: 'lava', name: 'Escudo de Lava', icon: '🌋', unlocked: false, desc: 'Inmunidad temporal al daño de fuego. (Futuro)' },
                { id: 'wind', name: 'Escudo de Viento', icon: '🌀', unlocked: false, desc: 'Aumenta la velocidad de movimiento al cubrirse. (Futuro)' },
                { id: 'divine', name: 'Escudo Divino', icon: '⭐', unlocked: false, desc: 'Cura una pequeña porción de salud al bloquear. (Futuro)' },
                { id: 'bone', name: 'Escudo Óseo', icon: '💀', unlocked: false, desc: 'Invoca un escudo de hueso giratorio. (Futuro)' }
            ];

            shieldsList.forEach(item => {
                const slotEl = document.createElement('div');
                const isEquipped = (this.player.shield === item.id);
                const isUnlocked = item.unlocked;

                slotEl.className = 'inventory-slot';
                if (!isUnlocked) {
                    slotEl.classList.add('locked-slot');
                } else {
                    slotEl.classList.add('active-slot');
                    slotEl.classList.add('unlocked-slot');
                }
                if (isEquipped) {
                    slotEl.classList.add('equipped-highlight');
                }

                slotEl.innerHTML = `
                    <span class="slot-icon" style="${item.id === 'reinforced' ? 'filter: drop-shadow(0 0 3px #66ccff);' : ''}">${item.icon}</span>
                    <span class="slot-qty" style="background: ${isEquipped ? 'rgba(0, 255, 102, 0.85)' : (isUnlocked ? 'rgba(255, 215, 0, 0.85)' : 'rgba(0,0,0,0.8)')}; color: ${isEquipped ? '#fff' : (isUnlocked ? '#111' : '#888')};">${isEquipped ? 'USANDO' : (isUnlocked ? 'LISTO' : 'BLOQ')}</span>
                `;

                // Hover handlers para la descripción
                slotEl.addEventListener('mouseenter', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerHTML = `<strong style="color: var(--gold);">${item.name}</strong><br>${item.desc}`;
                    }
                });
                slotEl.addEventListener('mouseleave', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerText = 'Elige un escudo para equiparlo.';
                    }
                });

                // Click handler
                slotEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!isUnlocked) {
                        audio.playHit();
                        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "¡BLOQUEADO!", "#ff3333", 8);
                    } else if (!isEquipped) {
                        this.player.shield = item.id;
                        this.player.shieldProtectionBonus = 0;
                        this.player.updateUpgradedStats();
                        if (item.id === 'reinforced') {
                            audio.playBonfire(); // Sonido celestial
                            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "+5% REC. ST", "#66ccff", 9, true);
                        } else {
                            audio.playBlock();
                            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "ESCUDO DE ACERO", "#cccccc", 8);
                        }
                        this.updateInventoryUI();
                        this.populateSubgrid('shield'); // Refrescar subgrid
                        this.saveGame();
                    }
                });

                this.domSubgridGrid.appendChild(slotEl);
            });
        } else if (type === 'relic') {
            if (this.domSubgridTitle) this.domSubgridTitle.innerText = 'RELIQUIAS';
            if (this.domSubgridDesc) this.domSubgridDesc.innerText = 'Elige una reliquia activa. Solo una puede estar equipada.';

            const relicsList = [
                { id: 'wind_hook', desc: 'El gancho alcanza +70px. Origen: Juramento del primer pasillo.' },
                { id: 'ash_berry', desc: 'Las bayas curan 5% extra. Origen: Guardias de Ceniza del mundo 2-2.' },
                { id: 'storm_oath', desc: 'Primer cargado tras descansar: +16 daño de trueno. Después, tus golpes de espada ganan +8 daño mientras esté equipada.' },
                { id: 'moon', desc: 'Una vez por descanso, evita un golpe mortal y te deja con 1 HP. Origen: Carrera lunar del mundo 4-5.' },
                { id: 'root', name: 'Raíz Antigua', icon: '🌿', color: '#6be06b', unlocked: false, desc: 'Poder del bosque profundo. (Futuro)' },
                { id: 'crown', name: 'Corona Rota', icon: '👑', color: '#ffd700', unlocked: false, desc: 'Recuerdo de un rey derrotado. (Futuro)' }
            ].map(item => {
                const info = this.getRelicInfo(item.id);
                return {
                    ...item,
                    name: item.name || info.name,
                    icon: item.icon || info.icon,
                    color: item.color || info.color,
                    unlocked: item.unlocked ?? this.acquiredRelics.has(item.id),
                    desc: item.desc || info.description
                };
            });

            relicsList.forEach(item => {
                const slotEl = document.createElement('div');
                const isEquipped = this.equippedRelics.has(item.id);
                slotEl.className = 'inventory-slot';
                slotEl.classList.add(item.unlocked ? 'active-slot' : 'locked-slot');
                if (isEquipped) slotEl.classList.add('equipped-highlight');
                slotEl.innerHTML = `
                    <span class="slot-icon" style="filter: ${item.unlocked ? `drop-shadow(0 0 4px ${item.color})` : 'grayscale(1)'};">${item.icon}</span>
                    <span class="slot-qty" style="background: ${isEquipped ? 'rgba(0, 255, 102, 0.85)' : (item.unlocked ? 'rgba(255, 215, 0, 0.85)' : 'rgba(0,0,0,0.8)')}; color: ${isEquipped ? '#fff' : (item.unlocked ? '#111' : '#888')};">${isEquipped ? 'USANDO' : (item.unlocked ? 'LISTO' : 'BLOQ')}</span>
                `;

                slotEl.addEventListener('mouseenter', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerHTML = `<strong style="color: ${item.color};">${item.name}</strong><br>${item.desc}`;
                    }
                });
                slotEl.addEventListener('mouseleave', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerText = 'Elige una reliquia activa. Solo una puede estar equipada.';
                    }
                });
                slotEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!item.unlocked) {
                        audio.playHit();
                        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "¡BLOQUEADO!", "#ff3333", 8);
                        return;
                    }
                    this.equippedRelics.clear();
                    this.equippedRelics.add(item.id);
                    this.applyRelicEffects();
                    audio.playBonfire();
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, item.name.toUpperCase(), item.color, 8, true);
                    this.updateInventoryUI();
                    this.populateSubgrid('relic');
                    this.saveGame();
                });

                this.domSubgridGrid.appendChild(slotEl);
            });
        } else if (type === 'consumable') {
            if (this.domSubgridTitle) this.domSubgridTitle.innerText = 'CONSUMIBLES';
            if (this.domSubgridDesc) this.domSubgridDesc.innerText = 'Elige un consumible para usarlo.';

            const consumablesList = [
                { id: 'potion', name: 'Poción Menor', icon: '🧪', qty: this.player.potions, desc: 'Cura un 25% de vida. Tecla Q.', use: () => this.quickUsePotion() },
                { id: 'great_potion', name: 'Poción Mayor', icon: '🧪', qty: this.player.greatPotions, desc: 'Cura un 65% de vida. Tecla G.', use: () => this.quickUseGreatPotion(), style: 'filter: hue-rotate(240deg);' }
            ];

            if (this.player.berries > 0) {
                consumablesList.push({ id: 'berry', name: 'Bayas Rojas', icon: '🍓', qty: this.player.berries, desc: 'Cura un 10% de vida. Tecla H.', use: () => this.quickUseBerry() });
            }

            if (this.player.violetBerries > 0) {
                consumablesList.push({ id: 'violet_berry', name: 'Bayas Violetas', icon: '🫐', qty: this.player.violetBerries, desc: 'Cura un 15% de vida y recupera un 10% de estamina. Tecla H si no tienes bayas rojas.', use: () => this.quickUseVioletBerry() });
            }

            while (consumablesList.length < 6) {
                const emptyIndex = consumablesList.length - 1;
                consumablesList.push({ id: `empty${emptyIndex}`, name: 'Vacío', icon: '', qty: 0, desc: 'Espacio libre.' });
            }

            consumablesList.forEach(item => {
                const slotEl = document.createElement('div');
                const isUsable = item.qty > 0 && typeof item.use === 'function';
                slotEl.className = 'inventory-slot';
                slotEl.classList.add(isUsable ? 'active-slot' : 'empty-slot');
                slotEl.innerHTML = `
                    <span class="slot-icon" style="${item.style || ''}">${item.icon}</span>
                    <span class="slot-qty">${item.qty ? `x${item.qty}` : ''}</span>
                `;

                slotEl.addEventListener('mouseenter', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerHTML = `<strong style="color: var(--gold);">${item.name}</strong><br>${item.desc}`;
                    }
                });
                slotEl.addEventListener('mouseleave', () => {
                    if (this.domSubgridDesc) {
                        this.domSubgridDesc.innerText = 'Elige un consumible para usarlo.';
                    }
                });
                slotEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (isUsable) {
                        item.use();
                        this.populateSubgrid('consumable');
                    } else {
                        audio.playHit();
                    }
                });

                this.domSubgridGrid.appendChild(slotEl);
            });
        }
    }

    updateBossHud() {
        if (!this.boss) return;
        const nameLabel = document.getElementById('boss-name-label');
        if (nameLabel) {
            if (this.level === 5) {
                nameLabel.innerText = "EL REY ESQUELETO GIGANTE";
            } else if (this.level === 11) {
                nameLabel.innerText = "EL DEMONIO ÍGNEO";
            } else if (this.level === 18) {
                nameLabel.innerText = "EL DUENDE GIGANTE";
            } else if (this.level === 25) {
                nameLabel.innerText = "EL ÁNGEL CAÍDO DE LA TORMENTA";
            } else if (this.level === 34) {
                nameLabel.innerText = "TU PROPIO REFLEJO (DOPPELGÄNGER)";
            }
        }
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

    enterWorld4SecretRoom() {
        this.player.x = 4310;
        this.player.y = -500 - this.player.height;
        this.player.vx = 0;
        this.player.vy = 0;
        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 260));
        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 260));

        if (!this.world4MiniBossDefeated && !this.miniBosses.some(mb => mb instanceof SkySentinelMiniBoss && mb.active)) {
            this.miniBosses.push(new SkySentinelMiniBoss(5520, -500 - 76));
        }

        audio.playBonfire();
        particles.spawnCollectGlow(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#9ee8ff', 22);
        particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 28, "CÁMARA SECRETA", "#9ee8ff", 12, true);
    }

    revealWorld4SecretReturnDoor() {
        this.world4SecretReturnDoor = { x: 5685, y: -500 - 60, width: 46, height: 60, visible: true };
        const door = this.world4SecretReturnDoor;
        particles.spawnCollectGlow(door.x + door.width / 2, door.y + door.height / 2, '#ffd700', 28);
        particles.addFloatingText(door.x + door.width / 2, door.y - 18, "PUERTA DE REGRESO", "#ffd700", 11, true);
    }

    returnFromWorld4SecretRoom() {
        this.player.x = 2870;
        this.player.y = -170 - this.player.height;
        this.player.vx = 0;
        this.player.vy = 0;
        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 360));
        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 240));
        audio.playBonfire();
        particles.spawnCollectGlow(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ffd700', 20);
        particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 25, "MURALLAS 4-4", "#ffd700", 11, true);
    }

    revealWorld3StormPuzzle() {
        if (this.level !== 15 || !this.world3StormElevator) return;

        this.world3StormElevator.hidden = false;
        this.world3StormElevator.activate();
        this.world3StormElevator.y = this.world3StormElevator.startY;
        this.world3StormElevator.moving = false;
        this.world3StormElevator.reachedTop = false;
        this.world3StormElevator.lastDy = 0;

        this.world3StormSecretPlatforms?.forEach(platform => {
            platform.hidden = false;
        });

        if (this.world3StormLever) {
            this.world3StormLever.visible = true;
        }

        audio.playThunder();
        this.shakeTimer = 14;
        this.shakeIntensity = 2.5;
        particles.spawnCollectGlow(
            this.world3StormElevator.x + this.world3StormElevator.width / 2,
            this.world3StormElevator.y,
            '#5dff8a',
            24
        );
        particles.addFloatingText(
            this.world3StormElevator.x + this.world3StormElevator.width / 2,
            this.world3StormElevator.y - 22,
            'ASCENSOR REVELADO',
            '#5dff8a',
            10,
            true
        );
    }

    startWorld4MoonRace() {
        const race = this.world4MoonRace;
        if (!race || race.completed) return;

        race.active = true;
        race.failed = false;
        race.timer = 1080;
        if (this.world4MoonRacePlatform) this.world4MoonRacePlatform.hidden = false;
        if (race.finishButton) race.finishButton.visible = true;

        this.player.x = race.startX;
        this.player.y = race.startY;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.cameraX = 0;
        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 540 * 0.42));

        audio.playThunder();
        this.shakeTimer = 18;
        this.shakeIntensity = 3.2;
        particles.spawnCollectGlow(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#b8d7ff', 24);
        particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 30, 'EMPIEZA A CORRER', '#b8d7ff', 13, true);
        if (!this.equippedRelics.has('wind_hook')) {
            particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 52, 'EQUIPA LA RELIQUIA DEL VIENTO', '#9ee8ff', 7, true);
        }
    }

    failWorld4MoonRace() {
        const race = this.world4MoonRace;
        if (!race || !race.active) return;

        race.active = false;
        race.failed = true;
        race.timer = 1080;
        if (this.world4MoonRacePlatform) this.world4MoonRacePlatform.hidden = true;
        if (race.finishButton) race.finishButton.visible = false;
        audio.playHit();
        particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 28, 'RETO FALLIDO', '#ff3333', 11, true);
        particles.addFloatingText(race.x + race.width / 2, race.y - 18, 'Pulsa E para reiniciar', '#ffd700', 7, false);
    }

    completeWorld4MoonRace() {
        const race = this.world4MoonRace;
        if (!race || !race.active) return;

        race.active = false;
        race.failed = false;
        race.completed = true;
        this.completedChallenges.add(race.id);
        if (this.world4MoonRaceChest) {
            this.world4MoonRaceChest.hidden = false;
            this.world4MoonRaceChest.unlocked = true;
            particles.spawnCollectGlow(this.world4MoonRaceChest.x + this.world4MoonRaceChest.width / 2, this.world4MoonRaceChest.y + this.world4MoonRaceChest.height / 2, '#b8d7ff', 26);
            particles.addFloatingText(this.world4MoonRaceChest.x + this.world4MoonRaceChest.width / 2, this.world4MoonRaceChest.y - 18, 'COFRE LUNAR', '#b8d7ff', 10, true);
        }
        audio.playBonfire();
        particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 30, 'CARRERA LUNAR SUPERADA', '#b8d7ff', 10, true);
        this.saveGame();
    }

    updateWorld4MoonRace() {
        const race = this.world4MoonRace;
        if (!race?.active) return;

        race.timer--;
        if (race.timer <= 0) {
            this.failWorld4MoonRace();
            return;
        }

        if (race.timer % 60 === 0) {
            particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 34, `${Math.ceil(race.timer / 60)}`, '#b8d7ff', 10, true);
        }
    }

    drawWorld4MoonRace() {
        const race = this.world4MoonRace;
        if (!race) return;

        const ctx = this.ctx;
        ctx.save();

        if (!race.completed) {
            ctx.fillStyle = race.failed ? '#2a1010' : (race.active ? '#132233' : '#161822');
            ctx.fillRect(race.x, race.y, race.width, race.height);
            ctx.strokeStyle = race.active ? '#b8d7ff' : (race.failed ? '#ff3333' : '#8aa0b8');
            ctx.lineWidth = 3;
            ctx.strokeRect(race.x, race.y, race.width, race.height);
            ctx.fillStyle = race.active ? '#b8d7ff' : '#d9b36a';
            ctx.font = "16px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('☾', race.x + race.width / 2, race.y + 38);
        }

        if (race.finishButton?.visible) {
            const button = race.finishButton;
            ctx.fillStyle = '#101826';
            ctx.fillRect(button.x, button.y + 20, button.width, 12);
            ctx.strokeStyle = race.completed ? '#ffd700' : '#b8d7ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(button.x, button.y + 20, button.width, 12);
            ctx.fillStyle = race.completed ? '#ffd700' : '#b8d7ff';
            ctx.beginPath();
            ctx.arc(button.x + button.width / 2, button.y + 12, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#101826';
            ctx.font = "8px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('E', button.x + button.width / 2, button.y + 15);
        }

        if (race.active) {
            ctx.fillStyle = 'rgba(10, 14, 25, 0.64)';
            ctx.fillRect(this.cameraX + 334, this.cameraY + 18, 292, 34);
            ctx.strokeStyle = '#b8d7ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.cameraX + 334, this.cameraY + 18, 292, 34);
            ctx.fillStyle = '#b8d7ff';
            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText(`CARRERA LUNAR ${Math.ceil(race.timer / 60)}s`, this.cameraX + 480, this.cameraY + 41);
        }

        ctx.restore();
    }

    // ==========================================================================
    // TIENDA Y DESCANSO EN LA HOGUERA
    // ==========================================================================
    handleInteraction() {
        if (this.state !== 'playing') return;

        if (this.activeLoreNote) {
            this.activeLoreNote = null;
            audio.playBonfire();
            return;
        }

        if (this.level === 15 && this.world3StormLever?.visible && !this.world3StormLever.activated) {
            const lever = this.world3StormLever;
            const distX = Math.abs((this.player.x + this.player.width / 2) - (lever.x + lever.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (lever.y + lever.height / 2));
            if (distX < 65 && distY < 70) {
                lever.activated = true;
                this.unlockedStormRelicPuzzle = true;
                if (this.world3StormChest) {
                    this.world3StormChest.unlocked = true;
                    this.world3StormChest.hidden = false;
                }
                audio.playThunder();
                this.shakeTimer = 20;
                this.shakeIntensity = 3.5;
                particles.spawnCollectGlow(lever.x + lever.width / 2, lever.y + lever.height / 2, '#d9f6ff', 18);
                particles.addFloatingText(lever.x + lever.width / 2, lever.y - 18, 'COFRE DEL TRUENO REVELADO', '#d9f6ff', 10, true);
                if (this.world3StormChest) {
                    particles.spawnCollectGlow(this.world3StormChest.x + this.world3StormChest.width / 2, this.world3StormChest.y + this.world3StormChest.height / 2, '#9ee8ff', 24);
                    particles.addFloatingText(this.world3StormChest.x + this.world3StormChest.width / 2, this.world3StormChest.y - 18, 'RELIQUIA', '#9ee8ff', 10, true);
                }
                this.saveGame();
                return;
            }
        }

        // Interacción con la palanca de transición del Mundo 4 al 5 (Nivel 26)
        if (this.level === 26 && this.world5TransitionLever && !this.world5TransitionLever.activated) {
            const lever = this.world5TransitionLever;
            const distX = Math.abs((this.player.x + this.player.width/2) - (lever.x + lever.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (lever.y + lever.height/2));
            if (distX < 60 && distY < 60) {
                lever.activated = true;
                if (this.world5TransitionElevator) {
                    this.world5TransitionElevator.moving = true;
                }

                audio.playCrateBreak(); // Sonido metálico
                audio.playThunder();     // Estruendo sordo
                this.shakeTimer = 40;
                this.shakeIntensity = 3.5;

                particles.addFloatingText(lever.x + 12, lever.y - 15, "CLANK!", "#ff5500", 11, true);
                particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡ELEVADOR ACTIVADO!", "#9ee8ff", 12, true);

                return; // Interacción completada
            }
        }

        // 0. Proximidad a la palanca del Mundo 4
        if (this.level === 22 && this.world4Lever && !this.world4Lever.activated) {
            const lever = this.world4Lever;
            const distX = Math.abs((this.player.x + this.player.width/2) - (lever.x + lever.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (lever.y + lever.height/2));
            if (distX < 60 && distY < 60) {
                lever.activated = true;

                // Revelar la puerta secreta hacia la cámara oscura.
                if (this.world4SecretGate) {
                    this.world4SecretGate.opened = true;
                    this.world4SecretGate.visible = true;
                }

                // Sonidos y retroalimentación premium
                audio.playCrateBreak(); // Sonido metálico/crujido
                audio.playThunder();     // Sonido retumbante/terremoto

                this.shakeTimer = 35;
                this.shakeIntensity = 4.0;

                // Spawnear partículas en la puerta revelada para mayor impacto visual
                if (this.world4SecretGate) {
                    const gate = this.world4SecretGate;
                    for (let p = 0; p < 15; p++) {
                        particles.spawnFire(gate.x + Math.random()*gate.width, gate.y + Math.random()*gate.height, 1.2);
                        particles.spawnCollectGlow(gate.x + Math.random()*gate.width, gate.y + Math.random()*gate.height, '#00ffff', 2);
                    }
                }

                particles.addFloatingText(lever.x + 12, lever.y - 15, "CLANK!", "#ff5500", 11, true);
                particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "¡PUERTA SECRETA REVELADA!", "#9ee8ff", 12, true);

                return; // Interacción completada
            }
        }

        // 0b. Puertas secretas del Mundo 4-4
        if (this.level === 22 && this.world4SecretGate?.visible) {
            const door = this.world4SecretGate;
            const distX = Math.abs((this.player.x + this.player.width/2) - (door.x + door.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (door.y + door.height/2));
            if (distX < 70 && distY < 90) {
                this.enterWorld4SecretRoom();
                return;
            }
        }

        if (this.level === 22 && this.world4SecretReturnDoor?.visible) {
            const door = this.world4SecretReturnDoor;
            const distX = Math.abs((this.player.x + this.player.width/2) - (door.x + door.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (door.y + door.height/2));
            if (distX < 70 && distY < 90) {
                this.returnFromWorld4SecretRoom();
                return;
            }
        }

        if (this.spectralPortals && this.spectralPortals.length > 0) {
            for (const portal of this.spectralPortals) {
                const distX = Math.abs((this.player.x + this.player.width / 2) - (portal.x + portal.width / 2));
                const distY = Math.abs((this.player.y + this.player.height / 2) - (portal.y + portal.height / 2));
                if (distX < 74 && distY < 92) {
                    if (portal.teleport(this.player)) {
                        const destPortal = this.spectralPortals.find(p => p.x === portal.targetX && p.y === portal.targetY);
                        if (destPortal) destPortal.cooldown = 45;
                        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 960 * 0.35));
                        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 540 * 0.42));
                    }
                    return;
                }
            }
        }

        for (const tablet of this.loreTablets) {
            const distX = Math.abs((this.player.x + this.player.width / 2) - (tablet.x + tablet.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (tablet.y + tablet.height / 2));
            if (distX < 70 && distY < 80) {
                if (tablet.secretType === 'storm_puzzle') {
                    this.revealWorld3StormPuzzle();
                }
                this.showLoreNote(tablet);
                return;
            }
        }

        for (const door of this.treasureDoors) {
            if (door.opened) continue;
            const distX = Math.abs((this.player.x + this.player.width / 2) - (door.x + door.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (door.y + door.height / 2));
            if (distX < 72 && distY < 88) {
                if (door.unlocked) {
                    door.open(this);
                    this.markTreasureDoorOpened(door);
                    this.saveGame();
                } else {
                    particles.addFloatingText(door.x + door.width / 2, door.y - 18, "FALTA ROMPER EL CRISTAL", "#9ee8ff", 9, true);
                }
                return;
            }
        }

        for (const relic of this.relicPedestals) {
            if (relic.collected) continue;
            const distX = Math.abs((this.player.x + this.player.width / 2) - (relic.x + relic.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (relic.y + relic.height / 2));
            if (distX < 70 && distY < 85) {
                relic.collected = true;
                this.awardRelic(relic.id, relic.x + relic.width / 2, relic.y);
                return;
            }
        }

        if (this.level === 23 && this.world4MoonRace) {
            const race = this.world4MoonRace;
            const playerCX = this.player.x + this.player.width / 2;
            const playerCY = this.player.y + this.player.height / 2;

            if (race.active && race.finishButton?.visible) {
                const button = race.finishButton;
                const distX = Math.abs(playerCX - (button.x + button.width / 2));
                const distY = Math.abs(playerCY - (button.y + button.height / 2));
                if (distX < 70 && distY < 85) {
                    this.completeWorld4MoonRace();
                    return;
                }
            }

            if (!race.completed && !race.active) {
                const distX = Math.abs(playerCX - (race.x + race.width / 2));
                const distY = Math.abs(playerCY - (race.y + race.height / 2));
                if (distX < 82 && distY < 100) {
                    this.startWorld4MoonRace();
                    return;
                }
            }
        }

        for (const door of this.challengeDoors) {
            if (door.opened) continue;
            const distX = Math.abs((this.player.x + this.player.width / 2) - (door.x + door.width / 2));
            const distY = Math.abs((this.player.y + this.player.height / 2) - (door.y + door.height / 2));
            if (distX < 82 && distY < 100) {
                if (door.failed) {
                    door.reset(this);
                    door.start(this);
                } else if (door.completed) {
                    door.open(this);
                } else if (!door.started) {
                    door.start(this);
                }
                return;
            }
        }

        // 1. Proximidad a los Cofres
        if (this.chests) {
            for (let i = 0; i < this.chests.length; i++) {
                const chest = this.chests[i];
                if (chest.hidden) continue;
                if (!chest.opened) {
                    const distX = Math.abs((this.player.x + this.player.width/2) - (chest.x + chest.width/2));
                    const distY = Math.abs(this.player.y - chest.y);
                    if (distX < 75 && distY < 60) {
                        if (chest.requiresChallenge && !this.completedChallenges.has(chest.requiresChallenge)) {
                            particles.addFloatingText(chest.x + chest.width / 2, chest.y - 15, "SUPERA EL RETO DEL TRONO", "#ffd700", 9, true);
                            audio.playHit();
                            return;
                        }
                        if (chest.requiresStormPuzzle && !chest.unlocked) {
                            particles.addFloatingText(chest.x + chest.width / 2, chest.y - 15, "FALTA LA PALANCA DEL TRUENO", "#d9f6ff", 9, true);
                            audio.playHit();
                            return;
                        }
                        if (chest.contentType === 'storm_relic') {
                            chest.opened = true;
                            this.markChestOpened(chest);
                            audio.playBonfire();
                            particles.spawnSparks(chest.x + chest.width / 2, chest.y + chest.height / 2, 15, 0);
                            this.awardRelic('storm_oath', chest.x + chest.width / 2, chest.y - 15);
                            particles.addFloatingText(chest.x + chest.width / 2, chest.y - 32, "OPEN!", "#ffd700", 11, true);
                            this.updateHud();
                            this.saveGame();
                            return;
                        }
                        if (chest.contentType === 'moon_relic') {
                            chest.opened = true;
                            this.markChestOpened(chest);
                            audio.playBonfire();
                            particles.spawnSparks(chest.x + chest.width / 2, chest.y + chest.height / 2, 15, 0);
                            this.awardRelic('moon', chest.x + chest.width / 2, chest.y - 15);
                            particles.addFloatingText(chest.x + chest.width / 2, chest.y - 32, "OPEN!", "#b8d7ff", 11, true);
                            this.updateHud();
                            this.saveGame();
                            return;
                        }
                        if (chest.contentType === 'false_shield') {
                            chest.opened = true;
                            this.markChestOpened(chest);
                            audio.playPortal();
                            audio.playThunder();
                            particles.spawnSparks(chest.x + chest.width / 2, chest.y + chest.height / 2, 18, 0);
                            particles.spawnCollectGlow(chest.x + chest.width / 2, chest.y + chest.height / 2, '#b642f5', 24);
                            particles.addFloatingText(chest.x + chest.width / 2, chest.y - 22, "COFRE FALSO", "#b642f5", 11, true);
                            this.player.x = 3220;
                            this.player.y = this.floorY - 80 - this.player.height;
                            this.player.vx = 0;
                            this.player.vy = 0;
                            this.player.isGrounded = true;
                            this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 960 * 0.35));
                            this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 540 * 0.42));
                            particles.spawnCollectGlow(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#8f34d1', 26);
                            particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 30, "CÁMARA DEL ESCUDO", "#9ee8ff", 11, true);
                            this.updateHud();
                            this.saveGame();
                            return;
                        }
                        const items = chest.open();
                        if (items) {
                            this.markChestOpened(chest);
                            if (chest.contentType === 'shield') {
                                this.awardReinforcedShield(chest.x + chest.width/2, chest.y - 15);
                            } else {
                                items.forEach(item => this.lootItems.push(this.stabilizeKeyLoot(this.normalizeHealthLoot(item), chest)));
                            }
                            this.applyChestEvent(chest);
                            particles.addFloatingText(chest.x + chest.width/2, chest.y - 15, "OPEN!", "#ffd700", 11, true);
                        }
                        this.updateHud();
                        this.saveGame();
                        return; // Interacción completada
                    }
                }
            }
        }

        // 2. Proximidad al Portal/Puerta Secreta (Nivel 3)
        if (this.level === 3 && this.secretDoor) {
            const distX = Math.abs((this.player.x + this.player.width/2) - (this.secretDoor.x + this.secretDoor.width/2));
            if (distX < 75) {
                // Ir al Nivel 4 (Cripta Secreta)
                this.enterLevelAtStart(4);
                this.saveGame();
                audio.playBonfire();
                particles.addFloatingText(this.player.x, this.player.y - 20, "CRIPTA SECRETA", "#ffd700", 12, true);
                return;
            }
        }

        // 2b. Proximidad a puertas secretas en Nivel 8
        if (this.level === 8) {
            if (this.shieldSecretDoor) {
                const distX = Math.abs((this.player.x + this.player.width/2) - (this.shieldSecretDoor.x + this.shieldSecretDoor.width/2));
                const distY = Math.abs((this.player.y + this.player.height/2) - (this.shieldSecretDoor.y + this.shieldSecretDoor.height/2));
                if (distX < 60 && distY < 80) {
                    this.player.x = 4100;
                    this.player.y = this.floorY - this.player.height;
                    this.player.vy = 0;
                    audio.playBonfire(); // Sonido místico
                    particles.addFloatingText(this.player.x, this.player.y - 20, "HABITACIÓN SECRETA", "#ffd700", 12, true);
                    return;
                }
            }
            if (this.shieldReturnDoor) {
                const distX = Math.abs((this.player.x + this.player.width/2) - (this.shieldReturnDoor.x + this.shieldReturnDoor.width/2));
                const distY = Math.abs((this.player.y + this.player.height/2) - (this.shieldReturnDoor.y + this.shieldReturnDoor.height/2));
                if (distX < 60 && distY < 80) {
                    this.player.x = 2210;
                    this.player.y = -440 - this.player.height; // teletransportar justo al lado de la puerta en la plataforma alta
                    this.player.vy = 0;
                    audio.playBonfire();
                    particles.addFloatingText(this.player.x, this.player.y - 20, "MAPA PRINCIPAL", "#ffd700", 12, true);
                    return;
                }
            }
        }

        // 3. Proximidad a puerta de salida (cualquier nivel con exitDoor)
        if (this.exitDoor) {
            const distX = Math.abs((this.player.x + this.player.width/2) - (this.exitDoor.x + this.exitDoor.width/2));
            const distY = Math.abs((this.player.y + this.player.height/2) - (this.exitDoor.y + this.exitDoor.height/2));
            if (distX < 80 && distY < 95) {
                this.enterExitDoor();
                return;
            }
        }

        // 3b. Recolección manual interactiva de pociones o bayas en el suelo (Petición del usuario)
        for (let i = 0; i < this.lootItems.length; i++) {
            const item = this.normalizeHealthLoot(this.lootItems[i]);
            if (item.type === 'heart' || item.type === 'great_heart' || item.type === 'berry' || item.type === 'violet_berry') {
                const distX = Math.abs((this.player.x + this.player.width/2) - (item.x + item.width/2));
                const distY = Math.abs((this.player.y + this.player.height/2) - (item.y + item.height/2));
                if (distX < 55 && distY < 55) {
                    this.collectConsumableToInventory(item);
                    item.life = 0; // Marcar como recogido
                    return; // Interacción completada
                }
            }
        }

        // 4. Proximidad a la Hoguera
        if (this.bonfire) {
            const playerCX = this.player.x + this.player.width / 2;
            const playerCY = this.player.y + this.player.height / 2;
            const bonfireCX = this.bonfire.x + this.bonfire.width / 2;
            const bonfireCY = this.bonfire.y + this.bonfire.height / 2;
            const distToHoguera = Math.sqrt(
                Math.pow(playerCX - bonfireCX, 2) +
                Math.pow(playerCY - bonfireCY, 2)
            );
            if (distToHoguera < 90) {
                this.isShopOpen = !this.isShopOpen;

                if (this.isShopOpen) {
                    this.domBonfireScreen.classList.remove('hidden');
                    this.updateShopDetails();
                    audio.stopMusic();
                } else {
                    this.closeBonfireShop();
                }
            }
        }
    }

    enterExitDoor() {
        this.checkLevelMedals(this.level);

        if (this.level === 4) {
            // Ir a la cámara del Jefe 1 (Nivel 5)
            this.enterLevelAtStart(5);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, "CÁMARA DEL REY ESQUELETO", "#ffd700", 12, true);
        } else if (this.level === 5) {
            // Transicionar al Mundo 2
            this.state = 'world_transition';
            this.saveGame();
            audio.stopMusic();
            audio.playWin();
            if (this.domWorldTransition) {
                const title = document.getElementById('wt-title');
                const sub = document.getElementById('wt-subtitle');
                const desc = document.getElementById('wt-description');
                if (title) {
                    title.innerText = "¡MUNDO 1 COMPLETADO!";
                    title.style.color = "#ffd700";
                    title.style.textShadow = "0 0 15px rgba(255, 215, 0, 0.6), 4px 4px 0px #000";
                }
                if (sub) {
                    sub.innerText = "HAS SUPERADO EL NIVEL 1-5";
                    sub.style.color = "#ff3333";
                }
                if (desc) {
                    desc.innerHTML = 'Prepárate para el nivel 2-1...<br><span style="color: #ff6600;">Las Catacumbas de Lava</span> te esperan con peligros mayores.';
                }
                this.domWorldTransition.classList.remove('hidden');
            }
        } else if (this.level >= 6 && this.level <= 10) {
            // Avanzar al siguiente nivel del Mundo 2
            this.enterLevelAtStart(this.level + 1);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, `MUNDO 2-${this.level - 5}`, "#ff6600", 12, true);
        } else if (this.level === 11) {
            // Transicionar al Mundo 3
            this.state = 'world_transition';
            this.saveGame();
            audio.stopMusic();
            audio.playWin();
            if (this.domWorldTransition) {
                const title = document.getElementById('wt-title');
                const sub = document.getElementById('wt-subtitle');
                const desc = document.getElementById('wt-description');
                if (title) {
                    title.innerText = "¡MUNDO 2 COMPLETADO!";
                    title.style.color = "#ff6600";
                    title.style.textShadow = "0 0 15px rgba(255, 102, 0, 0.6), 4px 4px 0px #000";
                }
                if (sub) {
                    sub.innerText = "HAS SUPERADO EL NIVEL 2-6";
                    sub.style.color = "#ff3333";
                }
                if (desc) {
                    desc.innerHTML = 'Prepárate para el nivel 3-1...<br><span style="color: #00ff66;">El Bosque Goblínico</span> te espera con nuevas y místicas criaturas.';
                }
                this.domWorldTransition.classList.remove('hidden');
            }
        } else if (this.level === 18) {
            // Transicionar al Mundo 4
            this.state = 'world_transition';
            this.saveGame();
            audio.stopMusic();
            audio.playWin();
            if (this.domWorldTransition) {
                const title = document.getElementById('wt-title');
                const sub = document.getElementById('wt-subtitle');
                const desc = document.getElementById('wt-description');
                if (title) {
                    title.innerText = "¡MUNDO 3 COMPLETADO!";
                    title.style.color = "#9ee8ff";
                    title.style.textShadow = "0 0 15px rgba(158, 232, 255, 0.7), 4px 4px 0px #000";
                }
                if (sub) {
                    sub.innerText = "HAS SUPERADO EL NIVEL 3-7";
                    sub.style.color = "#d9f6ff";
                }
                if (desc) {
                    desc.innerHTML = 'Prepárate para el nivel 4-1...<br><span style="color: #9ee8ff;">La Fortaleza Celestial en Ruinas</span> flota sobre la tormenta.';
                }
                this.domWorldTransition.classList.remove('hidden');
            }
        } else if (this.level === 16) {
            if (!this.forestDoorUnlocked) {
                if (this.player.hasForestKey) {
                    this.forestDoorUnlocked = true;
                    this.player.hasForestKey = false; // Consume la llave
                    audio.playBonfire(); // Sonido retro de éxito
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "🔓 ¡CERRADURA ABIERTA!", "#00ff66", 14, true);
                    this.updateInventoryUI(); // Retirar la llave del inventario visual
                    this.saveGame();

                    // Transición inmediata al Nivel 17
                    setTimeout(() => {
                        this.enterLevelAtStart(17);
                        this.saveGame();
                        audio.playBonfire();
                        particles.addFloatingText(this.player.x, this.player.y - 20, `MUNDO 3-6`, "#00ff66", 12, true);
                    }, 500);
                } else {
                    // Empujar físicamente hacia atrás
                    this.player.x -= 25; // Prevenir triggers infinitos por colisión estática
                    this.player.vx = -3.5;
                    audio.playHit();
                    particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "🚪 REQUIERE LLAVE DEL NIVEL 3-3", "#ff3333", 11, true);
                }
            } else {
                // Si ya está abierta la cerradura
                this.enterLevelAtStart(17);
                this.saveGame();
                audio.playBonfire();
                particles.addFloatingText(this.player.x, this.player.y - 20, `MUNDO 3-6`, "#00ff66", 12, true);
            }
        } else if (this.level >= 12 && this.level <= 17) {
            // Avanzar al siguiente nivel del Mundo 3 para niveles comunes
            this.enterLevelAtStart(this.level + 1);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, `MUNDO 3-${this.level - 11}`, "#00ff66", 12, true);
        } else if (this.level >= 19 && this.level <= 24) {
            // Avanzar al siguiente nivel del Mundo 4
            this.enterLevelAtStart(this.level + 1);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, `MUNDO 4-${this.level - 18}`, "#9ee8ff", 12, true);
        } else if (this.level === 25) {
            // Ir al Nivel 26 (Mundo 4-Transition: La Recámara del Ascensor)
            this.enterLevelAtStart(26);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, "DESCIENDE AL VACÍO...", "#9ee8ff", 12, true);
        } else if (this.level === 26) {
            // Ir al Nivel 27 (Mundo 5-1: Umbral del Vacío)
            this.enterLevelAtStart(27);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, "MUNDO 5-1", "#b642f5", 12, true);
        } else if (this.level === 30 && !this.player.hasVoidKey) {
            this.player.x -= this.player.facing * 26;
            this.player.vx = -this.player.facing * 3.2;
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width / 2, this.player.y - 30, "FALTA LA LLAVE DEL VACÍO", "#b642f5", 10, true);
        } else if (this.level >= 27 && this.level <= 33) {
            // Avanzar al siguiente nivel del Mundo 5
            this.enterLevelAtStart(this.level + 1);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, `MUNDO 5-${this.level - 26}`, "#b642f5", 12, true);
        } else if (this.level >= 35 && this.level <= 43) {
            // Avanzar al siguiente nivel del Mundo 6
            this.enterLevelAtStart(this.level + 1);
            this.saveGame();
            audio.playBonfire();
            particles.addFloatingText(this.player.x, this.player.y - 20, `MUNDO 6-${this.level - 34}`, "#ffffff", 12, true);
        }
    }

    awardReinforcedShield(x, y) {
        if (!this.player || this.player.hasReinforcedShield) return;

        this.player.hasReinforcedShield = true;
        // Se requiere equipar manualmente en el bulto/inventario (no se auto-equipa al recoger)
        particles.spawnCollectGlow(x, y, '#66ccff', 18);
        particles.addFloatingText(x, y - 15, "¡ESCUDO REFORZADO ENCONTRADO!", "#66ccff", 13, true);
        audio.playBonfire();
        this.updateInventoryUI();
        this.saveGame();
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
        if (this.shopStamina) this.shopStamina.innerText = `${Math.ceil(this.player.stamina)} / ${this.player.maxStamina}`;

        // Contadores de Almas
        if (this.shopRedCoins) this.shopRedCoins.innerText = this.player.redCoins.toString();
        if (this.shopGreenCoins) this.shopGreenCoins.innerText = this.player.greenCoins.toString();
        if (this.shopGreyCoins) this.shopGreyCoins.innerText = this.player.greyCoins.toString();

        // Actualizar textos de los botones de mejoras
        if (this.btnUpgradeHp) {
            if (this.player.hpLevel >= 5) {
                this.btnUpgradeHp.innerHTML = `❤️ VIDA AL MÁXIMO (NIV. 5) <span>MÁX</span>`;
                this.btnUpgradeHp.style.opacity = '0.5';
            } else {
                this.btnUpgradeHp.innerHTML = `❤️ MEJORAR VIDA (NIV. ${this.player.hpLevel} ➔ ${this.player.hpLevel + 1}) <span>1 🔴</span>`;
                this.btnUpgradeHp.style.opacity = this.player.redCoins >= 1 ? '1.0' : '0.5';
            }
        }

        if (this.btnUpgradeStamina) {
            if (this.player.staminaLevel >= 5) {
                this.btnUpgradeStamina.innerHTML = `💚 ESTAMINA AL MÁXIMO (NIV. 5) <span>MÁX</span>`;
                this.btnUpgradeStamina.style.opacity = '0.5';
            } else {
                this.btnUpgradeStamina.innerHTML = `💚 MEJORAR ESTAMINA (NIV. ${this.player.staminaLevel} ➔ ${this.player.staminaLevel + 1}) <span>1 🟢</span>`;
                this.btnUpgradeStamina.style.opacity = this.player.greenCoins >= 1 ? '1.0' : '0.5';
            }
        }

        if (this.btnUpgradeDamage) {
            if (this.player.damageLevel >= 5) {
                this.btnUpgradeDamage.innerHTML = `🗡️ DAÑO AL MÁXIMO (NIV. 5) <span>MÁX</span>`;
                this.btnUpgradeDamage.style.opacity = '0.5';
            } else {
                this.btnUpgradeDamage.innerHTML = `🗡️ MEJORAR DAÑO (NIV. ${this.player.damageLevel} ➔ ${this.player.damageLevel + 1}) <span>1 ⚪</span>`;
                this.btnUpgradeDamage.style.opacity = this.player.greyCoins >= 1 ? '1.0' : '0.5';
            }
        }

        if (this.btnUpgradePotion) {
            if (this.player.potionLevel >= 2) {
                this.btnUpgradePotion.innerHTML = `🧪 POCIÓN AL MÁXIMO (NIV. 2) <span>MÁX</span>`;
                this.btnUpgradePotion.style.opacity = '0.5';
            } else {
                this.btnUpgradePotion.innerHTML = `🧪 MEJORAR POCIÓN (NIV. ${this.player.potionLevel} ➔ ${this.player.potionLevel + 1}) <span>1 🏺</span>`;
                this.btnUpgradePotion.style.opacity = this.player.flasks >= 1 ? '1.0' : '0.5';
            }
        }

        if (this.btnShopBuy) {
            const maxPotions = this.getMaxMinorPotions();
            this.player.maxPotions = maxPotions;
            this.btnShopBuy.disabled = this.player.potions >= maxPotions;
            if (this.player.potions >= maxPotions) {
                this.btnShopBuy.innerHTML = `🧪 POCIÓN DE VIDA <span>${this.player.potions}/${maxPotions}</span>`;
                this.btnShopBuy.style.opacity = '0.45';
            } else {
                this.btnShopBuy.innerHTML = `🧪 POCIÓN DE VIDA (10 🪙) <span>${this.player.potions}/${maxPotions}</span>`;
                this.btnShopBuy.style.opacity = this.player.coins >= 10 ? '1.0' : '0.5';
            }
        }

        if (this.btnShopBuyGreat) {
            this.btnShopBuyGreat.style.display = '';
            this.btnShopBuyGreat.disabled = this.greatPotionShopPurchased;
            if (this.greatPotionShopPurchased) {
                this.btnShopBuyGreat.innerHTML = '🧪 POCIÓN MAYOR AGOTADA <span>1/1</span>';
                this.btnShopBuyGreat.style.opacity = '0.45';
            } else {
                this.btnShopBuyGreat.innerHTML = '🧪 POCIÓN MAYOR (50 🪙) <span>1 DISPONIBLE</span>';
                this.btnShopBuyGreat.style.opacity = this.player.coins >= 50 ? '1.0' : '0.5';
            }
        }
    }

    getMaxMinorPotions() {
        return this.world5BossDefeated ? 5 : 3;
    }

    upgradeStat(statType) {
        if (this.player.hp <= 0) return;

        let currentLevel = 0;
        let walletCoins = 0;
        let coinProperty = "";
        let textLabel = "";
        let colorTheme = "";
        let maxAllowedLevel = 5;

        if (statType === 'hp') {
            currentLevel = this.player.hpLevel;
            walletCoins = this.player.redCoins;
            coinProperty = "redCoins";
            textLabel = "+1 NIV. VIDA";
            colorTheme = "#ff3333";
        } else if (statType === 'stamina') {
            currentLevel = this.player.staminaLevel;
            walletCoins = this.player.greenCoins;
            coinProperty = "greenCoins";
            textLabel = "+1 NIV. ESTAMINA";
            colorTheme = "#00ff66";
        } else if (statType === 'damage') {
            currentLevel = this.player.damageLevel;
            walletCoins = this.player.greyCoins;
            coinProperty = "greyCoins";
            textLabel = "+1 NIV. DAÑO";
            colorTheme = "#b0b0b0";
        } else if (statType === 'potion') {
            currentLevel = this.player.potionLevel;
            walletCoins = this.player.flasks;
            coinProperty = "flasks";
            textLabel = "EFECTO POCIÓN AL 35%!";
            colorTheme = "#00ffff";
            maxAllowedLevel = 2;
        }

        // 1. Validar Nivel Máximo
        if (currentLevel >= maxAllowedLevel) {
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "¡MÁXIMO NIVEL!", "#ff3333", 11, true);
            return;
        }

        // 2. Validar Monedas Especiales / Frascos
        if (walletCoins < 1) {
            audio.playHit();
            const errorMsg = statType === 'potion' ? "¡FRASCO REQUERIDO!" : "¡ALMAS INSUFICIENTES!";
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, errorMsg, "#ff3333", 11, true);
            return;
        }

        // 3. Aplicar compra
        this.player[coinProperty]--;
        if (statType === 'hp') {
            this.player.hpLevel++;
        } else if (statType === 'stamina') {
            this.player.staminaLevel++;
        } else if (statType === 'damage') {
            this.player.damageLevel++;
        } else if (statType === 'potion') {
            this.player.potionLevel++;
        }

        this.player.updateUpgradedStats();

        // Efectos retro
        audio.playBonfire();
        particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, colorTheme, 20);
        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, textLabel, colorTheme, 12, true);

        this.updateHud();
        this.updateShopDetails();
        this.saveGame();
    }

    restAtBonfire() {
        if (this.player.hp <= 0) return;

        // Descanso cura 100% vida y estamina gratis
        this.player.hp = this.player.maxHp;
        this.player.stamina = this.player.maxStamina;
        if (this.equippedRelics.has('storm_oath')) {
            this.player.thunderRelicReady = true;
        }
        if (this.equippedRelics.has('moon')) {
            this.player.lunarGraceReady = true;
        }
        this.player.stormRelicJustTriggered = false;

        // Reaparecer todos los enemigos, trampas, plataformas y cajas llamando a initLevel para el nivel actual
        this.initLevel(this.level);

        this.lootItems = []; // Limpiar monedas sueltas antiguas

        audio.playBonfire(); // Sonido de hoguera
        particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff6600', 20);

        // Mostrar texto flotante del reset del mundo
        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "MUNDO REINICIADO", "#ff6600", 11, true);

        this.updateHud();
        this.updateShopDetails();
        this.saveGame();
    }

    buyPotionFromShop() {
        if (this.player.hp <= 0) return;

        const maxPotions = this.getMaxMinorPotions();
        this.player.maxPotions = maxPotions;

        // Validar si ya tiene el máximo de pociones permitido
        if (this.player.potions >= maxPotions) {
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, `¡MÁXIMO ${maxPotions} POCIONES!`, "#ff3333", 11, true);
            return;
        }

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
        this.saveGame();
    }

    buyGreatPotionFromShop() {
        if (this.player.hp <= 0) return;

        if (this.greatPotionShopPurchased) {
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "¡SOLO UNA POCIÓN MAYOR!", "#aa55ff", 10, true);
            return;
        }

        // Validar si tiene suficientes monedas (Cuesta 50 monedas)
        const greatPotionCost = 50;
        if (this.player.coins < greatPotionCost) {
            // No tiene monedas suficientes: reproducir sonido sordo
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "NO COINS!", "#ffd700", 11, true);
            return;
        }

        // Realizar compra (se añade al bulto)
        this.player.coins -= greatPotionCost;
        this.player.greatPotions++;
        this.greatPotionShopPurchased = true;

        audio.playBonfire(); // Sonido mágico
        particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#aa55ff', 15);
        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "+1 POCIÓN MAYOR", "#aa55ff", 11, true);

        this.updateHud();
        this.updateShopDetails();
        this.saveGame();
    }

    toggleInventory() {
        if (this.state !== 'playing' || this.isPaused) return;

        const isOpen = !this.domInventoryPopup.classList.contains('hidden');
        if (isOpen) {
            this.domInventoryPopup.classList.add('hidden');
            this.domSubgridPopup.classList.add('hidden');
            this.subgridType = null;
        } else {
            this.domInventoryPopup.classList.remove('hidden');
            this.domSubgridPopup.classList.add('hidden'); // Iniciar cerrado
            this.subgridType = null;
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

    quickUseGreatPotion() {
        if (this.state !== 'playing' || this.isPaused) return;

        if (this.player.greatPotions <= 0) {
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "SIN POCIONES MAYORES!", "#aa55ff", 9, true);
            return;
        }

        if (this.player.hp >= this.player.maxHp) {
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "VIDA LLENA!", "#00ff66", 9, false);
            return;
        }

        const success = this.player.useGreatPotion();
        if (success) {
            this.updateHud();
            if (this.isShopOpen) {
                this.updateShopDetails();
            }
        }
    }

    quickUseBerry() {
        if (this.state !== 'playing' || this.isPaused) return;

        if (this.player.berries <= 0) {
            if (this.player.violetBerries > 0) {
                this.quickUseVioletBerry();
                return;
            }
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "SIN BAYAS!", "#ff3355", 9, true);
            return;
        }

        if (this.player.hp >= this.player.maxHp) {
            if (this.player.violetBerries > 0 && this.player.stamina < this.player.maxStamina) {
                this.quickUseVioletBerry();
                return;
            }
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "VIDA LLENA!", "#00ff66", 9, false);
            return;
        }

        const success = this.player.useBerry();
        if (success) {
            this.updateHud();
            if (this.isShopOpen) {
                this.updateShopDetails();
            }
        }
    }

    quickUseVioletBerry() {
        if (this.state !== 'playing' || this.isPaused) return;

        if (this.player.violetBerries <= 0) {
            audio.playHit();
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "SIN BAYAS VIOLETAS!", "#b85cff", 9, true);
            return;
        }

        if (this.player.hp >= this.player.maxHp && this.player.stamina >= this.player.maxStamina) {
            particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 15, "VIDA Y ST LLENAS!", "#00ff66", 9, false);
            return;
        }

        const success = this.player.useVioletBerry();
        if (success) {
            this.updateHud();
            if (this.isShopOpen) {
                this.updateShopDetails();
            }
        }
    }

    // === MÉTODOS DEL MAPA MÁGICO (VIAJE RÁPIDO) ===
    openMagicMap() {
        console.log("=== openMagicMap: Intentando abrir Mapa Mágico ===");
        if (this.state !== 'playing') {
            console.log("No se puede abrir: el estado no es 'playing'. Estado actual:", this.state);
            return;
        }

        // Cerrar el popup de inventario standard
        if (this.domInventoryPopup) {
            this.domInventoryPopup.classList.add('hidden');
        }
        if (this.domSubgridPopup) {
            this.domSubgridPopup.classList.add('hidden');
        }
        this.subgridType = null;

        // Mostrar pantalla del mapa
        if (this.domMagicMapScreen) {
            this.domMagicMapScreen.classList.remove('hidden');
            console.log("Clase 'hidden' removida de magic-map-screen");
        }

        this.isPaused = true;
        this.isMagicMapOpen = true;

        // Auto-seleccionar el mundo actual del jugador
        let currentWorld = 1;
        if (this.level >= 6 && this.level <= 11) currentWorld = 2;
        else if (this.level >= 12 && this.level <= 18) currentWorld = 3;
        else if (this.level >= 19 && this.level <= 25) currentWorld = 4;
        else if (this.level >= 26 && this.level <= 34) currentWorld = 5;
        else if (this.level >= 35) currentWorld = 6;

        console.log("Mundo actual detectado:", currentWorld, "para nivel:", this.level);
        this.selectMapWorld(currentWorld);
    }

    closeMagicMap() {
        console.log("=== closeMagicMap: Cerrando Mapa Mágico ===");
        if (this.domMagicMapScreen) {
            this.domMagicMapScreen.classList.add('hidden');
        }
        this.isPaused = false;
        this.isMagicMapOpen = false;
    }

    selectMapWorld(worldNum) {
        console.log("=== selectMapWorld: Seleccionado Mundo ===", worldNum);
        if (!this.mapWorldTitle || !this.mapLevelsList) {
            console.error("Faltan referencias DOM en selectMapWorld:", {
                title: !!this.mapWorldTitle,
                list: !!this.mapLevelsList
            });
            return;
        }

        // Resaltar el botón del mundo seleccionado
        for (let w = 1; w <= 6; w++) {
            const btn = document.getElementById(`btn-map-world-${w}`);
            if (btn) {
                btn.style.pointerEvents = 'auto';
                if (w === worldNum) {
                    btn.style.borderColor = '#9ee8ff';
                    btn.style.boxShadow = '0 0 10px rgba(158, 232, 255, 0.8)';
                } else {
                    btn.style.borderColor = '';
                    btn.style.boxShadow = '';
                }
            }
        }

        const worldNames = {
            1: "MUNDO 1: EL PASILLO GÓTICO",
            2: "MUNDO 2: LAS CATACUMBAS ÍGNEAS",
            3: "MUNDO 3: EL SENDERO DEL BOSQUE",
            4: "MUNDO 4: LA FORTALEZA CELESTE",
            5: "MUNDO 5: EL ESPEJO DEL VACÍO",
            6: "MUNDO 6: LAS NUBES DEL ALBA NEGRA"
        };
        this.mapWorldTitle.innerText = worldNames[worldNum] || `MUNDO ${worldNum}`;

        // Limpiar lista de niveles anterior
        this.mapLevelsList.innerHTML = '';

        const levels = this.mapData[worldNum] || [];
        levels.forEach(level => {
            const btn = document.createElement('button');
            btn.className = 'btn-retro';
            btn.style.width = '100%';
            btn.style.fontSize = '7px';
            btn.style.padding = '8px';
            btn.style.textAlign = 'center';
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.gap = '2px';
            btn.style.pointerEvents = 'auto'; // Asegurar pointer events

            const nameSpan = document.createElement('span');
            nameSpan.innerText = level.name;
            nameSpan.style.pointerEvents = 'none'; // Permitir click en botón principal
            btn.appendChild(nameSpan);

            if (level.hasBonfire) {
                // Comprobar si es un jefe y si está desbloqueado
                let isBossUnlocked = true;
                if (level.requiresBoss) {
                    isBossUnlocked = this[level.requiresBoss];
                }

                // Comprobar si la hoguera ha sido encendida ya
                const isBonfireLit = this.litBonfires.includes(level.levelNum);

                if (isBossUnlocked && isBonfireLit) {
                    btn.style.borderColor = '#00ff66';

                    const tagSpan = document.createElement('span');
                    tagSpan.innerText = "🔥 Hoguera Lista";
                    tagSpan.style.color = '#00ff66';
                    tagSpan.style.fontSize = '5.5px';
                    tagSpan.style.pointerEvents = 'none';
                    btn.appendChild(tagSpan);

                    btn.addEventListener('click', (e) => {
                        console.log("Viajar clickeado en nivel:", level.levelNum);
                        e.stopPropagation();
                        this.travelToLevel(level.levelNum, level.spawnX);
                    });
                } else if (isBossUnlocked && !isBonfireLit) {
                    btn.className = 'btn-retro locked-slot';
                    btn.style.borderColor = '#442b15';
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';

                    const tagSpan = document.createElement('span');
                    tagSpan.innerText = "⚠️ Hoguera Apagada";
                    tagSpan.style.color = '#ff9900';
                    tagSpan.style.fontSize = '5.5px';
                    tagSpan.style.pointerEvents = 'none';
                    btn.appendChild(tagSpan);
                } else {
                    btn.className = 'btn-retro locked-slot';
                    btn.style.borderColor = '#442222';
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';

                    const tagSpan = document.createElement('span');
                    tagSpan.innerText = "🔒 Jefe No Derrotado";
                    tagSpan.style.color = '#ff3333';
                    tagSpan.style.fontSize = '5.5px';
                    tagSpan.style.pointerEvents = 'none';
                    btn.appendChild(tagSpan);
                }
            } else {
                btn.className = 'btn-retro locked-slot';
                btn.style.borderColor = '#3a3a4c';
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';

                const tagSpan = document.createElement('span');
                tagSpan.innerText = "⚠️ Sin Hoguera";
                tagSpan.style.color = '#a0a0b0';
                tagSpan.style.fontSize = '5.5px';
                tagSpan.style.pointerEvents = 'none';
                btn.appendChild(tagSpan);
            }

            this.mapLevelsList.appendChild(btn);
        });
    }

    travelToLevel(targetLevelNum, spawnX) {
        console.log("=== travelToLevel: Iniciando viaje al nivel", targetLevelNum, "spawnX:", spawnX);
        this.closeMagicMap();

        // 1. Efecto Souls: curar completamente
        this.player.hp = this.player.maxHp;
        this.player.stamina = this.player.maxStamina;

        // 2. Teletransportar y reconstruir el nivel para leer la posición real de la hoguera
        this.enterLevelAtStart(targetLevelNum, spawnX);

        // 3. Actualizar el checkpoint en la base real de la hoguera, incluso si está en una plataforma
        const bonfireSpawn = this.getBonfireRespawnPoint(spawnX);
        this.latestLitBonfire = {
            level: targetLevelNum,
            x: bonfireSpawn.x,
            y: bonfireSpawn.y,
            lit: true
        };

        if (this.bonfire) {
            this.bonfire.lit = true;
        }
        this.player.x = Math.max(0, bonfireSpawn.x - 30);
        this.player.y = bonfireSpawn.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.cameraX = Math.max(0, Math.min(this.levelWidth - 960, this.player.x - 960 * 0.35));
        this.cameraY = Math.max(540 - this.levelHeight, Math.min(0, this.player.y - 540 * 0.42));

        // 4. Guardar progreso de juego
        this.saveGame();

        // 5. Efectos de audio y partículas premium
        audio.playBonfire();
        if (typeof audio.startMusic === 'function') {
            audio.startMusic();
        }

        particles.spawnCollectGlow(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#00ffd7', 20);
        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 30, "🔥 VIAJE RÁPIDO LOGRADO 🔥", "#9ee8ff", 14, true);
        particles.addFloatingText(this.player.x + this.player.width/2, this.player.y - 10, "VIDA RESTAURADA", "#00ff66", 10, false);
    }
}

export { Game };

// Inicializar el juego al cargar (con failsafe por si el evento load ya ocurrió)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    new Game();
} else {
    window.addEventListener('load', () => {
        new Game();
    });
}
