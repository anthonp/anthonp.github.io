# Blog post quick-start template

Use this folder when you want a new post with minimal edits.

## 1) Copy the template HTML

```bash
cp blog_templates/blog-post-template.html blogs/my_new_post.html
```

Then edit `blogs/my_new_post.html` and replace all `TODO:` markers.

## 2) Add your post to the blog index

Open `data/posts.json` and add a new object at the top:

```json
{
  "title": "Your Post Title",
  "date": "YYYY-MM-DD",
  "excerpt": "One sentence summary.",
  "url": "/blogs/my_new_post.html",
  "tags": ["Tag 1", "Tag 2"]
}
```

## 3) Add images

Place images in `/images` and reference them from your post like this:

```html
<img src="/images/your-image.png" alt="Describe the image">
```

## Optional: write in markdown first

You can draft in `blog_templates/post-template.md`, then paste the final text into the HTML template section marked `START ARTICLE CONTENT`.
