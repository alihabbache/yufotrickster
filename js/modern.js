/* Yufo Trickster: interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Nav: scrolled state, progress bar, back-to-top, floating CTA ---------- */
  var nav = $('#nav'), bar = $('#progress'), floatCta = $('#floatCta');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', y > 24);
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    var contact = $('#contact').getBoundingClientRect();
    var pastHero = y > window.innerHeight * 0.7;
    var atContact = contact.top < window.innerHeight * 0.6;
    floatCta.classList.toggle('show', pastHero && !atContact);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll-spy ---------- */
  var links = $$('.menu a[href^="#"]:not(.btn)');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });

  /* ---------- Reveal on scroll ---------- */
  var revealed = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); revealed.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(function (el, i) {
    // light stagger for siblings
    el.style.setProperty('--d', ((i % 6) * 0.06) + 's');
    revealed.observe(el);
  });

  /* ---------- Hero: counters ---------- */
  function countUp(el) {
    var to = +el.dataset.count, t0 = null, dur = 1600;
    if (reduce) return;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = 0;
    requestAnimationFrame(step);
  }
  var counters = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); counters.unobserve(en.target); } });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { counters.observe(el); });

  /* ---------- Hero: rotating word ---------- */
  var rot = $('#rot');
  var words = ['handstands', 'flexibility', 'backbends', 'splits', 'mobility'];
  if (rot && !reduce) {
    var wi = 0;
    setInterval(function () {
      wi = (wi + 1) % words.length;
      rot.innerHTML = '<span>' + words[wi] + '</span>';
    }, 2200);
  }

  /* ---------- Hero: mouse parallax ---------- */
  var hv = $('#heroVisual');
  if (hv && finePointer && !reduce) {
    var layers = $$('[data-depth]', hv);
    hv.parentElement.addEventListener('mousemove', function (e) {
      var r = hv.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / r.width;
      var y = (e.clientY - (r.top + r.height / 2)) / r.height;
      layers.forEach(function (l) {
        var d = +l.dataset.depth;
        l.style.transform = 'translate3d(' + (x * d * -1) + 'px,' + (y * d * -1) + 'px,0)';
      });
    });
    hv.parentElement.addEventListener('mouseleave', function () {
      layers.forEach(function (l) { l.style.transform = ''; });
    });
  }

  /* ---------- Cards: tilt + spotlight ---------- */
  if (finePointer && !reduce) {
    $$('.tilt').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', px * 100 + '%');
        c.style.setProperty('--my', py * 100 + '%');
        c.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 7) + 'deg) rotateY(' + ((px - 0.5) * 9) + 'deg) translateY(-4px)';
      });
      c.addEventListener('mouseleave', function () { c.style.transform = ''; });
    });
  }

  /* ---------- Moves accordion ---------- */
  var panels = $$('.panel');
  panels.forEach(function (p) {
    function activate() { panels.forEach(function (o) { o.classList.toggle('is-active', o === p); }); }
    p.addEventListener('mouseenter', function () { if (finePointer) activate(); });
    p.addEventListener('click', activate);
    p.addEventListener('focus', activate);
  });

  /* ---------- Portfolio ---------- */
  var DATA = window.PORTFOLIO || [];
  var grid = $('#grid'), filtersEl = $('#filters'), moreBtn = $('#more');
  var PAGE = 12, shown = PAGE, current = 'All';
  // Coaching content first; performance and press last
  var ORDER = ['All', 'Handstand', 'Workshops', 'Tutorials', 'Contortion', 'Photography', 'Breakin', 'Shows & TV', 'Press'];
  DATA = DATA.map(function (d, i) { return { d: d, i: i }; })
    .sort(function (a, b) { return (ORDER.indexOf(a.d.cat) - ORDER.indexOf(b.d.cat)) || (a.i - b.i); })
    .map(function (x) { return x.d; });
  var enc = function (p) { return encodeURI(p); };

  var cats = ['All'].concat(ORDER.slice(1).filter(function (c) { return DATA.some(function (d) { return d.cat === c; }); }));
  filtersEl.innerHTML = cats.map(function (c) {
    var n = c === 'All' ? DATA.length : DATA.filter(function (d) { return d.cat === c; }).length;
    return '<button class="chip" type="button" data-cat="' + c + '" aria-pressed="' + (c === 'All') + '">' + c + '<small>' + n + '</small></button>';
  }).join('');

  function visible() { return DATA.filter(function (d) { return current === 'All' || d.cat === current; }); }

  function tileHtml(d, idx, i) {
    var isVideo = d.type === 'video';
    var label = d.title + (d.sub ? ', ' + d.sub : '');
    return '<button class="tile" type="button" data-i="' + idx + '" style="--d:' + (i % PAGE) * 0.04 + 's" aria-label="Open ' + label.replace(/"/g, '&quot;') + '">' +
      '<img loading="lazy" src="' + enc(d.thumb) + '" alt="">' +
      '<span class="tag">' + d.cat + '</span>' +
      (isVideo ? '<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></span>'
               : '<span class="count">' + d.images.length + ' photos</span>') +
      '<span class="meta"><h3>' + d.title + '</h3><p>' + d.sub + '</p></span></button>';
  }

  var list = [];
  function render(reset) {
    list = visible();
    if (reset) shown = PAGE;
    grid.innerHTML = list.slice(0, shown).map(function (d, i) { return tileHtml(d, DATA.indexOf(d), i); }).join('');
    var rest = list.length - shown;
    moreBtn.hidden = rest <= 0;
    moreBtn.textContent = 'Load more (' + Math.max(rest, 0) + ')';
  }
  filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    current = b.dataset.cat;
    $$('.chip', filtersEl).forEach(function (c) { c.setAttribute('aria-pressed', c === b); });
    render(true);
  });
  moreBtn.addEventListener('click', function () {
    var from = shown; shown += PAGE;
    list = visible();
    grid.insertAdjacentHTML('beforeend', list.slice(from, shown).map(function (d, i) { return tileHtml(d, DATA.indexOf(d), i); }).join(''));
    var rest = list.length - shown;
    moreBtn.hidden = rest <= 0;
    moreBtn.textContent = 'Load more (' + Math.max(rest, 0) + ')';
  });
  render(true);

  /* ---------- Lightbox (native <dialog>) ---------- */
  var lb = $('#lb'), stage = $('#lbStage'), lbTitle = $('#lbTitle'), lbSub = $('#lbSub'), lbCount = $('#lbCount');
  var pos = 0, sub = 0;

  function show() {
    var d = list[pos];
    stage.innerHTML = '';
    lbTitle.textContent = d.title;
    lbSub.textContent = d.desc && d.desc !== d.title ? d.desc : d.sub;
    if (d.type === 'video') {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + d.yt + '?autoplay=1&rel=0';
      f.title = d.title + (d.sub ? ': ' + d.sub : '');
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      stage.appendChild(f);
      lbCount.textContent = (pos + 1) + ' / ' + list.length;
    } else {
      var im = new Image();
      im.src = enc(d.images[sub]);
      im.alt = d.title + ', photo ' + (sub + 1);
      stage.appendChild(im);
      lbCount.textContent = (sub + 1) + ' / ' + d.images.length;
    }
  }
  function open(idx) {
    list = visible();
    pos = Math.max(0, list.indexOf(DATA[idx])); sub = 0;
    show();
    if (!lb.open) lb.showModal();
    document.body.style.overflow = 'hidden';
  }
  function close() { stage.innerHTML = ''; lb.close(); }
  function step(dir) {
    var d = list[pos];
    if (d.type === 'gallery' && d.images.length > 1) {
      sub = (sub + dir + d.images.length) % d.images.length;
    } else {
      pos = (pos + dir + list.length) % list.length; sub = 0;
    }
    show();
  }
  grid.addEventListener('click', function (e) {
    var t = e.target.closest('.tile'); if (t) open(+t.dataset.i);
  });
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', function () { step(-1); });
  $('#lbNext').addEventListener('click', function () { step(1); });
  $('#lbBook').addEventListener('click', close);
  lb.addEventListener('close', function () { stage.innerHTML = ''; document.body.style.overflow = ''; });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  // swipe on touch
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });

  /* ---------- Experience tabs ---------- */
  var tabs = $$('.tabs [role="tab"]');
  function selectTab(t) {
    tabs.forEach(function (o) {
      var on = o === t;
      o.setAttribute('aria-selected', on);
      o.tabIndex = on ? 0 : -1;
      $('#' + o.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!n) return;
      var nt = tabs[(i + n + tabs.length) % tabs.length]; selectTab(nt); nt.focus();
    });
  });

  /* ---------- Testimonial slider ---------- */
  var slides = $$('.slide'), dotsEl = $('#dots'), si = 0, timer;
  dotsEl.innerHTML = slides.map(function (_, i) {
    return '<button type="button" role="tab" aria-label="Review ' + (i + 1) + '" aria-selected="' + (i === 0) + '"></button>';
  }).join('');
  var dots = $$('button', dotsEl);
  function go(n) {
    si = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === si); s.setAttribute('aria-hidden', i !== si); });
    dots.forEach(function (d, i) { d.setAttribute('aria-selected', i === si); });
  }
  function auto() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(si + 1); }, 7000); }
  $('#prev').addEventListener('click', function () { go(si - 1); auto(); });
  $('#next').addEventListener('click', function () { go(si + 1); auto(); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); auto(); }); });
  $('#slider').addEventListener('mouseenter', function () { clearInterval(timer); });
  $('#slider').addEventListener('mouseleave', auto);
  go(0); auto();

  /* ---------- Misc ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
