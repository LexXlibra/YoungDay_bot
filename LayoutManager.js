// Import dependencies
class LayoutManager {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        
        // Initialize core modules
        this.core = new LayoutCore(this);
        this.compactLayout = new CompactLayoutManager(this);
        this.standardLayout = new StandardLayoutManager(this);
        this.canvasLayout = new CanvasLayoutManager(this);
        this.gestureManager = new GestureManager(this);
        this.controlsManager = new ControlsManager(this);
        
        // Initialize layout controls
        this.controlsManager.initLayoutControls();
    }

    // Facade methods that delegate to the appropriate modules
    setLayoutMode(mode, animate = true) {
        this.core.setLayoutMode(mode, animate);
    }
    
    checkScreenSize() {
        this.core.checkScreenSize();
    }
    
    updateCardInteractions() {
        this.core.updateCardInteractions();
    }
}

// Export the class for use in app.js
window.LayoutManager = LayoutManager;