import KMCurve from './KMCurve.jsx'
import ForestPlot from './ForestPlot.jsx'
import { KM, COX, COHORT } from '../../lib/clinicalData.js'
import './ReportDoc.css'

/* 可追溯报告：方法 + 结果 + 图表 + 处理日志，临床医生可读。
   kind: 'km'（生存分析）| 'cox'（多因素回归） */
export default function ReportDoc({ kind = 'km', date }) {
  const isCox = kind === 'cox'
  const today = date ? new Date(date) : new Date()
  const dstr = today.toLocaleDateString('zh-CN')

  return (
    <div className="report">
      <div className="rdoc-head">
        <div className="kicker">BioCowork · 可追溯分析报告</div>
        <h2>{isCox ? '总生存的多因素 Cox 回归分析' : '不同治疗方案的总生存（OS）分析'}</h2>
        <div className="meta">
          <span>数据集：{COHORT.name}</span>
          <span>样本量：n = {COHORT.n}</span>
          <span>生成日期：{dstr}</span>
          <span>模型：Opus 4.8</span>
        </div>
      </div>

      <h3><span className="num">1</span>研究问题</h3>
      <p>
        {isCox
          ? '在校正分期、体能状态（ECOG）、年龄等预后因素后，化疗联合免疫治疗相较单纯化疗，是否仍能独立改善总生存？'
          : '在这批肺癌随访队列中，化疗联合免疫治疗与单纯化疗相比，总生存（OS）是否存在差异？差异有多大？'}
      </p>

      <h3><span className="num">2</span>数据与人群</h3>
      <ul>
        <li>队列：{COHORT.name}，共 {COHORT.n} 例（{COHORT.groups.map(g => `${g.label} ${g.n} 例`).join('、')}）。</li>
        <li>终点：总生存 OS，时间字段 <code>os_months</code>，事件字段 <code>os_event</code>（1=死亡，0=删失）。</li>
        <li>缺失：PD-L1（TPS）缺失 8 例（6.7%），不进入主分析，仅在基线表标注。其余关键字段无缺失。</li>
      </ul>

      <h3><span className="num">3</span>统计方法</h3>
      <p>
        {isCox
          ? '采用多因素 Cox 比例风险回归估计各因素对 OS 的风险比（HR）及 95% 置信区间；以 Schoenfeld 残差检验比例风险假定。'
          : '采用 Kaplan–Meier 法估计各组生存函数与中位生存期，组间比较用 log-rank 检验，并以 Cox 回归估计风险比（HR）。'}
        显著性水平取双侧 α = 0.05。
      </p>

      <h3><span className="num">4</span>结果</h3>
      <div className="fig">
        {isCox ? <ForestPlot /> : <KMCurve />}
        <div className="cap">
          <b>图 1.</b> {isCox
            ? '多因素 Cox 回归各因素的 HR 与 95%CI 森林图。'
            : '按治疗方案分组的 Kaplan–Meier 总生存曲线，附各时点风险人数。'}
        </div>
      </div>

      <div className="keybox">
        <div className="lbl">关键结果（人话版）</div>
        {isCox ? (
          <p style={{ margin: 0 }}>
            校正其他因素后，化疗+免疫仍把死亡风险降低约 42%（HR {COX.rows[0].hr}，95%CI {COX.rows[0].lo}–{COX.rows[0].hi}，p={COX.rows[0].p}），是<b>独立</b>的获益；
            IV 期与 ECOG 2 分是独立的不良预后因素。
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            化疗+免疫组中位 OS {KM.median.combo.est} 个月，明显长于单纯化疗组的 {KM.median.chemo.est} 个月（log-rank p={KM.logrank.p}）；
            死亡风险约降低 42%（HR {KM.hr.est}，95%CI {KM.hr.lo}–{KM.hr.hi}）。12 个月生存率 80% vs 58%，24 个月 47% vs 25%。
          </p>
        )}
      </div>

      <h3><span className="num">5</span>处理日志（可复现）</h3>
      <div className="log">
        <div><span className="t">[00:00]</span> mount --readonly ./data  # {COHORT.file}（数据不出域）</div>
        <div><span className="t">[00:02]</span> load {COHORT.file} → 120×14, encoding=UTF-8</div>
        <div><span className="t">[00:05]</span> na_check → pdl1_tps 6.7%（其余 0%）</div>
        {isCox
          ? <><div><span className="t">[00:09]</span> CoxPHFitter.fit(formula="arm+stage+ecog+age+pdl1+smoke")</div>
              <div><span className="t">[00:12]</span> check_assumptions → 全局 p=0.31（PH 成立）</div></>
          : <><div><span className="t">[00:09]</span> KaplanMeierFitter.fit by arm → median combo=22.6 chemo=13.8</div>
              <div><span className="t">[00:11]</span> logrank_test → chi2=8.34 p=0.0039</div></>}
        <div><span className="t">[00:14]</span> render figure → outputs/{isCox ? 'cox_forest.svg' : 'km_os_by_arm.svg'}</div>
        <div><span className="t">[00:15]</span> ✓ done · 等待人工复核</div>
      </div>

      <h3><span className="num">6</span>局限与下一步</h3>
      <ul>
        <li>这是<b>合成演示数据</b>，结果不构成任何真实临床结论。</li>
        {isCox
          ? <li>样本量有限，部分 HR 的置信区间较宽；建议在更大队列或外部数据中验证。</li>
          : <li>为观察性比较，存在潜在混杂；建议进一步用 Cox 多因素校正分期 / ECOG（见「比较两组疗效差异」任务）。</li>}
        <li>所有图表与 CSV 已写入工作区 <code>./outputs</code>，可直接放进论文初稿或科室汇报。</li>
      </ul>

      <div className="disclaimer">
        本报告由 BioCowork 在本机生成，数据全程未离开本设备。AI 辅助分析仅供研究参考，临床决策须由具备资质的医师结合完整信息判断。
      </div>
    </div>
  )
}
