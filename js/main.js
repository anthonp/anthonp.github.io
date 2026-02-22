const formatDate = (isoDate) => {
  if (!isoDate) return 'Undated';
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Undated';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const estimateReadTime = (text) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const stripMarkdown = (content) => content
  .replace(/^---[\s\S]*?---\s*/m, '')
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[[^\]]+\]\([^)]*\)/g, '$1')
  .replace(/^>\s?/gm, '')
  .replace(/[#*_~>-]/g, ' ');

const parseFrontMatter = (markdownText) => {
  if (!markdownText.startsWith('---')) return { metadata: {}, content: markdownText };

  const match = markdownText.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { metadata: {}, content: markdownText };

  const metadata = {};
  const lines = match[1].split('\n');
  let currentKey = null;

  lines.forEach((line) => {
    const listMatch = line.match(/^\s*-\s*(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(metadata[currentKey])) metadata[currentKey] = [];
      metadata[currentKey].push(listMatch[1].trim());
      return;
    }

    const keyValueMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!keyValueMatch) return;

    const [, key, value] = keyValueMatch;
    currentKey = key;
    const trimmedValue = value.trim();
    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
      metadata[key] = trimmedValue
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      return;
    }

    metadata[key] = trimmedValue.replace(/^['"]|['"]$/g, '');
  });

  const content = markdownText.slice(match[0].length);
  return { metadata, content };
};

const normalizeObsidianMarkdown = (content) => content
  .replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, altText) => {
    const fileName = target.trim();
    const alt = (altText || fileName).trim();
    const path = fileName.startsWith('/') ? fileName : `/images/${fileName}`;
    return `![${alt}](${path})`;
  })
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '[$2]($1)')
  .replace(/\[\[([^\]]+)\]\]/g, '$1')
  .replace(/^>\s*\[!(\w+)\]\s*(.*)$/gim, (_match, type, text) => `> **${type.toUpperCase()}:** ${text}`);

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
        const markdownText = await fetch(post.source).then((res) => res.text());
        const { content } = parseFrontMatter(markdownText);
        readTime = estimateReadTime(stripMarkdown(content));
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

const loadMarkdownPost = async () => {
  const contentElement = document.getElementById('post-content');
  if (!contentElement) return;

  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');

  if (!source) {
    contentElement.innerHTML = '<p>No markdown source supplied.</p>';
    return;
  }

  try {
    const markdownText = await fetch(source).then((res) => res.text());
    const { metadata, content } = parseFrontMatter(markdownText);
    const normalizedContent = normalizeObsidianMarkdown(content);

    if (window.marked) {
      contentElement.innerHTML = window.marked.parse(normalizedContent);
    } else {
      contentElement.textContent = normalizedContent;
    }

    const titleElement = document.getElementById('post-title');
    const metaElement = document.getElementById('post-meta');
    const title = metadata.title || 'Blog Post';
    const dateText = metadata.date ? formatDate(metadata.date) : 'Undated';
    const readTime = estimateReadTime(stripMarkdown(normalizedContent));

    document.title = `${title} | Hacker-Sec`;
    if (titleElement) titleElement.textContent = title;
    if (metaElement) {
      metaElement.textContent = `${dateText} • ${readTime} min read`;
    }
  } catch (error) {
    contentElement.innerHTML = '<p>Failed to load markdown post.</p>';
  }
};

setupCopySnippet();
setupSectionHighlight();
loadBlogPosts();
loadMarkdownPost();
