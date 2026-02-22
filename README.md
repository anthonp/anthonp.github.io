# [https://hacker-sec.com/](https://hacker-sec.com/)

## Blog authoring

Blog posts are Markdown-first and can be dropped in directly from Obsidian.

1. Add your note as a `.md` file in `blogs/`.
2. Ensure it includes front matter (`title`, `date`, `excerpt`, and optional `tags`).
3. Run `node scripts/generate-posts-index.mjs` to regenerate `data/posts.json`.
4. Open `/blogs/post.html?source=/blogs/<file>.md` to preview rendering.

The site automatically renders Markdown to HTML at runtime and supports common Obsidian syntax like wiki links (`[[...]]`) and embeds (`![[...]]`).
