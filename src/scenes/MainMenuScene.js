import { AssetLoader } from '../AssetLoader.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        console.log('MainMenuScene: Cargando assets...');
        
        // Cargar todos los assets del juego
        AssetLoader.preloadAssets(this);
        
        // Barra de progreso de carga
        this.createLoadingBar();
    }
    
    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Fondo de la barra de progreso
        const progressBg = this.add.graphics();
        progressBg.fillStyle(0x222222);
        progressBg.fillRect(width/2 - 150, height/2 - 10, 300, 20);
        
        // Barra de progreso
        const progressBar = this.add.graphics();
        
        // Texto de carga
        const loadingText = this.add.text(width/2, height/2 - 50, 'Cargando...', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Actualizar progreso
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00);
            progressBar.fillRect(width/2 - 150, height/2 - 10, 300 * value, 20);
        });
        
        // Limpiar cuando termine
        this.load.on('complete', () => {
            progressBg.destroy();
            progressBar.destroy();
            loadingText.destroy();
        });
    }

    create() {
        console.log('MainMenuScene: Creando menú principal...');
        
        // Fondo principal
        this.add.image(200, 300, 'fondo').setDisplaySize(400, 600);
        
        
        // Botón XOGAR (Jugar) - Tamaño original del juego
        const playButton = this.add.image(200, 350, 'xogar');
        playButton.setDisplaySize(200, playButton.height * (200 / playButton.width)); // Ancho 200px como el original
        playButton.setInteractive({ useHandCursor: true });
        playButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.scene.start('CharacterSelectScene');
        });
        
        // Botón RANKING - Como en el original
        const rankingButton = this.add.rectangle(200, 415, 200, 60, 0xFF6B35);
        const rankingText = this.add.text(200, 415, '🏆 RANKING', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        rankingButton.setInteractive({ useHandCursor: true });
        rankingButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.scene.start('RankingScene', { previousState: 'inicio' });
        });
        
        // Botón ESCOÍTANOS (Spotify) - Tamaño original del juego
        const spotifyButton = this.add.image(200, 480, 'escoitanos');
        spotifyButton.setDisplaySize(200, spotifyButton.height * (200 / spotifyButton.width)); // Ancho 200px como el original
        spotifyButton.setInteractive({ useHandCursor: true });
        spotifyButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.openSpotify();
        });
        
        // Efectos hover en botones de imagen
        [playButton, spotifyButton].forEach(button => {
            const originalWidth = button.displayWidth;
            const originalHeight = button.displayHeight;
            button.on('pointerover', () => {
                button.setDisplaySize(originalWidth * 1.1, originalHeight * 1.1);
            });
            button.on('pointerout', () => {
                button.setDisplaySize(originalWidth, originalHeight);
            });
        });
        
        // Efecto hover para botón ranking (rectángulo)
        rankingButton.on('pointerover', () => {
            rankingButton.setScale(1.1);
        });
        rankingButton.on('pointerout', () => {
            rankingButton.setScale(1.0);
        });
    
        
        // Iniciar música de fondo
        this.startBackgroundMusic();
    }
    
    startBackgroundMusic() {
        // Verificar si ya hay música del menú sonando
        if (this.sound.get('cancion')) {
            return;
        }
        
        try {
            // Usar cancion.mp3 para el menú, melodia.mp3 será para el juego
            this.backgroundMusic = this.sound.add('cancion', {
                volume: 0.3,
                loop: true
            });
            this.backgroundMusic.play();
            console.log('Música de fondo del menú iniciada');
        } catch (error) {
            console.log('No se pudo iniciar la música de fondo:', error);
        }
    }
    
    openSpotify() {
        console.log('MainMenuScene: Abriendo Spotify...');
        
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
}
