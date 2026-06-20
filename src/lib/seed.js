/* 初始种子数据（首次打开 / 重置时载入） */
import { COHORT } from './clinicalData.js'

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR

export const defaultSettings = {
  // 'ask' = 关键步骤前暂停征求同意；'act' = 自动执行（仍禁止删除）
  permissionMode: 'ask',
  defaultModel: 'Opus 4.8',
  // 'off' 断网 | 'ask' 每次询问 | 'on' 允许
  internetAccess: 'ask',
  globalInstructions:
    '我是肿瘤内科医生，主要做肺癌临床研究。请用临床医生能读懂的语言解释统计结果——' +
    'HR、p 值都要给「人话」翻译；图表风格简洁、可直接放进论文或科室汇报；' +
    '在选择统计方法（如生存分析、回归模型）前，先用一两句说明为什么这么选，再动手。',
  redlines: {
    localOnly: true,        // 数据本地不出域
    confirmKeySteps: true,  // 关键步骤人工确认
    doctorReadable: true,   // 输出医生可读
    noDelete: true,         // 永不自动删除文件
  },
}

let c = 0
const nid = (p) => `${p}-seed-${++c}`

export function seedDataSources() {
  return [
    { id: 'ds-lung', name: COHORT.name, file: COHORT.file, rows: 120, cols: 14,
      type: 'local', status: 'ready', note: '合成数据 · 仅本机读取' },
    { id: 'ds-followup', name: '术后随访登记（脱敏导出）', file: 'followup_2024Q4.xlsx', rows: 318, cols: 22,
      type: 'local', status: 'ready', note: '院内导出 · 已脱敏' },
    { id: 'ds-redcap', name: 'REDCap 研究库（演示占位）', file: 'redcap://oncology', rows: null, cols: null,
      type: 'mcp', status: 'planned', note: '需自定义连接器 / MCP（规划中）' },
  ]
}

export function seedScheduled() {
  const now = Date.now()
  return [
    {
      id: 'sch-weekly-km', title: '每周刷新生存曲线', dataset: COHORT.name,
      cadence: 'weekly', detail: '随访数据更新后重跑 KM，并提示我复核新事件',
      enabled: true, lastRun: now - 3 * DAY, nextRun: now + 4 * DAY,
    },
    {
      id: 'sch-monthly-table1', title: '每月基线表快照', dataset: '术后随访登记（脱敏导出）',
      cadence: 'monthly', detail: '月初生成 Table 1，对比上月分布漂移',
      enabled: false, lastRun: now - 20 * DAY, nextRun: now + 10 * DAY,
    },
  ]
}

