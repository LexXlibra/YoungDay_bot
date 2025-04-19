class UIHelper {
    constructor() {
        /* @tweakable Delay before UI renderings in ms */
        this.renderDelay = 10;
    }
    
    /**
     * Extract event ID from the URL query parameters
     * @returns {string|null} The event ID from URL or null if not found
     */
    static getEventIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }
    
    /**
     * Render the event details on the page
     * @param {Object} eventData - The data for the event to render
     */
    renderEventDetails(eventData) {
        // Update page title
        document.title = `${eventData.title} - Детали мероприятия`;
        
        // Update event banner content
        const eventTitle = document.querySelector('.event-title');
        const eventDate = document.querySelector('.event-date');
        const eventPrice = document.querySelector('.event-price');
        const eventBanner = document.querySelector('.event-banner');
        const eventDescription = document.querySelector('.event-description p');
        
        if (eventTitle) eventTitle.textContent = eventData.title;
        
        if (eventDate) {
            const timeElement = eventDate.querySelector('.event-time');
            if (timeElement && eventData.time) {
                timeElement.textContent = `В ${eventData.time}`;
            }
        }
        
        if (eventPrice) {
            const priceText = eventData.price === "Бесплатно" ? 
                "Бесплатно" : 
                `от ${eventData.price}₽`;
            eventPrice.innerHTML = `<i class="fas fa-tag"></i> ${priceText}`;
        }
        
        if (eventBanner && eventData.background) {
            eventBanner.style.backgroundImage = eventData.background;
        }
        
        if (eventDescription && eventData.details) {
            eventDescription.textContent = eventData.details;
        }
    }
    
    /**
     * Show a toast notification
     * @param {string} message - The message to display in the toast
     */
    static showToast(message) {
        /* @tweakable Toast duration in ms */
        const TOAST_DURATION = 3000;
        /* @tweakable Toast fade in/out duration in ms */
        const FADE_DURATION = 300;
        
        // Create and show a toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        // Apply styles
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            zIndex: '1000',
            opacity: '0',
            transition: `opacity ${FADE_DURATION}ms ease`
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, FADE_DURATION);
        }, TOAST_DURATION);
    }
    
    /**
     * Copy text to clipboard
     * @param {string} text - The text to copy
     * @returns {boolean} - Whether the copy was successful
     */
    static copyToClipboard(text) {
        try {
            // Create temporary input element
            const input = document.createElement('input');
            input.style.position = 'fixed';
            input.style.opacity = '0';
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            return true;
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    }
}

// Export the class for use in other modules
window.UIHelper = UIHelper;