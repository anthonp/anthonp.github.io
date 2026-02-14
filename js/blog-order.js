(function orderBlogPostsNewestFirst() {
  const container = document.querySelector('.blog-list');
  if (!container) return;

  const posts = [...container.querySelectorAll('.post-item[data-published]')];
  if (posts.length < 2) return;

  posts.sort((a, b) => {
    const aDate = Date.parse(a.getAttribute('data-published') || '');
    const bDate = Date.parse(b.getAttribute('data-published') || '');
    return bDate - aDate;
  });

  posts.forEach((post) => container.appendChild(post));
})();
