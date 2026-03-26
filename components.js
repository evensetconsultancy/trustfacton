/* ===== TrustFactON — Shared Components (4 Acts) ===== */

const ACTS = [
  {name:'Income Tax Act',     file:'income-tax.html',      color:'#D97706', emoji:'📊'},
  {name:'GST Act 2017',       file:'gst.html',             color:'#1A9E6B', emoji:'🏷️'},
  {name:'Companies Act 2013', file:'companies-act.html',   color:'#1A3A6B', emoji:'🏢'},
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
            ${ACTS.map(a=>`<a href="${a.file}"><span class="act-dot" style="background:${a.color}"></span>${a.name}</a>`).join('')}
          </div>
        </li>
        <li><a href="tds-master.html">TDS/TCS Master</a></li>
        <li><a href="chat.html">AI Chat</a></li>
        <li><a href="https://trustfacton.beehiiv.com/subscribe" target="_blank">Newsletter</a></li>
      </ul>
      <div class="nav-cta">
        <a href="chat.html" class="btn btn-primary btn-sm">Ask AI</a>
      </div>
      <div class="hamburger" onclick="toggleMobileMenu()">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu">
    <a href="index.html">🏠 Home</a>
    ${ACTS.map(a=>`<a href="${a.file}">${a.emoji} ${a.name}</a>`).join('')}
    <a href="tds-master.html">✂️ TDS/TCS Section Master</a>
    <a href="chat.html">🤖 AI Chat</a>
    <a href="https://trustfacton.beehiiv.com/subscribe" target="_blank">📧 Newsletter</a>
  </div>
</nav>`;

const FOOTER_HTML = `
<footer id="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="nav-logo">Trust<span class="logo-fact">Fact</span>ON<span class="logo-dot">.</span></div>
        <p>India's AI-powered platform for Indian statutory law — Income Tax, GST, Companies Act. Powered by Evenset Consultancy Services, Bengaluru.</p>
        <div class="footer-social" style="margin-top:16px;display:flex;gap:10px">
          <a href="https://evensetconsultancy.com" target="_blank" style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:0.8rem;transition:background 0.2s">🌐</a>
          <a href="https://x.com" target="_blank" style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:0.8rem;transition:background 0.2s">𝕏</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Acts & Tools</h4>
        <ul>
          ${ACTS.map(a=>`<li><a href="${a.file}">${a.name}</a></li>`).join('')}
          <li><a href="tds-master.html">TDS/TCS Section Master</a></li>
          <li><a href="chat.html">AI Chat Assistant</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Official Portals</h4>
        <ul>
          <li><a href="https://www.incometaxindia.gov.in" target="_blank">Income Tax Dept ↗</a></li>
          <li><a href="https://www.gst.gov.in" target="_blank">GST Portal ↗</a></li>
          <li><a href="https://www.mca.gov.in" target="_blank">MCA Portal ↗</a></li>
          <li><a href="https://eportal.incometax.gov.in" target="_blank">e-Filing Portal ↗</a></li>
          <li><a href="https://www.tdscpc.gov.in" target="_blank">TRACES Portal ↗</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Weekly Updates</h4>
        <p style="font-size:0.85rem;margin-bottom:8px">Tax circulars, compliance alerts & law updates from TrustFactON.</p>
        <div class="footer-newsletter-input">
          <input type="email" placeholder="your@email.com" id="footer-email">
          <button onclick="footerSubscribe()">→</button>
        </div>
        <p style="font-size:0.76rem;margin-top:8px;color:rgba(255,255,255,0.35)">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 TrustFactON · Evenset Consultancy Services OPC Pvt Ltd · Bengaluru</span>
      <span style="color:rgba(255,255,255,0.3)">For informational purposes only. Not legal advice.</span>
    </div>
  </div>
</footer>`;

function injectComponents() {
  const navEl = document.getElementById('nav-placeholder');
  if (navEl) navEl.outerHTML = NAV_HTML;
  else document.body.insertAdjacentHTML('afterbegin', NAV_HTML);
  const footerEl = document.getElementById('footer-placeholder');
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;
  else document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#site-nav .nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPage) a.classList.add('active');
  });
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
}
function footerSubscribe() {
  const email = document.getElementById('footer-email')?.value;
  if (!email) return;
  window.open(`https://trustfacton.beehiiv.com/subscribe?email=${encodeURIComponent(email)}`, '_blank');
}
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:#1A3A6B;color:white;padding:12px 20px;border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:slideUp 0.3s ease`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = header.classList.contains('open');
      document.querySelectorAll('.accordion-header').forEach(h => { h.classList.remove('open'); h.nextElementSibling?.classList.remove('open'); });
      if (!isOpen) { header.classList.add('open'); body?.classList.add('open'); }
    });
  });
}
function showTopic(val) {
  if (!val) return;
  document.querySelectorAll('.topic-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + val);
  if (panel) { panel.classList.add('active'); document.getElementById('panels-wrap')?.scrollIntoView({behavior:'smooth', block:'start'}); }
  const sel = document.getElementById('topicSelect');
  if (sel) sel.value = val;
  document.querySelectorAll('.topic-chip').forEach(c => { c.classList.toggle('active', c.getAttribute('onclick') === `showTopic('${val}')`); });
}
document.addEventListener('DOMContentLoaded', () => {
  injectComponents();
  initAccordions();
  const hash = window.location.hash.replace('#','');
  if (hash && document.getElementById('panel-' + hash)) showTopic(hash);
});
