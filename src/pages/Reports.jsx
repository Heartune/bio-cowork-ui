import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../lib/Icon.jsx'
import { useStore, relTime } from '../lib/store.jsx'
import ArtifactView, { ART_META } from '../components/ArtifactView.jsx'
import { exportArtifact } from '../lib/exporters.js'
import './common.css'

export default function Reports() {
  const { state, toast } = useStore()
  const [filter, setFilter] = useState('all')
  const [preview, setPreview] = useState(null) // {art, session}

  useEffect(() => {
    if (!preview) return
    const onKey = (e) => { if (e.key === 'Escape') setPreview(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview])

  // 汇总所有产物
  const all = []
  state.sessions.forEach(s => (s.artifacts || []).forEach(a => all.push({ art: a, session: s })))
  all.sort((x, y) => (y.art.createdAt || 0) - (x.art.createdAt || 0))
  const shown = filter === 'all' ? all
    : filter === 'chart' ? all.filter(x => ['km', 'forest'].includes(x.art.type))
    : filter === 'table' ? all.filter(x => x.art.type === 'table1')
    : all.filter(x => x.art.type === 'report')

  return (
    <div className="page">
      <div className="page-head reveal">
        <h1>图表与报告</h1>
        <p>所有分析生成的图、表与可追溯报告都汇总在这里——每一份都标注了来源会话与数据集，可随时回看或导出。</p>
      </div>

      <div className="toolbar reveal d1">
        <div className="seg">
          {[['all', '全部'], ['chart', '图表'], ['table', '表格'], ['report', '报告']].map(([k, l]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="spacer" />
        <span className="muted" style={{ fontSize: 12.5 }}>共 {all.length} 份产物</span>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state reveal d2">
          <div className="eic"><Icon name="chart" size={30} /></div>
          <h3>还没有这类产物</h3>
          <p>运行一个分析，生成的图表与报告会出现在这里。</p>
          <Link to="/" className="btn primary"><Icon name="plus" size={15} className="ic" />新建分析</Link>
        </div>
      ) : (
        <div className="grid-cards reveal d2">
          {shown.map(({ art, session }) => {
            const meta = ART_META[art.type] || { icon: 'file', kind: '产物' }
            return (
              <button key={art.id} className="item-card" onClick={() => setPreview({ art, session })} style={{ textAlign: 'left', cursor: 'pointer' }}>
                <span className="ci"><Icon name={meta.icon} size={22} /></span>
                <h3 style={{ fontSize: 15 }}>{art.title}</h3>
                <p>{art.summary}</p>
                <div className="cfoot">
                  <span className="ctag">{meta.kind}</span>
                  <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{art.createdAt ? relTime(art.createdAt) : ''}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {preview && (
        <div className="modal-scrim" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="mh">
              <span className="mi"><Icon name={(ART_META[preview.art.type] || {}).icon || 'file'} size={20} /></span>
              <div className="mt">
                <div className="t">{preview.art.title}</div>
                <div className="s">来自《{preview.session.title}》 · {preview.session.dataset}</div>
              </div>
              <Link to={`/session/${preview.session.id}`} className="btn ghost" onClick={() => setPreview(null)}><Icon name="arrowRight" size={15} className="ic" />在会话中打开</Link>
              <button className="iconbtn" title="下载到本机" onClick={() => { exportArtifact(preview.art.type, preview.session.scenario); toast('已导出《' + preview.art.title + '》到本机下载目录（数据不出域）') }}><Icon name="download" size={17} /></button>
              <button className="iconbtn" onClick={() => setPreview(null)}><Icon name="x" size={18} /></button>
            </div>
            <div className="mbody">
              <ArtifactView artType={preview.art.type} scenario={preview.session.scenario} date={preview.art.createdAt} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
