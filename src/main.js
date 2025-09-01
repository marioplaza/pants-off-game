import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { RankingScene } from './scenes/RankingScene.js';

// Configuración principal del juego
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: true,
        min: {
            width: 320,
            height: 480
        },
        max: {
            width: 800,
            height: 1200
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [MainMenuScene, CharacterSelectScene, GameScene, GameOverScene, RankingScene]
};

// Inicializar el juego
const game = new Phaser.Game(config);

// Exportar para uso global si es necesario
window.game = game;
