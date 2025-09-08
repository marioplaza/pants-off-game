import { AssetLoader } from '../AssetLoader.js';
import { PlayerManager } from '../PlayerManager.js';
import { ApiService } from '../ApiService.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // Recibir personaje seleccionado
        this.selectedCharacter = data.selectedCharacter || 'fonso';
        this.selectedInstrument = AssetLoader.getInstrumentForCharacter(this.selectedCharacter);
        // console.log(`Iniciando juego con ${this.selectedCharacter} - instrumento: ${this.selectedInstrument}`);
        
        // Inicializar sistemas de jugador y API
        this.playerManager = new PlayerManager();
        this.apiService = new ApiService();
    }

    preload() {
        // console.log('GameScene: Assets ya cargados');
    }

    create() {
        // console.log('GameScene: Creando juego...');
        
        // Limpiar cualquier modal residual del DOM como medida de seguridad
        const existingModal = document.getElementById('name-input-container');
        if (existingModal) {
            // console.log('🧹 GameScene: Limpiando modal residual...');
            existingModal.remove();
        }
        
        // ===== CONFIGURACIÓN DE DIFICULTAD PROGRESIVA =====
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
            GRAVITY_INCREASE_AMOUNT: 0.05,
            
            // Espacio inicial entre barras (más fácil al principio)
            INITIAL_PIPE_GAP: 290,
            // Cada cuántos puntos se reduce el espacio
            GAP_DECREASE_EVERY: 15,
            // Cuánto se reduce el espacio cada vez
            GAP_DECREASE_AMOUNT: 5,
            // Mínimo espacio entre barras (no imposible)
            MINIMUM_PIPE_GAP: 200
        };
        
        // Variables del juego
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        
        // Variables de dificultad
        this.pipeSpeed = this.DIFFICULTY_CONFIG.INITIAL_PIPE_SPEED;
        this.pipeGap = this.DIFFICULTY_CONFIG.INITIAL_PIPE_GAP;
        this.currentGravity = this.DIFFICULTY_CONFIG.INITIAL_GRAVITY;
        
        // Configurar video de fondo
        this.setupBackgroundVideo();
        // Manejar resize
        this.scale.on('resize', (gameSize) => {
            this.cameras.resize(gameSize.width, gameSize.height);
            this.layoutBackgroundVideoCover();
        });
        // Reaplicar layout al recuperar foco/visibilidad (soluciona primer render)
        this._onVisibilityChange = () => {
            if (!document.hidden) {
                if (this.scale && this.scale.refresh) {
                    this.scale.refresh();
                }
                this.layoutBackgroundVideoCover();
            }
        };
        this._onWindowFocus = () => {
            if (this.scale && this.scale.refresh) {
                this.scale.refresh();
            }
            this.layoutBackgroundVideoCover();
        };
        document.addEventListener('visibilitychange', this._onVisibilityChange);
        window.addEventListener('focus', this._onWindowFocus);
        
        // Crear límites visuales
        this.createBoundaries();
        
        // Crear fondo de edificios (parallax)
        this.createBuildingsBackground();
        
        // Configurar física del mundo
        this.physics.world.gravity.y = this.currentGravity * 600; // Convertir a escala Phaser
        
        // Crear pájaro
        this.createBird();
        
        // Crear grupos para elementos del juego
        this.pipes = this.physics.add.group();
        this.collectibles = this.physics.add.group();
        
        // Configurar controles
        this.setupControls();
        
        // Crear UI
        this.createUI();
        
        // Configurar colisiones
        this.setupCollisions();
        
        // Timer para generar tubos
        this.pipeTimer = this.time.addEvent({
            delay: 2000, // Cada 2 segundos
            callback: this.addPipe,
            callbackScope: this,
            loop: true,
            paused: true // Pausado hasta que empiece el juego
        });
        
        // console.log('Timer de tubos configurado');
        
        // Timer para generar coleccionables
        this.collectibleTimer = this.time.addEvent({
            delay: 2000,
            callback: this.maybeAddCollectible,
            callbackScope: this,
            loop: true,
            paused: true
        });
        
        // Iniciar música del juego
        this.startGameMusic();
        
        // Mostrar instrucciones iniciales
        this.showStartInstructions();
    }
    
    setupBackgroundVideo() {
        // Crear video de fondo y configurar reproducción
        this.backgroundVideo = this.add.video(0, 0, 'background-video');
        this.backgroundVideo.setOrigin(0, 0);
        this.backgroundVideo.setLoop(true);
        this.backgroundVideo.setMute(true); // Sin sonido
        this.backgroundVideo.play();
        // Asegurar que esté en el fondo
        this.backgroundVideo.setDepth(-1);
        
        // Aplicar layout inmediatamente con fallbacks
        const applyLayout = () => this.layoutBackgroundVideoCover();
        
        // Obtener referencia al elemento HTML del video
        const htmlVideo = this.backgroundVideo.video || (this.backgroundVideo.getVideo && this.backgroundVideo.getVideo());
        
        if (htmlVideo) {
            // Múltiples eventos para iOS Safari
            htmlVideo.addEventListener('loadedmetadata', applyLayout, { once: true });
            htmlVideo.addEventListener('loadeddata', applyLayout, { once: true });
            htmlVideo.addEventListener('canplay', applyLayout, { once: true });
            htmlVideo.addEventListener('canplaythrough', applyLayout, { once: true });
            
            // Para iOS: también escuchar cuando el video realmente empiece
            htmlVideo.addEventListener('playing', applyLayout, { once: true });
            
            // Si ya está listo, aplicar inmediatamente
            if (htmlVideo.readyState >= 1) {
                applyLayout();
            }
        }
        
        // Reforzar layout con más intentos y tiempos más largos para móviles
        this.time.delayedCall(50, applyLayout);
        this.time.delayedCall(100, applyLayout);
        this.time.delayedCall(300, applyLayout);
        this.time.delayedCall(500, applyLayout);
        this.time.delayedCall(1000, applyLayout);
        this.time.delayedCall(2000, applyLayout); // Para conexiones lentas en móviles
        
        // También aplicar layout cuando el juego recupere el foco (común en móviles)
        this._onGameFocus = () => {
            this.time.delayedCall(50, applyLayout);
            this.time.delayedCall(200, applyLayout);
        };
        
        window.addEventListener('focus', this._onGameFocus);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this._onGameFocus();
            }
        });
        
        // console.log('Video de fondo configurado con mejoras para móviles');
    }

    layoutBackgroundVideoCover() {
        if (!this.backgroundVideo) return;
        
        const width = this.scale.width;
        const height = this.scale.height;
        const htmlVideo = this.backgroundVideo.video || (this.backgroundVideo.getVideo && this.backgroundVideo.getVideo());
        
        let videoWidth = 400;
        let videoHeight = 600;
        
        // Mejorar detección de dimensiones del video para móviles
        if (htmlVideo) {
            // Intentar múltiples formas de obtener las dimensiones
            if (htmlVideo.videoWidth && htmlVideo.videoHeight) {
                videoWidth = htmlVideo.videoWidth;
                videoHeight = htmlVideo.videoHeight;
            } else if (htmlVideo.naturalWidth && htmlVideo.naturalHeight) {
                videoWidth = htmlVideo.naturalWidth;
                videoHeight = htmlVideo.naturalHeight;
            } else if (htmlVideo.clientWidth && htmlVideo.clientHeight) {
                videoWidth = htmlVideo.clientWidth;
                videoHeight = htmlVideo.clientHeight;
            }
            
            // Debug para iOS: mostrar qué dimensiones detectamos
            // console.log(`Video dimensions detected: ${videoWidth}x${videoHeight} (readyState: ${htmlVideo.readyState})`);
            
            // En iOS a veces las dimensiones son 0 inicialmente, usar fallback
            if (videoWidth === 0 || videoHeight === 0) {
                videoWidth = 400;
                videoHeight = 600;
                // console.log('Using fallback dimensions for video');
            }
        }
        
        const scale = Math.max(width / videoWidth, height / videoHeight);
        const bleed = 2;
        const displayWidth = Math.ceil(videoWidth * scale) + bleed * 2;
        const displayHeight = Math.ceil(videoHeight * scale) + bleed * 2;
        const posX = Math.floor((width - displayWidth) / 2) - bleed;
        const posY = Math.floor((height - displayHeight) / 2) - bleed;
        
        // Forzar repaint en iOS Safari
        this.backgroundVideo.setVisible(false);
        this.backgroundVideo.setPosition(posX, posY);
        this.backgroundVideo.setDisplaySize(displayWidth, displayHeight);
        this.backgroundVideo.setVisible(true);
        
        // console.log(`Video layout applied: ${displayWidth}x${displayHeight} at (${posX}, ${posY}), scale: ${scale}`);
    }

    shutdownVideoLayoutHandlers() {
        if (this._onVisibilityChange) {
            document.removeEventListener('visibilitychange', this._onVisibilityChange);
            this._onVisibilityChange = null;
        }
        if (this._onWindowFocus) {
            window.removeEventListener('focus', this._onWindowFocus);
            this._onWindowFocus = null;
        }
        if (this._onGameFocus) {
            window.removeEventListener('focus', this._onGameFocus);
            this._onGameFocus = null;
        }
    }
    
    createBoundaries() {
        // NO crear límites visuales - solo usar detección por posición Y
        // console.log('Sin límites visuales - detección por coordenadas');
    }
    
    createBuildingsBackground() {
        // Crear dos imágenes de edificios más pequeñas para efecto infinito
        this.buildings1 = this.add.image(0, 600, 'edificios');
        this.buildings1.setOrigin(0, 1); // Origen en esquina inferior izquierda
        this.buildings1.setScale(0.35); // Un poco más pequeños
        this.buildings1.setDepth(0); // Por encima del video pero debajo de obstáculos
        
        // Segunda imagen pegada exactamente al final de la primera
        const scaledWidth = this.buildings1.width * 0.35;
        this.buildings2 = this.add.image(scaledWidth, 600, 'edificios');
        this.buildings2.setOrigin(0, 1);
        this.buildings2.setScale(0.35);
        this.buildings2.setDepth(0);
        
        // Velocidad de movimiento más lenta para efecto parallax
        this.buildingsSpeed = 2;
        
        // console.log(`Fondo de edificios creado - Ancho escalado: ${scaledWidth}px`);
    }
    
    createBird() {
        // Crear pájaro con el personaje seleccionado - Tamaño original del juego
        this.bird = this.physics.add.sprite(100, 300, this.selectedCharacter);
        this.bird.setDisplaySize(60, 60); // Tamaño 60x60 como en el original
        this.bird.setCollideWorldBounds(true);
        this.bird.body.setSize(60, 60); // Ajustar hitbox
        
        // Configurar física del pájaro
        this.bird.body.setGravityY(0); // La gravedad se aplicará manualmente
        this.bird.body.setBounce(0.2);
        this.bird.body.setMaxVelocityY(600);
        
        // console.log(`Pájaro creado: ${this.selectedCharacter}`);
    }
    
    setupControls() {
        // Controles de teclado
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Controles táctiles
        this.input.on('pointerdown', this.jump, this);
        
        // Eventos de teclado
        this.spaceKey.on('down', this.jump, this);
    }
    
    createUI() {
        // Puntuación
        this.scoreText = this.add.text(200, 50, 'Puntuación: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);
        

    }
    
    setupCollisions() {
        // Las colisiones con tubos y coleccionables se verifican manualmente
        // en checkPipeCollisions() y checkCollectibleCollisions()
        
        // Los límites se detectan por posición Y en update()
    }
    
    showStartInstructions() {
        this.instructionText = this.add.text(200, 200, 'Presiona ESPACIO para empezar', {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);
        
        // Hacer que parpadee
        this.tweens.add({
            targets: this.instructionText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    startGameMusic() {
        // La música melodia.mp3 ya está sonando desde MainMenu
        // No hacer nada para mantener continuidad
        // console.log('Música ya está sonando desde el menú - continuando');
    }
    

    
    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Actualizar dificultad
        this.updateDifficulty();
        
        // Aplicar gravedad manual al pájaro
        this.bird.body.setVelocityY(this.bird.body.velocity.y + this.currentGravity * 10);
        
        // Verificar límites de pantalla manualmente
        this.checkBounds();
        
        // Mover edificios (parallax)
        this.updateBuildings();
        
        // Mover tubos manualmente (sin física)
        this.updatePipes();
        
        // Verificar colisiones con tubos manualmente
        this.checkPipeCollisions();
        
        // Verificar colisiones con coleccionables manualmente
        this.checkCollectibleCollisions();
        
        // Limpiar elementos fuera de pantalla
        this.cleanupOffscreenElements();
        

    }
    
    updateBuildings() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Mover edificios hacia la izquierda más lento que los obstáculos (efecto parallax)
        this.buildings1.x -= this.buildingsSpeed;
        this.buildings2.x -= this.buildingsSpeed;
        
        // Reposicionar cuando salgan de pantalla para efecto infinito (ajustado para escala 0.35)
        const scaledWidth = this.buildings1.width * 0.35;
        if (this.buildings1.x + scaledWidth <= 0) {
            this.buildings1.x = this.buildings2.x + scaledWidth;
        }
        if (this.buildings2.x + scaledWidth <= 0) {
            this.buildings2.x = this.buildings1.x + scaledWidth;
        }
    }
    
    updatePipes() {
        // Mover tubos
        if (this.pipeArray) {
            for (let i = this.pipeArray.length - 1; i >= 0; i--) {
                const pipe = this.pipeArray[i];
                if (!pipe || !pipe.active) continue;
                
                // Mover horizontalmente hacia la izquierda
                pipe.x -= pipe.pipeSpeed;
                
                // Verificar puntuación (solo para tubos superiores)
                if (pipe.isTopPipe && !pipe.scored && pipe.x + 30 < this.bird.x) {
                    this.score += 1;
                    this.scoreText.setText('Puntuación: ' + this.score);
                    pipe.scored = true;
                    // console.log(`¡Punto! Puntuación: ${this.score}`);
                }
                
                // Eliminar tubos que salen de pantalla
                if (pipe.x < -50) {
                    pipe.destroy();
                    this.pipeArray.splice(i, 1);
                }
            }
        }
        
        // Mover coleccionables
        if (this.collectibleArray) {
            for (let i = this.collectibleArray.length - 1; i >= 0; i--) {
                const collectible = this.collectibleArray[i];
                if (!collectible || !collectible.active) continue;
                
                // Mover horizontalmente hacia la izquierda (mismo movimiento que tubos)
                collectible.x -= collectible.pipeSpeed;
                
                // Eliminar coleccionables que salen de pantalla
                if (collectible.x < -50) {
                    collectible.destroy();
                    this.collectibleArray.splice(i, 1);
                }
            }
        }
    }
    
    checkPipeCollisions() {
        if (!this.pipeArray) return;
        
        const birdBounds = {
            x: this.bird.x - 20,
            y: this.bird.y - 20,
            width: 40,
            height: 40
        };
        
        for (let pipe of this.pipeArray) {
            if (!pipe || !pipe.active) continue;
            
            const pipeBounds = {
                x: pipe.x - 30,
                y: pipe.y - pipe.displayHeight/2,
                width: 60,
                height: pipe.displayHeight
            };
            
            // Verificar colisión rectangular
            if (birdBounds.x < pipeBounds.x + pipeBounds.width &&
                birdBounds.x + birdBounds.width > pipeBounds.x &&
                birdBounds.y < pipeBounds.y + pipeBounds.height &&
                birdBounds.y + birdBounds.height > pipeBounds.y) {
                
                // console.log('¡Colisión con tubo detectada!');
                this.hitPipe();
                return;
            }
        }
    }
    
    checkCollectibleCollisions() {
        if (!this.collectibleArray) return;
        
        const birdBounds = {
            x: this.bird.x - 20,
            y: this.bird.y - 20,
            width: 40,
            height: 40
        };
        
        for (let i = this.collectibleArray.length - 1; i >= 0; i--) {
            const collectible = this.collectibleArray[i];
            if (!collectible || !collectible.active) continue;
            
            const collectibleBounds = {
                x: collectible.x - 16,
                y: collectible.y - 16,
                width: 32,
                height: 32
            };
            
            // Verificar colisión rectangular
            if (birdBounds.x < collectibleBounds.x + collectibleBounds.width &&
                birdBounds.x + birdBounds.width > collectibleBounds.x &&
                birdBounds.y < collectibleBounds.y + collectibleBounds.height &&
                birdBounds.y + birdBounds.height > collectibleBounds.y) {
                
                // console.log('¡Coleccionable recogido!');
                this.collectItem(collectible);
                return;
            }
        }
    }
    
    jump() {
        if (this.gameOver) return;
        
        if (!this.gameStarted) {
            this.startGame();
            return;
        }
        
        // Hacer saltar al pájaro
        this.bird.body.setVelocityY(-250); // Mitad de la fuerza original
        
        // Sin sonido al saltar
    }
    
    startGame() {
        this.gameStarted = true;
        
        // Ocultar instrucciones
        if (this.instructionText) {
            this.instructionText.destroy();
        }
        
        // Activar timers
        this.pipeTimer.paused = false;
        this.collectibleTimer.paused = false;
        
        // console.log('¡Juego iniciado!');
    }
    
    addPipe() {
        if (this.gameOver) {
            // console.log('No crear tubo - juego terminado');
            return;
        }
        
        // console.log('¡CREANDO TUBOS VERDES!');
        
        // Crear tubo igual que en el original: altura aleatoria
        const height = 50 + Math.random() * (600 - this.pipeGap - 100);
        const pipeWidth = 60; // Ancho original correcto
        const pipeX = 420; // Posición X inicial
        
        // TUBO SUPERIOR - Rectángulo verde
        const topPipe = this.add.rectangle(pipeX, height/2, pipeWidth, height, 0x00aa00);
        topPipe.setDepth(5); // Asegurar que se vea encima del video
        
        // Propiedades personalizadas para movimiento manual
        topPipe.pipeSpeed = this.pipeSpeed;
        topPipe.scored = false;
        topPipe.isTopPipe = true;
        
        // TUBO INFERIOR - Rectángulo verde
        const bottomPipeY = height + this.pipeGap;
        const bottomPipeHeight = 600 - bottomPipeY;
        const bottomPipe = this.add.rectangle(pipeX, bottomPipeY + bottomPipeHeight/2, pipeWidth, bottomPipeHeight, 0x00aa00);
        bottomPipe.setDepth(5); // Asegurar que se vea encima del video
        
        // Propiedades personalizadas para movimiento manual
        bottomPipe.pipeSpeed = this.pipeSpeed;
        bottomPipe.isTopPipe = false;
        
        // Añadir a un array personalizado en lugar de grupo de física
        if (!this.pipeArray) this.pipeArray = [];
        this.pipeArray.push(topPipe, bottomPipe);
        
        // console.log(`✅ TUBOS CREADOS - Height: ${height}, Gap: ${this.pipeGap}, Speed: ${this.pipeSpeed}, Count: ${this.pipes.children.size}`);
    }
    
    maybeAddCollectible() {
        if (this.gameOver || Math.random() > 0.4) return;
        
        // Solo crear coleccionable si hay tubos recientes para usar su hueco
        if (!this.pipeArray || this.pipeArray.length === 0) return;
        
        // Buscar el último tubo superior creado para usar su hueco
        let lastTopPipe = null;
        for (let i = this.pipeArray.length - 1; i >= 0; i--) {
            if (this.pipeArray[i].isTopPipe) {
                lastTopPipe = this.pipeArray[i];
                break;
            }
        }
        
        if (!lastTopPipe) return;
        
        // Calcular posición Y en el hueco entre tubos
        const topPipeBottom = lastTopPipe.y + lastTopPipe.displayHeight/2;
        const gapStart = topPipeBottom + 20; // Margen de seguridad
        const gapEnd = topPipeBottom + this.pipeGap - 20; // Margen de seguridad
        const collectibleY = Phaser.Math.Between(gapStart, gapEnd);
        
        // Crear coleccionable en el hueco seguro
        const collectible = this.add.image(450, collectibleY, this.selectedInstrument);
        collectible.setDisplaySize(32, 32); // Tamaño 32x32 como en el original
        collectible.setDepth(5); // Encima del video
        
        // Propiedades para movimiento manual
        collectible.pipeSpeed = this.pipeSpeed;
        collectible.isCollectible = true;
        
        // Añadir al array personalizado
        if (!this.collectibleArray) this.collectibleArray = [];
        this.collectibleArray.push(collectible);
        
        // Animación de rotación
        this.tweens.add({
            targets: collectible,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1
        });
        
        // console.log(`Coleccionable creado en hueco seguro Y=${collectibleY}: ${this.selectedInstrument}`);
    }
    
    updateDifficulty() {
        // Calcular nueva velocidad de tubos basada en puntuación
        const speedIncreases = Math.floor(this.score / this.DIFFICULTY_CONFIG.SPEED_INCREASE_EVERY);
        this.pipeSpeed = this.DIFFICULTY_CONFIG.INITIAL_PIPE_SPEED + 
                        (speedIncreases * this.DIFFICULTY_CONFIG.SPEED_INCREASE_AMOUNT);
        
        // Calcular nueva gravedad basada en puntuación
        const gravityIncreases = Math.floor(this.score / this.DIFFICULTY_CONFIG.GRAVITY_INCREASE_EVERY);
        this.currentGravity = this.DIFFICULTY_CONFIG.INITIAL_GRAVITY + 
                             (gravityIncreases * this.DIFFICULTY_CONFIG.GRAVITY_INCREASE_AMOUNT);
        
        // Calcular nuevo espacio entre barras basado en puntuación
        const gapDecreases = Math.floor(this.score / this.DIFFICULTY_CONFIG.GAP_DECREASE_EVERY);
        this.pipeGap = Math.max(
            this.DIFFICULTY_CONFIG.MINIMUM_PIPE_GAP,
            this.DIFFICULTY_CONFIG.INITIAL_PIPE_GAP - (gapDecreases * this.DIFFICULTY_CONFIG.GAP_DECREASE_AMOUNT)
        );
    }
    

    
    cleanupOffscreenElements() {
        // Limpiar tubos y sumar puntos
        this.pipes.children.entries.forEach(pipe => {
            // Sumar punto cuando el pájaro pasa el tubo (no cuando se destruye)
            if (!pipe.scored && pipe.x + 30 < this.bird.x && pipe.y < 300) { // Solo tubos superiores
                this.score += 1;
                this.scoreText.setText('Puntuación: ' + this.score);
                pipe.scored = true;
                // console.log(`¡Punto! Puntuación: ${this.score}`);
            }
            
            // Destruir cuando salga de pantalla
            if (pipe.x < -80) {
                pipe.destroy();
            }
        });
        
        // Limpiar coleccionables
        this.collectibles.children.entries.forEach(collectible => {
            if (collectible.x < -80) {
                collectible.destroy();
            }
        });
    }
    
    hitPipe() {
        // console.log('¡Perdiste! Pájaro chocó con obstáculo');
        
        // Efecto visual de colisión
        this.bird.setTint(0xff0000); // Colorear de rojo
        
        // Detener el pájaro
        this.bird.body.setVelocity(0, 0);
        
        this.endGame();
    }
    
    checkBounds() {
        // Perder si toca el suelo
        if (this.bird.y >= 580) {
            // console.log('¡Perdiste! Pájaro tocó el suelo');
            this.bird.setTint(0xff0000);
            this.endGame();
        }
        
        // Perder si toca el techo
        if (this.bird.y <= 20) {
            // console.log('¡Perdiste! Pájaro tocó el techo');
            this.bird.setTint(0xff0000);
            this.endGame();
        }
    }
    
    collectItem(collectible) {
        // Reproducir sonido de colección
        this.sound.play('pickup', { volume: 0.02 });
        
        // Sumar puntos extra
        this.score += 5;
        this.scoreText.setText('Puntuación: ' + this.score);
        
        // Efecto visual
        const bonusText = this.add.text(collectible.x, collectible.y, '+5', {
            fontSize: '20px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(10);
        
        this.tweens.add({
            targets: bonusText,
            y: bonusText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => bonusText.destroy()
        });
        
        // Eliminar del array y destruir
        const index = this.collectibleArray.indexOf(collectible);
        if (index > -1) {
            this.collectibleArray.splice(index, 1);
        }
        collectible.destroy();
        
        // console.log(`¡Coleccionable recogido! +5 puntos. Total: ${this.score}`);
    }
    
    endGame() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        // console.log(`Juego terminado. Puntuación final: ${this.score}`);
        
        // NO detener música - debe continuar sonando en GameOver
        
        // Reproducir sonido de pérdida
        this.sound.play('lose', { volume: 0.02 });
        
        // Pausar física
        this.physics.pause();
        
        // Detener timers
        this.pipeTimer.remove();
        this.collectibleTimer.remove();
        
        // Manejar puntuación y flujo de game over
        this.handleGameOverFlow();
    }
    
    handleGameOverFlow() {
        // Actualizar mejor puntuación local
        const isNewRecord = this.playerManager.updateBestScore(this.score);
        
        // Si el jugador está registrado, enviar puntuación automáticamente
        if (this.playerManager.isPlayerRegistered()) {
            // console.log('🚀 Jugador registrado, enviando puntuación en background...');
            
            // Enviar score en background (como en el original)
            this.apiService.submitScoreAsync(
                this.playerManager.getPlayerId(),
                this.score,
                {
                    character: this.selectedCharacter,
                    newRecord: isNewRecord
                }
            );
        }
        
        // Ir directamente a GameOver siempre
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', { 
                score: this.score,
                character: this.selectedCharacter,
                playerManager: this.playerManager,
                apiService: this.apiService
            });
        });
    }

    shutdown() {
        this.shutdownVideoLayoutHandlers();
    }

    destroy() {
        this.shutdownVideoLayoutHandlers();
    }

}