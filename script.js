const fs = require('fs');
const axios = require('axios');
const vision = require('@google-cloud/vision');
const path = require('path');
const pdfPoppler = require('pdf-poppler');
require('dotenv').config();

const keyPath = path.join(__dirname, 'service-account.json');
const client = new vision.ImageAnnotatorClient({ keyFilename: keyPath });

const DATA_DIR = path.join(__dirname, 'data'); // Папка с входными файлами
const OUTPUT_DIR = path.join(__dirname, 'output'); // Папка с выходными файлами

// Создаем папку output, если её нет
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Функция OCR для изображений (JPG, PNG)
async function extractTextFromImage(imagePath) {
    const [result] = await client.textDetection(imagePath);
    console.log(`- Извлечен текст из: ${imagePath}`);
    return result.fullTextAnnotation ? result.fullTextAnnotation.text : null;
}

// Функция вызова OpenAI для извлечения ключевых данных
async function extractKeyFields(text) {
    const prompt = `Extract the following key fields:
    - invoice_number: Find "Отправка №" and extract the number next to it.
    - container_number: Extract the first matching alphanumeric container code (e.g., "BU8183503").
    - forwarder_name: Extract text after "Уплата произвольных платежей".

    Here is the document text: \n\n${text}

    Return a **valid JSON** object with keys, without explanations, without code blocks: "invoice_number", "container_number", "forwarder_name".
    Example JSON:
    {
      "invoice_number": "14520766",
      "container_number": "BU8183503",
      "forwarder_name": "КЗХ AO KTZ Express 2744046/35277425 Оплата по КЗХ производится через АО KTZ Express -
      2744046/35277425
      РЖД АО «ОТЛК ЕРА» через ЦФТО 1005782098 Оплата по РЖД производится АО «ОТЛК ЕРА» через ЦФТО, код плательщика 1005782098, подкод экспедитора 005000389546"
    }`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error('❌ Ошибка OpenAI API:', error.response?.data || error.message);
        return null;
    }
}

// Функция для конвертации PDF в JPG
async function convertPdfToJpg(pdfPath) {
    const outputFile = path.join(DATA_DIR, path.basename(pdfPath, path.extname(pdfPath)) + '-1.jpg');

    const options = {
        format: 'jpeg',
        out_dir: DATA_DIR,
        out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
        page: 1,
    };

    try {
        await pdfPoppler.convert(pdfPath, options);
        return outputFile;
    } catch (error) {
        console.error('❌ Ошибка при конвертации PDF в JPG:', error);
        return null;
    }
}

// Функция обработки файла
async function processFile(filePath) {
    let extractedText;
    if (filePath.toLowerCase().endsWith('.pdf')) {
        const imagePath = await convertPdfToJpg(filePath);
        if (imagePath) {
            extractedText = await extractTextFromImage(imagePath);
        } else {
            console.log(`- Пропущен PDF: ${filePath}`);
            return null;
        }
    } else {
        extractedText = await extractTextFromImage(filePath);
    }

    if (extractedText) {
        const extractedData = await extractKeyFields(extractedText);
        if (extractedData) {
            extractedData.source_file = path.basename(filePath); // Добавляем имя файла
            return extractedData;
        }
    }

    console.log(`- Текст не найден: ${filePath}`);
    return null;
}

// Функция обработки всех файлов в папке
async function processAllFiles() {
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.pdf') || file.endsWith('.jpg') || file.endsWith('.png'));

    if (files.length === 0) {
        console.log('- Нет файлов для обработки в папке "data"');
        return;
    }

    console.log(`- Найдено ${files.length} файла(ов). Начинаем обработку...`);

    const results = [];
    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        console.log(`- Обрабатываем: ${file}`);
        const result = await processFile(filePath);
        if (result) {
            results.push(result);
        }
    }

    if (results.length > 0) {
        const outputFileName = `output_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const outputFilePath = path.join(OUTPUT_DIR, outputFileName);
        fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf8');
        console.log(`- Данные сохранены в: ${outputFilePath}`);
    } else {
        console.log('❌ Не удалось извлечь данные из файлов.');
    }
}

processAllFiles();
