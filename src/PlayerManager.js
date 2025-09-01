// Sistema de gestión de jugadores - replica la funcionalidad del juego original
export class PlayerManager {
    constructor() {
        this.player = {
            id: null,
            name: null,
            bestScore: 0,
            isRegistered: false
        };
        
        // Cargar datos del jugador desde localStorage
        this.loadPlayerData();
    }
    
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
                console.log('Player data loaded:', this.player);
            } else {
                // Generar ID único para nuevo jugador
                this.player.id = this.generatePlayerId();
                console.log('New player ID generated:', this.player.id);
            }
        } catch (error) {
            console.error('Error loading player data:', error);
            this.player.id = this.generatePlayerId();
        }
    }
    
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    registerPlayer(playerName) {
        this.player.name = playerName;
        this.player.isRegistered = true;
        
        // Guardar en localStorage
        const playerData = {
            id: this.player.id,
            name: playerName,
            bestScore: this.player.bestScore,
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('flappy_player', JSON.stringify(playerData));
        console.log('Player registered locally:', playerData);
    }
    
    updateBestScore(score) {
        if (score > this.player.bestScore) {
            this.player.bestScore = score;
            
            // Actualizar localStorage si está registrado
            if (this.player.isRegistered) {
                const savedPlayer = JSON.parse(localStorage.getItem('flappy_player'));
                savedPlayer.bestScore = score;
                localStorage.setItem('flappy_player', JSON.stringify(savedPlayer));
            }
            
            return true; // Nuevo récord
        }
        return false;
    }
    
    getPlayer() {
        return { ...this.player };
    }
    
    isPlayerRegistered() {
        return this.player.isRegistered;
    }
    
    getPlayerId() {
        return this.player.id;
    }
    
    getPlayerName() {
        return this.player.name;
    }
    
    getBestScore() {
        return this.player.bestScore;
    }
}
