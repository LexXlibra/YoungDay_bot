class InteractionManager {
    constructor() {
        /* @tweakable Duration of share tooltip visibility in ms */
        this.shareTooltipDuration = 2000;
        
        /* @tweakable Delay before showing tooltips in ms */
        this.tooltipDelay = 300;
        
        /* @tweakable Copy address success animation duration in ms */
        this.copySuccessAnimationDuration = 1000;
        
        /* @tweakable Toast notification auto-hide duration in ms */
        this.toastDuration = 3000;
    }
    
    /**
     * Setup all event listeners for page interactions
     */
    setupEventListeners() {
        this.setupBuyTicketButton();
        this.setupShareButton();
        this.setupProfileCardInteractions();
        this.setupCopyAddressButton();
    }
    
    /**
     * Setup buy ticket button functionality
     */
    setupBuyTicketButton() {
        const buyTicketBtn = document.getElementById('buyTicketBtn');
        if (buyTicketBtn) {
            buyTicketBtn.addEventListener('click', () => {
                UIHelper.showToast('Покупка билета будет доступна позже');
            });
        }
    }
    
    /**
     * Setup share button functionality
     */
    setupShareButton() {
        const shareButton = document.querySelector('.share-button');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                // Try to use native sharing if available
                if (navigator.share) {
                    navigator.share({
                        title: document.title,
                        url: window.location.href
                    }).catch(err => {
                        console.error('Share failed:', err);
                        UIHelper.showToast('Поделиться не удалось');
                    });
                } else {
                    // Fallback for browsers without native sharing
                    const success = UIHelper.copyToClipboard(window.location.href);
                    UIHelper.showToast(success ? 
                        'Ссылка скопирована в буфер обмена' : 
                        'Не удалось скопировать ссылку');
                }
            });
        }
    }
    
    /**
     * Setup profile card click interactions
     */
    setupProfileCardInteractions() {
        const profileCards = document.querySelectorAll('.profile-item');
        profileCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if star button was clicked
                if (e.target.closest('.star-button')) return;
                
                const name = card.querySelector('.profile-name').textContent;
                UIHelper.showToast(`Профиль: ${name}`);
            });
        });
    }
    
    /**
     * Setup copy address button functionality
     */
    setupCopyAddressButton() {
        const copyAddressBtn = document.getElementById('copyAddressBtn');
        if (copyAddressBtn) {
            copyAddressBtn.addEventListener('click', () => {
                const addressText = document.getElementById('eventAddress').textContent;
                const success = UIHelper.copyToClipboard(addressText);
                
                if (success) {
                    // Show success animation
                    copyAddressBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyAddressBtn.style.color = '#34c759';
                    UIHelper.showToast('Адрес скопирован');
                    
                    // Reset after animation
                    setTimeout(() => {
                        copyAddressBtn.innerHTML = '<i class="fas fa-copy"></i>';
                        copyAddressBtn.style.color = '';
                    }, this.copySuccessAnimationDuration);
                } else {
                    UIHelper.showToast('Не удалось скопировать адрес');
                }
            });
        }
    }
}

// Export the class for use in other modules
window.InteractionManager = InteractionManager;