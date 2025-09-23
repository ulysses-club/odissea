/**
 * Скрипт для фотогалереи киноклуба "Одиссея"
 * Автоматически загружает фотографии из папки ../images/gallery
 * и организует их по категориям
 */

document.addEventListener('DOMContentLoaded', function () {
    // Инициализация галереи
    initGallery();

    // Инициализация модального окна
    initModal();

    // Инициализация фильтров
    initFilters();

    // Инициализация поиска
    initSearch();
});

// Конфигурация галереи
const GALLERY_CONFIG = {
    imageFolder: '../../assets/images/gallery/',
    categories: {
        meetings: 'Встречи киноклуба',
        outings: 'Наши вылазки',
        hobbies: 'Наши хобби',
        works: 'Наши работы/съёмки',
        members: 'Наши участники',
        places: 'Наши места',
        announcements: 'Объявления',
        friends: 'Реклама друзей'
    },
    defaultImage: '../../assets/images/default-poster.jpg'
};

/**
 * Инициализирует галерею фотографий
 * 
 * @returns {void}
 */
function initGallery() {
    const galleryContainer = document.getElementById('gallery-container');

    if (!galleryContainer) {
        console.error('Контейнер галереи не найден');
        return;
    }

    // Установить фиксированную ширину для мобильных
    if (window.innerWidth < 768) {
        galleryContainer.style.width = '100%';
        galleryContainer.style.margin = '0 auto';
    }

    // Показываем сообщение о загрузке
    galleryContainer.innerHTML = `
        <div class="loading-message">
            <div class="spinner" aria-hidden="true"></div>
            <p>Загрузка фотографий...</p>
        </div>
    `;

    // Загружаем изображения
    loadGalleryImages(galleryContainer);
}

/**
 * Загружает изображения для галереи в указанный контейнер
 * 
 * @param {HTMLElement} container - Контейнер для загрузки изображений
 * @returns {void}
 */
function loadGalleryImages(container) {
    // В реальном проекте здесь будет запрос к серверу для получения списка фотографий
    // Для демонстрации используем mock-данные, но с проверкой существования изображений

    setTimeout(() => {
        loadMockImages(container);
    }, 1000);
}

/**
 * Загружает демонстрационные изображения для тестирования галереи
 * 
 * @param {HTMLElement} container - Контейнер для загрузки изображений
 * @returns {void}
 */
function loadMockImages(container) {
    // Очищаем контейнер
    container.innerHTML = '';

    // Mock-данные для демонстрации
    const mockImages = [
        {
            filename: 'meeting1.jpg',
            category: 'meetings',
            title: 'Встреча киноклуба',
            exists: true
        },
        {
            filename: 'meeting2.jpg',
            category: 'meetings',
            title: 'Обсуждение фильма',
            exists: true
        },
        {
            filename: 'meeting3.jpg',
            category: 'meetings',
            title: 'Дискуссия',
            exists: true
        },
        {
            filename: 'outing1.jpg',
            category: 'outings',
            title: 'Вылазка на природу',
            exists: true
        },
        {
            filename: 'outing2.jpg',
            category: 'outings',
            title: 'Кино-пикник',
            exists: true
        },
        {
            filename: 'hobby1.jpg',
            category: 'hobbies',
            title: 'Наши увлечения',
            exists: true
        },
        {
            filename: 'work1.jpg',
            category: 'works',
            title: 'Съёмочный процесс',
            exists: true
        },
        {
            filename: 'member1.jpg',
            category: 'members',
            title: 'Участники клуба',
            exists: true
        },
        {
            filename: 'place1.jpg',
            category: 'places',
            title: 'Любимое место встреч',
            exists: true
        }
    ];

    // Проверяем, есть ли хотя бы одно существующее изображение
    const hasImages = mockImages.some(img => img.exists);

    if (!hasImages) {
        container.innerHTML = `
            <div class="no-images-message">
                <p>Фотографии пока не загружены</p>
                <p>Скоро здесь появятся наши лучшие моменты!</p>
            </div>
        `;
        return;
    }

    // Создаем элементы галереи
    mockImages.forEach(img => {
        if (img.exists) {
            const imgElement = createGalleryItem(img);
            container.appendChild(imgElement);
        }
    });

    // Если нет изображений после фильтрации
    if (container.children.length === 0) {
        container.innerHTML = `
            <div class="no-images-message">
                <p>Нет фотографий для отображения</p>
            </div>
        `;
    }
}

/**
 * Создает элемент галереи для изображения
 * 
 * @param {object} imageData - Данные изображения
 * @param {string} imageData.filename - Имя файла изображения
 * @param {string} imageData.category - Категория изображения
 * @param {string} imageData.title - Заголовок изображения
 * @param {boolean} imageData.exists - Существует ли изображение
 * @returns {HTMLElement} - Созданный элемент галереи
 */
