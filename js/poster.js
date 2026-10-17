/* ============================================================
 * 长图生成（Canvas 2D，纯手绘，无第三方库）
 * AQ.buildPoster(result) -> Promise<HTMLCanvasElement>
 * ============================================================ */

var AQ = AQ || {};

(function () {

  var W = 750;
  var PAD = 56;
  var CW = W - PAD * 2;
  var FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';

  function font(weight, size) {
    return weight + ' ' + size + 'px ' + FONT;
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* 中文按字断行；英文数字尽量不拆 */
  function wrap(ctx, text, maxWidth) {
    var lines = [];
    var line = '';
    var chars = String(text).split('');
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch === '\n') { lines.push(line); line = ''; continue; }
      var test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line !== '') {
        /* 避免行首标点 */
        if ('，。、；：！？）」』】%'.indexOf(ch) >= 0) {
          line += ch;
          lines.push(line);
          line = '';
          continue;
        }
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawLines(ctx, lines, x, y, lh, dry) {
    for (var i = 0; i < lines.length; i++) {
      if (!dry) ctx.fillText(lines[i], x, y + i * lh);
    }
    return lines.length * lh;
  }

  function radar(ctx, cx, cy, r, scores, color, soft, dry) {
    var dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    var labels = ['ext', 'show', 'direct', 'abstract'].map(function (k) {
      return scores[k] >= 50 ? AQ.DIMS[k].hi : AQ.DIMS[k].lo;
    });
    var i, k;

    /* 网格 */
    for (k = 1; k <= 4; k++) {
      if (dry) break;
      ctx.beginPath();
      for (i = 0; i < 4; i++) {
        var rr = r * k / 4;
        var px = cx + dirs[i][0] * rr;
        var py = cy + dirs[i][1] * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = k === 4 ? 'rgba(0,0,0,.14)' : 'rgba(0,0,0,.07)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* 轴线 */
    if (!dry) {
      for (i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dirs[i][0] * r, cy + dirs[i][1] * r);
        ctx.strokeStyle = 'rgba(0,0,0,.07)';
        ctx.stroke();
      }
    }

    /* 数据多边形 */
    var keys = ['ext', 'show', 'direct', 'abstract'];
    if (!dry) {
      ctx.beginPath();
      for (i = 0; i < 4; i++) {
        var v = Math.max(6, Math.min(100, scores[keys[i]])) / 100;
        var x = cx + dirs[i][0] * r * v;
        var y2 = cy + dirs[i][1] * r * v;
        if (i === 0) ctx.moveTo(x, y2); else ctx.lineTo(x, y2);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.22;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    /* 顶点与标签 */
    if (!dry) {
      for (i = 0; i < 4; i++) {
        var vv = Math.max(6, Math.min(100, scores[keys[i]])) / 100;
        ctx.beginPath();
        ctx.arc(cx + dirs[i][0] * r * vv, cy + dirs[i][1] * r * vv, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.font = font(600, 15);
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var off = 26;
      ctx.fillText(labels[0], cx, cy - r - off);
      ctx.fillText(labels[1], cx + r + off + 4, cy);
      ctx.fillText(labels[2], cx, cy + r + off);
      ctx.fillText(labels[3], cx - r - off - 4, cy);
    }
  }

  function layout(ctx, img, r, dry) {
    var a = r.animal, t = a.theme;
    var y = 0;

    /* 背景 */
    if (!dry) {
      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, W, 4000);
      /* 顶部柔光 */
      var g = ctx.createLinearGradient(0, 0, 0, 420);
      g.addColorStop(0, t.soft);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 420);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    /* 品牌 */
    y = 64;
    if (!dry) {
      ctx.font = font(500, 19);
      ctx.fillStyle = 'rgba(0,0,0,.42)';
      ctx.fillText('动 物 天 赋 图 鉴', W / 2, y);
    }
    y += 26;
    if (!dry) {
      ctx.strokeStyle = 'rgba(0,0,0,.10)';
      ctx.beginPath(); ctx.moveTo(PAD + 90, y); ctx.lineTo(W - PAD - 90, y); ctx.stroke();
    }

    /* 插画 */
    var artSize = 230;
    var artTop = y + 22;
    if (!dry) {
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, (W - artSize) / 2, artTop, artSize, artSize);
      } else {
        ctx.beginPath();
        ctx.arc(W / 2, artTop + artSize / 2, artSize / 2 - 10, 0, Math.PI * 2);
        ctx.fillStyle = t.soft; ctx.fill();
        ctx.font = font(700, 96); ctx.fillStyle = t.brand;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(a.talent, W / 2, artTop + artSize / 2 + 4);
        ctx.textBaseline = 'alphabetic';
      }
    }
    y = artTop + artSize;

    /* 名字 */
    y += 62;
    if (!dry) {
      ctx.font = font(800, 54);
      ctx.fillStyle = t.ink;
      ctx.fillText(a.name, W / 2, y);
    }

    /* 称号 */
    y += 40;
    if (!dry) {
      ctx.font = font(500, 23);
      ctx.fillStyle = 'rgba(0,0,0,.48)';
      ctx.fillText('「' + a.title + '」', W / 2, y);
    }

    /* 天赋徽章 */
    y += 34;
    var badgeW = 168, badgeH = 46;
    if (!dry) {
      roundRect(ctx, (W - badgeW) / 2, y, badgeW, badgeH, 23);
      ctx.fillStyle = t.brand; ctx.fill();
      ctx.font = font(600, 21); ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.fillText('天赋 · ' + a.talent, W / 2, y + badgeH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
    y += badgeH + 42;

    /* 相似度 */
    if (!dry) {
      ctx.font = font(800, 78);
      ctx.fillStyle = t.brand;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(r.fitText + '%', W / 2, y + 72);
    }
    y += 72 + 24;
    if (!dry) {
      ctx.font = font(500, 17);
      ctx.fillStyle = 'rgba(0,0,0,.42)';
      ctx.fillText('相似度', W / 2, y);
    }
    y += 34;

    /* 雷达 */
    var radarR = 96;
    var radarCy = y + 8 + 26 + radarR;
    if (!dry) radar(ctx, W / 2, radarCy, radarR, r.scores, t.brand, t.soft, dry);
    if (!dry) { ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; }
    y = radarCy + radarR + 26 + 8 + 30;

    /* 分隔 */
    if (!dry) {
      ctx.strokeStyle = 'rgba(0,0,0,.10)';
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    }
    y += 44;

    /* ---- 你的天赋 ---- */
    ctx.textAlign = 'left';
    if (!dry) {
      ctx.font = font(700, 26);
      ctx.fillStyle = t.ink;
      ctx.fillText('你的天赋', PAD, y);
      ctx.font = font(600, 15);
      ctx.fillStyle = t.brand;
      ctx.fillText('STRENGTHS', PAD + 108, y - 1);
    }
    y += 26;

    a.strengths.forEach(function (s, i) {
      y += 18;
      var lines = wrap(ctx, s, CW - 52);
      var h = lines.length * 32;
      if (!dry) {
        ctx.beginPath();
        ctx.arc(PAD + 15, y + 10, 15, 0, Math.PI * 2);
        ctx.fillStyle = t.soft; ctx.fill();
        ctx.font = font(700, 15);
        ctx.fillStyle = t.brand;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), PAD + 15, y + 11);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        ctx.font = font(400, 21);
        ctx.fillStyle = 'rgba(0,0,0,.78)';
        drawLines(ctx, lines, PAD + 44, y + 2, 32, dry);
      }
      y += h + 4;
    });

    y += 34;

    /* ---- 可爱的副作用 ---- */
    if (!dry) {
      ctx.font = font(700, 26);
      ctx.fillStyle = t.ink;
      ctx.fillText('可爱的副作用', PAD, y);
    }
    y += 26;
    var sideLines = wrap(ctx, a.side, CW);
    if (!dry) {
      ctx.font = font(400, 21);
      ctx.fillStyle = 'rgba(0,0,0,.72)';
    }
    y += 12;
    y += drawLines(ctx, sideLines, PAD, y + 14, 32, dry);
    y += 26;

    /* ---- 别人眼里的你 ---- */
    if (!dry) {
      ctx.font = font(700, 26);
      ctx.fillStyle = t.ink;
      ctx.fillText('别人眼里的你', PAD, y);
    }
    y += 22;
    var othersLines = wrap(ctx, a.others, CW - 44);
    var boxH = othersLines.length * 32 + 44;
    if (!dry) {
      roundRect(ctx, PAD, y, CW, boxH, 16);
      ctx.fillStyle = 'rgba(255,255,255,.62)';
      ctx.fill();

      roundRect(ctx, PAD + 1, y + 12, 3, boxH - 24, 1.5);
      ctx.fillStyle = t.brand;
      ctx.fill();

      ctx.font = font(400, 21);
      ctx.fillStyle = 'rgba(0,0,0,.78)';
      drawLines(ctx, othersLines, PAD + 24, y + 36, 32, dry);
    }
    y += boxH + 36;

    /* ---- 理论 ---- */
    var theoryLines = wrap(ctx, a.theory.body, CW - 48);
    var theoryH = theoryLines.length * 32 + 104;
    if (!dry) {
      roundRect(ctx, PAD, y, CW, theoryH, 18);
      ctx.fillStyle = t.soft;
      ctx.fill();

      /* 标签 */
      var tagW = ctx.measureText(a.theory.name).width + 46;
      roundRect(ctx, PAD + 24, y + 24, tagW, 36, 18);
      ctx.fillStyle = t.brand;
      ctx.fill();
      ctx.font = font(600, 17);
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText('理论 · ' + a.theory.name, PAD + 24 + tagW / 2, y + 43);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      ctx.font = font(400, 21);
      ctx.fillStyle = 'rgba(0,0,0,.76)';
      drawLines(ctx, theoryLines, PAD + 24, y + 94, 32, dry);
    }
    y += theoryH + 38;

    /* ---- 搭子 ---- */
    var colW = (CW - 16) / 2;
    if (!dry) ctx.font = font(400, 13);
    var p1 = wrap(ctx, a.partnerWhy, colW - 36);
    var p2 = wrap(ctx, a.nemesisWhy, colW - 36);
    var pairH = 88 + Math.max(p1.length, p2.length) * 19;
    if (!dry) {
      [['最佳搭子', a.partner, p1], ['最不对付', a.nemesis, p2]].forEach(function (pair, i) {
        var x = PAD + i * (colW + 16);
        roundRect(ctx, x, y, colW, pairH, 16);
        ctx.fillStyle = 'rgba(255,255,255,.62)';
        ctx.fill();
        ctx.font = font(600, 13);
        ctx.fillStyle = 'rgba(0,0,0,.42)';
        ctx.fillText(pair[0], x + 18, y + 28);
        ctx.font = font(700, 22);
        ctx.fillStyle = i === 0 ? t.brand : 'rgba(0,0,0,.55)';
        ctx.fillText(pair[1], x + 18, y + 56);
        ctx.font = font(400, 13);
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        for (var k = 0; k < pair[2].length; k++) {
          ctx.fillText(pair[2][k], x + 18, y + 80 + k * 19);
        }
      });
    }
    y += pairH + 30;

    /* ---- 金句 ---- */
    var quoteLines = wrap(ctx, a.quote, CW - 40);
    if (!dry) {
      ctx.strokeStyle = t.brand;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(PAD, y + 6); ctx.lineTo(PAD, y + quoteLines.length * 34 - 6);
      ctx.stroke();
      ctx.font = font(600, 23);
      ctx.fillStyle = t.ink;
      drawLines(ctx, quoteLines, PAD + 22, y + 28, 34, dry);
    }
    y += quoteLines.length * 34 + 30;

    /* ---- 页脚 ---- */
    if (!dry) {
      ctx.strokeStyle = 'rgba(0,0,0,.10)';
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    }
    y += 40;
    if (!dry) {
      ctx.textAlign = 'center';
      ctx.font = font(700, 22);
      ctx.fillStyle = t.brand;
      ctx.fillText('测测你最像什么动物？', W / 2, y);
      ctx.font = font(400, 16);
      ctx.fillStyle = 'rgba(0,0,0,.40)';
      ctx.fillText('32 道题 · 5 分钟 · 16 种动物原型', W / 2, y + 28);
      ctx.textAlign = 'left';
    }
    y += 64;

    return y;
  }

  AQ.buildPoster = function (r) {
    return new Promise(function (resolve, reject) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="460" height="460">' +
        AQ.ART[r.animal.id](r.animal.art) + '</svg>';

      var img = new Image();
      var done = false;

      function go() {
        if (done) return;
        done = true;
        try {
          var probe = document.createElement('canvas').getContext('2d');
          var h = layout(probe, img, r, true);
          var dpr = 2;
          var canvas = document.createElement('canvas');
          canvas.width = W * dpr;
          canvas.height = Math.ceil(h + 20) * dpr;
          var ctx = canvas.getContext('2d');
          ctx.scale(dpr, dpr);
          layout(ctx, img, r, false);
          resolve(canvas);
        } catch (e) { reject(e); }
      }

      img.onload = go;
      img.onerror = function () { img = null; go(); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

      /* 兜底：1.2s 内没加载完也继续 */
      setTimeout(function () { if (!done) { go(); } }, 1200);
    });
  };

  AQ.canvasToBlob = function (canvas) {
    return new Promise(function (resolve) {
      if (canvas.toBlob) {
        canvas.toBlob(function (b) { resolve(b); }, 'image/png', 0.95);
      } else {
        var d = canvas.toDataURL('image/png');
        resolve(dataURLtoBlob(d));
      }
    });
  };

  function dataURLtoBlob(d) {
    var parts = d.split(',');
    var mime = /:(.*?);/.exec(parts[0])[1];
    var bin = atob(parts[1]);
    var n = bin.length;
    var u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

})();
