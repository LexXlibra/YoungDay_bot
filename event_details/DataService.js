class DataService {
    /**
     * Get event data from config or API
     * @param {string|number} eventId - The ID of the event to fetch
     * @returns {Object} - The event data
     */
    static getEventData(eventId) {
        // In a real app, this would fetch data from an API
        // For now, we'll use one of the events from config
        return config.cardData[eventId] || config.cardData[0];
    }
    
    /**
     * Get additional details for a specific indicator type
     * @param {string} type - The type of indicator
     * @returns {string} - Additional details HTML
     */
    static getIndicatorExtraDetails(type) {
        /* @tweakable Animation duration for fetching indicator details */
        const FETCH_ANIMATION_DURATION = 200;
        
        const details = {
            age: "Это мероприятие предназначено для взрослой аудитории. Для входа потребуется документ, удостоверяющий личность.",
            discount: "Скидка доступна при предъявлении студенческого билета. Скидка не суммируется с другими акциями.",
            bonus: "Приветственный напиток можно получить при входе, предъявив билет на мероприятие. Предложение действительно до начала основной программы.",
            dressCode: "Дресс-код Black Tie подразумевает строгий вечерний наряд: для мужчин — смокинг, для женщин — вечернее платье.",
            priceIncrease: "Цена билетов увеличится за день до мероприятия. Рекомендуем приобрести билеты заранее по выгодной цене.",
            popular: "Это одно из самых популярных мероприятий этого сезона. Количество мест ограничено, рекомендуем приобрести билеты заранее.",
            featured: "Это мероприятие отмечено организаторами как особо рекомендуемое. Оно обещает быть ярким и запоминающимся событием."
        };
        
        return details[type] ? `<p style="margin-top:8px">${details[type]}</p>` : '';
    }
}

// Export the class for use in other modules
window.DataService = DataService;