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