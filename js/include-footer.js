(function includeFooter() {
  const mounts = document.querySelectorAll('[data-include="site-footer"]');
  if (!mounts.length) return;

  fetch('/partials/footer.html', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Unable to load footer include.');
      }
      return response.text();
    })
    .then((markup) => {
      mounts.forEach((mount) => {
        mount.innerHTML = markup;
      });
    })
    .catch(() => {
      mounts.forEach((mount) => {
        mount.innerHTML = '<footer class="site-footer"><section class="page-shell"><p class="legal-disclaimer">[ legal://notice unavailable ]</p></section></footer>';
      });
    });
})();
