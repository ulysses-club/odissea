/**
 * Скрипт для фотогалереи киноклуба "Одиссея"
 * Автоматически загружает фотографии из папки images/gallery
 * и организует их по категориям
 */

document.addEventListener('DOMContentLoaded', function() {
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
    imageFolder: 'images/gallery',
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
    defaultImage: 'images/default-poster.jpg'
};

// Инициализация галереи
function initGallery() {
    const galleryContainer = document.getElementById('gallery-container');
    
    // В реальном проекте здесь будет запрос к серверу для получения списка фотографий
    // Для демонстрации используем mock-данные
    setTimeout(() => {
        loadMockImages(galleryContainer);
    }, 1000);
}

// Загрузка тестовых изображений (в реальном проекте замените на запрос к серверу)
function loadMockImages(container) {
    // Очищаем контейнер
    container.innerHTML = '';
    
    // В реальном проекте здесь будет запрос к серверу для получения списка фотографий
    // и их метаданных (категория, описание и т.д.)
    
    // Mock-данные для демонстрации
    const mockImages = [
        { filename: 'meeting1.jpg', category: 'meetings', title: '' },
        { filename: 'meeting2.jpg', category: 'meetings', title: '' },
        { filename: 'meeting3.jpg', category: 'meetings', title: '' },
        { filename: 'meeting4.jpg', category: 'meetings', title: '' },
        { filename: 'meeting5.jpg', category: 'meetings', title: '' },
        { filename: 'meeting6.jpg', category: 'meetings', title: '' },
        { filename: 'meeting7.jpg', category: 'meetings', title: '' },
        { filename: 'meeting8.jpg', category: 'meetings', title: '' },
        { filename: 'meeting9.jpg', category: 'meetings', title: '' },
        { filename: 'meeting10.jpg', category: 'meetings', title: '' },
        { filename: 'meeting11.jpg', category: 'meetings', title: '' },
        { filename: 'meeting12.jpg', category: 'meetings', title: '' },
        { filename: 'meeting13.jpg', category: 'meetings', title: '' },
        { filename: 'meeting14.jpg', category: 'meetings', title: '' },
        { filename: 'meeting15.jpg', category: 'meetings', title: '' },
        { filename: 'meeting16.jpg', category: 'meetings', title: '' },
        { filename: 'meeting17.jpg', category: 'meetings', title: '' },
        { filename: 'outing1.jpg', category: 'outings', title: '' },
        { filename: 'outing2.jpg', category: 'outings', title: '' },
        { filename: 'outing3.jpg', category: 'outings', title: '' },
        { filename: 'outing4.jpg', category: 'outings', title: '' },
        { filename: 'outing5.jpg', category: 'outings', title: '' },
        { filename: 'outing6.jpg', category: 'outings', title: '' },
        { filename: 'outing7.jpg', category: 'outings', title: '' },
        { filename: 'outing8.jpg', category: 'outings', title: '' },
        { filename: 'outing9.jpg', category: 'outings', title: '' },
        { filename: 'outing10.jpg', category: 'outings', title: '' },
        { filename: 'outing11.jpg', category: 'outings', title: '' },
    ];
    
    // Создаем элементы галереи
    mockImages.forEach(img => {
        const imgElement = createGalleryItem(img);
        container.appendChild(imgElement);
    });
}

// Создание элемента галереи
function createGalleryItem(imageData) {
    const item = document.createElement('div');
    item.className = `gallery__item ${imageData.category}`;
    item.dataset.category = imageData.category;
    item.dataset.title = imageData.title.toLowerCase();
    
    item.innerHTML = `
        <div class="gallery__item-inner">
            <img src="${GALLERY_CONFIG.imageFolder}/${imageData.filename}" 
                 alt="${imageData.title}"
                 class="gallery__image"
                 onerror="this.src='${GALLERY_CONFIG.defaultImage}'">
            <div class="gallery__overlay">
                <div class="gallery__overlay-content">
                    <h3 class="gallery__title">${imageData.title}</h3>
                    <p class="gallery__category">${GALLERY_CONFIG.categories[imageData.category] || 'Без категории'}</p>
                </div>
            </div>
        </div>
    `;
    
    return item;
}

// Инициализация модального окна
function initModal() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const captionText = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('.modal__close');
    
    // Закрытие модального окна
    closeBtn.onclick = function() {
        modal.style.display = "none";
    };
    
    // Клик по изображению в галерее
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('gallery__image')) {
            modal.style.display = "block";
            modalImg.src = e.target.src;
            captionText.innerHTML = e.target.alt;
        }
    });
    
    // Закрытие при клике вне изображения
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

// Инициализация фильтров
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Удаляем активный класс у всех кнопок
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            const filterValue = this.dataset.filter;
            filterGallery(filterValue);
        });
    });
}

// Фильтрация галереи
function filterGallery(category) {
    const items = document.querySelectorAll('.gallery__item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Инициализация поиска
function initSearch() {
    const searchInput = document.getElementById('gallery-search');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        searchGallery(searchTerm);
    });
}

// Поиск по галерее
function searchGallery(term) {
    const items = document.querySelectorAll('.gallery__item');
    
    items.forEach(item => {
        const title = item.dataset.title;
        
        if (title.includes(term) || term === '') {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}