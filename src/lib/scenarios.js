/* ============================================================
   脚本化的 Agent 执行剧本。
   每个剧本 = { plan, steps }：
     plan.assumptions  澄清式下展示为《需求确认单》
     plan.steps        计划清单（计划复核阶段展示）
     steps[]           执行阶段逐条「播放」的事件
   step 类型：reasoning / narrate / subtask / tool / approval / artifact / summary
   说明：所有数据为合成示例，不构成真实临床结论。
   ============================================================ */

const explainPlan = {
  title: '仅讲解模式',
  assumptions: ['不读取、不修改任何数据', '只解释方法与思路，给出可操作的下一步'],
  steps: ['梳理你的问题属于哪类统计任务', '解释推荐方法与前提假设', '给出落地步骤与常见坑'],
}

function explainScenario(topic) {
  return {
    explain: true,
    plan: explainPlan,
    steps: [
      { t: 'reasoning', text: `你选择了「仅讲解」。我不会触碰数据，只把${topic}的思路讲清楚。` },
      { t: 'narrate', text: `这类问题通常分三步：先看数据结构与终点定义，再选与终点匹配的统计方法，最后把结果翻译成临床能用的话。` },
      { t: 'subtask', title: '方法与前提', state: 'done' },
      { t: 'narrate', text: `生存类终点（带随访时间 + 事件/删失）用 Kaplan–Meier 描述、log-rank 比较、Cox 回归做多因素校正；二分类结局才用 logistic。关键前提：删失是「无信息删失」、Cox 需比例风险假定大致成立。` },
      { t: 'summary', text: '已讲解完毕（未读取任何数据）。准备好后，切到「澄清式」或「直接执行」，我就能按上面的思路真正跑一遍。', bullets: [
        '先确认：终点是什么、怎么分组、时间/事件字段叫什么',
        '再选方法：生存→KM/Cox；分类→卡方/logistic',
        '最后产出：图 + 表 + 可追溯报告，并给 HR/p 的人话解释',
      ] },
    ],
  }
}

/* —— 通用的「读取 + 体检」前奏，多数剧本共用 —— */
const intakeSteps = (file) => ([
  { t: 'subtask', title: '读取与体检数据', state: 'done' },
  { t: 'tool', tool: 'shell', title: '挂载本地工作区（隔离 VM）', cmd: `mount --readonly ./data  # ${file}`, output: 'mounted ./data (read-only) · 数据全程不出本机', dur: 900 },
  { t: 'tool', tool: 'read', title: '读取本地数据', cmd: `read ${file}`, output: '120 行 × 14 列 · UTF-8 · 分隔符 , · 无表头异常', dur: 1100 },
  { t: 'tool', tool: 'python', title: '缺失值体检', cmd: 'df.isna().mean().sort_values(ascending=False).head()', output: 'pdl1_tps   0.067\nos_months  0.000\nos_event   0.000\narm        0.000\nstage      0.000', dur: 1300 },
  { t: 'reasoning', text: 'PD-L1 缺失 6.7%，其余关键字段无缺失。本次主分析不依赖 PD-L1，仅在报告中标注缺失情况。' },
])

const kmScenario = (file) => ({
  plan: {
    title: '生存曲线（Kaplan–Meier）分析计划',
    assumptions: [
      '终点 = 总生存 OS（时间字段 os_months，事件字段 os_event：1=死亡，0=删失）',
      '分组 = 治疗方案 arm（化疗+免疫 vs 单纯化疗）',
      '随访以月为单位，从随机化/确诊起算',
    ],
    steps: [
      '读取并体检数据（缺失、编码、字段类型）',
      '按 arm 拟合 Kaplan–Meier，计算中位生存与 12/24 月生存率',
      'log-rank 检验比较两组，估计 HR 与 95%CI',
      '绘制带风险人数表的生存曲线，并生成可追溯报告',
    ],
  },
  steps: [
    { t: 'narrate', text: '需求已确认：终点 OS、按治疗方案分两组、时间/事件字段为 os_months / os_event。开始执行（关键写盘步骤会先征求你同意）。' },
    ...intakeSteps(file),
    { t: 'subtask', title: '拟合 Kaplan–Meier 并检验', state: 'done' },
    { t: 'tool', tool: 'python', title: '拟合 KM + 中位生存', cmd: "for arm in groups: KaplanMeierFitter().fit(T, E); median_survival_times(kmf)", output: 'median OS  combo=22.6 (95%CI 18.4–27.9)\n           chemo=13.8 (95%CI 10.9–16.7)', dur: 1600 },
    { t: 'tool', tool: 'python', title: 'log-rank 检验 + Cox 单因素 HR', cmd: 'logrank_test(combo, chemo); CoxPHFitter().fit(...)', output: 'log-rank  chi2=8.34  p=0.0039\nHR(combo vs chemo)=0.58  95%CI 0.39–0.86', dur: 1500 },
    { t: 'reasoning', text: '两组分离清晰、p<0.01，HR≈0.58 表示化疗+免疫组的死亡风险约降低 42%。下面把图画出来——配色用青绿/暖橙区分两组，并附风险人数表。' },
    { t: 'artifact', artType: 'km', title: 'OS 生存曲线（按治疗方案分组）', summary: '化疗+免疫中位 OS 22.6 月 vs 单纯化疗 13.8 月；log-rank p=0.004。', kind: 'chart' },
    { t: 'approval', title: '写入文件到工作区', detail: 'outputs/km_os_by_arm.svg + km_summary.csv（本机磁盘，不上传）', risk: 'write' },
    { t: 'tool', tool: 'write', title: '导出图与汇总', cmd: 'write outputs/km_os_by_arm.svg, outputs/km_summary.csv', output: '已写入 2 个文件到 ./outputs（约 36 KB）', dur: 900 },
    { t: 'artifact', artType: 'report', title: 'OS 生存分析 · 可追溯报告', summary: '方法 + 结果 + 图表 + 每步处理日志，可直接放进论文初稿或科室汇报。', kind: 'doc' },
    { t: 'summary', text: '结论（人话版）：这批数据里化疗+免疫组的总生存明显更好——中位生存期长约 9 个月，差异在统计上显著（p≈0.004）。', bullets: [
      '中位 OS：化疗+免疫 22.6 月 vs 单纯化疗 13.8 月',
      '12 个月生存率 80% vs 58%；24 个月 47% vs 25%',
      '建议下一步：用 Cox 多因素校正分期 / ECOG，确认疗效是否独立于这些预后因素',
    ] },
  ],
})

