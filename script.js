/* =========================================
   Neo 4K Pro — Interactions
   ========================================= */
(function () {
  'use strict';

  // ---------- Helpers ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // ---------- Navbar scroll ----------
  const navbar = $('#navbar');
  const onScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });
    $$('#mobileMenu a').forEach(a =>
      a.addEventListener('click', () => {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('open');
      })
    );
  }

  // ---------- Scroll Reveal (IntersectionObserver) ----------
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  // ---------- Animated Counters ----------
  const counters = $$('.stat-num');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const format = (n) => {
      if (target >= 1000) {
        if (n >= 1000) {
          const k = n / 1000;
          return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K' + suffix;
        }
        return Math.round(n) + suffix;
      }
      return Math.round(n) + suffix;
    };
    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const value = target * easeOut(t);
      el.textContent = format(value);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((c) => counterIO.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  // ---------- Reviews Slider ----------
  const track = $('#reviewsTrack');
  const prevBtn = $('#reviewPrev');
  const nextBtn = $('#reviewNext');
  const dotsWrap = $('#reviewDots');

  if (track && prevBtn && nextBtn) {
    const cards = $$('.review-card', track);
    let index = 0;

    const getVisibleCount = () => {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    };

    const totalPages = () => Math.max(1, cards.length - getVisibleCount() + 1);

    const update = () => {
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 20;
      const offset = index * (cardWidth + gap);
      track.style.transform = `translateX(${offset}px)`;
      renderDots();
    };

    const renderDots = () => {
      if (!dotsWrap) return;
      const total = totalPages();
      dotsWrap.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const d = document.createElement('button');
        d.className = 'dot' + (i === index ? ' active' : '');
        d.setAttribute('aria-label', `انتقل إلى ${i + 1}`);
        d.addEventListener('click', () => { index = i; update(); });
        dotsWrap.appendChild(d);
      }
    };

    prevBtn.addEventListener('click', () => {
      index = (index - 1 + totalPages()) % totalPages();
      update();
    });
    nextBtn.addEventListener('click', () => {
      index = (index + 1) % totalPages();
      update();
    });

    // Touch / swipe
    let startX = 0, isDragging = false;
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) index = (index + 1) % totalPages();
        else index = (index - 1 + totalPages()) % totalPages();
        update();
      }
      isDragging = false;
    });

    // Auto-slide
    let auto = setInterval(() => {
      index = (index + 1) % totalPages();
      update();
    }, 6000);
    [prevBtn, nextBtn, track].forEach(el => {
      el.addEventListener('mouseenter', () => clearInterval(auto));
      el.addEventListener('mouseleave', () => {
        auto = setInterval(() => { index = (index + 1) % totalPages(); update(); }, 6000);
      });
    });

    window.addEventListener('resize', () => {
      if (index > totalPages() - 1) index = totalPages() - 1;
      update();
    });

    update();
  }

  // ---------- FAQ Accordion ----------
  $$('.faq-item').forEach((item) => {
    const q = $('.faq-q', item);
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // close all
      $$('.faq-item').forEach(i => {
        i.classList.remove('open');
        const b = $('.faq-q', i);
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---------- Copy to clipboard ----------
  const toast = $('#toast');
  const showToast = (msg, ok = true) => {
    if (!toast) return;
    toast.innerHTML = ok
      ? `<i class="fa-solid fa-circle-check"></i> ${msg}`
      : `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  $$('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || '';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.classList.add('copied');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = original;
        }, 1800);
        showToast('تم نسخ البيانات بنجاح');
      } catch (e) {
        showToast('تعذر النسخ — انسخ يدويًا', false);
      }
    });
  });

  // ---------- Smooth scroll for anchor links ----------
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ---------- Subtle parallax on hero background ----------
  const heroBg = $('.hero-bg-img');
  if (heroBg && window.matchMedia('(min-width: 768px)').matches) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 800) heroBg.style.transform = `translateY(${y * 0.18}px) scale(1.05)`;
    }, { passive: true });
  }
})();
