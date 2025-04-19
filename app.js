document.addEventListener('DOMContentLoaded', () => {
    class MobileApp {
        constructor(config) {
            this.config = config;
            this.activeCard = null;
            this.hideTimeout = null;
            this.lastScrollPosition = window.scrollY;

            // Initialize our systems
            this.indicatorsSystem = new EventIndicatorsSystem();
            this.cardLoader = new CardLoaderSystem(config);
            this.cardInteractions = new CardInteractions(this, config);
            
            // Initialize the layout manager (new)
            this.layoutManager = new LayoutManager(this, config);

            this.initializeApp();
            this.setupClickOutsideListener();
        }

        initializeApp() {
            this.renderHeader();
            this.renderNavigation();
            this.indicatorsSystem.initializeIndicators();

            // Use the cardLoader for initial card rendering
            this.cardLoader.initialize((cards, isInitial, isLoading, isRefreshing) => {
                this.renderCards(cards, isInitial, isLoading, isRefreshing);
            });
        }

        renderHeader() {
            const header = document.querySelector('header');
            header.innerHTML = `
                <div class="title-container">
                    <h1>${this.config.app.title} <span class="time">${this.config.app.timeIndicator}</span></h1>
                </div>
                <div></div>
            `;
        }

        renderNavigation() {
            const navContainer = document.querySelector('.bottom-nav');
            navContainer.innerHTML = this.config.navigation.map(item =>
                `<a href="#" class="nav-item ${item.active ? 'active' : ''}">
                    <i class="fas fa-${item.icon}"></i>
                    <span>${item.label}</span>
                </a>`
            ).join('');
        }

        renderCards(cards, isInitial = true, isLoading = false, isRefreshing = false) {
            // Get or create section and card grid
            const section = document.querySelector('.section');
            let cardGrid = document.querySelector('.card-grid');

            if (isInitial || !cardGrid) {
                section.innerHTML = '<div class="card-grid compact-grid"></div>';
                cardGrid = section.querySelector('.card-grid');
            }

            // Handle refresh state
            if (isRefreshing) {
                const loadMoreBtn = document.getElementById('loadMoreButton');
                if (loadMoreBtn) {
                    const icon = loadMoreBtn.querySelector('i');
                    if (icon) {
                        icon.classList.add('refreshing');
                    }
                }
                return;
            }

            // Handle loading state
            if (isLoading) {
                // Add loading placeholders
                /* @tweakable Number of loading placeholders to show */
                const LOADING_PLACEHOLDERS = 3;

                for (let i = 0; i < LOADING_PLACEHOLDERS; i++) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'card loading-card';
                    placeholder.innerHTML = '<div class="card-image"><div class="card-placeholder"></div></div>';
                    cardGrid.appendChild(placeholder);
                }
                return;
            }

            // If we're refreshing or this is initial load, remove all existing cards
            if (isInitial) {
                while (cardGrid.firstChild) {
                    cardGrid.removeChild(cardGrid.firstChild);
                }
            } else {
                // Remove any loading placeholders
                document.querySelectorAll('.loading-card').forEach(placeholder => {
                    placeholder.remove();
                });
            }

            // Render the cards
            if (cards && cards.length) {
                cards.forEach((card, index) => {
                    const cardElement = document.createElement('div');
                    cardElement.innerHTML = this.createCardHTML(card, index);
                    const cardNode = cardElement.firstElementChild;

                    /* @tweakable Stagger delay between each card animation */
                    const staggerDelay = 50;
                    cardNode.style.animationDelay = `${index * staggerDelay}ms`;

                    cardGrid.appendChild(cardNode);
                });
            }

            // Always add/update the load more button
            this.updateLoadMoreButton(cardGrid);

            // Setup interactions for new cards
            this.cardInteractions.setupCardInteractions();
        }

        updateLoadMoreButton(cardGrid) {
            // Remove existing button if present
            const existingButton = document.getElementById('loadMoreButton');
            if (existingButton) {
                existingButton.remove();
            }

            // Create new button
            const loadMoreElement = document.createElement('div');
            loadMoreElement.innerHTML = this.createLoadMoreButton();
            const loadMoreNode = loadMoreElement.firstElementChild;

            // Stop refreshing animation if it was active
            const icon = loadMoreNode.querySelector('i');
            if (icon) {
                icon.classList.remove('refreshing');
            }

            /* @tweakable Animation delay for load more button */
            const loadMoreDelay = 50;
            loadMoreNode.style.animationDelay = `${loadMoreDelay}ms`;

            cardGrid.appendChild(loadMoreNode);

            // Update button text based on whether more cards are available
            const hasMore = this.cardLoader.hasMoreCards();
            const titleElem = loadMoreNode.querySelector('.card-title');
            const subtitleElem = loadMoreNode.querySelector('.card-subtitle');

            if (titleElem) {
                titleElem.textContent = hasMore ? "Загрузить ещё" : "Обновить";
            }

            if (subtitleElem) {
                subtitleElem.textContent = hasMore
                    ? "Показать больше событий"
                    : "Получить новые события";
            }
        }

        createCardHTML(cardData, index) {
            const convertedTime = this.formatDate(cardData.badge);
            /* @tweakable Price prefix */
            const pricePrefix = "от ";
            /* @tweakable Currency symbol */
            const currencySymbol = "₽";
            /* @tweakable Separator between date and time in badge */
            const dateTimeSeparator = " ";
            /* @tweakable Time prefix in card badge */
            const timePrefix = "В ";

            // Generate indicators HTML
            const indicatorsHTML = this.indicatorsSystem.createIndicators(cardData);

            return `
                <div class="card">
                    <div class="card-image" style="background-image: ${cardData.background}">
                        ${indicatorsHTML}
                        <span class="badge time-badge"><i class="far fa-calendar-alt"></i>${convertedTime}${cardData.time ? dateTimeSeparator + timePrefix + this.convertTo24HourFormat(cardData.time) : ''}</span>
                        ${this.renderBadges(cardData, pricePrefix, currencySymbol)}
                        <div class="card-popup-overlay">
                            <div class="popup-sphere" onclick="window.open('event_details.html?id=${index}', '_blank');">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    </div>
                    <div class="card-title text-truncate">${cardData.title}</div>
                    <div class="card-subtitle">${cardData.subtitle}</div>
                </div>
            `;
        }

        createLoadMoreButton() {
            /* @tweakable Load more button background color */
            const LOAD_MORE_BG_COLOR = 'rgba(0, 0, 0, 0.05)';
            /* @tweakable Load more button icon size */
            const LOAD_MORE_ICON_SIZE = '24px';
            /* @tweakable Load more button corner radius */
            const LOAD_MORE_RADIUS = 'var(--card-radius)';
            /* @tweakable Load more button hover effect intensity */
            const LOAD_MORE_HOVER_SCALE = '1.1';

            return `
                <div class="card load-more-card" id="loadMoreButton">
                    <div class="load-more-container" style="background-color: ${LOAD_MORE_BG_COLOR}; border-radius: ${LOAD_MORE_RADIUS};">
                        <i class="fas fa-sync-alt" style="font-size: ${LOAD_MORE_ICON_SIZE};"></i>
                    </div>
                    <div class="card-title text-truncate">Загрузить ещё</div>
                    <div class="card-subtitle">Показать больше событий</div>
                </div>
            `;
        }

        formatDate(dateString) {
            if (!dateString) return '';

            // Проверяем, является ли dateString датой в формате "dd.mm.yyyy"
            if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
                const parts = dateString.split('.');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);

                const monthNames = [
                    "января", "февраля", "марта", "апреля", "мая", "июня",
                    "июля", "августа", "сентября", "октября", "ноября", "декабря"
                ];

                if (month >= 1 && month <= 12) {
                    return `${day} ${monthNames[month - 1]}`;
                } else {
                    return dateString; // Возвращаем исходную строку, если месяц некорректный
                }
            } else {
                return dateString; // Возвращаем исходную строку, если это не дата в нужном формате
            }
        }

        convertTo24HourFormat(timeString) {
            return timeString;
        }

        renderBadges(cardData, pricePrefix = "от ", currencySymbol = "₽") {
            return `
                ${cardData.price && cardData.price !== "Бесплатно" ? `<span class="badge price-badge"><i class="fas fa-tag"></i>${pricePrefix}${cardData.price}${currencySymbol}</span>` : (cardData.price === "Бесплатно" ? `<span class="badge price-badge"><i class="fas fa-tag"></i>${cardData.price}</span>` : '')}
            `;
        }

        restoreOriginalContent(card) {
            /* @tweakable Animation duration for card hiding */
            const HIDE_DURATION = this.config.animations.cardDisappearDuration;

            // Check if it's the load more button
            const isLoadMoreButton = card.id === 'loadMoreButton' || card.classList.contains('load-more-card');

            if (isLoadMoreButton) {
                // Re-generate the load more button
                card.innerHTML = this.createLoadMoreButton();

                // Re-attach event listener to the new button
                const loadMoreBtn = document.getElementById('loadMoreButton');
                if (loadMoreBtn) {
                    loadMoreBtn.addEventListener('click', () => {
                        // Check if we need to load more or refresh
                        if (this.cardLoader.hasMoreCards()) {
                            // Load more cards
                            this.cardLoader.loadMoreCards((cards, isInitial, isLoading, isRefreshing) => {
                                this.renderCards(cards, isInitial, isLoading, isRefreshing);
                            });
                        } else {
                            // Refresh all cards
                            this.cardLoader.refreshCards((cards, isInitial, isLoading, isRefreshing) => {
                                this.renderCards(cards, isInitial, isLoading, isRefreshing);
                            });
                        }
                    });
                }
                return;
            }

            // For regular cards, restore from dataset or recreate based on config
            if (card.dataset.originalContent) {
                // Add fade-in animation to card when restored
                card.style.animation = 'none';
                card.style.opacity = '0';
                card.innerHTML = card.dataset.originalContent;
                delete card.dataset.originalContent;

                // Apply smooth reappear animation
                setTimeout(() => {
                    /* @tweakable Animation duration for reappearing cards */
                    const REAPPEAR_DURATION = 400;
                    /* @tweakable Animation timing function for reappearing cards */
                    const REAPPEAR_TIMING = 'ease-out';
                    /* @tweakable Animation starting opacity for reappearing cards */
                    const START_OPACITY = 0;
                    /* @tweakable Animation starting scale for reappearing cards */
                    const START_SCALE = 0.95;

                    card.style.animation = `none`;
                    card.style.transition = `opacity ${REAPPEAR_DURATION}ms ${REAPPEAR_TIMING}, transform ${REAPPEAR_DURATION}ms ${REAPPEAR_TIMING}`;
                    card.style.opacity = START_OPACITY;
                    card.style.transform = `scale(${START_SCALE})`;

                    // Force reflow
                    void card.offsetWidth;

                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';

                    // Clean up after animation completes
                    setTimeout(() => {
                        card.style.transition = '';
                    }, REAPPEAR_DURATION);
                }, 10);
            } else {
                const cardIndex = Array.from(card.parentElement.children).indexOf(card);
                const cardData = this.config.cardData[cardIndex];
                if (cardData) {
                    card.innerHTML = this.createCardHTML(cardData, cardIndex);
                }
            }
        }

        setupClickOutsideListener() {
            document.addEventListener('click', (event) => {
                if (this.activeCard && !event.target.closest('.card')) {
                    this.cardInteractions.hideCardDetails();
                }
            });
        }
    }

    new MobileApp(config);
});