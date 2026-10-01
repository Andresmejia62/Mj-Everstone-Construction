/* MJ Everstone Construction  */
(function () {
  'use strict';

  var EMAIL = 'mjeverstoneconstruction@gmail.com';
  var WA = '18023637148';
  var lang = 'en';

  var T = {
    open:    { es: 'Abierto ahora', en: 'Open now' },
    closed:  { es: 'Cerrado ahora', en: 'Closed now' },
    today:   { es: 'Hoy', en: 'Today' },
    subject: { es: 'Solicitud de estimado', en: 'Estimate request' },
    intro:   { es: 'Hola MJ Everstone, quiero un estimado gratis.', en: 'Hi MJ Everstone, I’d like a free estimate.' },
    spaces:  { es: 'Espacio(s)', en: 'Space(s)' },
    state:   { es: 'Estado actual', en: 'Current state' },
    details: { es: 'Detalles', en: 'Details' },
    start:   { es: 'Inicio deseado', en: 'Desired start' },
    name:    { es: 'Nombre', en: 'Name' },
    phone:   { es: 'Teléfono', en: 'Phone' },
    city:    { es: 'Ciudad / Estado', en: 'City / State' },
    menuOpen:  { es: 'Abrir menú', en: 'Open menu' },
    menuClose: { es: 'Cerrar menú', en: 'Close menu' }
  };
  function t(k) { return (T[k] && T[k][lang]) || ''; }

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn('[mj] ' + name + ' failed', e); }
  }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  /* ---------- Idioma ES / EN ---------- */
  var LANG_KEY = 'mj-lang-v2'; // inglés por defecto; ES es la alternativa
  var langListeners = [];
  function applyLang(next) {
    lang = next === 'es' ? 'es' : 'en';
    document.documentElement.lang = lang;
    $$('[data-es]').forEach(function (el) {
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.innerHTML);
      el.innerHTML = el.getAttribute(lang === 'es' ? 'data-es' : 'data-en');
    });
    [['data-es-ph', 'placeholder'], ['data-es-label', 'aria-label'], ['data-es-alt', 'alt']].forEach(function (pair) {
      var src = pair[0], attr = pair[1], keep = 'data-en-' + attr;
      $$('[' + src + ']').forEach(function (el) {
        if (!el.hasAttribute(keep)) el.setAttribute(keep, el.getAttribute(attr) || '');
        el.setAttribute(attr, el.getAttribute(lang === 'es' ? src : keep));
      });
    });
    var toggle = $('.lang-toggle');
    if (toggle) toggle.setAttribute('aria-label', lang === 'en' ? 'Cambiar idioma a español' : 'Change language to English');
    langListeners.forEach(function (fn) { safe(fn, 'lang listener'); });
  }
  function initLang() {
    if (store(LANG_KEY) === 'es') applyLang('es');
    var btn = $('.lang-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyLang(lang === 'en' ? 'es' : 'en');
      store(LANG_KEY, lang);
    });
  }

  /* ---------- Header + menú móvil + barra inferior ---------- */
  function initNav() {
    var header = $('.site-header');
    var nav = $('#main-nav');
    var toggle = $('.menu-toggle');
    var bar = $('.mobile-bar');
    var quote = $('#cotizar');
    var quoteVisible = false;

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-scrolled', y > 10);
      if (bar) bar.classList.toggle('is-visible', y > 520 && !quoteVisible);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (quote && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        quoteVisible = entries[0].isIntersecting;
        onScroll();
      }, { threshold: 0.02 }).observe(quote);
    }

    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? t('menuClose') : t('menuOpen'));
    }
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

    // Enlace activo según la sección visible
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.main-nav a[href^="#"]:not(.btn)');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var ids = ['servicios', 'proceso', 'proyectos', 'nosotros'];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-current'); });
        var id = en.target.id === 'metodologia' ? 'proceso' : en.target.id;
        if (map[id]) map[id].classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.concat(['metodologia']).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Reveal on scroll (con red de seguridad) ---------- */
  function initReveal() {
    var items = $$('.reveal');
    function showAll() { items.forEach(function (el) { el.classList.add('in'); }); }
    if (!('IntersectionObserver' in window)) { showAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(showAll, 6000);
  }

  /* ---------- Comparador antes / después ---------- */
  function initCompare() {
    $$('[data-compare]').forEach(function (el) {
      var dragging = false;
      function set(p) {
        p = Math.max(0, Math.min(100, p));
        el.style.setProperty('--pos', p + '%');
        el.setAttribute('aria-valuenow', Math.round(p));
      }
      function fromEvent(e) {
        var r = el.getBoundingClientRect();
        return ((e.clientX - r.left) / r.width) * 100;
      }
      function touch() { el.classList.add('is-touched'); el.classList.remove('is-animating'); }

      el.addEventListener('pointerdown', function (e) {
        dragging = true; touch(); el.classList.add('is-dragging');
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        set(fromEvent(e));
      });
      el.addEventListener('pointermove', function (e) { if (dragging) set(fromEvent(e)); });
      function end() { dragging = false; el.classList.remove('is-dragging'); }
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('keydown', function (e) {
        var cur = parseFloat(el.getAttribute('aria-valuenow')) || 50;
        var step = e.shiftKey ? 20 : 5;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(cur - step); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(cur + step); }
        else if (e.key === 'Home') { set(0); }
        else if (e.key === 'End') { set(100); }
        else return;
        e.preventDefault(); touch();
      });

      // Pequeña demostración la primera vez que aparece
      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        if (el.classList.contains('is-touched')) return;
        el.classList.add('is-animating');
        var seq = [[400, 28], [1300, 72], [2200, 50]];
        seq.forEach(function (s) {
          setTimeout(function () { if (!el.classList.contains('is-touched')) set(s[1]); }, s[0]);
        });
        setTimeout(function () { el.classList.remove('is-animating'); }, 3200);
      }, { threshold: 0.05, rootMargin: '-20% 0px -20% 0px' });
      io.observe(el);
    });
  }

  /* ---------- Video ---------- */
  function initVideo() {
    $$('.video-wrap').forEach(function (wrap) {
      var v = $('video', wrap), b = $('.video-play', wrap);
      if (!v || !b) return;
      b.addEventListener('click', function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
      v.addEventListener('play', function () { wrap.classList.add('is-playing'); });
      v.addEventListener('pause', function () { wrap.classList.remove('is-playing'); });
      v.addEventListener('ended', function () { wrap.classList.remove('is-playing'); });
    });
  }

  /* ---------- Galería: filtros + lightbox ---------- */
  function initGallery() {
    var items = $$('.g-item');
    if (!items.length) return;
    var state = { cat: 'all', phase: 'all' };
    var empty = $('.gallery-empty');
    var more = $('[data-more]'), moreCount = $('[data-more-count]');
    var LIMIT = 12, expanded = false;
    if (more) more.addEventListener('click', function () { expanded = true; apply(); });

    function labelItems() {
      items.forEach(function (it) {
        var cap = $('figcaption', it), btn = $('button', it), img = $('img', it);
        var txt = cap ? cap.textContent : '';
        if (img) img.alt = txt;
        if (btn) btn.setAttribute('aria-label', txt);
      });
    }
    labelItems();
    langListeners.push(labelItems);

    function apply() {
      var shown = 0;
      items.forEach(function (it) {
        var ok = (state.cat === 'all' || it.dataset.cat === state.cat) &&
                 (state.phase === 'all' || it.dataset.phase === state.phase);
        it.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
        it.classList.toggle('is-capped', ok && !expanded && shown > LIMIT);
      });
      if (empty) empty.hidden = shown > 0;
      if (more) {
        more.hidden = expanded || shown <= LIMIT;
        if (moreCount) moreCount.textContent = '(' + shown + ')';
      }
    }
    function bindGroup(sel, key) {
      var btns = $$(sel + ' button');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
          state[key] = b.dataset[key];
          apply();
        });
      });
    }
    bindGroup('.tabs', 'cat');
    bindGroup('.phase', 'phase');
    apply();

    // Lightbox
    var lb = $('#lightbox');
    if (!lb) return;
    var lbImg = $('img', lb), lbCap = $('figcaption', lb);
    var list = [], idx = 0;
    function show(i) {
      idx = (i + list.length) % list.length;
      var it = list[idx], img = $('img', it);
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = $('figcaption', it).textContent;
    }
    function open(it) {
      list = items.filter(function (x) { return !x.classList.contains('is-hidden') && !x.classList.contains('is-capped'); });
      show(list.indexOf(it));
      if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
    }
    lb.addEventListener('close', function () { document.body.style.overflow = ''; });
    items.forEach(function (it) { $('button', it).addEventListener('click', function () { open(it); }); });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Línea de progreso de la metodología ---------- */
  function initSteps() {
    var steps = $('[data-steps]');
    if (!steps) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / Math.max(r.height, 1);
      steps.style.setProperty('--progress', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Horario: abierto ahora (hora de Nueva York) ---------- */
  function initHours() {
    var badge = $('[data-open-status]');
    var rows = $$('.hours-table tr[data-days]');
    var sched = { 0: [8, 13], 1: [7, 20], 2: [7, 20], 3: [7, 20], 4: [7, 20], 5: [7, 20], 6: [7, 16] };
    function render() {
      var day, hour, min;
      try {
        var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
        var get = function (type) { for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value; };
        day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
        hour = parseInt(get('hour'), 10) % 24; min = parseInt(get('minute'), 10);
      } catch (e) {
        var d = new Date(); day = d.getDay(); hour = d.getHours(); min = d.getMinutes();
      }
      var now = hour + min / 60, s = sched[day];
      var isOpen = s && now >= s[0] && now < s[1];
      if (badge) {
        badge.textContent = isOpen ? t('open') : t('closed');
        badge.className = 'open-status ' + (isOpen ? 'is-open' : 'is-closed');
      }
      rows.forEach(function (r) {
        var today = r.getAttribute('data-days').split(',').indexOf(String(day)) > -1;
        r.classList.toggle('is-today', today);
        var th = $('th', r);
        if (th) th.setAttribute('data-today', t('today'));
      });
    }
    render();
    langListeners.push(render);
    setInterval(render, 60000);
  }

  /* ---------- Wizard de cotización ---------- */
  function initWizard() {
    var form = $('#wizard');
    if (!form) return;
    var steps = $$('.wz-step', form);
    var bar = $('.wz-bar', form), cur = $('[data-wz-current]', form);
    var prev = $('[data-wz-prev]', form), next = $('[data-wz-next]', form), submit = $('[data-wz-submit]', form);
    var done = $('.wz-done', form);
    var step = 1;

    function go(n) {
      step = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.dataset.step === n); });
      bar.style.width = (n / 3 * 100) + '%';
      cur.textContent = n;
      prev.hidden = n === 1;
      next.hidden = n === 3;
      submit.hidden = n !== 3;
      $$('.wz-error', form).forEach(function (e) { e.hidden = true; });
    }
    function err(n, show) { var e = $('[data-error="' + n + '"]', form); if (e) e.hidden = !show; }
    function valOf(input) { return lang === 'es' && input.dataset.esValue ? input.dataset.esValue : input.value; }

    function validate(n) {
      if (n === 1) {
        var ok1 = $$('input[name="espacio"]:checked', form).length > 0;
        err(1, !ok1); return ok1;
      }
      if (n === 2) {
        var ok2 = !!$('input[name="estado"]:checked', form);
        err(2, !ok2); return ok2;
      }
      var ok3 = true;
      ['nombre', 'telefono', 'ciudad'].forEach(function (name) {
        var f = form.elements[name];
        var bad = !f.value.trim();
        f.classList.toggle('is-invalid', bad);
        if (bad) ok3 = false;
      });
      err(3, !ok3); return ok3;
    }

    function buildBody() {
      var el = form.elements;
      var spaces = $$('input[name="espacio"]:checked', form).map(valOf).join(', ');
      var estado = $('input[name="estado"]:checked', form);
      var sel = el.inicio.options[el.inicio.selectedIndex];
      var lines = [
        t('intro'), '',
        t('spaces') + ': ' + spaces,
        t('state') + ': ' + (estado ? valOf(estado) : ''),
      ];
      if (el.detalle.value.trim()) lines.push(t('details') + ': ' + el.detalle.value.trim());
      lines.push(t('start') + ': ' + (sel ? sel.textContent.trim() : ''), '',
        t('name') + ': ' + el.nombre.value.trim(),
        t('phone') + ': ' + el.telefono.value.trim());
      if (el.email.value.trim()) lines.push('Email: ' + el.email.value.trim());
      lines.push(t('city') + ': ' + el.ciudad.value.trim());
      return lines.join('\n');
    }

    function finish() {
      if (!validate(3)) return;
      var body = buildBody();
      var subject = t('subject') + ' – ' + form.elements.nombre.value.trim();
      var mailto = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      $('[data-done-mail]', form).href = mailto;
      $('[data-done-wa]', form).href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(body);
      steps.forEach(function (s) { s.classList.remove('is-active'); });
      done.hidden = false;
      form.classList.add('is-done');
      window.location.href = mailto;
    }

    next.addEventListener('click', function () { if (validate(step)) go(step + 1); });
    prev.addEventListener('click', function () { go(step - 1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (step < 3) { if (validate(step)) go(step + 1); }
      else finish();
    });
    form.addEventListener('change', function () { if (step < 3) err(step, false); });
    form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('is-invalid'); });
    $('[data-wz-restart]', form).addEventListener('click', function () {
      form.reset(); done.hidden = true; form.classList.remove('is-done'); go(1);
    });
    go(1);
  }

  function initYear() {
    var y = $('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  function boot() {
    safe(initLang, 'lang');
    safe(initNav, 'nav');
    safe(initReveal, 'reveal');
    safe(initCompare, 'compare');
    safe(initVideo, 'video');
    safe(initGallery, 'gallery');
    safe(initSteps, 'steps');
    safe(initHours, 'hours');
    safe(initWizard, 'wizard');
    safe(initYear, 'year');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
