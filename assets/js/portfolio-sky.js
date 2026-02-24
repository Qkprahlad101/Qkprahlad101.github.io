/**
 * portfolio-sky.js — Dynamic day/night sky cycle v5.0
 * 5-stop banding-free gradient + 3 atmospheric feather layers.
 * Twinkling stars, shooting stars during dawn, live CSS accent var.
 */
(function () {
    'use strict';

    /* ── canvas setup ─────────────────────────────────────────── */
    var canvas = document.createElement('canvas');
    canvas.id = 'sky-canvas';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'z-index:1;pointer-events:none;';
    document.body.insertBefore(canvas, document.getElementById('wrapper'));
    var ctx = canvas.getContext('2d');
    var h1 = document.querySelector('#header .content .inner h1');
    var bgDiv = document.getElementById('bg');
    if (bgDiv) bgDiv.style.display = 'none';

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    /* ── helpers ──────────────────────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpRGB(c1, c2, t) {
        return [Math.round(lerp(c1[0], c2[0], t)),
        Math.round(lerp(c1[1], c2[1], t)),
        Math.round(lerp(c1[2], c2[2], t))];
    }
    function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
    function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
    function toHex(c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function sample(frames, p) {
        for (var i = 0; i < frames.length - 1; i++) {
            var a = frames[i], b = frames[i + 1];
            if (p >= a.p && p <= b.p) {
                var span = b.p - a.p;
                return { a: a, b: b, t: span < 0.0001 ? 0 : (p - a.p) / span };
            }
        }
        return { a: frames[frames.length - 1], b: frames[frames.length - 1], t: 0 };
    }

    /* ── sky keyframes ─────────────────────────────────────────── */
    // top=zenith  upr=25%  mid=horizon  lwr=75%  bot=ground
    var SKY = [
        { p: 0.00, top: [2, 4, 18], upr: [4, 6, 20], mid: [6, 8, 22], lwr: [7, 9, 23], bot: [8, 10, 25], sunC: [255, 80, 0], glowC: [255, 40, 0], stars: 1.0, atmo: [20, 25, 55, 0.14] },
        { p: 0.07, top: [5, 6, 22], upr: [10, 7, 18], mid: [20, 10, 10], lwr: [25, 10, 8], bot: [30, 10, 5], sunC: [255, 80, 0], glowC: [220, 30, 0], stars: 0.85, atmo: [50, 30, 18, 0.16] },
        { p: 0.14, top: [18, 5, 32], upr: [50, 15, 18], mid: [100, 30, 5], lwr: [145, 40, 3], bot: [180, 50, 0], sunC: [255, 120, 0], glowC: [255, 60, 0], stars: 0.4, atmo: [200, 95, 35, 0.18] },
        { p: 0.22, top: [75, 18, 95], upr: [130, 45, 15], mid: [180, 72, 18], lwr: [220, 92, 10], bot: [255, 110, 0], sunC: [255, 185, 0], glowC: [255, 100, 0], stars: 0.0, atmo: [240, 145, 65, 0.16] },
        { p: 0.30, top: [22, 78, 188], upr: [80, 100, 120], mid: [155, 118, 58], lwr: [200, 130, 30], bot: [255, 140, 0], sunC: [255, 220, 80], glowC: [255, 165, 0], stars: 0.0, atmo: [245, 195, 120, 0.13] },
        { p: 0.40, top: [16, 88, 200], upr: [35, 115, 215], mid: [62, 140, 225], lwr: [80, 155, 245], bot: [100, 165, 255], sunC: [255, 248, 200], glowC: [255, 200, 80], stars: 0.0, atmo: [190, 225, 255, 0.10] },
        { p: 0.50, top: [10, 78, 200], upr: [30, 108, 215], mid: [50, 132, 222], lwr: [65, 148, 240], bot: [80, 160, 255], sunC: [255, 255, 240], glowC: [255, 240, 150], stars: 0.0, atmo: [210, 235, 255, 0.08] },
        { p: 0.60, top: [14, 78, 194], upr: [35, 110, 215], mid: [62, 140, 225], lwr: [75, 155, 240], bot: [90, 170, 255], sunC: [255, 235, 140], glowC: [255, 210, 80], stars: 0.0, atmo: [210, 225, 255, 0.09] },
        { p: 0.70, top: [18, 58, 158], upr: [80, 72, 60], mid: [155, 88, 20], lwr: [190, 95, 14], bot: [220, 100, 10], sunC: [255, 180, 50], glowC: [255, 140, 0], stars: 0.0, atmo: [255, 185, 85, 0.15] },
        { p: 0.80, top: [55, 10, 88], upr: [100, 22, 12], mid: [145, 38, 10], lwr: [175, 50, 10], bot: [200, 60, 10], sunC: [255, 100, 30], glowC: [255, 60, 0], stars: 0.1, atmo: [255, 105, 42, 0.18] },
        { p: 0.88, top: [18, 5, 33], upr: [38, 10, 10], mid: [62, 16, 10], lwr: [82, 18, 10], bot: [100, 20, 10], sunC: [200, 40, 10], glowC: [180, 20, 0], stars: 0.5, atmo: [165, 62, 32, 0.16] },
        { p: 0.94, top: [4, 4, 18], upr: [7, 6, 18], mid: [10, 8, 18], lwr: [12, 8, 19], bot: [15, 8, 20], sunC: [100, 20, 0], glowC: [80, 10, 0], stars: 0.85, atmo: [22, 16, 36, 0.14] },
        { p: 1.00, top: [2, 4, 18], upr: [4, 6, 20], mid: [6, 8, 22], lwr: [7, 9, 23], bot: [8, 10, 25], sunC: [255, 80, 0], glowC: [255, 40, 0], stars: 1.0, atmo: [20, 25, 55, 0.14] },
    ];

    /* ── name colour keyframes ─────────────────────────────────── */
    var NAME = [
        { p: 0.00, c: [40, 60, 120] }, { p: 0.07, c: [180, 60, 0] },
        { p: 0.16, c: [255, 110, 0] }, { p: 0.24, c: [255, 200, 0] },
        { p: 0.35, c: [0, 200, 255] }, { p: 0.50, c: [255, 255, 255] },
        { p: 0.65, c: [255, 220, 80] }, { p: 0.76, c: [255, 160, 20] },
        { p: 0.84, c: [255, 80, 30] }, { p: 0.92, c: [160, 40, 20] },
        { p: 1.00, c: [40, 60, 120] },
    ];

    /* ── accent CSS var keyframes ──────────────────────────────── */
    var ACCENT = [
        { p: 0.00, c: [60, 100, 200] }, { p: 0.07, c: [200, 80, 10] },
        { p: 0.16, c: [255, 130, 0] }, { p: 0.25, c: [255, 210, 0] },
        { p: 0.35, c: [0, 210, 255] }, { p: 0.50, c: [120, 220, 255] },
        { p: 0.65, c: [255, 215, 60] }, { p: 0.76, c: [255, 165, 20] },
        { p: 0.84, c: [255, 90, 30] }, { p: 0.92, c: [180, 50, 20] },
        { p: 1.00, c: [60, 100, 200] },
    ];

    /* ── background twinkling stars ────────────────────────────── */
    var bgStars = [];
    for (var i = 0; i < 220; i++) {
        bgStars.push({ xr: Math.random(), yr: Math.random() * 0.78, r: Math.random() * 1.4 + 0.3, ph: Math.random() * Math.PI * 2 });
    }

    function drawBgStars(W, H, opacity, now) {
        if (opacity < 0.01) return;
        ctx.save();
        for (var i = 0; i < bgStars.length; i++) {
            var s = bgStars[i];
            var alpha = opacity * (0.55 + 0.45 * Math.sin(now * 0.0009 + s.ph));
            ctx.beginPath();
            ctx.arc(s.xr * W, s.yr * H, s.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
            ctx.fill();
        }
        ctx.restore();
    }

    /* ── SHOOTING STAR SYSTEM ──────────────────────────────────── */
    var shooters = [];   // active shooting stars
    var nextShoot = 0;  // timestamp for next spawn attempt

    function spawnShooter(W, H) {
        // Diagonal angle: 20-55° from horizontal, always heading downward
        var angleDeg = 20 + Math.random() * 35;
        var angle = angleDeg * Math.PI / 180;
        var dir = Math.random() < 0.65 ? 1 : -1; // 65% rightward, 35% leftward

        // Pixels per second (at 60fps → per-ms)
        var speed = (W * 0.45 + Math.random() * W * 0.30) / 1000; // ~45-75% W per second

        // Tail length in pixels
        var tailPx = 90 + Math.random() * 130;

        // Slight blue/white/yellow tint
        var tints = [[255, 255, 255], [220, 240, 255], [255, 250, 220], [200, 220, 255]];
        var col = tints[Math.floor(Math.random() * tints.length)];

        shooters.push({
            x: W * (0.05 + Math.random() * 0.90),
            y: H * (Math.random() * 0.42),      // spawn in upper 42%
            vxms: Math.cos(angle) * speed * dir,   // px/ms
            vyms: Math.sin(angle) * speed,         // px/ms (always +ve = down)
            tailPx: tailPx,
            col: col,
            ageMs: 0,
            maxMs: 700 + Math.random() * 900,       // 0.7–1.6 sec lifetime
        });
    }

    function drawShooters(W, H, starsOpacity, progress, dt) {
        // ── Spawn logic ───────────────────────────────────────────
        // Base rate during night; burst rate during dawn (sun starting to rise)
        var spawnProb = 0;
        if (starsOpacity > 0.05) {
            // Night base: 1.5 chance per second → ~0.0015 per ms * dt
            spawnProb = starsOpacity * 0.0015 * dt;

            // DAWN BURST: progress 0.05 → 0.28 (sun just rising)
            if (progress > 0.05 && progress < 0.28) {
                // Peaks at progress ~0.14 (just as sun clears horizon)
                var dawnPhase = (progress - 0.05) / 0.23; // 0-1 over the window
                var burst = Math.sin(dawnPhase * Math.PI); // smooth bell curve
                spawnProb += burst * 0.008 * dt;            // up to ~8 per sec burst
            }

            // DUSK FADE: progress 0.82-0.92 — a few falling stars as stars re-appear
            if (progress > 0.82 && progress < 0.94) {
                var duskPhase = (progress - 0.82) / 0.12;
                var dusk = Math.sin(duskPhase * Math.PI);
                spawnProb += dusk * 0.003 * dt;
            }
        }

        if (Math.random() < spawnProb && shooters.length < 6) {
            spawnShooter(W, H);
        }

        // ── Update & draw ─────────────────────────────────────────
        if (shooters.length === 0) return;
        ctx.save();

        shooters = shooters.filter(function (ss) {
            ss.ageMs += dt;
            if (ss.ageMs >= ss.maxMs) return false;

            var t = ss.ageMs / ss.maxMs;                   // 0→1 in life
            var alpha = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35; // hold bright, fade out

            // Current head position
            var hx = ss.x + ss.vxms * ss.ageMs;
            var hy = ss.y + ss.vyms * ss.ageMs;

            // Tail root — clamp tail so it doesn't go before the star was born
            var tLen = Math.min(ss.tailPx, Math.hypot(ss.vxms, ss.vyms) * ss.ageMs);
            var norm = Math.hypot(ss.vxms, ss.vyms);
            var tailDx = (ss.vxms / norm) * tLen;
            var tailDy = (ss.vyms / norm) * tLen;
            var tx = hx - tailDx;
            var ty = hy - tailDy;

            // ── Tail gradient line ──────────────────────────────
            var tailGrad = ctx.createLinearGradient(tx, ty, hx, hy);
            tailGrad.addColorStop(0, 'rgba(' + ss.col[0] + ',' + ss.col[1] + ',' + ss.col[2] + ',0)');
            tailGrad.addColorStop(0.55, 'rgba(' + ss.col[0] + ',' + ss.col[1] + ',' + ss.col[2] + ',' + (alpha * 0.25).toFixed(2) + ')');
            tailGrad.addColorStop(1, 'rgba(' + ss.col[0] + ',' + ss.col[1] + ',' + ss.col[2] + ',' + (alpha * 0.85).toFixed(2) + ')');

            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.strokeStyle = tailGrad;
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // ── Head glow halo ──────────────────────────────────
            var hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 5);
            hGrad.addColorStop(0, 'rgba(' + ss.col[0] + ',' + ss.col[1] + ',' + ss.col[2] + ',' + (alpha * 0.95).toFixed(2) + ')');
            hGrad.addColorStop(1, 'rgba(' + ss.col[0] + ',' + ss.col[1] + ',' + ss.col[2] + ',0)');
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.arc(hx, hy, 5, 0, Math.PI * 2);
            ctx.fill();

            // ── Bright core dot ─────────────────────────────────
            ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.92).toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(hx, hy, 1.5, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });

        ctx.restore();
    }

    /* ── sun on elliptical arc ─────────────────────────────────── */
    function sunPos(p, W, H) {
        var angle = Math.PI * (1 - p);
        return { x: W / 2 + W * 0.52 * Math.cos(angle), y: H - H * 0.88 * Math.sin(angle) };
    }

    /* ── MAIN DRAW LOOP ────────────────────────────────────────── */
    var CYCLE_MS = 90000;
    var startMs = Date.now();
    var lastMs = Date.now();
    var lastAccent = '';

    function draw() {
        var now = Date.now();
        var dt = clamp(now - lastMs, 1, 100); // ms since last frame, capped
        lastMs = now;
        var progress = ((now - startMs) % CYCLE_MS) / CYCLE_MS;
        var W = canvas.width, H = canvas.height;

        /* ── interpolate frame ───────────────────────────────────── */
        var s = sample(SKY, progress);
        var top = lerpRGB(s.a.top, s.b.top, s.t);
        var upr = lerpRGB(s.a.upr, s.b.upr, s.t);
        var mid = lerpRGB(s.a.mid, s.b.mid, s.t);
        var lwr = lerpRGB(s.a.lwr, s.b.lwr, s.t);
        var bot = lerpRGB(s.a.bot, s.b.bot, s.t);
        var sunC = lerpRGB(s.a.sunC, s.b.sunC, s.t);
        var glwC = lerpRGB(s.a.glowC, s.b.glowC, s.t);
        var stars = lerp(s.a.stars, s.b.stars, s.t);
        var aa = s.a.atmo, ab = s.b.atmo;
        var atmo = [Math.round(lerp(aa[0], ab[0], s.t)),
        Math.round(lerp(aa[1], ab[1], s.t)),
        Math.round(lerp(aa[2], ab[2], s.t)),
        lerp(aa[3], ab[3], s.t)];
        var sp = sunPos(progress, W, H);

        /* ── 1. 5-stop banding-free gradient ─────────────────────── */
        var grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, rgb(top));
        grad.addColorStop(0.28, rgb(upr));
        grad.addColorStop(0.50, rgb(mid));
        grad.addColorStop(0.72, rgb(lwr));
        grad.addColorStop(1, rgb(bot));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        /* ── 2. Three stacked atmospheric feather layers ─────────── */
        var ac = atmo[0] + ',' + atmo[1] + ',' + atmo[2];
        var a0 = atmo[3];

        function radLayer(cy, radius, alphaScale) {
            var g = ctx.createRadialGradient(W * 0.5, cy, 0, W * 0.5, cy, radius);
            g.addColorStop(0, 'rgba(' + ac + ',' + (a0 * alphaScale * 0.95).toFixed(3) + ')');
            g.addColorStop(0.45, 'rgba(' + ac + ',' + (a0 * alphaScale * 0.35).toFixed(3) + ')');
            g.addColorStop(1, 'rgba(' + ac + ',0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }
        radLayer(H * 0.36, W * 1.00, 0.50);
        radLayer(H * 0.50, W * 0.75, 0.42);
        radLayer(H * 0.64, W * 0.95, 0.38);

        /* ── 3. Background twinkling stars ───────────────────────── */
        drawBgStars(W, H, stars, now);

        /* ── 4. Shooting stars (with dawn burst) ─────────────────── */
        drawShooters(W, H, stars, progress, dt);

        /* ── 5. Horizon atmospheric glow (sun-side) ──────────────── */
        var sunAbove = Math.max(0, H - sp.y);
        var horizStr = clamp(sunAbove / (H * 0.25), 0, 1);
        var hG = ctx.createRadialGradient(sp.x, H * 0.92, 0, sp.x, H * 0.92, W * 0.65);
        hG.addColorStop(0, rgba(glwC, 0.26 + horizStr * 0.08));
        hG.addColorStop(0.5, rgba(glwC, 0.09));
        hG.addColorStop(1, rgba(glwC, 0));
        ctx.fillStyle = hG;
        ctx.fillRect(0, H * 0.45, W, H * 0.55);

        /* ── 6. Sun corona + disc ────────────────────────────────── */
        if (sp.y < H + 40) {
            var fade = clamp((H + 40 - sp.y) / 80, 0, 1);
            var glowR = W * 0.22 + horizStr * W * 0.08;
            var gG = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, glowR);
            gG.addColorStop(0, rgba(glwC, fade * 0.55));
            gG.addColorStop(0.35, rgba(glwC, fade * 0.20));
            gG.addColorStop(0.70, rgba(glwC, fade * 0.06));
            gG.addColorStop(1, rgba(glwC, 0));
            ctx.fillStyle = gG;
            ctx.fillRect(0, 0, W, H);

            var sunR = Math.max(6, W * 0.030);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sunR, 0, Math.PI * 2);
            ctx.fillStyle = rgb(sunC);
            ctx.fill();

            var cG = ctx.createRadialGradient(sp.x - sunR * 0.2, sp.y - sunR * 0.2, 0, sp.x, sp.y, sunR);
            cG.addColorStop(0, 'rgba(255,255,230,0.8)');
            cG.addColorStop(1, 'rgba(255,255,230,0)');
            ctx.fillStyle = cG;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sunR, 0, Math.PI * 2);
            ctx.fill();
        }

        /* ── 7. Ground vignette ──────────────────────────────────── */
        var gnd = ctx.createLinearGradient(0, H * 0.88, 0, H);
        gnd.addColorStop(0, 'rgba(0,0,0,0)');
        gnd.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = gnd;
        ctx.fillRect(0, H * 0.88, W, H * 0.12);

        /* ── 8. h1 name colour ───────────────────────────────────── */
        if (h1) {
            var ns = sample(NAME, progress);
            var nc = lerpRGB(ns.a.c, ns.b.c, ns.t);
            var c1 = toHex(nc), c2 = toHex(lerpRGB(nc, [255, 255, 255], 0.32));
            h1.style.background = 'linear-gradient(135deg,' + c1 + ' 0%,' + c2 + ' 100%)';
            h1.style.webkitBackgroundClip = 'text';
            h1.style.backgroundClip = 'text';
            h1.style.webkitTextFillColor = 'transparent';
            h1.style.filter = 'drop-shadow(0 0 12px ' + rgba(nc, 0.75) + ')';
        }

        /* ── 9. CSS --accent var (nav/section text) ──────────────── */
        var as = sample(ACCENT, progress);
        var ac2 = lerpRGB(as.a.c, as.b.c, as.t);
        var acHex = toHex(ac2);
        if (acHex !== lastAccent) {
            lastAccent = acHex;
            var acHex2 = toHex(lerpRGB(ac2, [255, 255, 255], 0.28));
            var root = document.documentElement.style;
            root.setProperty('--accent', acHex);
            root.setProperty('--accent-g', 'linear-gradient(135deg,' + acHex + ' 0%,' + acHex2 + ' 100%)');
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);

})();
