class FlappyGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // ===== CONFIGURACIÓN DE DIFICULTAD PROGRESIVA =====
        // ¡Modifica estos valores para ajustar la dificultad!
        this.DIFFICULTY_CONFIG = {
            // Velocidad inicial de tubos
            INITIAL_PIPE_SPEED: 3,
            // Cada cuántos puntos aumenta la velocidad de tubos
            SPEED_INCREASE_EVERY: 10,
            // Cuánto aumenta la velocidad de tubos cada vez
            SPEED_INCREASE_AMOUNT: 0.2,
            
            // Gravedad inicial
            INITIAL_GRAVITY: 0.3,
            // Cada cuántos puntos aumenta la gravedad
            GRAVITY_INCREASE_EVERY: 25,
            // Cuánto aumenta la gravedad cada vez
            GRAVITY_INCREASE_AMOUNT: 0.05
        };
        
        // Configuración básica
        this.WIDTH = 400;
        this.HEIGHT = 600;
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        
        this.FPS = 60;
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
    
    init() {
        this.setupEventListeners();
        this.loadAssets();
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
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.clicked = true;
            this.handleClick(this.mouse.x, this.mouse.y);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
        });
        
        // Touch para móviles
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.handleClick(this.mouse.x, this.mouse.y);
            
            if (this.state === 'jugando') {
                this.velocity = this.jump;
            }
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
        
        // Cargar sonidos
        soundFiles.forEach(filename => {
            const audio = new Audio();
            audio.oncanplaythrough = () => this.assetLoaded();
            audio.onerror = () => this.assetLoaded();
            audio.src = `assets/sounds/${filename}`;
            audio.volume = filename === 'cancion.mp3' ? 0.2 : 0.1;
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
            this.sounds.cancion.play().catch(e => console.log('No se pudo reproducir la música:', e));
        }
        
        this.gameLoop();
    }
    
    gameLoop() {
        const currentTime = performance.now();
        
        if (currentTime - this.lastFrameTime >= this.frameTime) {
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
            // Botón Xogar
            if (this.isPointInButton(x, y, this.WIDTH / 2, 400, 200, 60)) {
                this.state = 'menu';
                this.playMusic();
            }
            // Botón Escoitanos
            else if (this.isPointInButton(x, y, this.WIDTH / 2, 480, 200, 60)) {
                this.openSpotify();
            }
        }
        else if (this.state === 'menu') {
            // Selección de personajes
            const positions = [[100, 240], [300, 240], [100, 400], [300, 400]];
            for (let i = 0; i < positions.length; i++) {
                const [px, py] = positions[i];
                if (x >= px - 40 && x <= px + 40 && y >= py - 40 && y <= py + 40) {
                    this.selectedCharacter = i;
                    this.playSound('select');
                    this.resetGame();
                    this.state = 'jugando';
                    break;
                }
            }
        }
        else if (this.state === 'fin') {
            // Botón Xogar de nuevo
            if (this.isPointInButton(x, y, this.WIDTH / 2, 400, 200, 60)) {
                this.state = 'menu';
                this.playMusic();
            }
            // Botón Escoitanos
            else if (this.isPointInButton(x, y, this.WIDTH / 2, 480, 200, 60)) {
                this.openSpotify();
            }
        }
    }
    
    isPointInButton(x, y, buttonX, buttonY, width, height) {
        return x >= buttonX - width/2 && x <= buttonX + width/2 && 
               y >= buttonY - height/2 && y <= buttonY + height/2;
    }
    
    openSpotify() {
        window.open('https://open.spotify.com/intl-es/artist/4fgMYzpV29Kq2DpFcO0p82', '_blank');
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Error reproduciendo sonido:', e));
        }
    }
    
    playMusic() {
        if (this.sounds.cancion) {
            this.sounds.cancion.play().catch(e => console.log('Error reproduciendo música:', e));
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
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Cargando...', this.WIDTH / 2, this.HEIGHT / 2);
        
        const progress = (this.assetsLoadedCount / this.assetsToLoad) * 100;
        this.ctx.fillText(`${Math.round(progress)}%`, this.WIDTH / 2, this.HEIGHT / 2 + 30);
    }
    
    renderInicio() {
        if (this.images.fondo) {
            this.ctx.drawImage(this.images.fondo, 0, 0, this.WIDTH, this.HEIGHT);
        }
        
        this.drawButton(this.images.xogar, this.WIDTH / 2, 400);
        this.drawButton(this.images.escoitanos, this.WIDTH / 2, 480);
    }
    
    renderMenu() {
        if (this.images.elixeoteupersonaxe) {
            this.ctx.drawImage(this.images.elixeoteupersonaxe, 0, 0, this.WIDTH, this.HEIGHT);
        }
        
        const names = ['FONSO', 'MAURO', 'DIEGO', 'ROCKY'];
        const taglines = ['HOPPUS', 'DE LOURO', 'DOBRE BREAK', 'O BERRIDOS'];
        const positions = [[100, 240], [300, 240], [100, 400], [300, 400]];
        const characters = ['fonso', 'mauro', 'diego', 'rocky'];
        
        for (let i = 0; i < positions.length; i++) {
            const [x, y] = positions[i];
            
            if (this.images[characters[i]]) {
                this.ctx.drawImage(this.images[characters[i]], x - 40, y - 40, 80, 80);
            }
            
            this.ctx.fillStyle = this.WHITE;
            this.ctx.font = '16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(names[i], x, y + 60);
            
            this.ctx.fillStyle = this.YELLOW;
            this.ctx.fillText(taglines[i], x, y + 80);
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
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Puntos: ${this.score}`, 10, 30);
    }
    
    renderFin() {
        if (this.images.xogardenovo) {
            this.ctx.drawImage(this.images.xogardenovo, 0, 0, this.WIDTH, this.HEIGHT);
        }
        
        this.drawButton(this.images.xogar2, this.WIDTH / 2, 400);
        this.drawButton(this.images.escoitanos2, this.WIDTH / 2, 480);
        
        // Mostrar puntuación final
        this.ctx.fillStyle = this.WHITE;
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Puntuación: ${this.lastScore}`, this.WIDTH / 2, 350);
    }
    
    drawButton(image, x, y) {
        if (image) {
            const scale = 200 / image.width;
            const width = 200;
            const height = image.height * scale;
            this.ctx.drawImage(image, x - width/2, y - height/2, width, height);
        }
    }
}

// Inicializar el juego cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    const game = new FlappyGame('flappy-game');
});