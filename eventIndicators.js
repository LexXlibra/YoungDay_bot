/**
 * Event Indicators System
 * This file handles the display of category indicators on event cards
 */

class EventIndicatorsSystem {
    constructor() {
        /* @tweakable [Size of indicator sphere on desktop in pixels] */
        this.desktopIndicatorSize = 24;
        
        /* @tweakable [Size of indicator sphere on mobile in pixels] */
        this.mobileIndicatorSize = 20;
        
        /* @tweakable [Maximum number of colors to blend in the gradient sphere] */
        this.maxColorsInSphere = 4;
        
        /* @tweakable [Opacity of the gradient sphere] */
        this.sphereOpacity = 0.85;
        
        /* @tweakable [Border thickness for indicator sphere in pixels] */
        this.sphereBorderWidth = 1;
        
        /* @tweakable [Shadow intensity for indicator sphere] */
        this.shadowIntensity = "0 1px 3px rgba(0, 0, 0, 0.25)";
        
        /* @tweakable [Delay before tooltip appears on hover/tap in milliseconds] */
        this.tooltipDelay = 500;
        
        this.indicatorTypes = {
            age: {
                icon: 'user-shield',
                color: '#007aff',
                class: 'indicator-age'
            },
            discount: {
                icon: 'percent',
                color: '#34c759',
                class: 'indicator-discount'
            },
            bonus: {
                icon: 'gift',
                color: '#ff9500',
                class: 'indicator-bonus'
            },
            dressCode: {
                icon: 'glasses',
                color: '#ff4081',
                class: 'indicator-dress-code'
            },
            priceIncrease: {
                icon: 'percent',
                color: '#f44336',
                class: 'indicator-price-increase'
            },
            popular: {
                icon: 'heart',
                color: '#f44336',
                class: 'indicator-popular'
            },
            featured: {
                icon: 'star',
                color: '#ffeb3b',
                class: 'indicator-featured'
            }
        };
    }
    
    /**
     * Create indicators for an event card
     * @param {Object} eventData - The event data containing indicator information
     * @return {String} - HTML string of indicators
     */
    createIndicators(eventData) {
        if (!eventData.indicators || !eventData.indicators.length) {
            return '';
        }
        
        // Get only the needed indicators up to the maximum
        const indicators = eventData.indicators.slice(0, this.maxColorsInSphere);
        
        // If there are no indicators, return empty string
        if (indicators.length === 0) return '';
        
        // Collect colors from indicators for gradient
        const colors = indicators.map(ind => {
            const type = this.indicatorTypes[ind.type];
            return type ? type.color : '#999999';
        });
        
        // Create gradient based on number of colors
        let gradientStyle;
        if (colors.length === 1) {
            // Single color case
            gradientStyle = colors[0];
        } else if (colors.length === 2) {
            // Two colors - linear gradient
            gradientStyle = `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
        } else {
            // Multiple colors - conic gradient for better effect
            const colorStops = colors.map((color, index) => {
                const percent = Math.round((index / colors.length) * 100);
                const nextPercent = Math.round(((index + 1) / colors.length) * 100);
                return `${color} ${percent}%, ${color} ${nextPercent}%`;
            }).join(', ');
            gradientStyle = `conic-gradient(${colorStops})`;
        }
        
        // Create tooltips from all indicators
        const tooltipsHTML = indicators.map(ind => {
            return `<div class="sphere-tooltip-item">${ind.tooltip}</div>`;
        }).join('');
        
        // Return the indicator sphere with tooltip
        return `
            <div class="indicator-sphere" style="background: ${gradientStyle}; box-shadow: ${this.shadowIntensity};">
                <div class="sphere-tooltip">${tooltipsHTML}</div>
            </div>
        `;
    }
    
    /**
     * Initialize event listeners for indicators
     */
    initializeIndicators() {
        // Apply mobile sizing via CSS media queries
        document.addEventListener('click', (e) => {
            const sphere = e.target.closest('.indicator-sphere');
            if (!sphere) return;
            
            const tooltip = sphere.querySelector('.sphere-tooltip');
            if (!tooltip) return;
            
            // Toggle tooltip visibility
            const isVisible = tooltip.style.opacity === '1';
            
            // Hide all other tooltips first
            document.querySelectorAll('.sphere-tooltip').forEach(t => {
                t.style.opacity = '0';
                t.style.visibility = 'hidden';
            });
            
            // Toggle current tooltip
            if (!isVisible) {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
                
                // Auto-hide after some time
                setTimeout(() => {
                    tooltip.style.opacity = '0';
                    tooltip.style.visibility = 'hidden';
                }, 3000);
            }
        });
    }
}

// Export the class for use in app.js
window.EventIndicatorsSystem = EventIndicatorsSystem;