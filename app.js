/* DokterWay – shared script (vanilla JS). Data is kept in localStorage (demo-grade, no backend). */
(() => {
'use strict';

/* ---------- Data ---------- */
const CLINICS = [
  { id:'kemang', name:'Klinik DokterWay – Kemang', area:'Jakarta Selatan',
    address:'Kemang Point Lt.2, Jl. Kemang Raya No.3, RT.4/RW.3, Kec. Mampang Prpt, Jakarta Selatan – 12730',
    landmark:'Kemang Point, 2nd floor', hours:'Open until 6:00 PM' },
  { id:'bintaro', name:'Klinik DokterWay – Bintaro', area:'Tangerang',
    address:'No 5, Jl. Akses Graha Raya, Blok FB/G, Sudimara Pinang, Tangerang – 15145',
    landmark:'Near Rukan Grand Fortune', hours:'Please confirm hours via WhatsApp' },
  { id:'bekasi', name:'Klinik DokterWay – Bekasi', area:'Bekasi',
    address:'Ruby Commercial Blok TD No 16, Summarecon Bekasi, Kel. Marga Mulya, Bekasi – 17142',
    landmark:'Summarecon Bekasi', hours:'Please confirm hours via WhatsApp' }
];
const PHONES = [
  { label:'0815-4964-4948', tel:'081549644948', wa:'6281549644948' },
  { label:'0831-6091-1633', tel:'083160911633', wa:'6283160911633' }
];
const TREATMENTS = ['Free Consultation','Facial Filler','Botox','Threadlift (Benang)','Face Contouring','Skin Booster','HIFU Face','Korean LHALA Peel','Skincare Consultation'];
const PROMOS = [
  { img:'assets/promo-flash-sale.jpg', title:'Flash Sale – Skin Booster', sub:'Pro Hydro, Messo, Salmon DNA, Skin Fill Blue and more.', end:'2026-08-31', treatment:'Skin Booster', alt:'Flash sale skin booster promo price list' },
  { img:'assets/promo-hifu-messo.jpg', title:'HIFU Face + Messo', sub:'HIFU Face 160 shoot with Messo 2 CC premium.', end:'2026-08-31', treatment:'HIFU Face', alt:'HIFU Face and Messo promo' },
  { img:'assets/promo-lhala-peel.jpg', title:'NEW: Korean LHALA Peel', sub:'A new peel treatment — ask us about the special offer.', end:null, treatment:'Korean LHALA Peel', alt:'New Korean LHALA Peel treatment special offer' }
];
const SKIN_POSTERS = [
  { img:'assets/skincare-am-routine.jpg', alt:'AM routine for anti-aging: Deep Cleans Facial Wash, Serum Brightening Collagen and BB Cream' },
  { img:'assets/skincare-glowing-serum.jpg', alt:'What makes Glowing Serum work: licorice extract, peptides and vitamin C' }
];
const PRODUCTS = [
  { ico:'01', name:'Deep Cleans Facial Wash', text:'Step 1 of the AM anti-aging routine: a clean start for your skin.' },
  { ico:'02', name:'Serum Brightening Collagen', text:'Step 2 of the AM routine, for brighter-looking, healthy skin.' },
  { ico:'03', name:'BB Cream', text:'Step 3: multi-action BB cream for beautiful, healthy-looking skin.' },
  { ico:'04', name:'Glowing Serum', text:'Licorice extract, peptides and vitamin C — a triple-action serum for brighter, healthier-looking skin.' }
];
const SLOTS = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const LS = { users:'dw_users', session:'dw_session', res:'dw_reservations', rev:'dw_reviews' };

/* ---------- Helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { toast('Storage unavailable in this browser mode'); } };
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const clinicById = id => CLINICS.find(c => c.id === id);
const mapsSearch = a => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
const mapsEmbed = a => 'https://www.google.com/maps?q=' + encodeURIComponent(a) + '&output=embed';
const waLink = (n, text) => `https://wa.me/${n}?text=${encodeURIComponent(text || 'Hello DokterWay, I would like a free consultation.')}`;
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const fmtDate = iso => new Date(iso + 'T00:00').toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
}
function setMsg(el, type, text) { el.className = 'msg ' + type; el.textContent = text; }

/* ---------- Auth (client-side demo) ---------- */
async function hashPw(pw, salt) {
  if (window.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381; for (const ch of salt + pw) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return 'x' + h; // fallback
}
const users = () => load(LS.users, []);
const currentUser = () => { const id = load(LS.session, null); return users().find(u => u.id === id) || null; };
async function signUp({ name, email, phone, password }) {
  email = email.trim().toLowerCase();
  if (users().some(u => u.email === email)) throw new Error('This email is already registered. Please sign in.');
  const salt = uid(); const u = { id: uid(), name: name.trim(), email, phone: phone.trim(), salt, hash: await hashPw(password, salt), created: Date.now() };
  save(LS.users, [...users(), u]); save(LS.session, u.id); return u;
}
async function signIn(email, password) {
  const u = users().find(x => x.email === email.trim().toLowerCase());
  if (!u || u.hash !== await hashPw(password, u.salt)) throw new Error('Incorrect email or password.');
  save(LS.session, u.id); return u;
}
const signOut = () => { localStorage.removeItem(LS.session); location.href = 'index.html'; };
function requireLogin() {
  if (currentUser()) return true;
  location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return false;
}

/* ---------- Greeting ---------- */
function greetingWord() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
function drawGreeting() {
  const el = $('#greet-text'); if (!el) return;
  const u = currentUser(), name = u ? u.name.trim().split(/\s+/)[0] : 'Guest';
  const text = `${greetingWord()}, ${name}`;
  if (el.textContent !== text) el.textContent = text;
}

/* ---------- Smooth scroll reveal ---------- */
function initReveal() {
  document.documentElement.classList.add('js');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.reveal').forEach(e => e.classList.add('in')); return;
  }
  const targets = $$('.hero .container > *, .page-hero .container > *, .section .center, .section .split > *, .grid > *, .form-card, .cta-band, .loc-list > *');
  const seen = new Set();
  targets.forEach(el => {
    if (seen.has(el)) return; seen.add(el);
    el.classList.add('reveal');
    const sib = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--d', Math.min(sib, 6) * 0.08 + 's');
  });
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target; io.unobserve(el); el.classList.add('in');
    setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); }, 1500); // hand hover effects back
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
}

