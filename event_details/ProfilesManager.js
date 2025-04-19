class ProfilesManager {
    constructor() {
        /* @tweakable Animation duration for carousel expansion in ms */
        this.animationDuration = 400;
        
        /* @tweakable Timing function for animations */
        this.animationTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';
        
        /* @tweakable Default carousel height (collapsed) in pixels */
        this.defaultCarouselHeight = 180;
        
        /* @tweakable Profile item border radius in pixels */
        this.itemBorderRadius = 12;
        
        /* @tweakable Icon rotation degree when expanded */
        this.expandIconRotation = 180;
    }
    
    /**
     * Setup all profile-related interactions
     */
    setupProfilesListToggles() {
        this.setupExpandCarousel();
        this.setupParticipantTabs();
        this.setupStarButtons();
    }
    
    /**
     * Setup the expand/collapse functionality for the carousel
     */
    setupExpandCarousel() {
        const expandBtn = document.getElementById('expandCarouselBtn');
        const carouselWrapper = document.querySelector('.carousel-wrapper');
        
        if (expandBtn && carouselWrapper) {
            expandBtn.addEventListener('click', () => {
                const isExpanded = carouselWrapper.classList.contains('expanded');
                
                // Toggle expanded state
                carouselWrapper.classList.toggle('expanded');
                
                // Update button text and icon
                const icon = expandBtn.querySelector('i');
                
                if (isExpanded) {
                    expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Показать всех';
                } else {
                    expandBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Свернуть';
                    
                    // Smooth scroll to carousel if expanding
                    setTimeout(() => {
                        carouselWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
                
                // Toggle parent class for styling
                expandBtn.closest('.carousel-container').classList.toggle('carousel-expanded');
            });
        }
    }
    
    /**
     * Setup tabs for different participant types
     */
    setupParticipantTabs() {
        const tabs = document.querySelectorAll('.participant-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding carousel and hide others
                const tabId = tab.getAttribute('data-tab');
                const carousels = document.querySelectorAll('.profiles-carousel');
                
                carousels.forEach(carousel => {
                    carousel.classList.add('hidden');
                });
                
                const activeCarousel = document.getElementById(`${tabId}-carousel`);
                if (activeCarousel) {
                    activeCarousel.classList.remove('hidden');
                }
            });
        });
    }
    
    /**
     * Setup star buttons for marking favorites
     */
    setupStarButtons() {
        document.querySelectorAll('.star-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const icon = button.querySelector('i');
                if (icon) {
                    icon.classList.toggle('far');
                    icon.classList.toggle('fas');
                    
                    // Show a toast when favorited/unfavorited
                    const isFavorited = icon.classList.contains('fas');
                    const profileName = button.closest('.profile-item').querySelector('.profile-name').textContent;
                    
                    UIHelper.showToast(isFavorited 
                        ? `${profileName} добавлен в избранное` 
                        : `${profileName} удален из избранного`);
                }
                
                // Prevent event from bubbling to the profile card
                e.stopPropagation();
            });
        });
    }
}

// Export the class for use in other modules
window.ProfilesManager = ProfilesManager;