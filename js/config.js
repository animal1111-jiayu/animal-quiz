/* ============================================================
 * Supabase 连接配置
 *
 * Project URL      → Supabase 后台 Project Settings → API Keys 顶部
 * anon / publishable key → 同一个页面（这个 key 可以公开，放在前端没问题）
 *
 * ⚠ 绝对不要把 secret key（sb_secret_...）或 service_role 填在这里。
 *   那个是数据库最高权限，只能留在服务器端。
 * ============================================================ */

window.AQ_CONFIG = {
  SUPABASE_URL: 'https://lcbibckyzlvgwclunspn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_lH40gJ1686Yt9IjuF3Zlbg_Ca3c7OkD'
};
