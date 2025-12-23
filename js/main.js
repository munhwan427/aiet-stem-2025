/**
 * AIET IN STEM 2025 - Main JavaScript
 * Countdown Timer, Mobile Navigation, and Interactive Features
 */

// ============================================
// Countdown Timer
// ============================================
function initCountdown() {
  const eventDate = new Date('December 16, 2025 08:30:00 GMT+0900').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance < 0) {
      // Event has started
      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minutesEl = document.getElementById('minutes');
      const secondsEl = document.getElementById('seconds');

      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
  }

  // Update immediately and then every second
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ============================================
// Mobile Navigation
// ============================================
function toggleMenu() {
  const navMenu = document.querySelector('.nav-menu');
  const navToggle = document.querySelector('.nav-toggle');

  if (navMenu) {
    navMenu.classList.toggle('active');
  }

  if (navToggle) {
    navToggle.classList.toggle('active');
  }
}

// Close mobile menu when clicking on a link
function initMobileMenu() {
  const navLinks = document.querySelectorAll('.nav-link');
  const navMenu = document.querySelector('.nav-menu');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const navbar = document.querySelector('.navbar');
    if (navMenu && navbar && !navbar.contains(e.target)) {
      navMenu.classList.remove('active');
    }
  });
}

// ============================================
// Smooth Scroll
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ============================================
// Navbar Scroll Effect
// ============================================
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');

  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else {
      navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }
  });
}

// ============================================
// Parallax Scroll Effect
// ============================================
function initParallax() {
  const parallaxBg = document.querySelector('.countdown-parallax-bg');

  if (!parallaxBg) return;

  const handleScroll = () => {
    const scrolled = window.pageYOffset;
    const parallaxSection = document.querySelector('.countdown-parallax');

    if (!parallaxSection) return;

    const rect = parallaxSection.getBoundingClientRect();
    const sectionTop = rect.top + scrolled;
    const sectionHeight = rect.height;

    // Only apply parallax when section is in viewport
    if (scrolled + window.innerHeight > sectionTop && scrolled < sectionTop + sectionHeight) {
      const yPos = (scrolled - sectionTop) * 0.5;
      parallaxBg.style.transform = `translateY(${yPos}px)`;
    }
  };

  // Use requestAnimationFrame for smooth performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ============================================
// Animate on Scroll (Simple Implementation)
// ============================================
function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe cards and sections
  document.querySelectorAll('.card, .speaker-card, .travel-card, .agenda-day').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// ============================================
// Image Error Handling
// ============================================
function initImageErrorHandling() {
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      // For speaker images, show placeholder
      if (this.classList.contains('speaker-detail-image') || this.classList.contains('speaker-image')) {
        this.style.display = 'none';
        const placeholder = this.nextElementSibling;
        if (placeholder && placeholder.classList.contains('speaker-detail-image-placeholder')) {
          placeholder.style.display = 'flex';
        }
      }
    });
  });
}

// ============================================
// Gallery Filter (if on gallery page)
// ============================================
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-masonry-item');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter logic would go here
      // For now, just show all items
      const filter = btn.textContent.toLowerCase();

      galleryItems.forEach(item => {
        // Show all for now - implement filtering based on data attributes when photos are added
        item.style.display = 'block';
      });
    });
  });
}

// ============================================
// Copy Email to Clipboard
// ============================================
function initEmailCopy() {
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', function(e) {
      // Allow default mailto behavior
      // But also copy to clipboard as backup
      const email = this.href.replace('mailto:', '');

      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).catch(() => {
          // Silently fail - mailto will still work
        });
      }
    });
  });
}

// ============================================
// Print-friendly Agenda
// ============================================
function printAgenda() {
  window.print();
}

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  initCountdown();
  initMobileMenu();
  initSmoothScroll();
  initNavbarScroll();
  initParallax();
  initImageErrorHandling();
  initGalleryFilter();
  initEmailCopy();

  // Delay animations slightly for better performance
  setTimeout(() => {
    initAnimations();
  }, 100);

  console.log('AIET IN STEM 2025 - Website Initialized');
});

// ============================================
// Utility Functions
// ============================================

// Format date for display
function formatDate(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Debounce function for scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
