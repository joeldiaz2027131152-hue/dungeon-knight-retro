/* ==========================================================================
   DUNGEON KNIGHT - MOTOR DE AUDIO RETRO PROCEDURAL (audio.js)
   ========================================================================== */

class RetroAudio {
    constructor() {
        this.ctx = null;
        this.musicInterval = null;
        this.musicPlaying = false;
        this.isMuted = false;
    }

    // Inicialización perezosa (los navegadores bloquean el audio hasta que haya interacción)
    init() {
        try {
            if (!this.ctx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    this.ctx = new AudioContextClass();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {
            console.warn("Web Audio API is not supported or was blocked:", e);
            this.ctx = null;
        }
    }

    // Efecto de Sonido: Salto (Pitch ascendente rápido con onda cuadrada)
    playJump() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        // Desplazamiento rápido de frecuencia hacia arriba
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // Efecto de Sonido: Espadazo / Ataque (Ruido blanco filtrado rápido)
    playSwordSwing() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 0.12; // 0.12 segundos
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generar ruido blanco
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.12);
    }

    // Efecto de Sonido: Bloqueo de Escudo (Tono metálico agudo y decaimiento rápido)
    playBlock() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Dos tonos desafinados para crear el timbre metálico de choque
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.linearRampToValueAtTime(440, now + 0.08);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(920, now);
        osc2.frequency.linearRampToValueAtTime(460, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(now + 0.1);
        osc2.stop(now + 0.1);
    }

    // Efecto de Sonido: Cajas de Madera Rompiéndose (Ruido sordo con filtro de paso bajo)
    playCrateBreak() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 0.25;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(30, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Añadir una pequeña onda de choque sorda en graves
        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(90, now);
        subOsc.frequency.linearRampToValueAtTime(30, now + 0.15);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.2, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);

        noise.start();
        subOsc.start();
        noise.stop(now + duration);
        subOsc.stop(now + duration);
    }

    // Efecto de Sonido: Hoguera Encendiéndose (Arpegio mágico ascendente rápido)
    playBonfire() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Acorde Do Mayor ascendente
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = now + (idx * 0.07);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, noteStart + 0.2);

            gain.gain.setValueAtTime(0.0, now);
            gain.gain.setValueAtTime(0.08, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.3);
        });
    }

    // Efecto de Sonido: Daño Recibido (Sonido estridente descendente)
    playHit() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.18);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.18);
    }

    // Efecto de Sonido: Muerte (Caída de frecuencia trágica en bajos)
    playDeath() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.8);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        // Añadir filtro pasa-bajos que decae para apagar el sonido
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(30, now + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.8);
    }

    // Fanfarria de Victoria (Melodía de triunfo glorioso chiptune)
    playWin() {
        this.init();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        // Melodía épica retro en Do Mayor
        const melody = [
            { note: 261.63, duration: 0.15 }, // Do4
            { note: 329.63, duration: 0.15 }, // Mi4
            { note: 392.00, duration: 0.15 }, // Sol4
            { note: 523.25, duration: 0.3 },  // Do5
            { note: 392.00, duration: 0.15 }, // Sol4
            { note: 523.25, duration: 0.6 }   // Do5 (larga)
        ];

        let accumTime = 0;
        melody.forEach((item) => {
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + accumTime;
            const end = start + item.duration;

            // Voz 1: Onda Cuadrada clasicista
            osc.type = 'square';
            osc.frequency.setValueAtTime(item.note, start);

            // Voz 2: Armonía en triángulo un octava arriba
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(item.note * 2, start);

            gain.gain.setValueAtTime(0.0, now);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.001, end);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(end);
            osc2.start(start);
            osc2.stop(end);

            accumTime += item.duration + 0.02; // pequeño espacio entre notas
        });
    }

    // ==========================================================================
    // Música de Fondo Chiptune Procedural (Bucle medieval dramático)
    // ==========================================================================
    startMusic() {
        this.init();
        if (this.musicPlaying) return;
        if (!this.ctx) return; // Si no hay AudioContext, no iniciar la música
        this.musicPlaying = true;

        let step = 0;
        // Progresión de acordes oscuros de mazmorra (La menor, Fa mayor, Sol mayor, Mi menor)
        // Cada paso dura 0.2 segundos (tempo rápido de batalla)
        const bassLine = [
            110.00, 110.00, 220.00, 110.00,  // La2, La2, La3, La2
            87.31,  87.31,  174.61, 87.31,   // Fa2, Fa2, Fa3, Fa2
            98.00,  98.00,  196.00, 98.00,   // Sol2, Sol2, Sol3, Sol2
            82.41,  82.41,  164.81, 82.41    // Mi2, Mi2, Mi3, Mi2
        ];

        const leadMelody = [
            220.00, 0, 261.63, 329.63,       // La3, _, Do4, Mi4
            349.23, 0, 329.63, 261.63,       // Fa4, _, Mi4, Do4
            293.66, 0, 329.63, 392.00,       // Sol4, _, Mi4, Sol4
            329.63, 0, 261.63, 196.00        // Mi4, _, Do4, Sol3
        ];

        const playNote = () => {
            if (this.isMuted || !this.musicPlaying) return;
            const now = this.ctx.currentTime;
            
            // 1. Play Bass Note (Onda triangular suave)
            const bassFreq = bassLine[step % bassLine.length];
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            
            bassOsc.type = 'triangle';
            bassOsc.frequency.setValueAtTime(bassFreq, now);
            bassGain.gain.setValueAtTime(0.12, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            
            bassOsc.connect(bassGain);
            bassGain.connect(this.ctx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.18);

            // 2. Play Lead Note (Onda cuadrada chillona retro)
            const leadFreq = leadMelody[step % leadMelody.length];
            if (leadFreq > 0) {
                const leadOsc = this.ctx.createOscillator();
                const leadGain = this.ctx.createGain();
                
                leadOsc.type = 'square';
                leadOsc.frequency.setValueAtTime(leadFreq, now);
                
                // Efecto de vibrato sutil
                leadOsc.frequency.linearRampToValueAtTime(leadFreq * 1.01, now + 0.08);
                leadOsc.frequency.linearRampToValueAtTime(leadFreq * 0.99, now + 0.15);

                leadGain.gain.setValueAtTime(0.04, now);
                leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                
                leadOsc.connect(leadGain);
                leadGain.connect(this.ctx.destination);
                leadOsc.start(now);
                leadOsc.stop(now + 0.18);
            }

            step++;
        };

        // Planificar cada 200 ms
        this.musicInterval = setInterval(playNote, 200);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

export const audio = new RetroAudio();
export default audio;
