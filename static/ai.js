// declare variables for required DOM objects
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const messageList = document.getElementById('message-list');
const chatcontainer = document.getElementById('chat-container');

let bubbleStyles = {
  user: {
    align: 'items-end',
    bubbleClass: 'user-bubble p-4 rounded-xl rounded-tr-none max-w-[85%] shadow-md',
    timeClass: 'font-label-md text-label-md text-on-primary-container mt-2 block',
    textClass: 'font-body-lg text-body-lg whitespace-pre-line'
  },
  ai: {
    align: 'items-start',
    bubbleClass: 'ai-bubble p-4 rounded-xl rounded-tl-none max-w-[85%] shadow-sm',
    timeClass: 'font-label-md text-label-md text-outline mt-2 block',
    textClass: 'font-body-lg text-body-lg text-primary mb-3 whitespace-pre-line'
  }
};

function appendMessage(message, sender) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex flex-col ${bubbleStyles[sender].align}`;
    const bubble = document.createElement('div');
    bubble.className = bubbleStyles[sender].bubbleClass;
    const text = document.createElement('p');
    text.className = bubbleStyles[sender].textClass;
    text.textContent = message;
    const time = document.createElement('span');
    time.className = bubbleStyles[sender].timeClass;
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bubble.appendChild(text);
    bubble.appendChild(time);
    wrapper.appendChild(bubble);
    messageList.appendChild(wrapper);
    chatcontainer.scrollTo({ top: chatcontainer.scrollHeight, behavior: 'smooth' });
}

async function sendToAI(message) {
    try {
        const httpResponse = await fetch('/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({notes: message})
        });
        console.log('Response from AI:', httpResponse);
        const data = await httpResponse.json();
        appendMessage(data.reply, 'ai');
    } catch (error) {
        console.error('Error sending message to AI:', error);
    }

}

async function handleSend() {
    const message = userInput.value.trim();
    if (message !== '') {
        appendMessage(message, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
        console.log('Sending message to AI:', message);
        await sendToAI(message);
    }
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});