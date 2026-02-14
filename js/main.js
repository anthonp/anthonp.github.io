const formatDate = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const estimateReadTime = (text) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const setupCopySnippet = () => {
  const button = document.getElementById('copy-snippet');
  const status = document.getElementById('copy-status');
  if (!button || !status) return;

  const snippet = 'Anthony Picciano — Cybersecurity Professional. Mission: practical incident response, threat hunting, and detection engineering that reduce risk.';

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      status.textContent = 'Snippet copied to clipboard.';
    } catch (error) {
      status.textContent = 'Clipboard access unavailable in this browser context.';
    }
  });
};

const setupSectionHighlight = () => {
  const sections = document.querySelectorAll('[data-section], main#home');
  const navLinks = document.querySelectorAll('[data-nav-target]');
  if (!sections.length || !navLinks.length) return;

  const updateActive = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.dataset.navTarget === id;
      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActive(entry.target.id || 'home');
      }
    });
  }, { rootMargin: '-30% 0px -55% 0px', threshold: 0.1 });

  sections.forEach((section) => observer.observe(section));
};

const loadBlogPosts = async () => {
  const blogList = document.getElementById('blog-list');
  if (!blogList) return;

  try {
    const response = await fetch('/data/posts.json');
    const posts = await response.json();

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const cards = await Promise.all(posts.map(async (post) => {
      let readTime = 1;
      try {
        const articleHtml = await fetch(post.url).then((res) => res.text());
        const parsed = new DOMParser().parseFromString(articleHtml, 'text/html');
        const text = parsed.querySelector('main')?.innerText || parsed.body.innerText;
        readTime = estimateReadTime(text);
      } catch (error) {
        readTime = 1;
      }

      return `
        <article class="blog-card">
          <h2><a href="${post.url}">${post.title}</a></h2>
          <p class="blog-meta">${formatDate(post.date)} • ${readTime} min read</p>
          <p class="blog-excerpt">${post.excerpt}</p>
          ${post.tags?.length ? `<div class="blog-tags">${post.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
          <a class="btn btn--secondary" href="${post.url}">Read post</a>
        </article>
      `;
    }));

    blogList.innerHTML = cards.join('');
  } catch (error) {
    blogList.innerHTML = '<p>Failed to load posts index.</p>';
  }
};

setupCopySnippet();
setupSectionHighlight();
loadBlogPosts();
