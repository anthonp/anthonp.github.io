import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const blogsDir = path.join(repoRoot, 'blogs');
const outputFile = path.join(repoRoot, 'data', 'posts.json');

const parseFrontMatter = (markdownText) => {
  if (!markdownText.startsWith('---')) return { metadata: {}, content: markdownText };

  const match = markdownText.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { metadata: {}, content: markdownText };

  const metadata = {};
  const lines = match[1].split('\n');
  let currentKey = null;

  for (const line of lines) {
    const listMatch = line.match(/^\s*-\s*(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(metadata[currentKey])) metadata[currentKey] = [];
      metadata[currentKey].push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    const keyValueMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!keyValueMatch) continue;

    const [, key, rawValue] = keyValueMatch;
    currentKey = key;
    const value = rawValue.trim();

    if (!value) {
      metadata[key] = '';
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      metadata[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      continue;
    }

    metadata[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return { metadata, content: markdownText.slice(match[0].length) };
};

const stripMarkdown = (content) => content
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/^>\s?/gm, '')
  .replace(/[#*_~>-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const countWords = (content) => stripMarkdown(content).split(/\s+/).filter(Boolean).length;
const estimateReadMinutes = (content) => Math.max(1, Math.round(countWords(content) / 220));

const deriveTitle = (metadata, content, fallbackName) => {
  if (metadata.title) return metadata.title;
  const heading = content.match(/^#{1,2}\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return fallbackName.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const deriveExcerpt = (metadata, content) => {
  if (metadata.excerpt) return metadata.excerpt;
  const body = stripMarkdown(content);
  return body.slice(0, 155).trim() + (body.length > 155 ? '…' : '');
};

const deriveTags = (metadata) => {
  if (Array.isArray(metadata.tags)) return metadata.tags;
  if (typeof metadata.tags === 'string' && metadata.tags.length) {
    return metadata.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const collectPosts = async () => {
  const entries = await fs.readdir(blogsDir, { withFileTypes: true });
  const markdownFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  const posts = [];
  for (const fileName of markdownFiles) {
    const filePath = path.join(blogsDir, fileName);
    const markdown = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    const { metadata, content } = parseFrontMatter(markdown);

    const fallbackDate = stats.mtime.toISOString().split('T')[0];
    const date = metadata.date && isValidDate(metadata.date) ? metadata.date : fallbackDate;
    const source = `/blogs/${fileName}`;
    const slug = fileName.replace(/\.md$/, '');
    const normalizedContent = content.trim();
    const wordCount = countWords(normalizedContent);
    const readMinutes = estimateReadMinutes(normalizedContent);

    posts.push({
      title: deriveTitle(metadata, content, fileName.replace(/\.md$/, '')),
      date,
      excerpt: deriveExcerpt(metadata, content),
      url: `/blogs/post.html?post=${slug}`,
      slug,
      source,
      markdown: normalizedContent,
      tags: deriveTags(metadata),
      readMinutes,
      wordCount,
    });
  }

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const posts = await collectPosts();
await fs.writeFile(outputFile, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
console.log(`Generated ${posts.length} posts in data/posts.json`);
