// Local script: fragment navigation + dynamic project metadata refresh
(function ($) {
  function showRegionFromHash() {
    $('.content-region').hide();
    $('.main-menu a').removeClass('active');
    var region = location.hash.toString() || $('.main-menu a:first').attr('href');
    $(region).show();
    $('.main-menu a[href="' + region + '"]').addClass('active');
    return region;
  }

  function updateProjectMeta() {
    $('#projects a').each(function () {
      var link = $(this).attr('href');
      if (!link) return;
      try { var url = new URL(link); } catch (e) { return; }
      if (url.hostname.indexOf('github.com') === -1) return;
      var parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return;
      var owner = parts[0], repo = parts[1];
      var apiUrl = 'https://api.github.com/repos/' + owner + '/' + repo;

      var $li = $(this).closest('li');
      var $meta = $li.find('.proj-meta');

      // Fetch repository metadata from GitHub API
      fetch(apiUrl)
        .then(function (res) {
          if (!res.ok) throw new Error('GitHub API error ' + res.status);
          return res.json();
        })
        .then(function (data) {
          var lang = data.language || '';
          var stars = typeof data.stargazers_count === 'number' ? data.stargazers_count : '';
          var updated = data.updated_at ? (new Date(data.updated_at)).toISOString().slice(0, 10) : '';
          var statsText = '';
          if (lang) statsText += lang + ' · ';
          statsText += '★ ' + stars;
          if (updated) statsText += ' · updated ' + updated;

          // Remove previous stats if present, then append
          $meta.find('.proj-stats').remove();
          var $stats = $('<div class="proj-stats" style="margin-top:0.5rem;color:#666;font-size:0.9rem"></div>');
          $stats.text(statsText);
          $meta.append($stats);
        })
        .catch(function () {
          // silently ignore errors (rate limit, non-public repo, etc.)
        });
    });
  }

  $(window).on('load hashchange', function () {
    var region = showRegionFromHash();
    if (!region || region === '#home' || region === '') {
      updateProjectMeta();
    }
  });

  // Also run once on DOM ready to cover direct loads without hash
  $(document).ready(function () {
    showRegionFromHash();
    updateProjectMeta();
  });

})(jQuery);