export function seedSessions() {
  const now = Date.now()

  // —— 会话一：已完成的 KM 曲线分析（含产物）——
  const kmArtifact = {
    id: 'art-km-seed', type: 'km', title: 'OS 生存曲线（按治疗方案分组）',
    summary: '化疗+免疫组中位 OS 22.6 月 vs 单纯化疗 13.8 月；log-rank p=0.004。',
    createdAt: now - 2 * DAY + 12 * MIN, kind: 'chart',
  }
  const reportArtifact = {
    id: 'art-report-seed', type: 'report', title: 'OS 生存分析 · 可追溯报告',
    summary: '含方法、结果、图表与每一步处理日志，可直接放进论文初稿或科室汇报。',
    createdAt: now - 2 * DAY + 18 * MIN, kind: 'doc',
  }

  const done = {
    id: 's-seed-km',
    title: '肺癌生存预测 · KM 曲线',
    prompt: '帮我画一条生存曲线：按治疗方案分组，比较总生存 OS，并标注各组中位生存期和 12/24 月生存率。',
    dataset: COHORT.name, mode: '澄清式', model: 'Opus 4.8',
    project: '肺癌随访队列', status: 'done',
    createdAt: now - 2 * DAY, updatedAt: now - 2 * DAY + 18 * MIN,
    scenario: 'km',
    artifacts: [kmArtifact, reportArtifact],
    events: [
      { id: nid('e'), kind: 'narrate', text: '我先确认了三件事：终点是总生存 OS、按「治疗方案」分两组、时间字段 os_months / 事件字段 os_event。已生成《需求确认单》并获你确认。' },
      { id: nid('e'), kind: 'subtask', title: '读取与体检数据', state: 'done' },
      { id: nid('e'), kind: 'tool', tool: 'read', title: '读取本地数据', cmd: 'read synthetic_lung_cancer.csv', output: '120 行 × 14 列 · 编码 UTF-8 · 无表头异常', state: 'done' },
      { id: nid('e'), kind: 'tool', tool: 'python', title: '数据体检', cmd: "df.isna().mean().sort_values(ascending=False).head()", output: 'pdl1_tps   0.067\nos_months  0.000\nos_event   0.000\narm        0.000\nstage      0.000', state: 'done' },
      { id: nid('e'), kind: 'reasoning', text: 'PD-L1 缺失 6.7%，但不进入本次 KM 主分析，仅在报告中标注；生存与分组字段无缺失，可直接拟合。' },
      { id: nid('e'), kind: 'subtask', title: '拟合 Kaplan–Meier 并检验', state: 'done' },
      { id: nid('e'), kind: 'tool', tool: 'python', title: '拟合 KM + log-rank', cmd: 'KaplanMeierFitter + logrank_test(combo, chemo)', output: 'median OS  combo=22.6  chemo=13.8\nlog-rank  chi2=8.34  p=0.0039', state: 'done' },
      { id: nid('e'), kind: 'artifact', artifactId: 'art-km-seed', artType: 'km', title: 'OS 生存曲线（按治疗方案分组）' },
      { id: nid('e'), kind: 'artifact', artifactId: 'art-report-seed', artType: 'report', title: 'OS 生存分析 · 可追溯报告' },
      { id: nid('e'), kind: 'summary',
        text: '结论（人话版）：在这批合成数据里，化疗+免疫组的总生存明显优于单纯化疗组——中位生存期长约 9 个月，两组差异在统计上显著（p≈0.004）。',
        bullets: [
          '中位 OS：化疗+免疫 22.6 月（95%CI 18.4–27.9）vs 单纯化疗 13.8 月（10.9–16.7）',
          '12 个月生存率 80% vs 58%；24 个月 47% vs 25%',
          '下一步可做：Cox 多因素校正分期/ECOG，看疗效是否独立于这些预后因素',
        ] },
    ],
  }

  // —— 会话二：进行中、卡在一次写盘授权（演示 ask 模式）——
  // 该会话停在「写盘授权」处（演示 ask 模式）。step=11 对应 table1 剧本中
  // approval 之后的 write 步骤，点「允许」即可顺接剩余步骤。
  const table1Art = {
    id: 'art-table1-seed', type: 'table1', title: '基线特征表（Table 1）',
    summary: '两组基线均衡（P 均 >0.4）；PD-L1 缺失 8 例已标注。',
    createdAt: now - 6 * MIN, kind: 'table',
  }
  const awaiting = {
    id: 's-seed-table1',
    title: '肺癌生存预测 · 基线表',
    prompt: '帮我生成这批队列的基线特征表（Table 1）：按分组列出年龄、性别、分期等的分布与缺失情况。',
    dataset: COHORT.name, mode: '澄清式', model: 'Opus 4.8',
    project: '肺癌随访队列', status: 'awaiting-approval',
    createdAt: now - 35 * MIN, updatedAt: now - 4 * MIN,
    scenario: 'table1', phase: 'run', step: 11,
    artifacts: [table1Art],
    events: [
      { id: nid('e'), kind: 'narrate', text: '需求已明确：按治疗方案分两组，汇总年龄、性别、吸烟史、分期、ECOG、病理与 PD-L1，并报告缺失。' },
      { id: nid('e'), kind: 'subtask', title: '逐变量按组汇总', state: 'done' },
      { id: nid('e'), kind: 'tool', tool: 'python', title: '分组汇总 + 组间检验', cmd: "groupby('arm').agg(...)  # 连续→中位(IQR)，分类→n(%)，附检验", output: '已计算 7 个特征 × 2 组的分布与组间 P 值', state: 'done' },
      { id: nid('e'), kind: 'reasoning', text: '两组基线大体均衡（所有 P>0.4）。准备把 Table 1 写入工作区 outputs/table1_baseline.csv——这一步会在本机磁盘创建文件，按红线需要你确认。' },
      { id: nid('e'), kind: 'artifact', artifactId: 'art-table1-seed', artType: 'table1', title: '基线特征表（Table 1）' },
      { id: nid('e'), kind: 'approval', title: '写入文件到工作区', detail: 'outputs/table1_baseline.csv（约 2 KB，本机磁盘，不上传）', risk: 'write', state: 'pending' },
    ],
  }

  // —— 会话三：已完成的 Cox 多因素分析（含森林图 + 报告）——
  const forestArt = {
    id: 'art-forest-seed', type: 'forest', title: 'Cox 多因素森林图（OS）',
    summary: '校正后治疗仍获益 HR 0.58；分期 IV、ECOG 2 为独立不良预后因素。',
    createdAt: now - 1 * DAY + 9 * MIN, kind: 'chart',
  }
  const coxReportArt = {
    id: 'art-coxreport-seed', type: 'report', title: 'Cox 回归 · 可追溯报告',
    summary: '含模型设定、HR 解读、PH 假定检验与处理日志。',
    createdAt: now - 1 * DAY + 14 * MIN, kind: 'doc',
  }
  const coxDone = {
    id: 's-seed-cox',
    title: '比较两组疗效差异 · Cox',
    prompt: '帮我比较两组疗效差异：做 log-rank 检验，并用 Cox 回归看哪些因素影响预后、影响多大（输出 HR 的人话解释）。',
    dataset: COHORT.name, mode: '直接执行', model: 'Opus 4.8',
    project: '肺癌随访队列', status: 'done',
    createdAt: now - 1 * DAY, updatedAt: now - 1 * DAY + 14 * MIN,
    scenario: 'cox',
    artifacts: [forestArt, coxReportArt],
    events: [
      { id: nid('e'), kind: 'narrate', text: '需求明确，直接执行：在 OS 上做多因素 Cox，校正分期 / ECOG / 年龄等，看治疗效应是否独立。' },
      { id: nid('e'), kind: 'subtask', title: '拟合多因素 Cox', state: 'done' },
      { id: nid('e'), kind: 'tool', tool: 'python', title: '多因素 Cox 回归', cmd: 'CoxPHFitter().fit(df, "os_months", "os_event", formula="arm+stage+ecog+age+pdl1+smoke")', output: 'concordance=0.71\narm(combo) HR=0.58 (0.39–0.86) p=0.006', state: 'done' },
      { id: nid('e'), kind: 'tool', tool: 'python', title: '比例风险假定检验', cmd: 'check_assumptions(cph)  # Schoenfeld 残差', output: '全局检验 p=0.31 · 未见明显违背', state: 'done' },
      { id: nid('e'), kind: 'reasoning', text: '校正其他因素后治疗效应依旧显著，说明获益不是被分期或体能状态「带出来」的假象。' },
      { id: nid('e'), kind: 'artifact', artifactId: 'art-forest-seed', artType: 'forest', title: 'Cox 多因素森林图（OS）' },
      { id: nid('e'), kind: 'artifact', artifactId: 'art-coxreport-seed', artType: 'report', title: 'Cox 回归 · 可追溯报告' },
      { id: nid('e'), kind: 'summary',
        text: '结论（人话版）：把分期、体能状态等一起放进模型后，化疗+免疫仍能把死亡风险压低约 42%，是独立于其他因素的获益。',
        bullets: [
          '治疗（化疗+免疫）：HR 0.58（0.39–0.86），p=0.006，独立获益',
          '不良预后：IV 期 HR 1.74、ECOG 2 HR 2.05',
          '比例风险假定整体成立（全局 p=0.31），结果可信',
        ] },
    ],
  }

  return [awaiting, coxDone, done]
}
