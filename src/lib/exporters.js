/* 真·本地导出：在浏览器内把产物拼成 CSV / Markdown 并触发下载，
   全程不联网，呼应「数据不出域」。 */
import { KM, TABLE1, COX, COHORT } from './clinicalData.js'

export function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob(['﻿' + text], { type: mime }) // BOM 以便 Excel 正确识别中文
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 0)
}

const kmCSV = () => {
  const rows = [['指标', '化疗+免疫', '单纯化疗']]
  rows.push(['中位OS_月', KM.median.combo.est, KM.median.chemo.est])
  rows.push(['中位OS_95CI', `${KM.median.combo.lo}-${KM.median.combo.hi}`, `${KM.median.chemo.lo}-${KM.median.chemo.hi}`])
  KM.landmark.forEach(l => rows.push([`${l.t}月生存率_%`, l.combo, l.chemo]))
  rows.push(['log_rank_p', KM.logrank.p, ''])
  rows.push(['HR_combo_vs_chemo', `${KM.hr.est} (${KM.hr.lo}-${KM.hr.hi})`, `p=${KM.hr.p}`])
  return rows.map(r => r.join(',')).join('\n')
}
const table1CSV = () =>
  [TABLE1.cols.join(',')].concat(TABLE1.rows.map(r => [r.f, r.a, r.b, r.p].join(','))).join('\n')
const coxCSV = () =>
  ['因素,HR,CI_low,CI_high,P'].concat(COX.rows.map(r => [r.v, r.hr, r.lo, r.hi, r.p].join(','))).join('\n')

const reportMD = (kind) => {
  const isCox = kind === 'cox'
  const L = []
  L.push(`# ${isCox ? '总生存的多因素 Cox 回归分析' : '不同治疗方案的总生存（OS）分析'}`)
  L.push(`\n> BioCowork 可追溯报告 · 数据集：${COHORT.name}（n=${COHORT.n}）· 本机生成，数据未出域\n`)
  L.push('## 1. 数据与人群')
  L.push(`- 队列共 ${COHORT.n} 例：${COHORT.groups.map(g => `${g.label} ${g.n} 例`).join('、')}`)
  L.push('- 终点：总生存 OS（os_months / os_event）；PD-L1 缺失 8 例，仅在基线表标注。')
  L.push('\n## 2. 方法')
  L.push(isCox
    ? '- 多因素 Cox 比例风险回归；Schoenfeld 残差检验 PH 假定（全局 p=0.31）。'
    : '- Kaplan–Meier 估计生存函数与中位生存；log-rank 比较；Cox 估计 HR。')
  L.push('\n## 3. 关键结果')
  if (isCox) {
    L.push(`- 治疗（化疗+免疫）：HR ${COX.rows[0].hr}（${COX.rows[0].lo}–${COX.rows[0].hi}），p=${COX.rows[0].p}，独立获益。`)
    L.push('- 不良预后：IV 期 HR 1.74、ECOG 2 HR 2.05。')
    L.push('\n| 因素 | HR | 95%CI | P |\n|---|---|---|---|')
    COX.rows.forEach(r => L.push(`| ${r.v} | ${r.hr} | ${r.lo}–${r.hi} | ${r.p} |`))
  } else {
    L.push(`- 中位 OS：化疗+免疫 ${KM.median.combo.est} 月 vs 单纯化疗 ${KM.median.chemo.est} 月；log-rank p=${KM.logrank.p}。`)
    L.push(`- HR ${KM.hr.est}（${KM.hr.lo}–${KM.hr.hi}）；12 月生存率 80% vs 58%，24 月 47% vs 25%。`)
  }
  L.push('\n## 4. 局限')
  L.push('- 本报告基于**合成演示数据**，不构成任何真实临床结论。')
  L.push('\n---\n*由 BioCowork 在本机生成，AI 辅助分析仅供研究参考。*')
  return L.join('\n')
}

/* 按产物类型导出对应文件 */
export function exportArtifact(artType, scenario) {
  switch (artType) {
    case 'km': return downloadText('km_summary.csv', kmCSV(), 'text/csv;charset=utf-8')
    case 'table1': return downloadText('table1_baseline.csv', table1CSV(), 'text/csv;charset=utf-8')
    case 'forest': return downloadText('cox_table.csv', coxCSV(), 'text/csv;charset=utf-8')
    case 'report': return downloadText('analysis_report.md', reportMD(scenario === 'cox' ? 'cox' : 'km'), 'text/markdown;charset=utf-8')
    default: return false
  }
}
