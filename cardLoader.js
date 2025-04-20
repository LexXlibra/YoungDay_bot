/**
 * Card Loader System
 * Handles progressive loading and refreshing of event cards
 */

class CardLoaderSystem {
    constructor(config) {
        this.config = config;
        
        /* @tweakable Initial number of cards to display */
        this.initialCardCount = 6;
        
        /* @tweakable Number of cards to load on each "load more" click */
        this.cardsPerLoad = 3;
        
        /* @tweakable Maximum number of cards that can be loaded */
        this.maxCards = 50;
        
        /* @tweakable Simulated loading delay in ms */
        this.loadingDelay = 800;
        
        /* @tweakable Animation delay between card appearances in ms */
        this.cardAnimationDelay = 50;
        
        /* @tweakable Refresh cooldown in ms */
        this.refreshCooldown = 2000;
        
        this.currentCardCount = 0;
        this.totalAvailableCards = 0;
        this.isLoading = false;
        this.canRefresh = true;
    }
    
    /**
     * Initialize the card loader with the initial batch of cards
     * @param {Function} renderCallback - Function to call with loaded cards
     */
    initialize(renderCallback) {
        this.totalAvailableCards = this.config.cardData.length;
        this.loadInitialCards(renderCallback);
    }
    
    /**
     * Load the initial set of cards
     * @param {Function} renderCallback - Function to call with loaded cards
     */
    loadInitialCards(renderCallback) {
        this.isLoading = true;
        
        // Determine how many cards to show initially
        const cardsToShow = Math.min(this.initialCardCount, this.totalAvailableCards);
        
        // Get the initial batch of cards
        const initialCards = this.config.cardData.slice(0, cardsToShow);
        this.currentCardCount = cardsToShow;
        
        // Render the cards
        renderCallback(initialCards, true);
        
        this.isLoading = false;
    }
    
    /**
     * Load more cards when requested
     * @param {Function} renderCallback - Function to call with loaded cards
     * @returns {Boolean} - Whether more cards were loaded
     */
    loadMoreCards(renderCallback) {
        if (this.isLoading || this.currentCardCount >= this.totalAvailableCards) {
            return false;
        }
        
        this.isLoading = true;
        
        // Show loading state
        renderCallback(null, false, true);
        
        // Determine how many more cards to load
        const nextBatch = Math.min(
            this.cardsPerLoad, 
            this.totalAvailableCards - this.currentCardCount
        );
        
        // Simulate network delay
        setTimeout(() => {
            // Get the next batch of cards
            const newCards = this.config.cardData.slice(
                this.currentCardCount, 
                this.currentCardCount + nextBatch
            );
            
            this.currentCardCount += nextBatch;
            
            // Render the new cards
            renderCallback(newCards, false);
            
            this.isLoading = false;
        }, this.loadingDelay);
        
        return true;
    }
    
    /**
     * Refresh the card content with new/updated data
     * @param {Function} renderCallback - Function to call with refreshed cards
     */
    refreshCards(renderCallback) {
        if (this.isLoading || !this.canRefresh) {
            return false;
        }
        
        this.isLoading = true;
        this.canRefresh = false;
        
        // Show refreshing state in the UI
        renderCallback(null, false, false, true);
        
        // Simulate network request for updated content
        setTimeout(() => {
            // Efficiently shuffle the cards using Fisher-Yates algorithm
            const shuffled = [...this.config.cardData];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Update the config with "new" data
            this.config.cardData = shuffled;
            this.totalAvailableCards = shuffled.length;
            
            // Reset card count and load initial cards
            this.currentCardCount = 0;
            this.loadInitialCards(renderCallback);
            
            // Reset refresh cooldown
            setTimeout(() => {
                this.canRefresh = true;
            }, this.refreshCooldown);
            
            this.isLoading = false;
        }, this.loadingDelay * 1.5);
        
        return true;
    }
    
    /**
     * Check if there are more cards available to load
     * @returns {Boolean} - Whether more cards can be loaded
     */
    hasMoreCards() {
        return this.currentCardCount < this.totalAvailableCards;
    }
    
    /**
     * Get loading state
     * @returns {Boolean} - Whether cards are currently loading
     */
    getLoadingState() {
        return this.isLoading;
    }
}

// Export the class for use in app.js
window.CardLoaderSystem = CardLoaderSystem;