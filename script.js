document.addEventListener('DOMContentLoaded', () => {
  // Preloader
  window.addEventListener('load', () => {
    document.getElementById('preloader').classList.add('loaded');
  });
  setTimeout(() => document.getElementById('preloader').classList.add('loaded'), 1500);

  // Scroll-reveal (self-contained replacement for AOS)
  const revealEls = document.querySelectorAll('[data-aos]');
  revealEls.forEach(el => {
    const delay = el.dataset.aosDelay;
    if (delay) el.style.setProperty('--aos-delay', `${delay}ms`);
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  // Navbar scroll state
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );

  // Hero parallax
  const heroBg = document.querySelector('.hero-bg');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `scale(1.05) translateY(${y * 0.35}px)`;
    }
  });

  // Animated counters
  const counters = document.querySelectorAll('.stat-num');
  let countersStarted = false;
  const animateCounters = () => {
    counters.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(progress * target);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
    });
  };
  const statsSection = document.querySelector('.stats');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        animateCounters();
      }
    });
  }, { threshold: 0.4 });
  if (statsSection) statsObserver.observe(statsSection);

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  document.querySelectorAll('[data-lightbox]').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('active');
    });
  });
  document.getElementById('lightbox-close').addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') lightbox.classList.remove('active');
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();
});
