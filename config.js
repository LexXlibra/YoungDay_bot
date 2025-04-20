// Configuration settings for the app
const config = {
    /* @tweakable Application settings */
    app: {
        /* @tweakable The main title of the application */
        title: "Sale Ticket",
        /* @tweakable Subtitle displayed in the header */
        subtitle: "Тивет",
        /* @tweakable Time indicator text */
        timeIndicator: "В.46"
    },

    sections: [
        {
            title: "Хранители",
            tabs: ["Постеры", "Создатели", "Локации"]
        }
    ],

    /* @tweakable Navigation bar items */
    navigation: [
        { icon: "home", /* @tweakable Label for the Home navigation item */ label: "Главная", active: true },
        { icon: "search", /* @tweakable Label for the Search navigation item */ label: "Поиск" },
        { icon: "heart", /* @tweakable Label for the Favorites navigation item */ label: "Избранное" },
        { icon: "ticket-alt", /* @tweakable Label for the Tickets navigation item */ label: "Билеты" },
        { icon: "user", /* @tweakable Label for the Profile navigation item */ label: "Профиль" }
    ],

    cardTemplates: {
        /* @tweakable Background colors for cards */
        backgroundColors: ["blue", "orange", "pink", "white", "purple"],
        defaultStyles: {
            timePosition: "top-left",
            pricePosition: "top-right",
            profilePosition: "bottom-right"
        }
    },

    /* @tweakable Data for the cards displayed in the app */
    cardData: [
        {
            /* @tweakable Title of the first card */
            title: "Виндал Порье",
            /* @tweakable Subtitle of the first card */
            subtitle: "Ул. Жуга",
            background: "url('https://img.freepik.com/free-photo/hand-writing-notebook-laptop_23-2148304971.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the first card */
            badge: "Завтра",
            /* @tweakable Price for the first card */
            price: "50",
            /* @tweakable Detailed description for the first event */
            details: "Уникальное мероприятие, где вы сможете познакомиться с современными технологиями и их применением в повседневной жизни. Включает в себя практические семинары и демонстрации.",
            /* @tweakable Time of the first event */
            time: "19:00",
            /* @tweakable Event indicators */
            indicators: [
                { type: "age", tooltip: "18+" },
                { type: "discount", tooltip: "Скидка 15% для студентов" }
            ]
        },
        {
            /* @tweakable Title of the second card */
            title: "Фандари Дискей",
            /* @tweakable Subtitle of the second card */
            subtitle: "Ул. Алтавес",
            background: "url('https://img.freepik.com/premium-vector/single-page-application-abstract-concept-vector-illustration_107173-25232.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the second card */
            badge: "Сегодня",
            /* @tweakable Price for the second card */
            price: "Бесплатно",
            /* @tweakable Detailed description for the second event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the second event */
            time: "21:30",
            /* @tweakable Event indicators */
            indicators: [
                { type: "bonus", tooltip: "Welcome-напиток в подарок" },
                { type: "dressCode", tooltip: "Black Tie" }
            ]
        },
        {
            /* @tweakable Title of the third card */
            title: "Вер Фор",
            /* @tweakable Subtitle of the third card */
            subtitle: "Ул. Федорова",
            background: "url('https://img.freepik.com/premium-photo/woman-is-sitting-floor-with-laptop-his-legs-plain-background_1096167-121005.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the third card */
            badge: "Послезавтра",
            /* @tweakable Price for the third card */
            price: "25",
            /* @tweakable Detailed description for the third event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the third event */
            time: "14:00",
            /* @tweakable Event indicators */
            indicators: [
               { type: "priceIncrease", tooltip: "Цена возрастет на 20% завтра" }
            ]
        },
        {
            /* @tweakable Title of the fourth card */
            title: "Лаггинг Файты",
            /* @tweakable Subtitle of the fourth card */
            subtitle: "Детали события",
            background: "url('https://img.freepik.com/free-photo/black-white-portrait-digital-nomads_23-2148372302.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the fourth card */
            badge: "Завтра",
            /* @tweakable Price for the fourth card */
            price: "50",
            /* @tweakable Detailed description for the fourth event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the fourth event */
            time: "22:00",
            /* @tweakable Event indicators */
            indicators: [
                { type: "popular", tooltip: "Популярное место" }
            ]
        },
        {
            /* @tweakable Title of the fifth card */
            title: "ТАЙМУФ ТИВЕ",
            /* @tweakable Subtitle of the fifth card */
            subtitle: "Выступление",
            background: "url('https://img.freepik.com/free-photo/coworkers-sitting-desk-with-documents-gadgets_273609-41529.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the fifth card */
            badge: "Сегодня",
            /* @tweakable Price for the fifth card */
            price: "35",
            /* @tweakable Detailed description for the fifth event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the fifth event */
            time: "18:00",
            /* @tweakable Event indicators */
            indicators: [
               { type: "featured", tooltip: "Избранный организатор" }
            ]
        },
        {
            /* @tweakable Title of the sixth card */
            title: "Мизера Паунды",
            /* @tweakable Subtitle of the sixth card */
            subtitle: "Художественная выставка",
            background: "url('https://img.freepik.com/free-photo/black-white-portrait-digital-nomads_23-2151253973.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the sixth card */
            badge: "Завтра",
            /* @tweakable Price for the sixth card */
            price: "25",
            /* @tweakable Detailed description for the sixth event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the sixth event */
            time: "12:30",
            /* @tweakable Event indicators */
            indicators: []
        },
        {
            /* @tweakable Title of the seventh card */
            title: "Новая Афиша 1",
            /* @tweakable Subtitle of the seventh card */
            subtitle: "Описание события 1",
            background: "url('https://img.freepik.com/free-photo/surprised-man-looking-laptop_23-2148372302.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the seventh card */
            badge: "10.05.2024",
            /* @tweakable Price for the seventh card */
            price: "30",
            /* @tweakable Detailed description for the seventh event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the seventh event */
            time: "15:00",
            /* @tweakable Event indicators */
            indicators: []
        },
        {
            /* @tweakable Title of the eighth card */
            title: "Новая Афиша 2",
            /* @tweakable Subtitle of the eighth card */
            subtitle: "Описание события 2",
            background: "url('https://img.freepik.com/free-photo/view-3d-businessman_23-2150709870.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the eighth card */
            badge: "11.05.2024",
            /* @tweakable Price for the eighth card */
            price: "40",
            /* @tweakable Detailed description for the eighth event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the eighth event */
            time: "20:00",
            /* @tweakable Event indicators */
            indicators: []
        },
        {
            /* @tweakable Title of the ninth card */
            title: "Новая Афиша 3",
            /* @tweakable Subtitle of the ninth card */
            subtitle: "Описание события 3",
            background: "url('https://img.freepik.com/premium-photo/businessman-working-project_53876-77624.jpg?ga=GA1.1.1220801245.1743447506&semt=ais_hybrid')",
            /* @tweakable Badge text for the ninth card */
            badge: "12.05.2024",
            /* @tweakable Price for the ninth card */
            price: "Бесплатно",
            /* @tweakable Detailed description for the ninth event */
            details: "Детальное описание мероприятия...",
            /* @tweakable Time of the ninth event */
            time: "10:00",
            /* @tweakable Event indicators */
            indicators: []
        }
    ],
    /* @tweakable Font settings for the app */
    fonts: {
        /* @tweakable Primary font family */
        primary: "NauryzRedKeds",
        version: "1.0",
        details: "Red;NauryzRedKeds;2024;FL720"
    },
    /* @tweakable Animation settings */
    animations: {
        /* @tweakable Duration of the card transition in ms */
        cardTransitionDuration: 300,
        /* @tweakable Timing function for animations */
        timingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        /* @tweakable Delay before showing details in ms */
        detailsDelay: 150,
        /* @tweakable Animation duration for hiding details in ms */
        hideDetailsDuration: 300, 
        /* @tweakable Animation duration for sphere hover effect in ms */
        sphereHoverDuration: 200, 
        /* @tweakable Animation duration for details appearance in ms */
        detailsAppearanceDuration: 300, 
        /* @tweakable Card appearance animation duration in ms */
        cardAppearDuration: 400,
        /* @tweakable Card appearance animation timing function */
        cardAppearTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        /* @tweakable Card disappearance animation duration in ms */
        cardDisappearDuration: 300,
        /* @tweakable Card reappearance animation duration in ms */
        cardReappearDuration: 400,
        /* @tweakable Card reappearance animation timing function */
        cardReappearTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        /* @tweakable Card reappearance starting opacity */
        cardReappearStartOpacity: 0,
        /* @tweakable Card reappearance starting scale */
        cardReappearStartScale: 0.98,
        /* @tweakable Details appearance animation duration in ms */
        detailsAppearDuration: 400,
        /* @tweakable Details disappearance animation duration in ms */
        detailsDisappearDuration: 300,
        /* @tweakable Scale factor for card appearance animation start */
        cardAppearStartScale: 0.95,
        /* @tweakable Y-offset for details appearance animation start in px */
        detailsAppearYOffset: 15,
        /* @tweakable Overlap duration for smooth transition between animations in ms */
        animationOverlapDuration: 50,
        /* @tweakable Auto-hide delay for card details in minutes */
        autoHideDelayMinutes: 1
    }
};

// You can modify the values above to customize the app