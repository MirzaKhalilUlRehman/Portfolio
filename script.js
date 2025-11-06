(function () {
  'use strict';

  // Cursor trail effect
  function createCursorTrail(e) {
    const dot = document.createElement('div');
    dot.className = 'cursor-trail';
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    document.body.appendChild(dot);

    // Remove the dot after animation
    setTimeout(() => {
      dot.remove();
    }, 1200); // Matched to animation duration
  }

  // Update the throttle time for smoother trail
  let timeout;
  document.addEventListener('mousemove', (e) => {
    if (timeout) return;
    timeout = setTimeout(() => {
      createCursorTrail(e);
      timeout = null;
    }, 30); // Reduced from 50 to 30 for smoother trail
  });

  const GITHUB_USER = 'MirzaKhalilUlRehman';
  const CACHE_KEY = 'gh_repos_cache_v1';
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour
  const INITIAL_COUNT = 6;

  const stProjects = document.getElementById('st-projects');
  const stStars = document.getElementById('st-stars');
  const projectsGrid = document.getElementById('projectsGrid');
  const seeMoreBtn = document.getElementById('seeMoreBtn');
  const openGitBtn = document.getElementById('openGit');
  const yearSpan = document.getElementById('year');

  yearSpan.textContent = new Date().getFullYear();

  openGitBtn.addEventListener('click', () => {
    window.open(`https://github.com/${GITHUB_USER}`, '_blank', 'noopener,noreferrer');
  });

  seeMoreBtn.addEventListener('click', () => {
    const expanded = seeMoreBtn.getAttribute('aria-expanded') === 'true';
    seeMoreBtn.setAttribute('aria-expanded', String(!expanded));
    seeMoreBtn.textContent = expanded ? 'See More' : 'Show Less';
    renderRepos(window.__gh_repos || [], expanded ? INITIAL_COUNT : 100);
  });

  async function fetchRepos() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && (Date.now() - cached.ts) < CACHE_TTL) return cached.data;

      const url = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner`;
      const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const data = await res.json();

      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  function renderRepos(rawRepos = [], limit = INITIAL_COUNT) {
    const repos = rawRepos
      .filter(r => !r.fork && !r.archived) // remove forks/archived if desired
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));

    // Update stats
    const totalProjects = repos.length;
    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    stProjects.textContent = totalProjects;
    stStars.textContent = totalStars;

    if (!repos.length) {
      projectsGrid.innerHTML = '<div> No projects found. </div>';
      return;
    }

    const shown = repos.slice(0, limit);
    projectsGrid.innerHTML = '';
    shown.forEach(repo => {
      const a = document.createElement('a');
      a.className = 'project-card';
      a.href = repo.html_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <div class="proj-title">${escapeHtml(repo.name)}</div>
        <div class="proj-desc">${escapeHtml(repo.description || '')}</div>
        <div class="proj-meta">
          <span class="lang">${escapeHtml(repo.language || '')}</span>
          <span class="stars">★ ${repo.stargazers_count || 0}</span>
        </div>
      `;
      projectsGrid.appendChild(a);
    });

    // Toggle See More visibility
    if (repos.length > INITIAL_COUNT) {
      seeMoreBtn.style.display = 'inline-block';
      const expanded = seeMoreBtn.getAttribute('aria-expanded') === 'true';
      seeMoreBtn.textContent = expanded ? 'Show Less' : 'See More';
    } else {
      seeMoreBtn.style.display = 'none';
    }
  }

  // small helper to prevent injection
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // init
  (async () => {
    projectsGrid.textContent = 'Loading projects…';
    const data = await fetchRepos();
    if (!data) {
      projectsGrid.textContent = 'Failed to load projects. Try again later.';
      return;
    }
    window.__gh_repos = data;
    renderRepos(data, INITIAL_COUNT);
  })();


  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.09 });
  reveals.forEach(r => io.observe(r));

  // Add this to handle active nav state
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === window.location.hash) {
      link.setAttribute('aria-current', 'page');
    }
  });

})();
