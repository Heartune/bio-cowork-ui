import { COX } from '../../lib/clinicalData.js'
import './charts.css'

/* Cox 多因素回归森林图（HR 取对数刻度，用百分比定位的 HTML 绘制，保证清晰不变形） */
const LO = Math.log(0.25), HI = Math.log(4)
const xpct = (hr) => 4 + ((Math.log(hr) - LO) / (HI - LO)) * 92 // 映射到 4%..96%
const TICKS = [0.25, 0.5, 1, 2, 4]

function color(r) {
  const crosses = r.lo < 1 && r.hi > 1
  if (crosses) return 'var(--ink-faint)'
  return r.hr < 1 ? 'var(--teal)' : 'var(--coral)'
}

function Track({ r }) {
  const c = color(r)
  const l = xpct(r.lo), h = xpct(r.hi), m = xpct(r.hr)
  return (
    <div className="ftrack">
      <span className="ref" style={{ left: `${xpct(1)}%` }} />
      <span className="ci" style={{ left: `${l}%`, width: `${h - l}%`, background: c }} />
      <span className="cap" style={{ left: `${l}%`, background: c }} />
      <span className="cap" style={{ left: `${h}%`, background: c }} />
      <span className="mk" style={{ left: `${m}%`, background: c }} />
    </div>
  )
}

export default function ForestPlot() {
  return (
    <div className="chart">
      <div className="forest-head">
        <span>因素</span><span style={{ textAlign: 'center' }}>← 获益　|　风险 →</span><span className="c3">HR (95%CI) · P</span>
      </div>
      {COX.rows.map((r, i) => (
        <div className="forest-row" key={i}>
          <span className="fv">{r.v}</span>
          <Track r={r} />
          <span className="fnum">{r.hr.toFixed(2)} ({r.lo.toFixed(2)}–{r.hi.toFixed(2)})<br /><span className={Number(r.p) < 0.05 ? 'sig' : 'p'}>p = {r.p}</span></span>
        </div>
      ))}
      {/* 轴刻度 */}
      <div className="forest-row" style={{ borderBottom: 'none', paddingTop: 6, paddingBottom: 0 }}>
        <span></span>
        <div className="faxis">
          {TICKS.map(t => (
            <span key={t} className="tk" style={{ left: `${xpct(t)}%` }}>{t}</span>
          ))}
        </div>
        <span></span>
      </div>
      <div className="notes" style={{ marginTop: 6 }}>
        <div>{COX.model}</div>
        <div>{COX.ref}</div>
        <div>{COX.ph}</div>
      </div>
    </div>
  )
}
