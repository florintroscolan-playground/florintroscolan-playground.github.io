/**
 * Florin Troscolan, portfolio.
 * Small progressive enhancements, no dependencies. Every page works without this file.
 *
 * Contents
 *   1. Helpers
 *   2. Mobile navigation
 *   3. Work mega menu
 *   4. Back to top
 *   5. Hero demo
 *   6. Reveal on scroll
 *   7. Count-up numbers
 *   8. Reading progress and table of contents
 *   9. Copy email
 *  10. Work list cursor preview
 *  11. Lightbox
 */
(function () {
  'use strict';

  /* 1. Helpers ------------------------------------------------------------ */

  document.documentElement.classList.add('js-ready');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * querySelectorAll as an array.
   * @param {string} selector
   * @param {ParentNode} [root=document]
   * @returns {HTMLElement[]}
   */
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /**
   * Run a callback at most once per animation frame.
   * @param {() => void} fn
   * @returns {() => void}
   */
  const onFrame = (fn) => {
    let queued = false;
    return () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn();
      });
    };
  };

  /* 2. Mobile navigation -------------------------------------------------- */

  /** Menu button toggles the nav; closes on link tap, outside tap, Escape and when focus leaves. */
  function initMobileNav() {
    const button = document.querySelector('.menu-btn');
    const nav = document.querySelector('.mainnav');
    if (!button || !nav) return;

    /**
     * @param {boolean} open
     * @param {boolean} [returnFocus=false]
     */
    const setOpen = (open, returnFocus = false) => {
      button.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (open) {
        const first = nav.querySelector('a');
        if (first) first.focus();
      } else if (returnFocus) {
        button.focus();
      }
    };
    const isOpen = () => nav.classList.contains('is-open');

    button.addEventListener('click', () => setOpen(!isOpen()));
    nav.addEventListener('click', (event) => {
      if (isOpen() && event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', (event) => {
      if (isOpen() && !event.target.closest('.mainnav, .menu-btn')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) setOpen(false, true);
    });
    nav.addEventListener('focusout', (event) => {
      const next = event.relatedTarget;
      if (isOpen() && next && !nav.contains(next) && next !== button) setOpen(false);
    });
  }

  /* 3. Work mega menu ----------------------------------------------------- */

  /** Desktop only: opens on hover (with a short delay) or focus; arrows, Tab and Escape work inside. */
  function initMegaMenu() {
    const item = document.querySelector('.has-mega');
    const panel = document.getElementById('mega');
    if (!item || !panel) return;

    const trigger = item.querySelector('.work-link');
    const wide = window.matchMedia('(min-width: 900px)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let openTimer;
    let closeTimer;
    let ignoreNextFocus = false;

    const links = () => $$('a', panel);
    const isOpen = () => panel.classList.contains('is-open');

    const open = () => {
      clearTimeout(closeTimer);
      if (!wide.matches || isOpen()) return;
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
      trigger.setAttribute('aria-expanded', 'true');
    };

    /** @param {boolean} [returnFocus=false] */
    const close = (returnFocus = false) => {
      clearTimeout(openTimer);
      if (!isOpen() && panel.hidden) return;
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        if (!isOpen()) panel.hidden = true;
      }, 200);
      if (returnFocus && document.activeElement !== trigger) {
        ignoreNextFocus = true;
        trigger.focus();
      }
    };

    const warm = () => $$('img[loading="lazy"]', panel).forEach((img) => {
      img.loading = 'eager';
    });
    item.addEventListener('pointerenter', warm, { once: true });
    item.addEventListener('focusin', warm, { once: true });
    item.addEventListener('mouseenter', () => {
      if (!finePointer.matches) return;
      clearTimeout(closeTimer);
      openTimer = setTimeout(open, 120);
    });
    item.addEventListener('mouseleave', () => {
      clearTimeout(openTimer);
      closeTimer = setTimeout(close, 240);
    });
    panel.addEventListener('mouseenter', () => clearTimeout(closeTimer));
    panel.addEventListener('mouseleave', () => {
      closeTimer = setTimeout(close, 240);
    });

    trigger.addEventListener('focus', () => {
      if (ignoreNextFocus) {
        ignoreNextFocus = false;
        return;
      }
      open();
    });
    trigger.addEventListener('keydown', (event) => {
      if (!wide.matches) return;
      if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey && isOpen())) {
        event.preventDefault();
        open();
        const first = links()[0];
        if (first) first.focus();
      }
      if (event.key === 'Escape') close(true);
    });

    panel.addEventListener('keydown', (event) => {
      const list = links();
      const index = list.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        list[(index + 1) % list.length].focus();
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        (index <= 0 ? trigger : list[index - 1]).focus();
      } else if (event.key === 'Tab' && !event.shiftKey && index === list.length - 1) {
        event.preventDefault();
        close();
        const nextLink = item.nextElementSibling && item.nextElementSibling.querySelector('a');
        if (nextLink) nextLink.focus();
      } else if (event.key === 'Tab' && event.shiftKey && index === 0) {
        event.preventDefault();
        trigger.focus();
      }
    });

    const closeIfOutside = (event) => {
      if (isOpen() && !item.contains(event.target) && !panel.contains(event.target)) close();
    };
    document.addEventListener('focusin', closeIfOutside);
    document.addEventListener('click', closeIfOutside);
  }

  /* 4. Back to top -------------------------------------------------------- */

  /**
   * "Back to top" links point at #top, which is the sticky header: the browser would scroll to where the
   * header currently is (nowhere). Scroll the document itself, then move focus to the start of the page.
   */
  function initBackToTop() {
    $$('a[href="#top"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        const body = document.body;
        body.setAttribute('tabindex', '-1');
        body.focus({ preventScroll: true });
        body.addEventListener('blur', () => body.removeAttribute('tabindex'), { once: true });
        if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
      });
    });
  }

  /* 5. Hero demo -------------------------------------------------------- */

  /**
   * A short design session on loop: Florin selects a block and widens it, the client drops in,
   * types, and leaves a few comments. Cursor paths are gently curved, timings vary a little on
   * every loop, and the loop pauses while the demo is off screen. The markup is the final frame,
   * so with reduced motion (or without JS) nothing moves.
   */
  function initHeroDemo() {
    const demo = document.querySelector('.demo');
    if (!demo || reduceMotion || !window.matchMedia('(min-width: 768px)').matches) return;

    const q = (sel) => demo.querySelector(sel);
    const florin = q('.demo-lf');
    const client = q('.demo-lc');
    const sel = q('.demo-sel');
    const target = q('.demo-target');
    const dim = q('.demo-dim');
    const bubble = q('.demo-bubble');
    const msg = q('.demo-msg');
    const messages = ['Looks great!', 'Love the flow.', 'Can we make it pop?', 'Approved.', 'Ship it.'];

    // clock that stops while the demo is off screen
    let paused = false;
    let now = 0;
    let last = performance.now();
    const waiting = new Set();
    const tick = (t) => {
      if (!paused) now += Math.min(t - last, 64);
      last = t;
      waiting.forEach((w) => w());
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    new IntersectionObserver((entries) => {
      paused = !entries[0].isIntersecting;
    }).observe(demo);

    /** Slight random variation so the loop does not feel mechanical. */
    const vary = (ms) => ms * (0.88 + Math.random() * 0.24);
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const easeOut = (t) => 1 - (1 - t) ** 3;
    /** Ease out with a small overshoot, then settle. */
    const easeBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

    /**
     * Run fn(progress) for ms milliseconds of demo time.
     * @param {number} ms
     * @param {(p: number) => void} fn
     * @param {(t: number) => number} [ease]
     * @returns {Promise<void>}
     */
    const tween = (ms, fn, ease = easeInOut) => new Promise((resolve) => {
      const start = now;
      const step = () => {
        const p = Math.min(1, (now - start) / ms);
        fn(ease(p));
        if (p >= 1) {
          waiting.delete(step);
          resolve();
        }
      };
      waiting.add(step);
    });
    const wait = (ms) => tween(ms, () => {});

    /**
     * Move a cursor layer along a quadratic curve between two points (in % of the canvas).
     * @param {HTMLElement} el
     * @param {number[]} from
     * @param {number[]} to
     * @param {number} ms
     * @param {number} [bend=0.18]
     */
    const glide = (el, from, to, ms, bend = 0.18) => {
      const [x0, y0] = from;
      const [x1, y1] = to;
      const cx = (x0 + x1) / 2 - (y1 - y0) * bend;
      const cy = (y0 + y1) / 2 + (x1 - x0) * bend;
      return tween(ms, (p) => {
        const a = (1 - p) ** 2;
        const b = 2 * (1 - p) * p;
        const c = p * p;
        el.style.transform = `translate(${a * x0 + b * cx + c * x1}%, ${a * y0 + b * cy + c * y1}%)`;
      });
    };
    const fade = (el, to, ms) => {
      const from = Number(getComputedStyle(el).opacity);
      return tween(ms, (p) => {
        el.style.opacity = String(from + (to - from) * p);
      }, easeOut);
    };
    /** Selection and block grow together; the size label follows. */
    const resize = (fromW, toW, ms, ease) => tween(ms, (p) => {
      const w = fromW + (toW - fromW) * p;
      target.style.width = `${w}%`;
      sel.style.width = `${w + 1.2}%`;
      dim.textContent = `${Math.round((w / 36) * 320)} × 96`;
    }, ease);

    /** @param {string} text */
    const say = async (text) => {
      await tween(160, (p) => {
        msg.style.opacity = String(1 - p);
        msg.style.transform = `translateY(${-4 * p}px)`;
      }, easeOut);
      msg.textContent = text;
      await tween(240, (p) => {
        msg.style.opacity = String(p);
        msg.style.transform = `translateY(${4 * (1 - p)}px)`;
      }, easeOut);
    };

    const reset = () => {
      florin.style.cssText = 'opacity: 0; transform: translate(96%, 98%)';
      client.style.cssText = 'opacity: 0; transform: translate(104%, 4%)';
      sel.style.cssText = 'opacity: 0';
      bubble.style.cssText = 'opacity: 0; transform: scale(.92)';
      target.style.width = '36%';
      dim.textContent = '320 × 96';
    };

    const loop = async () => {
      for (;;) {
        reset();
        await wait(vary(500));
        fade(florin, 1, 300);
        await glide(florin, [96, 98], [38, 61], vary(1150), 0.22);
        await wait(vary(220));
        // select: appears with a small overshoot, then settles
        sel.style.width = '37.2%';
        await tween(420, (p) => {
          sel.style.opacity = String(Math.min(1, p * 1.6));
          sel.style.transform = `scale(${0.96 + 0.04 * p})`;
        }, easeBack);
        await wait(vary(260));
        await glide(florin, [38, 61], [56.8, 68.8], vary(700), -0.12);
        await wait(vary(180));
        await Promise.all([
          glide(florin, [56.8, 68.8], [72.8, 68.8], vary(1050), 0.04),
          resize(36, 52, 1050, easeInOut),
        ]);
        await resize(52, 52.8, 120, easeOut);        // overshoot on release
        await resize(52.8, 52, 220, easeOut);        // and settle
        glide(florin, [72.8, 68.8], [74, 80], vary(1300), 0.3);
        await wait(vary(500));
        fade(client, 1, 350);
        await glide(client, [104, 4], [48, 20], vary(1250), -0.2);
        bubble.classList.add('is-typing');
        await tween(260, (p) => {
          bubble.style.opacity = String(p);
          bubble.style.transform = `scale(${0.92 + 0.08 * p})`;
        }, easeBack);
        await wait(vary(900));
        bubble.classList.remove('is-typing');
        msg.textContent = '';
        for (const text of messages) {
          await say(text);
          await wait(vary(1200));
        }
        await Promise.all([
          tween(300, (p) => {
            bubble.style.opacity = String(1 - p);
          }, easeOut),
          glide(client, [48, 20], [102, 2], vary(900), 0.15),
          fade(client, 0, 900),
        ]);
        await Promise.all([fade(florin, 0, 500), fade(sel, 0, 500), resize(52, 36, 700, easeInOut)]);
        await wait(vary(700));
      }
    };
    loop();
  }

  /* 6. Reveal on scroll --------------------------------------------------- */

  /** Fade and rise once when an element enters the viewport, 60ms stagger between siblings. */
  function initReveal() {
    const items = $$('.rv');
    items.forEach((el) => {
      const siblings = el.parentElement ? $$(':scope > .rv', el.parentElement) : [];
      const index = siblings.indexOf(el);
      if (index > 0) el.style.setProperty('--d', `${Math.min(index, 6) * 60}ms`);
    });
    const showAll = () => items.forEach((el) => el.classList.add('in'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    items.forEach((el) => observer.observe(el));
    window.addEventListener('beforeprint', showAll);
  }

  /* 7. Count-up numbers --------------------------------------------------- */

  /** Count up once to the value already in the HTML (data-count, optional data-suffix). */
  function initCountUp() {
    const numbers = $$('[data-count]');
    if (reduceMotion || !numbers.length || !('IntersectionObserver' in window)) return;

    /** @param {HTMLElement} el */
    const run = (el) => {
      const end = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (!(end > 1)) return;
      let start = null;
      const from = Math.round(end * 0.6);
      const step = (time) => {
        if (start === null) start = time;
        const progress = Math.min(1, (time - start) / 900);
        el.textContent = `${Math.round(from + (end - from) * (1 - (1 - progress) ** 3))}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const checked = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const onLoad = !checked.has(entry.target);
        checked.add(entry.target);
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        // in view as the page opens (it counts in with the reveal), or scrolling in from below;
        // a number met mid-page from above keeps its value
        if (onLoad || entry.boundingClientRect.top > window.innerHeight * 0.5) run(entry.target);
      });
    }, { threshold: 0.6 });
    numbers.forEach((el) => observer.observe(el));
  }

  /* 8. Reading progress and table of contents ----------------------------- */

  /** Thin orange bar that follows the reading position on case pages. */
  function initProgress() {
    const bar = document.querySelector('.progress span');
    if (!bar) return;
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      bar.style.setProperty('--p', max > 0 ? (root.scrollTop / max).toFixed(4) : '0');
    };
    window.addEventListener('scroll', onFrame(update), { passive: true });
    update();
  }

  /** Highlight the current section in the case table of contents (sticky chip bar on phones). */
  function initToc() {
    const toc = document.querySelector('.toc');
    if (!toc) return;
    const links = $$('a', toc);
    const counter = toc.querySelector('.toc-count');
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    let lockedUntil = 0;

    /** @param {string} id */
    const setActive = (id) => {
      const link = byId.get(id);
      if (!link || link.hasAttribute('aria-current')) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'true');
      if (counter) {
        const pad = (n) => String(n).padStart(2, '0');
        counter.textContent = `${pad(links.indexOf(link) + 1)} / ${pad(links.length)}`;
      }
      const list = link.closest('ol');
      if (list && list.scrollWidth > list.clientWidth) {
        const left = list.scrollLeft + link.getBoundingClientRect().left - list.getBoundingClientRect().left - 8;
        list.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };

    const spy = () => {
      if (Date.now() < lockedUntil) return;
      const chipBar = getComputedStyle(toc).display === 'flex' ? toc.getBoundingClientRect().height : 0;
      const line = Math.max(64 + 80 + chipBar, window.innerHeight * 0.38);
      let current = sections[0];
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= line) current = section;
      });
      if (current) setActive(current.id);
    };

    links.forEach((a) => a.addEventListener('click', () => {
      setActive(a.getAttribute('href').slice(1));
      lockedUntil = Date.now() + 900;
    }));
    window.addEventListener('scroll', onFrame(spy), { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  /* 9. Copy email --------------------------------------------------------- */

  /** Copy the address, show "Copied" for 1.6s and announce it politely. */
  function initCopyEmail() {
    $$('.copy-btn').forEach((button) => {
      const label = button.querySelector('.copy-label');
      const status = button.parentElement.querySelector('[data-copy-status]');
      let timer;
      button.addEventListener('click', () => {
        const value = button.dataset.copy;
        const done = () => {
          button.classList.add('is-copied');
          label.textContent = 'Copied';
          if (status) status.textContent = 'Email address copied to clipboard';
          clearTimeout(timer);
          timer = setTimeout(() => {
            button.classList.remove('is-copied');
            label.textContent = 'Copy email';
            if (status) status.textContent = '';
          }, 1600);
        };
        const fallback = () => {
          label.textContent = 'Could not copy';
          if (status) status.textContent = 'Could not copy. The address is shown next to the button.';
          clearTimeout(timer);
          timer = setTimeout(() => {
            label.textContent = 'Copy email';
            if (status) status.textContent = '';
          }, 2400);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(value).then(done, fallback);
        } else {
          fallback();
        }
      });
    });
  }

  /* 10. Work list cursor preview ------------------------------------------ */

  /**
   * Hover preview on the work list (fine pointers, wide screens): a card that follows the cursor and plays
   * the project's four screens, cross-fading every 1.6 s with a segmented orange progress bar. It restarts at
   * the first screen on every hover and stops when the pointer leaves. Keyboard focus and reduced motion show
   * the cover only. Touch devices keep the inline cover in each row.
   */
  function initCursorPreview() {
    const list = document.querySelector('.work');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    if (!list) return;
    const rows = $$('.work-row a[data-cover]');
    const hiDpi = window.devicePixelRatio > 1.5;
    /** "small large" -> the URL for this screen density. */
    const pick = (pair) => {
      const [small, large] = pair.trim().split(/\s+/);
      return hiDpi && large ? large : small;
    };
    const slidesOf = (row) => (row.dataset.slides || '').split('|').filter(Boolean).map(pick);

    const card = document.createElement('div');
    card.className = 'cursor-preview';
    card.setAttribute('aria-hidden', 'true');
    const layers = [0, 1].map(() => {
      const img = new Image(320, 200);
      img.className = 'cp-layer';
      img.alt = '';
      img.decoding = 'async';
      card.append(img);
      return img;
    });
    const bars = document.createElement('div');
    bars.className = 'cp-bars';
    card.append(bars);
    list.append(card);

    let front = 0;
    let slides = [];
    let index = 0;
    let timer = 0;
    let token = 0;

    /** Put src on the hidden layer and bring it to the front once it has decoded. */
    const show = (src, instant) => {
      const run = ++token;
      const next = layers[1 - front];
      next.src = src;
      const swap = () => {
        if (run !== token) return;
        if (instant) next.style.transition = 'none';
        next.classList.add('is-front');
        layers[front].classList.remove('is-front');
        front = 1 - front;
        if (instant) requestAnimationFrame(() => { next.style.transition = ''; });
      };
      (next.decode ? next.decode() : Promise.resolve()).then(swap, swap);
    };
    const setBars = (count) => {
      bars.hidden = count < 2;
      bars.replaceChildren(...Array.from({ length: count }, () => {
        const bar = document.createElement('span');
        bar.className = 'cp-bar';
        return bar;
      }));
    };
    const markBars = () => {
      Array.from(bars.children).forEach((bar, i) => {
        bar.classList.remove('is-run');
        bar.classList.toggle('is-done', i < index);
      });
      const current = bars.children[index];
      if (current) {
        void current.offsetWidth;            // restart the fill animation
        current.classList.add('is-run');
      }
    };
    const stop = () => {
      window.clearTimeout(timer);
      timer = 0;
    };
    const step = () => {
      index = (index + 1) % slides.length;
      show(slides[index]);
      markBars();
      if (slides[index + 1]) new Image().src = slides[index + 1];
      timer = window.setTimeout(step, 1600);
    };
    /** Start on a row: the carousel for a hover, the cover alone for focus or reduced motion. */
    const start = (row, still) => {
      stop();
      slides = still || reduceMotion ? [pick(row.dataset.cover)] : slidesOf(row);
      if (!slides.length) slides = [pick(row.dataset.cover)];
      index = 0;
      layers.forEach((layer) => layer.classList.remove('is-front'));
      show(slides[0], true);
      setBars(slides.length);
      markBars();
      card.classList.add('is-on');
      if (slides.length > 1) {
        new Image().src = slides[1];
        timer = window.setTimeout(step, 1600);
      }
    };
    const hide = () => {
      stop();
      token += 1;
      card.classList.remove('is-on');
    };

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = null;
    let hovering = false;
    const place = (left, top) => {
      card.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    };
    const follow = () => {
      x += (targetX - x) * (reduceMotion ? 1 : 0.18);
      y += (targetY - y) * (reduceMotion ? 1 : 0.18);
      let left = x + 24;
      if (left + 320 > window.innerWidth - 16) left = x - 24 - 320;
      place(left, Math.max(72, Math.min(y - 76, window.innerHeight - 200 - 16)));
      frame = hovering && Math.abs(targetX - x) + Math.abs(targetY - y) > 0.5 ? requestAnimationFrame(follow) : null;
    };

    rows.forEach((row) => {
      row.addEventListener('mouseenter', (event) => {
        if (!fine.matches) return;
        hovering = true;
        x = targetX = event.clientX;
        y = targetY = event.clientY;
        follow();
        start(row, false);
      });
      row.addEventListener('mousemove', (event) => {
        if (!hovering) return;
        targetX = event.clientX;
        targetY = event.clientY;
        if (!frame) frame = requestAnimationFrame(follow);
      });
      row.addEventListener('mouseleave', () => {
        hovering = false;
        hide();
      });
      row.addEventListener('focus', () => {
        if (!fine.matches || hovering || !row.matches(':focus-visible')) return;
        const rect = row.getBoundingClientRect();
        place(Math.min(rect.left + rect.width * 0.5, window.innerWidth - 336), Math.max(72, rect.top + rect.height / 2 - 100));
        start(row, true);
      });
      row.addEventListener('blur', () => {
        if (!hovering) hide();
      });
    });
  }

  /* 11. Lightbox ---------------------------------------------------------- */

  /** Open figure images in a modal dialog; without <dialog> support the link opens the image. */
  function initLightbox() {
    const dialog = document.querySelector('.lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const image = dialog.appendChild(new Image());
    image.alt = '';
    let opener = null;

    $$('a.zoom').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        opener = link;
        const thumb = link.querySelector('img');
        image.src = link.getAttribute('href');
        image.alt = thumb ? thumb.alt : '';
        dialog.showModal();
      });
    });
    const close = () => dialog.close();
    dialog.querySelector('.lb-close').addEventListener('click', close);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('close', () => {
      image.removeAttribute('src');
      if (opener) opener.focus();
    });
  }

  /* 12. Highlighter marks ------------------------------------------------- */

  /** Draw the orange highlighter swipe once, when the phrase is well inside the viewport. */
  function initMarks() {
    const marks = $$('.mark');
    const drawAll = () => marks.forEach((el) => el.classList.add('is-drawn'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
      drawAll();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-drawn');
        observer.unobserve(entry.target);
      });
    }, { threshold: 1, rootMargin: '0px 0px -15% 0px' });
    marks.forEach((el) => observer.observe(el));
    window.addEventListener('beforeprint', drawAll);
  }

  /* 13. Statement scroll reveal ------------------------------------------- */

  /**
   * Words turn from grey to ink as the statement scrolls through the viewport, and back when
   * scrolling up. One rect read per frame, only while the statement is on screen.
   */
  function initStatement() {
    const text = document.querySelector('.statement-text');
    if (!text || reduceMotion || !('IntersectionObserver' in window)) return;

    /** Wrap each word of a text node in span.w (no-break spaces keep their words together). */
    const split = (node) => {
      const parts = node.textContent.split(/([ \t\n]+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^[ \t\n]+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const word = document.createElement('span');
        word.className = 'w';
        word.textContent = part;
        frag.appendChild(word);
      });
      node.replaceWith(frag);
    };
    const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(split);

    const words = $$('.w', text);
    text.classList.add('is-split');
    let lit = 0;
    const update = () => {
      const rect = text.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end = vh * 0.4;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height * 0.6)));
      const next = Math.round(progress * words.length);
      if (next === lit) return;
      const from = Math.min(lit, next);
      const to = Math.max(lit, next);
      for (let i = from; i < to; i += 1) words[i].classList.toggle('is-on', i < next);
      lit = next;
    };
    const onScroll = onFrame(update);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        onScroll();
      }
    }, { rootMargin: '10% 0px' });
    observer.observe(text);
    window.addEventListener('beforeprint', () => words.forEach((w) => w.classList.add('is-on')));
  }

  /* 14. Hello in the console ---------------------------------------------- */

  /** One friendly line for whoever opens the developer tools. */
  function initConsoleHello() {
    const accent = 'color:#FF5A1F;font-weight:600';
    // eslint-disable-next-line no-console -- a single deliberate greeting, not debug output
    console.log('%cHi there.%c Like what you see under the hood? %cflorin.troscolan@gmail.com', accent, 'color:inherit', accent);
  }

  /* 15. Read depth (Umami) ------------------------------------------------ */

  /**
   * On case pages, Small Bites and How I work, report once per view when the reader reaches 50%
   * and 90% of the main content. Invisible sentinels and IntersectionObserver, no scroll listener.
   * Does nothing when the analytics script is blocked.
   */
  function initReadDepth() {
    const main = document.querySelector('main[data-read-depth]');
    if (!main || !('IntersectionObserver' in window)) return;
    const page = main.dataset.readDepth;
    if (getComputedStyle(main).position === 'static') main.style.position = 'relative';
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const depth = Number(entry.target.dataset.depth);
        observer.unobserve(entry.target);
        entry.target.remove();
        if (window.umami && typeof window.umami.track === 'function') window.umami.track('Read depth', { page, depth });
      });
    });
    [50, 90].forEach((depth) => {
      const sentinel = document.createElement('div');
      sentinel.className = 'depth-sentinel';
      sentinel.dataset.depth = String(depth);
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = `position:absolute;left:0;top:${depth}%;width:1px;height:1px;pointer-events:none`;
      main.appendChild(sentinel);
      observer.observe(sentinel);
    });
  }

  /* 16. Headline typewriter ----------------------------------------------- */

  /**
   * Types, holds, deletes and cycles the domain after "for" in the home headline. Runs only while the
   * hero is on screen and the tab is visible; no timer is left running otherwise. Without JS or with
   * reduced motion the static list stays.
   */
  function initHeroType() {
    const box = document.querySelector('.hero-type');
    const title = box && box.closest('.t-hero');
    if (!title || reduceMotion || !('IntersectionObserver' in window)) return;
    const word = box.querySelector('.hero-word');
    const words = box.dataset.words.split(',');

    let index = 0;
    let chars = words[0].length;
    let phase = 'hold';
    let timer = 0;
    let onScreen = false;

    const between = (min, max) => min + Math.random() * (max - min);
    const step = () => {
      timer = 0;
      const target = words[index];
      let delay;
      if (phase === 'type') {
        chars += 1;
        word.textContent = target.slice(0, chars);
        delay = between(55, 90);
        if (chars >= target.length) {
          phase = 'hold';
          delay = 1600;
        }
      } else if (phase === 'hold') {
        phase = 'delete';
        delay = 35;
      } else if (phase === 'delete') {
        chars -= 1;
        word.textContent = target.slice(0, chars);
        delay = 35;
        if (chars <= 0) {
          phase = 'pause';
          delay = 380;
        }
      } else {
        index = (index + 1) % words.length;
        phase = 'type';
        delay = between(55, 90);
      }
      box.classList.toggle('is-busy', phase === 'type' || phase === 'delete');
      schedule(delay);
    };
    const running = () => onScreen && document.visibilityState === 'visible';
    function schedule(delay) {
      if (running() && !timer) timer = window.setTimeout(step, delay);
    }
    const sync = () => {
      if (running()) schedule(phase === 'hold' ? 1600 : 120);
      else if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
    };
    new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      sync();
    }).observe(title);
    document.addEventListener('visibilitychange', sync);
  }

  /* Loop links ------------------------------------------------------------ */

  /**
   * The orange loop around "Discover" and "together". Its stroke keeps a constant width (non-scaling-stroke),
   * so the dash is measured in screen pixels: set it from the drawn size, and again when that changes.
   */
  function initLoopLinks() {
    const paths = $$('.egg-loop .egg-path');
    if (!paths.length) return;
    const measure = () => paths.forEach((path) => {
      const box = path.ownerSVGElement.getBoundingClientRect();
      if (!box.width) return;
      const scale = (box.width / 300 + box.height / 100) / 2;
      path.style.setProperty('--egg-len', `${Math.ceil(path.getTotalLength() * scale * 1.06)}px`);
    });
    measure();
    window.addEventListener('resize', measure, { passive: true });
    if (document.fonts) document.fonts.ready.then(measure);
  }

  /* 17. Measurement: home scroll depth, case glance seen, owner opt-out --- */

  /** Send one Umami event; silent when the analytics script is blocked or switched off. */
  const track = (name, data) => {
    try {
      if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, data);
    } catch {
      /* analytics must never break the page */
    }
  };

  /** Home: "Scroll depth" at 25/50/75/100% of the page, each once per view. */
  function initScrollDepth() {
    const main = document.querySelector('.is-home main');
    if (!main || !('IntersectionObserver' in window)) return;
    if (getComputedStyle(main).position === 'static') main.style.position = 'relative';
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        entry.target.remove();
        track('Scroll depth', { page: 'home', depth: Number(entry.target.dataset.depth) });
      });
    });
    [25, 50, 75, 100].forEach((depth) => {
      const sentinel = document.createElement('div');
      sentinel.className = 'depth-sentinel';
      sentinel.dataset.depth = String(depth);
      sentinel.setAttribute('aria-hidden', 'true');
      const at = depth === 100 ? 'bottom:0' : `top:${depth}%`;
      sentinel.style.cssText = `position:absolute;left:0;${at};width:1px;height:1px;pointer-events:none`;
      main.appendChild(sentinel);
      observer.observe(sentinel);
    });
  }

  /** Case pages: "Glance seen" once, after 60% of the At a glance row has been visible for a full second. */
  function initGlanceSeen() {
    const glance = document.querySelector('[data-glance]');
    if (!glance || !('IntersectionObserver' in window)) return;
    let timer = 0;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!timer) {
            timer = window.setTimeout(() => {
              observer.disconnect();
              track('Glance seen', { page: glance.dataset.glance });
            }, 1000);
          }
        } else if (timer) {
          window.clearTimeout(timer);
          timer = 0;
        }
      });
    }, { threshold: 0.6 });
    observer.observe(glance);
  }

  /** ?owner=1 (handled in the page head) switches analytics off on this device; say so once. */
  function initOwnerToast() {
    let show = false;
    try {
      show = sessionStorage.getItem('owner-toast') === '1';
      if (show) sessionStorage.removeItem('owner-toast');
    } catch {
      return;
    }
    if (!show) return;
    const toast = document.createElement('p');
    toast.className = 'owner-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = 'Analytics off on this device';
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
  }

  initMobileNav();
  initMegaMenu();
  initBackToTop();
  initHeroDemo();
  initReveal();
  initCountUp();
  initProgress();
  initToc();
  initCopyEmail();
  initCursorPreview();
  initLightbox();
  initMarks();
  initStatement();
  initConsoleHello();
  initReadDepth();
  initHeroType();
  initLoopLinks();
  initScrollDepth();
  initGlanceSeen();
  initOwnerToast();
})();
