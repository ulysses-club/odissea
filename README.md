# ulysses_club
# 🎬 Кино-клуб "Одиссея" - Веб-приложение

![Логотип Кино-клуба](images/logo-group-vk.jpg)

Веб-приложение для организации встреч и обсуждения фильмов в Севастополе.

## ✨ Особенности

- **📊 Топы** фильмов, режиссеров и жанров
- **🗃️ Архив** всех обсуждений с рейтингами
- **💡 Система предложений** новых фильмов
- **📱 Адаптивный дизайн** для всех устройств
- **♿ Доступность** (a11y) для всех пользователей

## 🛠 Технологии

![HTML5](https://img.shields.io/badge/-HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/-CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Google Sheets](https://img.shields.io/badge/-Google%20Sheets-34A853?logo=google-sheets&logoColor=white)

## 📊 Источники данных

Приложение использует следующие Google Sheets таблицы:

1. [Таблица с фильмами](https://docs.google.com/spreadsheets/d/1a6EWO5ECaI1OveO4Gy7y9zH5LjFtlm8Alg9iSRP2heE/edit?gid=0#gid=0)
   - Содержит список всех обсужденных фильмов
   - Рейтинги и даты обсуждений
   - Информация о режиссерах и жанрах

2. [Таблица с видео работами](https://docs.google.com/spreadsheets/d/1KYU9mYAS5Wv6a9z-RImNxyP0n0Tpgf7BDRl2sNeSXmM/edit?gid=0#gid=0)
   - Коллекция видео материалов
   - Ссылки на работы
   - Описания и метаданные

## 🚀 Установка и запуск

```bash
git clone https://github.com/yourusername/odyssey-cinema-club.git
```
```bash
cd odyssey-cinema-club
```

# Открыть в браузере (Linux/macOS)
```bash
open index.html
```
# Или для Windows:
```bash
start index.html
```

## ⚙️ Настройка данных

    Создайте таблицы в Google Sheets:

        Films - список фильмов

        Video - видео работы

    Обновите ID в script.js:
```bash
const CONFIG = {
    sheets: {
        films: { id: 'ВАШ_ID' },
        works: { id: 'ВАШ_ID' }
    }
};
```
## 📂 Структура проекта
```
odyssey-cinema-club/
├── index.html          # Главная страница
├── style.css          # Стили
├── script.js          # Логика приложения
├── images/            # Медиафайлы
│   ├── logo.svg
│   ├── social-preview.jpg
│   └── default-poster.jpg
└── README.md          # Документация
```
## ♿ Доступность
Функция	Реализация
Семантика	HTML5 + ARIA
Навигация	Клавиатурная поддержка
Контраст	WCAG AA стандарт
Адаптивность	Mobile-first подход
## 📜 Лицензия

MIT License © 2025 Кино-клуб "Одиссея"

https://img.shields.io/badge/License-MIT-yellow.svg

## 📬 Контакты

    📧 Email: contact@kinoclub.ru

    🔵 VK: Кино-клуб Одиссея

    📱 Telegram: @Odyssey_Cinema_Club_bot
