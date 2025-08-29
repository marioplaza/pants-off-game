# Flappy Bird - Banda Edition 🎸

Juego Flappy Bird completamente rediseñado con sistema de ranking online, personalización visual avanzada y registro de jugadores.

## 🎮 Características

- **4 personajes jugables**: Fonso, Mauro, Diego y Rocky, cada uno con su instrumento único
- **Sistema de ranking global**: Clasificación online con Redis/Upstash
- **Registro de jugadores**: Sistema de nombres personalizado con validación
- **Pantalla de ranking completa**: Ya no es modal, sino pantalla independiente
- **Fuente personalizada**: Pixel_Digivolve.otf para estética retro
- **Fondo personalizado**: fondo_ranking.webp para la pantalla de clasificación
- **Dificultad progresiva**: El juego se vuelve más desafiante gradualmente
- **Audio integrado**: Efectos de sonido y música de fondo
- **Multiplataforma**: PC (teclado) y móvil (touch)
- **Integración Spotify**: Acceso directo a la página del artista
- **Interfaz en gallego**: Textos localizados al idioma gallego
- **Sin dependencias**: JavaScript vanilla + Canvas nativo

## 🚀 Inicio Rápido

### Opción 1: Ejecutar localmente (Recomendado)
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

### Opción 2: Con sistema de ranking completo
Para usar el ranking online necesitas:
1. **Variables de entorno**: `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
2. **API endpoints**: `/api/register-player.js`, `/api/submit-score.js`, `/api/leaderboard.js`
3. **Despliegue en Vercel/Netlify** o similar con soporte serverless

### Opción 3: Solo juego local
1. Abrir `index.html` directamente
2. ¡Jugar! (Sin ranking online)

## 🎯 Cómo Jugar

### Controles
- **PC**: Barra espaciadora para saltar
- **Móvil**: Toca la pantalla para saltar
- **Menú**: Clic/tap en personajes y botones

### Mecánicas
1. **Registra tu nombre**: Primera vez requiere registro en el sistema
2. **Selecciona tu personaje**: Cada uno tiene su objeto coleccionable especial
3. **Esquiva los tubos**: Vuela entre ellos sin tocarlos
4. **Recoge objetos**: +5 puntos extra por cada instrumento
5. **Sobrevive**: La dificultad aumenta progresivamente
6. **Compite**: Tu puntuación se guarda en el ranking global

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
├── api/                   # Sistema de ranking (serverless)
│   ├── register-player.js      # Registro de nuevos jugadores
│   ├── submit-score.js         # Envío de puntuaciones
│   └── leaderboard.js          # Obtener clasificación
│
└── assets/                # Recursos optimizados
    ├── fonts/             # Fuentes personalizadas
    │   └── Pixel_Digivolve.otf    # Fuente principal del juego
    │
    ├── images/            # Imágenes (19+ archivos WEBP)
    │   ├── fonso.webp, mauro.webp, diego.webp, rocky.webp     # Personajes
    │   ├── bajo.webp, baquetas.webp, guitarra.webp, micro.webp # Instrumentos
    │   ├── fondo.webp, elixeoteupersonaxe.webp, xogardenovo.webp # Fondos
    │   ├── fondo_ranking.webp                               # Fondo de ranking
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
✅ Correcto: assets/images/fonso.webp
❌ Incorrecto: images/fonso.webp
```

### ❌ El ranking no funciona
**Problema:** Error al registrar/obtener puntuaciones  
**Solución:**
1. Verificar variables de entorno de Upstash
2. Comprobar que las APIs estén desplegadas
3. En local: ranking se deshabilita automáticamente

### ❌ La fuente no carga
**Problema:** Texto con fuente por defecto  
**Solución:** Verificar que `assets/fonts/Pixel_Digivolve.otf` exista

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
- **Backend**: Redis/Upstash para ranking global
- **APIs**: Serverless functions (Vercel/Netlify compatible)
- **Arquitectura**: Clase encapsulada, no contamina global
- **Rendimiento**: 60 FPS con requestAnimationFrame  
- **Compatibilidad**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Fuentes**: FontFace API para carga personalizada
- **Assets optimizados**: 
  - **Imágenes**: WEBP para ~70% menos peso
  - **Audio**: OGG Vorbis con fallback automático a WAV
  - **Detección automática** de formatos soportados
- **Carga**: Asíncrona con pantalla de progreso
- **Audio**: Manejo automático de políticas del navegador
- **Responsive**: Adaptable a diferentes pantallas
- **Localización**: Interfaz completamente en gallego

### 🚀 Optimizaciones Web
- **WEBP**: Imágenes 70% más ligeras manteniendo calidad
- **OGG Vorbis**: Audio de efectos ~50% más pequeño que WAV
- **Fallback inteligente**: WAV en navegadores que no soporten OGG
- **Progressive loading**: Los assets se cargan según capacidades del navegador
- **Custom fonts**: Carga optimizada con fallbacks automáticos
- **API caching**: Redis para alta performance en ranking

## 🔄 Diferencias con la Versión Python

