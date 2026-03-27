/* ===== TrustFactON — Components v3 ===== */

const NAV_HTML = `
<nav id="site-nav">
  <div class="container">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">Trust<span class="accent">Fact</span>ON</a>
      <ul class="nav-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="income-tax.html">Income Tax</a></li>
        <li><a href="gst.html">Goods & Service Tax</a></li>
        <li><a href="companies-act.html">Companies Act</a></li>
        <li><a href="tds-master.html">TDS/TCS Master</a></li>
        <li><a href="chat.html">AI Chat</a></li>
      </ul>
      <div class="nav-cta">
        <a href="https://trustfacton.beehiiv.com/subscribe" target="_blank" class="btn btn-ghost btn-sm">Newsletter</a>
        <a href="chat.html" class="btn btn-blue btn-sm">Ask AI →</a>
      </div>
      <div class="hamburger" onclick="toggleMenu()">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu">
    <a href="index.html">🏠 Home</a>
    <a href="income-tax.html">📊 Income Tax</a>
    <a href="gst.html">🏷️ Goods &amp; Service Tax</a>
    <a href="companies-act.html">🏢 Companies Act</a>
    <a href="tds-master.html">✂️ TDS/TCS Master</a>
    <a href="chat.html">🤖 AI Chat</a>
    <a href="https://trustfacton.beehiiv.com/subscribe" target="_blank">📧 Newsletter</a>
  </div>
</nav>`;

const FOOTER_HTML = `
<footer id="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-logo">Trust<span class="accent">Fact</span>ON</div>
        <p>India's plain-language compliance reference. Income Tax · Goods &amp; Service Tax · Companies Act · TDS/TCS. Powered by Evenset Consultancy Services, Bengaluru.</p>
      </div>
      <div class="footer-col">
        <h4>Topics</h4>
        <ul>
          <li><a href="income-tax.html">Income Tax</a></li>
          <li><a href="gst.html">Goods &amp; Service Tax</a></li>
          <li><a href="companies-act.html">Companies Act</a></li>
          <li><a href="tds-master.html">TDS/TCS Master</a></li>
          <li><a href="chat.html">AI Chat</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Official Portals</h4>
        <ul>
          <li><a href="https://www.incometaxindia.gov.in" target="_blank">Income Tax Dept ↗</a></li>
          <li><a href="https://eportal.incometax.gov.in" target="_blank">e-Filing Portal ↗</a></li>
          <li><a href="https://www.gst.gov.in" target="_blank">GST Portal ↗</a></li>
          <li><a href="https://cbic-gst.gov.in" target="_blank">CBIC ↗</a></li>
          <li><a href="https://www.mca.gov.in" target="_blank">MCA Portal ↗</a></li>
          <li><a href="https://www.tdscpc.gov.in" target="_blank">TRACES ↗</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Stay Updated</h4>
        <p style="font-size:0.82rem;margin-bottom:8px">Tax circulars &amp; compliance alerts weekly.</p>
        <div class="footer-nl-input">
          <input type="email" id="footer-email" placeholder="your@email.com">
          <button onclick="footerSub()">→</button>
        </div>
        <p style="font-size:0.74rem;margin-top:8px;color:rgba(255,255,255,0.3)">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 TrustFactON · Evenset Consultancy Services OPC Pvt Ltd · Bengaluru</span>
      <span style="color:rgba(255,255,255,0.25)">Informational only. Not legal advice.</span>
    </div>
  </div>
</footer>`;

function injectComponents() {
  const n = document.getElementById('nav-placeholder');
  if (n) n.outerHTML = NAV_HTML; else document.body.insertAdjacentHTML('afterbegin', NAV_HTML);
  const f = document.getElementById('footer-placeholder');
  if (f) f.outerHTML = FOOTER_HTML; else document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
  // Highlight active nav link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#site-nav .nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

function toggleMenu() { document.getElementById('mobile-menu')?.classList.toggle('open'); }
function footerSub() { const e = document.getElementById('footer-email')?.value; if (e) window.open(`https://trustfacton.beehiiv.com/subscribe?email=${encodeURIComponent(e)}`, '_blank'); }
function showToast(msg) { const t = document.createElement('div'); t.style.cssText = `position:fixed;bottom:20px;right:20px;background:#0F172A;color:white;padding:10px 18px;border-radius:8px;font-size:0.84rem;font-family:'Inter',sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.2);`; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }
function initAccordions() { document.querySelectorAll('.accordion-header').forEach(h => { h.addEventListener('click', () => { const b = h.nextElementSibling; const open = h.classList.contains('open'); document.querySelectorAll('.accordion-header').forEach(x => { x.classList.remove('open'); x.nextElementSibling?.classList.remove('open'); }); if (!open) { h.classList.add('open'); b?.classList.add('open'); } }); }); }
function showTopic(val) { if (!val) return; document.querySelectorAll('.topic-panel').forEach(p => p.classList.remove('active')); document.getElementById('panel-' + val)?.classList.add('active'); document.getElementById('panels-wrap')?.scrollIntoView({behavior:'smooth', block:'start'}); const s = document.getElementById('topicSelect'); if (s) s.value = val; document.querySelectorAll('.topic-chip').forEach(c => c.classList.toggle('active', c.getAttribute('onclick') === `showTopic('${val}')`)); }
document.addEventListener('DOMContentLoaded', () => { injectComponents(); initAccordions(); const hash = window.location.hash.replace('#',''); if (hash && document.getElementById('panel-' + hash)) showTopic(hash); });
