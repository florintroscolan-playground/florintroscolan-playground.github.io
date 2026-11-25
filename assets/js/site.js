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

  /* 5. Hero demo ---------------------------------------------------------- */

  /** Pause the looping hero demo while it is off screen. */
  function initHeroDemo() {
    const demo = document.querySelector('.demo');
    if (!demo || !('IntersectionObserver' in window)) return;
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => demo.classList.toggle('is-paused', !entry.isIntersecting));
    }).observe(demo);
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        // only when it scrolls in from below; a number already in view keeps its value
        if (entry.boundingClientRect.top > window.innerHeight * 0.5) run(entry.target);
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

  /** A small image that follows the cursor over the work list (fine pointers, wide screens). */
  function initCursorPreview() {
    const list = document.querySelector('.work');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    if (!list) return;
    const preview = Object.assign(new Image(320, 200), { className: 'cursor-preview', alt: '' });
    preview.setAttribute('aria-hidden', 'true');
    list.append(preview);
    if (reduceMotion) return;

    const rows = $$('.work-row a');
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = null;
    let hovering = false;

    const follow = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      let left = x + 24;
      if (left + 320 > window.innerWidth - 16) left = x - 24 - 320;
      const top = Math.max(72, Math.min(y - 76, window.innerHeight - 200 - 16));
      preview.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      frame = hovering || Math.abs(targetX - x) > 0.5 ? requestAnimationFrame(follow) : null;
    };

    rows.forEach((row) => {
      row.addEventListener('mouseenter', (event) => {
        if (!fine.matches) return;
        preview.src = row.dataset.preview;
        hovering = true;
        preview.classList.add('is-on');
        if (!frame) {
          x = targetX = event.clientX;
          y = targetY = event.clientY;
          frame = requestAnimationFrame(follow);
        }
      });
      row.addEventListener('mousemove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (!frame) frame = requestAnimationFrame(follow);
      });
      row.addEventListener('mouseleave', () => {
        hovering = false;
        preview.classList.remove('is-on');
      });
    });

    const whenIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 800));
    whenIdle(() => {
      if (fine.matches) rows.forEach((row) => {
        new Image().src = row.dataset.preview;
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
})();
