// Easter egg: mini-luke, a tiny drawing of Luke, hides in a different spot on every page.
// The page picks its spot with data-spot on this script tag; joyjcai.com's slides pick by path.
(function () {
  if (document.querySelector('.luke-egg')) return;
  var me = document.currentScript;
  var want = (me && me.dataset.spot) || 'bar';
  var SLIDES = { '': 'word', experience: 'gutter-right', advisory: 'clock', tools: 'menu', blog: 'find', contact: 'gutter-left', read: 'gutter-right' };
  var q = function (s) { return document.querySelector(s); };
  var box = function (el) { var r = el && el.getBoundingClientRect(); return r && r.width ? r : null; };
  var S = 15;
  // Each spot returns the icon's top-left corner, or null when that spot isn't on screen.
  var SPOTS = {
    bar: function () {
      var n = box(q('.ft-pages, .sc-pages')), f = box(q('.ft-find, .sc-find-btn'));
      if (!n) return null;
      var x = n.right + 18;
      return f && x + S + 12 > f.left ? null : { x: x, y: innerHeight - 21 - S };
    },
    find: function () {
      var f = box(q('.ft-find, .sc-find-btn'));
      return f && { x: f.left + f.width / 2 - S / 2, y: f.top - S + 1 };
    },
    menu: function () {
      var m = box(q('.hd-menu, .sc-menu-btn')), w = box(q('.hd-word, .sc-word'));
      if (!m) return null;
      var x = m.left - S - 14;
      return w && w.right + 10 > x ? null : { x: x, y: m.top + m.height / 2 - S / 2 };
    },
    word: function () {
      var w = q('.hd-word, .sc-word'), m = box(q('.hd-menu, .sc-menu-btn'));
      if (!box(w)) return null;
      var r = document.createRange();
      r.selectNodeContents(w);
      var t = r.getBoundingClientRect(), x = t.right + 10;
      return m && x + S + 10 > m.left ? null : { x: x, y: t.top + t.height / 2 - S / 2 };
    },
    clock: function () {
      var c = box(q('.ft-clock, .sc-clock'));
      return c && { x: c.left - S - 12, y: c.top + c.height / 2 - S / 2 - 1 };
    },
    'gutter-right': function () { return { x: innerWidth - S, y: Math.round(innerHeight * 0.56) }; },
    'gutter-left': function () { return { x: 0, y: Math.round(innerHeight * 0.42) }; },
  };
  var css = document.createElement('style');
  css.textContent =
    '.luke-egg{box-sizing:content-box;position:fixed;display:block;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;width:15px;height:15px;padding:8px;margin:-8px;color:#d6d6d6;transition:color .2s ease}' +
    '.luke-egg svg{display:block;width:15px;height:15px;transform-origin:50% 100%}' +
    '.luke-egg:hover,.luke-egg:focus-visible{color:#000;outline:none}' +
    '.luke-egg:hover svg,.luke-egg:focus-visible svg{animation:luke-hop .5s ease}' +
    '@keyframes luke-hop{0%,100%{transform:none}35%{transform:translateY(-3px) rotate(-6deg)}65%{transform:translateY(0) rotate(4deg)}}' +
    '.luke-tip{position:fixed;padding:6px 10px;background:#fff;border:1px solid #e6e6e6;font-family:"IBM Plex Mono","SF Mono",Menlo,Consolas,monospace;font-size:11.5px;line-height:1.3;color:#000;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s ease}' +
    '.luke-tip.on{opacity:1}' +
    '@media (prefers-reduced-motion:reduce){.luke-egg:hover svg{animation:none}.luke-tip{transition:none}}';
  document.head.appendChild(css);
  var a = document.createElement('button');
  a.type = 'button';
  a.className = 'luke-egg';
  a.setAttribute('aria-label', 'Luke');
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8.21 4.21L7.95 4.43L7.89 4.69L8.11 5.01L8.48 5.07L8.75 4.80L8.80 4.64L8.75 4.43L8.48 4.21Z M5.12 4.21L4.85 4.48L4.85 4.80L4.96 4.96L5.17 5.07L5.39 5.07L5.71 4.80L5.71 4.48L5.44 4.21Z M2.19 1.12L1.55 1.76L0.80 2.88L0.37 3.36L0.16 3.73L0.11 4.16L0.37 4.53L0.64 4.64L1.23 4.53L1.76 4.32L2.72 4.16L2.83 4.21L2.83 5.28L2.67 5.65L2.35 6.08L1.81 7.25L1.81 7.73L1.97 7.95L1.97 8.11L1.49 9.60L1.44 10.67L1.60 10.88L1.97 10.93L2.03 12.16L2.29 13.39L2.83 14.40L3.09 14.61L3.31 14.56L3.41 14.67L3.89 15.89L4.27 17.33L4.53 18.99L4.53 20.16L4.32 20.80L3.89 21.23L3.68 21.65L3.68 22.19L3.89 22.61L4.37 22.99L5.12 23.04L5.71 22.83L6.45 22.19L6.77 21.60L6.99 20.85L7.04 18.61L8.43 17.33L8.59 17.28L8.75 17.65L8.96 18.72L9.07 20.32L8.91 20.85L8.43 21.44L8.37 22.19L8.59 22.67L9.01 22.99L9.60 23.09L10.24 22.88L10.93 22.24L11.25 21.71L11.41 21.23L11.41 19.09L11.63 17.28L12.91 16.59L13.87 16.21L14.35 17.39L15.04 18.40L15.68 19.04L16.37 19.57L17.01 19.89L17.17 20.11L17.23 20.91L17.07 21.12L16.48 21.17L16.37 21.33L16.43 21.60L16.59 21.71L17.17 21.71L17.44 21.60L17.71 21.33L17.87 20.91L17.87 20.37L17.65 19.63L17.44 19.41L16.75 19.09L16.32 18.77L15.41 17.87L14.93 17.17L14.51 16.11L14.56 16.00L15.57 15.84L16.16 17.12L16.53 17.65L17.28 18.40L18.83 19.41L19.04 20.27L19.04 20.80L18.93 21.01L18.45 21.49L18.35 21.76L18.35 22.35L18.51 22.67L18.77 22.93L19.15 23.09L19.84 23.04L20.43 22.72L20.85 22.19L21.12 20.69L21.12 19.68L20.80 18.88L20.85 18.83L21.23 19.09L21.71 19.31L22.51 19.47L23.57 19.41L23.79 19.25L23.84 19.04L23.57 18.72L22.99 18.40L22.51 17.92L21.87 16.80L21.49 15.41L21.33 13.49L21.07 12.32L20.53 11.20L20.00 10.45L18.99 9.49L18.51 9.17L17.60 8.75L16.32 8.43L13.60 8.43L12.59 8.11L12.11 7.79L11.73 6.99L10.93 5.76L10.77 5.23L10.77 4.37L10.88 4.21L11.20 4.21L12.00 4.37L12.69 4.64L13.12 4.69L13.39 4.59L13.60 4.32L13.60 3.95L13.44 3.57L12.21 1.81L11.47 1.07L10.93 0.85L10.08 0.91L9.39 1.12L8.69 1.55L8.16 1.39L4.96 1.44L4.27 1.12L3.52 0.91L2.72 0.91Z M4.96 17.12L5.76 17.97L6.45 18.56L6.40 20.53L6.24 21.28L5.92 21.81L5.28 22.35L4.69 22.45L4.53 22.40L4.32 22.19L4.27 21.81L4.85 21.12L5.07 20.59L5.12 18.99L4.96 17.65L4.85 17.33L4.85 17.17Z M11.84 8.43L12.64 8.80L13.39 9.01L13.76 9.07L16.05 9.01L17.28 9.28L18.35 9.81L19.09 10.40L19.63 10.99L20.05 11.63L20.48 12.53L20.64 13.12L20.80 14.08L20.91 15.41L21.23 16.91L21.65 17.81L22.45 18.77L22.29 18.83L21.76 18.67L21.12 18.29L20.59 17.76L20.59 16.69L20.43 16.48L20.16 16.48L20.05 16.59L19.95 16.96L19.95 18.29L20.05 18.83L20.48 19.73L20.53 20.32L20.32 21.87L20.16 22.13L19.89 22.35L19.63 22.45L19.15 22.45L18.93 22.24L18.93 21.92L19.52 21.23L19.63 20.85L19.57 19.89L19.41 19.20L19.15 18.83L18.61 18.61L17.97 18.19L16.96 17.17L16.59 16.59L16.16 15.68L15.95 14.77L15.95 14.29L15.73 13.97L15.47 13.97L15.31 14.19L15.31 14.61L15.41 14.93L15.41 15.15L15.31 15.25L14.72 15.31L13.76 15.57L12.00 16.37L11.89 16.27L12.05 15.89L12.05 15.47L11.95 15.36L11.63 15.36L11.47 15.52L11.09 16.91L10.83 18.56L10.83 19.20L10.77 19.25L10.83 21.07L10.77 21.28L10.40 21.92L9.81 22.40L9.28 22.45L9.07 22.29L8.96 22.08L8.96 21.76L9.44 21.17L9.65 20.48L9.65 19.41L9.55 18.51L9.33 17.44L9.07 16.64L9.76 15.63L10.29 14.51L10.56 14.61L10.77 14.56L10.99 14.29L11.15 13.92L11.52 12.48L11.57 10.93L12.00 10.88L12.16 10.61L12.16 9.97L11.95 9.01L11.79 8.64Z M6.40 7.04L6.45 6.88L7.20 6.88L7.31 6.99L6.83 7.47L6.72 7.47Z M3.47 5.49L4.05 6.51L4.37 7.47L4.80 8.32L5.28 8.80L5.60 9.01L6.35 9.28L7.31 9.28L7.68 9.17L8.27 8.85L8.96 8.11L9.55 6.72L10.19 5.55L10.61 6.51L10.93 6.93L10.61 6.99L10.45 7.20L10.45 7.41L10.77 7.84L11.09 8.48L11.41 9.55L11.04 9.60L10.88 9.71L10.99 11.73L10.88 12.59L10.72 13.17L10.61 13.33L10.35 13.12L10.08 13.23L9.60 14.56L8.75 16.00L8.21 16.69L7.36 17.55L6.83 17.92L6.67 17.92L6.24 17.60L5.28 16.59L4.27 15.04L3.57 13.28L3.41 13.17L3.04 13.28L2.83 12.91L2.61 11.68L2.72 9.76L2.56 9.60L2.24 9.60L2.19 9.44L2.45 8.53L3.15 7.25L3.15 7.09L2.99 6.93L2.77 6.88L2.72 6.72Z M8.37 2.03L8.80 2.35L9.55 3.57L10.13 4.11L10.08 4.37L9.71 5.17L9.07 6.19L8.43 7.73L7.79 8.43L7.20 8.64L7.09 8.59L7.09 8.05L7.63 7.57L7.95 7.04L7.95 6.67L7.79 6.45L7.15 6.24L6.56 6.24L6.08 6.35L5.76 6.56L5.71 6.67L5.76 7.20L6.03 7.63L6.45 8.05L6.45 8.59L6.40 8.64L5.71 8.32L5.23 7.79L4.96 7.25L4.69 6.40L3.73 4.64L3.52 4.11L4.11 3.57L4.75 2.51L5.07 2.19L5.44 2.03L7.25 2.08L7.84 1.97Z M4.43 1.92L3.79 2.99L3.36 3.47L2.99 3.57L1.65 3.68L0.96 3.95L0.80 3.89L1.81 2.45L2.61 1.65L2.88 1.55L3.47 1.55L3.89 1.65Z M9.28 1.92L9.76 1.65L10.29 1.49L10.83 1.49L11.20 1.65L11.79 2.29L12.85 3.89L12.69 3.95L12.11 3.73L10.51 3.52L10.03 3.20L9.49 2.19Z"/></svg>';
  var bar = q('.ft-pages, .sc-pages');
  a.style.zIndex = bar ? getComputedStyle(bar).zIndex : '140';
  document.body.appendChild(a);
  // Clicking Luke doesn't go anywhere: a small note pops up next to him, then fades.
  var tip = document.createElement('div');
  tip.className = 'luke-tip';
  tip.setAttribute('role', 'status');
  tip.style.zIndex = a.style.zIndex;
  document.body.appendChild(tip);
  var hide;
  a.addEventListener('click', function () {
    tip.textContent = 'Congrats! You found Luke.';
    var d = a.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var cx = d.left + d.width / 2, y = d.top + 8 - h - 8;
    if (y < 8) y = d.top + 8 + S + 8;
    tip.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, cx - w / 2))) + 'px';
    tip.style.top = Math.round(y) + 'px';
    tip.classList.add('on');
    clearTimeout(hide);
    hide = setTimeout(function () { tip.classList.remove('on'); }, 2600);
  });
  var place = function () {
    var spot = want === 'slides' ? SLIDES[location.pathname.split('/')[1]] || 'bar' : want;
    var p = SPOTS[spot]() || SPOTS.bar() || SPOTS['gutter-right']();
    a.style.left = Math.round(p.x) + 'px';
    a.style.top = Math.round(p.y) + 'px';
  };
  place();
  addEventListener('resize', place);
  addEventListener('popstate', function () { setTimeout(place, 60); });
  // joyjcai.com moves between slides with pushState; follow it, and let the header crumb settle first
  var push = history.pushState;
  history.pushState = function () { var out = push.apply(this, arguments); setTimeout(place, 450); return out; };
  if (document.fonts) document.fonts.ready.then(place);
  setTimeout(place, 1200);
})();
