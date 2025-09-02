export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.selectedCharacter = data.character || 'fonso';
    }

    preload() {
        console.log('GameOverScene: Cargando assets...');
    }

    create() {
        console.log('GameOverScene: Creando pantalla de Game Over...');
        
        // Fondo de la pantalla de fin adaptado con bleed
        const bleed = 2;
        const background = this.add.image(-bleed, -bleed, 'xogardenovo');
        background.setOrigin(0, 0);
        background.setDisplaySize(Math.ceil(this.scale.width) + bleed * 2, Math.ceil(this.scale.height) + bleed * 2);
        
        // Mostrar puntuación final (posición como en el original Y = 0.52 * 600 = 312)
        this.add.text(200, 312, `Puntuación: ${this.finalScore}`, {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        // Botón XOGAR DE NOVO (jugar de nuevo) - posición original Y = 0.6 * 600 = 360
        const playAgainButton = this.add.image(200, 360, 'xogar2');
        playAgainButton.setDisplaySize(200, playAgainButton.height * (200 / playAgainButton.width));
        playAgainButton.setInteractive({ useHandCursor: true });
        playAgainButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.scene.start('CharacterSelectScene'); // Volver a selección de personaje
        });
        
        // Botón de ranking (imagen)
        const rankingButton = this.add.image(200, 438, 'btn_ver_ranking2');
        rankingButton.setDisplaySize(200, rankingButton.height * (200 / rankingButton.width));
        rankingButton.setInteractive({ useHandCursor: true });
        rankingButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.scene.start('RankingScene', { previousState: 'fin' });
        });
        
        // Botón ESCOÍTANOS - posición original Y = 0.86 * 600 = 516
        const spotifyButton = this.add.image(200, 516, 'escoitanos2');
        spotifyButton.setDisplaySize(200, spotifyButton.height * (200 / spotifyButton.width));
        spotifyButton.setInteractive({ useHandCursor: true });
        spotifyButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            // Resetear la escala antes de abrir Spotify para evitar que se quede agrandado
            spotifyButton.setScale(1.0);
            this.openSpotify();
        });
        
        // Efectos hover en todos los botones
        [playAgainButton, rankingButton, spotifyButton].forEach(button => {
            button.on('pointerover', () => {
                button.setScale(1.1);
            });
            button.on('pointerout', () => {
                button.setScale(1.0);
            });
        });

        // Manejar resize
        this.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            const height = gameSize.height;
            this.cameras.resize(width, height);
            const bleed = 2;
            background.setPosition(-bleed, -bleed);
            background.setDisplaySize(Math.ceil(width) + bleed * 2, Math.ceil(height) + bleed * 2);
        });
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
}