function createGalleryItem(imageData) {
    const item = document.createElement('div');
    item.className = `gallery__item ${imageData.category}`;
    item.dataset.category = imageData.category;
    item.dataset.title = imageData.title.toLowerCase();

    const imageUrl = `${GALLERY_CONFIG.imageFolder}/${imageData.filename}`;
    const fallbackImage = GALLERY_CONFIG.defaultImage;

    item.innerHTML = `
        <div class="gallery__item-inner">
            <img src="${imageUrl}" 
                 alt="${imageData.title}"
                 class="gallery__image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${fallbackImage}'">
            <div class="gallery__overlay">
                <div class="gallery__overlay-content">
                    <h3 class="gallery__title">${imageData.title}</h3>
                    <p class="gallery__category">${GALLERY_CONFIG.categories[imageData.category] || 'Без категории'}</p>
                </div>
            </div>
        </div>
    `;

    // Добавляем обработчик клика
    item.addEventListener('click', function () {
        openModal(imageUrl, imageData.title);
    });

    return item;
}

/**
 * Инициализирует модальное окно для просмотра изображений
 * 
 * @returns {void}
 */
function initModal() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const captionText = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal__close');

    if (!modal || !modalImg || !closeBtn) {
        console.error('Элементы модального окна не найдены');
        return;
    }

    // Закрытие модального окна
    closeBtn.onclick = function () {
        closeModal();
    };

    // Закрытие при клике вне изображения
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Закрытие при нажатии Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

/**
 * Открывает модальное окно с изображением
 * 
 * @param {string} imageSrc - URL изображения
 * @param {string} title - Заголовок изображения
 * @returns {void}
 */
function openModal(imageSrc, title) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const captionText = document.getElementById('modal-caption');

    if (!modal || !modalImg) return;

    modal.style.display = "block";
    modalImg.src = imageSrc;
    modalImg.alt = title;
    captionText.innerHTML = title || '';

    // Блокируем прокрутку фона
    document.body.style.overflow = 'hidden';
}

/**
 * Закрывает модальное окно
 * 
 * @returns {void}
 */
function closeModal() {
    const modal = document.getElementById('image-modal');
    if (!modal) return;

    modal.style.display = "none";

    // Восстанавливаем прокрутку фона
    document.body.style.overflow = '';
}

/**
 * Инициализирует кнопки фильтрации галереи по категориям
 * 
 * @returns {void}
 */
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Удаляем активный класс у всех кнопок
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });

            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            this.setAttribute('aria-pressed', 'true');

            const filterValue = this.dataset.filter;
            filterGallery(filterValue);
        });
    });
}

/**
 * Фильтрует галерею по выбранной категории
 * 
 * @param {string} category - Категория для фильтрации ('all' для всех)
 * @returns {void}
 */
function filterGallery(category) {
    const items = document.querySelectorAll('.gallery__item');
    let visibleCount = 0;

    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Показываем сообщение, если нет изображений
    showNoResultsMessage(visibleCount);
}

/**
 * Показывает или скрывает сообщение об отсутствии результатов
 * 
 * @param {number} visibleCount - Количество видимых элементов
 * @returns {void}
 */
function showNoResultsMessage(visibleCount) {
    const container = document.getElementById('gallery-container');
    let message = container.querySelector('.no-results-message');

    if (visibleCount === 0) {
        if (!message) {
            message = document.createElement('div');
            message.className = 'no-results-message';
            message.innerHTML = `
                <p>Нет фотографий в этой категории</p>
                <p>Попробуйте выбрать другую категорию</p>
            `;
            container.appendChild(message);
        }
        message.style.display = 'block';
    } else if (message) {
        message.style.display = 'none';
    }
}

/**
 * Инициализирует поле поиска по галерее
 * 
 * @returns {void}
 */
function initSearch() {
    const searchInput = document.getElementById('gallery-search');

    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();
        searchGallery(searchTerm);
    });

    // Очистка поиска
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            this.value = '';
            searchGallery('');
        }
    });
}

/**
 * Выполняет поиск по галерее по введенному запросу
 * 
 * @param {string} term - Поисковый запрос
 * @returns {void}
 */
function searchGallery(term) {
    const items = document.querySelectorAll('.gallery__item');
    let visibleCount = 0;

    items.forEach(item => {
        const title = item.dataset.title;
        const category = item.dataset.category;

        if (term === '' ||
            title.includes(term) ||
            category.includes(term) ||
            GALLERY_CONFIG.categories[category]?.toLowerCase().includes(term)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Показываем сообщение, если нет результатов
    showNoResultsMessage(visibleCount);
}
