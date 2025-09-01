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
        console.log(`Iniciando juego con ${this.selectedCharacter} - instrumento: ${this.selectedInstrument}`);
        
        // Inicializar sistemas de jugador y API
        this.playerManager = new PlayerManager();
        this.apiService = new ApiService();
    }

    preload() {
        console.log('GameScene: Assets ya cargados');
    }

    create() {
        console.log('GameScene: Creando juego...');
        
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
            this.resizeBackgroundToScale(gameSize);
        });
        
        // Crear límites visuales
        this.createBoundaries();
        
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
        
        console.log('Timer de tubos configurado');
        
        // Timer para generar coleccionables
        this.collectibleTimer = this.time.addEvent({
            delay: 3000,
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
        // Crear video de fondo ajustado al tamaño lógico con bleed
        const bleed = 2;
        this.backgroundVideo = this.add.video(-bleed, -bleed, 'background-video');
        this.backgroundVideo.setOrigin(0, 0);
        this.backgroundVideo.setDisplaySize(Math.ceil(this.scale.width) + bleed * 2, Math.ceil(this.scale.height) + bleed * 2);
        this.backgroundVideo.setLoop(true);
        this.backgroundVideo.setMute(true); // Sin sonido
        this.backgroundVideo.play();
        
        // Asegurar que esté en el fondo
        this.backgroundVideo.setDepth(-1);
        
        console.log('Video de fondo configurado');
    }

    resizeBackgroundToScale(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        if (this.backgroundVideo) {
            const bleed = 2;
            this.backgroundVideo.setPosition(-bleed, -bleed);
            this.backgroundVideo.setDisplaySize(Math.ceil(width) + bleed * 2, Math.ceil(height) + bleed * 2);
        }
    }
    
    createBoundaries() {
        // NO crear límites visuales - solo usar detección por posición Y
        console.log('Sin límites visuales - detección por coordenadas');
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
        
        console.log(`Pájaro creado: ${this.selectedCharacter}`);
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
        // Detener música del menú si existe
        if (this.sound.get('cancion')) {
            this.sound.get('cancion').stop();
        }
        
        // Iniciar música del juego
        this.gameMusic = this.sound.add('melodia', {
            volume: 0.3,
            loop: true
        });
        this.gameMusic.play();
        console.log('Música del juego iniciada');
    }
    

    
    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Actualizar dificultad
        this.updateDifficulty();
        
        // Aplicar gravedad manual al pájaro
        this.bird.body.setVelocityY(this.bird.body.velocity.y + this.currentGravity * 10);
        
        // Verificar límites de pantalla manualmente
        this.checkBounds();
        
        // Mover tubos manualmente (sin física)
        this.updatePipes();
        
        // Verificar colisiones con tubos manualmente
        this.checkPipeCollisions();
        
        // Verificar colisiones con coleccionables manualmente
        this.checkCollectibleCollisions();
        
        // Limpiar elementos fuera de pantalla
        this.cleanupOffscreenElements();
        

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
                    console.log(`¡Punto! Puntuación: ${this.score}`);
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
                
                console.log('¡Colisión con tubo detectada!');
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
                
                console.log('¡Coleccionable recogido!');
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
        
        console.log('¡Juego iniciado!');
    }
    
    addPipe() {
        if (this.gameOver) {
            console.log('No crear tubo - juego terminado');
            return;
        }
        
        console.log('¡CREANDO TUBOS VERDES!');
        
        // Crear tubo igual que en el original: altura aleatoria
        const height = 50 + Math.random() * (600 - this.pipeGap - 100);
        const pipeWidth = 60; // Ancho original correcto
        const pipeX = 420; // Posición X inicial
        
        // TUBO SUPERIOR - Imagen de cadenas estirada verticalmente (SIN FÍSICA)
        const topPipe = this.add.image(pipeX, height/2, 'cadenas');
        topPipe.setDisplaySize(pipeWidth, height); // Estirar la imagen para que tenga la altura correcta
        topPipe.setTint(0x00aa00); // Darle tono verdoso
        topPipe.setDepth(5); // Asegurar que se vea encima del video
        
        // Propiedades personalizadas para movimiento manual
        topPipe.pipeSpeed = this.pipeSpeed;
        topPipe.scored = false;
        topPipe.isTopPipe = true;
        
        // TUBO INFERIOR - Imagen de cadenas estirada verticalmente (SIN FÍSICA)
        const bottomPipeY = height + this.pipeGap;
        const bottomPipeHeight = 600 - bottomPipeY;
        const bottomPipe = this.add.image(pipeX, bottomPipeY + bottomPipeHeight/2, 'cadenas');
        bottomPipe.setDisplaySize(pipeWidth, bottomPipeHeight); // Estirar la imagen para que tenga la altura correcta
        bottomPipe.setTint(0x00aa00); // Darle tono verdoso
        bottomPipe.setDepth(5); // Asegurar que se vea encima del video
        
        // Propiedades personalizadas para movimiento manual
        bottomPipe.pipeSpeed = this.pipeSpeed;
        bottomPipe.isTopPipe = false;
        
        // Añadir a un array personalizado en lugar de grupo de física
        if (!this.pipeArray) this.pipeArray = [];
        this.pipeArray.push(topPipe, bottomPipe);
        
        console.log(`✅ TUBOS CREADOS - Height: ${height}, Gap: ${this.pipeGap}, Speed: ${this.pipeSpeed}, Count: ${this.pipes.children.size}`);
    }
    
    maybeAddCollectible() {
        if (this.gameOver || Math.random() > 0.3) return;
        
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
        
        console.log(`Coleccionable creado en hueco seguro Y=${collectibleY}: ${this.selectedInstrument}`);
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
                console.log(`¡Punto! Puntuación: ${this.score}`);
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
        console.log('¡Perdiste! Pájaro chocó con obstáculo');
        
        // Efecto visual de colisión
        this.bird.setTint(0xff0000); // Colorear de rojo
        
        // Detener el pájaro
        this.bird.body.setVelocity(0, 0);
        
        this.endGame();
    }
    
    checkBounds() {
        // Perder si toca el suelo
        if (this.bird.y >= 580) {
            console.log('¡Perdiste! Pájaro tocó el suelo');
            this.bird.setTint(0xff0000);
            this.endGame();
        }
        
        // Perder si toca el techo
        if (this.bird.y <= 20) {
            console.log('¡Perdiste! Pájaro tocó el techo');
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
        
        console.log(`¡Coleccionable recogido! +5 puntos. Total: ${this.score}`);
    }
    
    endGame() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        console.log(`Juego terminado. Puntuación final: ${this.score}`);
        
        // Detener música
        if (this.gameMusic) {
            this.gameMusic.stop();
        }
        
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
            console.log('🚀 Jugador registrado, enviando puntuación en background...');
            
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

}