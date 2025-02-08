const nameSection = document.querySelector('.name-sec');
const inputName = document.querySelector('.input-username');
const submitUsernameBtn = document.querySelector('.submit-username-btn');
const inputEmptyMsg = document.querySelector('.input-empty-msg');
const contentSection = document.querySelector('.content');
const greetingContainer = document.querySelector('.greeting-container');
const greetingTxt = document.querySelector('.greeting-txt');
const promptContainer = document.querySelector('.prompt-container');
const promptInput = document.querySelector('.prompt-input');
const sendPromptBtn = document.querySelector('.send-prompt-btn');
const chatsContainer = document.querySelector('.chats-wrapper');
const fileUploadContainer = document.querySelector('.file-upload-wrapper');
const fileUploadBtn = document.querySelector('.add-file-btn');
const fileInput = document.querySelector('.file-input');
const stopResponseBtn = document.querySelector('.stop-response-btn');
const changeThemeBtn = document.querySelector('.change-theme-btn');

const API_KEY = 'AIzaSyARHMGebEYa-N1m3VPHpSHJyXNCznxgIZU';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

let isTypingEffectInProgress = false;
let typingInterval, controller;
const chatHistory = [];
const userData = { message: '', file: {} };

submitUsernameBtn.addEventListener('click', () => {
    let inputValue = inputName.value.trim();
    let existingMessage = document.getElementById('empty-message');
    let isValidName = /^[a-zA-Z]+$/.test(inputValue);
    
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (inputValue === '') {
        let emptyMsg = document.createElement('span');
        emptyMsg.id = 'empty-message';
        emptyMsg.innerText = 'Enter a Name!';
        inputEmptyMsg.appendChild(emptyMsg);
    } else if (!isValidName) {
        let invalidMsg = document.createElement('span');
        invalidMsg.id = 'empty-message';
        invalidMsg.innerText = 'Name should contain only letters';
        inputEmptyMsg.appendChild(invalidMsg);
    } else {
        nameSection.classList.add('hideNameSec');
        contentSection.classList.add('unhideContentSec');
        greetingTxt.innerText = `Hello, ${inputValue}`;
    }
});

inputName.addEventListener('keydown', (e) => {
    let inputValue = inputName.value.trim();
    let existingMessage = document.getElementById('empty-message');
    let isValidName = /^[a-zA-Z]+$/.test(inputValue);
    
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (e.key === 'Enter') {
        
        if (inputValue === '') {
            let emptyMsg = document.createElement('span');
            emptyMsg.id = 'empty-message';
            emptyMsg.innerText = 'Enter a Name!';
            inputEmptyMsg.appendChild(emptyMsg);
        } else if (!isValidName) {
            let invalidMsg = document.createElement('span');
            invalidMsg.id = 'empty-message';
            invalidMsg.innerText = 'Name should contain only letters';
            inputEmptyMsg.appendChild(invalidMsg);
        } else {
            nameSection.classList.add('hideNameSec');
            inputName.disabled = true;
            contentSection.classList.add('unhideContentSec');
            greetingTxt.innerText = `Hello, ${inputValue}`;
        }
        
    }
});

promptInput.addEventListener('input', () => {
    if (promptInput.value.trim() != '') {
        sendPromptBtn.classList.add('unhideSendBtn');
    } else {
        sendPromptBtn.classList.remove('unhideSendBtn');
    }
});

function createMsgElement(content, className) {
    let div = document.createElement('div');
    div.classList.add('message', className);
    div.innerHTML = content;
    return div;
}

function autoScrollToBottom() { chatsContainer.scrollTo({ top: chatsContainer.scrollHeight, behavior: 'smooth' }) };

function typingEffectRes(responseTxt, textElement) {
    textElement.innerText = '';
    const words = responseTxt.split(' ');
    let wordIndex = 0;

    isTypingEffectInProgress = true;

    typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
            textElement.innerText += (wordIndex === 0 ? '' : ' ') + words[wordIndex++];
            autoScrollToBottom();
        } else {
            clearInterval(typingInterval);
            isTypingEffectInProgress = false;
            stopResponseBtn.classList.remove('unhideStopBtn');
        }
    }, 40);
}

async function generateBotResponse(userData, botMsgDiv) {
    let textElement = botMsgDiv.querySelector('.message-bot-txt');
    controller = new AbortController();
    
    chatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: (({ fileName, isImage, ...rest }) => rest)(userData.file) }] : [])]
    });

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: chatHistory }),
            signal: controller.signal
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error.message);

        const botResponseTxt = result.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, '$1').trim();
        typingEffectRes(botResponseTxt, textElement);

        chatHistory.push({
            role: "model",
            parts: [{ text: botResponseTxt }]
        });

        return result;
    } catch (error) {
        if (error || error === '503') {
            document.querySelector('.message-bot-txt').innerText = 'Something went wrong!';
            stopResponseBtn.classList.remove('unhideStopBtn');
        }
    } finally {
        userData.file = {};
    }
}

