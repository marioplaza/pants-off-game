// Configuración centralizada de todos los assets del juego
export class AssetLoader {
    static preloadAssets(scene) {
        // ===================
        // IMÁGENES PRINCIPALES
        // ===================
        
        // Personajes
        scene.load.image('fonso', '/assets/images/fonso.webp');
        scene.load.image('mauro', '/assets/images/mauro.webp');
        scene.load.image('diego', '/assets/images/diego.webp');
        scene.load.image('rocky', '/assets/images/rocky.webp');
        
        // Instrumentos coleccionables
        scene.load.image('bajo', '/assets/images/bajo.webp');
        scene.load.image('baquetas', '/assets/images/baquetas.webp');
        scene.load.image('guitarra', '/assets/images/guitarra.webp');
        scene.load.image('micro', '/assets/images/micro.webp');
        
        // Fondos y escenarios
        scene.load.image('fondo', '/assets/images/fondo.webp');
        scene.load.image('edificios', '/assets/images/edificios.webp');
        scene.load.image('fondo_ranking', '/assets/images/fondo_ranking.webp');
        
        // Botones e interfaz
        scene.load.image('xogar', '/assets/images/xogar.webp');
        scene.load.image('xogar2', '/assets/images/xogar2.webp');
        scene.load.image('xogardenovo', '/assets/images/xogardenovo.webp');
        scene.load.image('btn_ver_ranking', '/assets/images/btn_ver_ranking.webp');
        scene.load.image('btn_ver_ranking2', '/assets/images/btn_ver_ranking2.webp');
        scene.load.image('escoitanos', '/assets/images/escoitanos.webp');
        scene.load.image('escoitanos2', '/assets/images/escoitanos2.webp');
        scene.load.image('elixeoteupersonaxe', '/assets/images/elixeoteupersonaxe.webp');
        scene.load.image('volver', '/assets/images/volver.webp');
        
        // Pájaro y elementos de juego
        scene.load.image('pajaro', '/assets/images/pajaro.webp');
        
        // ===================
        // FUENTES
        // ===================
        
        // La fuente se carga via CSS en index.html
        
        // ===================
        // VIDEO
        // ===================
        
        // Video de fondo para el juego
        scene.load.video('background-video', '/assets/background-video.mp4');
        
        // ===================
        // AUDIO
        // ===================
        
        // Música de fondo
        scene.load.audio('melodia', '/assets/sounds/melodia.mp3');
        
        // Efectos de sonido (con fallback)
        scene.load.audio('select', ['/assets/sounds/select.ogg', '/assets/sounds/select.wav']);
        scene.load.audio('pickup', ['/assets/sounds/pickup.ogg', '/assets/sounds/pickup.wav']);
        scene.load.audio('lose', ['/assets/sounds/lose.ogg', '/assets/sounds/lose.wav']);
        
        // console.log('AssetLoader: Todos los assets configurados para carga');
    }
    
    // Mapeo de personajes a sus instrumentos
    static getInstrumentForCharacter(characterKey) {
        const mapping = {
            'fonso': 'bajo',
            'mauro': 'baquetas', 
            'diego': 'guitarra',
            'rocky': 'micro'
        };
        return mapping[characterKey] || 'bajo';
    }
    
    // Lista de todos los personajes disponibles
    static getCharacters() {
        return ['fonso', 'mauro', 'diego', 'rocky'];
    }
    
    // Lista de todos los instrumentos
    static getInstruments() {
        return ['bajo', 'baquetas', 'guitarra', 'micro'];
    }
}