/* ---------- Layout ---------- */
const NAV = [['index.html','Home'],['about.html','About Us'],['index.html#promo','Promo'],['locations.html','Locations'],['reservation.html','Reservation'],['reviews.html','Reviews'],['contact.html','Contact']];
const MARK = '<img class="logo-img" src="assets/logo.png" alt="DR.WAY">';

function renderLayout() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const u = currentUser();
  const links = NAV.map(([h, t]) => `<a href="${h}" class="${h === page ? 'active' : ''}">${t}</a>`).join('');
  const mAuth = u ? '<a class="m-only" href="#" id="logout-m">Sign out</a>'
    : '<a class="m-only" href="login.html">Sign in</a><a class="m-only" href="login.html?tab=signup">Sign up</a>';
  const auth = u
    ? `<button class="btn ghost sm" id="logout">Sign out</button>`
    : `<a class="btn ghost sm" href="login.html">Sign in</a><a class="btn sm" href="login.html?tab=signup">Sign up</a>`;
  const h = $('#site-header');
  if (h) {
    h.className = 'site-header';
    h.innerHTML = `<div class="greet-bar"><div class="container"><span class="greet-text" id="greet-text"></span>
        <span class="hide-sm">${u ? 'Welcome back to DokterWay' : '<a href="login.html?tab=signup">Create an account</a> to book &amp; review'}</span></div></div>
      <div class="container nav">
      <a class="brand" href="index.html" aria-label="DokterWay home">${MARK}</a>
      <nav class="nav-links" id="navlinks" aria-label="Main">${links}${mAuth}</nav>
      <div class="nav-auth">${auth}<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span></button></div></div>`;
    const nav = $('#navlinks'), burger = $('#burger');
    const setOpen = o => { nav.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
    burger.onclick = () => setOpen(!nav.classList.contains('open'));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', e => { if (!e.target.closest('.nav')) setOpen(false); });
    $('#logout')?.addEventListener('click', signOut);
    $('#logout-m')?.addEventListener('click', e => { e.preventDefault(); signOut(); });
    drawGreeting(); setInterval(drawGreeting, 60000);
  }
  const f = $('#site-footer');
  if (f) {
    f.className = 'site-footer';
    f.innerHTML = `<div class="container"><div class="foot">
      <div><div class="brand foot-logo">${MARK}</div>
        <p style="margin-top:.8rem;font-size:.92rem">Aesthetic dermatology clinic specialising in facial filler, botox, threadlift and face contouring.</p></div>
      <div><h4>Explore</h4><ul>${NAV.slice(0,4).map(([h,t])=>`<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      <div><h4>Clients</h4><ul><li><a href="reservation.html">Book a visit</a></li><li><a href="index.html#skincare">Skincare</a></li><li><a href="reviews.html">Ratings &amp; reviews</a></li><li><a href="login.html">Sign in / Sign up</a></li><li><a href="contact.html">Contact</a></li></ul></div>
      <div><h4>Free consultation</h4><ul>${PHONES.map(p=>`<li><a href="tel:${p.tel}">${p.label}</a></li>`).join('')}
        <li><a href="https://msha.ke/dokterway" target="_blank" rel="noopener">Promo &amp; link-in-bio ↗</a></li></ul></div></div>
      <div class="copy"><span>© ${new Date().getFullYear()} Klinik DokterWay. All rights reserved.</span><span>Syarat dan ketentuan berlaku.</span></div></div>`;
  }
  if (!$('.wa-float')) {
    const a = document.createElement('a'); a.className = 'wa-float'; a.href = waLink(PHONES[0].wa); a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', 'Chat on WhatsApp'); a.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M9 9.5c.3 2.3 2.2 4.2 5 5l1.3-1.3-1.8-1-.8.7c-.9-.4-1.6-1.1-2-2l.7-.8-1-1.8L9 9.5Z"/></svg>'; document.body.appendChild(a);
  }
}

/* ---------- Shared pieces ---------- */
function clinicOptions(sel, withAll) {
  sel.innerHTML = (withAll ? '<option value="">All clinics</option>' : '<option value="">Select clinic…</option>') +
    CLINICS.map(c => `<option value="${c.id}">${esc(c.name.replace('Klinik DokterWay – ',''))} – ${esc(c.area)}</option>`).join('');
}
const reviews = () => load(LS.rev, []);
function avg(list) { return list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0; }

/* ---------- Lightbox ---------- */
function openLightbox(src, alt) {
  const box = document.createElement('div'); box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = `<button class="lb-close" aria-label="Close">×</button><img src="${esc(src)}" alt="${esc(alt)}">`;
  const close = () => { box.classList.remove('show'); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); setTimeout(() => box.remove(), 400); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  box.addEventListener('click', e => { if (e.target !== $('img', box)) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(box); document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => box.classList.add('show')); $('.lb-close', box).focus();
}

/* ---------- Page: Home ---------- */
function initHome() {
  const pg = $('#promo-grid');
  if (pg) {
    const today = todayISO();
    pg.innerHTML = PROMOS.map((p, i) => {
      const ended = p.end && today > p.end;
      const tag = ended ? '<span class="ribbon ended">Promo ended</span>' : p.end ? `<span class="ribbon">Valid until ${fmtDate(p.end).replace(/^\w+, /, '')}</span>` : '<span class="ribbon">New</span>';
      const wa = waLink(PHONES[0].wa, ended ? `Hello DokterWay, is there a current promo for ${p.treatment}?` : `Hello DokterWay, I'm interested in the promo: ${p.title}.`);
      return `<article class="promo-card ${ended ? 'is-ended' : ''}">
        <button class="promo-img" type="button" data-i="${i}" aria-label="View ${esc(p.title)} poster full size">${tag}<img src="${p.img}" alt="${esc(p.alt)}" loading="lazy"></button>
        <div class="promo-body"><h3>${esc(p.title)}</h3><p>${esc(p.sub)}</p>
          <div class="actions">${ended ? '' : `<a class="btn sm" href="reservation.html?treatment=${encodeURIComponent(p.treatment)}">Book this</a>`}
          <a class="btn ${ended ? '' : 'ghost'} sm" href="${wa}" target="_blank" rel="noopener">${ended ? 'Ask for current promo' : 'Ask on WhatsApp'}</a></div></div></article>`;
    }).join('');
    pg.addEventListener('click', e => { const b = e.target.closest('.promo-img'); if (b) { const p = PROMOS[+b.dataset.i]; openLightbox(p.img, p.alt); } });
  }
  const sp = $('#skin-posters');
  if (sp) {
    sp.innerHTML = SKIN_POSTERS.map((p, i) => `<button class="skin-img" type="button" data-i="${i}" aria-label="View poster full size"><img src="${p.img}" alt="${esc(p.alt)}" loading="lazy"></button>`).join('');
    sp.addEventListener('click', e => { const b = e.target.closest('.skin-img'); if (b) { const p = SKIN_POSTERS[+b.dataset.i]; openLightbox(p.img, p.alt); } });
  }
  const pr = $('#skin-products');
  if (pr) pr.innerHTML = PRODUCTS.map(p => `<article class="card"><div class="ico">${p.ico}</div><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p>
    <p style="margin-top:1rem"><a href="${waLink(PHONES[0].wa, `Hello DokterWay, I'd like to ask about ${p.name}.`)}" target="_blank" rel="noopener">Ask on WhatsApp →</a></p></article>`).join('');
  const box = $('#home-reviews'); if (!box) return;
  const list = reviews().slice(-3).reverse();
  box.innerHTML = list.length ? list.map(r => `<article class="card review"><div class="stars">${stars(r.rating)}</div><p>${esc(r.comment)}</p><small>${esc(r.name)} · ${esc(r.treatment)}</small></article>`).join('')
    : `<div class="card empty" style="grid-column:1/-1">No reviews yet — <a href="reviews.html">be the first to share your experience</a>.</div>`;
  const loc = $('#home-locs');
  if (loc) loc.innerHTML = CLINICS.map(c => `<article class="card"><span class="tag">${esc(c.area)}</span><h3 style="margin-top:.7rem">${esc(c.name.replace('Klinik DokterWay – ',''))}</h3><p>${esc(c.address)}</p><div style="margin-top:1rem"><a class="btn ghost sm" href="locations.html?clinic=${c.id}">View clinic</a></div></article>`).join('');
}

