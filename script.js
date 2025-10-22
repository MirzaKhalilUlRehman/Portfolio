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

  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('openGit').addEventListener('click', () => window.open('https://github.com/MirzaKhalilUlRehman', '_blank'));


  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.09 });
  reveals.forEach(r => io.observe(r));

  const GITHUB_USER = 'MirzaKhalilUlRehman';
  const projectsGrid = document.getElementById('projectsGrid');
  const stProjects = document.getElementById('st-projects');
  const stStars = document.getElementById('st-stars');
  const seeMoreBtn = document.getElementById('seeMoreBtn');


  async function fetchWithCache(url, key, ttl = 2 * 60 * 1000) {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < ttl) return parsed.data;
      }
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('GitHub API: ' + res.status);
      const data = await res.json();
      sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function esc(s) { if (!s) return ''; return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

  function makeCard(repo) {
    const div = document.createElement('div');
    div.className = 'proj';
    const desc = repo.description ? esc(repo.description) : 'No description provided.';
    const lang = repo.language ? esc(repo.language) : '—';
    div.innerHTML = `
        <h3>${esc(repo.name)}</h3>
        <p>${desc}</p>
        <div class="meta">
          <span class="lang">${lang}</span>
          <a href="${repo.html_url}" target="_blank" rel="noopener">View on GitHub →</a>
        </div>
      `;
    return div;
  }


  function renderPaged(repos, firstN = 13) {
    projectsGrid.innerHTML = '';
    const visible = repos.slice(0, firstN);
    const hidden = repos.slice(firstN);

    visible.forEach(r => projectsGrid.appendChild(makeCard(r)));
    hidden.forEach(r => {
      const c = makeCard(r);
      c.style.display = 'none'; c.classList.add('hidden-repo');
      projectsGrid.appendChild(c);
    });

    stProjects.textContent = Math.min(repos.length, firstN);
    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    stStars.textContent = totalStars;

    if (hidden.length === 0) {
      seeMoreBtn.style.display = 'none';
    } else {
      seeMoreBtn.style.display = 'inline-block';
      seeMoreBtn.setAttribute('aria-expanded', 'false');
      seeMoreBtn.textContent = 'See More';
      seeMoreBtn.onclick = () => {
        const hiddenNodes = document.querySelectorAll('.hidden-repo');
        const expanded = seeMoreBtn.getAttribute('aria-expanded') === 'true';
        if (!expanded) {
          hiddenNodes.forEach(n => { n.style.display = ''; n.classList.remove('hidden-repo'); });
          seeMoreBtn.setAttribute('aria-expanded', 'true');
          seeMoreBtn.textContent = 'Show Less';
        } else {
          hiddenNodes.forEach(n => { n.style.display = 'none'; n.classList.add('hidden-repo'); });
          seeMoreBtn.setAttribute('aria-expanded', 'false');
          seeMoreBtn.textContent = 'See More';
          document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        }
      };
    }
  }
  (async function init() {
    projectsGrid.textContent = 'Loading projects…';
    const repos = await fetchWithCache(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, 'gh_repos_v2', 120000);
    if (!repos) {
      projectsGrid.innerHTML = '<div style="color:var(--muted);padding:12px">Unable to load projects right now.</div>';
      stProjects.textContent = '13';
      stStars.textContent = '--';
      return;
    }

    const filtered = repos.filter(r => !r.fork).sort((a, b) => {
      if ((b.stargazers_count || 0) !== (a.stargazers_count || 0)) return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
    renderPaged(filtered, 13);
  })();


  function animateNumber(el, to) {
    if (!el) return;
    const start = 0; const duration = 700; const stepTime = 20;
    const steps = Math.ceil(duration / stepTime);
    let current = start; let step = (to - start) / steps;
    const iv = setInterval(() => {
      current += step;
      if ((step > 0 && current >= to) || (step < 0 && current <= to)) { el.textContent = to; clearInterval(iv); return; }
      el.textContent = Math.round(current);
    }, stepTime);
  }
  (function watchStats() {
    const obs = new MutationObserver(() => {
      const p = document.getElementById('st-projects');
      const s = document.getElementById('st-stars');
      if (p && p.textContent && s && s.textContent && p.textContent !== '--') {
        animateNumber(p, parseInt(p.textContent) || 0);
        animateNumber(s, parseInt(s.textContent) || 0);
        obs.disconnect();
      }
    });
    obs.observe(document.getElementById('projectsGrid'), { childList: true, subtree: true });
  })();

  // Add this to handle active nav state
  document.querySelectorAll('nav a').forEach(link => {
    if(link.getAttribute('href') === window.location.hash) {
      link.setAttribute('aria-current', 'page');
    }
  });

})();
