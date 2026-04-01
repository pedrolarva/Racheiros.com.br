// === Home Animations — encapsulated for SPA compatibility ===
function initHomeAnimations() {
  // Scroll: Header .scrolled
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile Menu Toggle
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      header.classList.toggle('menu-open');
      hamburger.textContent = header.classList.contains('menu-open') ? '✕' : '☰';
    });
  }

  // Close menu when clicking a nav link
  document.querySelectorAll('.nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (header) header.classList.remove('menu-open');
      if (hamburger) hamburger.textContent = '☰';
    });
  });

  // Fade-In on Scroll (IntersectionObserver)
  var fadeElements = document.querySelectorAll('.fade-in:not(.visible)');
  if (fadeElements.length > 0) {
    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    fadeElements.forEach(function (el) { fadeObserver.observe(el); });
  }

  // Animated Counters
  function animateCounter(el, target, duration) {
    var start = performance.now();
    var update = function (now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = current.toLocaleString('pt-BR');
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  }

  var statsSection = document.getElementById('stats');
  if (statsSection) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var numbers = entry.target.querySelectorAll('.stat-number');
          numbers.forEach(function (num) {
            var target = parseInt(num.dataset.target, 10);
            animateCounter(num, target, 1500);
          });
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    statsObserver.observe(statsSection);
  }
}

// Export globally
window.initHomeAnimations = initHomeAnimations;

// Auto-init on DOMContentLoaded if on home
document.addEventListener('DOMContentLoaded', function () {
  var hash = location.hash;
  if (!hash || hash === '#/' || hash === '#') {
    initHomeAnimations();
  }
});
