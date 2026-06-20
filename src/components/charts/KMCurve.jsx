import { KM, COHORT } from '../../lib/clinicalData.js'
import './charts.css'

/* Kaplan–Meier 生存曲线（自绘 SVG，临床编辑感）。
   含阶梯曲线、删失刻度、中位生存参考线、风险人数表与统计摘要。 */

const W = 660, H = 340
const padL = 52, padR = 18, padT = 16, padB = 42
const plotW = W - padL - padR
const plotH = H - padT - padB
const COLORS = { combo: '#137a6b', chemo: '#d2603f' }

const x = (t) => padL + (t / KM.xMax) * plotW
const y = (s) => padT + (1 - s) * plotH

function stepPath(points) {
  let d = `M ${x(points[0][0]).toFixed(1)} ${y(points[0][1]).toFixed(1)}`
  let prevS = points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [t, s] = points[i]
    d += ` H ${x(t).toFixed(1)} V ${y(s).toFixed(1)}`
    prevS = s
  }
  return d
}
function survAt(points, t) {
  let s = points[0][1]
  for (const [pt, ps] of points) { if (pt <= t) s = ps; else break }
  return s
}

export default function KMCurve() {
  const yTicks = [0, 0.25, 0.5, 0.75, 1]
  const xTicks = [0, 6, 12, 18, 24, 30]

  return (
    <div className="chart">
      <div className="chart-legend">
        {COHORT.groups.map(g => (
          <span className="lg" key={g.key}>
            <span className="sw" style={{ background: COLORS[g.key] }} />
            {g.label}（n={g.n}）
          </span>
        ))}
        <span className="lg"><span className="sw" style={{ background: 'transparent', border: '1px solid var(--ink-faint)', height: 9, width: 9, borderRadius: 2 }} /> + 删失</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kaplan-Meier 生存曲线">
        {/* 网格 */}
        {yTicks.map(s => (
          <g key={'y' + s}>
            <line className="grid" x1={padL} y1={y(s)} x2={W - padR} y2={y(s)} />
            <text className="tick-txt" x={padL - 8} y={y(s) + 3.5} textAnchor="end">{(s * 100).toFixed(0)}</text>
          </g>
        ))}
        {xTicks.map(t => (
          <text key={'x' + t} className="tick-txt" x={x(t)} y={H - padB + 16} textAnchor="middle">{t}</text>
        ))}
        {/* 坐标轴 */}
        <line className="axis-line" x1={padL} y1={padT} x2={padL} y2={H - padB} />
        <line className="axis-line" x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} />
        <text className="axis-title" x={padL} y={H - 6}>随访时间（{KM.unit}）</text>
        <text className="axis-title" transform={`translate(14 ${padT + plotH / 2}) rotate(-90)`} textAnchor="middle">总生存率（%）</text>

        {/* 中位生存参考线 */}
        <line className="grid-dash" x1={padL} y1={y(0.5)} x2={x(KM.median.combo.est)} y2={y(0.5)} />
        {COHORT.groups.map(g => {
          const m = KM.median[g.key].est
          return <line key={'m' + g.key} className="grid-dash" x1={x(m)} y1={y(0.5)} x2={x(m)} y2={H - padB} style={{ stroke: COLORS[g.key], opacity: .5 }} />
        })}

        {/* 曲线 */}
        {COHORT.groups.map(g => {
          const pts = KM.curves[g.key]
          const d = stepPath(pts)
          return (
            <path key={g.key} d={d} fill="none" stroke={COLORS[g.key]} strokeWidth="2.4"
              strokeLinejoin="round" strokeLinecap="round"
              style={{ '--len': 2000, strokeDasharray: 2000 }} className="draw" />
          )
        })}

        {/* 删失刻度 */}
        {COHORT.groups.map(g =>
          KM.censors[g.key].map(t => {
            const s = survAt(KM.curves[g.key], t)
            return <line key={g.key + t} x1={x(t)} y1={y(s) - 4} x2={x(t)} y2={y(s) + 4} stroke={COLORS[g.key]} strokeWidth="1.6" />
          })
        )}
      </svg>

      <table className="risk-table">
        <caption>各时点风险人数（n at risk）</caption>
        <thead>
          <tr><th></th>{KM.riskTimes.map(t => <th key={t}>{t} {KM.unit}</th>)}</tr>
        </thead>
        <tbody>
          {COHORT.groups.map(g => (
            <tr key={g.key}>
              <td><span className="grp-dot" style={{ background: COLORS[g.key] }} />{g.label}</td>
              {KM.atRisk[g.key].map((n, i) => <td key={i}>{n}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="stat-strip">
        <div className="stat-pill good">
          <div className="k">中位 OS · 化疗+免疫</div>
          <div className="v">{KM.median.combo.est} <small>月（{KM.median.combo.lo}–{KM.median.combo.hi}）</small></div>
        </div>
        <div className="stat-pill">
          <div className="k">中位 OS · 单纯化疗</div>
          <div className="v">{KM.median.chemo.est} <small>月（{KM.median.chemo.lo}–{KM.median.chemo.hi}）</small></div>
        </div>
        <div className="stat-pill">
          <div className="k">log-rank</div>
          <div className="v">p = {KM.logrank.p} <small>χ²={KM.logrank.chiSq}</small></div>
        </div>
        <div className="stat-pill good">
          <div className="k">HR（combo vs chemo）</div>
          <div className="v">{KM.hr.est} <small>（{KM.hr.lo}–{KM.hr.hi}）</small></div>
        </div>
      </div>
    </div>
  )
}
