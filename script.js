// ============ HRIS NAVIGATION ============
const navItems = document.querySelectorAll('.nav-item');
const pageContents = document.querySelectorAll('.page-content');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');

const pageNames = {
  dashboard: 'Dashboard',
  karyawan: 'Karyawan',
  absensi: 'Absensi',
  cuti: 'Cuti',
  gaji: 'Penggajian',
  laporan: 'Laporan',
  pengaturan: 'Pengaturan'
};

navItems.forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Remove active from all nav items
    navItems.forEach(n => n.classList.remove('active'));
    this.classList.add('active');
    
    // Hide all pages
    pageContents.forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const page = this.dataset.page;
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Update title
    pageTitle.textContent = pageNames[page] || page;
    pageSubtitle.textContent = page === 'dashboard' 
      ? 'Selamat datang kembali, Admin' 
      : 'Fitur sedang dalam pengembangan';
  });
});

// ============ DATE DISPLAY ============
const dateDisplay = document.getElementById('date-display');
const now = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateDisplay.textContent = now.toLocaleDateString('id-ID', options);

// ============ CHATBOT LOGIC ============
const toggleBtn = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('chat-window');
const closeBtn = document.getElementById('close-btn');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const imageUpload = document.getElementById('image-upload');
let selectedImage = null;

// Toggle chat window
toggleBtn.addEventListener('click', function() {
  chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
  if (chatWindow.style.display === 'flex') {
    input.focus();
  }
});

// Close chat window
closeBtn.addEventListener('click', function() {
  chatWindow.style.display = 'none';
});

// Submit form
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    
    if (!userMessage && !selectedImage) return;

    const welcome = chatBox.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    if (userMessage) {
        appendMessage('user', userMessage);
    }
    
    if (selectedImage) {
        appendImage('user', selectedImage);
    }

    input.value = '';
    const imageToSend = selectedImage;
    selectedImage = null;

    const loadingMessage = createLoadingMessage();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage || 'What is in this image?',
                image: imageToSend
            })
        });

        const data = await response.json();
        loadingMessage.remove();

        if (!response.ok) {
            appendMessage('error', data.error || 'Terjadi kesalahan.');
            return;
        }

        const cleanReply = cleanMarkdown(data.reply);
        appendMessage('bot', cleanReply);

    } catch (error) {
        console.error(error);
        loadingMessage.remove();
        appendMessage('error', 'Tidak dapat terhubung ke server.');
    }
});

// Upload image
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedImage = event.target.result;
            const welcome = chatBox.querySelector('.welcome-message');
            if (welcome) welcome.remove();
            appendImage('user', selectedImage);
            imageUpload.value = '';
        };
        reader.readAsDataURL(file);
    }
});

function createLoadingMessage() {
    const msg = document.createElement('div');
    msg.className = 'message bot loading';
    msg.style.cssText = 'background: white; color: #667eea; padding: 10px 18px; display: flex; align-items: center; gap: 2px; min-width: 50px; border-radius: 16px; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.textContent = '.';
        dot.style.cssText = 'font-size: 28px; font-weight: bold; animation: typingDot 1.2s infinite; line-height: 1;';
        if (i === 1) dot.style.animationDelay = '0.2s';
        if (i === 2) dot.style.animationDelay = '0.4s';
        msg.appendChild(dot);
    }
    
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
}

function cleanMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/__(.*?)__/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/_(.*?)_/g, '$1');
    text = text.replace(/^#{1,6}\s+/gm, '');
    text = text.replace(/~~(.*?)~~/g, '$1');
    text = text.replace(/`(.*?)`/g, '$1');
    text = text.replace(/^>\s+/gm, '');
    text = text.replace(/^[-*_]{3,}\s*$/gm, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    
    if (sender === 'bot') {
        msg.style.cssText = 'background: white; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); white-space: pre-wrap; word-wrap: break-word; padding: 10px 14px; border-radius: 16px; max-width: 85%; font-size: 14px; line-height: 1.5; display: flex; align-items: flex-start;';
        
        const avatar = document.createElement('span');
        avatar.style.cssText = 'display: inline-block; width: 24px; height: 24px; border-radius: 50%; background-image: url(eric-avatar.jpg); background-size: cover; background-position: center; margin-right: 8px; flex-shrink: 0; margin-top: 1px;';
        msg.appendChild(avatar);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        msg.appendChild(textSpan);
    } else if (sender === 'user') {
        msg.style.cssText = 'background: #667eea; color: white; align-self: flex-end; border-bottom-right-radius: 4px; padding: 10px 14px; border-radius: 16px; max-width: 85%; font-size: 14px; line-height: 1.5;';
        msg.textContent = text;
    } else {
        msg.style.cssText = 'background: #fee2e2; color: #dc2626; align-self: center; text-align: center; border-radius: 8px; font-size: 13px; padding: 10px 14px; max-width: 85%;';
        msg.textContent = text;
    }
    
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
}

function appendImage(sender, imageData) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    msg.style.cssText = sender === 'user' 
        ? 'background: #667eea; color: white; align-self: flex-end; border-bottom-right-radius: 4px; padding: 10px 14px; border-radius: 16px; max-width: 85%;'
        : 'background: white; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 10px 14px; border-radius: 16px; max-width: 85%; display: flex; align-items: flex-start;';
    
    const img = document.createElement('img');
    img.src = imageData;
    img.alt = 'Uploaded image';
    img.style.cssText = 'max-width: 150px; max-height: 150px; border-radius: 8px; margin-top: 5px; display: block;';
    
    if (sender === 'bot') {
        const avatar = document.createElement('span');
        avatar.style.cssText = 'display: inline-block; width: 24px; height: 24px; border-radius: 50%; background-image: url(eric-avatar.jpg); background-size: cover; background-position: center; margin-right: 8px; flex-shrink: 0; margin-top: 1px;';
        msg.appendChild(avatar);
    }
    
    msg.appendChild(img);
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
}

// Add keyframe animation for loading dots
const style = document.createElement('style');
style.textContent = `
  @keyframes typingDot {
    0%, 20% { opacity: 0.2; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-4px); }
    80%, 100% { opacity: 0.2; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .chat-window.active {
    display: flex !important;
    animation: slideUp 0.3s ease;
  }
`;
document.head.appendChild(style);