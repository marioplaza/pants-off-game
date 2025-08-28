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
            if (e.code === 'Space') {
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
            supportsOgg ? 'lose.ogg' : 'lose.wav',
            'cancion.mp3'  // MP3 tiene soporte universal
        ];
        
        this.assetsToLoad = imageFiles.length + soundFiles.length;
        
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
            const audio = new Audio();
            
            let audioLoaded = false;
            
            // Múltiples eventos para asegurar detección de carga
            const markAudioLoaded = () => {
                if (!audioLoaded) {
                    audioLoaded = true;
                    this.assetLoaded();
                }
            };
            
            audio.oncanplaythrough = markAudioLoaded;
            audio.onloadeddata = markAudioLoaded;
            audio.oncanplay = markAudioLoaded;
            
            audio.onerror = () => {
                if (!audioLoaded) {
                    audioLoaded = true;
                    this.assetLoaded(); // Continuar aunque falle
                }
            };
            
            // Timeout para iOS - si no carga en 1 segundo, continuar
            setTimeout(() => {
                if (!audioLoaded) {
                    audioLoaded = true;
                    this.assetLoaded();
                }
            }, 1000);
            
            audio.src = `assets/sounds/${filename}`;
            audio.volume = filename === 'cancion.mp3' ? 0.2 : 0.1;
            audio.preload = 'auto';
            this.sounds[filename.split('.')[0]] = audio;
        });
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
                y: minY + Math.random() * (maxY - minY)
            });
        }
        
        // Actualizar coleccionables
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.x -= this.pipeSpeed;
            
            // Verificar recolección
            if (Math.abs(collectible.x - this.birdX) < 25 && Math.abs(collectible.y - this.birdY) < 25) {
                this.collectibles.splice(i, 1);
                this.playSound('pickup');
                this.score += 5;
            } else if (collectible.x < -20) {
                this.collectibles.splice(i, 1);
            }
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
    
    gameOver() {
        this.stopMusic();
        this.playSound('lose');
        this.lastScore = this.score;
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
            
            // Botón Xogar - escalado dinámicamente
            if (this.isPointInButton(x, y, xogarButton.x, xogarButton.y, xogarButton.width, xogarButton.height)) {
                this.state = 'menu';
                this.playMusic();
            }
            // Botón Escoitanos
            else if (this.isPointInButton(x, y, escoitanosButton.x, escoitanosButton.y, escoitanosButton.width, escoitanosButton.height)) {
                this.openSpotify();
            }
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
                this.playMusic();
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
        if (this.sounds[soundName]) {
            try {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(() => {});
            } catch (e) {
                // Silencioso
            }
        }
    }
    
    playMusic() {
        if (this.sounds.cancion) {
            this.sounds.cancion.play().catch(() => {});
        }
    }
    
    stopMusic() {
        if (this.sounds.cancion) {
            this.sounds.cancion.pause();
        }
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
            case 'jugando':
                this.renderJuego();
                break;
            case 'fin':
                this.renderFin();
                break;
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
        // Fondo
        this.ctx.fillStyle = this.LIGHT_BLUE;
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        
        // Edificios de fondo
        if (this.images.edificios) {
            const img = this.images.edificios;
            const scale = 0.5;
            const scaledHeight = img.height * scale;
            const y = this.HEIGHT - scaledHeight;
            
            this.ctx.drawImage(img, this.backgroundX, y, img.width * scale, scaledHeight);
            this.ctx.drawImage(img, this.backgroundX + img.width * scale, y, img.width * scale, scaledHeight);
        }
        
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
            if (this.images[objects[this.selectedCharacter]]) {
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