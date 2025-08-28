import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug: verificar variables de entorno
  console.log('Environment check:', {
    hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    urlStart: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 20)
  });

  try {
    const { limit = 10, playerId } = req.query;
    const limitNum = Math.min(parseInt(limit), 50); // Máximo 50

    // Obtener top jugadores del leaderboard
    const topPlayers = await redis.zrange('global_leaderboard', 0, limitNum - 1, {
      rev: true,
      withScores: true
    });

    // Obtener información completa de cada jugador
    const leaderboard = [];
    for (let i = 0; i < topPlayers.length; i += 2) {
      const playerId = topPlayers[i];
      const score = topPlayers[i + 1];
      
      const playerInfo = await redis.hgetall(`player:${playerId}`);
      if (playerInfo && Object.keys(playerInfo).length > 0) {
        leaderboard.push({
          rank: Math.floor(i / 2) + 1,
          playerId,
          name: playerInfo.name,
          score: parseInt(score),
          gamesPlayed: parseInt(playerInfo.games_played) || 0,
          lastPlayed: playerInfo.last_played
        });
      }
    }

    // Si se proporciona playerId, incluir su posición
    let playerRank = null;
    if (playerId) {
      const rank = await redis.zrank('global_leaderboard', playerId);
      if (rank !== null) {
        const totalPlayers = await redis.zcard('global_leaderboard');
        playerRank = {
          rank: totalPlayers - rank, // Convertir a ranking descendente
          playerId
        };
      }
    }

    const totalPlayers = await redis.zcard('global_leaderboard');

    res.status(200).json({
      success: true,
      leaderboard,
      playerRank,
      totalPlayers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
