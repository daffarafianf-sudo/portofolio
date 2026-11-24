/* Portofolio: membaca data dari data.js (window.PORTFOLIO_DATA) lalu menampilkannya.
   Untuk mengubah isi, tampilan, atau warna, cukup edit data.js. */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (!window.PORTFOLIO_DATA) {
    document.getElementById('app').innerHTML = '<p style="padding:2rem;font:16px system-ui">Data tidak ditemukan. Pastikan berkas <b>data.js</b> ada di folder yang sama dengan index.html.</p>';
    return;
  }
  const state = window.PORTFOLIO_DATA;
  const TK = 'pf-theme';
  let filter = 'Semua';
  let cvOpen = false;
  let cvView = 'pdf';
  let toastTimer = 0;

  /* ---------- data bawaan agar halaman tidak error bila ada bagian yang kosong ---------- */
  ['about', 'facts', 'skills', 'projects', 'experience', 'education'].forEach((k) => { if (!Array.isArray(state[k])) state[k] = []; });
  state.profile = state.profile || {};
  state.cv = state.cv || {};
  state.contact = state.contact || {};
  state.contact.links = state.contact.links || [];
  state.settings = Object.assign({ accent: 0, font: 'modern', radius: 'sedang', show: {} }, state.settings || {});
  state.settings.show = state.settings.show || {};

  /* ---------- pilihan tampilan ---------- */
  const ACC = [
    { n: 'Kobalt', l: '#2540EC', d: '#8D9BFF', li: '#FFFFFF', di: '#0D1120' },
    { n: 'Jingga', l: '#C73A17', d: '#FF8F6B', li: '#FFFFFF', di: '#1A0D08' },
    { n: 'Hutan', l: '#0B7A58', d: '#4FD3A5', li: '#FFFFFF', di: '#07150F' },
    { n: 'Magenta', l: '#B8206F', d: '#FF86C0', li: '#FFFFFF', di: '#1A0812' },
    { n: 'Ungu', l: '#6A3BE0', d: '#B49CFF', li: '#FFFFFF', di: '#0F0A1F' },
    { n: 'Tinta', l: '#141B2D', d: '#E6EAF5', li: '#FFFFFF', di: '#0D1120' }
  ];
  const FONTS = {
    modern: { d: "'Bricolage Grotesque'", b: "'DM Sans'" },
    editorial: { d: "'Fraunces'", b: "'Inter'" },
    teknis: { d: "'Space Grotesk'", b: "'Inter'" }
  };
  const RADII = { tajam: '3px', sedang: '14px', bulat: '28px' };
  const SECS = [['tentang', 'Tentang'], ['karya', 'Karya'], ['pengalaman', 'Pengalaman'], ['cv', 'CV'], ['kontak', 'Kontak']];

  /* ---------- fungsi kecil ---------- */
  const on = (id) => state.settings.show[id] !== false;
  const tagsOf = (s) => (Array.isArray(s) ? s : String(s || '').split(',')).map((x) => String(x).trim()).filter(Boolean);
  const isHttps = (u) => /^https:\/\/\S+/.test(String(u || ''));
  const initials = () => String(state.profile.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const T = (v, tag, cls) => (v ? `<${tag}${cls ? ` class="${cls}"` : ''}>${esc(v)}</${tag}>` : '');
  const chips = (s) => { const t = tagsOf(s); return t.length ? `<ul class="chips">${t.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''; };
  function fmtDate(d) {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d || ''; }
  }

  /* ---------- tema ---------- */
  function applyTheme() {
    const s = state.settings;
    const a = ACC[s.accent] || ACC[0];
    const f = FONTS[s.font] || FONTS.modern;
    const r = RADII[s.radius] || RADII.sedang;
    let st = document.getElementById('rt-style');
    if (!st) { st = document.createElement('style'); st.id = 'rt-style'; document.head.appendChild(st); }
    st.textContent = ':root{--accent:' + a.l + ';--accent-ink:' + a.li + ';--f-display:' + f.d + ',system-ui,sans-serif;--f-body:' + f.b + ',system-ui,sans-serif;--r:' + r + '}'
      + '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--accent:' + a.d + ';--accent-ink:' + a.di + '}}'
      + ':root[data-theme="dark"]{--accent:' + a.d + ';--accent-ink:' + a.di + '}';
  }
  const themePref = () => { try { return localStorage.getItem(TK) || ''; } catch (e) { return ''; } };
  function setTheme(v) {
    const h = document.documentElement;
    if (v) h.setAttribute('data-theme', v); else h.removeAttribute('data-theme');
    try { v ? localStorage.setItem(TK, v) : localStorage.removeItem(TK); } catch (e) { /* abaikan */ }
  }
  const themeLabel = () => ({ '': 'otomatis', light: 'terang', dark: 'gelap' }[themePref()] || 'otomatis');

  /* ---------- bagian halaman ---------- */
  function sec(id, label, inner) {
    if (!on(id)) return '';
    return `<section class="sec" id="${id}"><div class="sec-label"><h2>${label}</h2></div><div class="sec-body">${inner}</div></section>`;
  }

  function nav() {
    const items = SECS.filter(([id]) => on(id));
    return `<nav class="nav" aria-label="Navigasi utama"><a class="brand" href="#top" data-go="top"><span class="mark" aria-hidden="true">${esc(initials())}</span><span class="brand-t">${esc(state.profile.name || '')}</span></a>
      <div class="nav-r"><div class="nav-links">${items.map(([id, l]) => `<a href="#${id}" data-go="${id}">${l}</a>`).join('')}</div>
      <button class="ic" type="button" data-act="theme" aria-label="Ganti tema, sekarang ${themeLabel()}" title="Tema: ${themeLabel()}">◐</button></div></nav>`;
  }

  function hero() {
    const p = state.profile;
    const photo = p.photo
      ? `<img src="${esc(p.photo)}" alt="Foto ${esc(p.name || '')}">`
      : `<div class="mono-ph" aria-hidden="true">${esc(initials())}</div>`;
    return `<header class="hero" id="top"><div class="hero-main">
      <div class="hero-meta">${T(p.status, 'span', 'chip')}${T(p.location, 'span', 'mono')}</div>
      ${T(p.name, 'h1', 'name')}${T(p.role, 'p', 'role')}${T(p.tagline, 'p', 'lead')}
      <div class="cta">${on('karya') ? '<a class="btn primary" href="#karya" data-go="karya">Lihat karya</a>' : ''}<button class="btn" type="button" data-act="cv-open">Lihat CV</button></div>
    </div><figure class="photo">${photo}</figure></header>`;
  }

  function about() {
    const s = state;
    const paras = s.about.map((t) => `<p class="para">${esc(t)}</p>`).join('');
    const facts = s.facts.length ? `<dl class="facts">${s.facts.map((f) => `<div class="fact"><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join('')}</dl>` : '';
    const skills = s.skills.length ? `<div class="skills">${s.skills.map((g) => `<div><h4>${esc(g.group)}</h4>${chips(g.items)}</div>`).join('')}</div>` : '';
    return sec('tentang', 'Tentang', `<div class="stack">${paras}</div>${facts}${skills}`);
  }

  function projects() {
    const all = [...new Set(state.projects.flatMap((p) => tagsOf(p.tags)))];
    if (filter !== 'Semua' && !all.includes(filter)) filter = 'Semua';
    const list = state.projects.filter((p) => filter === 'Semua' || tagsOf(p.tags).includes(filter));
    const filt = all.length > 1
      ? `<div class="filters" role="group" aria-label="Saring karya">${['Semua', ...all].map((t) => `<button type="button" class="fchip${t === filter ? ' on' : ''}" data-act="filter" data-t="${esc(t)}" aria-pressed="${t === filter}">${esc(t)}</button>`).join('')}</div>`
      : '';
    const cards = list.map((p) => {
      const i = state.projects.indexOf(p);
      const meta = [p.year, p.role].filter(Boolean).join(' · ');
      return `<article class="card"><div class="cover" style="--k:${12 + (i * 9) % 22}%">${p.img
        ? `<img src="${esc(p.img)}" alt="">`
        : `<span class="cover-ph" aria-hidden="true">${esc((p.title || '?').trim().charAt(0).toUpperCase())}</span>`}</div>
        <div class="card-body">${meta ? `<div class="meta"><span>${esc(meta)}</span></div>` : ''}${T(p.title, 'h3')}${T(p.desc, 'p', 'desc')}${chips(p.tags)}
        ${isHttps(p.link) ? `<a class="lnk" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">Lihat proyek ↗</a>` : ''}</div></article>`;
    }).join('');
    return sec('karya', 'Karya', `${filt}<div class="grid">${cards}</div>`);
  }

  function experience() {
    const s = state;
    const x = s.experience.map((e) => `<div class="xrow"><div class="mono period">${esc(e.period)}</div><div><h3>${esc(e.role)}</h3>${T(e.org, 'p', 'org')}${T(e.desc, 'p', 'desc')}</div></div>`).join('');
    const ed = s.education.map((e) => `<div class="xrow"><div class="mono period">${esc(e.period)}</div><div><h3>${esc(e.degree)}</h3>${T(e.school, 'p', 'org')}${T(e.note, 'p', 'desc')}</div></div>`).join('');
    return sec('pengalaman', 'Pengalaman', `<div>${x}</div>${ed ? `<h3 class="sub">Pendidikan</h3><div>${ed}</div>` : ''}`);
  }

  function pdfButtons(sm) {
    const f = state.cv.file;
    if (!f) return '';
    const c = sm ? 'btn sm' : 'btn';
    return `<a class="${c}" href="${esc(f)}" target="_blank" rel="noopener">Buka PDF ↗</a><a class="${c}" href="${esc(f)}" download>Unduh PDF</a>`;
  }

  function cvSec() {
    return sec('cv', 'CV', `<div class="cvcard"><div><h3>Curriculum Vitae</h3>${T(state.cv.note, 'p')}</div><div class="cv-actions"><button type="button" class="btn primary" data-act="cv-open">Lihat CV</button>${pdfButtons(false)}</div></div>`);
  }

  function contact() {
    const c = state.contact;
    const row = (label, v, key) => (v ? `<div class="crow"><span class="mono">${esc(label)}</span><span class="val">${esc(v)}</span><button type="button" class="btn sm" data-act="copy" data-k="${key}">Salin</button></div>` : '');
    const links = c.links.map((l) => {
      if (!l.label && !l.url) return '';
      return `<div class="crow"><span class="mono">Tautan</span>${isHttps(l.url)
        ? `<a class="val" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label || l.url)} ↗</a>`
        : `<span class="val">${esc(l.label)} ${esc(l.url)}</span>`}<span></span></div>`;
    }).join('');
    return sec('kontak', 'Kontak', `${T(c.cta, 'h2', 'big')}<div>${row('Email', c.email, 'email')}${row(c.phoneLabel || 'Telepon', c.phone, 'phone')}${links}</div>`);
  }

  function foot() {
    return `<footer class="foot"><span>© ${new Date().getFullYear()} ${esc(state.profile.name || '')}</span>${state.updated ? `<span class="mono">Diperbarui ${esc(fmtDate(state.updated))}</span>` : ''}</footer>`;
  }

  /* ---------- CV ---------- */
  function cvBody() {
    const s = state, p = s.profile, c = s.contact;
    const bits = [c.email, c.phone, p.location].filter(Boolean)
      .concat((c.links || []).filter((l) => isHttps(l.url)).map((l) => l.url.replace(/^https:\/\//, '').replace(/\/$/, '')));
    const exp = s.experience.map((x) => `<div class="cv-row"><div class="cv-p">${esc(x.period)}</div><div><strong>${esc(x.role)}</strong>${x.org ? `, ${esc(x.org)}` : ''}${x.desc ? `<p>${esc(x.desc)}</p>` : ''}</div></div>`).join('');
    const edu = s.education.map((x) => `<div class="cv-row"><div class="cv-p">${esc(x.period)}</div><div><strong>${esc(x.degree)}</strong>${x.school ? `, ${esc(x.school)}` : ''}${x.note ? `<p>${esc(x.note)}</p>` : ''}</div></div>`).join('');
    const sk = s.skills.map((g) => `<div class="cv-row"><div class="cv-p">${esc(g.group)}</div><div>${esc(tagsOf(g.items).join(', '))}</div></div>`).join('');
    const pr = s.projects.slice(0, 4).map((x) => `<div class="cv-row"><div class="cv-p">${esc(x.year)}</div><div><strong>${esc(x.title)}</strong>${x.role ? `, ${esc(x.role)}` : ''}</div></div>`).join('');
    const blk = (t, b) => (b ? `<section class="cv-sec"><h3>${t}</h3>${b}</section>` : '');
    return `<h1 class="cv-h1">${esc(p.name)}</h1><p class="cv-sub">${esc(p.role)}</p><p class="cv-contact">${bits.map(esc).join(' · ')}</p>`
      + blk('Profil', s.about[0] ? `<p>${esc(s.about[0])}</p>` : '') + blk('Pengalaman', exp) + blk('Pendidikan', edu) + blk('Keahlian', sk) + blk('Karya pilihan', pr);
  }

  function cvText() {
    const s = state, p = s.profile, c = s.contact, L = [];
    L.push(p.name || '', p.role || '', [c.email, c.phone, p.location].filter(Boolean).join(' | '), '');
    if (s.about[0]) L.push('PROFIL', s.about[0], '');
    if (s.experience.length) { L.push('PENGALAMAN'); s.experience.forEach((x) => L.push(`${x.period}  ${x.role}${x.org ? ', ' + x.org : ''}`)); L.push(''); }
    if (s.education.length) { L.push('PENDIDIKAN'); s.education.forEach((x) => { L.push(`${x.period}  ${x.degree}${x.school ? ', ' + x.school : ''}`); if (x.note) L.push('  ' + x.note); }); L.push(''); }
    if (s.skills.length) { L.push('KEAHLIAN'); s.skills.forEach((g) => L.push(`${g.group}: ${tagsOf(g.items).join(', ')}`)); }
    return L.join('\n');
  }

  function cvModal() {
    if (!cvOpen) return '';
    const f = state.cv.file;
    const showPdf = f && cvView === 'pdf';
    const toggle = f ? `<button type="button" class="btn sm" data-act="cv-view" data-v="${showPdf ? 'ringkas' : 'pdf'}">${showPdf ? 'Lihat ringkasan' : 'Lihat PDF'}</button>` : '';
    const body = showPdf
      ? `<div class="pdfwrap"><iframe class="pdfframe" src="${esc(f)}#view=FitH" title="CV dalam PDF"></iframe><p class="pdfnote">PDF tidak tampil? Pakai tombol Buka PDF atau Unduh PDF di atas.</p></div>`
      : `<div class="paper">${cvBody()}</div>`;
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="Curriculum Vitae"><div class="modal-bar"><span class="mono">Curriculum Vitae</span><div class="modal-btns">${toggle}${pdfButtons(true)}<button type="button" class="btn sm" data-act="copy" data-k="cv">Salin teks</button><button type="button" class="btn sm" id="cv-close" data-act="cv-close">Tutup</button></div></div>${body}</div>`;
  }

  /* ---------- tampilan ---------- */
  function render() {
    applyTheme();
    document.title = (state.profile.name ? state.profile.name + ' | ' : '') + 'Portofolio';
    document.documentElement.style.overflow = cvOpen ? 'hidden' : '';
    $('#app').innerHTML = `<div class="page">${nav()}<main>${hero()}${about()}${projects()}${experience()}${cvSec()}${contact()}</main>${foot()}</div>${cvModal()}`;
    if (cvOpen) { const b = $('#cv-close'); if (b) b.focus(); }
  }

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  async function copy(text, ok) {
    try {
      await navigator.clipboard.writeText(text);
      toast(ok || 'Tersalin');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select();
      let done = false;
      try { done = document.execCommand('copy'); } catch (x) { /* abaikan */ }
      ta.remove();
      toast(done ? (ok || 'Tersalin') : 'Tidak bisa menyalin otomatis. Blok teksnya lalu salin manual.');
    }
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- interaksi ---------- */
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); scrollToId(go.dataset.go); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    switch (b.dataset.act) {
      case 'theme': { const cur = themePref(); setTheme(cur === '' ? 'light' : cur === 'light' ? 'dark' : ''); render(); break; }
      case 'cv-open': cvOpen = true; cvView = state.cv.file ? 'pdf' : 'ringkas'; render(); break;
      case 'cv-view': cvView = b.dataset.v; render(); break;
      case 'cv-close': cvOpen = false; render(); break;
      case 'filter': filter = b.dataset.t; render(); break;
      case 'copy': {
        const k = b.dataset.k;
        copy(k === 'cv' ? cvText() : k === 'email' ? state.contact.email : state.contact.phone, k === 'cv' ? 'Teks CV tersalin' : 'Tersalin');
        break;
      }
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cvOpen) { cvOpen = false; render(); } });

  setTheme(themePref());
  render();
})();
