// Servicio para manejar todas las llamadas a la API - replica las funciones del juego original
export class ApiService {
    constructor() {
        this.baseUrl = '/api'; // Mismo endpoint que el original
    }
    
    async registerPlayer(playerId, playerName) {
        try {
            console.log('📞 Registrando jugador:', { playerId, playerName });
            
            const response = await fetch(`${this.baseUrl}/register-player`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: playerId,
                    playerName: playerName
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Jugador registrado exitosamente');
                return { success: true, data: result };
            } else {
                console.error('❌ Error al registrar jugador:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Error de conexión al registrar jugador:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    async submitScore(playerId, score, gameData = {}) {
        try {
            console.log('📞 Enviando puntuación:', { playerId, score });
            
            const response = await fetch(`${this.baseUrl}/submit-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: playerId,
                    score: score,
                    gameData: {
                        ...gameData,
                        timestamp: new Date().toISOString()
                    }
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Puntuación enviada exitosamente:', result);
                return { success: true, data: result };
            } else {
                console.error('❌ Error al enviar puntuación:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Error de conexión al enviar puntuación:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    async fetchLeaderboard(limit = 10, playerId = null) {
        try {
            let url = `${this.baseUrl}/leaderboard?limit=${limit}`;
            if (playerId) {
                url += `&playerId=${playerId}`;
            }
            
            console.log('📞 Obteniendo leaderboard:', url);
            
            const response = await fetch(url);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Leaderboard obtenido exitosamente');
                return { success: true, data: result };
            } else {
                console.error('❌ Error al obtener leaderboard');
                return { success: false, error: 'Error al obtener ranking' };
            }
        } catch (error) {
            console.error('❌ Error de conexión al obtener leaderboard:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
    
    // Función asíncrona para enviar score en background (como en el original)
    async submitScoreAsync(playerId, score, gameData = {}) {
        // No esperar la respuesta, enviar en background
        this.submitScore(playerId, score, gameData)
            .then(result => {
                if (result.success) {
                    console.log('✅ Puntuación enviada en background');
                } else {
                    console.log('❌ Error al enviar puntuación en background:', result.error);
                }
            })
            .catch(error => {
                console.log('❌ Error en envío background:', error);
            });
    }
}
