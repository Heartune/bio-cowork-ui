import KMCurve from './charts/KMCurve.jsx'
import BaselineTable from './charts/BaselineTable.jsx'
import ForestPlot from './charts/ForestPlot.jsx'
import ReportDoc from './charts/ReportDoc.jsx'

/* 按 artType 渲染对应的产物 */
export default function ArtifactView({ artType, scenario, date }) {
  switch (artType) {
    case 'km': return <KMCurve />
    case 'table1': return <BaselineTable />
    case 'forest': return <ForestPlot />
    case 'report': return <ReportDoc kind={scenario === 'cox' ? 'cox' : 'km'} date={date} />
    default: return <div className="muted">未知产物类型</div>
  }
}

export const ART_META = {
  km: { icon: 'curve', label: '生存曲线', kind: '图表' },
  table1: { icon: 'table', label: '基线表', kind: '表格' },
  forest: { icon: 'compare', label: '森林图', kind: '图表' },
  report: { icon: 'fileText', label: '可追溯报告', kind: '文档' },
}
