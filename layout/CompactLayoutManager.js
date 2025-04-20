/**
 * Compact Layout Manager
 * Handles the compact grid layout view
 */
class CompactLayoutManager {
    constructor(manager) {
        this.manager = manager;
        
        /* @tweakable Gap between cards in compact view in pixels */
        this.compactCardGap = 12;
        
        /* @tweakable Bottom margin for compact grid in pixels */
        this.compactGridBottomMargin = 24;
    }
    
    /**
     * Apply compact layout mode
     * @param {HTMLElement} cardGrid - The card grid element
     */
    applyCompactMode(cardGrid) {
        cardGrid.classList.remove('standard-grid', 'canvas-grid');
        cardGrid.classList.add('compact-grid');
        cardGrid.style.gridTemplateColumns = `repeat(${this.manager.core.compactColumns}, 1fr)`;
        cardGrid.style.transform = 'none';
        cardGrid.style.position = 'relative';
        cardGrid.style.gap = `${this.compactCardGap}px`;
        cardGrid.style.marginBottom = `${this.compactGridBottomMargin}px`;
        
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
window.CompactLayoutManager = CompactLayoutManager;