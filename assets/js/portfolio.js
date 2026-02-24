(function () {
    'use strict';

    /* -------------------------------------------------------
       1. Wrap each article's scrollable content in .phone-content
          Status-bar stays pinned at top, home-bar at bottom,
          everything else scrolls inside.
    ------------------------------------------------------- */
    document.querySelectorAll('#main article').forEach(function (article) {

        var staticSelectors = ['.status-bar', '.home-bar', '.close'];
        var children = Array.from(article.childNodes);

        var scrollDiv = document.createElement('div');
        scrollDiv.className = 'phone-content';

        children.forEach(function (child) {
            var skip = false;
            if (child.nodeType === 1) {
                staticSelectors.forEach(function (sel) {
                    if (child.matches(sel)) skip = true;
                });
            }
            if (!skip) scrollDiv.appendChild(child);
        });

        var statusBar = article.querySelector('.status-bar');
        var homeBar = article.querySelector('.home-bar');

        article.innerHTML = '';

        if (statusBar) article.appendChild(statusBar);
        article.appendChild(scrollDiv);

        if (homeBar) {
            article.appendChild(homeBar);
        } else {
            var hb = document.createElement('div');
            hb.className = 'home-bar';
            article.appendChild(hb);
        }
    });

    /* -------------------------------------------------------
       2. Prevent double-open of the same nav section.
    ------------------------------------------------------- */
    document.querySelectorAll('#header nav a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var targetHash = link.getAttribute('href');
            if (window.location.hash === targetHash &&
                document.body.classList.contains('is-article-visible')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    });

    /* -------------------------------------------------------
       3. Live clock in status bars.
    ------------------------------------------------------- */
    function updateClocks() {
        var now = new Date();
        var timeStr = String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        document.querySelectorAll('.status-bar .time').forEach(function (el) {
            el.textContent = timeStr;
        });
    }
    updateClocks();
    setInterval(updateClocks, 30000);

    /* -------------------------------------------------------
       4. Project tip-bar accordion.

       ROOT CAUSE OF PREVIOUS BUG:
       main.js calls event.stopPropagation() on every article click,
       preventing document-level delegation from ever firing.
       FIX: Attach handlers DIRECTLY to each .proj-tip button,
       and use capture phase so we fire BEFORE article's bubble handler.
    ------------------------------------------------------- */
    function wireAccordion() {
        document.querySelectorAll('.proj-tip').forEach(function (btn) {
            // Remove any previous handler to avoid duplicates
            btn.removeEventListener('click', btn._tipHandler, true);

            btn._tipHandler = function (e) {
                e.stopPropagation(); // don't let main.js close the article

                var desc = btn.nextElementSibling; // .proj-desc
                var isOpen = btn.getAttribute('aria-expanded') === 'true';

                // Close all other panels first (one-open-at-a-time)
                document.querySelectorAll('.proj-tip[aria-expanded="true"]')
                    .forEach(function (other) {
                        if (other !== btn) {
                            other.setAttribute('aria-expanded', 'false');
                            var od = other.nextElementSibling;
                            if (od && od.classList.contains('proj-desc')) {
                                od.hidden = true;
                            }
                        }
                    });

                btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
                if (desc && desc.classList.contains('proj-desc')) {
                    desc.hidden = isOpen;
                }
            };

            btn.addEventListener('click', btn._tipHandler, true); // CAPTURE phase
        });
    }

    // Wire on first load (articles are in DOM but hidden)
    wireAccordion();

    // Re-wire on every article activation (phones open/close reset state)
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            if (m.target.classList && m.target.classList.contains('active')) {
                wireAccordion();
            }
        });
    });
    document.querySelectorAll('#main article').forEach(function (a) {
        observer.observe(a, { attributes: true, attributeFilter: ['class'] });
    });

})();
