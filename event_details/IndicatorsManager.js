class IndicatorsManager {
    constructor() {
        this.indicatorsSystem = new EventIndicatorsSystem();
        
        /* @tweakable Animation duration for indicator expand/collapse in ms */
        this.animationDuration = 300;
        
        /* @tweakable Animation timing function for expanding indicators */
        this.animationTiming = 'cubic-bezier(0.16, 1, 0.3, 1)';
        
        /* @tweakable Maximum height for expanded indicator in pixels */
        this.maxExpandedHeight = 200;
        
        /* @tweakable Border radius for indicator blocks in pixels */
        this.indicatorBorderRadius = 12;
    }
    
    /**
     * Add event indicators to the page
     * @param {Object} eventData - The event data containing indicator information
     */
    addEventIndicators(eventData) {
        if (!eventData.indicators || !eventData.indicators.length) return;
        
        const indicatorsContainer = document.getElementById('eventIndicators');
        if (!indicatorsContainer) return;
        
        let indicatorsHTML = '';
        eventData.indicators.forEach(indicatorData => {
            const indicator = this.indicatorsSystem.indicatorTypes[indicatorData.type];
            if (!indicator) return;
            
            indicatorsHTML += `
                <div class="indicator-block" data-type="${indicatorData.type}">
                    <div class="indicator-content">
                        <div class="indicator-title" style="background-color: ${indicator.color};">
                            <i class="fas fa-${indicator.icon}"></i>
                            <span>${indicatorData.tooltip}</span>
                        </div>
                        <div class="indicator-details">
                            ${DataService.getIndicatorExtraDetails(indicatorData.type)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        indicatorsContainer.innerHTML = indicatorsHTML;
        
        // Setup click event for indicators
        this.setupIndicatorInteractions();
    }
    
    /**
     * Setup click interactions for indicator blocks
     */
    setupIndicatorInteractions() {
        const blocks = document.querySelectorAll('.indicator-block');
        
        blocks.forEach(block => {
            block.addEventListener('click', (e) => {
                // Toggle expanded state with smooth animation
                const wasExpanded = block.classList.contains('expanded');
                
                // First close all expanded blocks
                document.querySelectorAll('.indicator-block.expanded').forEach(el => {
                    el.classList.remove('expanded');
                });
                
                // If this one wasn't expanded before, expand it
                if (!wasExpanded) {
                    block.classList.add('expanded');
                }
                
                // Prevent event from bubbling up to document
                e.stopPropagation();
            });
        });
        
        // Close indicators when clicking elsewhere
        document.addEventListener('click', () => {
            document.querySelectorAll('.indicator-block.expanded').forEach(el => {
                el.classList.remove('expanded');
            });
        });
    }
}

// Export the class for use in other modules
window.IndicatorsManager = IndicatorsManager;