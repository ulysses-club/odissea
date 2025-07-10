async function loadFilmsFromGoogleSheets() {
    try {
        const sheetId = '1a6EWO5ECaI1OveO4Gy7y9zH5LjFtlm8Alg9iSRP2heE';
        const sheetName = 'Films'; // Убедитесь, что это точное название листа
        const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const data = await response.json();
        const filmsContainer = document.querySelector('.film-grid');
        
        if (!filmsContainer) return;

        // Преобразуем объект в массив, если данные пришли в формате {0: {...}, 1: {...}}
        const filmsArray = Array.isArray(data) ? data : Object.values(data);
        
        if (filmsArray.length === 0) {
            filmsContainer.innerHTML = '<p>Нет данных о фильмах</p>';
            return;
        }

        filmsContainer.innerHTML = ''; // Очищаем контейнер

        filmsArray.forEach(film => {
            if (!film || !film['Название']) return;
            
            const filmCard = document.createElement('div');
            filmCard.className = 'film-card';

            const rating = parseInt(film['Рейтинг']) || 0;
            const stars = '★'.repeat(Math.min(10, Math.max(0, rating)));
            const emptyStars = '☆'.repeat(10 - Math.min(10, Math.max(0, rating)));

            filmCard.innerHTML = `
                <img src="${film['Постер URL'] || 'images/default-poster.jpg'}" 
                     alt="${film['Название']} (${film['Год']})" 
                     class="film-thumbnail"
                     onerror="this.src='images/default-poster.jpg'">
                <h3>${film['Название']} (${film['Год']})</h3>
                <p>Обсуждение ${film['Номер обсуждения'] || 'N/A'} (${film['Дата'] || 'дата неизвестна'})</p>
                <div class="film-rating">${stars}${emptyStars}</div>
            `;

            filmsContainer.appendChild(filmCard);
        });

    } catch (error) {
        console.error('Ошибка загрузки фильмов:', error);
        const filmsContainer = document.querySelector('.film-grid');
        if (filmsContainer) {
            filmsContainer.innerHTML = `
                <div class="error-message">
                    <p>Не удалось загрузить список фильмов</p>
                    <p>${error.message}</p>
                    <button onclick="loadFilmsFromGoogleSheets()">Попробовать снова</button>
                </div>
            `;
        }
    }
}
