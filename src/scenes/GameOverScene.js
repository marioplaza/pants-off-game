export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.selectedCharacter = data.character || 'fonso';
    }

    preload() {
        // console.log('GameOverScene: Cargando assets...');
    }

    create() {
        // console.log('GameOverScene: Creando pantalla de Game Over...');
        
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
        // Efectos hover con displaySize como en MainMenuScene
        const paw = playAgainButton.displayWidth;
        const pah = playAgainButton.displayHeight;
        playAgainButton.on('pointerover', () => {
            playAgainButton.setDisplaySize(paw * 1.1, pah * 1.1);
        });
        playAgainButton.on('pointerout', () => {
            playAgainButton.setDisplaySize(paw, pah);
        });
        
        const rbw = rankingButton.displayWidth;
        const rbh = rankingButton.displayHeight;
        rankingButton.on('pointerover', () => {
            rankingButton.setDisplaySize(rbw * 1.1, rbh * 1.1);
        });
        rankingButton.on('pointerout', () => {
            rankingButton.setDisplaySize(rbw, rbh);
        });
        
        // Spotify button sin hover para evitar problemas al cambiar de ventana
        spotifyButton.originalScale = 1.0;
        
        spotifyButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.openSpotify();
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
        // console.log('GameOverScene: Intentando abrir Spotify...');
        
        const artistId = '4fgMYzpV29Kq2DpFcO0p82';
        const spotifyAppUrl = `spotify:artist:${artistId}`;
        const spotifyWebUrl = `https://open.spotify.com/intl-es/artist/${artistId}`;
        
        // Detectar iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
            // console.log('GameOverScene: iOS detectado - usando link directo con detección');
            
            let appOpened = false;
            const startTime = Date.now();
            
            // Detectar cuando la app se abre
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    appOpened = true;
                    // console.log('GameOverScene: App abierta exitosamente');
                }
            };
            
            const handlePageShow = () => {
                const timeSpent = Date.now() - startTime;
                if (timeSpent < 2000) {
                    // Si volvemos rápido, probablemente la app no se abrió
                    // console.log('GameOverScene: Regreso rápido, probablemente app no disponible');
                } else {
                    appOpened = true;
                    // console.log('GameOverScene: App se abrió (tiempo largo fuera)');
                }
            };
            
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('pageshow', handlePageShow);
            
            // Usar link directo como antes (para mostrar el diálogo de iOS)
            const appLink = document.createElement('a');
            appLink.href = spotifyAppUrl;
            document.body.appendChild(appLink);
            appLink.click();
            document.body.removeChild(appLink);
            
            // Fallback después de esperar
            setTimeout(() => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('pageshow', handlePageShow);
                
                if (!appOpened) {
                    // console.log('GameOverScene: App no se abrió, abriendo web');
                    window.open(spotifyWebUrl, '_blank', 'noopener,noreferrer');
                }
            }, 2500); // Más tiempo para que el usuario decida
            
        } else {
            // En otros dispositivos: mantener lógica anterior
            // console.log('GameOverScene: No-iOS - usando fallback web');
            const appLink = document.createElement('a');
            appLink.href = spotifyAppUrl;
            document.body.appendChild(appLink);
            appLink.click();
            document.body.removeChild(appLink);
            
            setTimeout(() => {
                const webLink = document.createElement('a');
                webLink.href = spotifyWebUrl;
                webLink.target = '_blank';
                webLink.rel = 'noopener noreferrer';
                document.body.appendChild(webLink);
                webLink.click();
                document.body.removeChild(webLink);
            }, 1000);
        }
    }
    

}