/* ===================================================
   TrustFactON — Content Filter
   Reads user's entity type from Supabase session,
   then shows/hides nav links and content sections
   based on what's relevant for that entity.
   Include AFTER supabase-config.js on all act pages.
   =================================================== */

// What each entity type can access
const ENTITY_ACCESS = {
  'Individual':      ['income-tax'],
  'Proprietor':      ['income-tax','gst','tds'],
  'Partnership':     ['income-tax','gst','tds','pf-esic'],
  'LLP':             ['income-tax','gst','tds','pf-esic','companies-act'],
  'OPC':             ['income-tax','gst','tds','pf-esic','companies-act'],
  'Private Limited': ['income-tax','gst','tds','pf-esic','companies-act'],
};

// Which nav links map to which access key
const NAV_ACCESS = {
  'income-tax.html':   'income-tax',
  'gst.html':          'gst',
  'tds-master.html':   'tds',
  'companies-act.html':'companies-act',
};

// Current page
const CURRENT_PAGE = window.location.pathname.split('/').pop() || 'index.html';

async function applyContentFilter() {
  try {
    const { data:{ session } } = await sb.auth.getSession();

    if (!session) {
      // Not logged in — show all content, Login button
      showGuestBanner();
      return;
    }

    // Get user's entity type
    const { data: members } = await sb
      .from('entity_members')
      .select('role, entities(type)')
      .eq('user_id', session.user.id)
      .eq('status','active')
      .limit(1)
      .single();

    const role       = members?.role || 'owner';
    const entityType = members?.entities?.type || null;

    // Professionals see everything
    if (role === 'professional') {
      updateNavForUser(session, null); // show all nav links
      return;
    }

    // Business owner — filter by entity type
    if (entityType) {
      const allowed = ENTITY_ACCESS[entityType] || Object.values(ENTITY_ACCESS).flat();
      filterNavLinks(allowed);
      filterPageContent(allowed, entityType);
      updateNavForUser(session, entityType);

      // If current page is not allowed for this entity — show a gentle notice
      const pageAccess = NAV_ACCESS[CURRENT_PAGE];
      if (pageAccess && !allowed.includes(pageAccess)) {
        showNotApplicableBanner(entityType);
      }
    } else {
      updateNavForUser(session, null);
    }

  } catch(e) {
    // Silent fail — don't break the page
    console.log('Content filter:', e.message);
  }
}

function filterNavLinks(allowed) {
  document.querySelectorAll('#site-nav .nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    const access = NAV_ACCESS[href];
    if (access && !allowed.includes(access)) {
      a.style.opacity = '0.4';
      a.style.pointerEvents = 'none';
      a.title = 'Not applicable for your entity type';
    }
  });
}

function filterPageContent(allowed, entityType) {
  // On topic pages — dim/hide quick cards and chips for non-applicable sections
  // We don't hard-hide — we dim and add a "not applicable" note
  // so users can still see the content if curious

  // The "not applicable" sections get a visual indicator
  const pageAccess = NAV_ACCESS[CURRENT_PAGE];
  if (!pageAccess) return; // homepage or other pages — no filtering
}

function updateNavForUser(session, entityType) {
  // Replace Login button with Tracker link
  const btn = document.getElementById('nav-login-btn');
  if (btn) {
    btn.textContent = 'My Tracker →';
    btn.href = 'dashboard.html';
    btn.style.background = '#16A34A'; // green — active/logged in
  }

  // Add entity type badge next to logo if on act pages
  if (entityType && CURRENT_PAGE !== 'index.html') {
    const logo = document.querySelector('.nav-logo');
    if (logo && !document.getElementById('entity-badge')) {
      const badge = document.createElement('span');
      badge.id = 'entity-badge';
      badge.textContent = entityType;
      badge.style.cssText = 'font-size:.65rem;font-weight:700;background:rgba(255,255,255,.15);color:rgba(255,255,255,.8);padding:2px 8px;border-radius:10px;margin-left:4px;white-space:nowrap;';
      logo.insertAdjacentElement('afterend', badge);
    }
  }
}

function showGuestBanner() {
  // Non-intrusive banner at top of act pages for guests
  if (CURRENT_PAGE === 'index.html') return;
  const bar = document.createElement('div');
  bar.style.cssText = 'background:#1A3A6B;color:rgba(255,255,255,.8);text-align:center;padding:7px 16px;font-size:.78rem;';
  bar.innerHTML = 'You\'re viewing public content. <a href="signup.html" style="color:#60A5FA;font-weight:600">Create a free account</a> to track deadlines and get personalised reminders.';
  document.body.insertAdjacentElement('afterbegin', bar);
}

function showNotApplicableBanner(entityType) {
  const bar = document.createElement('div');
  bar.style.cssText = 'background:#FFFBEB;border-bottom:1px solid #FDE68A;color:#92400E;text-align:center;padding:8px 16px;font-size:.82rem;';
  bar.innerHTML = `ℹ️ This section may not apply to your entity type (<strong>${entityType}</strong>). Content is shown for reference. <a href="dashboard.html" style="color:#1A3A6B;font-weight:600">Go to your tracker →</a>`;
  // Insert after nav
  const nav = document.getElementById('site-nav');
  if (nav) nav.insertAdjacentElement('afterend', bar);
}

// Run after DOM + components are ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(applyContentFilter, 300); // wait for nav injection
});
