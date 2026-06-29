import { uid } from './store.jsx'

/* ============================================================
   构造"上下文已压缩"摘要卡（模拟）。
   结构对齐后端临床锚定模板（biocowork-opencode 的 clinical-compaction 插件）：
     研究问题与结局 / 队列与数据定义 / 方法与参数 /
     计算返回的数值结果（逐字）/ 约束与红线（原样）/ 确认与未决
   两条硬规则在前端的体现：
     - 数值结果逐字：从工具输出/小结里原样摘出带数字的句子，不改写、不约等。
     - 约束块原样：直接搬运项目固定的红线，不软化。
   ============================================================ */

// 含数字的行（含百分号/小数/区间），视为"结果数值"，逐字保留
const NUM = /[-+]?\d[\d.,]*\s*(%|月|个月|m\b|months?)?|p\s*[=<>]|C-?index|AUC|HR|HR[:：]/i

function uniqLines(text) {
  return String(text || '')
    .split(/\r?\n|；|;|。/)
    .map(s => s.trim())
    .filter(Boolean)
}

function collectNumericFindings(events) {
  const out = []
  const seen = new Set()
  for (const ev of events) {
    const pools = []
    if (ev.kind === 'tool' && ev.output) pools.push(['工具 ' + (ev.tool || '') + (ev.title ? ' · ' + ev.title : ''), ev.output])
    if (ev.kind === 'summary' && ev.text) pools.push(['小结', ev.text])
    if (ev.kind === 'artifact' && ev.summary) pools.push([ev.title || '产物', ev.summary])
    for (const [src, text] of pools) {
      for (const line of uniqLines(text)) {
        if (!NUM.test(line)) continue
        const key = line.replace(/\s+/g, '')
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ src, line })           // line 逐字保留，不加工
      }
    }
  }
  return out
}

/** 返回一个 compaction 事件对象，插进 events 即渲染为摘要卡 */
export function buildCompactionEvent(session, { auto = false } = {}) {
  const events = session?.events || []
  // 只折叠"上一张摘要卡之后"的事件，避免重复折叠
  let from = 0
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].kind === 'compaction') { from = i + 1; break }
  }
  const live = events.slice(from)

  const methods = live
    .filter(e => e.kind === 'tool' && (e.cmd || e.title))
    .map(e => (e.title || '') + (e.cmd ? ` — \`${e.cmd}\`` : ''))
  const approvals = live
    .filter(e => e.kind === 'approval' && e.state)
    .map(e => `${e.title || e.detail || '关键步骤'}：${e.state === 'approved' ? (e.auto ? '已自动批准' : '医生已允许') : '医生已拒绝'}`)
  const numbers = collectNumericFindings(live)

  const sections = [
    {
      h: '研究问题与结局',
      items: [session?.prompt ? `医生需求：${String(session.prompt).slice(0, 140)}` : '（本会话不涉及）'],
    },
    {
      h: '队列与数据定义',
      items: [session?.dataset ? `数据集：${session.dataset}（本地处理，不出域）` : '（本会话不涉及）'],
    },
    {
      h: '方法与参数',
      items: methods.length ? methods : ['（本会话不涉及）'],
    },
    {
      h: '计算返回的数值结果（逐字）',
      verbatim: true,
      items: numbers.length ? numbers.map(n => `${n.line}  〔来自：${n.src}〕`) : ['（暂无）'],
    },
    {
      h: '约束与红线（原样保留）',
      verbatim: true,
      items: [
        '统计/建模只能经 fit_survival_model 等经验证工具完成，禁止自行编写统计代码、禁止 pip install。',
        '报告只能引用工具实际返回的字段，任何数值不得自行估算或补充。',
        '数据全程本地处理、不出域；关键步骤需医生确认。',
      ],
    },
    {
      h: '确认与未决',
      items: approvals.length ? approvals : ['（暂无已确认/未决事项）'],
    },
  ]

  return {
    id: uid('e'),
    kind: 'compaction',
    auto,
    folded: live.length,
    sections,
  }
}
