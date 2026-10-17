/* ============================================================
 * 动物插画（原创 SVG，无任何第三方形象）
 * 带渐变、眼神光、腮红、胡须等细节
 * viewBox = 0 0 240 240
 * ============================================================ */

var AQ = AQ || {};

(function () {

  function hex2rgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function tint(hex, t) {
    var c = hex2rgb(hex);
    return 'rgb(' + c.map(function (v) {
      return Math.round(v + (255 - v) * t);
    }).join(',') + ')';
  }

  function shade(hex, t) {
    var c = hex2rgb(hex);
    return 'rgb(' + c.map(function (v) {
      return Math.round(v * (1 - t));
    }).join(',') + ')';
  }

  function radial(id, inner, mid, outer) {
    return '<defs><radialGradient id="' + id + '" cx="35%" cy="24%" r="88%">' +
      '<stop offset="0" stop-color="' + inner + '"/>' +
      '<stop offset="0.55" stop-color="' + mid + '"/>' +
      '<stop offset="1" stop-color="' + outer + '"/>' +
      '</radialGradient></defs>';
  }

  function grad(id, base) {
    return radial(id, tint(base, 0.42), base, shade(base, 0.12));
  }

  function shadow(rx) {
    return '<ellipse cx="120" cy="212" rx="' + (rx || 62) + '" ry="9" fill="rgba(0,0,0,0.07)"/>';
  }

  function eye(x, y, r, c, lid) {
    var s = '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (r * 0.94) + '" ry="' + r + '" fill="' + c.ink + '"/>' +
      '<circle cx="' + (x - r * 0.32) + '" cy="' + (y - r * 0.38) + '" r="' + (r * 0.34) + '" fill="#ffffff" opacity=".92"/>';
    if (lid) {
      s += '<path d="M' + (x - r * 1.15) + ' ' + (y - r * 1.05) + ' q' + (r * 1.15) + ' ' + (-r * 0.55) +
        ' ' + (r * 2.3) + ' 0" stroke="' + c.ink + '" stroke-width="' + (r * 0.55) + '" fill="none" stroke-linecap="round" opacity=".55"/>';
    }
    return s;
  }

  function blush(x, y, rx, ry, c) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + c.pink + '" opacity=".26"/>';
  }

  function whiskers(cx, cy, c, spread) {
    var s = '', w = spread || 34, gap = 7;
    for (var i = -1; i <= 1; i++) {
      s += '<path d="M' + (cx - w) + ' ' + (cy + i * gap) + ' h' + (w - 6) + '" stroke="' + c.ink +
        '" stroke-width="1.6" stroke-linecap="round" opacity=".28"/>';
      s += '<path d="M' + (cx + 6) + ' ' + (cy + i * gap) + ' h' + (w - 6) + '" stroke="' + c.ink +
        '" stroke-width="1.6" stroke-linecap="round" opacity=".28"/>';
    }
    return s;
  }

  AQ.ART = {

    capybara: function (c) {
      return grad('g-capy', c.main) + shadow(64) +
        '<ellipse cx="74" cy="88" rx="16" ry="14" fill="' + c.dark + '"/>' +
        '<ellipse cx="166" cy="88" rx="16" ry="14" fill="' + c.dark + '"/>' +
        '<ellipse cx="74" cy="88" rx="7" ry="6" fill="' + c.light + '"/>' +
        '<ellipse cx="166" cy="88" rx="7" ry="6" fill="' + c.light + '"/>' +
        '<rect x="40" y="74" width="160" height="126" rx="58" fill="url(#g-capy)"/>' +
        '<path d="M104 76 q8 -9 16 0 q8 -9 16 0" stroke="' + c.dark + '" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".45"/>' +
        '<ellipse cx="120" cy="170" rx="47" ry="28" fill="' + c.light + '"/>' +
        '<ellipse cx="107" cy="165" rx="4.5" ry="3.4" fill="' + c.ink + '" opacity=".38"/>' +
        '<ellipse cx="133" cy="165" rx="4.5" ry="3.4" fill="' + c.ink + '" opacity=".38"/>' +
        '<path d="M112 181 q8 6 16 0" stroke="' + c.ink + '" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".35"/>' +
        eye(96, 126, 6.5, c) + eye(144, 126, 6.5, c) +
        blush(76, 152, 11, 6, c) + blush(164, 152, 11, 6, c);
    },

    macaque: function (c) {
      return grad('g-mac', c.main) + shadow(62) +
        '<circle cx="50" cy="122" r="26" fill="' + c.main + '"/>' +
        '<circle cx="190" cy="122" r="26" fill="' + c.main + '"/>' +
        '<circle cx="50" cy="122" r="13" fill="' + c.light + '"/>' +
        '<circle cx="190" cy="122" r="13" fill="' + c.light + '"/>' +
        '<circle cx="120" cy="120" r="74" fill="url(#g-mac)"/>' +
        '<path d="M120 48 q-14 -16 -30 -4 q12 0 16 12" fill="' + c.dark + '" opacity=".4"/>' +
        '<ellipse cx="120" cy="136" rx="47" ry="51" fill="' + c.light + '"/>' +
        '<path d="M92 104 q10 -9 22 -3" stroke="' + c.dark + '" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".32"/>' +
        '<path d="M126 101 q12 -6 22 3" stroke="' + c.dark + '" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".32"/>' +
        eye(102, 116, 6, c) + eye(138, 116, 6, c) +
        '<ellipse cx="120" cy="148" rx="15" ry="9" fill="' + c.dark + '" opacity=".18"/>' +
        '<circle cx="114" cy="147" r="2.4" fill="' + c.ink + '" opacity=".7"/>' +
        '<circle cx="126" cy="147" r="2.4" fill="' + c.ink + '" opacity=".7"/>' +
        '<path d="M108 162 q12 9 24 0" stroke="' + c.ink + '" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".75"/>' +
        blush(84, 146, 11, 6, c) + blush(156, 146, 11, 6, c);
    },

    tibetanfox: function (c) {
      return grad('g-fox', c.main) + shadow(60) +
        '<path d="M62 82 L48 18 L100 58 Z" fill="' + c.main + '"/>' +
        '<path d="M178 82 L192 18 L140 58 Z" fill="' + c.main + '"/>' +
        '<path d="M68 74 L60 38 L88 58 Z" fill="' + c.dark + '" opacity=".5"/>' +
        '<path d="M172 74 L180 38 L152 58 Z" fill="' + c.dark + '" opacity=".5"/>' +
        '<rect x="58" y="62" width="124" height="122" rx="21" fill="url(#g-fox)"/>' +
        '<path d="M58 122 q-8 20 8 32 q6 -18 12 -28 Z" fill="' + c.light + '" opacity=".5"/>' +
        '<path d="M182 122 q8 20 -8 32 q-6 -18 -12 -28 Z" fill="' + c.light + '" opacity=".5"/>' +
        '<path d="M108 150 L132 150 L134 186 q-14 18 -28 0 Z" fill="' + c.light + '"/>' +
        '<ellipse cx="120" cy="190" rx="8.5" ry="6" fill="' + c.ink + '"/>' +
        '<path d="M120 196 v7" stroke="' + c.ink + '" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>' +
        '<ellipse cx="94" cy="118" rx="5.5" ry="6" fill="' + c.ink + '"/>' +
        '<ellipse cx="146" cy="118" rx="5.5" ry="6" fill="' + c.ink + '"/>' +
        '<circle cx="92.5" cy="116" r="1.7" fill="#ffffff" opacity=".9"/>' +
        '<circle cx="144.5" cy="116" r="1.7" fill="#ffffff" opacity=".9"/>' +
        '<path d="M82 102 L110 98" stroke="' + c.dark + '" stroke-width="4" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M158 102 L130 98" stroke="' + c.dark + '" stroke-width="4" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M84 132 q10 5 20 2" stroke="' + c.dark + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".25"/>';
    },

    possum: function (c) {
      return grad('g-pos', c.main) + shadow(58) +
        '<circle cx="70" cy="82" r="20" fill="' + c.dark + '"/>' +
        '<circle cx="170" cy="82" r="20" fill="' + c.dark + '"/>' +
        '<circle cx="70" cy="82" r="10" fill="' + c.light + '"/>' +
        '<circle cx="170" cy="82" r="10" fill="' + c.light + '"/>' +
        '<ellipse cx="120" cy="132" rx="68" ry="66" fill="url(#g-pos)"/>' +
        '<ellipse cx="120" cy="140" rx="52" ry="50" fill="' + c.light + '" opacity=".28"/>' +
        '<circle cx="100" cy="120" r="13" fill="' + c.light + '" stroke="' + c.dark + '" stroke-width="3.5"/>' +
        '<circle cx="140" cy="120" r="13" fill="' + c.light + '" stroke="' + c.dark + '" stroke-width="3.5"/>' +
        eye(100, 120, 5, c) + eye(140, 120, 5, c) +
        '<path d="M120 158 q-26 6 -24 26 q2 20 24 20 q22 0 24 -20 q2 -20 -24 -26 Z" fill="' + c.light + '"/>' +
        '<ellipse cx="120" cy="180" rx="8" ry="6" fill="' + c.pink + '"/>' +
        '<ellipse cx="117" cy="179" rx="1.7" ry="1.3" fill="' + c.ink + '" opacity=".65"/>' +
        '<ellipse cx="123" cy="179" rx="1.7" ry="1.3" fill="' + c.ink + '" opacity=".65"/>' +
        '<path d="M112 190 q8 6 16 0" stroke="' + c.ink + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".65"/>' +
        whiskers(120, 182, c, 30);
    },

    honeybadger: function (c) {
      return grad('g-hon', c.main) + shadow(70) +
        '<circle cx="60" cy="92" r="14" fill="' + c.dark + '"/>' +
        '<circle cx="180" cy="92" r="14" fill="' + c.dark + '"/>' +
        '<ellipse cx="120" cy="132" rx="80" ry="60" fill="url(#g-hon)"/>' +
        '<path d="M110 78 q10 -14 20 0 q-4 26 -10 40 q-6 -14 -10 -40 Z" fill="' + c.light + '"/>' +
        '<ellipse cx="120" cy="120" rx="74" ry="16" fill="' + c.dark + '"/>' +
        '<circle cx="94" cy="120" r="6.5" fill="' + c.light + '"/>' +
        '<circle cx="146" cy="120" r="6.5" fill="' + c.light + '"/>' +
        '<circle cx="94" cy="120" r="3" fill="' + c.ink + '"/>' +
        '<circle cx="146" cy="120" r="3" fill="' + c.ink + '"/>' +
        '<ellipse cx="120" cy="162" rx="19" ry="14" fill="' + c.light + '"/>' +
        '<ellipse cx="120" cy="157" rx="7" ry="5" fill="' + c.ink + '"/>' +
        '<path d="M120 166 v5 M112 174 q8 6 16 0" stroke="' + c.ink + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>';
    },

    marmot: function (c) {
      return grad('g-mar', c.main) + shadow(62) +
        '<circle cx="76" cy="78" r="20" fill="' + c.main + '"/>' +
        '<circle cx="164" cy="78" r="20" fill="' + c.main + '"/>' +
        '<circle cx="76" cy="78" r="9.5" fill="' + c.light + '"/>' +
        '<circle cx="164" cy="78" r="9.5" fill="' + c.light + '"/>' +
        '<circle cx="120" cy="126" r="72" fill="url(#g-mar)"/>' +
        '<ellipse cx="86" cy="152" rx="18" ry="14" fill="' + c.light + '" opacity=".5"/>' +
        '<ellipse cx="154" cy="152" rx="18" ry="14" fill="' + c.light + '" opacity=".5"/>' +
        '<ellipse cx="120" cy="166" rx="34" ry="25" fill="' + c.light + '"/>' +
        eye(98, 116, 6, c) + eye(142, 116, 6, c) +
        '<ellipse cx="120" cy="157" rx="7" ry="5" fill="' + c.ink + '"/>' +
        '<rect x="111" y="164" width="8" height="13" rx="2.5" fill="#fffdf8"/>' +
        '<rect x="121" y="164" width="8" height="13" rx="2.5" fill="#fffdf8"/>' +
        '<path d="M120 177 q0 10 -9 13 M120 177 q0 10 9 13" stroke="' + c.ink + '" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/>' +
        whiskers(120, 160, c, 32);
    },

    tuxedocat: function (c) {
      return radial('g-tux', '#ffffff', c.light, shade(c.light, 0.08)) + shadow(62) +
        '<path d="M56 100 L70 38 L112 78 Z" fill="' + c.main + '"/>' +
        '<path d="M184 100 L170 38 L128 78 Z" fill="' + c.main + '"/>' +
        '<path d="M78 88 L84 58 L104 78 Z" fill="' + c.pink + '"/>' +
        '<path d="M162 88 L156 58 L136 78 Z" fill="' + c.pink + '"/>' +
        '<circle cx="120" cy="128" r="70" fill="url(#g-tux)"/>' +
        '<path d="M120 58 a70 70 0 0 1 62 100 a70 70 0 0 0 -62 -64 Z" fill="' + c.main + '"/>' +
        '<ellipse cx="96" cy="120" rx="21" ry="18" fill="' + c.main + '"/>' +
        '<circle cx="96" cy="120" r="7.5" fill="' + c.light + '"/>' +
        '<circle cx="96" cy="120" r="3.8" fill="' + c.ink + '"/>' +
        '<circle cx="94" cy="118" r="1.3" fill="#ffffff"/>' +
        eye(142, 120, 7, c) +
        '<ellipse cx="120" cy="146" rx="16" ry="12" fill="' + c.light + '"/>' +
        '<path d="M120 140 l-7 5 h14 Z" fill="' + c.pink + '"/>' +
        '<path d="M120 145 v5 M112 152 q8 7 16 0" stroke="' + c.ink + '" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>' +
        whiskers(120, 152, c, 36) +
        blush(76, 146, 10, 5, c) + blush(164, 146, 10, 5, c);
    },

    golden: function (c) {
      return grad('g-gol', c.main) + shadow(64) +
        '<ellipse cx="56" cy="134" rx="25" ry="54" fill="' + c.dark + '" transform="rotate(-12 56 134)"/>' +
        '<ellipse cx="184" cy="134" rx="25" ry="54" fill="' + c.dark + '" transform="rotate(12 184 134)"/>' +
        '<circle cx="120" cy="124" r="68" fill="url(#g-gol)"/>' +
        '<ellipse cx="120" cy="164" rx="38" ry="30" fill="' + c.light + '"/>' +
        eye(98, 116, 7, c) + eye(142, 116, 7, c) +
        '<circle cx="84" cy="100" r="3" fill="' + c.dark + '" opacity=".35"/>' +
        '<circle cx="156" cy="100" r="3" fill="' + c.dark + '" opacity=".35"/>' +
        '<ellipse cx="120" cy="152" rx="12" ry="9" fill="' + c.ink + '"/>' +
        '<path d="M120 161 q0 14 -12 15 M120 161 q0 14 12 15" stroke="' + c.ink + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>' +
        '<path d="M118 172 q4 18 12 14 q6 -4 2 -12" fill="' + c.pink + '"/>' +
        '<path d="M120 172 q0 18 10 14" stroke="' + c.pink + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
    },

    border: function (c) {
      var earLight = shade(c.light, 0.1);
      var earInner = shade(c.light, 0.22);
      return radial('g-bor', '#ffffff', c.light, shade(c.light, 0.06)) + shadow(62) +
        '<path d="M60 96 L72 32 L114 74 Z" fill="' + c.main + '"/>' +
        '<path d="M180 96 L168 32 L126 74 Z" fill="' + earLight + '"/>' +
        '<path d="M70 88 L76 50 L100 72 Z" fill="' + c.dark + '" opacity=".3"/>' +
        '<path d="M172 88 L166 50 L142 72 Z" fill="' + earInner + '"/>' +
        '<circle cx="120" cy="126" r="68" fill="url(#g-bor)"/>' +
        '<path d="M120 58 a68 68 0 0 0 0 136 Z" fill="' + c.main + '"/>' +
        '<circle cx="98" cy="118" r="7.5" fill="' + c.light + '"/>' +
        '<circle cx="98" cy="118" r="3.6" fill="' + c.ink + '"/>' +
        '<circle cx="96.5" cy="116" r="1.3" fill="#ffffff"/>' +
        eye(142, 118, 7, c) +
        '<ellipse cx="120" cy="152" rx="14" ry="11" fill="' + c.light + '"/>' +
        '<ellipse cx="120" cy="150" rx="7" ry="5.5" fill="' + c.ink + '"/>' +
        '<path d="M120 156 v6 M112 164 q8 6 16 0" stroke="' + c.ink + '" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>' +
        '<path d="M116 170 q4 12 10 9" stroke="' + c.pink + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M84 100 q14 -10 28 -2" stroke="' + c.light + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>';
    },

    orange: function (c) {
      return grad('g-ora', c.main) + shadow(62) +
        '<path d="M58 100 L72 40 L112 78 Z" fill="' + c.main + '"/>' +
        '<path d="M182 100 L168 40 L128 78 Z" fill="' + c.main + '"/>' +
        '<path d="M78 88 L84 58 L104 78 Z" fill="' + c.pink + '"/>' +
        '<path d="M162 88 L156 58 L136 78 Z" fill="' + c.pink + '"/>' +
        '<circle cx="120" cy="130" r="68" fill="url(#g-ora)"/>' +
        '<path d="M110 80 q5 -13 13 0" stroke="' + c.dark + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>' +
        '<path d="M124 78 q5 -13 13 0" stroke="' + c.dark + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>' +
        '<path d="M72 134 h15 M153 134 h15" stroke="' + c.dark + '" stroke-width="5" stroke-linecap="round" opacity=".45"/>' +
        eye(98, 122, 7, c) + eye(142, 122, 7, c) +
        '<ellipse cx="120" cy="146" rx="16" ry="12" fill="' + c.light + '"/>' +
        '<path d="M120 141 l-7.5 6 h15 Z" fill="' + c.pink + '"/>' +
        '<path d="M120 147 v5 M112 154 q8 6 16 0" stroke="' + c.ink + '" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>' +
        whiskers(120, 154, c, 36) +
        blush(74, 148, 11, 6, c) + blush(166, 148, 11, 6, c);
    },

    /* ---------- 隐藏款 ---------- */

    owl: function (c) {
      var rim = shade(c.main, 0.18);
      return grad('g-owl', c.main) + shadow(64) +
        '<path d="M62 82 L50 26 L96 60 Z" fill="' + c.main + '"/>' +
        '<path d="M178 82 L190 26 L144 60 Z" fill="' + c.main + '"/>' +
        '<path d="M68 74 L60 42 L86 60 Z" fill="' + c.light + '" opacity=".22"/>' +
        '<path d="M172 74 L180 42 L154 60 Z" fill="' + c.light + '" opacity=".22"/>' +
        '<ellipse cx="120" cy="128" rx="74" ry="70" fill="url(#g-owl)"/>' +
        '<circle cx="94" cy="118" r="30" fill="' + c.light + '" stroke="' + rim + '" stroke-width="3"/>' +
        '<circle cx="146" cy="118" r="30" fill="' + c.light + '" stroke="' + rim + '" stroke-width="3"/>' +
        '<circle cx="94" cy="118" r="11" fill="' + c.ink + '"/>' +
        '<circle cx="146" cy="118" r="11" fill="' + c.ink + '"/>' +
        '<circle cx="98" cy="113" r="4" fill="#ffffff" opacity=".92"/>' +
        '<circle cx="150" cy="113" r="4" fill="#ffffff" opacity=".92"/>' +
        '<circle cx="90" cy="124" r="1.8" fill="#ffffff" opacity=".55"/>' +
        '<circle cx="142" cy="124" r="1.8" fill="#ffffff" opacity=".55"/>' +
        '<path d="M120 138 l-9 14 h18 Z" fill="' + c.pink + '"/>' +
        '<path d="M120 152 v5" stroke="' + c.ink + '" stroke-width="2" stroke-linecap="round" opacity=".35"/>' +
        '<path d="M92 176 q28 12 56 0" stroke="' + c.light + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".38"/>' +
        '<path d="M97 190 q23 10 46 0" stroke="' + c.light + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".24"/>';
    },

    fox: function (c) {
      return grad('g-fx', c.main) + shadow(60) +
        '<path d="M62 100 L52 34 L104 72 Z" fill="' + c.main + '"/>' +
        '<path d="M178 100 L188 34 L136 72 Z" fill="' + c.main + '"/>' +
        '<path d="M70 90 L64 52 L92 74 Z" fill="' + c.light + '" opacity=".85"/>' +
        '<path d="M170 90 L176 52 L148 74 Z" fill="' + c.light + '" opacity=".85"/>' +
        '<ellipse cx="120" cy="128" rx="66" ry="60" fill="url(#g-fx)"/>' +
        '<path d="M60 132 q10 26 34 34 q-6 -24 -14 -36 Z" fill="' + c.light + '" opacity=".75"/>' +
        '<path d="M180 132 q-10 26 -34 34 q6 -24 14 -36 Z" fill="' + c.light + '" opacity=".75"/>' +
        '<ellipse cx="120" cy="158" rx="38" ry="30" fill="' + c.light + '"/>' +
        eye(98, 118, 6.5, c) + eye(142, 118, 6.5, c) +
        '<path d="M86 108 q12 -6 24 0" stroke="' + c.ink + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>' +
        '<path d="M130 108 q12 -6 24 0" stroke="' + c.ink + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".35"/>' +
        '<ellipse cx="120" cy="150" rx="9" ry="7" fill="' + c.ink + '"/>' +
        '<path d="M120 157 v7 M112 166 q8 6 16 0" stroke="' + c.ink + '" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".65"/>' +
        whiskers(120, 160, c, 34);
    },

    hamster: function (c) {
      return grad('g-ham', c.main) + shadow(64) +
        '<circle cx="82" cy="82" r="18" fill="' + c.main + '"/>' +
        '<circle cx="158" cy="82" r="18" fill="' + c.main + '"/>' +
        '<circle cx="82" cy="82" r="8.5" fill="' + c.light + '"/>' +
        '<circle cx="158" cy="82" r="8.5" fill="' + c.light + '"/>' +
        '<ellipse cx="120" cy="134" rx="72" ry="64" fill="url(#g-ham)"/>' +
        '<ellipse cx="78" cy="158" rx="20" ry="15" fill="' + c.pink + '" opacity=".3"/>' +
        '<ellipse cx="162" cy="158" rx="20" ry="15" fill="' + c.pink + '" opacity=".3"/>' +
        '<ellipse cx="120" cy="152" rx="42" ry="34" fill="' + c.light + '"/>' +
        eye(98, 122, 6, c) + eye(142, 122, 6, c) +
        '<ellipse cx="120" cy="147" rx="6.5" ry="4.5" fill="' + c.ink + '"/>' +
        '<rect x="113" y="153" width="7" height="11" rx="2.5" fill="#fffdf5"/>' +
        '<rect x="121" y="153" width="7" height="11" rx="2.5" fill="#fffdf5"/>' +
        '<path d="M120 164 v5" stroke="' + c.ink + '" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
        whiskers(120, 156, c, 32) +
        '<ellipse cx="96" cy="196" rx="13" ry="9" fill="' + c.light + '"/>' +
        '<ellipse cx="144" cy="196" rx="13" ry="9" fill="' + c.light + '"/>';
    },

    parrot: function (c) {
      return grad('g-par', c.main) + shadow(60) +
        '<ellipse cx="120" cy="186" rx="46" ry="30" fill="' + c.main + '"/>' +
        '<path d="M110 66 q-12 -26 0 -36 q10 12 6 34" fill="' + c.dark + '"/>' +
        '<path d="M122 64 q-2 -28 10 -34 q6 16 -2 34" fill="' + c.dark + '"/>' +
        '<path d="M134 68 q10 -24 24 -24 q-6 16 -18 30" fill="' + c.dark + '"/>' +
        '<circle cx="120" cy="120" r="62" fill="url(#g-par)"/>' +
        '<circle cx="98" cy="108" r="14" fill="' + c.light + '"/>' +
        '<circle cx="98" cy="108" r="7.5" fill="' + c.ink + '"/>' +
        '<circle cx="95.5" cy="105" r="2.6" fill="#ffffff" opacity=".92"/>' +
        '<circle cx="142" cy="108" r="14" fill="' + c.light + '"/>' +
        '<circle cx="142" cy="108" r="7.5" fill="' + c.ink + '"/>' +
        '<circle cx="139.5" cy="105" r="2.6" fill="#ffffff" opacity=".92"/>' +
        '<path d="M106 130 q16 -7 28 5 q5 13 -6 20 q-10 6 -17 -3 q-5 -9 -5 -22 Z" fill="' + c.pink + '"/>' +
        '<path d="M112 138 q10 -3 17 3" stroke="' + c.dark + '" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>' +
        '<ellipse cx="120" cy="176" rx="24" ry="14" fill="' + c.light + '" opacity=".55"/>' +
        blush(84, 138, 9, 5, c) + blush(156, 138, 9, 5, c);
    },

    pigeon: function (c) {
      return grad('g-pig', c.main) + shadow(62) +
        '<ellipse cx="144" cy="164" rx="56" ry="46" fill="url(#g-pig)"/>' +
        '<path d="M74 116 q8 26 38 36 l18 -30 q-30 -4 -42 -18 Z" fill="url(#g-pig)"/>' +
        '<circle cx="88" cy="94" r="36" fill="url(#g-pig)"/>' +
        '<path d="M52 96 L76 88 L76 108 Z" fill="' + c.pink + '"/>' +
        '<ellipse cx="74" cy="92" rx="8" ry="6" fill="' + c.light + '"/>' +
        '<circle cx="94" cy="88" r="8" fill="' + c.light + '"/>' +
        '<circle cx="94" cy="88" r="5.2" fill="' + c.ink + '"/>' +
        '<circle cx="92" cy="86" r="1.8" fill="#ffffff" opacity=".92"/>' +
        '<ellipse cx="150" cy="158" rx="30" ry="26" fill="' + c.dark + '" opacity=".18" transform="rotate(-10 150 158)"/>' +
        '<path d="M132 142 q18 10 22 26" stroke="' + c.dark + '" stroke-width="2" fill="none" opacity=".28"/>' +
        '<path d="M132 156 q16 8 20 20" stroke="' + c.dark + '" stroke-width="2" fill="none" opacity=".2"/>' +
        '<path d="M188 176 l26 14 l-6 16 l-24 -12 Z" fill="' + c.dark + '" opacity=".28"/>' +
        '<path d="M120 204 v10 M140 204 v10" stroke="' + c.pink + '" stroke-width="3" stroke-linecap="round" opacity=".55"/>' +
        '<ellipse cx="130" cy="208" rx="30" ry="7" fill="' + c.dark + '" opacity=".07"/>';
    },

    peacock: function (c) {
      var fan = '';
      var cols = [c.dark, c.main, c.dark, c.main, c.dark, c.main, c.dark];
      for (var i = 0; i < 7; i++) {
        var ang = -75 + i * 25;
        fan += '<g transform="rotate(' + ang + ' 120 142)">' +
          '<ellipse cx="120" cy="40" rx="11" ry="44" fill="' + cols[i] + '" opacity=".92"/>' +
          '<ellipse cx="120" cy="13" rx="7" ry="10" fill="' + c.light + '" opacity=".9"/>' +
          '<circle cx="120" cy="12" r="4" fill="' + c.main + '"/>' +
          '</g>';
      }
      return grad('g-pea', c.main) + shadow(58) + fan +
        '<ellipse cx="120" cy="204" rx="34" ry="16" fill="url(#g-pea)"/>' +
        '<circle cx="120" cy="142" r="46" fill="url(#g-pea)"/>' +
        '<path d="M113 100 q-3 -16 3 -22 M120 98 q0 -18 6 -24 M127 100 q4 -14 10 -18" stroke="' + c.main + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="113" cy="92" r="3.4" fill="' + c.main + '"/>' +
        '<circle cx="126" cy="89" r="3.4" fill="' + c.main + '"/>' +
        '<circle cx="137" cy="94" r="3.4" fill="' + c.main + '"/>' +
        '<circle cx="105" cy="136" r="8" fill="' + c.light + '"/>' +
        '<circle cx="105" cy="136" r="5.5" fill="' + c.ink + '"/>' +
        '<circle cx="103" cy="134" r="1.9" fill="#ffffff" opacity=".9"/>' +
        '<circle cx="135" cy="136" r="8" fill="' + c.light + '"/>' +
        '<circle cx="135" cy="136" r="5.5" fill="' + c.ink + '"/>' +
        '<circle cx="133" cy="134" r="1.9" fill="#ffffff" opacity=".9"/>' +
        '<path d="M120 150 l-7 6 q7 5 14 0 Z" fill="' + c.pink + '"/>' +
        '<path d="M120 162 v4" stroke="' + c.ink + '" stroke-width="2" stroke-linecap="round" opacity=".45"/>';
    }
  };

  AQ.artSVG = function (id, colors, size) {
    var fn = AQ.ART[id];
    if (!fn) return '';
    var s = size || 220;
    return '<svg class="animal-art" viewBox="0 0 240 240" width="' + s + '" height="' + s +
      '" role="img" aria-hidden="true" focusable="false">' + fn(colors) + '</svg>';
  };

})();
