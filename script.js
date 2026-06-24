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

  // Scroll progress bar
  const progressBar = document.getElementById('scroll-progress');
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = `${pct}%`;
  };
  window.addEventListener('scroll', updateProgress);
  updateProgress();

  // Custom cursor
  const cursorDot = document.getElementById('cursor-dot');
  if (matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      cursorDot.style.left = `${e.clientX}px`;
      cursorDot.style.top = `${e.clientY}px`;
      cursorDot.classList.add('visible');
    });
    document.querySelectorAll('a, button, .g-item, [data-lightbox]').forEach(el => {
      el.addEventListener('mouseenter', () => cursorDot.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('hovering'));
    });
  }

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

  // Gallery captions
  document.querySelectorAll('.g-item').forEach(item => {
    const img = item.querySelector('img');
    const caption = document.createElement('span');
    caption.className = 'g-caption';
    caption.textContent = img.alt;
    item.appendChild(caption);
  });

  // Gallery 3D tilt
  if (matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.g-item').forEach(item => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        item.style.transform = `perspective(800px) rotateX(${y * -10}deg) rotateY(${x * 10}deg)`;
      });
      item.addEventListener('mouseleave', () => {
        item.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
      });
    });
  }

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

  // Booking calendar
  const bookingModal = document.getElementById('booking-modal');
  const calGrid = document.getElementById('cal-grid');
  const calMonthLabel = document.getElementById('cal-month-label');
  const checkinEl = document.getElementById('booking-checkin');
  const checkoutEl = document.getElementById('booking-checkout');
  const nightsEl = document.getElementById('booking-nights');
  const confirmBtn = document.getElementById('booking-confirm');
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let rangeStart = null;
  let rangeEnd = null;

  const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  function renderCalendar() {
    calMonthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;
    calGrid.innerHTML = '';
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      calGrid.appendChild(document.createElement('span'));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const btn = document.createElement('button');
      btn.textContent = day;
      btn.type = 'button';
      if (date < today) {
        btn.disabled = true;
      } else {
        if (date.getTime() === today.getTime()) btn.classList.add('cal-today');
        if (rangeStart && date.getTime() === rangeStart.getTime()) btn.classList.add('cal-selected');
        if (rangeEnd && date.getTime() === rangeEnd.getTime()) btn.classList.add('cal-selected');
        if (rangeStart && rangeEnd && date > rangeStart && date < rangeEnd) btn.classList.add('cal-in-range');
        btn.addEventListener('click', () => selectDate(date));
      }
      calGrid.appendChild(btn);
    }
  }

  function selectDate(date) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      rangeStart = date;
      rangeEnd = null;
    } else if (date < rangeStart) {
      rangeStart = date;
      rangeEnd = null;
    } else {
      rangeEnd = date;
    }
    updateSummary();
    renderCalendar();
  }

  function updateSummary() {
    checkinEl.textContent = rangeStart ? fmtDate(rangeStart) : '—';
    checkoutEl.textContent = rangeEnd ? fmtDate(rangeEnd) : '—';
    if (rangeStart && rangeEnd) {
      const nights = Math.round((rangeEnd - rangeStart) / 86400000);
      nightsEl.textContent = nights;
      confirmBtn.disabled = false;
    } else {
      nightsEl.textContent = '—';
      confirmBtn.disabled = true;
    }
  }

  document.getElementById('cal-prev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  function openBooking() {
    bookingModal.classList.add('active');
    renderCalendar();
  }
  function closeBooking() {
    bookingModal.classList.remove('active');
  }
  document.querySelectorAll('.js-open-booking').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openBooking();
    });
  });
  document.getElementById('booking-close').addEventListener('click', closeBooking);
  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeBooking();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBooking();
  });
  confirmBtn.addEventListener('click', () => {
    alert(`Request received for ${fmtDate(rangeStart)} – ${fmtDate(rangeEnd)}. This is a demo booking flow — connect it to your real reservation system.`);
    closeBooking();
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();
});
