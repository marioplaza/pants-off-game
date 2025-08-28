# Flappy Bird - Banda Edition 🎸

Conversión completa del juego Flappy Bird de Python/Pygame a JavaScript/Canvas con dificultad progresiva y sistema de personajes únicos.

## 🎮 Características

- **4 personajes jugables**: Fonso, Mauro, Diego y Rocky, cada uno con su instrumento único
- **Dificultad progresiva**: El juego se vuelve más desafiante gradualmente
- **Sistema completo**: Menú de selección, juego, game over con puntuaciones
- **Audio integrado**: Efectos de sonido y música de fondo
- **Multiplataforma**: PC (teclado) y móvil (touch)
- **Integración Spotify**: Acceso directo a la página del artista
- **Sin dependencias**: JavaScript vanilla + Canvas nativo

## 🚀 Inicio Rápido

### Opción 1: Ejecutar localmente
```bash
# Clonar/descargar el proyecto
# Navegar a la carpeta del juego

# Servidor local recomendado:
python -m http.server 8000
# o
npx serve .
# o  
php -S localhost:8000

# Abrir http://localhost:8000
```

### Opción 2: Directo en navegador
1. Abrir `index.html` directamente
2. ¡Jugar!

## 🎯 Cómo Jugar

### Controles
- **PC**: Barra espaciadora para saltar
- **Móvil**: Toca la pantalla para saltar
- **Menú**: Clic/tap en personajes y botones

### Mecánicas
1. **Selecciona tu personaje**: Cada uno tiene su objeto coleccionable especial
2. **Esquiva los tubos**: Vuela entre ellos sin tocarlos
3. **Recoge objetos**: +5 puntos extra por cada instrumento
4. **Sobrevive**: La dificultad aumenta progresivamente

## ⚙️ Configuración de Dificultad

### 🎮 Sistema Progresivo
El juego aumenta automáticamente la dificultad:
- **Cada 10 puntos**: Velocidad de tubos +0.2
- **Cada 25 puntos**: Gravedad +0.05

### 🔧 Personalización
Edita las **líneas 8-22** en `flappy-game.js`:

```javascript
this.DIFFICULTY_CONFIG = {
    // Velocidad de tubos
    INITIAL_PIPE_SPEED: 3,      // Velocidad inicial
    SPEED_INCREASE_EVERY: 10,   // Cada X puntos aumenta
    SPEED_INCREASE_AMOUNT: 0.2, // Cuánto aumenta

    // Gravedad (caída del pájaro)  
    INITIAL_GRAVITY: 0.3,       // Gravedad inicial
    GRAVITY_INCREASE_EVERY: 25, // Cada X puntos aumenta
    GRAVITY_INCREASE_AMOUNT: 0.05 // Cuánto aumenta
};
```

### 🎯 Presets de Dificultad

**Modo Fácil:**
```javascript
SPEED_INCREASE_EVERY: 20, SPEED_INCREASE_AMOUNT: 0.1, GRAVITY_INCREASE_EVERY: 50
```

**Modo Difícil:**
```javascript  
SPEED_INCREASE_EVERY: 5, SPEED_INCREASE_AMOUNT: 0.3, GRAVITY_INCREASE_EVERY: 10
```

**Modo Clásico (sin progresión):**
```javascript
SPEED_INCREASE_EVERY: 9999, GRAVITY_INCREASE_EVERY: 9999
```

## 🔧 Integración en Web Existente

### 📋 Guía Paso a Paso

#### 1️⃣ Estructura de Archivos
Copia estos archivos a tu proyecto:
```
tu-web/
├── flappy/                    # Carpeta del juego
│   ├── flappy-game.js        # Motor principal
│   └── assets/               # Recursos
│       ├── images/           # 18 imágenes PNG
│       └── sounds/           # 4 archivos de audio
└── tu-pagina.html            # Tu página
```

#### 2️⃣ HTML Básico
```html
<!DOCTYPE html>
<html>
<body>
    <!-- Tu contenido existente -->
    
    <!-- Juego -->
    <div style="text-align: center; margin: 20px 0;">
        <canvas id="flappy-game" width="400" height="600"></canvas>
    </div>
    
    <!-- Cargar AL FINAL del body -->
    <script src="flappy/flappy-game.js"></script>
</body>
</html>
```

#### 3️⃣ CSS Responsive (Opcional)
```css
#flappy-game {
    border: 2px solid #333;
    border-radius: 10px;
    max-width: 100%;
    height: auto;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

@media (max-width: 500px) {
    #flappy-game {
        width: 320px;
        height: 480px;
    }
}
```

