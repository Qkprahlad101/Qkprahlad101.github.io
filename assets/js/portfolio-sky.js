/**
 * portfolio-sky.js — Dynamic day/night sky cycle
 * Sun rises bottom-left, arcs to top-center (noon), sets bottom-right.
 * Sky gradient and name color change continuously with sun position.
 */
(function () {
    'use strict';

    /* ── canvas setup ─────────────────────────────────────────────── */
    var canvas = document.createElement('canvas');
    canvas.id = 'sky-canvas';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'z-index:1;pointer-events:none;';
    document.body.insertBefore(canvas, document.getElementById('wrapper'));

    var ctx = canvas.getContext('2d');
    var h1 = document.querySelector('#header .content .inner h1');
    var bgDiv = document.getElementById('bg');
    if (bgDiv) bgDiv.style.display = 'none'; // hide old bg div

    /* ── resize ───────────────────────────────────────────────────── */
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    /* ── helpers ──────────────────────────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }

    // Each color is [r, g, b]
    function lerpRGB(c1, c2, t) {
        return [
            Math.round(lerp(c1[0], c2[0], t)),
            Math.round(lerp(c1[1], c2[1], t)),
            Math.round(lerp(c1[2], c2[2], t))
        ];
    }
    function rgba(c, a) {
        return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
    }
    function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
    function toHex(c) {
        return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
    }

    /** Find neighboring keyframes by progress and return interpolated value */
    function sample(frames, progress) {
        for (var i = 0; i < frames.length - 1; i++) {
            var a = frames[i], b = frames[i + 1];
            if (progress >= a.p && progress <= b.p) {
                var span = b.p - a.p;
                var t = span < 0.0001 ? 0 : (progress - a.p) / span;
                return { a: a, b: b, t: t };
            }
        }
        return { a: frames[frames.length - 1], b: frames[frames.length - 1], t: 0 };
    }

    /* ── sky keyframes ────────────────────────────────────────────── */
    // Each keyframe has: top (zenith colour), mid (horizon blend colour),
    // bot (low horizon colour), sunC, glowC, stars, fog (horizon fog rgba)
    var SKY = [
        { p: 0.00, top: [2, 4, 18], mid: [5, 8, 22], bot: [8, 10, 25], sunC: [255, 80, 0], glowC: [255, 40, 0], stars: 1.0, fog: [10, 15, 40, 0.18] }, // deep night
        { p: 0.07, top: [5, 6, 22], mid: [18, 8, 12], bot: [30, 10, 5], sunC: [255, 80, 0], glowC: [220, 30, 0], stars: 0.85, fog: [40, 20, 15, 0.20] }, // pre-dawn
        { p: 0.14, top: [20, 5, 35], mid: [100, 28, 5], bot: [180, 50, 0], sunC: [255, 120, 0], glowC: [255, 60, 0], stars: 0.4, fog: [200, 90, 30, 0.22] }, // dawn
        { p: 0.22, top: [80, 20, 100], mid: [180, 70, 20], bot: [255, 110, 0], sunC: [255, 185, 0], glowC: [255, 100, 0], stars: 0.0, fog: [255, 140, 60, 0.20] }, // sunrise
        { p: 0.30, top: [25, 80, 190], mid: [160, 120, 60], bot: [255, 140, 0], sunC: [255, 220, 80], glowC: [255, 165, 0], stars: 0.0, fog: [255, 200, 120, 0.16] }, // early morning
        { p: 0.40, top: [18, 90, 200], mid: [60, 140, 220], bot: [100, 165, 255], sunC: [255, 248, 200], glowC: [255, 200, 80], stars: 0.0, fog: [180, 220, 255, 0.12] }, // mid-morning
        { p: 0.50, top: [10, 80, 200], mid: [50, 130, 220], bot: [80, 160, 255], sunC: [255, 255, 240], glowC: [255, 240, 150], stars: 0.0, fog: [200, 230, 255, 0.10] }, // noon
        { p: 0.60, top: [15, 80, 195], mid: [60, 140, 225], bot: [90, 170, 255], sunC: [255, 235, 140], glowC: [255, 210, 80], stars: 0.0, fog: [200, 220, 255, 0.10] }, // afternoon
        { p: 0.70, top: [20, 60, 160], mid: [160, 85, 20], bot: [220, 100, 10], sunC: [255, 180, 50], glowC: [255, 140, 0], stars: 0.0, fog: [255, 180, 80, 0.18] }, // golden hour
        { p: 0.80, top: [60, 10, 90], mid: [140, 35, 10], bot: [200, 60, 10], sunC: [255, 100, 30], glowC: [255, 60, 0], stars: 0.1, fog: [255, 100, 40, 0.22] }, // sunset
        { p: 0.88, top: [20, 5, 35], mid: [60, 15, 10], bot: [100, 20, 10], sunC: [200, 40, 10], glowC: [180, 20, 0], stars: 0.5, fog: [160, 60, 30, 0.20] }, // dusk
        { p: 0.94, top: [4, 4, 18], mid: [10, 8, 18], bot: [15, 8, 20], sunC: [100, 20, 0], glowC: [80, 10, 0], stars: 0.85, fog: [20, 15, 35, 0.18] }, // twilight
        { p: 1.00, top: [2, 4, 18], mid: [5, 8, 22], bot: [8, 10, 25], sunC: [255, 80, 0], glowC: [255, 40, 0], stars: 1.0, fog: [10, 15, 40, 0.18] }, // night again
    ];

    /* ── name colour keyframes ────────────────────────────────────── */
    var NAME = [
        { p: 0.00, c: [40, 60, 120] }, // night muted blue
        { p: 0.07, c: [180, 60, 0] }, // pre-dawn orange
        { p: 0.16, c: [255, 110, 0] }, // dawn orange
        { p: 0.24, c: [255, 200, 0] }, // golden yellow at sunrise
        { p: 0.35, c: [0, 200, 255] }, // morning — back to cyan accent
        { p: 0.50, c: [255, 255, 255] }, // noon — blazing white
        { p: 0.65, c: [255, 220, 80] }, // afternoon golden
        { p: 0.76, c: [255, 160, 20] }, // golden hour amber
        { p: 0.84, c: [255, 80, 30] }, // sunset red-orange
        { p: 0.92, c: [160, 40, 20] }, // dusk red
        { p: 1.00, c: [40, 60, 120] }, // night
    ];

    /* ── stars (pre-generated) ────────────────────────────────────── */
    var NUM_STARS = 220;
    var starData = [];
    for (var i = 0; i < NUM_STARS; i++) {
        starData.push({
            xr: Math.random(),              // fraction of width
            yr: Math.random() * 0.78,       // top 78% of height
            radius: Math.random() * 1.4 + 0.3,
            phase: Math.random() * Math.PI * 2
        });
    }

    /* ── sun position along arc ───────────────────────────────────── */
    // Elliptical arc: center at (W/2, H), semi-axis Rx = W*0.52, Ry = H*0.88
    // angle goes from π (left) → 0 (right) as progress 0→1
    function sunPos(progress, W, H) {
        var angle = Math.PI * (1 - progress);
        var Rx = W * 0.52;
        var Ry = H * 0.88;
        return {
            x: W / 2 + Rx * Math.cos(angle),
            y: H - Ry * Math.sin(angle)
        };
    }

    /* ── draw stars ───────────────────────────────────────────────── */
    function drawStars(W, H, opacity, now) {
        if (opacity < 0.01) return;
        ctx.save();
        for (var i = 0; i < starData.length; i++) {
            var s = starData[i];
            var twk = 0.55 + 0.45 * Math.sin(now * 0.0009 + s.phase);
            var alpha = opacity * twk;
            ctx.beginPath();
            ctx.arc(s.xr * W, s.yr * H, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
            ctx.fill();
        }
        ctx.restore();
    }

    /* ── main draw loop ───────────────────────────────────────────── */
    var CYCLE_MS = 90000; // 90-second full day cycle
    var startMs = Date.now();

    function draw() {
        var now = Date.now();
        var elapsed = (now - startMs) % CYCLE_MS;
        var progress = elapsed / CYCLE_MS;
        var W = canvas.width, H = canvas.height;

        // Interpolate sky keyframe
        var s = sample(SKY, progress);
        var top = lerpRGB(s.a.top, s.b.top, s.t);
        var bot = lerpRGB(s.a.bot, s.b.bot, s.t);
        var sunC = lerpRGB(s.a.sunC, s.b.sunC, s.t);
        var glwC = lerpRGB(s.a.glowC, s.b.glowC, s.t);
        var stars = lerp(s.a.stars, s.b.stars, s.t);

        // Sun position
        var sp = sunPos(progress, W, H);

        // Interpolate the mid-horizon colour too
        var mid = lerpRGB(s.a.mid, s.b.mid, s.t);
        // Fog colour for horizon feather
        var fogA = s.a.fog, fogB = s.b.fog;
        var fog = [
            Math.round(lerp(fogA[0], fogB[0], s.t)),
            Math.round(lerp(fogA[1], fogB[1], s.t)),
            Math.round(lerp(fogA[2], fogB[2], s.t)),
            lerp(fogA[3], fogB[3], s.t)
        ];

        // ── 1. Sky gradient (3 stops for smooth banding-free look) ─
        var grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, rgb(top));
        grad.addColorStop(0.52, rgb(mid));  // smooth horizon blend point
        grad.addColorStop(1, rgb(bot));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ── 1b. Horizon feather / fog overlay ─────────────────────
        // A wide, very soft radial smear at the horizon line
        var horizY = H * 0.52;
        var fogGrad = ctx.createRadialGradient(
            W / 2, horizY, 0,
            W / 2, horizY, W * 0.8
        );
        fogGrad.addColorStop(0, 'rgba(' + fog[0] + ',' + fog[1] + ',' + fog[2] + ',' + fog[3].toFixed(2) + ')');
        fogGrad.addColorStop(0.5, 'rgba(' + fog[0] + ',' + fog[1] + ',' + fog[2] + ',' + (fog[3] * 0.4).toFixed(2) + ')');
        fogGrad.addColorStop(1, 'rgba(' + fog[0] + ',' + fog[1] + ',' + fog[2] + ',0)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, horizY * 0.5, W, H - horizY * 0.5);

        // ── 2. Stars ─────────────────────────────────────────────
        drawStars(W, H, stars, now);

        // ── 3. Atmospheric horizon glow (centred on where sun is) ─
        var sunAbove = H - sp.y;            // pixels above horizon
        var horizStr = Math.max(0, Math.min(1, sunAbove / (H * 0.25)));

        var hGrad = ctx.createRadialGradient(sp.x, H * 0.92, 0, sp.x, H * 0.92, W * 0.65);
        hGrad.addColorStop(0, rgba(glwC, 0.28 + horizStr * 0.08));
        hGrad.addColorStop(0.5, rgba(glwC, 0.10));
        hGrad.addColorStop(1, rgba(glwC, 0));
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, H * 0.45, W, H * 0.55);

        // ── 4. Sun glow corona ────────────────────────────────────
        if (sp.y < H + 40) {                       // only when (nearly) visible
            var glowR = W * 0.22 + horizStr * W * 0.08;
            var fade = Math.max(0, Math.min(1, (H + 40 - sp.y) / 80));
            var gGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, glowR);
            gGrad.addColorStop(0, rgba(glwC, fade * 0.55));
            gGrad.addColorStop(0.35, rgba(glwC, fade * 0.20));
            gGrad.addColorStop(0.70, rgba(glwC, fade * 0.06));
            gGrad.addColorStop(1, rgba(glwC, 0));
            ctx.fillStyle = gGrad;
            ctx.fillRect(0, 0, W, H);

            // ── 5. Sun disc ───────────────────────────────────────
            var sunR = Math.max(6, W * 0.030);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sunR, 0, Math.PI * 2);
            ctx.fillStyle = rgb(sunC);
            ctx.fill();

            // Inner bright highlight
            var coreGrad = ctx.createRadialGradient(
                sp.x - sunR * 0.2, sp.y - sunR * 0.2, 0,
                sp.x, sp.y, sunR
            );
            coreGrad.addColorStop(0, 'rgba(255,255,230,0.8)');
            coreGrad.addColorStop(1, 'rgba(255,255,230,0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sunR, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── 6. Ground / land silhouette ───────────────────────────
        var ground = ctx.createLinearGradient(0, H * 0.88, 0, H);
        ground.addColorStop(0, rgba([0, 0, 0], 0));
        ground.addColorStop(1, rgba([0, 0, 0], 0.55));
        ctx.fillStyle = ground;
        ctx.fillRect(0, H * 0.88, W, H * 0.12);

        // ── 7. Update h1 name colour ─────────────────────────────
        if (h1) {
            var ns = sample(NAME, progress);
            var nc = lerpRGB(ns.a.c, ns.b.c, ns.t);
            var col1 = toHex(nc);
            // second colour slightly lighter
            var col2 = toHex(lerpRGB(nc, [255, 255, 255], 0.3));
            h1.style.background = 'linear-gradient(135deg,' + col1 + ' 0%,' + col2 + ' 100%)';
            h1.style.webkitBackgroundClip = 'text';
            h1.style.backgroundClip = 'text';
            h1.style.webkitTextFillColor = 'transparent';
            h1.style.filter = 'drop-shadow(0 0 10px ' + rgba(nc, 0.7) + ')';
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);

})();
