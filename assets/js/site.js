/* Florin Troscolan portfolio: small progressive enhancements, no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Mobile menu */
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.mainnav');
  if (btn && nav) {
    var setMenu = function (open, refocus) {
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
      else if (refocus) btn.focus();
    };
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true', false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a') && nav.classList.contains('is-open')) setMenu(false, false); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.mainnav') && !e.target.closest('.menu-btn')) setMenu(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
    });
    // focus leaving the open menu (Tab past the last link) closes it
    nav.addEventListener('focusout', function (e) {
      if (nav.classList.contains('is-open') && e.relatedTarget && !nav.contains(e.relatedTarget) && e.relatedTarget !== btn) setMenu(false, false);
    });
  }

  /* Work mega-menu: desktop only; hover with a small delay, focus/keyboard, Esc closes */
  var mli = document.querySelector('.has-mega'), mega = document.getElementById('mega');
  if (mli && mega) {
    var wl = mli.querySelector('.work-link');
    var wide = window.matchMedia('(min-width: 900px)');
    var finePtr = window.matchMedia('(hover: hover) and (pointer: fine)');
    var tOpen, tClose, skipFocus = false;
    var items = function () { return $$('a', mega); };
    var isOpen = function () { return mega.classList.contains('is-open'); };
    var openM = function () {
      clearTimeout(tClose);
      if (!wide.matches || isOpen()) return;
      mega.hidden = false;
      requestAnimationFrame(function () { mega.classList.add('is-open'); });
      wl.setAttribute('aria-expanded', 'true');
    };
    var closeM = function (refocus) {
      clearTimeout(tOpen);
      if (!isOpen() && mega.hidden) return;
      mega.classList.remove('is-open');
      wl.setAttribute('aria-expanded', 'false');
      setTimeout(function () { if (!isOpen()) mega.hidden = true; }, 200);
      if (refocus) { skipFocus = true; wl.focus(); }
    };
    mli.addEventListener('mouseenter', function () { if (!finePtr.matches) return; clearTimeout(tClose); tOpen = setTimeout(openM, 120); });
    mli.addEventListener('mouseleave', function () { clearTimeout(tOpen); tClose = setTimeout(function () { closeM(false); }, 240); });
    mega.addEventListener('mouseenter', function () { clearTimeout(tClose); });
    mega.addEventListener('mouseleave', function () { tClose = setTimeout(function () { closeM(false); }, 240); });
    wl.addEventListener('focus', function () { if (skipFocus) { skipFocus = false; return; } openM(); });
    wl.addEventListener('keydown', function (e) {
      if (!wide.matches) return;
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && isOpen())) { e.preventDefault(); openM(); var f = items()[0]; if (f) f.focus(); }
      if (e.key === 'Escape') closeM(true);
    });
    mega.addEventListener('keydown', function (e) {
      var list = items(), i = list.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); closeM(true); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (i <= 0) wl.focus(); else list[i - 1].focus(); }
      else if (e.key === 'Tab' && !e.shiftKey && i === list.length - 1) {          // leave the panel to the next nav item
        e.preventDefault(); closeM(false); var nxt = mli.nextElementSibling && mli.nextElementSibling.querySelector('a'); if (nxt) nxt.focus();
      } else if (e.key === 'Tab' && e.shiftKey && i === 0) { e.preventDefault(); wl.focus(); }
    });
    document.addEventListener('focusin', function (e) { if (isOpen() && !mli.contains(e.target) && !mega.contains(e.target)) closeM(false); });
    document.addEventListener('click', function (e) { if (isOpen() && !mli.contains(e.target) && !mega.contains(e.target)) closeM(false); });
  }

  /* Pause the hero vignette when it is off screen */
  var vg = document.querySelector('.vg');
  if (vg && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { vg.classList.toggle('is-paused', !e.isIntersecting); }); }).observe(vg);
  }

  /* Reveal on scroll, 60ms stagger inside a group */
  var rv = $$('.rv');
  rv.forEach(function (el) {
    var p = el.parentElement, sib = p ? $$(':scope > .rv', p) : [];
    var i = sib.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 60 + 'ms');
  });
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    // Never leave content hidden (e.g. tall elements, print, anchors)
    window.addEventListener('beforeprint', function () { rv.forEach(function (el) { el.classList.add('in'); }); });
  }

  /* Count-up, once, final value already in the HTML */
  var nums = $$('[data-count]');
  if (!reduce && nums.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null;
        if (!(end > 1)) return;
        function step(t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / 900), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
          el.textContent = v + suf;
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* Reading progress (case pages) */
  var bar = document.querySelector('.progress span');
  if (bar && !reduce) {
    var ticking = false;
    var upd = function () {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.setProperty('--p', max > 0 ? (h.scrollTop / max).toFixed(4) : 0);
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* Scrollspy TOC */
  var toc = document.querySelector('.toc');
  if (toc) {
    var links = $$('a', toc), count = toc.querySelector('.toc-count');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var setActive = function (id) {
      var a = map[id]; if (!a || a.hasAttribute('aria-current')) return;
      links.forEach(function (l) { l.removeAttribute('aria-current'); });
      a.setAttribute('aria-current', 'true');
      if (count) count.textContent = String(links.indexOf(a) + 1).padStart(2, '0') + ' / ' + String(links.length).padStart(2, '0');
      var ol = a.closest('ol');
      if (ol && ol.scrollWidth > ol.clientWidth) {
        ol.scrollTo({ left: a.parentElement.offsetLeft - ol.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    var lockUntil = 0;
    links.forEach(function (a) { a.addEventListener('click', function () { setActive(a.getAttribute('href').slice(1)); lockUntil = Date.now() + 900; }); });
    var secs = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var spyTick = false;
    var spy = function () {
      spyTick = false;
      if (Date.now() < lockUntil) return;
      var tb = toc.getBoundingClientRect(), barH = 64;
      var line = barH + 80 + (getComputedStyle(toc).display === 'flex' ? tb.height : 0), cur = secs[0];
      secs.forEach(function (s) { if (s.getBoundingClientRect().top <= line) cur = s; });
      if (cur) setActive(cur.id);
    };
    window.addEventListener('scroll', function () { if (!spyTick) { spyTick = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  /* Decision details: collapsed on phones/tablets, open on desktop */
  var mq = window.matchMedia('(min-width: 1024px)');
  var syncDetails = function () { $$('.dec-more').forEach(function (d) { d.open = mq.matches; }); };
  syncDetails();
  if (mq.addEventListener) mq.addEventListener('change', syncDetails);

  /* Copy email */
  $$('.copy-btn').forEach(function (b) {
    var label = b.querySelector('.copy-label'), status = b.parentElement.querySelector('[data-copy-status]'), timer;
    b.addEventListener('click', function () {
      var val = b.dataset.copy;
      var done = function () {
        b.classList.add('is-copied'); label.textContent = 'Copied';
        if (status) status.textContent = 'Email address copied to clipboard';
        clearTimeout(timer);
        timer = setTimeout(function () { b.classList.remove('is-copied'); label.textContent = 'Copy email'; if (status) status.textContent = ''; }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(val).then(done, function () { window.location.href = 'mailto:' + val; });
      } else {
        var ta = document.createElement('textarea'); ta.value = val; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { window.location.href = 'mailto:' + val; }
        document.body.removeChild(ta);
      }
    });
  });

  /* Work index: cursor-following preview (fine pointers only) */
  var prev = document.querySelector('.cursor-preview');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
  if (prev && fine.matches && !reduce) {
    var tx = 0, ty = 0, x = 0, y = 0, raf = null, on = false;
    var loop = function () {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      var px = x + 24, py = y - 76;
      if (px + 320 > window.innerWidth - 16) px = x - 24 - 320;
      py = Math.max(72, Math.min(py, window.innerHeight - 200 - 16));
      prev.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
      raf = on || Math.abs(tx - x) > .5 ? requestAnimationFrame(loop) : null;
    };
    $$('.wrow a').forEach(function (a) {
      a.addEventListener('mouseenter', function (e) {
        prev.src = a.dataset.preview; on = true; prev.classList.add('is-on');
        if (!raf) { x = tx = e.clientX; y = ty = e.clientY; raf = requestAnimationFrame(loop); }
      });
      a.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      a.addEventListener('mouseleave', function () { on = false; prev.classList.remove('is-on'); });
    });
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 800); };
    idle(function () { $$('.wrow a').forEach(function (a) { var i = new Image(); i.src = a.dataset.preview; }); });
  }

  /* Lightbox for figures (falls back to opening the image) */
  var dlg = document.querySelector('.lightbox');
  if (dlg && typeof dlg.showModal === 'function') {
    var dimg = dlg.querySelector('img'), last = null;
    $$('a.zoom').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); last = a;
        var im = a.querySelector('img');
        dimg.src = a.getAttribute('href'); dimg.alt = im ? im.alt : '';
        dlg.showModal();
      });
    });
    var close = function () { dlg.close(); };
    dlg.querySelector('.lb-close').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { dimg.removeAttribute('src'); if (last) last.focus(); });
  }
})();
