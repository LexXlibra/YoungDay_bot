/**
 * Core Layout Management Module
 * Handles different layout modes and core layout functionality
 */
class LayoutManager {
    constructor(app, config) {
        /* @tweakable Base configuration for layout modes */
        this.layoutModes = {
            compact: {
                columns: 2,
                /* @tweakable Minimum width for compact mode */
                minWidth: 320,
                /* @tweakable Maximum width for compact mode */
                maxWidth: 767
            },
            standard: {
                columns: 4,
                /* @tweakable Minimum width for standard mode */
                minWidth: 768,
                /* @tweakable Maximum width for standard mode */
                maxWidth: 1199
            },
            canvas: {
                /* @tweakable Default canvas scale */
                defaultScale: 1,
                /* @tweakable Minimum canvas scale */
                minScale: 0.5,
                /* @tweakable Maximum canvas scale */
                maxScale: 2
            }
        };

        this.app = app;
        this.config = config;
        
        /* @tweakable Size of the control buttons in pixels */
        this.controlButton = '32px';
        /* @tweakable Space between control buttons */
        this.buttonSpace = '10px';

        // Internal state management
        this.state = {
            currentMode: 'standard',
            canvasScale: this.layoutModes.canvas.defaultScale,
            canvasPosition: { x: 0, y: 0 }
        };

        // Components
        this.controlsManager = new LayoutControlsManager(this);
        this.interactionManager = new LayoutInteractionManager(this);
        this.responsiveManager = new ResponsiveLayoutManager(this);

        this.initialize();
    }

    /**
     * Initialize the layout management system
     */
    initialize() {
        this.responsiveManager.setupResponsiveListeners();
        this.controlsManager.createLayoutControls();
        this.interactionManager.setupGlobalInteractions();
    }

    /**
     * Set the current layout mode
     * @param {string} mode - The layout mode to set
     * @param {boolean} [animate=true] - Whether to animate the transition
     */
    setLayoutMode(mode, animate = true) {
        // Validate mode
        if (!this.layoutModes[mode]) {
            console.warn(`Invalid layout mode: ${mode}`);
            return;
        }

        // Update mode
        this.state.currentMode = mode;

        // Trigger layout application
        const cardGrid = document.querySelector('.card-grid');
        if (!cardGrid) return;

        // Apply mode-specific styles
        switch(mode) {
            case 'compact':
                this.applyCompactMode(cardGrid, animate);
                break;
            case 'standard':
                this.applyStandardMode(cardGrid, animate);
                break;
            case 'canvas':
                this.applyCanvasMode(cardGrid, animate);
                break;
        }

        // Update card interactions
        this.updateCardInteractions();
    }

    /**
     * Apply compact mode layout
     * @param {HTMLElement} cardGrid - The card grid element
     * @param {boolean} animate - Whether to animate the transition
     */
    applyCompactMode(cardGrid, animate) {
        // Basic grid setup
        cardGrid.style.gridTemplateColumns = `repeat(${this.layoutModes.compact.columns}, 1fr)`;
        this.resetCardStyles(cardGrid);
    }

    /**
     * Apply standard mode layout
     * @param {HTMLElement} cardGrid - The card grid element
     * @param {boolean} animate - Whether to animate the transition
     */
    applyStandardMode(cardGrid, animate) {
        // Basic grid setup
        cardGrid.style.gridTemplateColumns = `repeat(${this.layoutModes.standard.columns}, 1fr)`;
        this.resetCardStyles(cardGrid);
    }

    /**
     * Apply canvas mode layout
     * @param {HTMLElement} cardGrid - The card grid element
     * @param {boolean} animate - Whether to animate the transition
     */
    applyCanvasMode(cardGrid, animate) {
        // Basic grid setup
        cardGrid.style.display = 'block';
        cardGrid.style.position = 'relative';
        cardGrid.style.height = '100vh';
        cardGrid.style.overflow = 'hidden';
        cardGrid.style.transform = `scale(${this.state.canvasScale}) translate(${this.state.canvasPosition.x}px, ${this.state.canvasPosition.y}px)`;
        this.resetCardStyles(cardGrid);
    }

    /**
     * Reset card styles after layout change
     * @param {HTMLElement} cardGrid - The card grid element
     */
    resetCardStyles(cardGrid) {
        const cards = cardGrid.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.position = '';
            card.style.transform = '';
            card.style.transition = '';
            card.style.zIndex = '';
        });
    }

    /**
     * Update card interaction behavior
     */
    updateCardInteractions() {
        if (this.app.cardInteractions) {
            this.app.cardInteractions.updateInteractionMode(this.state.currentMode);
        }
    }
}

/**
 * Layout Controls Manager
 * Handles creation and management of layout control buttons
 */
class LayoutControlsManager {
    constructor(layoutManager) {
        this.layoutManager = layoutManager;
        
        /* @tweakable Visibility threshold for layout controls */
        this.visibilityThreshold = 768;
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
        
        // Create buttons for each layout mode
        controlsContainer.innerHTML = `
            <button class="layout-btn compact-btn" title="Компактный вид">
                <i class="fas fa-th-large"></i>
            </button>
            <button class="layout-btn standard-btn active" title="Стандартный вид">
                <i class="fas fa-th"></i>
            </button>
            <button class="layout-btn canvas-btn" title="Режим полотна">
                <i class="fas fa-border-all"></i>
            </button>
        `;

        // Add to header
        header.appendChild(controlsContainer);

        // Setup event listeners
        this.setupControlListeners(controlsContainer);
        this.toggleControlsVisibility();
    }