/* ---------- Page: Locations ---------- */
function initLocations() {
  const list = $('#loc-list'); if (!list) return;
  const q = $('#loc-q'), chipsBox = $('#loc-chips'), map = $('#loc-map');
  let area = 'All', selected = new URLSearchParams(location.search).get('clinic') || CLINICS[0].id;
  const areas = ['All', ...new Set(CLINICS.map(c => c.area))];
  chipsBox.innerHTML = areas.map(a => `<button type="button" class="chip ${a === area ? 'on' : ''}" data-a="${esc(a)}">${esc(a)}</button>`).join('');
  function draw() {
    const term = q.value.trim().toLowerCase();
    const res = CLINICS.filter(c => (area === 'All' || c.area === area) &&
      (!term || [c.name, c.area, c.address, c.landmark].join(' ').toLowerCase().includes(term)));
    $('#loc-count').textContent = `${res.length} clinic${res.length === 1 ? '' : 's'} found`;
    list.innerHTML = res.length ? res.map(c => `<article class="card loc ${c.id === selected ? 'sel' : ''}" data-id="${c.id}">
      <span class="tag">${esc(c.area)}</span><h3 style="margin-top:.6rem">${esc(c.name)}</h3>
      <p class="meta"><strong>Address:</strong> ${esc(c.address)}</p><p class="meta"><strong>Landmark:</strong> ${esc(c.landmark)}</p><p class="meta"><strong>Hours:</strong> ${esc(c.hours)}</p>
      <div class="actions"><a class="btn sm" href="${mapsSearch(c.name + ' ' + c.address)}" target="_blank" rel="noopener">Get directions</a>
      <a class="btn ghost sm" href="reservation.html?clinic=${c.id}">Book here</a>
      <a class="btn ghost sm" href="tel:${PHONES[0].tel}">Call</a></div></article>`).join('')
      : '<div class="card empty">No clinic matches your search. Try “Kemang”, “Bintaro” or “Bekasi”.</div>';
    const c = clinicById(selected); if (c) { const src = mapsEmbed(c.name + ' ' + c.address); if (map.dataset.src !== src) { map.src = src; map.dataset.src = src; } }
  }
  q.addEventListener('input', draw);
  chipsBox.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; area = b.dataset.a; $$('.chip', chipsBox).forEach(x => x.classList.toggle('on', x === b)); draw(); });
  list.addEventListener('click', e => { const el = e.target.closest('.loc'); if (el && !e.target.closest('a')) { selected = el.dataset.id; draw(); } });
  draw();
}

