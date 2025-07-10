document.addEventListener('DOMContentLoaded', function () {
    // Модальное окно (старый код)
    const openModalBtn = document.getElementById('openModal');
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');

    openModalBtn.addEventListener('click', () => modal.style.display = 'block');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === modal && (modal.style.display = 'none'));

    // Обработка формы предложения фильма (без отправки)
    const form = document.getElementById('film-suggestion-form');
    const formThanks = document.getElementById('form-thanks');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            form.style.display = 'none';
            formThanks.style.display = 'block';
            form.reset(); // Очищаем поля
            setTimeout(() => {
                form.style.display = 'block';
                formThanks.style.display = 'none';
            }, 3000); // Через 3 секунды форма возвращается
        });
    }
});