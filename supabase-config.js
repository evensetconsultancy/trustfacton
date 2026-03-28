/* ===== TrustFactON — Supabase Config =====
   Replace SUPABASE_URL and SUPABASE_ANON_KEY with
   your project values from:
   Supabase Dashboard → Settings → API
   ========================================= */

const SUPABASE_URL      = 'https://jmolgvabcfbmsctldpcr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ITdqqr6Yczf2d6c_fuNcmw_065lWBcj';

// Supabase JS v2 loaded via CDN in each HTML file
// This file just exports the client
function createClient() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
const sb = createClient();

// ── Auth helpers ────────────────────────────────────
async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function requireAuth() {
  const user = await getUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}

async function getProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

// ── Entity helpers ───────────────────────────────────
async function getMyEntities(userId) {
  const { data } = await sb
    .from('entity_members')
    .select(`
      role, status,
      entities (
        id, name, type, pan, gstin, cin_llpin, tan, email_reminders,
        registrations (*)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');
  return (data || []).map(m => ({ ...m.entities, my_role: m.role }));
}

async function getEntityFilings(entityId) {
  const { data } = await sb
    .from('filings')
    .select('*, done_by_profile:done_by(name)')
    .eq('entity_id', entityId)
    .order('due_date', { ascending: true });
  return data || [];
}

// ── Deadline computation (matches calendar logic) ───
function getFYContext(refDate) {
  const d  = refDate || new Date();
  const yr = d.getFullYear();
  const mo = d.getMonth() + 1;
  const fyStart = mo <= 3 ? yr - 1 : yr;
  const fyEnd   = fyStart + 1;
  const ay      = fyEnd + 1;
  const fy2d    = s => String(s).slice(-2);
  return {
    yr, fyStart, fyEnd, ay,
    FY:     `FY ${fyStart}-${fy2d(fyEnd)}`,
    AY:     `AY ${fyEnd}-${fy2d(ay)}`,
    prevFY: `FY ${fyStart - 1}-${fy2d(fyStart)}`,
  };
}

// Generate deadlines for an entity based on its registrations
function getEntityDeadlines(registrations, refDate) {
  const f    = registrations || {};
  const ctx  = getFYContext(refDate);
  const today = refDate || new Date();
  const yr   = today.getFullYear();
  const mo   = today.getMonth() + 1;
  const isQEnd = [3,6,9,12].includes(mo);

  const all = [];

  // ── GST ────────────────────────────────────────────
  if (f.gst) {
    all.push(
      { key:`GSTR7_${yr}_${mo}`,  cat:'GST', name:'GSTR-7 (TDS under GST)',         due: new Date(yr,mo-1,7),  m:'all' },
      { key:`GSTR8_${yr}_${mo}`,  cat:'GST', name:'GSTR-8 (TCS e-commerce)',         due: new Date(yr,mo-1,7),  m:'all' },
      { key:`GSTR1_${yr}_${mo}`,  cat:'GST', name:'GSTR-1 Outward Supplies',         due: new Date(yr,mo-1,11), m:'all' },
      { key:`GSTR3B_${yr}_${mo}`, cat:'GST', name:'GSTR-3B Summary Return',          due: new Date(yr,mo-1,20), m:'all' },
    );
    if (isQEnd) all.push(
      { key:`GSTR3BQ1_${yr}_${mo}`, cat:'GST', name:'GSTR-3B Quarterly (QRMP)', due: new Date(yr,mo-1,22), m:'q_end' },
    );
    if (mo === 12) all.push(
      { key:`GSTR9_${yr}`, cat:'GST', name:`GSTR-9 Annual Return ${ctx.prevFY}`, due: new Date(yr,11,31) },
    );
  }

  // ── Income Tax ─────────────────────────────────────
  if (f.income_tax) {
    if (mo===6)  all.push({ key:`ADVT1_${yr}`, cat:'Income Tax', name:`Advance Tax 1st Instalment 15% (${ctx.FY})`, due: new Date(yr,5,15) });
    if (mo===9)  all.push({ key:`ADVT2_${yr}`, cat:'Income Tax', name:`Advance Tax 2nd Instalment 45% (${ctx.FY})`, due: new Date(yr,8,15) });
    if (mo===12) all.push({ key:`ADVT3_${yr}`, cat:'Income Tax', name:`Advance Tax 3rd Instalment 75% (${ctx.FY})`, due: new Date(yr,11,15) });
    if (mo===3)  all.push({ key:`ADVT4_${yr}`, cat:'Income Tax', name:`Advance Tax Final 100% (${ctx.FY})`,         due: new Date(yr,2,15) });
    if (mo===7)  all.push({ key:`ITR_${yr}`,    cat:'Income Tax', name:`ITR Filing Individuals/HUF (${ctx.AY})`,   due: new Date(yr,6,31) });
    if (mo===9)  all.push({ key:`AUDIT_${yr}`,  cat:'Income Tax', name:`Tax Audit Report 3CA/3CB (${ctx.AY})`,     due: new Date(yr,8,30) });
    if (mo===10) all.push({ key:`ITRAUD_${yr}`, cat:'Income Tax', name:`ITR Filing Audit Cases (${ctx.AY})`,       due: new Date(yr,9,31) });
  }

  // ── TDS ────────────────────────────────────────────
  if (f.tds) {
    const tdsDue = mo === 3 ? 30 : 7;
    all.push({ key:`TDS_${yr}_${mo}`, cat:'TDS', name:'TDS/TCS Deposit', due: new Date(yr,mo-1,tdsDue) });
    if (mo===5)  all.push({ key:`TDSR_Q4_${yr}`, cat:'TDS', name:'TDS Return Q4 (Jan–Mar) Form 24Q/26Q', due: new Date(yr,4,31) });
    if (mo===7)  all.push({ key:`TDSR_Q1_${yr}`, cat:'TDS', name:'TDS Return Q1 (Apr–Jun) Form 24Q/26Q', due: new Date(yr,6,31) });
    if (mo===10) all.push({ key:`TDSR_Q2_${yr}`, cat:'TDS', name:'TDS Return Q2 (Jul–Sep) Form 24Q/26Q', due: new Date(yr,9,31) });
    if (mo===1)  all.push({ key:`TDSR_Q3_${yr}`, cat:'TDS', name:'TDS Return Q3 (Oct–Dec) Form 24Q/26Q', due: new Date(yr,0,31) });
    if (mo===6)  all.push({ key:`F16_${yr}`,     cat:'TDS', name:`Form 16/16A Issue (${ctx.prevFY})`,     due: new Date(yr,5,15) });
  }

  // ── PF ─────────────────────────────────────────────
  if (f.pf) {
    all.push({ key:`EPF_${yr}_${mo}`, cat:'PF', name:'EPF Monthly Contribution', due: new Date(yr,mo-1,15) });
  }

  // ── ESIC ───────────────────────────────────────────
  if (f.esic) {
    all.push({ key:`ESIC_${yr}_${mo}`, cat:'ESIC', name:'ESIC Monthly Contribution', due: new Date(yr,mo-1,15) });
  }

  // ── ROC / MCA ──────────────────────────────────────
  if (f.roc) {
    if (mo===6)  all.push({ key:`DPT3_${yr}`,  cat:'ROC', name:`DPT-3 Return of Deposits (${ctx.prevFY})`,     due: new Date(yr,5,30) });
    if (mo===9)  all.push({ key:`DIR3_${yr}`,   cat:'ROC', name:'DIR-3 KYC Director KYC',                       due: new Date(yr,8,30) });
    if (mo===4)  all.push({ key:`MSME1H_${yr}`, cat:'ROC', name:'MSME-1 H2 (Oct–Mar outstanding dues)',         due: new Date(yr,3,30) });
    if (mo===10) all.push({ key:`MSME1H2_${yr}`,cat:'ROC', name:'MSME-1 H1 (Apr–Sep outstanding dues)',         due: new Date(yr,9,31) });
    if (mo===10) all.push({ key:`AOC4_${yr}`,   cat:'ROC', name:`AOC-4 Financial Statements (${ctx.prevFY})`,   due: new Date(yr,9,29) });
    if (mo===11) all.push({ key:`MGT7_${yr}`,   cat:'ROC', name:`MGT-7/7A Annual Return (${ctx.prevFY})`,       due: new Date(yr,10,29) });
  }

  return all.sort((a,b) => a.due - b.due);
}

// ── UI helpers ───────────────────────────────────────
function urgencyClass(due, status) {
  if (status === 'done')   return 'status-done';
  if (status === 'missed') return 'status-missed';
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.round((new Date(due) - today) / 86400000);
  if (diff < 0)  return 'status-overdue';
  if (diff <= 7) return 'status-soon';
  if (diff <= 30)return 'status-near';
  return 'status-future';
}

function daysLabel(due, status) {
  if (status === 'done')   return '✓ Done';
  if (status === 'missed') return 'Missed';
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.round((new Date(due) - today) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff === 0)return '⚡ Today';
  return `${diff} days`;
}

const CAT_COLOR = {
  'GST': '#16A34A', 'Income Tax': '#2563EB', 'TDS': '#D97706',
  'PF': '#7C3AED', 'ESIC': '#0891B2', 'ROC': '#DC2626'
};