/* ---------- Page: Contact ---------- */
function initContact() {
  const f = $('#contact-form'); if (!f) return;
  clinicOptions($('#c-clinic'));
  const u = currentUser(); if (u) { f.name.value = u.name; f.phone.value = u.phone || ''; }
  f.addEventListener('submit', e => {
    e.preventDefault();
    const clinic = clinicById(f.clinic.value);
    const text = `Hello DokterWay, I'm ${f.name.value} (${f.phone.value}).` + (clinic ? ` Clinic: ${clinic.name}.` : '') + `\n${f.message.value}`;
    window.open(waLink(PHONES[0].wa, text), '_blank', 'noopener');
    toast('Opening WhatsApp with your message…'); f.message.value = '';
  });
}

/* ---------- Page: Login ---------- */
function initLogin() {
  const box = $('#auth-box'); if (!box) return;
  const params = new URLSearchParams(location.search), next = params.get('next') || 'reservation.html';
  if (currentUser()) { location.replace(next); return; }
  const tabs = $$('.tabs button'), forms = { login: $('#login-form'), signup: $('#signup-form') };
  const show = t => { tabs.forEach(b => b.classList.toggle('on', b.dataset.t === t)); Object.entries(forms).forEach(([k, f]) => f.hidden = k !== t); };
  tabs.forEach(b => b.onclick = () => show(b.dataset.t)); show(params.get('tab') === 'signup' ? 'signup' : 'login');
  forms.login.addEventListener('submit', async e => {
    e.preventDefault(); const m = $('.msg', forms.login);
    try { await signIn(forms.login.email.value, forms.login.password.value); location.href = next; } catch (err) { setMsg(m, 'err', err.message); }
  });
  forms.signup.addEventListener('submit', async e => {
    e.preventDefault(); const f = forms.signup, m = $('.msg', f);
    if (f.password.value.length < 8) return setMsg(m, 'err', 'Password must be at least 8 characters.');
    if (f.password.value !== f.confirm.value) return setMsg(m, 'err', 'Passwords do not match.');
    try { await signUp({ name: f.name.value, email: f.email.value, phone: f.phone.value, password: f.password.value }); location.href = next; } catch (err) { setMsg(m, 'err', err.message); }
  });
}

