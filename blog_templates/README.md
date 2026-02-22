# Blog post workflow (Obsidian `.md` drop-in)

Use this folder to publish posts directly from Obsidian-style Markdown notes.

## 1) Copy the Markdown template

```bash
cp blog_templates/post-template.md blogs/my_new_post.md
```

Edit `blogs/my_new_post.md` and update front matter + content. Use a real date value in `YYYY-MM-DD` format (example: `2025-01-01`).

## 2) Refresh the blog index automatically

Run:

```bash
node scripts/generate-posts-index.mjs
```

This scans every `blogs/*.md` file and rebuilds `data/posts.json`.

## 3) Add images

Place images in `/images` and reference them from Markdown:

```md
![Describe the image](/images/your-image.png)
```

Obsidian embed syntax is also supported:

```md
![[your-image.png]]
```

## How rendering works

- Blog index (`/pages/blog.html`) reads `data/posts.json`.
- Post pages route through `/blogs/post.html`.
- The renderer loads the markdown source, parses front matter, normalizes Obsidian link/embed syntax, and converts Markdown to HTML automatically.
