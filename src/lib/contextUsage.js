/* ============================================================
   上下文用量（模拟）。
   后端真实的 opencode 会按 token 累加上下文，到 limit.input - reserved
   就触发压缩（见 biocowork-opencode 的 overflow.ts / opencode.json）。
   这里没有真 token，于是用「事件文本长度」估一个用量，复刻那条体验：
   平时灰 → ≥75% 预警（建议医生手动压缩）→ ≥95% 自动兜底压缩。
   数字是模拟的，但交互与「数值/约束不丢」的故事是真的。
   ============================================================ */

// 模拟的上下文窗口大小（"token"）。这是个【演示用】刻度，不是真实窗口：
// 取值经实测校准——让一次完整分析（km/cox 剧本跑完）自然落进 ≥75% 预警区，
// 同时不会误触 95% 自动线（最满的 km 剧本约 78%）。改大→更难触发，改小→更易。
export const CTX_CAP = 3000
// 预警线 / 自动兜底线（占 CTX_CAP 的比例）
export const WARN_AT = 0.75
export const AUTO_AT = 0.95
// 会话基底开销：系统 prompt + 注入的数据字典等（一次性）
const BASE_OVERHEAD = 900

const TEXT_KEYS = ['text', 'cmd', 'output', 'title', 'detail', 'summary']

/** 单条事件的估算"token"数 */
export function eventTokens(ev) {
  if (!ev) return 0
  // 压缩摘要卡本身只占很小且固定的体量（它就是用来省地方的）
  if (ev.kind === 'compaction') return 120
  let chars = 0
  for (const k of TEXT_KEYS) if (ev[k]) chars += String(ev[k]).length
  if (Array.isArray(ev.bullets)) chars += ev.bullets.join('').length
  // 中文/英文混排，约 2.5 字符 ≈ 1 token；每条事件再加一点结构开销
  return Math.ceil(chars / 2.5) + 60
}

/**
 * 计算会话当前上下文用量。
 * 关键：最后一次 compaction 事件之前的所有事件，被"折叠"进那张摘要卡，
 * 不再计入用量——这正是压缩省地方的效果，也让"一键压缩"后用量真的掉下来。
 */
export function computeUsage(session) {
  const events = session?.events || []
  let lastCompactIdx = -1
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].kind === 'compaction') { lastCompactIdx = i; break }
  }
  const live = events.slice(lastCompactIdx + 1)
  const promptTokens = session?.prompt ? Math.ceil(String(session.prompt).length / 2.5) : 0
  let tokens = BASE_OVERHEAD + promptTokens
  // 摘要卡自身（若有）要计入，它是压缩后的"锚"
  if (lastCompactIdx >= 0) tokens += eventTokens(events[lastCompactIdx])
  for (const ev of live) tokens += eventTokens(ev)

  const pct = Math.min(tokens / CTX_CAP, 1)
  const level = pct >= AUTO_AT ? 'critical' : pct >= WARN_AT ? 'warn' : 'ok'
  return { tokens, cap: CTX_CAP, pct, level, compacted: lastCompactIdx >= 0 }
}