/* ---------- Page: Reservation ---------- */
function initReservation() {
  const f = $('#res-form'); if (!f) return;
  if (!requireLogin()) return;
  const u = currentUser(), params = new URLSearchParams(location.search);
  clinicOptions(f.clinic);
  f.treatment.innerHTML = TREATMENTS.map(t => `<option>${t}</option>`).join('');
  f.name.value = u.name; f.phone.value = u.phone || '';
  f.date.min = todayISO(); f.date.value = f.date.min;
  if (params.get('clinic') && clinicById(params.get('clinic'))) f.clinic.value = params.get('clinic');
  if (params.get('treatment')) f.treatment.value = params.get('treatment');
  let slot = '';
  const all = () => load(LS.res, []);
  const slotsBox = $('#slots');
  function drawSlots() {
    const taken = new Set(all().filter(r => r.clinic === f.clinic.value && r.date === f.date.value && r.status !== 'Cancelled').map(r => r.time));
    const now = new Date(), isToday = f.date.value === todayISO();
    slotsBox.innerHTML = SLOTS.map(t => {
      const past = isToday && +t.slice(0, 2) <= now.getHours();
      return `<button type="button" class="slot ${t === slot ? 'on' : ''}" data-t="${t}" ${(taken.has(t) || past) ? 'disabled' : ''}>${t}</button>`;
    }).join('');
    if (slot && $(`.slot[data-t="${slot}"]`, slotsBox)?.disabled) slot = '';
  }
  slotsBox.addEventListener('click', e => { const b = e.target.closest('.slot'); if (!b || b.disabled) return; slot = b.dataset.t; drawSlots(); });
  f.clinic.addEventListener('change', drawSlots); f.date.addEventListener('change', drawSlots); drawSlots();

  function drawMine() {
    const mine = all().filter(r => r.userId === u.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    $('#my-res').innerHTML = mine.length ? mine.map(r => `<div class="card res"><div><strong>${esc(r.treatment)}</strong> <span class="st" style="${r.status === 'Cancelled' ? 'color:#b4552d;background:#fdeceb' : ''}">${esc(r.status)}</span>
      <div class="hint">${fmtDate(r.date)} · ${esc(r.time)} · ${esc(clinicById(r.clinic)?.name.replace('Klinik DokterWay – ', '') || '')}</div></div>
      ${r.status !== 'Cancelled' ? `<button class="btn ghost sm" data-cancel="${r.id}">Cancel</button>` : ''}</div>`).join('')
      : '<div class="card empty">You have no reservations yet.</div>';
  }
  $('#my-res').addEventListener('click', e => {
    const id = e.target.dataset.cancel; if (!id) return;
    save(LS.res, all().map(r => r.id === id ? { ...r, status: 'Cancelled' } : r)); drawMine(); drawSlots(); toast('Reservation cancelled');
  });
  const msg = $('.msg', f);
  f.addEventListener('submit', e => {
    e.preventDefault();
    if (!f.clinic.value) return setMsg(msg, 'err', 'Please choose a clinic.');
    if (!slot) return setMsg(msg, 'err', 'Please choose an available time slot.');
    if (all().some(r => r.clinic === f.clinic.value && r.date === f.date.value && r.time === slot && r.status !== 'Cancelled')) { drawSlots(); return setMsg(msg, 'err', 'That slot was just taken. Please pick another.'); }
    const r = { id: uid(), userId: u.id, name: f.name.value.trim(), phone: f.phone.value.trim(), clinic: f.clinic.value, treatment: f.treatment.value, date: f.date.value, time: slot, notes: f.notes.value.trim(), status: 'Requested', created: Date.now() };
    save(LS.res, [...all(), r]); slot = ''; f.notes.value = ''; drawSlots(); drawMine();
    setMsg(msg, 'ok', 'Reservation request saved! Tap below to send it to the clinic on WhatsApp so the team can confirm.');
    const c = clinicById(r.clinic), wa = $('#res-wa');
    wa.href = waLink(PHONES[0].wa, `Hello DokterWay, I'd like to confirm my reservation:\nName: ${r.name}\nPhone: ${r.phone}\nClinic: ${c.name}\nTreatment: ${r.treatment}\nDate: ${fmtDate(r.date)} at ${r.time}\nNotes: ${r.notes || '-'}`);
    wa.hidden = false;
  });
  drawMine();
}

/* ---------- Page: Reviews ---------- */
function initReviews() {
  const listBox = $('#rev-list'); if (!listBox) return;
  const u = currentUser(), f = $('#rev-form');
  clinicOptions($('#rv-clinic'), true); clinicOptions(f.clinic);
  f.treatment.innerHTML = TREATMENTS.filter(t => t !== 'Free Consultation').map(t => `<option>${t}</option>`).join('');
  let rating = 0;
  const starBox = $('#star-input');
  starBox.innerHTML = [1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('');
  const paint = n => $$('button', starBox).forEach((b, i) => b.classList.toggle('on', i < n));
  starBox.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { rating = +b.dataset.n; paint(rating); } });
  starBox.addEventListener('mouseover', e => { const b = e.target.closest('button'); if (b) paint(+b.dataset.n); });
  starBox.addEventListener('mouseleave', () => paint(rating));

  const gate = $('#rev-gate');
  if (!u) { f.hidden = true; gate.hidden = false; } else { gate.hidden = true; }

  const filter = $('#rv-clinic'), sortSel = $('#rv-sort');
  function draw() {
    const all = reviews();
    const list = all.filter(r => !filter.value || r.clinic === filter.value);
    const a = avg(list);
    $('#avg').textContent = list.length ? a.toFixed(1) : '–';
    $('#avg-stars').textContent = stars(Math.round(a));
    $('#avg-count').textContent = `${list.length} review${list.length === 1 ? '' : 's'}`;
    $('#bars').innerHTML = [5, 4, 3, 2, 1].map(n => { const c = list.filter(r => r.rating === n).length, p = list.length ? c / list.length * 100 : 0; return `<div class="bar"><span>${n} ★</span><i><b style="width:${p}%"></b></i><span>${c}</span></div>`; }).join('');
    const sorted = [...list].sort((x, y) => sortSel.value === 'high' ? y.rating - x.rating : sortSel.value === 'low' ? x.rating - y.rating : y.created - x.created);
    listBox.innerHTML = sorted.length ? sorted.map(r => `<article class="card review"><header><div><span class="who">${esc(r.name)}</span> <small>· ${esc(r.treatment)} · ${esc(clinicById(r.clinic)?.name.replace('Klinik DokterWay – ', '') || '')}</small></div><span class="stars">${stars(r.rating)}</span></header>
      <p>${esc(r.comment)}</p><small>${new Date(r.created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
      ${u && r.userId === u.id ? `<div><button class="btn ghost sm" data-del="${r.id}">Delete my review</button></div>` : ''}</article>`).join('')
      : '<div class="card empty">No reviews yet. Treated at DokterWay? Share your experience!</div>';
  }
  filter.addEventListener('change', draw); sortSel.addEventListener('change', draw);
  listBox.addEventListener('click', e => { const id = e.target.dataset.del; if (!id) return; save(LS.rev, reviews().filter(r => r.id !== id)); draw(); toast('Review deleted'); });
  f.addEventListener('submit', e => {
    e.preventDefault(); const m = $('.msg', f);
    if (!rating) return setMsg(m, 'err', 'Please select a star rating.');
    if (!f.clinic.value) return setMsg(m, 'err', 'Please choose the clinic you visited.');
    if (f.comment.value.trim().length < 10) return setMsg(m, 'err', 'Please write at least 10 characters.');
    save(LS.rev, [...reviews(), { id: uid(), userId: u.id, name: u.name, clinic: f.clinic.value, treatment: f.treatment.value, rating, comment: f.comment.value.trim().slice(0, 800), created: Date.now() }]);
    f.comment.value = ''; rating = 0; paint(0); setMsg(m, 'ok', 'Thank you for your review!'); draw();
  });
  draw();
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  ({ home: initHome, locations: initLocations, contact: initContact, login: initLogin, reservation: initReservation, reviews: initReviews })[document.body.dataset.page]?.();
  initReveal();
});
window.DW = { PHONES, CLINICS };
})();
