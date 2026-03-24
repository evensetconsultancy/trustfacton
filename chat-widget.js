/* ===== TrustFactON — AI Chat Widget ===== */
/* Calls Flask backend on Render.com — users need NO API key */

const BACKEND_URL = "https://trustfacton-backend-i8kl5zbxq-evensetconsultancys-projects.vercel.app";

class TrustFactONChat {
  constructor(containerId, actContext = '') {
    this.containerId = containerId;
    this.container   = document.getElementById(containerId);
    this.actContext  = actContext;
    this.history     = [];
    this.isTyping    = false;

    if (!this.container) return;

    this.messagesEl = this.container.querySelector('.chat-messages');
    this.inputEl    = this.container.querySelector('.chat-input');
    this.sendBtn    = this.container.querySelector('.chat-send-btn');

    this.bindEvents();
    this.addBotWelcome();
  }

  bindEvents() {
    this.sendBtn?.addEventListener('click', () => this.send());
    this.inputEl?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });
    this.container.querySelectorAll('.chat-suggest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.inputEl) { this.inputEl.value = btn.textContent.trim(); this.send(); }
      });
    });
  }

  addBotWelcome() {
    const welcome = this.actContext
      ? `👋 Hello! I'm TrustFactON's AI assistant, specialised in <strong>${this.actContext}</strong>. Ask me anything — sections, thresholds, compliance requirements, or practical examples.`
      : `👋 Hello! I'm TrustFactON's AI assistant powered by Google Gemini. I can answer questions on Income Tax, GST, Companies Act, FEMA, Labour Laws, SEBI & IBC. What would you like to know?`;
    this.appendMsg('bot', welcome);
  }

  appendMsg(role, html) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerHTML = `<div class="msg-avatar">${role === 'bot' ? 'TF' : 'You'}</div><div class="msg-bubble">${html}</div>`;
    this.messagesEl?.appendChild(div);
    this.scrollBottom();
  }

  showTyping() {
    const div = document.createElement('div');
    div.className = 'msg bot typing-msg';
    div.innerHTML = `<div class="msg-avatar">TF</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    this.messagesEl?.appendChild(div);
    this.scrollBottom();
    return div;
  }

  scrollBottom() {
    if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  async send() {
    const text = this.inputEl?.value.trim();
    if (!text || this.isTyping) return;

    this.inputEl.value = '';
    this.isTyping = true;
    if (this.sendBtn) this.sendBtn.disabled = true;

    this.appendMsg('user', this.escapeHtml(text));
    this.history.push({ role: 'user', text });

    const typingEl = this.showTyping();

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: this.history.slice(-10),
          context: this.actContext
        })
      });

      typingEl.remove();
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);

      const replyText = data.reply || 'Sorry, I could not generate a response.';
      this.history.push({ role: 'model', text: replyText });
      this.appendMsg('bot', this.formatReply(replyText));

    } catch (err) {
      typingEl.remove();
      this.history.pop();

      let msg = err.message;
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        msg = '⚠ Could not connect to AI service. Please check your internet and try again.';
      } else if (msg.includes('daily limit')) {
        msg = '⚠ AI daily limit reached. Please try again after a few hours.';
      }

      this.appendMsg('bot', `<span style="color:#DC2626">${this.escapeHtml(msg)}</span>`);
    } finally {
      this.isTyping = false;
      if (this.sendBtn) this.sendBtn.disabled = false;
      this.inputEl?.focus();
    }
  }

  formatReply(text) {
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code style="background:#F1F3F5;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>')
      .replace(/^### (.+)$/gm,'<strong style="color:#1A3A6B;display:block;margin-top:10px;margin-bottom:4px">$1</strong>')
      .replace(/^## (.+)$/gm,'<strong style="color:#1A3A6B;display:block;font-size:1.05em;margin-top:12px;margin-bottom:6px">$1</strong>')
      .replace(/^[\-•] (.+)$/gm,'<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm,'<li><strong>$1.</strong> $2</li>')
      .replace(/(<li>.*<\/li>\n?)+/gs, m=>`<ul style="padding-left:16px;margin:6px 0">${m}</ul>`)
      .replace(/\n\n/g,'<br><br>')
      .replace(/\n/g,'<br>');
  }

  escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}

/* ===== AUTO INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  const widget = document.getElementById('chat-widget');
  if (widget) window._tfChat = new TrustFactONChat('chat-widget', widget.dataset.act || '');

  const fullChat = document.getElementById('chat-full');
  if (fullChat) {
    const msgs = fullChat.querySelector('.chat-full-messages');
    if (msgs) msgs.classList.add('chat-messages');
    window._tfChatFull = new TrustFactONChat('chat-full', '');
  }
});
