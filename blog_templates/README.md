# Blog post quick-start template (Markdown-first)

Use this folder to publish posts from Obsidian-style `.md` files.

## 1) Copy the Markdown template

```bash
cp blog_templates/post-template.md blogs/my_new_post.md
```

Edit `blogs/my_new_post.md` and update front matter + content.

## 2) Register the post in the index

Add an object to `data/posts.json`:

```json
{
  "title": "Your Post Title",
  "date": "YYYY-MM-DD",
  "excerpt": "One sentence summary.",
  "url": "/blogs/post.html?source=/blogs/my_new_post.md",
  "source": "/blogs/my_new_post.md",
  "tags": ["Tag 1", "Tag 2"]
}
```

## 3) Add images

Place images in `/images` and reference them from Markdown:

```md
![Describe the image](/images/your-image.png)
```

## How rendering works

- Blog index (`/pages/blog.html`) reads `data/posts.json`.
- Post pages route through `/blogs/post.html`.
- The renderer loads the `source` markdown file, parses front matter, and converts Markdown to HTML automatically.
