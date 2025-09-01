import { AssetLoader } from '../AssetLoader.js';
import { PlayerManager } from '../PlayerManager.js';
import { ApiService } from '../ApiService.js';

export class RankingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RankingScene' });
    }

    init(data) {
        // Recordar desde dónde se abrió el ranking (inicio o fin)
        this.previousState = data.previousState || 'inicio';
        
        // Inicializar sistemas
        this.playerManager = new PlayerManager();
        this.apiService = new ApiService();
    }

    preload() {
        console.log('RankingScene: Assets ya cargados');
    }

    create() {
        console.log('RankingScene: Creando pantalla de ranking...');
        
        // Fondo específico para ranking adaptado con bleed
        const bleed = 2;
        const background = this.add.image(-bleed, -bleed, 'fondo_ranking');
        background.setOrigin(0, 0);
        background.setDisplaySize(Math.ceil(this.scale.width) + bleed * 2, Math.ceil(this.scale.height) + bleed * 2);
        this.backgroundImage = background;

        // Reajustar en resize
        this.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            const height = gameSize.height;
            this.cameras.resize(width, height);
            if (this.backgroundImage) {
                const bleed = 2;
                this.backgroundImage.setPosition(-bleed, -bleed);
                this.backgroundImage.setDisplaySize(Math.ceil(width) + bleed * 2, Math.ceil(height) + bleed * 2);
            }
        });
        
        // Botón volver - centrado abajo como en el original
        const backButton = this.add.text(200, 530, 'VOLTAR', {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            fontFamily: 'PixelDigivolve, monospace',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.goBack();
        });
        
        // Efecto hover
        backButton.on('pointerover', () => {
            backButton.setScale(1.1);
        });
        backButton.on('pointerout', () => {
            backButton.setScale(1.0);
        });
        
        // Texto de carga
        this.loadingText = this.add.text(200, 300, 'Cargando ranking...', {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            fontFamily: 'PixelDigivolve, monospace'
        }).setOrigin(0.5);
        
        // Cargar datos del ranking
        this.loadRanking();
    }
    
    async loadRanking() {
        const playerId = this.playerManager.isPlayerRegistered() ? this.playerManager.getPlayerId() : null;
        
        const result = await this.apiService.fetchLeaderboard(10, playerId);
        
        if (result.success) {
            this.displayRanking(result.data);
        } else {
            this.showError('Error al cargar el ranking');
        }
    }
    
    displayRanking(data) {
        // Quitar texto de carga
        this.loadingText.destroy();
        
        const { leaderboard, playerRank, totalPlayers } = data;
        const currentPlayerId = this.playerManager.getPlayerId();
        
        // Lista de top jugadores - ajustada para encajar mejor en el fondo
        const startY = 175; // Bajado un poco más
        for (let i = 0; i < Math.min(10, leaderboard.length); i++) {
            const player = leaderboard[i];
            const y = startY + (i * 30); // Menos espaciado vertical
            const isCurrentPlayer = player.playerId === currentPlayerId;
            
            // Color del jugador actual
            const nameColor = isCurrentPlayer ? '#00ff00' : '#ffffff';
            const rankColor = isCurrentPlayer ? '#00ff00' : '#ffffff';
            
            // Posición - más centrado
            this.add.text(70, y, `#${player.rank}`, {
                fontSize: '14px',
                fill: rankColor,
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: 'bold'
            });
            
            // Nombre - más compacto y centrado
            const nameText = player.name.length > 10 ? player.name.substring(0, 10) : player.name;
            this.add.text(120, y, nameText, {
                fontSize: '14px',
                fill: nameColor,
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: isCurrentPlayer ? 'bold' : 'normal'
            });
            
            // Puntuación - ajustada
            this.add.text(300, y, player.score.toString(), {
                fontSize: '14px',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: 'bold'
            }).setOrigin(1, 0);
        }
        
        // Posición del jugador (si está registrado y no está en el top 5)
        if (playerRank && playerRank.rank > 5) {
            const playerY = startY + 180; // Ajustado para mejor posición
            
            this.add.text(200, playerY - 15, '➡️ TU POSICIÓN:', {
                fontSize: '14px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            this.add.text(200, playerY + 10, `#${playerRank.rank} de ${totalPlayers}`, {
                fontSize: '16px',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 2,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }
        
        
    }
    
    showError(message) {
        this.loadingText.setText(message);
    }
    
    goBack() {
        // Volver al estado anterior como en el original
        if (this.previousState === 'fin') {
            this.scene.start('GameOverScene');
        } else {
            this.scene.start('MainMenuScene');
        }
    }
}
