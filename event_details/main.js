document.addEventListener('DOMContentLoaded', () => {
    // Initialize all the necessary modules
    const eventId = UIHelper.getEventIdFromUrl() || 1;
    const eventData = DataService.getEventData(eventId);
    
    // Initialize modules
    const uiHelper = new UIHelper();
    const animationManager = new AnimationManager();
    const indicatorsManager = new IndicatorsManager();
    const profilesManager = new ProfilesManager();
    const mapManager = new MapManager();
    const interactionManager = new InteractionManager();
    
    // Setup the page
    uiHelper.renderEventDetails(eventData);
    indicatorsManager.addEventIndicators(eventData);
    mapManager.initMap();
    interactionManager.setupEventListeners();
    profilesManager.setupProfilesListToggles();
    
    // Start animations after a small delay
    setTimeout(() => {
        animationManager.triggerAnimations();
    }, animationManager.animationStartDelay);
});