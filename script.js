const API_HOST = 'https://api.green-api.com';

const idInstanceInput = document.getElementById('idInstance');
const apiTokenInput = document.getElementById('ApiTokenInstance');
const apiResponseOutput = document.getElementById('apiResponse');

// === НОВОЕ: Загрузка сохраненных данных при старте ===
function loadCredentials() {
    const savedId = localStorage.getItem('greenApi_idInstance');
    const savedToken = localStorage.getItem('greenApi_apiToken');
    
    if (savedId) idInstanceInput.value = savedId;
    if (savedToken) apiTokenInput.value = savedToken;
}

// === НОВОЕ: Автоматическое сохранение при вводе ===
idInstanceInput.addEventListener('input', (e) => {
    localStorage.setItem('greenApi_idInstance', e.target.value);
});

apiTokenInput.addEventListener('input', (e) => {
    localStorage.setItem('greenApi_apiToken', e.target.value);
});

// Вызываем загрузку данных сразу при запуске скрипта
loadCredentials();

/**
 * Выводит данные в консоль (правую панель)
 */
function printResponse(data) {
    if (typeof data === 'object') {
        apiResponseOutput.value = JSON.stringify(data, null, 2);
    } else {
        apiResponseOutput.value = data;
    }
}

/**
 * Управление состоянием кнопки (Loading)
 */
function setLoadingState(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = 'Загрузка...';
        button.disabled = true;
    } else {
        button.textContent = button.dataset.originalText;
        button.disabled = false;
    }
}

function sanitizeChatId(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const digitsOnly = trimmed.replace(/[^\d]/g, '');
    if (trimmed.includes('@c.us') || trimmed.includes('@g.us')) return trimmed;
    return digitsOnly ? `${digitsOnly}@c.us` : null;
}

function isValidHttpUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

/**
 * Универсальная функция запроса с обработкой состояния кнопок
 */
async function makeApiRequest(methodName, httpMethod = 'GET', payload = null, buttonId = null) {
    const idInstance = idInstanceInput.value.trim();
    const apiToken = apiTokenInput.value.trim();

    if (!idInstance || !apiToken) {
        printResponse({ error: 'Пожалуйста, заполните данные авторизации (ID и Токен)' });
        return null; // Возвращаем null при ошибке
    }

    const url = `${API_HOST}/waInstance${idInstance}/${methodName}/${apiToken}`;
    const requestOptions = { method: httpMethod, headers: {} };

    if (payload) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(payload);
    }

    try {
        printResponse('Отправка запроса...');
        if (buttonId) setLoadingState(buttonId, true);

        const response = await fetch(url, requestOptions);
        const result = await response.json();
        
        printResponse(result);
        return result; // НОВОЕ: Возвращаем результат для кнопок отправки
    } catch (error) {
        printResponse({
            error: 'Ошибка при выполнении сетевого запроса',
            details: error.message
        });
        return null;
    } finally {
        if (buttonId) setLoadingState(buttonId, false);
    }
}

// === Обработчики событий ===

document.getElementById('btn-getSettings').addEventListener('click', (e) => {
    makeApiRequest('getSettings', 'GET', null, e.target.id);
});

document.getElementById('btn-getStateInstance').addEventListener('click', (e) => {
    makeApiRequest('getStateInstance', 'GET', null, e.target.id);
});

// НОВОЕ: Сделали функцию асинхронной (async), чтобы дождаться ответа
document.getElementById('btn-sendMessage').addEventListener('click', async (e) => {
    const rawChatId = document.getElementById('chatIdMessage').value;
    const messageInput = document.getElementById('messageText');
    const message = messageInput.value.trim();
    const chatId = sanitizeChatId(rawChatId);

    if (!chatId || !message) {
        printResponse({ error: 'Заполните номер телефона и текст сообщения' });
        return;
    }

    // Ждем результат выполнения запроса
    const result = await makeApiRequest('sendMessage', 'POST', { chatId, message }, e.target.id);
    
    // Если сервер вернул idMessage (сообщение успешно отправлено), очищаем поле текста
    if (result && result.idMessage) {
        messageInput.value = '';
    }
});

// НОВОЕ: Сделали функцию асинхронной (async)
document.getElementById('btn-sendFileByUrl').addEventListener('click', async (e) => {
    const rawChatId = document.getElementById('chatIdFile').value;
    const fileUrlInput = document.getElementById('fileUrl');
    const fileUrl = fileUrlInput.value.trim();
    const chatId = sanitizeChatId(rawChatId);

    if (!chatId) {
        printResponse({ error: 'Укажите корректный номер телефона' });
        return;
    }

    if (!fileUrl || !isValidHttpUrl(fileUrl)) {
        printResponse({ error: 'Укажите корректную ссылку на файл' });
        return;
    }

    const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1) || 'file.ext';
    
    // Ждем результат выполнения запроса
    const result = await makeApiRequest('sendFileByUrl', 'POST', { chatId, urlFile: fileUrl, fileName }, e.target.id);
    
    // Если сервер вернул idMessage (файл успешно отправлен), очищаем поле ссылки
    if (result && result.idMessage) {
        fileUrlInput.value = '';
    }
});