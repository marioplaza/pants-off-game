import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playerId, score, gameData } = req.body;

    // Validaciones básicas
    if (!playerId || score === undefined) {
      return res.status(400).json({ error: 'PlayerId and score are required' });
    }

    if (typeof score !== 'number' || score < 0 || score > 1000) {
      return res.status(400).json({ error: 'Invalid score range' });
    }

    // Verificar que el jugador existe
    const existingPlayer = await redis.hgetall(`player:${playerId}`);
    if (!existingPlayer || Object.keys(existingPlayer).length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Anti-cheat básico: verificar progresión realista
    const currentBest = parseInt(existingPlayer.best_score) || 0;
    if (score > currentBest + 100) {
      // Si el salto es muy grande, requerir más validación
      console.warn(`Suspicious score jump for player ${playerId}: ${currentBest} -> ${score}`);
    }

    // Actualizar datos del jugador
    const updatedData = {
      ...existingPlayer,
      last_played: new Date().toISOString(),
      games_played: (parseInt(existingPlayer.games_played) || 0) + 1
    };

    // Solo actualizar best_score si es mayor
    if (score > currentBest) {
      updatedData.best_score = score;
      // Actualizar en el leaderboard
      await redis.zadd('global_leaderboard', { score: score, member: playerId });
    }

    await redis.hset(`player:${playerId}`, updatedData);

    // Obtener posición actual en el ranking
    const rank = await redis.zrevrank('global_leaderboard', playerId);
    const totalPlayers = await redis.zcard('global_leaderboard');

    res.status(200).json({ 
      success: true,
      newRecord: score > currentBest,
      bestScore: Math.max(score, currentBest),
      rank: rank !== null ? rank + 1 : null,
      totalPlayers,
      message: score > currentBest ? '¡Nuevo récord personal!' : 'Partida registrada'
    });

  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
