# AGENTS.md — Dungeon Knight

Guía de desarrollo para agentes de IA (y humanos) que trabajen en este repositorio. Léela de principio a fin antes de realizar cualquier cambio en la física del personaje, el motor de partículas, el sistema de colisiones o los comportamientos de IA en "Dungeon Knight".

---

## 🎮 Qué es Dungeon Knight

Un videojuego de plataformas de acción retro en 2D de estilo 8 bits, construido completamente desde cero sobre **HTML5 Canvas** y **JavaScript moderno (módulos ES6)**. Destaca por su alta fluidez física, sistema de sonido procedimental sintetizado en tiempo real y una atmósfera gótica oscura optimizada con un filtro CRT analógico.

El juego consta de tres niveles lineales:
1. **Nivel 1 (El Pasillo Gótico)**: Introducción al movimiento, salto, enemigos básicos y la primera hoguera.
2. **Nivel 2 (Las Catacumbas Ígneas)**: Plataformas de una sola dirección (one-way), esqueleto arquero, trampas de fuego terrestres, gancho de escalada vertical y **murciélagos de fuego**.
3. **Nivel 3 (La Cámara del Rey)**: Arena cerrada contra el jefe gigante "Rey Esqueleto".

---

## 📂 Layout del Proyecto (Arquitectura del Código)

La lógica del juego está modularizada bajo la carpeta `js/`:

```
index.html              Estructura de la interfaz HUD, pantallas superpuestas (Game Over, Victoria, Pausa, Tienda de Hoguera) y controles táctiles.
style.css               Estilos visuales premium, filtros CRT de pantalla analógica, tipografías retro y transiciones góticas.
js/
  game.js               Motor principal. Controla el bucle de juego (Game Loop a 60 FPS), colisiones AABB generales, scroll de cámara suave con paralaje, inicialización de niveles (`initLevel`) y transiciones.
  knight.js             Clase que representa al héroe Knight. Controla gravedad, estados (Inactivo, Correr, Saltar, Agacharse, Rodar, Cubrirse con Escudo) y las físicas de gancho de escalar (`Grappling Hook`).
  enemies.js            Entidades y peligros. Contiene clases para:
                        - Crate (Caja de madera rompible).
                        - Spikes (Picos dañinos en suelo).
                        - CeilingBlade (Cuchillas pendulares).
                        - Platform (Plataformas sólidas de una dirección).
                        - FireTrap (Dispositivo de llamaradas de fuego).
                        - BatEnemy (Murciélagos normales y de fuego).
                        - SkeletonMinion (Esqueleto básico).
                        - SkeletonArcher (Esqueleto que dispara flechas).
                        - ArrowProjectile (Flecha estándar).
                        - FireballProjectile (Bola de fuego diagonal del murciélago).
                        - LootItem (Monedas y corazones de recompensa).
  boss.js               IA y comportamientos del Rey Esqueleto Gigante (Fase 1 y Fase 2 en Furia Roja con ondas sísmicas).
  particles.js          Sistema de partículas modular. Genera polvo de movimiento, chispas del escudo, astillas de cajas, huesos rotos, llamaradas de fuego y texto flotante.
  audio.js              Sintetizador de audio retro basado en Web Audio API (efectos de sonido procedurales y banda sonora chiptune medieval en bucle).
```

---

## ⚡ Reglas Físicas y Mecánicas Clave del Héroe

1. **Agacharse (`S` / `▼`)**:
   - Reduce la altura de colisión del Knight un 45% (su `baseHeight` pasa de `58px` a `32px` de caja de colisión).
   - Permite deslizarse a salvo por debajo de las cuchillas pendulares (`CeilingBlade`).
   - Al estar agachado en medio de una plataforma flotante (`Platform`), presionar salto o el botón de agacharse te permite **dejarse caer** a través de ella hacia abajo.

2. **Rodar / Esquivar (`L` / `ROLL`)**:
   - Aporta 24 frames de invulnerabilidad absoluta (`this.isRolling = true`).
   - Consume estamina. Impulsa al caballero rápidamente hacia adelante y permite pasar de largo entre picos o cuchillas sin recibir daño.
   - El imán de monedas de oro sigue activo al rodar o agacharse para no perder botín.

