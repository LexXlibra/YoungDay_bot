/**
 * Controls Manager
 * Handles layout control UI elements
 */
class ControlsManager {
    constructor(manager) {
        this.manager = manager;
        
        /* @tweakable Layout control button size in pixels */
        this.controlButtonSize = 32;
        
        /* @tweakable Layout control button spacing in pixels */
        this.controlButtonSpacing = 10;
        
        /* @tweakable Layout control button opacity when not active */
        this.inactiveButtonOpacity = 0.7;
        
        /* @tweakable Layout control button background color when active */
        this.activeButtonBgColor = 'rgba(0, 0, 0, 0.05)';
        
        /* @tweakable Layout control container right margin */
        this.controlsContainerMargin = 16;
        
        /* @tweakable Button hover background opacity */
        this.buttonHoverOpacity = 0.1;
        
        /* @tweakable Button hover scale factor */
        this.buttonHoverScale = 1.05;
        
        /* @tweakable Button active scale factor */
        this.buttonActiveScale = 0.95;
    }

    /**
     * Initialize layout controls and event listeners
     */
    initLayoutControls() {
        // Create and add layout controls to the page
        this.createLayoutControls();
        
        // Check initial screen size and set appropriate layout
        this.manager.checkScreenSize();
        
        // Add window resize listener
        window.addEventListener('resize', () => {
            this.manager.checkScreenSize();
        });
    }

    /**
     * Create layout control buttons
     */
    createLayoutControls() {
        const header = document.querySelector('header');
        if (!header) return;
        
        // Create controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'layout-controls';
        controlsContainer.style.marginRight = `${this.controlsContainerMargin}px`;
        
        // Create buttons for each layout mode
        controlsContainer.innerHTML = `
            <button class="layout-btn compact-btn" title="Компактный вид">
                <i class="fas fa-grip-horizontal"></i>
            </button>
            <button class="layout-btn standard-btn" title="Стандартный вид">
                <i class="fas fa-grip-vertical"></i>
            </button>
            <button class="layout-btn canvas-btn" title="Режим полотна">
                <i class="fas fa-border-all"></i>
            </button>
        `;

        // Add styles for header layout controls
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .layout-controls {
                display: flex;
                align-items: center;
                gap: ${this.controlButtonSpacing}px;
                margin-left: auto;
            }

            .layout-btn {
                width: ${this.controlButtonSize}px;
                height: ${this.controlButtonSize}px;
                border: none;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                background: transparent;
                color: var(--secondary-color);
                opacity: ${this.inactiveButtonOpacity};
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .layout-btn:hover {
                background-color: rgba(0, 0, 0, ${this.buttonHoverOpacity});
                transform: scale(${this.buttonHoverScale});
            }

            .layout-btn:active {
                transform: scale(${this.buttonActiveScale});
            }

            .layout-btn.active {
                background-color: ${this.activeButtonBgColor};
                opacity: 1;
                color: var(--primary-color);
            }

            @media (max-width: 768px) {
                .layout-controls {
                    display: none;
                }
            }
        `;
        document.head.appendChild(styleSheet);

        // Add to header
        header.appendChild(controlsContainer);
        
        // Add event listeners
        this.setupLayoutButtons(controlsContainer);
    }

    setupLayoutButtons(controlsContainer) {
        const buttons = {
            compact: controlsContainer.querySelector('.compact-btn'),
            standard: controlsContainer.querySelector('.standard-btn'),
            canvas: controlsContainer.querySelector('.canvas-btn')
        };

        // Set initial active state
        buttons[this.manager.core.currentMode]?.classList.add('active');

        // Add click handlers
        Object.entries(buttons).forEach(([mode, btn]) => {
            btn.addEventListener('click', () => {
                this.manager.setLayoutMode(mode);
                
                // Update active states
                Object.values(buttons).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    /**
     * Toggle controls visibility based on screen size
     */
    toggleControlsVisibility() {
        const controls = document.querySelector('.layout-controls');
        if (!controls) return;
        
        if (window.innerWidth < this.manager.compactViewThreshold) {
            controls.classList.add('hidden');
        } else {
            controls.classList.remove('hidden');
        }
    }
}

// Export the class
window.ControlsManager = ControlsManager;