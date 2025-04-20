/**
 * Canvas Layout Manager
 * Handles the canvas layout view with drag and zoom
 */
class CanvasLayoutManager {
    constructor(manager) {
        this.manager = manager;
        
        /* @tweakable The minimum scale for canvas zoom */
        this.minCanvasScale = 0.5;
        
        /* @tweakable The maximum scale for canvas zoom */
        this.maxCanvasScale = 2;
        
        /* @tweakable The default canvas scale */
        this.defaultCanvasScale = 1;
        
        /* @tweakable Padding around cards in canvas mode */
        this.canvasPadding = 10;
        
        /* @tweakable Card animation duration in canvas mode in ms */
        this.cardAnimationDuration = 500;
        
        /* @tweakable Card animation timing function in canvas mode */
        this.cardAnimationTiming = 'cubic-bezier(0.16, 1, 0.3, 1)';
        
        /* @tweakable Radius for circular layout arrangement in canvas mode */
        this.circleRadiusRatio = 0.8;
        
        // Internal state
        this.canvasScale = this.defaultCanvasScale;
        this.canvasDragging = false;
        this.isDragging = false;
        this.dragStartPosition = { x: 0, y: 0 };
        this.canvasPosition = { x: 0, y: 0 };
    }
    
    /**
     * Apply canvas layout mode
     * @param {HTMLElement} cardGrid - The card grid element
     */
    applyCanvasMode(cardGrid) {
        cardGrid.classList.remove('compact-grid', 'standard-grid');
        cardGrid.classList.add('canvas-grid');
        cardGrid.style.display = 'block';
        cardGrid.style.position = 'relative';
        cardGrid.style.height = '100vh';
        cardGrid.style.overflow = 'hidden';
        cardGrid.style.backgroundColor = this.manager.core.canvasBackground;
        cardGrid.style.borderRadius = this.manager.core.canvasBorderRadius;
        
        // Reset transform and position
        this.canvasScale = this.defaultCanvasScale;
        this.canvasPosition = { x: 0, y: 0 };
        cardGrid.style.transform = `scale(${this.canvasScale})`;
        
        // Position cards in a circular pattern
        this.arrangeCardsInCanvas(cardGrid);
        
        // Setup canvas mode interactions
        this.setupCanvasInteractions(cardGrid);
    }
    
    /**
     * Arrange cards in a circular pattern in canvas mode
     * @param {HTMLElement} cardGrid - The card grid element
     */
    arrangeCardsInCanvas(cardGrid) {
        // Position cards in a circular pattern
        const cards = Array.from(cardGrid.querySelectorAll('.card'));
        
        // Skip the load more button for positioning
        const contentCards = cards.filter(card => !card.classList.contains('load-more-card'));
        const loadMoreCard = cards.find(card => card.classList.contains('load-more-card'));
        
        // Position the cards in a circle
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const radius = Math.min(centerX, centerY) * this.circleRadiusRatio; // % of the smallest dimension
        
        contentCards.forEach((card, index) => {
            // Calculate position on the circle
            const angle = (index / contentCards.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle) - card.offsetWidth / 2;
            const y = centerY + radius * Math.sin(angle) - card.offsetHeight / 2;
            
            // Position the card
            card.style.position = 'absolute';
            card.style.left = `${x}px`;
            card.style.top = `${y}px`;
            card.style.transition = `all ${this.cardAnimationDuration}ms ${this.cardAnimationTiming}`;
            card.style.zIndex = '1';
        });
        
        // Position the load more button in the center
        if (loadMoreCard) {
            loadMoreCard.style.position = 'absolute';
            loadMoreCard.style.left = `${centerX - loadMoreCard.offsetWidth / 2}px`;
            loadMoreCard.style.top = `${centerY - loadMoreCard.offsetHeight / 2}px`;
            loadMoreCard.style.transition = `all ${this.cardAnimationDuration}ms ${this.cardAnimationTiming}`;
            loadMoreCard.style.zIndex = '2'; // Above other cards
        }
    }
    
    /**
     * Setup interactions for canvas mode
     * @param {HTMLElement} cardGrid - The card grid element
     */
    setupCanvasInteractions(cardGrid) {
        // Mouse wheel zoom
        cardGrid.addEventListener('wheel', (e) => {
            if (this.manager.core.currentMode !== 'canvas') return;
            
            e.preventDefault();
            
            // Calculate new scale
            /* @tweakable Zoom sensitivity for mouse wheel */
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            this.canvasScale = Math.max(
                this.minCanvasScale, 
                Math.min(this.maxCanvasScale, this.canvasScale + delta)
            );
            
            // Apply new scale
            cardGrid.style.transform = `scale(${this.canvasScale}) translate(${this.canvasPosition.x}px, ${this.canvasPosition.y}px)`;
        });
        
        // Mouse drag to pan
        cardGrid.addEventListener('mousedown', (e) => {
            if (this.manager.core.currentMode !== 'canvas') return;
            
            // Don't start dragging if clicking on a card
            if (e.target.closest('.card')) return;
            
            this.isDragging = true;
            this.dragStartPosition = {
                x: e.clientX - this.canvasPosition.x,
                y: e.clientY - this.canvasPosition.y
            };
            
            cardGrid.style.cursor = 'grabbing';
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging || this.manager.core.currentMode !== 'canvas') return;
            
            this.canvasPosition = {
                x: (e.clientX - this.dragStartPosition.x) / this.canvasScale,
                y: (e.clientY - this.dragStartPosition.y) / this.canvasScale
            };
            
            cardGrid.style.transform = `scale(${this.canvasScale}) translate(${this.canvasPosition.x}px, ${this.canvasPosition.y}px)`;
        });
        
        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                cardGrid.style.cursor = '';
            }
        });
    }
    
    /**
     * Clean up canvas mode specific elements and listeners
     */
    cleanupCanvasMode() {
        const cardGrid = document.querySelector('.card-grid');
        if (!cardGrid) return;
        
        // Reset transform and position styles
        cardGrid.style.transform = '';
        cardGrid.style.position = '';
        cardGrid.style.height = '';
        cardGrid.style.overflow = '';
        cardGrid.style.backgroundColor = '';
        cardGrid.style.borderRadius = '';
        
        // Reset card styles
        const cards = cardGrid.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.position = '';
            card.style.left = '';
            card.style.top = '';
            card.style.transition = '';
        });
    }
}

// Export the class
window.CanvasLayoutManager = CanvasLayoutManager;