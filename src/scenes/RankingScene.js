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
        
        // Fondo específico para ranking
        const background = this.add.image(200, 300, 'fondo_ranking');
        background.setDisplaySize(400, 600);
        
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
        
        // Lista de top jugadores
        const startY = 140;
        for (let i = 0; i < Math.min(5, leaderboard.length); i++) {
            const player = leaderboard[i];
            const y = startY + (i * 35);
            
            // Posición
            this.add.text(50, y, `#${player.rank}`, {
                fontSize: '16px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: 'bold'
            });
            
            // Nombre
            this.add.text(100, y, player.name, {
                fontSize: '16px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace'
            });
            
            // Puntuación
            this.add.text(320, y, player.score.toString(), {
                fontSize: '16px',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: 'bold'
            }).setOrigin(1, 0);
        }
        
        // Posición del jugador (si está registrado y no está en el top 5)
        if (playerRank && playerRank.rank > 5) {
            const playerY = startY + 200;
            
            this.add.text(200, playerY - 20, '➡️ TU POSICIÓN:', {
                fontSize: '16px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 1,
                fontFamily: 'PixelDigivolve, monospace',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            this.add.text(200, playerY, `#${playerRank.rank} de ${totalPlayers}`, {
                fontSize: '18px',
                fill: '#ffffff',
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
