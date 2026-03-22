/* ===== TrustFactON — AI Chat Widget ===== */

const CHAT_SYSTEM_PROMPT = `You are TrustFactON's AI Legal Assistant — an expert in Indian statutory law built by Evenset Consultancy Services.

Your expertise covers:
- Income Tax Act 1961 and the new Income Tax Act 2025 (effective April 1, 2026)
- GST (CGST Act 2017, IGST Act 2017, UTGST Act 2017)
- Companies Act 2013 and related MCA rules
- FEMA 1999 and RBI regulations on foreign exchange
- Labour Laws — four Labour Codes (2019-2020)
- SEBI Act 1992, LODR 2015, ICDR 2018, Insider Trading Regulations 2015
- Insolvency and Bankruptcy Code 2016 (IBC)

Response guidelines:
- Always cite relevant sections / rules when answering
- Format responses clearly with headings or bullet points where helpful
- Clarify when you are referring to IT Act 1961 vs IT Act 2025
- Be concise but comprehensive — target finance professionals, CAs, CS, and CFOs
- If a question is outside your domain, say so and suggest consulting a professional
- Never provide specific legal advice — always add "consult a professional for your specific situation"

Keep responses focused and practical.`;

class TrustFactONChat {
  constructor(containerId, actContext = '') {
    this.container = document.getElementById(containerId);
    this.actContext = actContext;
    this.messages = [];
    this.isTyping = false;

    if (!this.container) return;
    this.messagesEl  = this.container.querySelector('.chat-messages');
    this.inputEl     = this.container.querySelector('.chat-input');
    this.sendBtn     = this.container.querySelector('.chat-send-btn');

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
        if (this.inputEl) { this.inputEl.value = btn.textContent; this.send(); }
      });
    });
  }

  addBotWelcome() {
    const welcome = this.actContext
      ? `Hello! I'm TrustFactON's AI assistant. I'm specialised in <strong>${this.actContext}</strong> and all major Indian statutes. Ask me anything — sections, thresholds, compliance requirements, or concepts.`
      : `Hello! I'm TrustFactON's AI assistant. I can help you understand Indian laws including Income Tax, GST, Companies Act, FEMA, Labour Laws, SEBI, and IBC. What would you like to know?`;
    this.appendMsg('bot', welcome);
  }

  appendMsg(role, html) {
    const initials = role === 'bot' ? 'TF' : 'You';
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerHTML = `
      <div class="msg-avatar">${initials}</div>
      <div class="msg-bubble">${html}</div>
    `;
    this.messagesEl.appendChild(div);
    this.scrollBottom();
  }

  showTyping() {
    const div = document.createElement('div');
    div.className = 'msg bot typing-msg';
    div.innerHTML = `
      <div class="msg-avatar">TF</div>
      <div class="msg-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>
    `;
    this.messagesEl.appendChild(div);
    this.scrollBottom();
    return div;
  }

  removeTyping() {
    const t = this.messagesEl.querySelector('.typing-msg');
    if (t) t.remove();
  }

  scrollBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  async send() {
    const text = this.inputEl?.value.trim();
    if (!text || this.isTyping) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      openApiModal();
      showToast('Please set your Anthropic API key first');
      return;
    }

    this.inputEl.value = '';
    this.isTyping = true;
    if (this.sendBtn) this.sendBtn.disabled = true;

    // Add user message
    this.appendMsg('user', this.escapeHtml(text));
    this.messages.push({ role: 'user', content: text });

    // Typing indicator
    const typingEl = this.showTyping();

    try {
      const systemPrompt = this.actContext
        ? CHAT_SYSTEM_PROMPT + `\n\nCurrent context: User is browsing the ${this.actContext} page. Prioritise answers related to ${this.actContext} unless they ask about something else.`
        : CHAT_SYSTEM_PROMPT;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: this.messages.slice(-12) // keep last 12 turns
        })
      });

      typingEl.remove();

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      const replyHtml = this.formatReply(replyText);

      this.appendMsg('bot', replyHtml);
      this.messages.push({ role: 'assistant', content: replyText });

    } catch (err) {
      typingEl.remove();
      this.appendMsg('bot', `<span style="color:#DC2626">⚠ Error: ${this.escapeHtml(err.message)}. Please check your API key in Settings.</span>`);
      console.error('Chat error:', err);
    } finally {
      this.isTyping = false;
      if (this.sendBtn) this.sendBtn.disabled = false;
      this.inputEl?.focus();
    }
  }

  formatReply(text) {
    // Convert markdown-like formatting to HTML
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, `<code style="background:#F1F3F5;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>`)
      .replace(/^### (.+)$/gm, '<strong style="color:#1A3A6B;display:block;margin-top:10px;margin-bottom:4px">$1</strong>')
      .replace(/^## (.+)$/gm, '<strong style="color:#1A3A6B;display:block;font-size:1.05em;margin-top:12px;margin-bottom:6px">$1</strong>')
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li><strong>$1.</strong> $2</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul style="padding-left:16px;margin:8px 0">${m}</ul>`)
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}

// Auto-initialise any chat widget on the page
document.addEventListener('DOMContentLoaded', () => {
  const widget = document.getElementById('chat-widget');
  if (widget) {
    const actCtx = widget.dataset.act || '';
    window._tfChat = new TrustFactONChat('chat-widget', actCtx);
  }
  const fullChat = document.getElementById('chat-full');
  if (fullChat) {
    window._tfChatFull = new TrustFactONChat('chat-full', '');
  }
});
