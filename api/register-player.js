import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playerId, playerName } = req.body;

    // Validaciones
    if (!playerId || !playerName) {
      return res.status(400).json({ error: 'PlayerId and playerName are required' });
    }

    if (playerName.length > 15 || playerName.length < 2) {
      return res.status(400).json({ error: 'Player name must be between 2-15 characters' });
    }

    // Filtro básico de palabras prohibidas
    const bannedWords = ['admin', 'test', 'bot', 'spam'];
    if (bannedWords.some(word => playerName.toLowerCase().includes(word))) {
      return res.status(400).json({ error: 'Invalid player name' });
    }

    // Verificar si el jugador ya existe
    const existingPlayer = await redis.hgetall(`player:${playerId}`);
    if (existingPlayer && Object.keys(existingPlayer).length > 0) {
      return res.status(409).json({ error: 'Player already registered' });
    }

    // Crear nuevo jugador
    const playerData = {
      name: playerName,
      best_score: 0,
      games_played: 0,
      created_at: new Date().toISOString(),
      last_played: new Date().toISOString()
    };

    await redis.hset(`player:${playerId}`, playerData);

    // Añadir al leaderboard con score 0
    await redis.zadd('global_leaderboard', { score: 0, member: playerId });

    res.status(201).json({ 
      success: true, 
      message: 'Player registered successfully',
      player: playerData
    });

  } catch (error) {
    console.error('Error registering player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
