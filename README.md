# 🎬 Кино-клуб "Одиссея" 

![Логотип](assets/images/logo-group-vk.webp)  
*Место, где кино становится искусством общения*

## 🌟 Особенности
| Категория       | Возможности                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| 🎥 Показы       | Еженедельные тематические кинопоказы с обсуждениями + онлайн-трансляции    |
| 💬 Обсуждения  | Архив дискуссий с оценками и AI-анализом sentiment-анализа                 |
| 🗳️ Краудсорсинг | Умная система рекомендаций на основе предпочтений участников               |
| ♿ Доступность  | Полностью адаптивный интерфейс с поддержкой WCAG AAA                       |

## 🛠 Технологический стек
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)

## 🚀 Быстрый старт

### Предварительные требования
- Node.js v18+
- npm v9+ или yarn v1.22+
- Firebase CLI (если требуется деплой)

#### 1. Клонируйте репозиторий
```bash
git clone https://github.com/odyssey-cinema-club/frontend.git
```
```
cd frontend
```
#### 2. Установите зависимости
```
npm install
```
#### 3. Настройте окружение
```
cp .env.example .env.local
```
#### 4. Запустите приложение
```
npm run dev
```
_________________________________________
### Откройте http://localhost:3000 в браузере.

# ⚙️ Конфигурация

 Создайте проект в Firebase Console
```
    Включите:

        Authentication

        Firestore Database

        Storage
```
### Скопируйте конфиг в .env.local:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
```

# 🏗️ Архитектура проекта

````
odyssey-cinema-club/
├── apps/
│   ├── frontend/          # Next.js приложение
│   │   ├── components/    # UI компоненты
│   │   ├── lib/           # Бизнес-логика
│   │   ├── pages/         # Роуты
│   │   └── styles/        # SCSS модули
│   └── admin/             # Панель управления
├── packages/
│   ├── ui/                # Общие UI компоненты
│   └── config/            # Конфигурации ESLint/TypeScript
├── .github/               # CI/CD workflows
└── README.md
````

# 📊 Данные и API

Firebase Firestore - основное хранилище

TMDB API - база фильмов и актуальных релизов

Cloudinary - хостинг медиафайлов

Vercel Analytics - сбор статистики

# 📜 Лицензия

https://img.shields.io/badge/License-AGPL_v3-blue.svg

© 2024 Кино-клуб "Одиссея". Открытый код для кинолюбителей.

### 📬 Контакты

🌐 [Официальный сайт](https://stas18.github.io/ulysses_club/)

📍 [ул. Шмидта, 12, Севастополь (место встречи)](https://yandex.ru/maps/org/tom_soyyer/213825175194/?ll=33.520904%2C44.601171&z=17.06)

🔵 [VK сообщество](https://vk.com/ulysses_club)

🤖 [Telegram-бот для анонсов](https://t.me/Odyssey_Cinema_Club_bot)
