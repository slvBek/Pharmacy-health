// Глобальные переменные
let cart = [];
let products = [];
let favorites = [];
let currentPage = 1;
const itemsPerPage = 6;
let lastScroll = 0;
let isScrolling = false;
const productsPerPage = 8;
let filteredProducts = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeProducts();
    initializeSearch();
    initializeCart();
    initializeFavorites();
    initializeFilters();
    initializeForms();
    initializeAnimations();
    initializeScrollEffects();
    initializeParallax();
    initializePagination();
    initializeMobileMenu();
});

// Инициализация продуктов
function initializeProducts() {
    const productCards = document.querySelectorAll('.product-card');
    products = Array.from(productCards).map(card => {
        // Получаем цену, учитывая возможную скидку
        let priceElement = card.querySelector('.price');
        let price = 0;
        
        // Проверяем, есть ли старая цена (скидка)
        if (priceElement.querySelector('.old-price')) {
            // Если есть скидка, берем актуальную цену (после скидки)
            price = parseInt(priceElement.textContent.replace(/[^\d]/g, ''));
        } else {
            // Если скидки нет, берем обычную цену
            price = parseInt(priceElement.textContent.replace(/[^\d]/g, ''));
        }
        
        return {
            id: card.dataset.id || Math.random().toString(36).substr(2, 9),
            name: card.querySelector('h3').textContent,
            description: card.querySelector('p').textContent,
            price: price,
            image: card.querySelector('img').src,
            category: card.dataset.category || 'other',
            isNew: card.dataset.isNew === 'true',
            hasSale: card.dataset.hasSale === 'true',
            oldPrice: card.dataset.oldPrice ? parseInt(card.dataset.oldPrice) : null
        };
    });

    // Добавляем обработчики для кнопок
    productCards.forEach(card => {
        const buyButton = card.querySelector('.buy-button');
        const favoriteButton = card.querySelector('.favorite-button');
        
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                addToCart(card);
            });
        }
        
        if (favoriteButton) {
            favoriteButton.addEventListener('click', () => {
                const productId = card.dataset.id || products.find(p => p.name === card.querySelector('h3').textContent)?.id;
                if (productId) {
                    toggleFavorite(productId, favoriteButton);
                }
            });
        }
    });
}

// Функция поиска
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    searchInput.addEventListener('input', debounce(filterProducts, 300));
    searchButton.addEventListener('click', filterProducts);

    // Добавляем эффект фокуса
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.transform = 'scale(1.02)';
    });

    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.transform = 'scale(1)';
    });
}

