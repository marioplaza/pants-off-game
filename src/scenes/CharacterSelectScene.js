import { AssetLoader } from '../AssetLoader.js';
import { PlayerManager } from '../PlayerManager.js';
import { ApiService } from '../ApiService.js';

export class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    preload() {
        console.log('CharacterSelectScene: Assets ya cargados');
    }

    create() {
        console.log('CharacterSelectScene: Creando selección de personajes...');
        
        // Inicializar sistemas de jugador y API
        this.playerManager = new PlayerManager();
        this.apiService = new ApiService();
        
        // Fondo de la pantalla de selección adaptado con bleed
        const bleed = 2;
        const background = this.add.image(-bleed, -bleed, 'elixeoteupersonaxe');
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
        
        // Crear selección de personajes
        this.createCharacterSelection();
        
        // Botón de volver
        const backButton = this.add.text(50, 5, '← VOLTAR', {
            fontSize: '16px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
            this.sound.play('select', { volume: 0.3 });
            this.scene.start('MainMenuScene');
        });
        
        
        // Variable para personaje seleccionado
        this.selectedCharacter = null;
    }
    
    createCharacterSelection() {
        const characters = AssetLoader.getCharacters();
        const names = ['FONSO', 'MAURO', 'DIEGO', 'ROCKY'];
        const taglines = ['HOPPUS', 'DE LOURO', 'DOBRE BREAK', 'O BERRIDOS'];
        const positions = [
            { x: 120, y: 220 }, // Fonso - Más arriba
            { x: 280, y: 220 }, // Mauro - Más arriba  
            { x: 120, y: 370 }, // Diego - Más arriba
            { x: 280, y: 370 }  // Rocky - Más arriba
        ];
        
        this.characterSprites = [];
        
        characters.forEach((character, index) => {
            const pos = positions[index];
            
            // Crear sprite del personaje - Tamaño original (80x80 como en el juego original)
            const charSprite = this.add.image(pos.x, pos.y, character);
            charSprite.setDisplaySize(80, 80); // Tamaño fijo 80x80 como el original
            charSprite.setInteractive({ useHandCursor: true });
            
            // Marco de selección (inicialmente invisible)
            const selectionFrame = this.add.graphics();
            selectionFrame.lineStyle(4, 0xffff00);
            selectionFrame.strokeRect(pos.x - 45, pos.y - 45, 90, 90); // Marco un poco más grande
            selectionFrame.setVisible(false);
            
            // Hacer seleccionable
            charSprite.on('pointerdown', () => {
                this.selectCharacter(character, charSprite, selectionFrame);
                this.sound.play('select', { volume: 0.2 });
            });
            
            // Nombre del personaje
            this.add.text(pos.x, pos.y + 55, names[index], {
                fontSize: '14px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Tagline del personaje
            this.add.text(pos.x, pos.y + 75, taglines[index], {
                fontSize: '12px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
            
            // Efecto hover
            charSprite.on('pointerover', () => {
                if (this.selectedCharacter !== character) {
                    charSprite.setDisplaySize(90, 90); // Agrandar un poco en hover
                }
            });
            charSprite.on('pointerout', () => {
                if (this.selectedCharacter !== character) {
                    charSprite.setDisplaySize(80, 80); // Volver al tamaño normal
                }
            });
            
            this.characterSprites.push({
                sprite: charSprite,
                character: character,
                frame: selectionFrame
            });
        });
    }
    
    selectCharacter(character, sprite, frame) {
        // Ocultar todos los marcos
        this.characterSprites.forEach(char => {
            char.sprite.setDisplaySize(80, 80); // Tamaño normal
            char.frame.setVisible(false);
        });
        
        // Mostrar marco del seleccionado
        sprite.setDisplaySize(100, 100); // Más grande cuando está seleccionado
        frame.setVisible(true);
        
        this.selectedCharacter = character;
        
        // Verificar si el jugador está registrado
        if (this.playerManager.isPlayerRegistered()) {
            // Jugador registrado: iniciar juego directamente
            this.time.delayedCall(200, () => {
                this.scene.start('GameScene', { selectedCharacter: this.selectedCharacter });
            });
        } else {
            // Jugador no registrado: mostrar modal de registro
            console.log('👤 Jugador no registrado, mostrando modal...');
            this.time.delayedCall(200, () => {
                this.showNameInputModal();
            });
        }
        
        console.log('Personaje seleccionado:', character);
    }
    
    showNameInputModal() {
        console.log('📝 Mostrando modal de registro de nombre');
        
        // PRIMERO: Limpiar cualquier modal existente para evitar duplicados
        const existingModal = document.getElementById('name-input-container');
        if (existingModal) {
            console.log('🧹 Limpiando modal existente...');
            existingModal.remove();
        }
        
        // Crear modal HTML (igual que el original)
        const modalHTML = `
            <div id="name-input-container" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: transparent; padding: 30px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1); text-align: center; font-family: 'PixelDigivolve', 'Courier New', monospace; backdrop-filter: blur(10px);">
                <h3 style="margin: 0 0 20px 0; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); font-size: 20px; font-weight: bold;">🎮 Introduce o teu nome</h3>
                <input type="text" id="player-name-input" placeholder="O teu nome..." maxlength="15" style="padding: 15px; font-size: 18px; border: 3px solid rgba(255,255,255,0.3); border-radius: 15px; width: 220px; text-align: center; font-family: 'PixelDigivolve', 'Courier New', monospace; background: rgba(255,255,255,0.9); color: #333; transition: all 0.3s ease; outline: none;">
                <div style="margin: 20px 0 0 0;">
                    <button id="confirm-name-btn" style="padding: 12px 24px; margin: 0 8px; font-size: 16px; border: none; border-radius: 12px; background: linear-gradient(45deg, #4CAF50, #45a049); color: white; cursor: pointer; font-family: 'PixelDigivolve', 'Courier New', monospace; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(76,175,80,0.4); text-transform: uppercase; font-weight: bold;">✓ Confirmar</button>
                    <button id="cancel-name-btn" style="padding: 12px 24px; margin: 0 8px; font-size: 16px; border: none; border-radius: 12px; background: linear-gradient(45deg, #f44336, #d32f2f); color: white; cursor: pointer; font-family: 'PixelDigivolve', 'Courier New', monospace; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(244,67,54,0.4); text-transform: uppercase; font-weight: bold;">✗ Cancelar</button>
                </div>
                <div id="name-validation" style="margin: 15px 0 0 0; font-size: 14px; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.1);"></div>
            </div>
        `;
        
        // Añadir modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar eventos
        this.setupNameInputEvents();
        
        // Enfocar input
        document.getElementById('player-name-input').focus();
    }
    
    setupNameInputEvents() {
        const nameInput = document.getElementById('player-name-input');
        const confirmBtn = document.getElementById('confirm-name-btn');
        const cancelBtn = document.getElementById('cancel-name-btn');
        const validation = document.getElementById('name-validation');
        
        // Validación en tiempo real
        nameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            if (name.length < 2) {
                validation.textContent = 'O nome debe ter polo menos 2 caracteres';
                validation.style.background = 'rgba(244,67,54,0.2)';
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
            } else if (name.length > 15) {
                validation.textContent = 'O nome non pode ter máis de 15 caracteres';
                validation.style.background = 'rgba(244,67,54,0.2)';
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
            } else {
                validation.textContent = '✓ Nome válido';
                validation.style.background = 'rgba(76,175,80,0.2)';
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';
            }
        });
        
        // Enter para confirmar
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                this.confirmPlayerName();
            }
        });
        
        // Botón confirmar
        confirmBtn.addEventListener('click', () => {
            this.confirmPlayerName();
        });
        
        // Botón cancelar
        cancelBtn.addEventListener('click', () => {
            this.cancelPlayerName();
        });
    }
    
    async confirmPlayerName() {
        const nameInput = document.getElementById('player-name-input');
        const playerName = nameInput.value.trim();
        
        if (playerName.length < 2 || playerName.length > 15) {
            return; // Validación ya manejada
        }
        
        console.log('🚀 Registrando jugador:', playerName);
        
        // Mostrar feedback de carga
        const validation = document.getElementById('name-validation');
        validation.textContent = 'Rexistrando jugador...';
        validation.style.background = 'rgba(255,193,7,0.2)';
        
        // Registrar en API
        const registrationResult = await this.apiService.registerPlayer(
            this.playerManager.getPlayerId(),
            playerName
        );
        
        if (registrationResult.success) {
            // Registrar localmente
            this.playerManager.registerPlayer(playerName);
            
            console.log('✅ Jugador registrado exitosamente');
            
            // Cerrar modal e iniciar juego
            this.hideNameInputModal();
            this.scene.start('GameScene', { selectedCharacter: this.selectedCharacter });
        } else {
            // Mostrar error
            validation.textContent = `Error: ${registrationResult.error}`;
            validation.style.background = 'rgba(244,67,54,0.2)';
        }
    }
    
    cancelPlayerName() {
        console.log('❌ Registro cancelado, volviendo al menú');
        this.hideNameInputModal();
        // Volver al menú principal como en el original
        this.scene.start('MainMenuScene');
    }
    
    hideNameInputModal() {
        const modal = document.getElementById('name-input-container');
        if (modal) {
            modal.remove();
        }
    }
}
