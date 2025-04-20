/**
 * Gesture Manager
 * Handles touch and pinch gesture interactions
 */
class GestureManager {
    constructor(manager) {
        this.manager = manager;
        
        /* @tweakable The sensitivity of pinch zoom */
        this.pinchZoomSensitivity = 0.01;
        
        /* @tweakable Threshold for detecting pinch in/out gestures */
        this.pinchThresholdIn = 0.8;
        
        /* @tweakable Threshold for detecting pinch out/in gestures */
        this.pinchThresholdOut = 1.2;
        
        // Internal state
        this.lastTouchDistance = null;
        
        // Initialize touch gestures
        this.setupTouchGestures();
    }
    
    /**
     * Setup touch and pinch gesture handlers
     */
    setupTouchGestures() {
        const section = document.querySelector('.section');
        if (!section) return;
        
        // Touch start
        section.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Two finger touch - for pinch zoom
                const distance = this.getTouchDistance(e.touches);
                this.lastTouchDistance = distance;
                e.preventDefault(); // Prevent default for two finger touches
            } else if (e.touches.length === 1 && this.manager.core.currentMode === 'canvas') {
                // Single finger touch in canvas mode - for panning
                // Don't start dragging if touching a card
                if (e.target.closest('.card')) return;
                
                this.manager.canvasLayout.isDragging = true;
                this.manager.canvasLayout.dragStartPosition = {
                    x: e.touches[0].clientX - this.manager.canvasLayout.canvasPosition.x,
                    y: e.touches[0].clientY - this.manager.canvasLayout.canvasPosition.y
                };
                e.preventDefault();
            }
        }, { passive: false });
        
        // Touch move
        section.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                // Pinch zoom
                e.preventDefault();
                this.handlePinchZoom(e);
            } else if (e.touches.length === 1 && this.manager.canvasLayout.isDragging && this.manager.core.currentMode === 'canvas') {
                // Single finger panning in canvas mode
                e.preventDefault();
                this.handleCanvasDrag(e);
            }
        }, { passive: false });
        
        // Touch end
        section.addEventListener('touchend', (e) => {
            this.lastTouchDistance = null;
            this.manager.canvasLayout.isDragging = false;
        });
    }
    
    /**
     * Handle pinch zoom gesture
     * @param {TouchEvent} e - The touch event
     */
    handlePinchZoom(e) {
        const currentDistance = this.getTouchDistance(e.touches);
        if (this.lastTouchDistance) {
            // Calculate zoom level change
            const change = currentDistance / this.lastTouchDistance;
            
            if (Math.abs(change - 1) > this.pinchZoomSensitivity) {
                if (this.manager.core.currentMode === 'canvas') {
                    // Zoom the canvas
                    const canvasLayout = this.manager.canvasLayout;
                    canvasLayout.canvasScale = Math.max(
                        canvasLayout.minCanvasScale, 
                        Math.min(canvasLayout.maxCanvasScale, canvasLayout.canvasScale * change)
                    );
                    
                    const cardGrid = document.querySelector('.card-grid');
                    if (cardGrid) {
                        cardGrid.style.transform = `scale(${canvasLayout.canvasScale}) translate(${canvasLayout.canvasPosition.x}px, ${canvasLayout.canvasPosition.y}px)`;
                    }
                } else {
                    // Switch layout modes based on pinch direction
                    if (change < this.pinchThresholdIn) { // Pinching in - more columns
                        if (this.manager.core.currentMode === 'compact') {
                            this.manager.setLayoutMode('standard');
                        } else if (this.manager.core.currentMode === 'standard') {
                            this.manager.setLayoutMode('canvas');
                        }
                    } else if (change > this.pinchThresholdOut) { // Pinching out - fewer columns
                        if (this.manager.core.currentMode === 'canvas') {
                            this.manager.setLayoutMode('standard');
                        } else if (this.manager.core.currentMode === 'standard') {
                            this.manager.setLayoutMode('compact');
                        }
                    }
                }
                
                // Update the reference distance
                this.lastTouchDistance = currentDistance;
            }
        }
    }
    
    /**
     * Handle canvas drag gesture
     * @param {TouchEvent} e - The touch event
     */
    handleCanvasDrag(e) {
        const canvasLayout = this.manager.canvasLayout;
        
        canvasLayout.canvasPosition = {
            x: (e.touches[0].clientX - canvasLayout.dragStartPosition.x) / canvasLayout.canvasScale,
            y: (e.touches[0].clientY - canvasLayout.dragStartPosition.y) / canvasLayout.canvasScale
        };
        
        const cardGrid = document.querySelector('.card-grid');
        if (cardGrid) {
            cardGrid.style.transform = `scale(${canvasLayout.canvasScale}) translate(${canvasLayout.canvasPosition.x}px, ${canvasLayout.canvasPosition.y}px)`;
        }
    }
    
    /**
     * Calculate distance between two touch points
     * @param {TouchList} touches - The touch points
     * @returns {number} - The distance between touch points
     */
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Export the class
window.GestureManager = GestureManager;