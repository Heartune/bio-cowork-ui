import Icon from '../../lib/Icon.jsx'

/* 计划复核卡片：执行前展示 Claude 的方案，等待用户批准。
   澄清式下，assumptions 即《需求确认单》。 */
export default function PlanCard({ plan, mode, onApprove, busy }) {
  const isClarify = mode === '澄清式'
  const isExplain = mode === '仅讲解'
  const kicker = isClarify ? '需求确认单 · 请先核对' : isExplain ? '讲解大纲' : '执行计划 · 请先核对'
  const assumeLabel = isClarify ? '我对你需求的理解（如有出入请在下方纠正）' : '前提与设定'

  return (
    <div className="plan-card reveal">
      <div className="pk"><Icon name="brain" size={14} />{kicker}</div>
      <h3>{plan.title}</h3>

      <div className="psec">{assumeLabel}</div>
      <ul className="assume">
        {plan.assumptions.map((a, i) => (
          <li key={i}><Icon name="checkCircle" size={15} className="ic" /><span>{a}</span></li>
        ))}
      </ul>

      <div className="psec">{isExplain ? '讲解步骤' : '我计划这样做'}</div>
      <ol className="plan-steps">
        {plan.steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>

      <div className="prow">
        <button className="btn primary" onClick={onApprove} disabled={busy}>
          <Icon name="play" size={15} className="ic" />
          {isClarify ? '确认无误，开始' : isExplain ? '开始讲解' : '批准计划并开始'}
        </button>
        <span className="pnote"><Icon name="info" size={14} />可以在下方直接补充或纠正，我会据此调整后再开始。</span>
      </div>
    </div>
  )
}
