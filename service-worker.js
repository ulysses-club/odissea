// Название нашего хранилища (кэша). Меняйте версию (v1), когда хотите обновить все файлы в приложении.
const CACHE_NAME = 'odyssey-cache-v1';

// СПИСОК ФАЙЛОВ ДЛЯ КЭШИРОВАНИЯ (ваша "скелетная" структура)
// Добавьте сюда пути ко всем основным файлам вашего сайта, чтобы они работали офлайн.
const urlsToCache = [
  '/odissea/assets/pages/index.html',  // Главная страница
  '/odissea/assets/css/style.css',      // Основные стили
  '/odissea/modul/navigation.css',      // Стили навигации
  '/odissea/modul/hero-section.css',    // Стили шапки
  '/odissea/modul/footer-module.css',   // Стили подвала
  '/odissea/modul/tops-module.css',     // Стили топов
  '/odissea/modul/discussions-module.css', // Стили обсуждений
  '/odissea/modul/works-module.css',    // Стили работ
  '/odissea/modul/next-meeting-module.css', // Стили блока встречи
  '/odissea/modul/map-module.css',       // Стили карты
  '/odissea/js/script.js',               // Основные скрипты
  '/odissea/modul/navigation.js',         // Скрипты модулей
  '/odissea/modul/hero-section.js',
  '/odissea/modul/footer-module.js',
  '/odissea/modul/tops-module.js',
  '/odissea/modul/discussions-module.js',
  '/odissea/modul/works-module.js',
  '/odissea/modul/next-meeting-module.js',
  '/odissea/modul/map-module.js',
  '/odissea/assets/images/image-container.jpg', // Ваше большое изображение
  '/odissea/assets/images/favicon.ico'          // Иконка
  // Добавьте сюда все остальные CSS, JS и картинки, которые критичны для первого запуска
];

// Устанавливаем сервис-воркер и скачиваем все файлы из списка в кэш
self.addEventListener('install', event => {
  console.log('[Service Worker] Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Кэширование основных файлов');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Активируем воркер сразу после установки
  );
});

// Активация и очистка старого кэша (если вы поменяете CACHE_NAME)
self.addEventListener('activate', event => {
  console.log('[Service Worker] Активация');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Удаление старого кэша:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Начинаем управлять клиентами (страницами) сразу
  );
});


// Перехватываем запросы (fetch) и отвечаем данными из кэша, если они там есть
self.addEventListener('fetch', event => {
  // Пропускаем запросы не к нашему сайту (например, к API погоды или картам)
  if (!event.request.url.startsWith('https://ulysses-club.github.io')) {
    // Можно либо пропустить, либо попробовать закэшировать ответ для офлайна позже
    // Здесь мы просто пропускаем, чтобы не ломать интерактивные карты.
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если нашли в кэше — возвращаем из кэша (быстро и офлайн)
        if (response) {
          return response;
        }
        // Если нет в кэше — идем в интернет
        return fetch(event.request).then(
          networkResponse => {
            // Проверяем, получили ли мы корректный ответ от сети
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Клонируем ответ, т.к. тело ответа можно использовать только один раз
            const responseToCache = networkResponse.clone();
            // Открываем кэш и сохраняем новый файл для будущего офлайн-доступа
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(() => {
          // Если нет интернета и файла нет в кэше — ничего не поделать.
          // Можно было бы показать специальную офлайн-страницу, но пока просто пропускаем.
          console.log('[Service Worker] Нет сети и нет в кэше:', event.request.url);
        });
      })
  );
});
