class MapManager {
    constructor() {
        /* @tweakable Map zoom level (higher number = closer zoom) */
        this.mapZoomLevel = 15;
        
        /* @tweakable Latitude for event location */
        this.eventLat = 55.753215;
        
        /* @tweakable Longitude for event location */
        this.eventLng = 37.622504;
        
        /* @tweakable Animation duration for map elements in ms */
        this.mapAnimationDuration = 400;
        
        /* @tweakable Map border radius in pixels */
        this.mapBorderRadius = 12;
    }
    
    /**
     * Initialize the map with event location
     */
    initMap() {
        // Initialize map (using Yandex Maps in this example)
        const mapElement = document.getElementById('eventMap');
        if (!mapElement) return;
        
        // Check if Yandex Maps API is loaded
        if (typeof ymaps !== 'undefined') {
            ymaps.ready(() => {
                const map = new ymaps.Map('eventMap', {
                    center: [this.eventLat, this.eventLng],
                    zoom: this.mapZoomLevel,
                    controls: ['zoomControl']
                });
                
                const placemark = new ymaps.Placemark([this.eventLat, this.eventLng], {
                    hintContent: 'Место проведения'
                }, {
                    preset: 'islands#redDotIcon'
                });
                
                map.geoObjects.add(placemark);
                
                // Apply custom styling to map container
                mapElement.style.borderRadius = `${this.mapBorderRadius}px`;
                mapElement.style.overflow = 'hidden';
            });
        } else {
            // Fallback for when maps API is not available
            this.displayMapFallback(mapElement);
        }
    }
    
    /**
     * Display a fallback when map cannot be loaded
     * @param {HTMLElement} mapElement - The map container element
     */
    displayMapFallback(mapElement) {
        mapElement.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; text-align: center; color: var(--secondary-color);">
                <div>
                    <i class="fas fa-map-marker-alt" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Карта временно недоступна</p>
                </div>
            </div>
        `;
        
        // Apply custom styling to fallback
        mapElement.style.borderRadius = `${this.mapBorderRadius}px`;
        mapElement.style.backgroundColor = '#f5f5f5';
    }
}

// Export the class for use in other modules
window.MapManager = MapManager;