promptInput.addEventListener('keydown', (e) => {
    let userInputMsg = promptInput.value.trim();

    userData.message = userInputMsg;

    if (isTypingEffectInProgress) return;
    
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!e.shiftKey && userInputMsg !== '') {
            e.preventDefault();

            nameSection.classList.add('hideNameSec');
            greetingContainer.classList.add('hideGreetingCon');
            contentSection.classList.add('modifyContentChats');
            chatsContainer.classList.add('unhideChatsCon');
            promptContainer.classList.add('modifyPromptChats');
            sendPromptBtn.classList.remove('unhideSendBtn');
            promptInput.value = '';

            const userMsgElement = `
                <p class="message-user-txt">${userInputMsg}</p>
                ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="prompt-attached-img"/>` : `<p class="prompt-attached-file"><span id="attached-file"><i class="fa-regular fa-file-lines"></i></span>${userData.file.fileName}</p>`) : ''}
            `;
            const userMsgDiv = createMsgElement(userMsgElement, 'user-message');
            chatsContainer.appendChild(userMsgDiv);
            autoScrollToBottom();

            setTimeout(() => {
                const botMsgElement = `
                    <img class="bot-msg-icon" src="./assets/title-icon.png">  
                    <p class="message-bot-txt">Just a sec...</p>
                `;
                const botMsgDiv = createMsgElement(botMsgElement, 'bot-message');
                chatsContainer.appendChild(botMsgDiv);
                autoScrollToBottom();

                generateBotResponse(userData, botMsgDiv);
            }, 400);

            stopResponseBtn.classList.add('unhideStopBtn');
            fileUploadContainer.classList.remove('unhideUploadCon');
            if (chatsContainer.classList.contains('unhideChatsCon')) {
                fileUploadContainer.classList.remove('modifyFileUpload');
            }
            fileUploadContainer.innerHTML = '';
        }
    }
});

sendPromptBtn.addEventListener('click', () => {
    let userInputMsg = promptInput.value.trim();

    userData.message = userInputMsg;

    if (isTypingEffectInProgress) return;

    if (userInputMsg !== '') {
        nameSection.classList.add('hideNameSec');
        greetingContainer.classList.add('hideGreetingCon');
        contentSection.classList.add('modifyContentChats');
        chatsContainer.classList.add('unhideChatsCon');
        promptContainer.classList.add('modifyPromptChats');
        sendPromptBtn.classList.remove('unhideSendBtn');
        promptInput.value = '';

        const userMsgElement = `
            <p class="message-user-txt">${userInputMsg}</p>
            ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="prompt-attached-img"/>` : `<p class="prompt-attached-file"><span id="attached-file"><i class="fa-regular fa-file-lines"></i></span>${userData.file.fileName}</p>`) : ''}
        `;
        const userMsgDiv = createMsgElement(userMsgElement, 'user-message');
        chatsContainer.appendChild(userMsgDiv);
        autoScrollToBottom();

        setTimeout(() => {
            const botMsgElement = `
                <img class="bot-msg-icon" src="./assets/title-icon.png">  
                <p class="message-bot-txt">Just a sec...</p>
            `;
            const botMsgDiv = createMsgElement(botMsgElement, 'bot-message');
            chatsContainer.appendChild(botMsgDiv);
            autoScrollToBottom();

            generateBotResponse(userData, botMsgDiv);
        }, 400);

        stopResponseBtn.classList.add('unhideStopBtn');
        fileUploadContainer.classList.remove('unhideUploadCon');
        if (chatsContainer.classList.contains('unhideChatsCon')) {
            fileUploadContainer.classList.remove('modifyFileUpload');
        }
        fileUploadContainer.innerHTML = '';
    }
});

function createFileDiv(isImage, e) {
    const div = document.createElement("div");
    div.classList.add("file-container");

    div.innerHTML = `
        <img class="file" src="${isImage ? e.target.result : './assets/file-test.png'}">

        <button class="cancel-file-btn">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    fileUploadContainer.appendChild(div);
}

fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) return;

    fileUploadContainer.classList.add('unhideUploadCon');
    if (chatsContainer.classList.contains('unhideChatsCon')) {
        fileUploadContainer.classList.add('modifyFileUpload');
    } else {
        fileUploadContainer.classList.remove('modifyFileUpload');
    }

    Array.from(fileInput.files).forEach((file) => {
        const isImage = file.type.startsWith('image/');
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = (e) => {
            createFileDiv(isImage, e);
            const base64String = e.target.result.split(',')[1];
            sendPromptBtn.classList.add('unhideSendBtn');

            userData.file = { fileName: file.name, data: base64String, mime_type: file.type, isImage }
        };
    });

    sendPromptBtn.classList.remove('unhideSendBtn');
    fileInput.value = '';
});

fileUploadContainer.addEventListener('click', (event) => {
    if (event.target.closest('.cancel-file-btn')) {
        const fileDiv = event.target.closest('.file-container');
        fileDiv.remove();
        userData.file = {};
        
        if (fileUploadContainer.children.length === 0) {
            fileUploadContainer.classList.remove('unhideUploadCon');
            sendPromptBtn.classList.remove('unhideSendBtn');
            userData.file = {};
        }
    }
});

fileUploadBtn.addEventListener('click', () => fileInput.click());

stopResponseBtn.addEventListener('click', () => {
    userData.file = {};
    controller?.abort();
    clearInterval(typingInterval);

    isTypingEffectInProgress = false;
    stopResponseBtn.classList.remove('unhideStopBtn');
});

changeThemeBtn.addEventListener('click', () => {
    const isDarkTheme = document.body.classList.toggle('dark-theme');
    localStorage.setItem('themeColor', isDarkTheme ? 'dark-mode' : 'light-mode');
    changeThemeBtn.innerHTML = isDarkTheme ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

const isDarkTheme = localStorage.getItem('themeColor') === 'dark-mode';
document.body.classList.toggle('dark-theme', isDarkTheme);
changeThemeBtn.innerHTML = isDarkTheme ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';