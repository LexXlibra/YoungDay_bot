class AnimationManager {
    constructor() {
        /* @tweakable Delay before animations on event details page start in ms */
        this.animationStartDelay = 100;
        
        /* @tweakable Animation duration for indicator blocks in ms */
        this.indicatorAnimationDuration = 300;
        
        /* @tweakable Animation easing for indicator blocks */
        this.indicatorAnimationEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';
        
        /* @tweakable Stagger delay between animations in ms */
        this.staggerDelay = 50;
    }
    
    /**
     * Trigger animations for page elements in sequence
     */
    triggerAnimations() {
        // This method is called after a short delay to ensure all elements are ready
        const animatedElements = document.querySelectorAll(
            '.event-title, .event-meta, .ticket-button, ' +
            '.event-description, .participants-section, .map-section, ' +
            '.profile-card'
        );
        
        // Make all elements visible so animations can run
        animatedElements.forEach((el, index) => {
            el.style.visibility = 'visible';
            
            // Add staggered delay for smoother appearance
            /* @tweakable Animation variable duration based on element type */
            const baseDelay = this.staggerDelay * index;
            el.style.transitionDelay = `${baseDelay}ms`;
        });
    }
    
    /**
     * Create an element appear animation
     * @param {HTMLElement} element - The element to animate
     * @param {string} direction - Direction of animation ('up', 'down', 'left', 'right')
     */
    static animateElementAppear(element, direction = 'up') {
        if (!element) return;
        
        /* @tweakable Animation distance in pixels */
        const DISTANCE = 20;
        /* @tweakable Animation duration in ms */
        const DURATION = 400;
        
        let transform;
        switch(direction) {
            case 'up': transform = `translateY(${DISTANCE}px)`; break;
            case 'down': transform = `translateY(-${DISTANCE}px)`; break;
            case 'left': transform = `translateX(${DISTANCE}px)`; break;
            case 'right': transform = `translateX(-${DISTANCE}px)`; break;
            default: transform = `translateY(${DISTANCE}px)`;
        }
        
        element.style.transition = `opacity ${DURATION}ms ease, transform ${DURATION}ms ease`;
        element.style.opacity = '0';
        element.style.transform = transform;
        
        // Force reflow
        void element.offsetWidth;
        
        element.style.opacity = '1';
        element.style.transform = 'translate(0)';
        
        // Clean up after animation completes
        setTimeout(() => {
            element.style.transition = '';
        }, DURATION);
    }
}

// Export the class for use in other modules
window.AnimationManager = AnimationManager;