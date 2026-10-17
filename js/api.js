/* ============================================================
 * 数据层：密码校验与次数
 * 直接调用 Supabase REST 的 RPC 接口（不依赖 supabase-js）
 * 两种 key 都支持：legacy anon(eyJ...) / publishable(sb_publishable_...)
 * ============================================================ */

var AQ = AQ || {};

(function () {

  var cfg = window.AQ_CONFIG || {};
  var url = String(cfg.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  var key = String(cfg.SUPABASE_ANON_KEY || '').trim();

  var remote = !!(url && key);
  var host = location.hostname;
  var isLocal = location.protocol === 'file:' ||
    host === 'localhost' || host === '127.0.0.1' || host === '';
  var misconfigured = !remote && !isLocal;

  function normalize(s) {
    return String(s || '').replace(/[\s\-_]/g, '').toUpperCase();
  }

  /* ---------- 本地兜底（仅未配置时使用，正式上线不要走这里） ---------- */
  var LS = 'aq_usage_v1';

  function localUsage() {
    try { return JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { return {}; }
  }
  function localUsed(code) { return localUsage()[code] || 0; }
  function localAdd(code) {
    var u = localUsage();
    u[code] = (u[code] || 0) + 1;
    try { localStorage.setItem(LS, JSON.stringify(u)); } catch (e) {}
  }

  function localPeek(code) {
    if (AQ.PASSWORDS.indexOf(code) < 0) return { ok: false, reason: 'not_found' };
    var left = AQ.CONFIG.usesPerPassword - localUsed(code);
    return left > 0
      ? { ok: true, remaining: left }
      : { ok: false, reason: 'exhausted', remaining: 0 };
  }

  function localRedeem(code) {
    var peek = localPeek(code);
    if (!peek.ok) return peek;
    localAdd(code);
    return { ok: true, remaining: peek.remaining - 1 };
  }

  /* ---------- 云端 ---------- */
  function rpc(name, body, attempt) {
    attempt = attempt || 1;
    var started = Date.now();
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;

    return fetch(url + '/rest/v1/rpc/' + name, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body || {}),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }

        if (!res.ok) {
          console.warn('[AQ] RPC ' + name + ' HTTP ' + res.status + ' (' + (Date.now() - started) + 'ms)', data);
          if (res.status === 404) return { ok: false, reason: 'no_function' };
          if (res.status === 401 || res.status === 403) return { ok: false, reason: 'auth' };
          return { ok: false, reason: 'network' };
        }
        if (!data || typeof data !== 'object') {
          console.warn('[AQ] RPC ' + name + ' 返回内容异常', txt && txt.slice(0, 200));
          return { ok: false, reason: 'network' };
        }
        return data;
      });
    }).catch(function (e) {
      if (timer) clearTimeout(timer);
      var ms = Date.now() - started;
      console.warn('[AQ] RPC ' + name + ' 第 ' + attempt + ' 次失败（' + ms + 'ms）', e && e.name, e && e.message);

      if (attempt < 2) {
        return new Promise(function (r) { setTimeout(r, 600); })
          .then(function () { return rpc(name, body, attempt + 1); });
      }
      return { ok: false, reason: (e && e.name === 'AbortError') ? 'timeout' : 'network' };
    });
  }

  AQ.API = {
    remote: remote,
    misconfigured: misconfigured,
    normalize: normalize,

    /* 只查余量，不消耗 */
    peek: function (code) {
      var c = normalize(code);
      if (!remote) return Promise.resolve(localPeek(c));
      return rpc('peek_password', { p_code: c });
    },

    /* 消耗一次 */
    redeem: function (code) {
      var c = normalize(code);
      if (!remote) return Promise.resolve(localRedeem(c));
      return rpc('redeem_password', {
        p_code: c,
        p_ua: (navigator.userAgent || '').slice(0, 280)
      });
    }
  };

  if (!remote) {
    console.warn('[AQ] 未配置 Supabase，正在使用浏览器本地校验（不要这样上线）');
  }

})();
