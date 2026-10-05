// Константы
const API_HOST = 'https://api.green-api.com';

// Селекторы DOM-элементов
const idInstanceInput = document.getElementById('idInstance');
const apiTokenInput = document.getElementById('ApiTokenInstance');
const apiResponseOutput = document.getElementById('apiResponse');

/**
 * Форматирует и выводит данные в правую текстовую область (только для чтения).
 * @param {Object|String} data
 */
function printResponse(data) {
    if (typeof data === 'object') {
        apiResponseOutput.value = JSON.stringify(data, null, 2);
    } else {
        apiResponseOutput.value = data;
    }
}

/**
 * Валидирует и подготавливает chatId для WhatsApp API.
 * Если передан только номер (например, 77771234567), добавляет постфикс @c.us.
 * @param {String} input
 * @returns {String|null}
 */
function sanitizeChatId(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Очищаем от лишних символов (пробелы, тире, плюс)
    const digitsOnly = trimmed.replace(/[^\d]/g, '');

    if (trimmed.includes('@c.us') || trimmed.includes('@g.us')) {
        return trimmed;
    }

    return digitsOnly ? `${digitsOnly}@c.us` : null;
}

/**
 * Проверяет корректность введенной URL-ссылки.
 * @param {String} urlString
 * @returns {Boolean}
 */
function isValidHttpUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

/**
 * Универсальный метод отправки запросов к GREEN-API.
 * @param {String} methodName 
 * @param {String} httpMethod 
 * @param {Object|null} payload 
 */
async function makeApiRequest(methodName, httpMethod = 'GET', payload = null) {
    const idInstance = idInstanceInput.value.trim();
    const apiToken = apiTokenInput.value.trim();

    if (!idInstance || !apiToken) {
        printResponse({ error: 'Заполните поля idInstance и ApiTokenInstance' });
        return;
    }

    const url = `${API_HOST}/waInstance${idInstance}/${methodName}/${apiToken}`;

    const requestOptions = {
        method: httpMethod,
        headers: {}
    };

    if (payload) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(payload);
    }

    try {
        printResponse('Отправка запроса...');

        const response = await fetch(url, requestOptions);
        const result = await response.json();

        printResponse(result);
    } catch (error) {
        printResponse({
            error: 'Ошибка при выполнении сетевого запроса',
            details: error.message
        });
    }
}

// ==========================================
// Обработчики событий кнопок
// ==========================================

// 1. Метод getSettings
document.getElementById('btn-getSettings').addEventListener('click', () => {
    makeApiRequest('getSettings', 'GET');
});

// 2. Метод getStateInstance
document.getElementById('btn-getStateInstance').addEventListener('click', () => {
    makeApiRequest('getStateInstance', 'GET');
});

// 3. Метод sendMessage
document.getElementById('btn-sendMessage').addEventListener('click', () => {
    const rawChatId = document.getElementById('chatIdMessage').value;
    const message = document.getElementById('messageText').value.trim();

    const chatId = sanitizeChatId(rawChatId);

    if (!chatId) {
        printResponse({ error: 'Укажите корректный номер телефона / chatId' });
        return;
    }

    if (!message) {
        printResponse({ error: 'Введите текст сообщения' });
        return;
    }

    makeApiRequest('sendMessage', 'POST', {
        chatId: chatId,
        message: message
    });
});

// 4. Метод sendFileByUrl
document.getElementById('btn-sendFileByUrl').addEventListener('click', () => {
    const rawChatId = document.getElementById('chatIdFile').value;
    const fileUrl = document.getElementById('fileUrl').value.trim();

    const chatId = sanitizeChatId(rawChatId);

    if (!chatId) {
        printResponse({ error: 'Укажите корректный номер телефона / chatId' });
        return;
    }

    if (!fileUrl || !isValidHttpUrl(fileUrl)) {
        printResponse({ error: 'Укажите корректный URL файла (начинающийся с http:// или https://)' });
        return;
    }

    // Извлекаем имя файла из URL или задаем дефолтное
    const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1) || 'file';

    makeApiRequest('sendFileByUrl', 'POST', {
        chatId: chatId,
        urlFile: fileUrl,
        fileName: fileName
    });
});