3. **Defensa con Escudo (`K` / `SHIELD`)**:
   - Defensa direccional activa frente a ataques frontales.
   - Si un proyectil (flecha o bola de fuego) colisiona contra el Caballero mientras se cubre en la dirección correcta, el daño se reduce a `0`, se reproducen chispas metálicas, se drena estamina y se bloquea el daño.

4. **Gancho de Escalar (`F` / `HOOK`)**:
   - Lanza un anclaje de acero eslabonado vertical/diagonal hacia la plataforma de piedra más cercana (rango `280px`).
   - Tira del Knight hacia la plataforma a una velocidad constante (`9.5`) ignorando la gravedad.
   - **Efecto Catapulta (Slingshot)**: Si sueltas el gancho presionando **Saltar**, te disparará verticalmente con un impulso adicional (`-7.5` de velocidad vertical), permitiendo encadenar saltos acrobáticos.

5. **Entradas no repetitivas (Single-Press)**:
   - Las acciones de **Ataque** y **Rodar** solo se ejecutan una única vez por pulsación física del botón. Mantener pulsadas las teclas no buclea la animación infinitamente.

---

## 🔥 Mecánica de la Hoguera y Reinicio del Mundo (Souls-like)

Las hogueras actúan como puestos interactivos de control en los niveles 1 y 2:
* **Encendido**: Al pasar cerca por primera vez, se enciende (efecto de fuego procedimental), registra la posición del Caballero y guarda el punto de control (`this.latestLitBonfire`).
* **Tienda / Descanso (`E`)**: Abre un menú gótico que pausa las físicas pero mantiene el renderizado de fondo.
  - **Descansar (Gratis)**: Cura el 100% de HP y estamina y **restablece por completo** el nivel actual (vuelven a aparecer cajas rompibles, esqueletos, arqueros, picos y cuchillas pendulares en su posición original, recreando el desafío).
  - **Tienda**: Permite comprar pociones usando monedas:
    - *Poción Menor* (Cuesta 10 monedas, cura el 25% de la salud total).
    - *Poción Mayor* (Cuesta 20 monedas, cura el 65% de la salud total).
  - Las pociones se guardan en el inventario ("El Bulto") y se usan rápidamente con las hotkeys `Q` (Menor) y `G` (Mayor) en pleno combate.

---

## 🌋 El Nivel 2 y los Murciélagos de Fuego

El Nivel 2 ("Las Catacumbas") introduce mecánicas ígneas:
* **Murciélagos de Fuego (`BatEnemy` con `isFireBat = true`)**:
  - Tienen apariencia volcánica: cuerpo naranja brillante (`#e65c00`), alas rojas de lava (`#ff3300`) y ojos amarillos incandescentes (`#ffd700`).
  - Sueltan chispas de fuego pasivas en el aire mientras patrullan.
  - Escupen bolas de fuego (`FireballProjectile`) diagonalmente hacia abajo dirigidas a la posición del jugador cada 3-4 segundos cuando este se encuentra en un rango de `450px`.
  - La bola de fuego tiene físicas de rastro de partículas e impacta con el suelo de piedra, desintegrándose con una hermosa miniexplosión decorativa de 8 chispas de fuego.

---

## 🚫 Reglas Duras para Agentes de Desarrollo

1. **Colisiones AABB estrictas**: Mantener el sistema de límites alineados a los ejes para colisiones sólidas de suelo, picos y plataformas. Las plataformas flotantes son transitable-por-arriba (one-way).
2. **Audio procedural consistente**: Utilizar siempre la sintetización de sonidos de `js/audio.js` vía Web Audio API en lugar de añadir assets de audio binarios externos.
3. **Mecanismo de Partículas**: Todo daño infligido a enemigos o al jugador debe spawnear números de daño flotantes y partículas de impacto correspondientes en `particles.js`.
4. **Conservación de la dificultad equilibrada**: La vida de los arqueros y miniesqueletos se mantiene en `20 HP` (mueren de dos golpes de espada de `10` de daño), y el daño del Jefe final está balanceado para permitir probar las dinámicas sin morir inmediatamente.
