document.addEventListener('DOMContentLoaded', function () {
    // Модальное окно
    const modal = document.getElementById('modal');
    const openModalBtn = document.getElementById('openModal');
    const closeBtn = document.querySelector('.close');

    if (modal && openModalBtn && closeBtn) {
        openModalBtn.addEventListener('click', () => modal.style.display = 'block');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));
    }

    // Форма предложения фильма
    const form = document.getElementById('film-suggestion-form');
    const formThanks = document.getElementById('form-thanks');

    if (form && formThanks) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            form.style.display = 'none';
            formThanks.style.display = 'block';
            form.reset();

            setTimeout(() => {
                form.style.display = 'block';
                formThanks.style.display = 'none';
            }, 3000);
        });
    }

    // ===== Загрузка фильмов из Google Sheets =====
    async function loadFilmsFromGoogleSheets() {
        const filmsContainer = document.getElementById('films-container');
        if (!filmsContainer) return;

        try {
            filmsContainer.innerHTML = '<div class="loading-message">Загрузка списка фильмов...</div>';
            filmsContainer.classList.add('loading');

            const sheetId = '1a6EWO5ECaI1OveO4Gy7y9zH5LjFtlm8Alg9iSRP2heE';
            const sheetName = 'Films';
            const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('Таблица с фильмами не содержит данных');
            }

            let html = '';
            data.forEach(film => {
                if (!film || !film['Название']) return;

                const rating = parseFloat(film['Рейтинг']) || 0;
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);

                const stars =
                    '★'.repeat(fullStars) +
                    (hasHalfStar ? '½' : '') +
                    '☆'.repeat(emptyStars);

                html += `
                <div class="film-card">
                    <img src="${film['Постер URL'] || 'images/default-poster.jpg'}"
                         alt="${film['Название']} (${film['Год']})"
                         class="film-thumbnail"
                         onerror="this.src='images/default-poster.jpg'">
                    <h3>${film['Название']} (${film['Год']})</h3>
                    <p>Обсуждение ${film['Номер обсуждения'] || 'N/A'} (${film['Дата'] || 'дата неизвестна'})</p>
                    <div class="film-rating" title="Рейтинг: ${rating.toFixed(1)}">${stars}</div>
                </div>
                `;
            });

            filmsContainer.innerHTML = html || '<p>Нет данных о фильмах</p>';
            filmsContainer.classList.remove('loading');

        } catch (error) {
            console.error('Ошибка загрузки фильмов:', error);
            filmsContainer.innerHTML = `
            <div class="error-message">
                <p>Не удалось загрузить список фильмов</p>
                <p>${error.message.includes('Failed to fetch') ? 'Проблема с подключением к интернету' : error.message}</p>
                <button class="retry-button" onclick="loadFilmsFromGoogleSheets()">Попробовать снова</button>
            </div>
            `;
            filmsContainer.classList.remove('loading');
        }
    }

    // ===== Загрузка архива работ =====
    async function loadWorksFromGoogleSheets() {
        const worksContainer = document.getElementById('works-container');
        if (!worksContainer) return;

        try {
            worksContainer.innerHTML = '<div class="loading-message">Загрузка архива работ...</div>';
            worksContainer.classList.add('loading');

            const sheetId = '1KYU9mYAS5Wv6a9z-RImNxyP0n0Tpgf7BDRl2sNeSXmM';
            const sheetName = 'Video';
            const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('Таблица с работами не содержит данных');
            }

            let html = '';
            data.forEach(work => {
                if (!work || !work['Название']) return;

                html += `
                <div class="film-poster">
                    <a href="${work['Ссылка на видео']}" target="_blank" class="video-link">
                        <img src="${work['URL постера'] || 'images/default-poster.jpg'}"
                             alt="${work['Название']} (${work['Год']})"
                             class="poster-image"
                             onerror="this.src='images/default-poster.jpg'">
                        <div class="play-overlay">
                            <div class="play-button">▶</div>
                            <p class="watch-text">${work['Тип'] || 'Работа'}: "${work['Название']}" (${work['Год']})</p>
                        </div>
                    </a>
                    ${work['Описание'] ? `<p class="work-description">${work['Описание']}</p>` : ''}
                </div>
                `;
            });

            worksContainer.innerHTML = html || '<p>Нет данных о работах</p>';
            worksContainer.classList.remove('loading');

        } catch (error) {
            console.error('Ошибка загрузки архива работ:', error);
            worksContainer.innerHTML = `
            <div class="error-message">
                <p>Не удалось загрузить архив работ</p>
                <p>${error.message.includes('Failed to fetch') ? 'Проблема с подключением к интернету' : error.message}</p>
                <button class="retry-button" onclick="loadWorksFromGoogleSheets()">Попробовать снова</button>
            </div>
            `;
            worksContainer.classList.remove('loading');
        }
    }

    // Загружаем данные при загрузке страницы
    loadFilmsFromGoogleSheets();
    loadWorksFromGoogleSheets();

    // Делаем функции доступными глобально для кнопок повтора
    window.loadFilmsFromGoogleSheets = loadFilmsFromGoogleSheets;
    window.loadWorksFromGoogleSheets = loadWorksFromGoogleSheets;
});
