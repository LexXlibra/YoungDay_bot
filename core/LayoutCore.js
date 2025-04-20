/**
 * Core Layout System
 * Base functionality for layout management
 */
class LayoutCore {
    constructor(manager) {
        this.manager = manager;
        
        /* @tweakable The number of columns in the compact view */
        this.compactColumns = 2;
        
        /* @tweakable The number of columns in the standard view */
        this.standardColumns = 4;
        
        /* @tweakable The minimum width in pixels for switching to compact view */
        this.compactViewThreshold = 768;
        
        /* @tweakable The animation duration for layout changes in ms */
        this.layoutChangeDuration = 300;
        
        /* @tweakable Canvas background color */
        this.canvasBackground = '#f8f8f8';
        
        /* @tweakable Canvas border radius */
        this.canvasBorderRadius = '16px';
        
        // Internal state
        this.currentMode = 'standard'; // 'compact', 'standard', 'canvas'
    }
    
    /**
     * Check screen size and set appropriate layout
     */
    checkScreenSize() {
        this.manager.controlsManager.toggleControlsVisibility();
        
        // Automatically switch to compact mode on small screens
        if (window.innerWidth < this.compactViewThreshold && this.currentMode !== 'compact') {
            this.setLayoutMode('compact', false); // Don't animate on resize
        }
    }
    
    /**
     * Set the layout mode
     * @param {string} mode - The layout mode to set ('compact', 'standard', 'canvas')
     * @param {boolean} animate - Whether to animate the transition
     */
    setLayoutMode(mode, animate = true) {
        // If already in this mode, do nothing
        if (this.currentMode === mode) return;
        
        // Update active button
        const buttons = document.querySelectorAll('.layout-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.${mode}-btn`)?.classList.add('active');
        
        // Store the previous mode for cleanup
        const previousMode = this.currentMode;
        this.currentMode = mode;
        
        // Clean up previous mode
        if (previousMode === 'canvas') {
            this.manager.canvasLayout.cleanupCanvasMode();
        }
        
        // Apply the new layout mode
        const cardGrid = document.querySelector('.card-grid');
        if (!cardGrid) return;
        
        // Set transition if animating
        if (animate) {
            cardGrid.style.transition = `all ${this.layoutChangeDuration}ms ${this.manager.config.animations.timingFunction}`;
        } else {
            cardGrid.style.transition = 'none';
        }
        
        // Apply specific mode styles
        switch (mode) {
            case 'compact':
                this.manager.compactLayout.applyCompactMode(cardGrid);
                break;
                
            case 'standard':
                this.manager.standardLayout.applyStandardMode(cardGrid);
                break;
                
            case 'canvas':
                this.manager.canvasLayout.applyCanvasMode(cardGrid);
                break;
        }
        
        // Reset transition after animation
        if (animate) {
            setTimeout(() => {
                cardGrid.style.transition = '';
            }, this.layoutChangeDuration);
        }
        
        // Update card interaction behavior based on the new mode
        this.updateCardInteractions();
    }
    
    /**
     * Update card interaction behavior based on the current layout mode
     */
    updateCardInteractions() {
        // The CardInteractions system should check this.currentMode
        // and adjust behavior accordingly
        if (this.manager.app.cardInteractions) {
            this.manager.app.cardInteractions.updateInteractionMode(this.currentMode);
        }
    }
}

// Export the class
window.LayoutCore = LayoutCore;