function filterProducts() {
    const categoryFilter = document.getElementById('category-filter').value;
    const priceFilter = document.getElementById('price-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();

    filteredProducts = products.filter(product => {
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesPrice = matchesPriceFilter(product.price, priceFilter);
        const matchesSearch = product.name.toLowerCase().includes(searchQuery) || 
                            product.description.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesPrice && matchesSearch;
    });

    // Сортировка
    switch(sortFilter) {
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
    }

    currentPage = 1;
    updateProductDisplay(filteredProducts);
    updatePagination();
}

function matchesPriceFilter(price, filter) {
    switch(filter) {
        case '0-10000':
            return price <= 10000;
        case '10000-30000':
            return price > 10000 && price <= 30000;
        case '30000+':
            return price > 30000;
        default:
            return true;
    }
}

function updateProductDisplay(products) {
    const productGrid = document.querySelector('.product-grid');
    productGrid.innerHTML = '';

    products.forEach(product => {
        const card = createProductCard(product);
        productGrid.appendChild(card);
    });

    // Добавляем обработчики событий для новых кнопок
    initializeProductButtons();
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.dataset.category = product.category;
    card.dataset.isNew = product.isNew;
    card.dataset.hasSale = product.hasSale;
    if (product.oldPrice) card.dataset.oldPrice = product.oldPrice;
    
    let badges = '';
    if (product.isNew) badges += '<span class="badge new">Новинка</span>';
    if (product.hasSale) badges += '<span class="badge sale">-20%</span>';

    let priceHtml = `<span class="price">${product.price} сум</span>`;
    if (product.oldPrice) {
        priceHtml = `<span class="old-price">${product.oldPrice} сум</span>${priceHtml}`;
    }

    card.innerHTML = `
        <div class="product-badges">${badges}</div>
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        ${priceHtml}
        <div class="product-actions">
            <button class="buy-button">Купить</button>
            <button class="favorite-button">
                <i class="${favorites.includes(product.id) ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
    `;

    return card;
}

function updatePagination() {
    const productGrid = document.querySelector('.product-grid');
    const paginationInfo = document.querySelector('.pagination-info');
    const prevButton = document.querySelector('.pagination-button:first-child');
    const nextButton = document.querySelector('.pagination-button:last-child');

    // Скрываем все продукты
    filteredProducts.forEach(product => {
        product.style.display = 'none';
    });

    // Показываем продукты для текущей страницы
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    
    for (let i = startIndex; i < endIndex && i < filteredProducts.length; i++) {
        filteredProducts[i].style.display = 'block';
    }

    // Обновляем информацию о страницах
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
    paginationInfo.textContent = `Страница ${currentPage} из ${totalPages}`;

    // Обновляем состояние кнопок
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

// Инициализация корзины
function initializeCart() {
    const cartIcon = document.querySelector('#cart-icon');
    const cartModal = document.querySelector('#cart-modal');
    const confirmButton = document.querySelector('.confirm-button');
    const cancelButton = document.querySelector('.cancel-button');

    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showCart();
        });
    }

    if (confirmButton) {
        confirmButton.addEventListener('click', () => {
            if (cart.length > 0) {
                showCheckoutModal();
            }
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            hideCart();
        });
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            hideCart();
        }
    });
}

function initializeProductButtons() {
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            addToCart(productCard);
            
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 200);
        });
    });

    document.querySelectorAll('.favorite-button').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.product-card');
            const productId = card.dataset.id;
            toggleFavorite(productId);
        });
    });
}

// Инициализация избранного
function initializeFavorites() {
    const favoritesIcon = document.querySelector('#favorites-icon');
    const favoritesModal = document.querySelector('#favorites-modal');
    const cancelButton = favoritesModal.querySelector('.cancel-button');

    if (favoritesIcon) {
        favoritesIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showFavorites();
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            hideFavorites();
        });
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (e) => {
        if (e.target === favoritesModal) {
            hideFavorites();
        }
    });
}

// Переключение избранного
function toggleFavorite(productId, button) {
    const index = favorites.indexOf(productId);
    if (index === -1) {
        favorites.push(productId);
        if (button) {
            button.querySelector('i').classList.replace('far', 'fas');
        }
        showNotification('Товар добавлен в избранное');
    } else {
        favorites.splice(index, 1);
        if (button) {
            button.querySelector('i').classList.replace('fas', 'far');
        }
        showNotification('Товар удален из избранного');
    }
    updateFavoritesCount();
    updateFavoritesDisplay();
}

// Обновление счетчика избранного
function updateFavoritesCount() {
    const favoritesCount = document.querySelector('.favorites-count');
    if (favoritesCount) {
        favoritesCount.textContent = favorites.length;
        favoritesCount.style.display = favorites.length > 0 ? 'block' : 'none';
    }
}

function updateFavoritesDisplay() {
    const favoritesItems = document.getElementById('favorites-items');
    favoritesItems.innerHTML = '';

    favorites.forEach(productId => {
        const product = products.find(p => p.id === productId);
        if (product) {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            
            // Специальная обработка для парацетамола
            let displayPrice = product.price + ' сум';
            if (product.name.toLowerCase().includes('парацетамол')) {
                displayPrice = '6,500 сум';
            }
            
            item.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="favorite-item-details">
                    <h4>${product.name}</h4>
                    <p>${displayPrice}</p>
                </div>
                <button class="remove-favorite" onclick="toggleFavorite('${product.id}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            favoritesItems.appendChild(item);
        }
    });

    favoritesModal.style.display = 'flex';
}

