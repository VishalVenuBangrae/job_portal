const NCA_NAV = {
  jobseeker: [
    { id: 'dashboard', href: '/jobseeker.html', label: 'Dashboard' },
    { id: 'jobs', href: '/jobseeker-jobs.html', label: 'Browse Jobs' },
    { id: 'applications', href: '/jobseeker-applications.html', label: 'Applications' },
    { id: 'profile', href: '/crew-profile.html', label: 'My Profile' },
    { id: 'settings', href: '/change-password.html', label: 'Settings' }
  ],
  employer: [
    { id: 'dashboard', href: '/employer.html', label: 'Dashboard' },
    { id: 'post-job', href: '/post-job.html', label: 'Post Job' },
    { id: 'applications', href: '/employer-applications.html', label: 'Applications' },
    { id: 'manage-jobs', href: '/manage-jobs.html', label: 'Manage Jobs' },
    { id: 'settings', href: '/change-password.html', label: 'Settings' }
  ]
};

function ncaLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('profileComplete');
  window.location.href = '/login.html';
}

function ncaInitScrollReveal(root) {
  const scope = root || document;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = scope.querySelectorAll(
    '.nca-app .card:not(.nca-motion-bound), .nca-app .job-card:not(.nca-motion-bound), .nca-app .application-card:not(.nca-motion-bound), .nca-app .applicant-card:not(.nca-motion-bound), .nca-app .filter-section:not(.nca-motion-bound), .nca-inview:not(.is-visible)'
  );

  if (!targets.length) return;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => {
      el.classList.add('is-visible', 'nca-motion-bound');
    });
    return;
  }

  if (!window.__ncaRevealObserver) {
    window.__ncaRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        window.__ncaRevealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  targets.forEach((el, i) => {
    el.classList.add('nca-inview', 'nca-motion-bound');
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 0.06}s`;
    window.__ncaRevealObserver.observe(el);
  });
}

function ncaWatchDynamicContent() {
  const container = document.querySelector('.nca-content, .nca-app .container, .main');
  if (!container || !('MutationObserver' in window)) return;
  let timer = null;
  const mo = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => ncaInitScrollReveal(container), 80);
  });
  mo.observe(container, { childList: true, subtree: true });
}

function ncaStaggerNav() {
  document.querySelectorAll('.sidebar .nav-item').forEach((item, i) => {
    item.style.animation = `ncaSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.08 + i * 0.05}s both`;
  });
}

function ncaInitLayout() {
  const body = document.body;
  if (!body.classList.contains('nca-app')) return;
  if (document.querySelector('.app-shell')) return;

  const role = body.dataset.ncaRole || localStorage.getItem('userType');
  const page = body.dataset.ncaPage || '';
  const title = body.dataset.ncaTitle || '';
  const subtitle = body.dataset.ncaSubtitle || '';
  const navItems = NCA_NAV[role];
  if (!navItems) return;

  const oldHeader = document.querySelector('.header');
  if (oldHeader) oldHeader.remove();

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <a href="${role === 'employer' ? '/employer.html' : '/jobseeker.html'}">
        <img src="/images/nca-logo.png" alt="Nauti Crew Agency">
      </a>
      <span>Nauti Crew Agency</span>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-label">${role === 'employer' ? 'Employer' : 'Crew'}</div>
      ${navItems.map(item => `
        <a href="${item.href}" class="nav-item${page === item.id ? ' active' : ''}">${item.label}</a>
      `).join('')}
      <div class="nav-label" style="margin-top:12px">Account</div>
      <a href="#" class="nav-item" onclick="ncaLogout(); return false;">Logout</a>
    </nav>
  `;

  const main = document.createElement('div');
  main.className = 'main';

  if (title) {
    const hero = document.createElement('div');
    hero.className = 'page-hero nca-reveal';
    hero.innerHTML = `<h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}`;
    main.appendChild(hero);
  }

  const container = document.querySelector('.container');
  if (container) {
    container.classList.add('nca-content');
    main.appendChild(container);
  }

  shell.appendChild(sidebar);
  shell.appendChild(main);
  body.insertBefore(shell, body.firstChild);

  const mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-nav';
  mobileNav.innerHTML = navItems.slice(0, 4).map(item => `
    <a href="${item.href}" class="${page === item.id ? 'active' : ''}">${item.label.split(' ')[0]}</a>
  `).join('');
  body.appendChild(mobileNav);

  window.ncaLogout = ncaLogout;
  window.toggleMobileMenu = function() {};

  ncaStaggerNav();
  requestAnimationFrame(() => {
    ncaInitScrollReveal();
    ncaWatchDynamicContent();
  });
}

document.addEventListener('DOMContentLoaded', ncaInitLayout);
