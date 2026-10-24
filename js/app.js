/* ============================================================
 * 动物天赋图鉴 · 交互层
 * ============================================================ */

var AQ = AQ || {};

(function () {

  var LS_USAGE = 'aq_usage_v1';
  var LS_SESSION = 'aq_session_v1';
  var SS_OWN = 'aq_own_result';

  var TOTAL = AQ.QUESTIONS.length;

  var state = {
    password: null,
    answers: new Array(TOTAL).fill(null),
    index: 0,
    result: null,
    shared: false,
    busy: false,
    remaining: 0,
    sessionId: null
  };

  /* ---------------- 工具 ---------------- */
  function $(s, p) { return (p || document).querySelector(s); }
  function $$(s, p) { return Array.prototype.slice.call((p || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function normPwd(s) {
    return String(s || '').replace(/[\s\-_]/g, '').toUpperCase();
  }

  function reasonText(reason) {
    if (reason === 'not_found') return '密码不对，请检查后重试';
    if (reason === 'exhausted') return '这个密码暂时用不了，请联系店主';
    if (reason === 'disabled') return '这个密码已停用，请联系客服';
    if (reason === 'no_function') return '数据库还没初始化，请先在 Supabase 运行 schema.sql';
    if (reason === 'auth') return '连接密钥不对，请检查 js/config.js';
    if (reason === 'timeout') return '连接有点慢，请切换 Wi-Fi / 4G 后重试';
    return '连不上服务器，请切换 Wi-Fi / 4G 后重试';
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1900);
  }

  /* ---------------- 弹层 ---------------- */
  var modalStack = [];
  function openModal(html, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML =
      '<div class="modal-card ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' +
        (opts.closable === false ? '' : '<button class="modal-x" aria-label="关闭">✕</button>') +
        '<div class="modal-inner">' + html + '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    document.body.classList.add('modal-open');
    modalStack.push(wrap);

    requestAnimationFrame(function () { wrap.classList.add('in'); });

    function close() {
      wrap.classList.remove('in');
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        modalStack.pop();
        if (!modalStack.length) document.body.classList.remove('modal-open');
        if (opts.onClose) opts.onClose();
      }, 200);
    }

    wrap.addEventListener('click', function (e) {
      if (e.target === wrap && opts.closable !== false) close();
    });
    var x = $('.modal-x', wrap);
    if (x) x.addEventListener('click', close);

    return { el: wrap, close: close };
  }

  /* ---------------- 屏幕切换 ---------------- */
  function show(id) {
    $$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    window.scrollTo(0, 0);
  }

  /* ---------------- 主题 ---------------- */
  function applyTheme(theme) {
    var r = document.documentElement.style;
    r.setProperty('--brand', theme.brand);
    r.setProperty('--brand2', theme.brand2);
    r.setProperty('--bg', theme.bg);
    r.setProperty('--soft', theme.soft);
    r.setProperty('--ink', theme.ink);
  }
  function resetTheme() { applyTheme(AQ.DEFAULT_THEME); }

  /* ============================================================
   * 雷达图（SVG，结果页用）
   * ============================================================ */
  function radarSVG(scores, color) {
    var size = 300, cx = 150, cy = 150, R = 92;
    var keys = ['ext', 'show', 'direct', 'abstract'];
    var dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    var labels = keys.map(function (k) {
      return scores[k] >= 50 ? AQ.DIMS[k].hi : AQ.DIMS[k].lo;
    });
    var out = '';

    function pt(i, v) {
      var rr = R * v;
      return (cx + dirs[i][0] * rr).toFixed(1) + ',' + (cy + dirs[i][1] * rr).toFixed(1);
    }

    for (var k = 1; k <= 4; k++) {
      var pts = [];
      for (var i = 0; i < 4; i++) pts.push(pt(i, k / 4));
      out += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="currentColor" stroke-opacity="' +
        (k === 4 ? '.18' : '.09') + '"/>';
    }

    for (var j = 0; j < 4; j++) {
      out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + dirs[j][0] * R) + '" y2="' +
        (cy + dirs[j][1] * R) + '" stroke="currentColor" stroke-opacity=".09"/>';
    }

    var dp = [];
    for (var m = 0; m < 4; m++) {
      var vv = Math.max(0.08, Math.min(1, scores[keys[m]] / 100));
      dp.push(pt(m, vv));
    }
    out += '<polygon points="' + dp.join(' ') + '" fill="' + color + '" fill-opacity=".2" stroke="' +
      color + '" stroke-width="2.5" stroke-linejoin="round"/>';

    for (var n = 0; n < 4; n++) {
      var v2 = Math.max(0.08, Math.min(1, scores[keys[n]] / 100));
      var p = pt(n, v2).split(',');
      out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + color + '"/>';
    }

    var lx = [cx, cx + R + 30, cx, cx - R - 30];
    var ly = [cy - R - 22, cy, cy + R + 30, cy];
    for (var q = 0; q < 4; q++) {
      out += '<text x="' + lx[q] + '" y="' + ly[q] + '" text-anchor="middle" dominant-baseline="middle" ' +
        'font-size="14" fill="currentColor" fill-opacity=".5">' + labels[q] + '</text>';
    }

    return '<svg class="radar" viewBox="0 0 ' + size + ' ' + size + '" width="100%" height="300" ' +
      'style="color:' + color + '">' + out + '</svg>';
  }

  /* ============================================================
   * 锁屏
   * ============================================================ */
  function renderLock() {
    resetTheme();
    show('screen-lock');
    var err = $('#lock-err');
    if (err) err.textContent = '';
    var slot = $('#resume-slot');
    if (slot) {
      var raw = lsGet(LS_SESSION);
      var s = null;
      try { s = raw ? JSON.parse(raw) : null; } catch (e) { s = null; }
      if (s && s.password && Array.isArray(s.answers) && s.answers.filter(Boolean).length > 0 &&
          s.answers.filter(Boolean).length < TOTAL) {
        slot.innerHTML =
          '<button class="resume-bar" id="btn-resume">' +
            '<span class="resume-dot"></span>' +
            '你有一份没做完的测评（' + s.answers.filter(Boolean).length + '/' + TOTAL + '）' +
            '<b>继续作答 →</b>' +
          '</button>';
      } else {
        slot.innerHTML = '';
      }
    }
  }

  function onResume() {
    var raw = lsGet(LS_SESSION);
    if (!raw) return;
    var s;
    try { s = JSON.parse(raw); } catch (e) { return; }
    if (!s || !s.answers) return;
    state.password = s.password;
    state.answers = s.answers;
    state.index = Math.min(TOTAL - 1, s.answers.filter(Boolean).length);
    show('screen-quiz');
    renderQuestion();
  }

  function submitPassword(e) {
    if (e) e.preventDefault();
    if (state.busy) return;

    var input = $('#pwd');
    var p = AQ.API.normalize(input.value);
    var err = $('#lock-err');
    var btn = $('.btn-enter');

    if (!p) {
      err.textContent = '请输入密码';
      return;
    }

    state.busy = true;
    err.textContent = '';
    if (btn) { btn.disabled = true; btn.textContent = '验证中…'; }
    var t0 = Date.now();

    AQ.API.peek(p).then(function (res) {
      state.busy = false;
      if (btn) { btn.disabled = false; btn.textContent = '进入测评'; }

      if (!res || !res.ok) {
        var msg = reasonText(res && res.reason);
        if (/[?&]diag=1/.test(location.search)) {
          msg += '〔' + (res && res.reason) + ' / ' + (Date.now() - t0) + 'ms〕';
        }
        err.textContent = msg;
        input.classList.add('shake');
        setTimeout(function () { input.classList.remove('shake'); }, 420);
        return;
      }

      state.password = p;
      state.remaining = res.remaining;
      state.answers = new Array(TOTAL).fill(null);
      state.index = 0;
      state.result = null;

      var lc = $('#left-count');
      if (lc) lc.textContent = res.remaining;
      show('screen-intro');
    });
  }

  /* ============================================================
   * 答题
   * ============================================================ */
  function renderQuestion() {
    var i = state.index;
    var q = AQ.QUESTIONS[i];
    var sel = state.answers[i];

    $('#q-index').textContent = i + 1;
    $('#progress-bar').style.width = ((i) / TOTAL * 100) + '%';
    $('#btn-back').classList.toggle('is-off', i === 0);

    var letters = ['A', 'B', 'C', 'D'];
    var opts = q.options.map(function (o, idx) {
      return '<button class="opt' + (sel && sel.opt === idx ? ' is-sel' : '') + '" data-i="' + idx + '">' +
        '<span class="opt-k">' + letters[idx] + '</span>' +
        '<span class="opt-t">' + esc(o.t) + '</span>' +
      '</button>';
    }).join('');

    $('#quiz-body').innerHTML =
      '<div class="q-card" data-q="' + i + '">' +
        '<div class="q-tag">第 ' + (i + 1) + ' 题 · 凭第一反应</div>' +
        '<h2 class="q-text">' + esc(q.text) + '</h2>' +
        '<div class="opts">' + opts + '</div>' +
      '</div>';

    var card = $('.q-card');
    requestAnimationFrame(function () { card.classList.add('in'); });

    $('#progress-bar').style.width = ((i + 1) / TOTAL * 100) + '%';
  }

  function selectOption(idx) {
    if (state.busy) return;
    var i = state.index;
    var q = AQ.QUESTIONS[i];
    var o = q.options[idx];
    if (!o) return;

    state.answers[i] = { dim: q.dim, v: o.v, opt: idx, qid: q.id };
    saveSession();

    $$('#quiz-body .opt').forEach(function (b) { b.classList.remove('is-sel'); });
    var btn = $('#quiz-body .opt[data-i="' + idx + '"]');
    if (btn) btn.classList.add('is-sel');

    state.busy = true;
    setTimeout(function () {
      state.busy = false;
      if (i >= TOTAL - 1) {
        finish();
      } else {
        state.index = i + 1;
        renderQuestion();
      }
    }, 240);
  }

  function goBack() {
    if (state.busy) return;
    if (state.index <= 0) return;
    state.index -= 1;
    renderQuestion();
  }

  function saveSession() {
    lsSet(LS_SESSION, JSON.stringify({
      password: state.password,
      answers: state.answers,
      ts: Date.now()
    }));
  }

  /* ============================================================
   * 结算
   * ============================================================ */
  function finish() {
    var answered = state.answers.filter(Boolean);
    if (answered.length < TOTAL) {
      toast('还有题目没答完');
      return;
    }

    show('screen-loading');
    setTimeout(function () {
      var sc = AQ.score(state.answers);
      var m = AQ.match(sc.scores);
      state.result = {
        scores: sc.scores,
        purity: sc.purity,
        raw: sc.raw,
        code: m.code,
        animal: m.animal,
        fitRaw: m.fit,
        fitText: AQ.displayFit(m.fit),
        exact: m.exact,
        top: m.top,
        shared: false
      };
      lsDel(LS_SESSION);
      try { sessionStorage.setItem(SS_OWN, '1'); } catch (e) {}
      try {
        history.replaceState(null, '', '#r=' + AQ.CONFIG.version + '.' +
          [sc.scores.ext, sc.scores.show, sc.scores.direct, sc.scores.abstract].join('.'));
      } catch (e) {}
      renderResult();
    }, 1100);
  }

  function dimValueText(dim, v) {
    var d = AQ.DIMS[dim];
    if (v >= 65) return { label: d.hi, read: d.read.hi, level: 'hi' };
    if (v <= 35) return { label: d.lo, read: d.read.lo, level: 'lo' };
    return { label: '中间型', read: d.read.mid, level: 'mid' };
  }

  function renderResult() {
    var r = state.result;
    var a = r.animal;
    var t = a.theme;

    applyTheme(t);

    var strengths = a.strengths.map(function (s) {
      return '<li><span class="num">' + (a.strengths.indexOf(s) + 1) + '</span><span>' + esc(s) + '</span></li>';
    }).join('');

    var dims = AQ.DIM_ORDER.map(function (k) {
      var v = r.scores[k];
      var info = dimValueText(k, v);
      var d = AQ.DIMS[k];
      return '<div class="dim">' +
        '<div class="dim-head"><span class="dim-name">' + d.name + '</span>' +
          '<span class="dim-val">' + info.label + ' · ' + v + '</span></div>' +
        '<div class="dim-bar"><i style="width:' + Math.max(3, v) + '%"></i></div>' +
        '<p class="dim-read">' + esc(info.read) + '</p>' +
      '</div>';
    }).join('');

    var comp = '';

    var care = a.care.map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join('');

    var purityChip = '';
    var puritySum = r.purity ? (r.purity.ext + r.purity.show + r.purity.direct + r.purity.abstract) : 0;
    if (!r.shared && puritySum > 0) {
      var mainKey = AQ.DIM_ORDER.reduce(function (best, k) {
        return r.purity[k] > r.purity[best] ? k : best;
      }, AQ.DIM_ORDER[0]);
      purityChip = '<span class="chip chip-purity">「' + AQ.DIMS[mainKey][r.scores[mainKey] >= 50 ? 'hi' : 'lo'] +
        '」纯度 ' + r.purity[mainKey] + '%</span>';
    }

    var shareBanner = r.shared
      ? '<div class="share-banner">这是朋友分享给你的结果 · ' +
        '<button id="btn-banner-test">我也要测 →</button></div>'
      : '';

    $('#result-body').innerHTML =
      shareBanner +
      '<div class="result-hero">' +
        '<div class="result-art">' + AQ.artSVG(a.id, a.art, 200) + '</div>' +
        '<div class="result-eyebrow">' + (r.shared ? 'TA 的动物原型' : '你的动物原型') + '</div>' +
        '<h1 class="result-name">' + esc(a.name) + '</h1>' +
        '<div class="result-title">「' + esc(a.title) + '」</div>' +
        '<div class="result-chips">' +
          '<span class="chip chip-talent">天赋 · ' + esc(a.talent) + '</span>' +
          '<span class="chip chip-fit"><b>' + r.fitText + '%</b> 相似度</span>' +
          (a.hidden ? '<span class="chip chip-hidden">隐藏款</span>' : '') +
          purityChip +
        '</div>' +
        '<div class="result-code">四维类型 · ' + esc(a.code) + '</div>' +
      '</div>' +

      '<section class="block">' +
        '<h2 class="block-title">你的天赋 <em>STRENGTHS</em></h2>' +
        '<ol class="strengths">' + strengths + '</ol>' +
      '</section>' +

      '<section class="block">' +
        '<h2 class="block-title">为什么是这只动物 <em>WHY</em></h2>' +
        '<p class="block-text">' + esc(a.why) + '</p>' +
      '</section>' +

      '<section class="block">' +
        '<h2 class="block-title">可爱的副作用</h2>' +
        '<p class="block-text">' + esc(a.side) + '</p>' +
      '</section>' +

      '<section class="block">' +
        '<h2 class="block-title">别人眼里的你</h2>' +
        '<blockquote class="quote">' + esc(a.others) + '</blockquote>' +
      '</section>' +

      '<section class="block theory">' +
        '<div class="theory-tag">理论 · ' + esc(a.theory.name) + '</div>' +
        '<p class="theory-text">' + esc(a.theory.body) + '</p>' +
      '</section>' +

      '<section class="block">' +
        '<h2 class="block-title">你的四个维度</h2>' +
        '<div class="radar-wrap">' + radarSVG(r.scores, t.brand) + '</div>' +
        '<div class="dims">' + dims + '</div>' +
      '</section>' +

      '<section class="block">' +
        '<h2 class="block-title">和你相处，需要知道的三件事</h2>' +
        '<ul class="care">' + care + '</ul>' +
      '</section>' +

      '<section class="block pair-wrap">' +
        '<div class="pair-card">' +
          '<div class="pair-head"><span>最佳搭子</span><b>' + esc(a.partner) + '</b></div>' +
          '<p class="pair-why">' + esc(a.partnerWhy) + '</p>' +
        '</div>' +
        '<div class="pair-card">' +
          '<div class="pair-head"><span>最不对付</span><b>' + esc(a.nemesis) + '</b></div>' +
          '<p class="pair-why">' + esc(a.nemesisWhy) + '</p>' +
        '</div>' +
      '</section>' +

      '<div class="result-quote">“' + esc(a.quote) + '”</div>' +
      '<div class="result-foot">' + esc(AQ.CONFIG.title) + ' · 32 题 / 5 分钟 / 16 种动物原型</div>';

    show('screen-result');
    $('#action-bar').classList.add('show');

    if (r.shared) {
      var b = $('#btn-banner-test');
      if (b) b.addEventListener('click', function () { location.hash = ''; location.reload(); });
    }
  }

  /* ============================================================
   * 结果页动作
   * ============================================================ */
  function resultURL() {
    var s = state.result.scores;
    var base = location.href.split('#')[0];
    return base + '#r=' + AQ.CONFIG.version + '.' + [s.ext, s.show, s.direct, s.abstract].join('.');
  }

  function copyText(text) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && navigator.clipboard.writeText && location.protocol !== 'file:') {
        navigator.clipboard.writeText(text).then(function () { resolve(true); },
          function () { resolve(fallbackCopy(text)); });
      } else {
        resolve(fallbackCopy(text));
      }
    });
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function shareResult() {
    var url = resultURL();
    copyText(url).then(function (ok) {
      if (ok) {
        toast('结果链接已复制，去粘给朋友吧');
      } else {
        openModal(
          '<h3 class="modal-title">复制这个链接</h3>' +
          '<p class="modal-text">长按下面的链接复制，再发给朋友：</p>' +
          '<textarea class="link-area" readonly rows="4">' + esc(url) + '</textarea>' +
          '<button class="btn btn-primary modal-ok">我知道了</button>',
          { onClose: null }
        );
      }
    });
  }

  function shareImage(blob, filename) {
    if (navigator.canShare && window.File) {
      var file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: '动物天赋图鉴', text: '测测你最像什么动物？' })
          .catch(function () {});
        return true;
      }
    }
    return false;
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function savePoster() {
    if (!state.result) return;
    var btn = $('#btn-save');
    if (btn) btn.classList.add('loading');
    toast('正在生成长图…');

    AQ.buildPoster(state.result).then(function (canvas) {
      return AQ.canvasToBlob(canvas).then(function (blob) {
        return { canvas: canvas, blob: blob };
      });
    }).then(function (res) {
      if (btn) btn.classList.remove('loading');
      var a = state.result.animal;
      var filename = '动物天赋图鉴-' + a.name + '.png';
      var url = URL.createObjectURL(res.blob);

      var canShare = !!(navigator.canShare && window.File &&
        navigator.canShare({ files: [new File([res.blob], filename, { type: 'image/png' })] }));

      var html =
        '<h3 class="modal-title">长图已生成</h3>' +
        '<div class="shot-wrap"><img class="shot" src="' + url + '" alt="结果长图"></div>' +
        '<p class="shot-tip">' + (isIOS()
          ? '长按上面的图片 → 选择「存储到照片」'
          : '点下面的按钮保存到电脑；手机浏览器会存到相册/下载') + '</p>' +
        '<div class="shot-actions">' +
          '<button class="btn btn-primary" id="btn-download">保存图片</button>' +
          (canShare ? '<button class="btn btn-ghost" id="btn-share-img">分享图片</button>' : '') +
        '</div>';

      var m = openModal(html, { wide: true });

      setTimeout(function () {
        var dl = $('#btn-download');
        if (dl) {
          dl.addEventListener('click', function () {
            var link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast(isIOS() ? '已打开图片，长按可存储到照片' : '已保存到下载文件夹');
          });
        }
        var si = $('#btn-share-img');
        if (si) {
          si.addEventListener('click', function () {
            shareImage(res.blob, filename);
          });
        }
      }, 30);

      m.el.addEventListener('click', function (e) {
        if (e.target === m.el) URL.revokeObjectURL(url);
      });

      /* 桌面端直接触发一次下载，省一步 */
      if (!isIOS() && !canShare) {
        setTimeout(function () {
          var link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 260);
      }
    }).catch(function (err) {
      if (btn) btn.classList.remove('loading');
      console.error(err);
      toast('生成失败了，请重试一次');
    });
  }

  function showExhausted() {
    openModal(
      '<h3 class="modal-title">这个密码暂时用不了</h3>' +
      '<p class="modal-text">请联系店主获取最新的访问密码。</p>' +
      '<button class="btn btn-primary modal-ok" id="btn-need-pwd">去输入新密码</button>'
    );
    setTimeout(function () {
      var b = $('#btn-need-pwd');
      if (b) b.addEventListener('click', function () {
        location.hash = '';
        location.reload();
      });
    }, 20);
  }

  function beginRound() {
    state.answers = new Array(TOTAL).fill(null);
    state.index = 0;
    state.result = null;
    state.shared = false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    try { sessionStorage.removeItem(SS_OWN); } catch (e) {}
    $('#action-bar').classList.remove('show');
    resetTheme();
    show('screen-quiz');
    renderQuestion();
    saveSession();
  }

  function retest() {
    if (state.shared || !state.password) {
      location.hash = '';
      location.reload();
      return;
    }
    if (state.busy) return;
    state.busy = true;

    AQ.API.peek(state.password).then(function (res) {
      state.busy = false;
      if (!res || !res.ok) {
        if (res && res.reason === 'exhausted') showExhausted();
        else toast(reasonText(res && res.reason));
        return;
      }
      state.remaining = res.remaining;

      var m = openModal(
        '<h3 class="modal-title">再测一次？</h3>' +
        '<p class="modal-text">答案会清空，重新开始一轮。<br>结果可能和这次不一样。</p>' +
        '<div class="modal-btns">' +
          '<button class="btn btn-ghost" id="btn-cancel">再想想</button>' +
          '<button class="btn btn-primary" id="btn-again">开始重测</button>' +
        '</div>',
        { onClose: function () {} }
      );

      setTimeout(function () {
        var c = $('#btn-cancel'); if (c) c.addEventListener('click', m.close);
        var g = $('#btn-again');
        if (g) g.addEventListener('click', function () {
          m.close();
          if (state.busy) return;
          state.busy = true;
          AQ.API.redeem(state.password).then(function (r2) {
            state.busy = false;
            if (!r2 || !r2.ok) {
              if (r2 && r2.reason === 'exhausted') showExhausted();
              else toast(reasonText(r2 && r2.reason));
              return;
            }
            state.remaining = r2.remaining;
            beginRound();
          });
        });
      }, 20);
    });
  }

  function reviewReward() {
    openModal(
      '<div class="gift-icon">🎁</div>' +
      '<h3 class="modal-title" style="text-align:center">好评有礼</h3>' +
      '<p class="modal-text" style="text-align:center">谢谢你测完这套题。<br>' +
      '在店铺留下好评后，把截图发给客服，即可领取 <b>1 元</b> 返现。</p>' +
      '<p class="modal-note" style="text-align:center">截图里能看到你的订单就可以啦～</p>' +
      '<button class="btn btn-primary modal-ok" id="btn-gift-ok">我知道啦</button>'
    );
    setTimeout(function () {
      var b = $('#btn-gift-ok');
      if (b) b.addEventListener('click', function () {
        var mask = b.closest('.modal-mask');
        if (mask) mask.remove();
        document.body.classList.remove('modal-open');
        modalStack = [];
      });
    }, 20);
  }

  /* ============================================================
   * 启动
   * ============================================================ */
  function startTest() {
    if (state.busy) return;
    state.busy = true;

    var btn = $('#btn-start');
    if (btn) { btn.disabled = true; btn.textContent = '正在进入…'; }

    AQ.API.redeem(state.password).then(function (res) {
      state.busy = false;
      if (btn) { btn.disabled = false; btn.textContent = '开始测评'; }

      if (!res || !res.ok) {
        toast(reasonText(res && res.reason));
        if (res && res.reason === 'exhausted') renderLock();
        return;
      }

      state.remaining = res.remaining;
      state.sessionId = res.session || null;
      beginRound();
    });
  }

  function initResultFromHash() {
    var scores = AQ.decodeResult(location.hash);
    if (!scores) return false;
    var m = AQ.match(scores);
    var own = false;
    try { own = sessionStorage.getItem(SS_OWN) === '1'; } catch (e) {}
    state.result = {
      scores: scores,
      purity: { ext: 0, show: 0, direct: 0, abstract: 0 },
      code: m.code,
      animal: m.animal,
      fitRaw: m.fit,
      fitText: AQ.displayFit(m.fit),
      exact: m.exact,
      top: m.top,
      shared: !own
    };
    state.shared = !own;
    renderResult();
    return true;
  }

  function bind() {
    $('#lock-form').addEventListener('submit', submitPassword);

    var pwdInput = $('#pwd');
    if (pwdInput) {
      pwdInput.addEventListener('focus', function () {
        if (AQ.API && AQ.API.warm) AQ.API.warm();
      });
    }

    $('#btn-start').addEventListener('click', startTest);

    $('#quiz-body').addEventListener('click', function (e) {
      var opt = e.target.closest ? e.target.closest('.opt') : null;
      if (!opt) return;
      selectOption(parseInt(opt.getAttribute('data-i'), 10));
    });

    $('#btn-back').addEventListener('click', goBack);

    $('#btn-quit').addEventListener('click', function () {
      var m = openModal(
        '<h3 class="modal-title">要退出吗？</h3>' +
        '<p class="modal-text">进度会保留，下次打开可以接着答。</p>' +
        '<div class="modal-btns">' +
          '<button class="btn btn-ghost" id="btn-stay">继续答</button>' +
          '<button class="btn btn-primary" id="btn-leave">退出</button>' +
        '</div>'
      );
      setTimeout(function () {
        var s = $('#btn-stay'); if (s) s.addEventListener('click', m.close);
        var l = $('#btn-leave');
        if (l) l.addEventListener('click', function () {
          m.close();
          renderLock();
        });
      }, 20);
    });

    $('#btn-save').addEventListener('click', savePoster);
    $('#btn-share').addEventListener('click', shareResult);
    $('#btn-retest').addEventListener('click', retest);
    $('#btn-review').addEventListener('click', reviewReward);

    document.addEventListener('click', function (e) {
      var r = e.target.closest ? e.target.closest('#btn-resume') : null;
      if (r) onResume();
    });

    document.addEventListener('keydown', function (e) {
      if (!$('#screen-quiz').classList.contains('active')) return;
      if (['1', '2', '3', '4'].indexOf(e.key) >= 0) {
        selectOption(parseInt(e.key, 10) - 1);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        goBack();
      }
    });
  }

  function init() {
    bind();
    resetTheme();
    if (AQ.API && AQ.API.misconfigured) {
      var w = $('#cfg-warn');
      if (w) w.hidden = false;
    }
    if (AQ.API && AQ.API.visit) AQ.API.visit();
    if (!initResultFromHash()) {
      renderLock();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
