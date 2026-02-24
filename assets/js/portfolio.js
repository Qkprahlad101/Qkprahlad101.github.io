(function () {
    'use strict';

    /* -------------------------------------------------------
       1. Wrap each article's scrollable content in .phone-content
          so the scrollbar stays inside the rounded phone frame.
          We keep: status-bar, close div, home-bar OUTSIDE the scroll.
    ------------------------------------------------------- */
    document.querySelectorAll('#main article').forEach(function (article) {

        // Collect children that should scroll (everything except .close which JS appends later,
        // .home-bar, and .status-bar)
        var staticSelectors = ['.status-bar', '.home-bar', '.close'];
        var children = Array.from(article.childNodes);

        // Create scroll wrapper
        var scrollDiv = document.createElement('div');
        scrollDiv.className = 'phone-content';

        // Move eligible children into scroll wrapper
        children.forEach(function (child) {
            var skip = false;
            if (child.nodeType === 1) {
                staticSelectors.forEach(function (sel) {
                    if (child.matches(sel)) skip = true;
                });
            }
            if (!skip) scrollDiv.appendChild(child);
        });

        // Insert scroll wrapper — status-bar first, then scroll div, then home-bar
        var statusBar = article.querySelector('.status-bar');
        var homeBar = article.querySelector('.home-bar');

        // Clear article (status-bar and home-bar were already moved to scrollDiv above)
        article.innerHTML = '';

        if (statusBar) article.appendChild(statusBar);
        article.appendChild(scrollDiv);
        if (homeBar) {
            article.appendChild(homeBar);
        } else {
            // Create home-bar if somehow missing
            var hb = document.createElement('div');
            hb.className = 'home-bar';
            article.appendChild(hb);
        }
    });

    /* -------------------------------------------------------
       2. Prevent double-open: if user clicks a nav link for
          the section already open, do nothing.
    ------------------------------------------------------- */
    document.querySelectorAll('#header nav a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var targetHash = link.getAttribute('href'); // e.g. "#intro"
            if (window.location.hash === targetHash && document.body.classList.contains('is-article-visible')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true); // capture phase so it fires before hashchange
    });

    /* -------------------------------------------------------
       3. Live clock in status bars
    ------------------------------------------------------- */
    function updateClocks() {
        var now = new Date();
        var h = String(now.getHours()).padStart(2, '0');
        var m = String(now.getMinutes()).padStart(2, '0');
        var timeStr = h + ':' + m;
        document.querySelectorAll('.status-bar .time').forEach(function (el) {
            el.textContent = timeStr;
        });
    }
    updateClocks();
    setInterval(updateClocks, 30000);

})();