function showFavorites() {
    const favoritesModal = document.querySelector('#favorites-modal');
    const favoritesItems = document.querySelector('#favorites-items');
    
    if (!favoritesModal || !favoritesItems) return;

    favoritesItems.innerHTML = '';
    const favoriteProducts = products.filter(product => favorites.includes(product.id));

    favoriteProducts.forEach(product => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        
        // Специальная обработка для парацетамола
        let displayPrice = product.price + ' сум';
        if (product.name.toLowerCase().includes('парацетамол')) {
            displayPrice = '6500 сум';
        }
        
        favoriteItem.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="favorite-item-details">
                <h4>${product.name}</h4>
                <p>${displayPrice}</p>
            </div>
            <button class="remove-favorite" onclick="toggleFavorite('${product.id}')">
                <i class="fas fa-heart"></i>
            </button>
        `;
        favoritesItems.appendChild(favoriteItem);
    });

    favoritesModal.style.display = 'flex';
}

function hideFavorites() {
    const favoritesModal = document.querySelector('#favorites-modal');
    if (favoritesModal) {
        favoritesModal.style.display = 'none';
    }
}

// Функции фильтров
function initializeFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', filterProducts);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', filterProducts);
    }
}

// Функции форм
function initializeForms() {
    const feedbackForm = document.getElementById('feedback-form');
    const newsletterForm = document.getElementById('newsletter-form');
    const checkoutForm = document.getElementById('checkout-form');

    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    // Здесь будет логика отправки формы обратной связи
    showNotification('Спасибо за ваш отзыв! Мы свяжемся с вами в ближайшее время.');
    e.target.reset();
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    // Здесь будет логика подписки на рассылку
    showNotification('Спасибо за подписку на рассылку!');
    e.target.reset();
}

function handleCheckoutSubmit(e) {
    e.preventDefault();
    // Здесь будет логика оформления заказа
    showNotification('Заказ успешно оформлен! Мы свяжемся с вами для подтверждения.');
    cart = [];
    updateCartCount();
    hideCheckoutModal();
    e.target.reset();
}

// Утилиты
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function debounce(func, wait) {
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

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(20px); }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
    }
    
    @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .clicked {
        animation: pulse 0.2s ease-in-out;
    }
    
    .bounce {
        animation: bounce 0.3s ease-in-out;
    }
    
    .pulse {
        animation: pulse 0.3s ease-in-out;
    }
    
    .modal {
        transition: opacity 0.3s ease-out;
    }
    
    .cart-item, .favorite-item {
        animation: fadeIn 0.5s ease-out forwards;
    }

    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #2ecc71;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        animation: fadeIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Анимации при прокрутке
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('feature')) {
                    entry.target.style.animationDelay = `${entry.target.dataset.delay}s`;
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.product-card, .feature, .contact-item').forEach((el, index) => {
        el.classList.add('fade-in');
        if (el.classList.contains('feature')) {
            el.dataset.delay = index * 0.2;
        }
        observer.observe(el);
    });
}

// Эффекты прокрутки
function initializeScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const currentScroll = window.pageYOffset;
                
                // Эффект навигационной панели
                if (currentScroll > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                
                // Параллакс эффект для hero секции
                const hero = document.querySelector('.hero');
                if (hero) {
                    hero.style.backgroundPositionY = `${currentScroll * 0.5}px`;
                }
                
                lastScroll = currentScroll;
            });
        }
    });
}

// Параллакс эффект
function initializeParallax() {
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            
            hero.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }
}

// Добавление в корзину
function addToCart(productCard) {
    const productName = productCard.querySelector('h3').textContent;
    const productPrice = productCard.querySelector('.price').textContent;
    const productImage = productCard.querySelector('img').src;
    
    // Специальная обработка для парацетамола
    let price = productPrice;
    if (productName.toLowerCase().includes('парацетамол')) {
        price = '6,500 сум';
    }
    
    const cartItem = {
        name: productName,
        price: price,
        image: productImage
    };
    
    cart.push(cartItem);
    updateCartCount();
    updateCartModal();
    showNotification('Товар добавлен в корзину');
}

// Обновление счетчика корзины
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
        cartCount.style.display = cart.length > 0 ? 'block' : 'none';
    }
}

// Показать корзину
function showCart() {
    const cartModal = document.querySelector('#cart-modal');
    if (cartModal) {
        updateCartModal();
        cartModal.style.display = 'flex';
    }
}

// Скрыть корзину
function hideCart() {
    const cartModal = document.querySelector('#cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

// Обновление количества товара
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        updateCartCount();
        showCart();
    }
}

// Удаление из корзины
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    updateCartModal();
}

// Показать модальное окно оформления заказа
function showCheckoutModal() {
    const checkoutModal = document.querySelector('#checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'flex';
    }
}

// Скрыть модальное окно оформления заказа
function hideCheckoutModal() {
    const checkoutModal = document.querySelector('#checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
}

// Обработка кнопки отмены в модальном окне оформления заказа
document.querySelector('#checkout-modal .cancel-button').addEventListener('click', function() {
    document.getElementById('checkout-modal').style.display = 'none';
});

// AI Консультант
const aiResponses = {
    greetings: [
        'Здравствуйте! Я ваш персональный фармацевтический консультант. Рад помочь вам сегодня! Как я могу быть полезен?',
        'Добрый день! Я ваш AI-помощник в аптеке "Здоровье". Готов помочь вам с выбором лекарств и ответить на любые вопросы о здоровье.',
        'Приветствую! Я виртуальный фармацевт аптеки "Здоровье". Давайте вместе найдем решение для вашего здоровья!'
    ],
    followUps: [
        'Есть ли у вас еще вопросы?',
        'Могу ли я помочь вам чем-то еще?',
        'Что-нибудь еще интересует?',
        'Нужна ли дополнительная информация?'
    ],
    clarifications: [
        'Позвольте уточнить, что именно вас беспокоит?',
        'Расскажите подробнее о ваших симптомах?',
        'Как давно вас это беспокоит?',
        'Есть ли у вас аллергия на какие-либо препараты?'
    ],
    symptoms: {
        'головная боль': {
            recommendations: [
                { name: 'Парацетамол', reason: 'быстрое обезболивающее действие', dosage: '1-2 таблетки каждые 4-6 часов' },
                { name: 'Ибупрофен', reason: 'противовоспалительный эффект', dosage: '1 таблетка каждые 6-8 часов' },
                { name: 'Цитрамон', reason: 'комплексное действие', dosage: '1-2 таблетки при необходимости' }
            ],
            advice: 'При частых головных болях рекомендуется проконсультироваться с врачом. Избегайте длительного приема обезболивающих без консультации специалиста.',
            questions: [
                'Как часто у вас возникают головные боли?',
                'Сопровождаются ли они другими симптомами?',
                'Помогает ли вам отдых или сон?'
            ]
        },
        'простуда': {
            recommendations: [
                { name: 'Витамин C', reason: 'укрепление иммунитета', dosage: '1-2 таблетки в день' },
                { name: 'Парацетамол', reason: 'снижение температуры', dosage: '1 таблетка каждые 4-6 часов' },
                { name: 'Аспирин', reason: 'жаропонижающее действие', dosage: '1 таблетка при температуре выше 38.5°C' }
            ],
            advice: 'Важно обильное питье и постельный режим. При температуре выше 39°C или длительности симптомов более 5 дней обратитесь к врачу.',
            questions: [
                'Какая у вас температура?',
                'Есть ли кашель или насморк?',
                'Как давно началось заболевание?'
            ]
        },
        'боль в животе': {
            recommendations: [
                { name: 'Но-шпа', reason: 'снятие спазмов', dosage: '1-2 таблетки 2-3 раза в день' },
                { name: 'Смекта', reason: 'при диарее', dosage: '1 пакетик 3 раза в день' },
                { name: 'Активированный уголь', reason: 'при отравлении', dosage: '1 таблетка на 10 кг веса' }
            ],
            advice: 'При сильной боли, рвоте или диарее более 24 часов обратитесь к врачу. Соблюдайте диету и пейте больше воды.',
            questions: [
                'Где именно болит?',
                'Есть ли тошнота или рвота?',
                'Когда последний раз принимали пищу?'
            ]
        },
        'аллергия': {
            recommendations: [
                { name: 'Цетрин', reason: 'антигистаминное действие', dosage: '1 таблетка в день' },
                { name: 'Лоратадин', reason: 'противоаллергическое действие', dosage: '1 таблетка в день' }
            ],
            advice: 'Избегайте контакта с аллергенами. При затруднении дыхания немедленно обратитесь к врачу.',
            questions: [
                'На что у вас аллергия?',
                'Как проявляется аллергия?',
                'Принимали ли вы какие-то препараты ранее?'
            ]
        },
        'кашель': {
            recommendations: [
                { name: 'Амброксол', reason: 'отхаркивающее действие', dosage: '1 таблетка 3 раза в день' },
                { name: 'Бромгексин', reason: 'муколитическое действие', dosage: '1 таблетка 3 раза в день' }
            ],
            advice: 'Пейте больше теплой жидкости. При кашле с кровью или длительности более 2 недель обратитесь к врачу.',
            questions: [
                'Сухой или влажный кашель?',
                'Есть ли мокрота?',
                'Как давно начался кашель?'
            ]
        }
    },
    categories: {
        'витамины': ['Витамин C', 'Витамин D', 'Витамины группы B', 'Комплексные витамины'],
        'обезболивающие': ['Парацетамол', 'Ибупрофен', 'Цитрамон', 'Аспирин'],
        'желудочные': ['Смекта', 'Активированный уголь', 'Но-шпа', 'Лоперамид'],
        'антигистаминные': ['Цетрин', 'Лоратадин', 'Супрастин'],
        'от кашля': ['Амброксол', 'Бромгексин', 'Мукалтин']
    },
    contraindications: {
        'Парацетамол': 'Не принимать при заболеваниях печени и почек, алкоголизме',
        'Ибупрофен': 'Противопоказан при язвенной болезни, астме',
        'Аспирин': 'Не принимать при язвенной болезни, детям до 12 лет',
        'Но-шпа': 'С осторожностью при пониженном давлении'
    }
};

let conversationContext = {
    lastSymptom: null,
    lastCategory: null,
    recommendedProducts: [],
    userHistory: [],
    lastInteraction: null,
    currentQuestions: [],
    userResponses: {},
    conversationStage: 'initial' // initial, questioning, recommendation, follow-up
};

function toggleAIConsultant() {
    const widget = document.querySelector('.ai-consultant-widget');
    widget.classList.toggle('active');
    if (widget.classList.contains('active')) {
        document.getElementById('ai-input').focus();
        // Добавляем приветственное сообщение при первом открытии
        if (!conversationContext.lastInteraction) {
            setTimeout(() => {
                addAIMessage(aiResponses.greetings[Math.floor(Math.random() * aiResponses.greetings.length)]);
            }, 500);
        }
    }
}

function sendMessage() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addUserMessage(message);
    input.value = '';
    
    // Сохраняем историю взаимодействия
    conversationContext.userHistory.push({
        type: 'user',
        message: message,
        timestamp: new Date()
    });
    
    // Анализируем сообщение и готовим ответ
    processUserMessage(message.toLowerCase());
}

function processUserMessage(message) {
    // Показываем индикатор набора текста
    showTypingIndicator();
    
    // Имитация обработки сообщения
    setTimeout(() => {
        let response = getAIResponse(message);
        hideTypingIndicator();
        addAIMessage(response);
        
        // Сохраняем ответ в историю
        conversationContext.userHistory.push({
            type: 'ai',
            message: response,
            timestamp: new Date()
        });
        
        conversationContext.lastInteraction = new Date();
    }, 1000);
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('ai-messages');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function getAIResponse(message) {
    // Приветствия
    if (message.includes('здравствуйте') || message.includes('привет') || message.includes('добрый')) {
        conversationContext.conversationStage = 'initial';
        return aiResponses.greetings[Math.floor(Math.random() * aiResponses.greetings.length)];
    }

    // Прощания
    if (message.includes('до свидания') || message.includes('пока') || message.includes('спасибо')) {
        conversationContext.conversationStage = 'initial';
        return 'Спасибо за обращение! Я был рад помочь. Если у вас появятся вопросы, я всегда готов помочь. Будьте здоровы!';
    }

    // Проверка симптомов
    for (let symptom in aiResponses.symptoms) {
        if (message.includes(symptom)) {
            conversationContext.lastSymptom = symptom;
            conversationContext.conversationStage = 'questioning';
            conversationContext.currentQuestions = [...aiResponses.symptoms[symptom].questions];
            
            let response = `Я понимаю, что у вас ${symptom}. Давайте разберемся подробнее.\n\n`;
            response += conversationContext.currentQuestions[0];
            
            return response;
        }
    }

    // Обработка ответов на вопросы
    if (conversationContext.conversationStage === 'questioning' && conversationContext.currentQuestions.length > 0) {
        const currentQuestion = conversationContext.currentQuestions[0];
        conversationContext.userResponses[currentQuestion] = message;
        conversationContext.currentQuestions.shift();

        if (conversationContext.currentQuestions.length > 0) {
            return conversationContext.currentQuestions[0];
        } else {
            conversationContext.conversationStage = 'recommendation';
            return generateRecommendation();
        }
    }

    // Поиск по категориям
    for (let category in aiResponses.categories) {
        if (message.includes(category)) {
            conversationContext.lastCategory = category;
            const products = aiResponses.categories[category];
            let response = `В категории "${category}" у нас есть:\n\n`;
            products.forEach(product => {
                response += `• ${product}\n`;
            });
            response += '\nМогу рассказать подробнее о любом препарате или помочь с выбором.';
            conversationContext.recommendedProducts = products;
            return response;
        }
    }

    // Проверка противопоказаний
    for (let product in aiResponses.contraindications) {
        if (message.includes(product.toLowerCase())) {
            return `${product}\nПротивопоказания: ${aiResponses.contraindications[product]}\n\nХотите узнать о других препаратах или дозировке?`;
        }
    }

    // Поиск информации о конкретном препарате
    const allProducts = products.map(p => ({
        name: p.name.toLowerCase(),
        description: p.description,
        price: p.price
    }));

    for (let product of allProducts) {
        if (message.includes(product.name)) {
            let response = `${product.name.charAt(0).toUpperCase() + product.name.slice(1)}\n`;
            response += `Описание: ${product.description}\n`;
            response += `Цена: ${product.price}\n\n`;
            
            // Добавляем информацию о противопоказаниях, если есть
            if (aiResponses.contraindications[product.name]) {
                response += `Противопоказания: ${aiResponses.contraindications[product.name]}\n\n`;
            }
            
            response += 'Хотите добавить этот товар в корзину или узнать о других препаратах?';
            return response;
        }
    }

    // Вопросы о доставке
    if (message.includes('доставк')) {
        return 'Мы осуществляем доставку в течение 2 часов по городу.\n\n' +
               '• Минимальная сумма заказа для бесплатной доставки - 1000 сум\n' +
               '• Доставка осуществляется ежедневно с 9:00 до 21:00\n' +
               '• При заказе от 5000 сум доставка бесплатная\n' +
               '• Доставка в пригород - от 5000 сум\n\n' +
               'Хотите оформить заказ с доставкой?';
    }

    // Вопросы об оплате
    if (message.includes('оплат') || message.includes('платеж')) {
        return 'Мы принимаем различные способы оплаты:\n\n' +
               '• Наличные при получении\n' +
               '• Банковские карты (Visa, MasterCard, МИР)\n' +
               '• Онлайн-платежи\n' +
               '• Мобильные платежи\n' +
               '• QR-код\n\n' +
               'Какой способ оплаты вам удобнее?';
    }

    // График работы
    if (message.includes('график') || message.includes('режим') || message.includes('работает')) {
        return 'График работы нашей аптеки:\n\n' +
               '• Пн-Пт: 8:00 - 20:00\n' +
               '• Сб-Вс: 9:00 - 18:00\n\n' +
               'Онлайн-заказы принимаются круглосуточно.\n\n' +
               'Нужна помощь с оформлением заказа?';
    }

    // Если не нашли конкретного ответа
    return 'Я могу помочь вам:\n\n' +
           '• Подобрать лекарства по симптомам\n' +
           '• Рассказать о конкретных препаратах\n' +
           '• Проконсультировать по доставке и оплате\n' +
           '• Найти ближайшую аптеку\n' +
           '• Рассказать о противопоказаниях\n\n' +
           'Уточните, пожалуйста, что именно вас интересует?';
}

function generateRecommendation() {
    const symptom = conversationContext.lastSymptom;
    const symptomInfo = aiResponses.symptoms[symptom];
    
    let response = `На основе ваших ответов, я могу порекомендовать следующие препараты:\n\n`;
    
    symptomInfo.recommendations.forEach(rec => {
        response += `• ${rec.name}\n`;
        response += `  - ${rec.reason}\n`;
        response += `  - Дозировка: ${rec.dosage}\n\n`;
    });
    
    response += `Важно: ${symptomInfo.advice}\n\n`;
    response += getRandomFollowUp();
    
    conversationContext.conversationStage = 'follow-up';
    return response;
}

function getRandomFollowUp() {
    return aiResponses.followUps[Math.floor(Math.random() * aiResponses.followUps.length)];
}

function addUserMessage(message) {
    const messagesContainer = document.getElementById('ai-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'user-message';
    messageElement.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function addAIMessage(message) {
    const messagesContainer = document.getElementById('ai-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message';
    messageElement.innerHTML = `
        <i class="fas fa-robot"></i>
        <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
    `;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();

    // Добавляем эффект печатания
    const content = messageElement.querySelector('.message-content');
    content.style.opacity = '0';
    setTimeout(() => {
        content.style.opacity = '1';
        content.style.transition = 'opacity 0.3s ease';
    }, 100);
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('ai-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Обработчик Enter для отправки сообщения
document.getElementById('ai-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Добавляем подсказки при вводе
document.getElementById('ai-input').addEventListener('input', function(e) {
    const input = e.target.value.toLowerCase();
    if (input.length > 2) {
        // Можно добавить выпадающий список с подсказками
        // на основе введенного текста
    }
});

// Функция инициализации пагинации
function initializePagination() {
    const productGrid = document.querySelector('.product-grid');
    const paginationInfo = document.querySelector('.pagination-info');
    const prevButton = document.querySelector('.pagination-button:first-child');
    const nextButton = document.querySelector('.pagination-button:last-child');

    // Получаем все карточки продуктов
    const allProducts = Array.from(productGrid.children);
    filteredProducts = allProducts;
    updatePagination();

    // Обработчики кнопок пагинации
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });

    nextButton.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredProducts.length / productsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            updatePagination();
        }
    });
}

// Мобильное меню
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
    
    // Закрытие меню при клике на ссылку
    const navLinksItems = document.querySelectorAll('.nav-links a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });
}

function updateCartModal() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        // Извлекаем числовое значение цены
        const priceValue = parseInt(item.price.replace(/[^0-9]/g, ''));
        total += priceValue;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${item.price}</p>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    // Обновляем общую сумму
    if (cartTotalPrice) {
        cartTotalPrice.textContent = total.toLocaleString() + ' сум';
    }
}

function updateFavoritesModal() {
    const favoritesItemsContainer = document.getElementById('favorites-items');
    favoritesItemsContainer.innerHTML = '';

    favorites.forEach((item, index) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="favorite-item-details">
                <h4>${item.name}</h4>
                <p>${item.price}</p>
            </div>
            <button class="remove-favorite" onclick="removeFromFavorites(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        favoritesItemsContainer.appendChild(favoriteItem);
    });
} 