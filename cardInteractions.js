/**
 * Card Interactions System
 * Handles card clicks, details display, and click outside events
 */
class CardInteractions {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        
        /* @tweakable Duration for animation transition overlap in ms */
        this.animationOverlap = 80;
        
        /* @tweakable Auto-hide delay for card details in minutes */
        this.autoHideDelayMinutes = 1;
        
        /* @tweakable Required delay between closing and opening cards in ms */
        this.cardToggleDelay = 300;
        
        /* @tweakable Whether to require a two-click pattern for switching cards */
        this.requireTwoClicksToSwitch = true;
        
        /* @tweakable Maximum width for details panel in canvas mode */
        this.maxDetailsPanelWidth = 320;
        
        /* @tweakable Z-index for active cards in canvas mode */
        this.activeCardZIndex = 10;
        
        /* @tweakable Animation duration for canvas mode card activation */
        this.canvasCardActivateDuration = 300;
        
        this.isTransitioning = false;
        this.interactionMode = 'standard'; // 'standard', 'compact', 'canvas'
    }

    setupCardInteractions() {
        const cards = document.querySelectorAll('.card:not(.load-more-card):not(.loading-card)');
        cards.forEach((card, index) => {
            card.addEventListener('click', () => this.handleCardClick(card, index));
        });

        // Setup load more button click
        const loadMoreBtn = document.getElementById('loadMoreButton');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                // Check if we need to load more or refresh
                if (this.app.cardLoader.hasMoreCards()) {
                    // Load more cards
                    this.app.cardLoader.loadMoreCards((cards, isInitial, isLoading, isRefreshing) => {
                        this.app.renderCards(cards, isInitial, isLoading, isRefreshing);
                    });
                } else {
                    // Refresh all cards
                    this.app.cardLoader.refreshCards((cards, isInitial, isLoading, isRefreshing) => {
                        this.app.renderCards(cards, isInitial, isLoading, isRefreshing);
                    });
                }
            });
        }
    }
    
    /**
     * Update interaction mode based on layout
     * @param {string} mode - The layout mode ('compact', 'standard', 'canvas')
     */
    updateInteractionMode(mode) {
        this.interactionMode = mode;
    }

    handleCardClick(card, index) {
        // Prevent rapid clicks during transitions
        if (this.isTransitioning) {
            return;
        }
        
        // Clear any existing hide timeout
        if (this.app.hideTimeout) {
            clearTimeout(this.app.hideTimeout);
            this.app.hideTimeout = null;
        }

        // If the same card is clicked twice, hide details
        if (this.app.activeCard === card) {
            this.hideCardDetails();
            return;
        }

        // If another card is already active and we require two clicks
        if (this.app.activeCard && this.requireTwoClicksToSwitch) {
            this.isTransitioning = true;
            
            // First hide the current card
            this.hideCardDetails();
            
            // Then set a timeout to allow the second click
            setTimeout(() => {
                this.isTransitioning = false;
            }, this.cardToggleDelay);
            
            return;
        }

        // If another card is already active (one-click mode or second click in two-click mode)
        if (this.app.activeCard) {
            this.isTransitioning = true;
            const previousCard = this.app.activeCard;
            const previousDetails = document.querySelector('.card-details.active');

            // Start hiding the current active card's details
            if (previousDetails) {
                previousDetails.classList.remove('active');
                previousDetails.classList.add('hiding');
            }

            previousCard.classList.remove('active');

            // Set this.activeCard to the new card immediately to prevent race conditions
            this.app.activeCard = card;

            // Activate new card after a short delay to allow the hiding animation to start
            setTimeout(() => {
                // Continue with showing the new card details
                this.showNewCardDetails(card, index);

                // Clean up the previous card after its animation completes
                setTimeout(() => {
                    if (previousDetails) {
                        previousDetails.classList.remove('hiding');
                        const parentCard = previousDetails.closest('.card');
                        if (parentCard) {
                            // Remove temporary card if it exists
                            if (parentCard.classList.contains('temporary-card')) {
                                parentCard.remove();
                            } else {
                                this.app.restoreOriginalContent(parentCard);
                            }
                        }
                    }
                    this.isTransitioning = false;
                }, this.config.animations.detailsDisappearDuration - this.animationOverlap);
            }, this.animationOverlap);
        } else {
            // No active card, just activate the new one
            this.isTransitioning = true;
            this.app.activeCard = card;
            this.showNewCardDetails(card, index);
            
            setTimeout(() => {
                this.isTransitioning = false;
            }, this.config.animations.detailsAppearDuration);
        }
    }

    showNewCardDetails(card, index) {
        // Activate the card
        card.classList.add('active');
        
        // Special handling for canvas mode
        if (this.interactionMode === 'canvas') {
            // Bring the card to the front
            card.style.zIndex = this.activeCardZIndex;
            
            // Show details directly on the card
            this.showCardDetailsOnCanvas(card, this.config.cardData[index]);
            return;
        }

        // For grid layouts, use the original approach
        // Calculate which side to show details
        const isRightSide = index % 2 === 0;
        let targetCard = isRightSide ?
            card.nextElementSibling :
            card.previousElementSibling;

        // If there's no adjacent card, create a temporary one
        if (!targetCard) {
            targetCard = this.createTemporaryCard(card, isRightSide);
        }

        // Set arrow direction based on details position
        const arrow = card.querySelector('.popup-sphere i');
        if (arrow) {
            arrow.className = isRightSide ? 'fas fa-arrow-right' : 'fas fa-arrow-left';
        }

        this.showCardDetails(targetCard, this.config.cardData[index]);

        // Clear any existing hide timeout
        if (this.app.hideTimeout) {
            clearTimeout(this.app.hideTimeout);
        }

        // Set auto-hide timeout
        const AUTO_HIDE_DELAY = this.autoHideDelayMinutes * 60 * 1000;
        this.app.hideTimeout = setTimeout(() => {
            this.hideCardDetails();
        }, AUTO_HIDE_DELAY);
    }
    
    /**
     * Show card details directly in canvas mode
     * @param {HTMLElement} card - The card element
     * @param {Object} cardData - The data for the card
     */
    showCardDetailsOnCanvas(card, cardData) {
        // Store original content
        if (!card.dataset.originalContent) {
            card.dataset.originalContent = card.innerHTML;
        }
        
        // Create a details panel on top of the card
        const details = document.createElement('div');
        details.className = 'card-details canvas-details';
        details.innerHTML = `
            <div class="canvas-details-header">
                <button class="canvas-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="card-details-title">${cardData.title}</div>
            <div class="card-details-description">
                ${cardData.details || 'Подробная информация о мероприятии будет доступна позже.'}
            </div>
            <div class="canvas-details-footer">
                <button class="view-event-btn">Подробнее</button>
            </div>
        `;
        
        // Replace card content with details
        card.innerHTML = '';
        card.appendChild(details);
        
        // Add animations and positioning
        card.style.transition = `all ${this.canvasCardActivateDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        card.style.transform = 'scale(1.1)';
        card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.15)';
        
        // Animate in the details
        setTimeout(() => {
            details.classList.add('active');
        }, 50);
        
        // Setup close button
        const closeBtn = details.querySelector('.canvas-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideCardDetails();
            });
        }
        
        // Setup view button
        const viewBtn = details.querySelector('.view-event-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(`event_details.html?id=${this.config.cardData.indexOf(cardData)}`, '_blank');
            });
        }
        
        // Set auto-hide timeout
        const AUTO_HIDE_DELAY = this.autoHideDelayMinutes * 60 * 1000;
        this.app.hideTimeout = setTimeout(() => {
            this.hideCardDetails();
        }, AUTO_HIDE_DELAY);
    }

    createTemporaryCard(sourceCard, isRightSide) {
        const tempCard = document.createElement('div');
        tempCard.className = 'card temporary-card';
        /* @tweakable Width of temporary card */
        tempCard.style.width = '100%';
        /* @tweakable Height of temporary card */
        tempCard.style.height = sourceCard.offsetHeight + 'px';

        if (isRightSide) {
            sourceCard.insertAdjacentElement('afterend', tempCard);
        } else {
            sourceCard.insertAdjacentElement('beforebegin', tempCard);
        }

        return tempCard;
    }

    hideCardDetails() {
        if (this.app.activeCard) {
            this.isTransitioning = true;
            this.app.activeCard.classList.remove('active');
            
            // Handle canvas mode differently
            if (this.interactionMode === 'canvas') {
                // Reset card styling
                this.app.activeCard.style.transform = '';
                this.app.activeCard.style.boxShadow = '';
                this.app.activeCard.style.zIndex = '';
                
                setTimeout(() => {
                    this.app.restoreOriginalContent(this.app.activeCard);
                    this.isTransitioning = false;
                }, this.canvasCardActivateDuration);
                
                this.app.activeCard = null;
                return;
            }
            
            // Standard detail hiding for grid modes
            const details = document.querySelector('.card-details.active');
            if (details) {
                details.classList.remove('active');
                details.classList.add('hiding');

                /* @tweakable Animation duration for hiding card details */
                const ANIMATION_DURATION = this.config.animations.detailsDisappearDuration;

                setTimeout(() => {
                    details.classList.remove('hiding');
                    const parentCard = details.closest('.card');
                    if (parentCard) {
                        // Remove temporary card if it exists
                        if (parentCard.classList.contains('temporary-card')) {
                            parentCard.remove();
                        } else {
                            this.app.restoreOriginalContent(parentCard);
                        }
                    }
                    this.isTransitioning = false;
                }, ANIMATION_DURATION);
            } else {
                this.isTransitioning = false;
            }
            this.app.activeCard = null;
        }
    }

    showCardDetails(targetCard, cardData) {
        // Store original content
        const isLoadMoreButton = targetCard.id === 'loadMoreButton' || targetCard.classList.contains('load-more-card');
        if (!isLoadMoreButton && !targetCard.dataset.originalContent) {
            targetCard.dataset.originalContent = targetCard.innerHTML;
        }

        // Create details panel
        const details = document.createElement('div');
        details.className = 'card-details';
        details.innerHTML = `
            <div class="card-details-title">${cardData.title}</div>
            <div class="card-details-description">
                ${cardData.details || 'Подробная информация о мероприятии будет доступна позже.'}
            </div>
        `;

        // Replace content
        targetCard.innerHTML = '';
        targetCard.appendChild(details);

        // Animate in with a slight delay for better visual effect
        /* @tweakable Delay before showing details in ms */
        const DETAILS_DELAY = this.config.animations.detailsDelay;

        setTimeout(() => {
            details.classList.add('active');
        }, DETAILS_DELAY);
    }
}

// Export the class for use in app.js
window.CardInteractions = CardInteractions;