/**
 * Standard Layout Manager
 * Handles the standard grid layout view
 */
class StandardLayoutManager {
    constructor(manager) {
        this.manager = manager;
        
        /* @tweakable Gap between cards in standard view in pixels */
        this.standardCardGap = 12;
        
        /* @tweakable Bottom margin for standard grid in pixels */
        this.standardGridBottomMargin = 24;
    }
    
    /**
     * Apply standard layout mode
     * @param {HTMLElement} cardGrid - The card grid element
     */
    applyStandardMode(cardGrid) {
        cardGrid.classList.remove('compact-grid', 'canvas-grid');
        cardGrid.classList.add('standard-grid');
        cardGrid.style.gridTemplateColumns = `repeat(${this.manager.core.standardColumns}, 1fr)`;
        cardGrid.style.transform = 'none';
        cardGrid.style.position = 'relative';
        cardGrid.style.gap = `${this.standardCardGap}px`;
        cardGrid.style.marginBottom = `${this.standardGridBottomMargin}px`;
        
        // Reset individual card styles
        const cards = cardGrid.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.position = '';
            card.style.transform = '';
            card.style.transition = '';
            card.style.zIndex = '';
            card.style.left = '';
            card.style.top = '';
        });
    }
}

// Export the class
window.StandardLayoutManager = StandardLayoutManager;