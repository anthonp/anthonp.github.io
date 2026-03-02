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

const normalizeQuotedCodeBlocks = (content) => {
  const lines = content.split('\n');
  const out = [];
  let index = 0;

  const inferLanguage = (blockLines) => {
    const first = blockLines.find((line) => line.trim().length)?.trim() || '';
    if (/^(--|SELECT|WITH|FROM|JOIN|WHERE|ORDER BY|LIMIT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(first)) return 'sql';
    if (/^(#|Get-|Set-|New-|Remove-|Select-|Sort-|Where-|ForEach-|Write-|Test-|\$|\(|\[)/i.test(first)) return 'powershell';
    return '';
  };

  const isLikelyCodeBlock = (blockLines) => {
    const nonEmpty = blockLines.map((line) => line.trim()).filter(Boolean);
    if (!nonEmpty.length) return false;
    const codeLike = nonEmpty.filter((line) => /^(#|--|SELECT|WITH|FROM|JOIN|WHERE|ORDER BY|LIMIT|Get-|Set-|New-|Remove-|Select-|Sort-|Where-|\$|\(|\[)/i.test(line)).length;
    return codeLike / nonEmpty.length >= 0.6 || nonEmpty.length >= 4;
  };

  while (index < lines.length) {
    if (!/^>\s?/.test(lines[index])) {
      out.push(lines[index]);
      index += 1;
      continue;
    }

    const quoteBlock = [];
    while (index < lines.length && /^>\s?/.test(lines[index])) {
      quoteBlock.push(lines[index].replace(/^>\s?/, ''));
      index += 1;
    }

    if (isLikelyCodeBlock(quoteBlock)) {
      const language = inferLanguage(quoteBlock);
      out.push(`\`\`\`${language}`);
      out.push(...quoteBlock);
      out.push('```');
    } else {
      out.push(...quoteBlock.map((line) => `> ${line}`));
    }
  }

  return out.join('\n');
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
  const sections = [...document.querySelectorAll('[data-section][id]')];
  const navLinks = document.querySelectorAll('[data-nav-target]');
  if (!sections.length || !navLinks.length) return;

  const updateActive = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.dataset.navTarget === id;
      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  };

  let framePending = false;

  const getActiveSectionId = () => {
    const nav = document.querySelector('.top-nav');
    const probeLine = (nav?.offsetHeight || 0) + 24;
    let activeId = 'home';

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= probeLine) {
        activeId = section.id;
      }
    });

    return activeId;
  };

  const syncActiveSection = () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(() => {
      updateActive(getActiveSectionId());
      framePending = false;
    });
  };

  window.addEventListener('scroll', syncActiveSection, { passive: true });
  window.addEventListener('resize', syncActiveSection);
  window.addEventListener('load', syncActiveSection);
  syncActiveSection();
};

const loadBlogPosts = async () => {
  const blogList = document.getElementById('blog-list');
  if (!blogList) return;

  try {
    const response = await fetch('/data/posts.json');
    if (!response.ok) throw new Error(`Failed posts index request: ${response.status}`);
    const posts = await response.json();

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const cards = posts.map((post) => {
      const readTime = post.readMinutes || estimateReadTime(stripMarkdown(post.markdown || post.excerpt || ''));
      return `
        <article class="blog-card">
          <h2><a href="${post.url}">${post.title}</a></h2>
          <p class="blog-meta">${formatDate(post.date)} • ${readTime} min read</p>
          <p class="blog-excerpt">${post.excerpt}</p>
          ${post.tags?.length ? `<div class="blog-tags">${post.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
          <a class="btn btn--secondary" href="${post.url}">Read post</a>
        </article>
      `;
    });

    blogList.innerHTML = cards.join('');
  } catch (error) {
    blogList.innerHTML = '<p>Failed to load posts index.</p>';
  }
};

const loadMarkdownPost = async () => {
  const contentElement = document.getElementById('post-content');
  if (!contentElement) return;

  const params = new URLSearchParams(window.location.search);
  const postSlug = params.get('post');
  const source = params.get('source');

  if (!postSlug && !source) {
    contentElement.innerHTML = '<p>No markdown source supplied.</p>';
    return;
  }

  try {
    let metadata = {};
    let content = '';
    let sourcePath = source || '';

    const postsResponse = await fetch('/data/posts.json');
    if (postsResponse.ok) {
      const posts = await postsResponse.json();
      const post = posts.find((item) => (postSlug && item.slug === postSlug) || (source && item.source === source));
      if (post) {
        metadata = {
          title: post.title,
          date: post.date,
          tags: post.tags,
          excerpt: post.excerpt,
        };
        sourcePath = sourcePath || post.source;
        content = post.markdown || '';
      }
    }

    if (!content && sourcePath) {
      const response = await fetch(sourcePath);
      if (!response.ok) throw new Error(`Failed markdown request: ${response.status}`);
      const markdownText = await response.text();
      ({ metadata, content } = parseFrontMatter(markdownText));
    }

    if (!content) {
      throw new Error('Post not found in index');
    }

    const normalizedContent = normalizeObsidianMarkdown(normalizeQuotedCodeBlocks(content));

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

const boot = () => {
  setupCopySnippet();
  setupSectionHighlight();
  loadBlogPosts();
  loadMarkdownPost();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