### 🗂️ Opciones de Organización

**Subcarpeta (Recomendado):**
```
assets/games/flappy/ → <script src="assets/games/flappy/flappy-game.js">
```

**Raíz del sitio:**
```  
flappy-game.js → <script src="flappy-game.js">
```

**CDN/Hosting externo:**
```html
<script src="https://tu-cdn.com/flappy-game.js"></script>
```

### ⚙️ Personalización Avanzada

**ID personalizado:**
```html
<canvas id="mi-juego"></canvas>
<script>const game = new FlappyGame('mi-juego');</script>
```

**Múltiples instancias:**
```html
<canvas id="juego1"></canvas>
<canvas id="juego2"></canvas>
<script>
const game1 = new FlappyGame('juego1');
const game2 = new FlappyGame('juego2');
</script>
```

## 📁 Estructura del Proyecto

```
flappy_juego/
├── index.html              # Demo del juego
├── flappy-game.js          # Motor principal (clase FlappyGame)
├── README.md              # Esta documentación
├── CLAUDE.md              # Documentación técnica del proyecto
│
└── assets/                # Recursos optimizados
    ├── images/            # Imágenes (18 archivos WEBP)
    │   ├── fonso.webp, mauro.webp, diego.webp, rocky.webp     # Personajes
    │   ├── bajo.webp, baquetas.webp, guitarra.webp, micro.webp # Instrumentos
    │   ├── fondo.webp, elixeoteupersonaxe.webp, xogardenovo.webp # Fondos
    │   ├── edificios.webp                                   # Escenario
    │   └── xogar.webp, escoitanos.webp, xogar2.webp, escoitanos2.webp # Botones
    │
    └── sounds/            # Audio optimizado con fallback
        ├── select.ogg/.wav, pickup.ogg/.wav, lose.ogg/.wav  # Efectos (doble formato)
        └── cancion.mp3                                      # Música de fondo
```

## 🚨 Solución de Problemas

### ❌ Los assets no cargan
**Problema:** Error 404 en imágenes/sonidos  
**Solución:** Verificar estructura de carpetas:
```
✅ Correcto: assets/images/fonso.png
❌ Incorrecto: images/fonso.png
```

### ❌ El juego no inicia  
**Problema:** Canvas no encontrado  
**Solución:**
1. Verificar ID del canvas
2. Cargar script DESPUÉS del canvas

### ❌ Audio no reproduce
**Problema:** Política de autoplay del navegador  
**Solución:** Normal - se activa con primera interacción

### ❌ Rendimiento lento
**Problema:** Lag o stuttering  
**Solución:**
1. Cerrar pestañas del navegador
2. Usar servidor local en lugar de file://

## 🎵 Características Técnicas

- **Motor**: JavaScript ES6 + HTML5 Canvas
- **Arquitectura**: Clase encapsulada, no contamina global
- **Rendimiento**: 60 FPS con requestAnimationFrame  
- **Compatibilidad**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Assets optimizados**: 
  - **Imágenes**: WEBP para ~70% menos peso
  - **Audio**: OGG Vorbis con fallback automático a WAV
  - **Detección automática** de formatos soportados
- **Carga**: Asíncrona con pantalla de progreso
- **Audio**: Manejo automático de políticas del navegador
- **Responsive**: Adaptable a diferentes pantallas

### 🚀 Optimizaciones Web
- **WEBP**: Imágenes 70% más ligeras manteniendo calidad
- **OGG Vorbis**: Audio de efectos ~50% más pequeño que WAV
- **Fallback inteligente**: WAV en navegadores que no soporten OGG
- **Progressive loading**: Los assets se cargan según capacidades del navegador

## 🔄 Diferencias con la Versión Python

### ✅ Funcionalidades Portadas
- ✅ 4 personajes con objetos únicos
- ✅ Estados completos (inicio, menú, juego, fin)  
- ✅ Física idéntica (gravedad, salto, colisiones)
- ✅ Sistema de puntuación con coleccionables
- ✅ Audio completo (música + efectos)
- ✅ Integración Spotify
- ✅ **NUEVO**: Dificultad progresiva configurable

### 🔄 Adaptaciones Web
- **Fuentes**: Sistema estándar en lugar de "Press Start 2P"
- **Carga**: Asíncrona con feedback visual
- **Input**: Soporte teclado + touch
- **Audio**: Cumple políticas de navegadores modernos

---

¡El juego está listo para usar y es completamente funcional! 🎉

Para más detalles técnicos, consulta `CLAUDE.md`.