const table1Scenario = (file) => ({
  plan: {
    title: '基线特征表（Table 1）生成计划',
    assumptions: [
      '按治疗方案 arm 分两列，另给组间检验 P 值',
      '连续变量 → 中位数 (IQR)，分类变量 → n (%)',
      '如实报告每个变量的缺失数，缺失从分母中扣除',
    ],
    steps: [
      '读取并体检数据',
      '逐变量按组汇总分布（年龄/性别/吸烟/分期/ECOG/病理/PD-L1）',
      '连续变量用秩和检验、分类变量用卡方/Fisher 做组间比较',
      '生成可放进论文的 Table 1，并导出 CSV',
    ],
  },
  steps: [
    { t: 'narrate', text: '需求已明确：按治疗方案分两组，汇总 7 个基线特征并报告缺失与组间差异。' },
    ...intakeSteps(file),
    { t: 'subtask', title: '逐变量按组汇总', state: 'done' },
    { t: 'tool', tool: 'python', title: '分组汇总 + 组间检验', cmd: "groupby('arm').agg(...)  # 连续→中位(IQR)，分类→n(%)，附检验", output: '已计算 7 个特征 × 2 组的分布与组间 P 值', dur: 1500 },
    { t: 'reasoning', text: '两组基线大体均衡（所有 P>0.4），说明分组没有明显的选择性偏倚——这让后面的疗效比较更可信。PD-L1 有 8 例缺失，会在表注里写清楚。' },
    { t: 'artifact', artType: 'table1', title: '基线特征表（Table 1）', summary: '两组基线均衡（P 均 >0.4）；PD-L1 缺失 8 例已标注。', kind: 'table' },
    { t: 'approval', title: '写入文件到工作区', detail: 'outputs/table1_baseline.csv（约 2 KB，本机磁盘，不上传）', risk: 'write' },
    { t: 'tool', tool: 'write', title: '导出 Table 1', cmd: 'write outputs/table1_baseline.csv', output: '已写入 ./outputs/table1_baseline.csv', dur: 800 },
    { t: 'summary', text: '基线表已生成。两组在年龄、性别、分期、ECOG 等关键预后因素上没有显著差异，可以放心进入疗效比较。', bullets: [
      '连续变量报告中位数 (IQR)，分类变量报告 n (%)',
      '所有组间比较 P 值均 >0.4，提示基线均衡',
      'PD-L1 缺失 8 例（A 组 3 / B 组 5），已在表注标明',
    ] },
  ],
})

