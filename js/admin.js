/* ============================================================
 * 后台逻辑：Supabase Auth 登录 + 数据看板 + 密码管理
 * ============================================================ */

(function () {
  'use strict';

  var cfg = window.AQ_CONFIG || {};
  var BASE = String(cfg.SUPABASE_URL || '').replace(/\/+$/, '');
  var KEY = String(cfg.SUPABASE_ANON_KEY || '');
  var SS = 'aq_admin_session';

  var session = null;
  var codes = [];
  var sessions = [];

  function $(s, p) { return (p || document).querySelector(s); }
  function $$(s, p) { return Array.prototype.slice.call((p || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  function fmt(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('zh-CN', { hour12: false });
    } catch (e) { return iso; }
  }

  /* ---------------- 网络：超时 + 重试 ---------------- */
  function fetchT(url, opts, ms) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 20000) : null;
    var o = {};
    for (var k in (opts || {})) o[k] = opts[k];
    if (ctrl) o.signal = ctrl.signal;

    return fetch(url, o).then(function (r) {
      if (timer) clearTimeout(timer);
      return r;
    }, function (e) {
      if (timer) clearTimeout(timer);
      throw e;
    });
  }

  function isNetErr(e) {
    if (!e) return false;
    if (e.name === 'AbortError') return true;
    return /failed to fetch|networkerror|load failed|network request failed|timeout/i.test(e.message || '');
  }

  function withRetry(fn, left) {
    if (left == null) left = 1;
    return fn().catch(function (e) {
      if (isNetErr(e) && left > 0) {
        return new Promise(function (r) { setTimeout(r, 700); })
          .then(function () { return withRetry(fn, left - 1); });
      }
      if (isNetErr(e)) {
        throw new Error(e && e.name === 'AbortError'
          ? '连接超时，请切换网络后重试'
          : '连不上服务器，请切换网络后重试');
      }
      throw e;
    });
  }

  var warmed = false;
  function warm() {
    if (warmed || !BASE) return;
    warmed = true;
    try {
      fetchT(BASE + '/auth/v1/health', { headers: { 'apikey': KEY } }, 15000)
        .catch(function () {});
    } catch (e) {}
  }

  /* ---------------- 会话 ---------------- */
  function loadSession() {
    try { session = JSON.parse(sessionStorage.getItem(SS) || 'null'); } catch (e) { session = null; }
  }
  function saveSession(s) {
    session = s;
    try { sessionStorage.setItem(SS, JSON.stringify(s)); } catch (e) {}
  }
  function clearSession() {
    session = null;
    try { sessionStorage.removeItem(SS); } catch (e) {}
  }
  function tokenAlive() {
    return !!(session && session.access_token && session.expires_at && Date.now() < session.expires_at - 60000);
  }
  function setSessionFromAuth(d) {
    saveSession({
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      expires_at: Date.now() + (d.expires_in || 3600) * 1000,
      email: (d.user && d.user.email) || ''
    });
  }

  function refreshToken() {
    if (!session || !session.refresh_token) return Promise.resolve(false);
    return fetch(BASE + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    }).then(function (r) {
      if (!r.ok) return false;
      return r.json().then(function (d) { setSessionFromAuth(d); return true; });
    }).catch(function () { return false; });
  }

  function ensureToken() {
    if (tokenAlive()) return Promise.resolve();
    return refreshToken().then(function (ok) {
      if (!ok) { logout(); throw new Error('登录已过期，请重新登录'); }
    });
  }

  function request(path, opts, retried) {
    opts = opts || {};
    return ensureToken().then(function () {
      var headers = {
        'apikey': KEY,
        'Authorization': 'Bearer ' + session.access_token,
        'Content-Type': 'application/json'
      };
      if (opts.headers) {
        for (var k in opts.headers) headers[k] = opts.headers[k];
      }
      return fetchT(BASE + path, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body
      });
    }).then(function (r) {
      if (r.status === 401 && !retried) {
        return refreshToken().then(function (ok) {
          if (!ok) { logout(); throw new Error('登录已过期，请重新登录'); }
          return request(path, opts, true);
        });
      }
      return r.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
        if (!r.ok) {
          var msg = (data && (data.message || data.error_description || data.msg)) || ('HTTP ' + r.status);
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  function rpc(name, body) {
    return request('/rest/v1/rpc/' + name, { method: 'POST', body: JSON.stringify(body || {}) });
  }
  function select(table, query) {
    return request('/rest/v1/' + table + '?' + query, {});
  }
  function patch(table, filter, body) {
    return request('/rest/v1/' + table + '?' + filter, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(body)
    });
  }
  function remove(table, filter) {
    return request('/rest/v1/' + table + '?' + filter, { method: 'DELETE' });
  }

  /* ---------------- 登录 / 退出 ---------------- */
  function login(email, pwd) {
    return withRetry(function () {
      return fetchT(BASE + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'apikey': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pwd })
      }, 15000);
    }).then(function (r) {
      return r.text().then(function (txt) {
        var d = null;
        try { d = txt ? JSON.parse(txt) : null; } catch (e) { d = null; }
        if (!r.ok) {
          var msg = (d && (d.error_description || d.msg || d.error)) || '登录失败';
          if (/invalid/i.test(msg)) msg = '邮箱或密码不对';
          if (/Email not confirmed/i.test(msg)) msg = '邮箱还没确认，请到 Supabase 后台点确认';
          throw new Error(msg);
        }
        setSessionFromAuth(d);
        return d;
      });
    });
  }

  function logout() {
    clearSession();
    $('#app').hidden = true;
    $('#login').hidden = false;
    $('#login-err').textContent = '';
    $('#password').value = '';
  }

  function showApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    $('#who').textContent = session.email || '';
    loadAll().catch(function (e) {
      if (/unauthorized|permission|JWT/i.test(e.message)) {
        toast('这个账号不在管理员名单里');
        logout();
        $('#login-err').textContent = '这个账号不是管理员。请检查 admins 表里是否加了你的邮箱。';
        return;
      }
      toast('加载失败：' + e.message);
    });
  }

  function loadAll() {
    return withRetry(function () {
      return Promise.all([
        rpc('admin_stats', {}),
        select('quiz_passwords', 'select=code,used_count,max_uses,active,created_at&order=created_at.desc&limit=1000'),
        select('quiz_sessions', 'select=code,created_at,user_agent&order=created_at.desc&limit=200')
      ]);
    }).then(function (res) {
      renderStats(res[0] || {});
      codes = res[1] || [];
      sessions = res[2] || [];
      renderCodes();
      renderSessions();
    });
  }

  /* ---------------- 看板 ---------------- */
  function renderStats(s) {
    var cap = s.uses_capacity || 0;
    var used = s.uses_used || 0;
    var unlimited = cap >= 100000;
    var cards = [
      { k: '今日访问', v: s.visits_today || 0, s: '独立访客 ' + (s.visitors_today || 0) },
      { k: '今日测评', v: s.sessions_today || 0, s: '累计访问 ' + (s.visits_total || 0) },
      { k: '累计测评', v: s.sessions_total || 0, s: '密码 ' + (s.codes_active || 0) + ' / ' + (s.codes_total || 0) + ' 个可用' },
      unlimited
        ? { k: '测评总次数', v: used, s: '当前为统一密码，不限制次数' }
        : { k: '剩余可用次数', v: cap - used, s: '已用 ' + used + ' / 共 ' + cap }
    ];
    $('#cards').innerHTML = cards.map(function (c) {
      return '<div class="card"><div class="k">' + esc(c.k) + '</div>' +
        '<div class="v">' + esc(c.v) + '</div><div class="s">' + esc(c.s) + '</div></div>';
    }).join('');

    var days = s.days || [];
    var max = 1;
    days.forEach(function (d) {
      max = Math.max(max, d.visits || 0, d.sessions || 0);
    });
    $('#chart').innerHTML = days.map(function (d) {
      var hv = Math.round((d.visits || 0) / max * 100);
      var hs = Math.round((d.sessions || 0) / max * 100);
      return '<div class="col" title="' + d.day + ' 访问 ' + d.visits + ' / 测评 ' + d.sessions + '">' +
        '<div class="bars">' +
          '<div class="bar" style="height:' + Math.max(hv, 1) + '%"></div>' +
          '<div class="bar s" style="height:' + Math.max(hs, 1) + '%"></div>' +
        '</div>' +
        '<div class="d">' + esc(d.day) + '</div>' +
      '</div>';
    }).join('');
  }

  /* ---------------- 密码列表 ---------------- */
  function codeState(c) {
    if (!c.active) return { cls: 'off', txt: '已停用' };
    if (c.used_count >= c.max_uses) return { cls: 'used', txt: '已用完' };
    if (c.used_count > 0) return { cls: 'warn', txt: '使用中' };
    return { cls: 'on', txt: '未使用' };
  }

  function renderCodes() {
    var q = ($('#code-search').value || '').trim().toUpperCase();
    var f = $('#code-filter').value;
    var list = codes.filter(function (c) {
      if (q && c.code.indexOf(q) < 0) return false;
      if (f === 'active' && (!c.active || c.used_count >= c.max_uses)) return false;
      if (f === 'used' && c.used_count < c.max_uses) return false;
      if (f === 'off' && c.active) return false;
      return true;
    });

    if (!list.length) {
      $('#codes-body').innerHTML = '<tr><td colspan="5"><div class="empty">没有符合条件的密码</div></td></tr>';
      return;
    }

    $('#codes-body').innerHTML = list.map(function (c) {
      var st = codeState(c);
      return '<tr data-code="' + esc(c.code) + '">' +
        '<td class="code">' + esc(c.code) + '</td>' +
        '<td>' + (c.max_uses >= 100000 ? (c.used_count + ' / 不限') : (c.used_count + ' / ' + c.max_uses)) + '</td>' +
        '<td><span class="tag ' + st.cls + '">' + st.txt + '</span></td>' +
        '<td>' + esc(fmt(c.created_at)) + '</td>' +
        '<td><div class="ops">' +
          '<button data-act="copy">复制</button>' +
          '<button data-act="reset">重置次数</button>' +
          '<button data-act="toggle">' + (c.active ? '停用' : '启用') + '</button>' +
          '<button data-act="del" class="danger">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function renderSessions() {
    if (!sessions.length) {
      $('#sessions-body').innerHTML = '<tr><td colspan="3"><div class="empty">还没有人开始测评</div></td></tr>';
      return;
    }
    $('#sessions-body').innerHTML = sessions.map(function (s) {
      return '<tr>' +
        '<td>' + esc(fmt(s.created_at)) + '</td>' +
        '<td class="code">' + esc(s.code || '') + '</td>' +
        '<td>' + esc((s.user_agent || '').slice(0, 60)) + '</td>' +
      '</tr>';
    }).join('');
  }

  /* ---------------- 操作 ---------------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return Promise.resolve(ok);
    } catch (e) { return Promise.resolve(false); }
  }

  function onCodeAction(act, code) {
    var item = codes.filter(function (c) { return c.code === code; })[0];
    if (!item) return;

    if (act === 'copy') {
      copyText(code).then(function (ok) { toast(ok ? '已复制 ' + code : '复制失败，请手动选中'); });
      return;
    }

    if (act === 'del') {
      if (!confirm('确定删除密码 ' + code + '？此操作不可恢复。')) return;
      remove('quiz_passwords', 'code=eq.' + encodeURIComponent(code))
        .then(function () { toast('已删除'); return loadAll(); })
        .catch(function (e) { toast('删除失败：' + e.message); });
      return;
    }

    if (act === 'reset') {
      patch('quiz_passwords', 'code=eq.' + encodeURIComponent(code), { used_count: 0 })
        .then(function () { toast('已把次数重置为 0'); return loadAll(); })
        .catch(function (e) { toast('重置失败：' + e.message); });
      return;
    }

    if (act === 'toggle') {
      patch('quiz_passwords', 'code=eq.' + encodeURIComponent(code), { active: !item.active })
        .then(function () { toast(item.active ? '已停用' : '已启用'); return loadAll(); })
        .catch(function (e) { toast('操作失败：' + e.message); });
    }
  }

  function generate() {
    var n = parseInt($('#gen-count').value, 10) || 10;
    var u = parseInt($('#gen-uses').value, 10) || 3;
    var prefix = ($('#gen-prefix').value || '').trim().toUpperCase();
    var btn = $('#gen-btn');

    btn.disabled = true;
    btn.textContent = '生成中…';

    rpc('admin_gen_codes', { p_count: n, p_uses: u, p_prefix: prefix })
      .then(function (res) {
        var list = (res && res.codes) || [];
        $('#gen-out').hidden = false;
        $('#gen-info').textContent = '已生成 ' + list.length + ' 个，每个 ' + u + ' 次';
        $('#gen-codes').value = list.join('\n');
        toast('生成了 ' + list.length + ' 个密码');
        return loadAll();
      })
      .catch(function (e) { toast('生成失败：' + e.message); })
      .then(function () {
        btn.disabled = false;
        btn.textContent = '生成';
      });
  }

  function exportCsv() {
    if (!codes.length) { toast('没有数据'); return; }
    var rows = [['密码', '已用', '上限', '状态', '创建时间']];
    codes.forEach(function (c) {
      rows.push([c.code, c.used_count, c.max_uses, codeState(c).txt, fmt(c.created_at)]);
    });
    var csv = '\ufeff' + rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'passwords-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('已导出 CSV');
  }

  /* ---------------- 事件 ---------------- */
  function bind() {
    $('#login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#login-btn');
      var err = $('#login-err');
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = '登录中…';

      login($('#email').value.trim(), $('#password').value)
        .then(function () { showApp(); })
        .catch(function (e2) { err.textContent = e2.message; })
        .then(function () {
          btn.disabled = false;
          btn.textContent = '登录';
        });
    });

    $('#logout').addEventListener('click', logout);

    $('#codes-body').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      var tr = btn.closest('tr');
      onCodeAction(btn.getAttribute('data-act'), tr.getAttribute('data-code'));
    });

    $('#code-search').addEventListener('input', renderCodes);
    $('#code-filter').addEventListener('change', renderCodes);
    $('#export').addEventListener('click', exportCsv);

    $('#gen-btn').addEventListener('click', generate);
    $('#gen-copy').addEventListener('click', function () {
      var v = $('#gen-codes').value;
      if (!v) return;
      copyText(v).then(function (ok) { toast(ok ? '已复制全部' : '复制失败'); });
    });

    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tab').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var name = t.getAttribute('data-tab');
        $('#tab-codes').hidden = name !== 'codes';
        $('#tab-sessions').hidden = name !== 'sessions';
      });
    });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    bind();
    loadSession();
    warm();
    if (!session) { logout(); return; }

    if (tokenAlive()) {
      showApp();
    } else {
      refreshToken().then(function (ok) {
        if (ok) showApp();
        else logout();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
