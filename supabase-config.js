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
  return (data || [])
    .filter(m => m.entities && m.entities.id)   // skip orphan rows
    .map(m => {
      const entity = { ...m.entities, my_role: m.role };
      // Supabase returns registrations as an ARRAY (one-to-many join)
      // Flatten to object so reg.gst, reg.tds etc work correctly
      if (Array.isArray(entity.registrations)) {
        entity.registrations = entity.registrations[0] || {};
      }
      return entity;
    });
}

async function getEntityFilings(entityId) {
  try {
    const { data, error } = await sb
      .from('filings')
      .select('*')
      .eq('entity_id', entityId)
      .order('due_date', { ascending: true });
    if (error) { console.error('getEntityFilings:', error); return []; }
    return data || [];
  } catch(e) { console.error('getEntityFilings exception:', e); return []; }
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

// Generate deadlines for an entity based on its granular registrations
// Backward compatible: if granular columns missing, falls back to old booleans
function getEntityDeadlines(reg, refDate) {
  const r = reg || {};

  // Backward compatibility: if new granular fields not set yet,
  // derive them from old boolean flags
  const f = {
    income_tax:      r.income_tax !== false,  // always true
    // GST: if no granular set, use old gst flag → default to regular monthly
    gst_regular:     r.gst_regular     || (r.gst && !r.gst_qrmp && !r.gst_composition),
    gst_qrmp:        r.gst_qrmp        || false,
    gst_composition: r.gst_composition || false,
    gst_gstr7:       r.gst_gstr7       || false,
    gst_gstr8:       r.gst_gstr8       || false,
    gst_gstr9:       r.gst_gstr9       || (r.gst || false),
    // TDS: if no granular, use old tds flag → default to general + returns + form16
    tds_general:     r.tds_general     || (r.tds || false),
    tds_salary:      r.tds_salary      || false,
    tcs_collection:  r.tcs_collection  || false,
    tds_returns:     r.tds_returns     || (r.tds || false),
    tds_form16:      r.tds_form16      || (r.tds || false),
    pf:              r.pf   || false,
    esic:            r.esic || false,
    roc:             r.roc  || false,
  };
  const ctx = getFYContext(refDate);
  const yr  = refDate ? refDate.getFullYear() : new Date().getFullYear();
  const mo  = refDate ? refDate.getMonth() + 1 : new Date().getMonth() + 1;
  const isQ = [3,6,9,12].includes(mo);
  const prevMonLabel = new Date(yr, mo-2, 1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const all = [];

  // ── GST Regular (GSTR-1 / GSTR-3B monthly) ────────────────────
  if (f.gst_regular) {
    all.push({ key:`GSTR1_${yr}_${mo}`,  cat:'GST',
      name:`GSTR-1 Outward Supplies (for ${prevMonLabel})`,
      due: new Date(yr,mo-1,11) });
    all.push({ key:`GSTR3B_${yr}_${mo}`, cat:'GST',
      name:`GSTR-3B Summary Return (for ${prevMonLabel})`,
      due: new Date(yr,mo-1,20) });
    if (mo===12) all.push({ key:`GSTR9_${yr}`, cat:'GST',
      name:`GSTR-9 Annual Return ${ctx.prevFY}`,
      due: new Date(yr,11,31) });
  }

  // ── GST QRMP (quarterly filer ≤₹5 Cr) ────────────────────────
  if (f.gst_qrmp) {
    // IFF (monthly)
    all.push({ key:`IFF_${yr}_${mo}`, cat:'GST',
      name:`GSTR-1 / IFF QRMP (for ${prevMonLabel})`,
      due: new Date(yr,mo-1,13) });
    // PMT-06 monthly payment (non quarter-end months)
    if (!isQ) all.push({ key:`PMT06_${yr}_${mo}`, cat:'GST',
      name:`PMT-06 Monthly Tax Payment (for ${new Date(yr,mo-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'})})`,
      due: new Date(yr,mo-1,25) });
    // Quarterly return
    if (isQ) {
      all.push({ key:`GSTR3BQ_${yr}_${mo}`, cat:'GST',
        name:`GSTR-3B Quarterly QRMP — Cat.1 (${ctx.FY} Q)`,
        due: new Date(yr,mo-1,22) });
    }
    if (mo===12) all.push({ key:`GSTR9Q_${yr}`, cat:'GST',
      name:`GSTR-9 Annual Return ${ctx.prevFY}`,
      due: new Date(yr,11,31) });
  }

  // ── GST Composition ───────────────────────────────────────────
  if (f.gst_composition) {
    if (isQ) all.push({ key:`CMP08_${yr}_${mo}`, cat:'GST',
      name:`CMP-08 Composition Tax Payment (Q ending ${prevMonLabel})`,
      due: new Date(yr,mo-1,18) });
    if (mo===4) all.push({ key:`GSTR4_${yr}`, cat:'GST',
      name:`GSTR-4 Composition Annual Return ${ctx.prevFY}`,
      due: new Date(yr,3,30) });
  }

  // ── GSTR-7 (TDS under GST) ────────────────────────────────────
  if (f.gst_gstr7) {
    all.push({ key:`GSTR7_${yr}_${mo}`, cat:'GST',
      name:`GSTR-7 TDS under GST (for ${prevMonLabel})`,
      due: new Date(yr,mo-1,7) });
  }

  // ── GSTR-8 (TCS — e-commerce operators) ──────────────────────
  if (f.gst_gstr8) {
    all.push({ key:`GSTR8_${yr}_${mo}`, cat:'GST',
      name:`GSTR-8 TCS e-Commerce (for ${prevMonLabel})`,
      due: new Date(yr,mo-1,7) });
  }

  // ── Income Tax (always on — PAN mandatory) ────────────────────
  if (f.income_tax) {
    if (mo===6)  all.push({ key:`ADVT1_${yr}`, cat:'Income Tax',
      name:`Advance Tax 1st Instalment 15% (${ctx.FY})`, due: new Date(yr,5,15) });
    if (mo===9)  all.push({ key:`ADVT2_${yr}`, cat:'Income Tax',
      name:`Advance Tax 2nd Instalment 45% (${ctx.FY})`, due: new Date(yr,8,15) });
    if (mo===12) all.push({ key:`ADVT3_${yr}`, cat:'Income Tax',
      name:`Advance Tax 3rd Instalment 75% (${ctx.FY})`, due: new Date(yr,11,15) });
    if (mo===3)  all.push({ key:`ADVT4_${yr}`, cat:'Income Tax',
      name:`Advance Tax Final 100% (${ctx.FY})`, due: new Date(yr,2,15) });
    if (mo===7)  all.push({ key:`ITR_${yr}`, cat:'Income Tax',
      name:`ITR Filing Individuals/HUF (${ctx.AY})`, due: new Date(yr,6,31) });
    if (mo===9)  all.push({ key:`AUDIT_${yr}`, cat:'Income Tax',
      name:`Tax Audit Report 3CA/3CB (${ctx.AY})`, due: new Date(yr,8,30) });
    if (mo===10) all.push({ key:`ITRAUD_${yr}`, cat:'Income Tax',
      name:`ITR Filing Audit Cases (${ctx.AY})`, due: new Date(yr,9,31) });
    if (mo===12) all.push({ key:`ITRREV_${yr}`, cat:'Income Tax',
      name:`Belated/Revised ITR (${ctx.AY})`, due: new Date(yr,11,31) });
  }

  // ── TDS General (194C, 194J, etc.) ───────────────────────────
  if (f.tds_general) {
    // 7th of each month = TDS for previous month (except March)
    if (mo !== 3 && mo !== 4) {
      all.push({ key:`TDS_${yr}_${mo}`, cat:'TDS',
        name:`TDS Deposit (for ${prevMonLabel})`,
        due: new Date(yr,mo-1,7) });
    }
    if (mo === 4) {
      // Feb TDS on 7 Apr
      all.push({ key:`TDS_${yr}_4`, cat:'TDS',
        name:`TDS Deposit (for February ${yr})`,
        due: new Date(yr,3,7) });
      // March TDS special — 30 Apr
      all.push({ key:`TDS_MARCH_${yr}`, cat:'TDS',
        name:`TDS Deposit — March ${yr} (Special — due 30 April)`,
        due: new Date(yr,3,30) });
    }
  }

  // ── TDS Salary (192) ─────────────────────────────────────────
  if (f.tds_salary) {
    if (mo !== 3 && mo !== 4) {
      all.push({ key:`TDS192_${yr}_${mo}`, cat:'TDS',
        name:`TDS on Salary — 192 Deposit (for ${prevMonLabel})`,
        due: new Date(yr,mo-1,7) });
    }
    if (mo === 4) {
      all.push({ key:`TDS192_${yr}_4`, cat:'TDS',
        name:`TDS on Salary — 192 Deposit (for February ${yr})`,
        due: new Date(yr,3,7) });
      all.push({ key:`TDS192_MARCH_${yr}`, cat:'TDS',
        name:`TDS on Salary — 192 March ${yr} (Special — due 30 April)`,
        due: new Date(yr,3,30) });
    }
  }

  // ── TCS Collection (206C) ─────────────────────────────────────
  if (f.tcs_collection) {
    if (mo !== 3 && mo !== 4) {
      all.push({ key:`TCS_${yr}_${mo}`, cat:'TDS',
        name:`TCS Collection Deposit — 206C (for ${prevMonLabel})`,
        due: new Date(yr,mo-1,7) });
    }
    if (mo === 4) {
      all.push({ key:`TCS_MARCH_${yr}`, cat:'TDS',
        name:`TCS Deposit — March ${yr} (Special — due 30 April)`,
        due: new Date(yr,3,30) });
    }
  }

  // ── TDS Quarterly Returns ────────────────────────────────────
  if (f.tds_returns) {
    if (mo===5)  all.push({ key:`TDSR_Q4_${yr}`, cat:'TDS',
      name:`TDS Return Q4 (Jan–Mar ${ctx.fyEnd}) — Form 24Q/26Q`, due: new Date(yr,4,31) });
    if (mo===7)  all.push({ key:`TDSR_Q1_${yr}`, cat:'TDS',
      name:`TDS Return Q1 (Apr–Jun ${ctx.fyStart}) — Form 24Q/26Q`, due: new Date(yr,6,31) });
    if (mo===10) all.push({ key:`TDSR_Q2_${yr}`, cat:'TDS',
      name:`TDS Return Q2 (Jul–Sep ${ctx.fyStart}) — Form 24Q/26Q`, due: new Date(yr,9,31) });
    if (mo===1)  all.push({ key:`TDSR_Q3_${yr}`, cat:'TDS',
      name:`TDS Return Q3 (Oct–Dec ${ctx.fyStart}) — Form 24Q/26Q`, due: new Date(yr,0,31) });
  }

  // ── Form 16 / 16A ────────────────────────────────────────────
  if (f.tds_form16) {
    if (mo===6) all.push({ key:`F16_${yr}`, cat:'TDS',
      name:`Form 16 / 16A Issue to Deductees (${ctx.prevFY})`, due: new Date(yr,5,15) });
  }

  // ── PF ───────────────────────────────────────────────────────
  if (f.pf) {
    all.push({ key:`EPF_${yr}_${mo}`, cat:'PF',
      name:`EPF Monthly Contribution (for ${prevMonLabel})`,
      due: new Date(yr,mo-1,15) });
  }

  // ── ESIC ─────────────────────────────────────────────────────
  if (f.esic) {
    all.push({ key:`ESIC_${yr}_${mo}`, cat:'ESIC',
      name:`ESIC Monthly Contribution (for ${prevMonLabel})`,
      due: new Date(yr,mo-1,15) });
  }

  // ── ROC / MCA ────────────────────────────────────────────────
  if (f.roc) {
    if (mo===6)  all.push({ key:`DPT3_${yr}`, cat:'ROC',
      name:`DPT-3 Return of Deposits (${ctx.prevFY})`, due: new Date(yr,5,30) });
    if (mo===9)  all.push({ key:`DIR3_${yr}`, cat:'ROC',
      name:`DIR-3 KYC Director KYC`, due: new Date(yr,8,30) });
    if (mo===4)  all.push({ key:`MSME1H_${yr}`, cat:'ROC',
      name:`MSME-1 H2 — Outstanding Dues Oct–Mar`, due: new Date(yr,3,30) });
    if (mo===10) all.push({ key:`MSME1H2_${yr}`, cat:'ROC',
      name:`MSME-1 H1 — Outstanding Dues Apr–Sep`, due: new Date(yr,9,31) });
    if (mo===10) all.push({ key:`AOC4_${yr}`, cat:'ROC',
      name:`AOC-4 Financial Statements (${ctx.prevFY})`, due: new Date(yr,9,29) });
    if (mo===11) all.push({ key:`MGT7_${yr}`, cat:'ROC',
      name:`MGT-7 / MGT-7A Annual Return (${ctx.prevFY})`, due: new Date(yr,10,29) });
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


// ── Extension helpers ─────────────────────────────────
// Check if admin has pushed an extension for a specific filing
async function getActiveExtensions() {
  try {
    const { data, error } = await sb.from('extensions')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  } catch { return []; }
}

// Given a filing key and original due date, check if extension applies
function getExtendedDue(filingKey, originalDue, extensions) {
  if (!extensions?.length) return null;
  // Match by filing_key prefix (e.g. 'GSTR3B' matches 'GSTR3B_2026_3')
  const match = extensions.find(ext => {
    const keyMatch = filingKey.startsWith(ext.filing_key) ||
                     ext.filing_key === filingKey ||
                     filingKey.includes(ext.filing_key.replace('_',''));
    const dateMatch = ext.original_due === originalDue ||
                      new Date(ext.original_due).toDateString() === new Date(originalDue).toDateString();
    return keyMatch && dateMatch;
  });
  return match ? match : null;
}

// ── Announcement helpers ─────────────────────────────
async function getActiveAnnouncements(page) {
  const { data } = await sb.from('announcements')
    .select('*')
    .eq('active', true)
    .contains('show_on', [page])
    .order('created_at', { ascending: false });
  return data || [];
}

// ── Notice helpers ────────────────────────────────────
async function getEntityNotices(entityId) {
  try {
    const { data, error } = await sb.from('notices')
      .select('*, assigned_profile:assigned_to(name)')
      .eq('entity_id', entityId)
      .order('response_due_date', { ascending: true });
    if (error) return [];
    return data || [];
  } catch { return []; }
}

function noticeUrgencyClass(responseDue, status) {
  if (['Closed','Appeal Filed'].includes(status)) return 'status-done';
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.round((new Date(responseDue) - today) / 86400000);
  if (diff < 0)  return 'status-overdue';
  if (diff <= 7) return 'status-soon';
  if (diff <= 30)return 'status-near';
  return 'status-future';
}

const AUTHORITY_COLOR = {
  'GST Department':         '#16A34A',
  'Income Tax Department':  '#2563EB',
  'ROC / MCA':              '#DC2626',
  'EPFO':                   '#7C3AED',
  'ESIC':                   '#0891B2',
  'Customs':                '#D97706',
  'State Tax':              '#059669',
  'Other':                  '#64748B',
};

// ── Site content helpers ──────────────────────────────
async function getSiteContent(page, sectionKey) {
  const { data } = await sb.from('site_content')
    .select('*')
    .eq('page', page)
    .eq('section_key', sectionKey)
    .single();
  return data;
}

async function upsertSiteContent(page, sectionKey, title, structured, freeText, userId) {
  const { error } = await sb.from('site_content').upsert({
    page, section_key: sectionKey,
    section_title: title,
    structured: structured || null,
    free_text:   freeText   || null,
    updated_by:  userId,
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'page,section_key' });
  return error;
}

// ── Firm / role helpers ───────────────────────────────

async function getMyFirmRole(userId, entityId) {
  const { data } = await sb.from('entity_members')
    .select('firm_role, role')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .eq('status', 'active')
    .single();
  return data?.firm_role || data?.role || 'owner';
}

async function isPrimaryAdmin(userId) {
  const { data } = await sb.from('entity_members')
    .select('id')
    .in('firm_role', ['primary_admin','secondary_admin'])
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);
  return (data?.length || 0) > 0;
}

async function isStrictPrimaryAdmin(userId) {
  // Only true primary admins — not secondary
  const { data } = await sb.from('entity_members')
    .select('id')
    .eq('firm_role', 'primary_admin')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);
  return (data?.length || 0) > 0;
}

async function promoteToSecondaryAdmin(entityId, userId) {
  // Only primary admin can call this
  const { error } = await sb.from('entity_members')
    .update({ firm_role: 'secondary_admin' })
    .eq('entity_id', entityId)
    .eq('user_id', userId);
  return error;
}

async function demoteToStaff(entityId, userId) {
  const { error } = await sb.from('entity_members')
    .update({ firm_role: 'staff' })
    .eq('entity_id', entityId)
    .eq('user_id', userId);
  return error;
}

async function getFirmClients(adminId) {
  try {
    const { data, error } = await sb.rpc('get_firm_clients', { p_admin_id: adminId });
    if (error) throw error;
    return data || [];
  } catch {
    // Fallback: get entities where user is primary_admin
    const { data } = await sb.from('entity_members')
      .select('entity_id, assigned_staff_id, assigned_staff_name, entities(id,name,type,pan,gstin,tan,email_reminders,registrations(*))')
      .eq('user_id', adminId)
      .eq('firm_role', 'primary_admin')
      .eq('status', 'active');
    return (data || []).map(m => ({
      entity_id: m.entity_id,
      entity_name: m.entities?.name,
      entity_type: m.entities?.type,
      pan: m.entities?.pan,
      gstin: m.entities?.gstin,
      tan: m.entities?.tan,
      staff_id: m.assigned_staff_id,
      staff_name: m.assigned_staff_name,
      ...m.entities?.registrations,
    }));
  }
}

async function getFirmStaff(adminUserId) {
  // SECURITY DEFINER RPC — bypasses RLS (staff rows have user_id ≠ admin uid)
  const { data, error } = await sb.rpc('get_firm_staff', { p_admin_id: adminUserId });
  if (error) { console.error('getFirmStaff:', error); return []; }
  const staff = [];
  const seen  = new Set();
  (data || []).forEach(m => {
    if (!seen.has(m.user_id)) {
      seen.add(m.user_id);
      staff.push({
        id:        m.user_id,
        name:      m.name || 'Unknown',
        firm_role: m.firm_role,
        entityId:  m.entity_id,
      });
    }
  });
  return staff;
}

async function updateClientCompliances(entityId, comps) {
  const { error } = await sb.from('registrations').update({
    gst:             comps.gst,
    income_tax:      true,
    tds:             comps.tds,
    pf:              comps.pf,
    esic:            comps.esic,
    roc:             comps.roc,
    professional_tax:comps.pt || false,
    gst_regular:     comps.gst_regular,
    gst_qrmp:        comps.gst_qrmp,
    gst_composition: comps.gst_composition,
    gst_gstr7:       comps.gst_gstr7 || false,
    gst_gstr8:       comps.gst_gstr8 || false,
    gst_gstr9:       comps.gst_gstr9 || false,
    tds_general:     comps.tds_general,
    tds_salary:      comps.tds_salary,
    tcs_collection:  comps.tcs_collection || false,
    tds_returns:     comps.tds_returns,
    tds_form16:      comps.tds_form16,
  }).eq('entity_id', entityId);
  return error;
}

async function assignStaffToClient(entityId, staffId, staffName) {
  const { error } = await sb.from('entity_members')
    .update({ assigned_staff_id: staffId, assigned_staff_name: staffName })
    .eq('entity_id', entityId)
    .in('firm_role', ['primary_admin','owner']);
  return error;
}

async function deleteClientEntity(entityId, adminUserId) {
  // Only primary_admin can delete
  const role = await getMyFirmRole(adminUserId, entityId);
  if (!['primary_admin','owner'].includes(role)) throw new Error('Not authorised');
  // Delete cascades to entity_members, registrations, filings
  const { error } = await sb.from('entities').delete().eq('id', entityId);
  return error;
}

async function inviteStaffMember(email, adminUserId, adminName) {
  // SECURITY DEFINER RPC v2 — auto-finds admin's firm entity, no entity_ids needed
  const { error } = await sb.rpc('invite_staff', {
    p_email:    email,
    p_admin_id: adminUserId,
  });
  if (error) return [error.message];
  // Send OTP invitation email
  const { error: otpErr } = await sb.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { role: 'staff', invited_by: adminName }
    }
  });
  if (otpErr) console.warn('OTP send warning:', otpErr.message);
  return []; // success
}