const coxScenario = (file) => ({
  plan: {
    title: '多因素 Cox 回归分析计划',
    assumptions: [
      '终点 = OS；候选因素：治疗、分期、ECOG、年龄、PD-L1、吸烟史',
      '先单因素筛查，再纳入多因素 Cox 模型',
      '检查比例风险假定（Schoenfeld 残差）',
    ],
    steps: [
      '读取并体检数据',
      '单因素 + 多因素 Cox 拟合，估计各因素 HR 与 95%CI',
      '检验比例风险假定',
      '绘制森林图并生成可追溯报告',
    ],
  },
  steps: [
    { t: 'narrate', text: '需求已确认：在 OS 上做多因素 Cox，校正分期 / ECOG / 年龄等，看治疗效应是否独立。' },
    ...intakeSteps(file),
    { t: 'subtask', title: '拟合多因素 Cox', state: 'done' },
    { t: 'tool', tool: 'python', title: '多因素 Cox 回归', cmd: 'CoxPHFitter().fit(df, "os_months", "os_event", formula="arm+stage+ecog+age+pdl1+smoke")', output: 'concordance=0.71\narm(combo) HR=0.58 (0.39–0.86) p=0.006\nstage(IV) HR=1.74 p=0.009', dur: 1700 },
    { t: 'tool', tool: 'python', title: '比例风险假定检验', cmd: 'check_assumptions(cph)  # Schoenfeld 残差', output: '全局检验 p=0.31 · 未见明显违背', dur: 1200 },
    { t: 'reasoning', text: '校正其他因素后，治疗效应依旧显著（HR 0.58，p=0.006）——说明化疗+免疫的获益不是被分期或体能状态「带出来」的假象。分期 IV 与 ECOG 2 是独立的不良预后因素。' },
    { t: 'artifact', artType: 'forest', title: 'Cox 多因素森林图（OS）', summary: '校正后治疗仍获益 HR 0.58；分期 IV、ECOG 2 为独立不良预后因素。', kind: 'chart' },
    { t: 'approval', title: '写入文件到工作区', detail: 'outputs/cox_forest.svg + cox_table.csv（本机磁盘，不上传）', risk: 'write' },
    { t: 'tool', tool: 'write', title: '导出森林图与模型表', cmd: 'write outputs/cox_forest.svg, outputs/cox_table.csv', output: '已写入 2 个文件到 ./outputs', dur: 900 },
    { t: 'artifact', artType: 'report', title: 'Cox 回归 · 可追溯报告', summary: '含模型设定、HR 解读、PH 假定检验与处理日志。', kind: 'doc' },
    { t: 'summary', text: '结论（人话版）：把分期、体能状态等一起放进模型后，化疗+免疫仍能把死亡风险压低约 42%，是独立于其他因素的获益。', bullets: [
      '治疗（化疗+免疫）：HR 0.58（0.39–0.86），p=0.006，独立获益',
      '不良预后：IV 期 HR 1.74、ECOG 2 HR 2.05',
      '比例风险假定整体成立（全局 p=0.31），结果可信',
    ] },
  ],
})

const exploreScenario = (file) => ({
  plan: {
    title: '探索性线索分析计划',
    assumptions: [
      '先做描述性概览，不替你下结论',
      '只「提示」值得进一步检验的方向，正式结论需预先设定假设再验证',
    ],
    steps: [
      '读取并体检数据',
      '对各变量做描述性概览与相关性扫描',
      '标注与预后可能相关、值得正式检验的方向',
    ],
  },
  steps: [
    { t: 'narrate', text: '我会先给一份描述性概览，再「提示」几个值得检验的方向——但不会替你下因果结论（探索性发现需要预设假设再验证）。' },
    ...intakeSteps(file),
    { t: 'subtask', title: '描述性概览与相关性扫描', state: 'done' },
    { t: 'tool', tool: 'python', title: '单变量与预后的关联扫描', cmd: 'univariate_screen(df, time="os_months", event="os_event")', output: 'top 关联（未校正）：stage、ecog、arm、pdl1_tps', dur: 1500 },
    { t: 'reasoning', text: '分期与 ECOG 的信号最强，符合临床直觉；PD-L1 有一定趋势但缺失较多，需谨慎。这些都只是「线索」，不是结论。' },
    { t: 'artifact', artType: 'table1', title: '变量概览（描述性）', summary: '描述性扫描结果——仅供提示方向，不构成结论。', kind: 'table' },
    { t: 'summary', text: '已给出探索性概览。强调：下面这些是「值得检验的方向」，不是结论；正式验证请先设定假设、再用独立分析或外部队列确认。', bullets: [
      '信号较强：分期、ECOG、治疗方案',
      '需谨慎：PD-L1（缺失 6.7%，趋势性关联）',
      '建议：把上述纳入一个预先设定的 Cox 模型正式检验',
    ] },
  ],
})

const BUILDERS = { km: kmScenario, table1: table1Scenario, cox: coxScenario, explore: exploreScenario }

export function getScenario(session) {
  if (session.mode === '仅讲解') {
    const topicMap = { km: '生存曲线', table1: '基线特征表', cox: 'Cox 回归', explore: '探索性分析' }
    return explainScenario(topicMap[session.scenario] || '这个分析')
  }
  const build = BUILDERS[session.scenario] || kmScenario
  const file = (session.dataset || '').includes('.csv') ? session.dataset : 'synthetic_lung_cancer.csv'
  return build(file)
}

/* 根据用户输入文本/任务推断剧本类型 */
export function inferScenario(text = '') {
  const t = text.toLowerCase()
  if (/(基线|table\s*1|table1|分布|缺失)/.test(text)) return 'table1'
  if (/(cox|回归|多因素|校正|独立|hr|风险比)/.test(text)) return 'cox'
  if (/(找线索|探索|哪些变量|相关|概览|看看)/.test(text)) return 'explore'
  if (/(生存|km|kaplan|曲线|os|pfs|中位生存)/.test(text) || /(survival)/.test(t)) return 'km'
  return 'km'
}
