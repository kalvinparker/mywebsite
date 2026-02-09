// Local script: fragment navigation + dynamic project metadata refresh
(function ($) {
  const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

  function showRegionFromHash() {
    $('.content-region').hide();
    $('.main-menu a').removeClass('active');
    const region = location.hash.toString() || $('.main-menu a:first').attr('href');
    $(region).show();
    $('.main-menu a[href="' + region + '"]').addClass('active');
    return region;
  }

  function fetchRepoMeta(owner, repo) {
    const key = `repoMeta:${owner}/${repo}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ts && (Date.now() - parsed.ts) < CACHE_TTL_MS) {
          return Promise.resolve(parsed.data);
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    return fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error('GitHub API error ' + res.status);
        return res.json();
      })
      .then(data => {
        try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch (e) { }
        return data;
      });
  }

  function updateProjectMeta() {
    $('#projects a').each(function () {
      const link = $(this).attr('href');
      if (!link) return;
      let url;
      try { url = new URL(link); } catch (e) { return; }
      if (!url.hostname.includes('github.com')) return;
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return;
      const [owner, repo] = parts;

      const $li = $(this).closest('li');
      const $meta = $li.find('.proj-meta');

      fetchRepoMeta(owner, repo)
        .then(data => {
          const lang = data.language || '';
          const stars = (typeof data.stargazers_count === 'number') ? data.stargazers_count : '';
          const updated = data.updated_at ? (new Date(data.updated_at)).toISOString().slice(0, 10) : '';
          let statsText = '';
          if (lang) statsText += `${lang} · `;
          statsText += `★ ${stars}`;
          if (updated) statsText += ` · updated ${updated}`;

          // Ensure only a single stats element exists: remove any previous then append one
          $meta.find('.proj-stats').remove();
          const $stats = $(`<div class="proj-stats" style="margin-top:0.5rem;color:#666;font-size:0.9rem"></div>`).text(statsText);
          $meta.append($stats);
        })
        .catch(() => {
          // ignore errors (rate limit, non-public repo, etc.)
        });
    });
  }

  $(window).on('load hashchange', function () {
    const region = showRegionFromHash();
    if (!region || region === '#home' || region === '') {
      updateProjectMeta();
    }
  });

  $(document).ready(function () {
    showRegionFromHash();
    updateProjectMeta();
  });

})(jQuery);
