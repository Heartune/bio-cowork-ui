import { TABLE1 } from '../../lib/clinicalData.js'
import './charts.css'

/* 基线特征表 Table 1（论文可用样式） */
export default function BaselineTable() {
  return (
    <div className="chart">
      <table className="dtable">
        <thead>
          <tr>{TABLE1.cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {TABLE1.rows.map((r, i) => (
            <tr key={i}>
              <td>{r.f}</td>
              <td>{r.a}</td>
              <td>{r.b}</td>
              <td className="pcol">{r.p}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="notes">
        {TABLE1.notes.map((n, i) => <div key={i}>{n}</div>)}
      </div>
    </div>
  )
}
