document.addEventListener('DOMContentLoaded', function () {
    // Модальное окно
    const openModalBtn = document.getElementById('openModal');
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');

    openModalBtn.addEventListener('click', () => modal.style.display = 'block');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));

    // Форма предложения фильма
    const form = document.getElementById('film-suggestion-form');
    const formThanks = document.getElementById('form-thanks');

    if (form) {
        form.addEventListener('submit', (e) => {
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
        try {
            const sheetId = '1a6EWO5ECaI1OveO4Gy7y9zH5LjFtlm8Alg9iSRP2heE'; // ID таблицы
            const sheetName = 'Films'; // Название листа (gid=0)
            const gid = '0'; // Из URL: ...edit#gid=0
            const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

            const response = await fetch(url);
            const films = await response.json();

            const filmsContainer = document.querySelector('.film-grid');
            if (!filmsContainer) return;

            filmsContainer.innerHTML = ''; // Очищаем старые карточки

            films.forEach(film => {
                const filmCard = document.createElement('div');
                filmCard.className = 'film-card';

                filmCard.innerHTML = `
                    <img src="${film['Постер URL']}" alt="${film['Год']}" class="film-thumbnail">
                    <h3>${film['Название']} (${film['Год']})</h3>
                    <p>Обсуждение ${film['Номер обсуждения']} (${film['Дата']})</p>
                    <div class="film-rating">${'★'.repeat(film['Рейтинг'])}${'☆'.repeat(10 - film['Рейтинг'])}</div>
                `;

                filmsContainer.appendChild(filmCard);
            });
        } catch (error) {
            console.error('Ошибка загрузки фильмов:', error);
            // Можно добавить заглушку, если данные не загрузились
            document.querySelector('.film-grid').innerHTML = '<p>Фильмы скоро загрузятся...</p>';
        }
    }

    // Загружаем фильмы при загрузке страницы
    loadFilmsFromGoogleSheets();

    // Автообновление каждую минуту (добавьте эту строку в самом конце)
    setInterval(loadFilmsFromGoogleSheets);
});