### ✅ Funcionalidades Portadas
- ✅ 4 personajes con objetos únicos
- ✅ Estados completos (inicio, menú, juego, fin, ranking)  
- ✅ Física idéntica (gravedad, salto, colisiones)
- ✅ Sistema de puntuación con coleccionables
- ✅ Audio completo (música + efectos)
- ✅ Integración Spotify

### 🆕 Nuevas Funcionalidades Web
- ✨ **Sistema de ranking online** con Redis/Upstash
- ✨ **Registro de jugadores** con validación avanzada
- ✨ **Pantalla de ranking dedicada** (ya no modal)
- ✨ **Fuente personalizada** Pixel_Digivolve
- ✨ **Fondo personalizado** para ranking
- ✨ **Localización gallega** completa
- ✨ **Dificultad progresiva** configurable
- ✨ **Modal elegante** para registro de nombres
- ✨ **API REST** para gestión de datos

### 🔄 Adaptaciones Web
- **Fuentes**: FontFace API con fuente personalizada + fallbacks
- **Carga**: Asíncrona con feedback visual
- **Input**: Soporte teclado + touch + modal HTML
- **Audio**: Cumple políticas de navegadores modernos
- **Navegación**: Sistema de estados mejorado con memoria de origen

---

## 🌐 Sistema Serverless - Explicación Técnica

### 🤔 ¿Qué es Serverless?
**Serverless NO significa "sin servidor"**, significa que **tú no gestionas el servidor**. La plataforma (Vercel, Netlify) se encarga de:
- Crear el servidor cuando llega una petición
- Ejecutar tu función
- Destruir el servidor cuando termina
- Escalar automáticamente

### 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    API calls    ┌─────────────────┐    Redis calls    ┌─────────────────┐
│                 │ ──────────────> │                 │ ─────────────────> │                 │
│   Navegador     │                 │   Vercel/       │                    │   Upstash       │
│   (Frontend)    │ <────────────── │   Netlify       │ <───────────────── │   (Redis)       │
│                 │    Responses    │   (Serverless)  │    Data            │                 │
└─────────────────┘                 └─────────────────┘                    └─────────────────┘
```

### 🔧 Componentes

#### 1. **Frontend (JavaScript en navegador)**
```javascript
// Tu juego ejecuta esto:
const response = await fetch('/api/submit-score', {
    method: 'POST',
    body: JSON.stringify({ playerId: 'abc123', score: 45 })
});
```

#### 2. **API Serverless** (`/api/submit-score.js`)
```javascript
// Se ejecuta EN LA NUBE automáticamente:
export default async function handler(req, res) {
    const { playerId, score } = req.body;
    await redis.zadd('leaderboard', { score, member: playerId });
    res.json({ success: true });
}
```

#### 3. **Base de datos** (Upstash Redis en la nube)
```javascript
redis.zadd('leaderboard', { score: 100, member: 'player1' });
```

### 🚀 Deploy sin Servidor Tradicional

#### **Opción 1: Vercel (Recomendada)**
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. En tu carpeta del juego
vercel

# 3. Configurar variables de entorno en dashboard
UPSTASH_REDIS_REST_URL=https://tu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu-token
```

#### **Opción 2: Netlify**
```bash
# 1. Instalar Netlify CLI  
npm i -g netlify-cli

# 2. Renombrar: api/ → netlify/functions/
# 3. Deploy
netlify deploy --prod
```

### ⚡ Ventajas vs Servidor Tradicional

| Aspecto | Serverless | Servidor Tradicional |
|---------|------------|---------------------|
| **Costo** | $0 - $5/mes | $20 - $100/mes |
| **Mantenimiento** | Cero | Actualizaciones, seguridad, etc. |
| **Escalabilidad** | Automática | Manual |
| **Disponibilidad** | 99.9% garantizado | Depende de ti |
| **Deploy** | `git push` | SSH, configuración manual |

### 🔄 Flujo de una Petición

1. **Usuario** hace clic en "Ver Ranking"
2. **Frontend** llama a `/api/leaderboard`  
3. **Vercel** crea un contenedor temporal
4. **Ejecuta** `leaderboard.js`
5. **Conecta** a Upstash Redis
6. **Obtiene** top 10 jugadores
7. **Retorna** JSON con datos
8. **Vercel** destruye el contenedor
9. **Frontend** muestra el ranking

### 💰 Costos (Prácticamente GRATIS)
- **Vercel**: 100GB bandwidth/mes gratis
- **Netlify**: 100GB bandwidth/mes gratis  
- **Upstash Redis**: 10,000 requests/día gratis
- **Para este juego**: $0/mes hasta miles de usuarios

### 🎯 ¿Por qué Funciona Tan Bien para Juegos?

- **Latencia baja**: CDN global distribuido
- **Sin downtime**: Auto-recuperación ante fallos
- **Auto-scaling**: Soporta picos de tráfico automáticamente
- **Simplicidad**: Solo código, cero infraestructura
- **Confiabilidad**: Nivel empresarial sin costo

**Resultado**: Backend profesional pagando $0/mes 🚀

---

¡El juego está listo para usar y es completamente funcional! 🎉

Para más detalles técnicos, consulta `CLAUDE.md`.