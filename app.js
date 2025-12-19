// Lightweight demo chat logic (client-side mock replies).
// - Persists messages to localStorage when persistence is enabled.
// - Mock bot replies by echoing the user text with a short delay.

(function(){
  const form = document.getElementById('chatForm');
  const input = document.getElementById('messageInput');
  const messagesEl = document.getElementById('messages');
  const clearBtn = document.getElementById('clearBtn');
  const persistBtn = document.getElementById('persistBtn');
  const persistState = document.getElementById('persistState');

  const STORAGE_KEY = 'chatterbox_messages_v1';
  let persistence = true;

  function formatTime(ts = Date.now()){
    const d = new Date(ts);
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  function renderMessage({id, who, text, ts}) {
    const li = document.createElement('li');
    li.className = 'message ' + (who === 'user' ? 'user' : 'bot');
    li.dataset.id = id;
    li.innerHTML = `<div class="text">${escapeHtml(text)}</div><div class="meta">${who === 'user' ? 'You' : 'Chatter-Box'} • ${formatTime(ts)}</div>`;
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }

  function loadMessages(){
    try{
      if(!persistence) return [];
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.warn('Failed to load messages', e);
      return [];
    }
  }

  function saveMessages(all){
    try{
      if(!persistence) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }catch(e){
      console.warn('Failed to save messages', e);
    }
  }

  function getAllMessagesFromDOM(){
    return Array.from(messagesEl.querySelectorAll('.message')).map(li => ({
      id: li.dataset.id,
      who: li.classList.contains('user') ? 'user' : 'bot',
      text: li.querySelector('.text').textContent,
      ts: Date.now()
    }));
  }

  function sendUserMessage(text){
    const msg = { id: 'm_' + Date.now() + '_' + Math.floor(Math.random()*1000), who:'user', text, ts: Date.now() };
    renderMessage(msg);
    persistAppend(msg);
    // Simulate typing
    simulateBotReply(text);
  }

  function persistAppend(msg){
    if(!persistence) return;
    const all = loadMessages();
    all.push(msg);
    saveMessages(all);
  }

  function simulateBotReply(userText){
    // Add a temporary "typing" indicator
    const typingId = 't_' + Date.now();
    const typingEl = document.createElement('li');
    typingEl.className = 'message bot';
    typingEl.dataset.id = typingId;
    typingEl.innerHTML = `<div class="text">Typing…</div><div class="meta">Chatter-Box • ${formatTime()}</div>`;
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // After a delay, replace with actual reply
    const delay = 700 + Math.min(1800, userText.length * 25);
    setTimeout(() => {
      typingEl.remove();
      const replyText = generateReply(userText);
      const reply = { id: 'm_' + Date.now() + '_' + Math.floor(Math.random()*1000), who:'bot', text: replyText, ts: Date.now() };
      renderMessage(reply);
      persistAppend(reply);
    }, delay);
  }

  function generateReply(userText){
    // Simple mock reply: echo with a friendly transform.
    if(!userText || !userText.trim()) return "Say something and I'll echo!";
    const trimmed = userText.trim();
    // Try small variety
    const variants = [
      `You said: "${trimmed}" — got it!`,
      `Echo: ${trimmed}`,
      `Nice! You wrote "${trimmed}". What else would you like to say?`,
      `I heard: "${trimmed}".`,
    ];
    return variants[Math.floor(Math.random()*variants.length)];
  }

  function clearMessages(){
    messagesEl.innerHTML = '';
    if(persistence) localStorage.removeItem(STORAGE_KEY);
  }

  function loadAndRender(){
    messagesEl.innerHTML = '';
    const all = loadMessages();
    all.forEach(renderMessage);
  }

  // Event handlers
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    sendUserMessage(text);
    input.value = '';
    input.focus();
  });

  clearBtn.addEventListener('click', () => {
    clearMessages();
    input.focus();
  });

  persistBtn.addEventListener('click', () => {
    persistence = !persistence;
    persistState.textContent = 'Persistence: ' + (persistence ? 'on' : 'off');
    // if turned off, don't wipe existing data; just stop saving
    if(persistence){
      // save current DOM messages
      const all = getAllMessagesFromDOM();
      saveMessages(all);
    }
  });

  // Initialize
  (function init(){
    // Start with a greeting if no messages present
    const stored = loadMessages();
    if(stored && stored.length){
      loadAndRender();
    } else {
      // initial bot greeting
      const greeting = { id: 'm_greet', who:'bot', text: "Welcome to Chatter-Box! Try sending a message below.", ts: Date.now() };
      renderMessage(greeting);
      persistAppend(greeting);
    }
    // show persistence state
    persistState.textContent = 'Persistence: ' + (persistence ? 'on' : 'off');
  })();
})();
