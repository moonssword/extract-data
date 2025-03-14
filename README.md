# 📄 Обработка документов с использованием Google Vision API и OpenAI GPT-4o

Этот проект позволяет извлекать текст из изображений и PDF-документов с помощью Google Cloud Vision API, а затем анализировать текст для получения ключевых данных с помощью OpenAI GPT-4o. 

---
## 📌 Функционал
✅ **Обрабатывает все файлы в папке `data/`** (PDF, JPG, PNG)
✅ **PDF автоматически конвертируются в JPG перед обработкой**
✅ **Распознает текст с помощью Google Vision API**
✅ **Извлекает ключевые данные с помощью OpenAI GPT-4o**
✅ **Сохраняет результаты в `output/output_{datetime}.json`**

---
## 🛠 Требования
Перед запуском убедитесь, что у вас установлены:

- **Node.js** (v16+)
- **Аккаунт Google Cloud с настроенным Vision API**
- **API-ключ OpenAI** (GPT-4o)
- **PDF-Poppler** (для конвертации PDF в JPG)
- **Необходимые библиотеки (устанавливаются через `npm install`)**:
  - `axios`
  - `dotenv`
  - `fs`
  - `path`
  - `pdf-poppler`
  - `@google-cloud/vision`

---
## 🔧 Установка и настройка
### 1️⃣ Установите зависимости

```sh
npm install
```

Для установки всех необходимых зависимостей, выполните:
```sh
npm install axios dotenv fs path pdf-poppler @google-cloud/vision
```

### 2️⃣ Установите PDF-Poppler
PDF-Poppler требуется для конвертации PDF в изображения. Установите его в зависимости от вашей ОС:

**Windows:**
1. Скачайте [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases)
2. Разархивируйте и скопируйте путь к `bin/` в системную переменную `PATH`

**Linux (Debian/Ubuntu):**
```sh
sudo apt update && sudo apt install poppler-utils
```

**MacOS:**
```sh
brew install poppler
```

### 3️⃣ Настройте API-ключи
Создайте в корневой папке файл **`.env`** и добавьте туда:

```
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
OPENAI_API_KEY=your-openai-api-key
```


### 4️⃣ Подготовьте входные файлы

Создайте папку `data/` и добавьте в неё файлы форматов **PDF, JPG, PNG**.

---
## 🚀 Запуск

```sh
node script.js
```

Скрипт автоматически обработает все файлы из папки `data/` и сохранит результат в `output/output_{datetime}.json`.

---
## 📂 Структура проекта
```
📁 проект
 ├── 📁 data            # Входные файлы (PDF, JPG, PNG)
 ├── 📁 output          # Выходные файлы (JSON с результатами)
 ├── 📄 script.js       # Основной скрипт обработки
 ├── 📄 .env            # Конфигурационный файл с API-ключами
 ├── 📄 service-account.json # Ключ Google Cloud Vision API
 ├── 📄 package.json    # Файл зависимостей npm
 ├── 📄 README.md       # Инструкция (этот файл)
```

---
## 📊 Выходной JSON

Формат выходного файла:

```json
[
  {
    "invoice_number": "14520766",
    "container_number": "BU8183503",
    "forwarder_name": "КЗХ AO KTZ Express",
    "source_file": "example.pdf"
  }
]
```

---
## ❓ Частые ошибки и их решения

### ❌ `Ошибка OpenAI API: Unexpected token ...`
💡 **Решение:** GPT-4o иногда возвращает JSON в код-блоках. Убедитесь, что в коде используется:
```javascript
response.data.choices[0].message.content.replace(/^```json\s*|```$/g, "").trim()
```

### ❌ `Error: 7 PERMISSION_DENIED`
💡 **Решение:** Убедитесь, что Google Cloud Vision API включен и ваш API-ключ правильный.

### ❌ `Error: ENOENT: no such file or directory, open 'service-account.json'`
💡 **Решение:** Проверьте, что файл `service-account.json` находится в корне проекта и указан в `.env`.

### ❌ `Error: poppler-utils not found`
💡 **Решение:** Проверьте, что PDF-Poppler установлен и доступен в `PATH`.

