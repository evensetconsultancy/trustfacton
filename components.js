/* ===== TrustFactON — Shared Components ===== */

const ACTS = [
  { name: 'Income Tax Act',      file: 'income-tax.html',      color: '#D97706', emoji: '📊' },
  { name: 'GST Act',             file: 'gst.html',             color: '#1A9E6B', emoji: '🏷️' },
  { name: 'Companies Act 2013',  file: 'companies-act.html',   color: '#1A3A6B', emoji: '🏢' },
  { name: 'FEMA 1999',           file: 'fema.html',            color: '#DC2626', emoji: '💱' },
  { name: 'Labour Laws',         file: 'labour-laws.html',     color: '#6D28D9', emoji: '👷' },
  { name: 'SEBI Regulations',    file: 'sebi.html',            color: '#0D9488', emoji: '📈' },
  { name: 'Insolvency Code',     file: 'ibc.html',             color: '#EA580C', emoji: '⚖️' },
];

const NAV_HTML = `
<nav id="site-nav">
  <div class="container">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">Trust<span class="logo-fact">Fact</span>ON<span class="logo-dot">.</span></a>
      <ul class="nav-links">
        <li><a href="index.html">Home</a></li>
        <li class="nav-dropdown">
          <a href="#">Browse Acts ▾</a>
          <div class="nav-dropdown-menu">
            ${ACTS.map(a => `<a href="${a.file}"><span class="act-dot" style="background:${a.color}"></span>${a.name}</a>`).join('')}
          </div>
        </li>
        <li><a href="chat.html">AI Chat</a></li>
        <li><a href="https://trustfacton.beehiiv.com/subscribe" target="_blank">Newsletter</a></li>
      </ul>
      <div class="nav-cta">
        <button class="nav-api-btn" onclick="openApiModal()" title="Configure API Key">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        </button>
        <a href="chat.html" class="btn btn-primary btn-sm">Ask AI</a>
      </div>
      <div class="hamburger" onclick="toggleMobileMenu()">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu">
    <a href="index.html">Home</a>
    ${ACTS.map(a => `<a href="${a.file}">${a.emoji} ${a.name}</a>`).join('')}
    <a href="chat.html">🤖 AI Chat</a>
    <a href="https://trustfacton.beehiiv.com/subscribe" target="_blank">📧 Newsletter</a>
  </div>
</nav>
`;

const FOOTER_HTML = `
<footer id="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="nav-logo">Trust<span class="logo-fact">Fact</span>ON<span class="logo-dot">.</span></div>
        <p>India's premier AI-powered platform for statutory law summaries and compliance guidance — powered by Evenset Consultancy Services.</p>
        <div class="footer-social">
          <a href="https://x.com" target="_blank" title="X">𝕏</a>
          <a href="https://linkedin.com" target="_blank" title="LinkedIn">in</a>
          <a href="https://wa.me" target="_blank" title="WhatsApp">📲</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Browse Acts</h4>
        <ul>
          ${ACTS.map(a => `<li><a href="${a.file}">${a.name}</a></li>`).join('')}
        </ul>
      </div>
      <div class="footer-col">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="chat.html">AI Chat</a></li>
          <li><a href="https://trustfacton.beehiiv.com/subscribe" target="_blank">Newsletter</a></li>
          <li><a href="https://evensetconsultancy.com" target="_blank">Evenset Consultancy</a></li>
          <li><a href="mailto:hello@evensetconsultancy.com">Contact Us</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Stay Updated</h4>
        <p style="font-size:0.85rem">Get weekly finance & tax updates from TrustFactON.</p>
        <div class="footer-newsletter-input">
          <input type="email" placeholder="Your email" id="footer-email">
          <button onclick="footerSubscribe()">→</button>
        </div>
        <p style="font-size:0.78rem;margin-top:8px;color:rgba(255,255,255,0.4)">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2025 TrustFactON · Evenset Consultancy Services OPC Pvt Ltd · Bengaluru</span>
      <span style="color:rgba(255,255,255,0.35)">For informational purposes only. Not legal advice.</span>
    </div>
  </div>
</footer>
`;

const MODAL_HTML = `
<div class="modal-overlay" id="api-modal">
  <div class="modal-box">
    <h3>Configure AI Settings</h3>
    <p>Enter your Anthropic API key to enable the AI chat assistant. Your key is stored locally in your browser.</p>
    <input type="password" class="modal-input" id="api-key-input" placeholder="sk-ant-api03-..." />
    <div class="modal-actions">
      <button class="btn btn-outline btn-sm" onclick="closeApiModal()">Cancel</button>
      <button class="btn btn-navy btn-sm" onclick="saveApiKey()">Save Key</button>
    </div>
    <p class="modal-note">Get your API key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>. Your key is never sent anywhere except Anthropic's servers.</p>
  </div>
</div>
`;

// ===== Injection =====
function injectComponents() {
  const navEl = document.getElementById('nav-placeholder');
  if (navEl) navEl.outerHTML = NAV_HTML;
  else document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

  const footerEl = document.getElementById('footer-placeholder');
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;
  else document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);

  document.body.insertAdjacentHTML('beforeend', MODAL_HTML);

  // Mark active nav
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#site-nav .nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPage) a.classList.add('active');
  });

  // Load saved key
  const saved = localStorage.getItem('tf_api_key');
  if (saved) {
    const inp = document.getElementById('api-key-input');
    if (inp) inp.value = saved;
  }
}

// ===== API Key =====
function openApiModal()  { document.getElementById('api-modal').classList.add('open'); }
function closeApiModal() { document.getElementById('api-modal').classList.remove('open'); }
function saveApiKey() {
  const val = document.getElementById('api-key-input').value.trim();
  if (!val) { alert('Please enter an API key.'); return; }
  localStorage.setItem('tf_api_key', val);
  closeApiModal();
  showToast('API key saved ✓');
}
function getApiKey() { return localStorage.getItem('tf_api_key') || ''; }

// ===== Mobile Menu =====
function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// ===== Footer Subscribe =====
function footerSubscribe() {
  const email = document.getElementById('footer-email')?.value;
  if (!email) return;
  window.open(`https://trustfacton.beehiiv.com/subscribe?email=${encodeURIComponent(email)}`, '_blank');
}

// ===== Toast =====
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:#1A3A6B;color:white;padding:12px 20px;border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:slideUp 0.3s ease`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ===== Accordion =====
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = header.classList.contains('open');
      document.querySelectorAll('.accordion-header').forEach(h => {
        h.classList.remove('open');
        h.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) { header.classList.add('open'); body.classList.add('open'); }
    });
  });
}

// ===== Run on load =====
document.addEventListener('DOMContentLoaded', () => {
  injectComponents();
  initAccordions();
  // Close modal on overlay click
  document.addEventListener('click', e => {
    if (e.target.id === 'api-modal') closeApiModal();
  });
});