    /**
     * Setup event listeners for layout control buttons
     * @param {HTMLElement} controlsContainer - The controls container element
     */
    setupControlListeners(controlsContainer) {
        const compactBtn = controlsContainer.querySelector('.compact-btn');
        const standardBtn = controlsContainer.querySelector('.standard-btn');
        const canvasBtn = controlsContainer.querySelector('.canvas-btn');

        compactBtn.addEventListener('click', () => this.layoutManager.setLayoutMode('compact'));
        standardBtn.addEventListener('click', () => this.layoutManager.setLayoutMode('standard'));
        canvasBtn.addEventListener('click', () => this.layoutManager.setLayoutMode('canvas'));
    }

    /**
     * Toggle controls visibility based on screen size
     */
    toggleControlsVisibility() {
        const controls = document.querySelector('.layout-controls');
        if (!controls) return;

        controls.classList.toggle('hidden', window.innerWidth < this.visibilityThreshold);
    }
}

/**
 * Responsive Layout Manager
 * Handles responsive layout changes and screen size detection
 */
class ResponsiveLayoutManager {
    constructor(layoutManager) {
        this.layoutManager = layoutManager;
        
        /* @tweakable Debounce delay for resize events */
        this.resizeDebounceDelay = 250;
    }

    /**
     * Setup responsive layout listeners
     */
    setupResponsiveListeners() {
        window.addEventListener('resize', this.debounce(() => {
            this.handleResponsiveLayoutChange();
        }, this.resizeDebounceDelay));

        // Initial check
        this.handleResponsiveLayoutChange();
    }

    /**
     * Handle responsive layout changes
     */
    handleResponsiveLayoutChange() {
        const width = window.innerWidth;
        let newMode = 'standard';

        // Determine layout mode based on width
        if (width < this.layoutManager.layoutModes.compact.maxWidth) {
            newMode = 'compact';
        } else if (width >= this.layoutManager.layoutModes.standard.minWidth && 
                   width < this.layoutManager.layoutModes.standard.maxWidth) {
            newMode = 'standard';
        } else if (width >= this.layoutManager.layoutModes.standard.maxWidth) {
            newMode = 'standard'; // Prefer standard mode
        }

        // Update layout if mode has changed
        if (newMode !== this.layoutManager.state.currentMode) {
            this.layoutManager.setLayoutMode(newMode, false);
        }

        // Update controls visibility
        this.layoutManager.controlsManager.toggleControlsVisibility();
    }

    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

/**
 * Layout Interaction Manager
 * Handles touch and mouse interactions for layout modes
 */
class LayoutInteractionManager {
    constructor(layoutManager) {
        this.layoutManager = layoutManager;
        
        /* @tweakable Pinch zoom sensitivity */
        this.pinchZoomSensitivity = 0.01;
        
        /* @tweakable Minimum and maximum touch distances for mode switching */
        this.zoomThresholds = {
            modeSwitch: {
                zoomOut: 0.8,
                zoomIn: 1.2
            }
        };
    }

    /**
     * Setup global interactions for layout modes
     */
    setupGlobalInteractions() {
        const section = document.querySelector('.section');
        if (!section) return;

        // Touch interactions
        section.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        section.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        section.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Mouse wheel interactions
        section.addEventListener('wheel', this.handleMouseWheel.bind(this), { passive: false });
    }

    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            // Pinch zoom preparation
            this.initialTouchDistance = this.calculateTouchDistance(e.touches);
        }
    }

    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        if (e.touches.length === 2) {
            this.handlePinchZoom(e);
        }
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd() {
        // Reset touch-related properties
        this.initialTouchDistance = null;
    }

    /**
     * Handle mouse wheel event for zooming
     * @param {WheelEvent} e - Wheel event
     */
    handleMouseWheel(e) {
        if (this.layoutManager.state.currentMode === 'canvas') {
            e.preventDefault();
            // Basic zoom logic would go here
        }
    }

    /**
     * Calculate distance between two touch points
     * @param {TouchList} touches - Touch points
     * @returns {number} Distance between touch points
     */
    calculateTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Handle pinch zoom interactions
     * @param {TouchEvent} e - Touch event
     */
    handlePinchZoom(e) {
        // Calculate new distance
        const currentDistance = this.calculateTouchDistance(e.touches);

        // Calculate zoom level change
        const change = currentDistance / this.initialTouchDistance;

        // Check for mode switching
        if (change < this.zoomThresholds.modeSwitch.zoomOut) {
            if (this.layoutManager.state.currentMode === 'standard') {
                this.layoutManager.setLayoutMode('compact');
            }
        } else if (change > this.zoomThresholds.modeSwitch.zoomIn) {
            if (this.layoutManager.state.currentMode === 'compact') {
                this.layoutManager.setLayoutMode('standard');
            }
        }

        // Update initial touch distance
        this.initialTouchDistance = currentDistance;
    }
}

// Export the class for use in app.js
window.LayoutManager = LayoutManager;