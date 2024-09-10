'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');
const connectingElement = document.querySelector('.connecting');

let stompClient = null;
let username = null;

const colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

const connect = (event) => {
    event.preventDefault();
    username = document.querySelector('#name').value.trim();

    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
};

const onConnected = () => {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Send username to the server
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({ sender: username, type: 'JOIN' }));

    connectingElement.classList.add('hidden');
};

const onError = (error) => {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
};

const sendMessage = (event) => {
    event.preventDefault();
    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
};

const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    const messageElement = document.createElement('li');

    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = `${message.sender} ${message.type === 'JOIN' ? 'joined' : 'left'}!`;
    } else {
        messageElement.classList.add('chat-message');

        const avatarElement = document.createElement('i');
        avatarElement.textContent = message.sender[0];
        avatarElement.style.backgroundColor = getAvatarColor(message.sender);

        const usernameElement = document.createElement('span');
        usernameElement.textContent = message.sender;

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(usernameElement);
    }

    const textElement = document.createElement('p');
    textElement.textContent = message.content;

    messageElement.appendChild(textElement);
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
};

const getAvatarColor = (messageSender) => {
    let hash = Array.from(messageSender).reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0);
    const index = Math.abs(hash % colors.length);
    return colors[index];
};

usernameForm.addEventListener('submit', connect);
messageForm.addEventListener('submit', sendMessage);
