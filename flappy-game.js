class FlappyGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // ===== CONFIGURACIÓN DE DIFICULTAD PROGRESIVA =====
        // ¡Modifica estos valores para ajustar la dificultad!
        this.DIFFICULTY_CONFIG = {
            // Velocidad inicial de tubos
            INITIAL_PIPE_SPEED: 5,
            // Cada cuántos puntos aumenta la velocidad de tubos
            SPEED_INCREASE_EVERY: 10,
            // Cuánto aumenta la velocidad de tubos cada vez
            SPEED_INCREASE_AMOUNT: 0.2,
            
            // Gravedad inicial
            INITIAL_GRAVITY: 0.5,
            // Cada cuántos puntos aumenta la gravedad
            GRAVITY_INCREASE_EVERY: 25,
            // Cuánto aumenta la gravedad cada vez
            GRAVITY_INCREASE_AMOUNT: 0.05
        };
        
        // Configuración básica
        this.BASE_WIDTH = 400;
        this.BASE_HEIGHT = 600;
        this.setupCanvasSize();
        
        // Escala para ajustar elementos del juego
        this.scale = Math.min(this.WIDTH / this.BASE_WIDTH, this.HEIGHT / this.BASE_HEIGHT);
        
        // Detectar iOS y ajustar FPS objetivo
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.FPS = isIOS ? 45 : 60; // iOS Safari suele limitarse a ~45 FPS
        this.frameTime = 1000 / this.FPS;
        this.lastFrameTime = 0;
        

        
        // Colores
        this.LIGHT_BLUE = '#87CEEB';
        this.DARK_GRAY = '#323232';
        this.WHITE = '#FFFFFF';
        this.GOLD = '#FFD700';
        this.YELLOW = '#FFFF00';
        this.GREEN = '#00C800';
        this.BLACK = '#000000';
        
        // Estados
        this.state = 'inicio';
        this.selectedCharacter = 0;
        this.lastScore = 0;
        this.inputText = '';
        this.showingRanking = false;
        this.showingRegistrationModal = false;
        this.showingGameOverModal = false;
        
        // Assets
        this.images = {};
        this.sounds = {};
        this.assetsLoaded = false;
        this.assetsToLoad = 0;
        this.assetsLoadedCount = 0;
        
        // Game variables
        this.birdX = 100;
        this.birdY = 300;
        this.velocity = 0;
        this.gravity = this.DIFFICULTY_CONFIG.INITIAL_GRAVITY;
        this.jump = -5;
        
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 270;
        this.pipeSpeed = this.DIFFICULTY_CONFIG.INITIAL_PIPE_SPEED;
        
        this.backgroundX = 0;
        this.backgroundSpeed = 1;
        
        this.collectibles = [];
        this.score = 0;
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // Audio optimization
        this.lastSoundTime = {}; // Para debounce de sonidos
        this.audioPool = {}; // Pool de múltiples instancias de audio
        this.maxAudioInstances = 3; // Máximo 3 instancias por sonido
        
        // Video de fondo
        this.backgroundVideo = document.getElementById('background-video');
        this.videoLoaded = false;
        
        // Input móvil para teclado virtual
        this.mobileInput = document.getElementById('mobile-input');
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Sistema de usuario y ranking
        this.player = {
            id: null,
            name: null,
            bestScore: 0,
            isRegistered: false
        };
        this.ranking = {
            leaderboard: [],
            playerRank: null,
            totalPlayers: 0,
            lastFetch: null
        };
        
        this.init();
    }
    
    setupCanvasSize() {
        // Detectar si es iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // Obtener el tamaño disponible del contenedor
        const container = this.canvas.parentElement;
        
        // Para iOS, usar un enfoque más conservador
        let maxWidth, maxHeight;
        
        if (isIOS) {
            // En iOS, usar dimensiones más seguras
            maxWidth = Math.min(window.innerWidth - 30, 400);
            maxHeight = Math.min(window.innerHeight - 150, 600);
        } else {
            // En otros dispositivos, usar el enfoque dinámico
            const containerRect = container.getBoundingClientRect();
            maxWidth = Math.min(containerRect.width - 40, window.innerWidth - 40);
            maxHeight = Math.min(window.innerHeight - 200, 600);
        }
        
        // Mantener la proporción 400:600 (2:3)
        const aspectRatio = this.BASE_WIDTH / this.BASE_HEIGHT;
        
        let canvasWidth, canvasHeight;
        
        if (maxWidth / maxHeight > aspectRatio) {
            // Limitado por altura
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            // Limitado por ancho
            canvasWidth = maxWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        
        // Asegurar tamaños mínimos
        canvasWidth = Math.max(canvasWidth, 280);
        canvasHeight = Math.max(canvasHeight, 420);
        
        // Para iOS, redondear a números enteros para evitar problemas de renderizado
        if (isIOS) {
            canvasWidth = Math.round(canvasWidth);
            canvasHeight = Math.round(canvasHeight);
        }
        
        this.WIDTH = canvasWidth;
        this.HEIGHT = canvasHeight;
        
        // Optimización agresiva para rendimiento: usar DPR 1 en móviles para máximo rendimiento
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        

        
        // Establecer el tamaño real del canvas (buffer interno)
        this.canvas.width = this.WIDTH * dpr;
        this.canvas.height = this.HEIGHT * dpr;
        
        // Establecer el tamaño de visualización CSS
        this.canvas.style.width = this.WIDTH + 'px';
        this.canvas.style.height = this.HEIGHT + 'px';
        
        // Escalar el contexto para que coincida con el devicePixelRatio
        this.ctx.scale(dpr, dpr);
        
        // Guardar el devicePixelRatio para uso posterior
        this.devicePixelRatio = dpr;
        
        // Configuración optimizada para rendimiento
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'medium'; // 'high' es más lento
    }
    
    init() {
        this.setupEventListeners();
        this.setupResizeHandler();
        this.loadPlayerData();
        this.loadAssets();
    }
    
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            // Esperar un poco para que el redimensionamiento termine
            setTimeout(() => {
                this.setupCanvasSize();
                this.scale = Math.min(this.WIDTH / this.BASE_WIDTH, this.HEIGHT / this.BASE_HEIGHT);
            }, 100);
        });
        
        // Para iOS, también escuchar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupCanvasSize();
                this.scale = Math.min(this.WIDTH / this.BASE_WIDTH, this.HEIGHT / this.BASE_HEIGHT);
            }, 500); // Más tiempo para orientación
        });
    }
    
    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (this.showingRegistrationModal) {
                console.log('⌨️ Tecla presionada en modal:', e.key);
                // Manejar input de texto para registro
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    this.inputText = this.inputText.slice(0, -1);
                    console.log('🔙 Backspace - Texto actual:', this.inputText);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('↩️ Enter presionado - Texto:', this.inputText, 'Longitud:', this.inputText.length);
                    if (this.inputText.length >= 2 && this.inputText.length <= 15) {
                        this.registerPlayerAsync(this.inputText);
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    console.log('🚫 ESC - Cerrando modal');
                    this.showingRegistrationModal = false;
                } else if (e.key.length === 1 && /^[a-zA-Z0-9]$/.test(e.key)) {
                    e.preventDefault();
                    if (this.inputText.length < 15) {
                        this.inputText += e.key;
                        console.log('📝 Añadida letra:', e.key, '- Texto actual:', this.inputText);
                    }
                }
            } else if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === 'jugando') {
                    this.velocity = this.jump;
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Convertir coordenadas del canvas a coordenadas del juego
            this.mouse.x = (e.clientX - rect.left) * (this.WIDTH / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.HEIGHT / rect.height);
            this.mouse.clicked = true;
            this.handleClick(this.mouse.x, this.mouse.y);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
        });
        
        // Touch para móviles
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            
            // Convertir coordenadas del canvas a coordenadas del juego
            // Tener en cuenta el devicePixelRatio para cálculos precisos
            this.mouse.x = (touch.clientX - rect.left) * (this.WIDTH / rect.width);
            this.mouse.y = (touch.clientY - rect.top) * (this.HEIGHT / rect.height);
            
            this.handleClick(this.mouse.x, this.mouse.y);
            
            if (this.state === 'jugando') {
                this.velocity = this.jump;
            }
        }, { passive: false });
        
        // Prevenir zoom en móviles con doble toque
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Prevenir el menú contextual en iOS
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    

    
    loadAssets() {
        
        const imageFiles = [
            'fonso.webp', 'mauro.webp', 'diego.webp', 'rocky.webp',
            'bajo.webp', 'baquetas.webp', 'guitarra.webp', 'micro.webp',
            'fondo.webp', 'elixeoteupersonaxe.webp', 'xogardenovo.webp', 'edificios.webp',
            'xogar.webp', 'escoitanos.webp', 'xogar2.webp', 'escoitanos2.webp'
        ];
        
        // Detectar soporte OGG Vorbis para audio optimizado
        const audio = document.createElement('audio');
        const supportsOgg = !!(audio.canPlayType && audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
        
        const soundFiles = [
            supportsOgg ? 'select.ogg' : 'select.wav',
            supportsOgg ? 'pickup.ogg' : 'pickup.wav',
            supportsOgg ? 'lose.ogg' : 'lose.wav'
            // Música eliminada - ahora usamos video de fondo
        ];
        
        this.assetsToLoad = imageFiles.length + soundFiles.length + 1; // +1 para el video
        
        // Cargar imágenes
        imageFiles.forEach(filename => {
            const img = new Image();
            img.onload = () => this.assetLoaded();
            img.onerror = () => this.assetLoaded();
            img.src = `assets/images/${filename}`;
            this.images[filename.split('.')[0]] = img;
        });
        
                // Cargar sonidos con manejo especial para iOS
        soundFiles.forEach(filename => {
            const soundName = filename.split('.')[0];
            const poolSize = this.maxAudioInstances; // Todas son efectos de sonido ahora
            
            this.audioPool[soundName] = [];
            
            // Crear múltiples instancias para efectos de sonido
            for (let i = 0; i < poolSize; i++) {
                const audio = new Audio();
                let audioLoaded = false;
                
                // Múltiples eventos para asegurar detección de carga
                const markAudioLoaded = () => {
                    if (!audioLoaded) {
                        audioLoaded = true;
                        // Solo contar el asset una vez (primera instancia)
                        if (i === 0) {
                            this.assetLoaded();
                        }
                    }
                };
                
                audio.oncanplaythrough = markAudioLoaded;
                audio.onloadeddata = markAudioLoaded;
                audio.oncanplay = markAudioLoaded;
                
                audio.onerror = () => {
                    if (!audioLoaded) {
                        audioLoaded = true;
                        if (i === 0) {
                            this.assetLoaded(); // Continuar aunque falle
                        }
                    }
                };
                
                // Timeout para iOS - si no carga en 1 segundo, continuar
                setTimeout(() => {
                    if (!audioLoaded) {
                        audioLoaded = true;
                        if (i === 0) {
                            this.assetLoaded();
                        }
                    }
                }, 1000);
                
                audio.src = `assets/sounds/${filename}`;
                audio.volume = 0.1; // Todos son efectos de sonido
                audio.preload = 'auto';
                
                this.audioPool[soundName].push(audio);
                
                // Mantener compatibilidad con código existente (primera instancia)
                if (i === 0) {
                    this.sounds[soundName] = audio;
                }
            }
        });
        
        // Cargar video de fondo
        if (this.backgroundVideo) {
            const onVideoLoaded = () => {
                if (!this.videoLoaded) {
                    this.videoLoaded = true;
                    this.assetLoaded();
                }
            };
            
            this.backgroundVideo.addEventListener('canplaythrough', onVideoLoaded);
            this.backgroundVideo.addEventListener('loadeddata', onVideoLoaded);
            
            // Timeout para continuar si el video no carga
            setTimeout(() => {
                if (!this.videoLoaded) {
                    this.videoLoaded = true;
                    this.assetLoaded();
                }
            }, 3000);
            
            // Iniciar carga del video
            this.backgroundVideo.load();
        } else {
            // Si no hay video, marcar como cargado
            this.assetLoaded();
        }
    }
    
    assetLoaded() {
        this.assetsLoadedCount++;
        
        if (this.assetsLoadedCount >= this.assetsToLoad) {
            this.assetsLoaded = true;
            this.startGame();
        }
    }
    
    startGame() {
        
        // Configurar música de fondo
        if (this.sounds.cancion) {
            this.sounds.cancion.loop = true;
            this.sounds.cancion.play().catch(() => {});
        }
        
        // Para iOS, asegurar que el canvas esté correctamente inicializado
        this.forceCanvasRedraw();
        
        console.log('🔄 Iniciando game loop...');
        this.gameLoop();
    }
    
    forceCanvasRedraw() {
        // Forzar un redibujado inicial del canvas para iOS Safari
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        this.ctx.fillStyle = this.LIGHT_BLUE;
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }
    
    gameLoop() {
        const currentTime = performance.now();
        
        // Usar un approach más flexible para iOS
        const timeSinceLastFrame = currentTime - this.lastFrameTime;
        const shouldUpdate = timeSinceLastFrame >= this.frameTime - 1; // 1ms de tolerancia
        
        if (shouldUpdate) {
            this.update();
            this.render();
            this.lastFrameTime = currentTime;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    

    
    update() {
        if (this.state === 'jugando') {
            this.updateGame();
        }
    }
    
    updateGame() {
        // Actualizar dificultad basada en puntuación
        this.updateDifficulty();
        
        // Física del pájaro
        this.velocity += this.gravity;
        this.birdY += this.velocity;
        
        // Fondo en movimiento
        this.backgroundX -= this.backgroundSpeed;
        if (this.backgroundX <= -this.images.edificios.width) {
            this.backgroundX = 0;
        }
        
        // Tubos
        for (let pipe of this.pipes) {
            pipe.x -= this.pipeSpeed;
        }
        
        // Generar nuevos tubos
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.WIDTH - 200) {
            this.pipes.push(this.createPipe());
        }
        
        // Eliminar tubos fuera de pantalla y sumar puntos
        if (this.pipes.length > 0 && this.pipes[0].x + this.pipeWidth < 0) {
            this.pipes.shift();
            this.score += 1;
        }
        
        // Verificar colisiones
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        // Generar objetos coleccionables
        if (Math.random() < 0.01 && this.pipes.length > 0) {
            const lastPipe = this.pipes[this.pipes.length - 1];
            const minY = lastPipe.height + 30;
            const maxY = lastPipe.height + this.pipeGap - 30;
            this.collectibles.push({
                x: this.WIDTH,
                y: minY + Math.random() * (maxY - minY),
                active: true
            });
        }
        
        // Actualizar coleccionables - optimizado sin splice()
        for (let i = 0; i < this.collectibles.length; i++) {
            const collectible = this.collectibles[i];
            if (collectible.active === false) continue; // Skip objetos marcados como inactivos
            
            collectible.x -= this.pipeSpeed;
            
            // Verificar recolección
            if (Math.abs(collectible.x - this.birdX) < 25 && Math.abs(collectible.y - this.birdY) < 25) {
                collectible.active = false; // Marcar como inactivo en lugar de splice
                this.playSound('pickup');
                this.score += 5;
            } else if (collectible.x < -20) {
                collectible.active = false; // Marcar como inactivo
            }
        }
        
        // Limpiar objetos inactivos solo ocasionalmente (cada 60 frames ≈ 1 segundo)
        if (!this.cleanupCounter) this.cleanupCounter = 0;
        this.cleanupCounter++;
        if (this.cleanupCounter >= 60) {
            this.collectibles = this.collectibles.filter(c => c.active !== false);
            this.cleanupCounter = 0;
        }
    }
    
    createPipe() {
        const height = 50 + Math.random() * (this.HEIGHT - this.pipeGap - 100);
        return { x: this.WIDTH, height: height };
    }
    
    checkCollision() {
        // Colisión con bordes
        if (this.birdY < 0 || this.birdY > this.HEIGHT) {
            return true;
        }
        
        // Colisión con tubos
        for (let pipe of this.pipes) {
            if (pipe.x < this.birdX + 30 && pipe.x + this.pipeWidth > this.birdX - 30) {
                if (this.birdY - 30 < pipe.height || this.birdY + 30 > pipe.height + this.pipeGap) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    async gameOver() {
        this.stopBackgroundVideo(); // Pausar el video cuando termine el juego
        this.playSound('lose');
        this.lastScore = this.score;
        
        // Enviar puntuación al servidor si el usuario está registrado
        if (this.player.isRegistered) {
            await this.submitScore(this.score);
            // Cargar ranking actualizado
            await this.fetchLeaderboard(10);
            this.showingGameOverModal = true;
        }
        
        this.state = 'fin';
    }
    
    updateDifficulty() {
        // Calcular nueva velocidad de tubos basada en puntuación
        const speedIncreases = Math.floor(this.score / this.DIFFICULTY_CONFIG.SPEED_INCREASE_EVERY);
        this.pipeSpeed = this.DIFFICULTY_CONFIG.INITIAL_PIPE_SPEED + 
                        (speedIncreases * this.DIFFICULTY_CONFIG.SPEED_INCREASE_AMOUNT);
        
        // Calcular nueva gravedad basada en puntuación
        const gravityIncreases = Math.floor(this.score / this.DIFFICULTY_CONFIG.GRAVITY_INCREASE_EVERY);
        this.gravity = this.DIFFICULTY_CONFIG.INITIAL_GRAVITY + 
                      (gravityIncreases * this.DIFFICULTY_CONFIG.GRAVITY_INCREASE_AMOUNT);
    }
    
    resetGame() {
        this.birdY = 300;
        this.velocity = 0;
        this.pipes = [];
        this.collectibles = [];
        this.score = 0;
        this.backgroundX = 0;
        
        // Resetear dificultad a valores iniciales
        this.gravity = this.DIFFICULTY_CONFIG.INITIAL_GRAVITY;
        this.pipeSpeed = this.DIFFICULTY_CONFIG.INITIAL_PIPE_SPEED;
    }
    
    handleClick(x, y) {
        if (this.state === 'inicio') {
            const xogarButton = {
                x: this.WIDTH / 2,
                y: this.HEIGHT * 0.67,
                width: 200 * this.scale,
                height: 60 * this.scale
            };
            
            const escoitanosButton = {
                x: this.WIDTH / 2,
                y: this.HEIGHT * 0.8,
                width: 200 * this.scale,
                height: 60 * this.scale
            };
            
            // Botón Xogar - verificar si usuario está registrado
            if (this.isPointInButton(x, y, xogarButton.x, xogarButton.y, xogarButton.width, xogarButton.height)) {
                this.playSound('select');
                if (this.player.isRegistered) {
                    this.state = 'menu';
                    this.fetchLeaderboard(); // Cargar ranking actual
                    this.stopBackgroundVideo(); // Pausar video al volver al menú
                } else {
                    this.showingRegistrationModal = true;
                    this.inputText = '';
                }
            }
            // Botón Escoitanos
            else if (this.isPointInButton(x, y, escoitanosButton.x, escoitanosButton.y, escoitanosButton.width, escoitanosButton.height)) {
                this.openSpotify();
            }
        }
        // Manejar modal de registro
        if (this.showingRegistrationModal) {
            // Dimensiones del modal
            const modalWidth = 350 * this.scale;
            const modalHeight = 400 * this.scale;
            const modalX = this.WIDTH / 2 - modalWidth / 2;
            const modalY = this.HEIGHT / 2 - modalHeight / 2;
            
            // Click fuera del modal para cerrar
            if (x < modalX || x > modalX + modalWidth || y < modalY || y > modalY + modalHeight) {
                this.showingRegistrationModal = false;
                return;
            }
            
            // Campo de input - activar teclado móvil
            const inputWidth = 280 * this.scale;
            const inputHeight = 50 * this.scale;
            const inputX = this.WIDTH / 2 - inputWidth / 2;
            const inputY = this.HEIGHT / 2 - 30 * this.scale;
            
            if (x >= inputX && x <= inputX + inputWidth && 
                y >= inputY && y <= inputY + inputHeight) {
                console.log('🔍 Click en campo de texto detectado');
                console.log('📱 Es móvil?', this.isMobile);
                console.log('🎯 Input element:', this.mobileInput);
                
                if (this.isMobile) {
                    // Activar input móvil
                    console.log('📝 Activando input móvil...');
                    this.mobileInput.value = this.inputText;
                    this.mobileInput.focus();
                    this.setupMobileInputListener();
                } else {
                    console.log('💻 Modo PC - input por teclado');
                }
                return;
            }
            
            // Botón Guardar
            const saveButton = {
                x: this.WIDTH / 2,
                y: this.HEIGHT / 2 + 120 * this.scale,
                width: 180 * this.scale,
                height: 50 * this.scale
            };
            
            if (this.isPointInButton(x, y, saveButton.x, saveButton.y, saveButton.width, saveButton.height)) {
                if (this.inputText.length >= 2 && this.inputText.length <= 15) {
                    this.playSound('select');
                    this.registerPlayerAsync(this.inputText);
                }
            }
            
            // Botón Cerrar (X)
            const closeButton = {
                x: modalX + modalWidth - 25 * this.scale,
                y: modalY + 25 * this.scale,
                width: 30 * this.scale,
                height: 30 * this.scale
            };
            
            if (this.isPointInButton(x, y, closeButton.x, closeButton.y, closeButton.width, closeButton.height)) {
                this.showingRegistrationModal = false;
            }
            
            return; // No procesar otros clicks cuando el modal está abierto
        }
        
        // Manejar modal de game over
        if (this.showingGameOverModal) {
            // Dimensiones del modal
            const modalWidth = 400 * this.scale;
            const modalHeight = 500 * this.scale;
            const modalX = this.WIDTH / 2 - modalWidth / 2;
            const modalY = this.HEIGHT / 2 - modalHeight / 2;
            
            // Click fuera del modal para cerrar
            if (x < modalX || x > modalX + modalWidth || y < modalY || y > modalY + modalHeight) {
                this.showingGameOverModal = false;
                return;
            }
            
            // Botón Cerrar (X)
            const closeButton = {
                x: modalX + modalWidth - 25 * this.scale,
                y: modalY + 25 * this.scale,
                width: 30 * this.scale,
                height: 30 * this.scale
            };
            
            if (this.isPointInButton(x, y, closeButton.x, closeButton.y, closeButton.width, closeButton.height)) {
                this.showingGameOverModal = false;
                return;
            }
            
            return; // No procesar otros clicks cuando el modal está abierto
        }
        
        else if (this.state === 'menu') {
            // Selección de personajes - escalado dinámicamente
            const basePositions = [[100, 240], [300, 240], [100, 400], [300, 400]];
            const positions = basePositions.map(([x, y]) => [
                x * (this.WIDTH / this.BASE_WIDTH), 
                y * (this.HEIGHT / this.BASE_HEIGHT)
            ]);
            
            for (let i = 0; i < positions.length; i++) {
                const [px, py] = positions[i];
                const hitboxSize = 40 * this.scale;
                if (x >= px - hitboxSize && x <= px + hitboxSize && 
                    y >= py - hitboxSize && y <= py + hitboxSize) {
                    this.selectedCharacter = i;
                    this.playSound('select');
                    this.resetGame();
                    this.state = 'jugando';
                    this.startBackgroundVideo(); // Iniciar video solo cuando empiece a jugar
                    break;
                }
            }
        }
        else if (this.state === 'fin') {
            const xogarButton = {
                x: this.WIDTH / 2,
                y: this.HEIGHT * 0.67,
                width: 200 * this.scale,
                height: 60 * this.scale
            };
            
            const escoitanosButton = {
                x: this.WIDTH / 2,
                y: this.HEIGHT * 0.8,
                width: 200 * this.scale,
                height: 60 * this.scale
            };
            
            // Botón Xogar de nuevo - escalado dinámicamente
            if (this.isPointInButton(x, y, xogarButton.x, xogarButton.y, xogarButton.width, xogarButton.height)) {
                this.state = 'menu';
                this.stopBackgroundVideo(); // Pausar video al volver al menú
            }
            // Botón Escoitanos
            else if (this.isPointInButton(x, y, escoitanosButton.x, escoitanosButton.y, escoitanosButton.width, escoitanosButton.height)) {
                this.openSpotify();
            }
        }
    }
    
    isPointInButton(x, y, buttonX, buttonY, width, height) {
        return x >= buttonX - width/2 && x <= buttonX + width/2 && 
               y >= buttonY - height/2 && y <= buttonY + height/2;
    }
    
    openSpotify() {
        const spotifyWebUrl = 'https://open.spotify.com/intl-es/artist/4fgMYzpV29Kq2DpFcO0p82';
        
        try {
            const newWindow = window.open(spotifyWebUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                window.location.href = spotifyWebUrl;
            }
        } catch (error) {
            window.location.href = spotifyWebUrl;
        }
    }
    
    playSound(soundName) {
        if (!this.audioPool[soundName] || this.audioPool[soundName].length === 0) return;
        
        // Debounce más agresivo para iOS
        const currentTime = performance.now();
        const minInterval = soundName === 'pickup' ? 80 : 40; // Reducido para mejor respuesta
        
        if (this.lastSoundTime[soundName] && 
            currentTime - this.lastSoundTime[soundName] < minInterval) {
            return; // Skip si es muy pronto
        }
        
        try {
            // Buscar una instancia disponible en el pool
            let availableAudio = null;
            
            for (let audio of this.audioPool[soundName]) {
                if (audio.paused || audio.ended || audio.currentTime === 0) {
                    availableAudio = audio;
                    break;
                }
            }
            
            // Si no hay disponible, usar la primera (interrumpir)
            if (!availableAudio) {
                availableAudio = this.audioPool[soundName][0];
            }
            
            // Preparar y reproducir
            availableAudio.currentTime = 0;
            const playPromise = availableAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Intento alternativo sin resetear currentTime
                    try {
                        availableAudio.play().catch(() => {});
                    } catch (e) {
                        // Silencioso
                    }
                });
            }
            
            this.lastSoundTime[soundName] = currentTime;
        } catch (e) {
            // Fallback: intentar con el método anterior
            if (this.sounds[soundName]) {
                try {
                    this.sounds[soundName].play().catch(() => {});
                } catch (fallbackError) {
                    // Silencioso
                }
            }
        }
    }
    
    startBackgroundVideo() {
        if (this.backgroundVideo && this.videoLoaded) {
            // Activar el sonido del video cuando el usuario interactúa
            this.backgroundVideo.muted = false;
            this.backgroundVideo.volume = 0.3; // Volumen moderado
            
            const playPromise = this.backgroundVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Si falla con sonido, intentar sin sonido
                    this.backgroundVideo.muted = true;
                    this.backgroundVideo.play().catch(() => {
                        console.log('No se pudo reproducir el video de fondo');
                    });
                });
            }
        }
    }
    
    stopBackgroundVideo() {
        if (this.backgroundVideo) {
            this.backgroundVideo.pause();
        }
    }
    
    // ===== SISTEMA DE USUARIO Y RANKING =====
    
    loadPlayerData() {
        try {
            const savedPlayer = localStorage.getItem('flappy_player');
            if (savedPlayer) {
                const playerData = JSON.parse(savedPlayer);
                this.player = {
                    id: playerData.id,
                    name: playerData.name,
                    bestScore: playerData.bestScore || 0,
                    isRegistered: true
                };
            } else {
                // Generar ID único para nuevo jugador
                this.player.id = this.generatePlayerId();
            }
        } catch (error) {
            console.error('Error loading player data:', error);
            this.player.id = this.generatePlayerId();
        }
    }
    
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async registerPlayer(playerName) {
        try {
            const response = await fetch('/api/register-player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: this.player.id,
                    playerName: playerName
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.player.name = playerName;
                this.player.isRegistered = true;
                
                // Guardar en localStorage
                localStorage.setItem('flappy_player', JSON.stringify({
                    id: this.player.id,
                    name: playerName,
                    bestScore: 0,
                    createdAt: new Date().toISOString()
                }));
                
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error registering player:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    async submitScore(score) {
        if (!this.player.isRegistered) return;
        
        try {
            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: this.player.id,
                    score: score,
                    gameData: {
                        character: this.selectedCharacter,
                        timestamp: new Date().toISOString()
                    }
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Actualizar mejor puntuación local
                if (score > this.player.bestScore) {
                    this.player.bestScore = score;
                    const savedPlayer = JSON.parse(localStorage.getItem('flappy_player'));
                    savedPlayer.bestScore = score;
                    localStorage.setItem('flappy_player', JSON.stringify(savedPlayer));
                }
                
                // Actualizar ranking info
                this.ranking.playerRank = result.rank;
                this.ranking.totalPlayers = result.totalPlayers;
                
                return result;
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
        return null;
    }
    
    async fetchLeaderboard(limit = 10) {
        try {
            const url = `/api/leaderboard?limit=${limit}${this.player.isRegistered ? `&playerId=${this.player.id}` : ''}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const result = await response.json();
                this.ranking.leaderboard = result.leaderboard;
                this.ranking.playerRank = result.playerRank;
                this.ranking.totalPlayers = result.totalPlayers;
                this.ranking.lastFetch = new Date();
                return result;
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
        return null;
    }
    
    async registerPlayerAsync(playerName) {
        try {
            const result = await this.registerPlayer(playerName);
            if (result.success) {
                this.showingRegistrationModal = false;
                this.state = 'menu';
                this.fetchLeaderboard(); // Cargar ranking después del registro
                this.stopBackgroundVideo(); // Pausar video al ir al menú
            } else {
                // Mostrar error (por ahora solo console)
                console.error('Error registering player:', result.error);
            }
        } catch (error) {
            console.error('Error in registerPlayerAsync:', error);
        }
    }
    
    setupMobileInputListener() {
        console.log('🔧 Configurando listeners del input móvil...');
        
        // Remover listener anterior si existe
        if (this.mobileInputListener) {
            this.mobileInput.removeEventListener('input', this.mobileInputListener);
        }
        
        // Crear nuevo listener
        this.mobileInputListener = (e) => {
            console.log('📱 Input móvil cambió:', e.target.value);
            this.inputText = e.target.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
            e.target.value = this.inputText; // Sincronizar
            console.log('📝 Texto sincronizado:', this.inputText);
        };
        
        this.mobileInput.addEventListener('input', this.mobileInputListener);
        
        // Auto-submit al presionar Enter
        const enterListener = (e) => {
            console.log('⌨️ Tecla en input móvil:', e.key);
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('↩️ Enter en input móvil - Registrando...');
                if (this.inputText.length >= 2 && this.inputText.length <= 15) {
                    this.mobileInput.blur(); // Cerrar teclado
                    this.registerPlayerAsync(this.inputText);
                }
                this.mobileInput.removeEventListener('keydown', enterListener);
            }
        };
        
        this.mobileInput.addEventListener('keydown', enterListener);
        console.log('✅ Listeners configurados');
    }
    
    render() {
        if (!this.assetsLoaded) {
            this.renderLoading();
            return;
        }
        

        
        switch (this.state) {
            case 'inicio':
                this.renderInicio();
                break;
            case 'menu':
                this.renderMenu();
                break;
            case 'ranking':
                this.renderRanking();
                break;
            case 'jugando':
                this.renderJuego();
                break;
            case 'fin':
                this.renderFin();
                break;
        }
        
        // Renderizar modales si están activos
        if (this.showingRegistrationModal) {
            this.renderRegistrationModal();
        }
        if (this.showingGameOverModal) {
            this.renderGameOverModal();
        }
    }
    
    renderLoading() {
        this.ctx.fillStyle = this.LIGHT_BLUE;
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        
        this.ctx.fillStyle = this.BLACK;
        this.ctx.font = `${Math.max(14, 16 * this.scale)}px monospace`;
        this.ctx.textAlign = 'center';
        
        const progress = (this.assetsLoadedCount / this.assetsToLoad) * 100;
        
        if (progress < 80) {
            this.ctx.fillText('Cargando imágenes...', this.WIDTH / 2, this.HEIGHT / 2);
        } else {
            this.ctx.fillText('Cargando audio...', this.WIDTH / 2, this.HEIGHT / 2);
            this.ctx.font = `${Math.max(12, 14 * this.scale)}px monospace`;
            this.ctx.fillText('(puede tardar en iOS)', this.WIDTH / 2, this.HEIGHT / 2 + 25 * this.scale);
        }
        
        this.ctx.font = `${Math.max(14, 16 * this.scale)}px monospace`;
        this.ctx.fillText(`${Math.round(progress)}%`, this.WIDTH / 2, this.HEIGHT / 2 + 50 * this.scale);
        
        // Barra de progreso
        const barWidth = this.WIDTH * 0.6;
        const barHeight = 8;
        const barX = (this.WIDTH - barWidth) / 2;
        const barY = this.HEIGHT / 2 + 70 * this.scale;
        
        // Fondo de la barra
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progreso de la barra
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(barX, barY, barWidth * (progress / 100), barHeight);
    }
    
    renderInicio() {
        if (this.images.fondo) {
            this.ctx.drawImage(this.images.fondo, 0, 0, this.WIDTH, this.HEIGHT);
        }
        
        this.drawButton(this.images.xogar, this.WIDTH / 2, this.HEIGHT * 0.67);
        this.drawButton(this.images.escoitanos, this.WIDTH / 2, this.HEIGHT * 0.8);
    }
    
    renderRegistrationModal() {
        // Overlay semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        
        // Dimensiones del modal
        const modalWidth = 350 * this.scale;
        const modalHeight = 400 * this.scale;
        const modalX = this.WIDTH / 2 - modalWidth / 2;
        const modalY = this.HEIGHT / 2 - modalHeight / 2;
        
        // Fondo del modal
        this.ctx.fillStyle = this.WHITE;
        this.ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
        
        // Borde del modal
        this.ctx.strokeStyle = this.DARK_GRAY;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
        
        // Botón cerrar (X)
        const closeX = modalX + modalWidth - 30 * this.scale;
        const closeY = modalY + 15 * this.scale;
        this.ctx.fillStyle = this.DARK_GRAY;
        this.ctx.font = `bold ${Math.floor(20 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✕', closeX, closeY + 15 * this.scale);
        
        // Título del modal
        this.ctx.fillStyle = this.DARK_GRAY;
        this.ctx.font = `bold ${Math.floor(24 * this.scale)}px Arial`;
        this.ctx.fillText('🎸 BANDA FLAPPY', this.WIDTH / 2, modalY + 60 * this.scale);
        
        // Subtítulo
        this.ctx.font = `${Math.floor(18 * this.scale)}px Arial`;
        this.ctx.fillText('👤 ¡Bienvenido/a nuevo jugador!', this.WIDTH / 2, modalY + 100 * this.scale);
        
        // Instrucción
        this.ctx.font = `${Math.floor(16 * this.scale)}px Arial`;
        this.ctx.fillText('📝 Introduce tu nombre:', this.WIDTH / 2, modalY + 140 * this.scale);
        
        // Campo de texto
        const inputWidth = 280 * this.scale;
        const inputHeight = 50 * this.scale;
        const inputX = this.WIDTH / 2 - inputWidth / 2;
        const inputY = this.HEIGHT / 2 - 30 * this.scale;
        
        // Fondo del input
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(inputX, inputY, inputWidth, inputHeight);
        
        // Borde del input
        this.ctx.strokeStyle = this.inputText.length >= 2 ? this.GREEN : this.DARK_GRAY;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(inputX, inputY, inputWidth, inputHeight);
        
        // Texto del input
        this.ctx.fillStyle = this.BLACK;
        this.ctx.font = `${Math.floor(18 * this.scale)}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.inputText, inputX + 15 * this.scale, inputY + inputHeight / 2 + 6 * this.scale);
        
        // Cursor parpadeante
        if (Math.floor(Date.now() / 500) % 2) {
            const textWidth = this.ctx.measureText(this.inputText).width;
            this.ctx.fillRect(inputX + 15 * this.scale + textWidth + 2, inputY + 12 * this.scale, 2, inputHeight - 24 * this.scale);
        }
        
        // Botón Guardar
        const buttonY = this.HEIGHT / 2 + 120 * this.scale;
        const buttonEnabled = this.inputText.length >= 2 && this.inputText.length <= 15;
        
        // Fondo del botón
        this.ctx.fillStyle = buttonEnabled ? this.GREEN : this.DARK_GRAY;
        const buttonWidth = 180 * this.scale;
        const buttonHeight = 50 * this.scale;
        this.ctx.fillRect(this.WIDTH / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
        
        // Texto del botón
        this.ctx.fillStyle = this.WHITE;
        this.ctx.font = `bold ${Math.floor(16 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💾 GUARDAR Y JUGAR', this.WIDTH / 2, buttonY + 5 * this.scale);
        
        // Información
        this.ctx.fillStyle = this.DARK_GRAY;
        this.ctx.font = `${Math.floor(12 * this.scale)}px Arial`;
        this.ctx.fillText(`(${this.inputText.length}/15 caracteres)`, this.WIDTH / 2, modalY + modalHeight - 40 * this.scale);
        
        // Instrucción específica para móvil
        if (this.isMobile) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = `${Math.floor(11 * this.scale)}px Arial`;
            this.ctx.fillText('📱 Toca el campo de texto para escribir', this.WIDTH / 2, modalY + modalHeight - 20 * this.scale);
        }
    }
    
    renderGameOverModal() {
        // Overlay semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        
        // Dimensiones del modal
        const modalWidth = 400 * this.scale;
        const modalHeight = 500 * this.scale;
        const modalX = this.WIDTH / 2 - modalWidth / 2;
        const modalY = this.HEIGHT / 2 - modalHeight / 2;
        
        // Fondo del modal
        this.ctx.fillStyle = this.WHITE;
        this.ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
        
        // Borde del modal
        this.ctx.strokeStyle = this.DARK_GRAY;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
        
        // Botón cerrar (X)
        const closeX = modalX + modalWidth - 30 * this.scale;
        const closeY = modalY + 15 * this.scale;
        this.ctx.fillStyle = this.DARK_GRAY;
        this.ctx.font = `bold ${Math.floor(20 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✕', closeX, closeY + 15 * this.scale);
        
        // Título del modal
        this.ctx.fillStyle = this.DARK_GRAY;
        this.ctx.font = `bold ${Math.floor(24 * this.scale)}px Arial`;
        this.ctx.fillText('💀 GAME OVER', this.WIDTH / 2, modalY + 50 * this.scale);
        
        // Tu puntuación
        this.ctx.font = `bold ${Math.floor(20 * this.scale)}px Arial`;
        this.ctx.fillText(`🎯 Tu puntuación: ${this.lastScore}`, this.WIDTH / 2, modalY + 90 * this.scale);
        
        // Título del ranking
        this.ctx.font = `bold ${Math.floor(18 * this.scale)}px Arial`;
        this.ctx.fillText('🏆 RANKING ACTUAL', this.WIDTH / 2, modalY + 130 * this.scale);
        
        // Mostrar top 5 del ranking
        const startY = modalY + 160 * this.scale;
        const lineHeight = 25 * this.scale;
        
        for (let i = 0; i < Math.min(5, this.ranking.leaderboard.length); i++) {
            const player = this.ranking.leaderboard[i];
            const y = startY + i * lineHeight;
            
            // Destacar al jugador actual
            const isCurrentPlayer = player.playerId === this.player.id;
            this.ctx.fillStyle = isCurrentPlayer ? this.GREEN : this.DARK_GRAY;
            
            // Emoji de posición
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;
            
            this.ctx.font = `${isCurrentPlayer ? 'bold ' : ''}${Math.floor(16 * this.scale)}px Arial`;
            this.ctx.textAlign = 'left';
            
            const text = `${medal} ${player.name}`;
            this.ctx.fillText(text, modalX + 20 * this.scale, y);
            
            // Puntuación alineada a la derecha
            this.ctx.textAlign = 'right';
            this.ctx.fillText(player.score.toString(), modalX + modalWidth - 20 * this.scale, y);
        }
        
        // Tu posición si no estás en el top 5
        if (this.ranking.playerRank && this.ranking.playerRank.rank > 5) {
            const y = startY + 6 * lineHeight;
            this.ctx.fillStyle = this.GREEN;
            this.ctx.font = `bold ${Math.floor(16 * this.scale)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`➡️ Tu posición: #${this.ranking.playerRank.rank} de ${this.ranking.totalPlayers}`, this.WIDTH / 2, y);
        }
        
        // Información adicional
        this.ctx.fillStyle = '#666';
        this.ctx.font = `${Math.floor(12 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Total de jugadores: ${this.ranking.totalPlayers}`, this.WIDTH / 2, modalY + modalHeight - 30 * this.scale);
        this.ctx.fillText('🖱️ Click fuera para cerrar', this.WIDTH / 2, modalY + modalHeight - 10 * this.scale);
    }
    
    renderMenu() {
        if (this.images.elixeoteupersonaxe) {
            this.ctx.drawImage(this.images.elixeoteupersonaxe, 0, 0, this.WIDTH, this.HEIGHT);
        }
        
        const names = ['FONSO', 'MAURO', 'DIEGO', 'ROCKY'];
        const taglines = ['HOPPUS', 'DE LOURO', 'DOBRE BREAK', 'O BERRIDOS'];
        const basePositions = [[100, 240], [300, 240], [100, 400], [300, 400]];
        const characters = ['fonso', 'mauro', 'diego', 'rocky'];
        
        // Escalar posiciones y tamaños
        const positions = basePositions.map(([x, y]) => [
            x * (this.WIDTH / this.BASE_WIDTH), 
            y * (this.HEIGHT / this.BASE_HEIGHT)
        ]);
        
        for (let i = 0; i < positions.length; i++) {
            const [x, y] = positions[i];
            const charSize = 80 * this.scale;
            
            if (this.images[characters[i]]) {
                this.ctx.drawImage(this.images[characters[i]], 
                    x - charSize/2, y - charSize/2, charSize, charSize);
            }
            
            this.ctx.fillStyle = this.WHITE;
            this.ctx.font = `${Math.max(12, 16 * this.scale)}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(names[i], x, y + 60 * this.scale);
            
            this.ctx.fillStyle = this.YELLOW;
            this.ctx.fillText(taglines[i], x, y + 80 * this.scale);
        }
    }
    
    renderJuego() {
        // Fondo - Video o color de respaldo
        if (this.backgroundVideo && this.videoLoaded && this.backgroundVideo.readyState >= 2) {
            // Dibujar el video escalado para llenar el canvas
            this.ctx.drawImage(this.backgroundVideo, 0, 0, this.WIDTH, this.HEIGHT);
        } else {
            // Fondo de respaldo si el video no está listo
            this.ctx.fillStyle = this.LIGHT_BLUE;
            this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        }
        
        // Los edificios se quitan ya que el video es el fondo completo
        
        // Pájaro
        const characters = ['fonso', 'mauro', 'diego', 'rocky'];
        if (this.images[characters[this.selectedCharacter]]) {
            this.ctx.drawImage(this.images[characters[this.selectedCharacter]], 
                             this.birdX - 30, this.birdY - 30, 60, 60);
        }
        
        // Tubos
        this.ctx.fillStyle = this.GREEN;
        for (let pipe of this.pipes) {
            // Tubo superior
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.height);
            // Tubo inferior
            this.ctx.fillRect(pipe.x, pipe.height + this.pipeGap, this.pipeWidth, 
                            this.HEIGHT - pipe.height - this.pipeGap);
        }
        
        // Objetos coleccionables
        const objects = ['bajo', 'baquetas', 'guitarra', 'micro'];
        for (let collectible of this.collectibles) {
            if (collectible.active !== false && this.images[objects[this.selectedCharacter]]) {
                this.ctx.drawImage(this.images[objects[this.selectedCharacter]], 
                                 collectible.x - 16, collectible.y - 16, 32, 32);
            }
        }
        
        // Puntuación
        this.ctx.fillStyle = this.BLACK;
        this.ctx.font = `${Math.max(12, 16 * this.scale)}px monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Puntos: ${this.score}`, 10 * this.scale, 30 * this.scale);
        

    }
    
    renderFin() {
        if (this.images.xogardenovo) {
            this.ctx.drawImage(this.images.xogardenovo, 0, 0, this.WIDTH, this.HEIGHT);
        }
        
        this.drawButton(this.images.xogar2, this.WIDTH / 2, this.HEIGHT * 0.67);
        this.drawButton(this.images.escoitanos2, this.WIDTH / 2, this.HEIGHT * 0.8);
        
        // Mostrar puntuación final
        this.ctx.fillStyle = this.WHITE;
        this.ctx.font = `${Math.max(16, 20 * this.scale)}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Puntuación: ${this.lastScore}`, this.WIDTH / 2, this.HEIGHT * 0.58);
    }
    
    drawButton(image, x, y) {
        if (image) {
            const baseWidth = 200;
            const scaledWidth = baseWidth * this.scale;
            const buttonScale = scaledWidth / image.width;
            const width = scaledWidth;
            const height = image.height * buttonScale;
            this.ctx.drawImage(image, x - width/2, y - height/2, width, height);
        }
    }
}

// Inicializar el juego cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    const game = new FlappyGame('flappy-game');
});