import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../lib/Icon.jsx'
import { useStore, relTime } from '../lib/store.jsx'
import './common.css'

const STATUS_PILL = {
  done: ['ok', '已完成'],
  running: ['run', '进行中'],
  planning: ['run', '拟定计划'],
  'awaiting-plan': ['wait', '待批准计划'],
  'awaiting-approval': ['wait', '待确认'],
  paused: ['plan', '已暂停'],
}
const ART_ICON = { km: 'curve', table1: 'table', forest: 'compare', report: 'fileText' }

export default function Research() {
  const { state, deleteSession, toast } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  let sessions = state.sessions
  if (q.trim()) sessions = sessions.filter(s => (s.title + s.prompt + s.dataset).toLowerCase().includes(q.toLowerCase()))
  if (filter === 'active') sessions = sessions.filter(s => s.status !== 'done')
  if (filter === 'done') sessions = sessions.filter(s => s.status === 'done')

  // 按项目分组
  const groups = {}
  sessions.forEach(s => { (groups[s.project || '未归档'] ||= []).push(s) })
  const groupNames = Object.keys(groups)

  const del = (e, s) => {
    e.preventDefault(); e.stopPropagation()
    deleteSession(s.id)
    toast('已删除会话：' + s.title)
  }

  return (
    <div className="page">
      <div className="page-head reveal">
        <h1>我的研究</h1>
        <p>按课题归档你的分析与产物。每个会话都保留完整的执行过程、确认记录与可追溯报告。</p>
      </div>

      <div className="toolbar reveal d1">
        <div className="search">
          <Icon name="search" size={16} className="ic" />
          <input placeholder="搜索分析、提示词或数据集…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {[['all', '全部'], ['active', '进行中'], ['done', '已完成']].map(([k, l]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="spacer" />
        <Link to="/" className="btn primary"><Icon name="plus" size={15} className="ic" />新建分析</Link>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state reveal d2">
          <div className="eic"><Icon name="folder" size={30} /></div>
          <h3>还没有匹配的研究</h3>
          <p>从一个常见任务开始，或直接描述你的数据和问题。</p>
          <Link to="/" className="btn primary"><Icon name="plus" size={15} className="ic" />新建分析</Link>
        </div>
      ) : groupNames.map((g, gi) => (
        <div key={g} className={'reveal d' + Math.min(gi + 2, 6)}>
          <div className="group-label"><Icon name="folder" size={13} />{g}<span className="n">· {groups[g].length}</span><span className="ln" /></div>
          <div className="list">
            {groups[g].map(s => {
              const [cls, label] = STATUS_PILL[s.status] || ['plan', s.status]
              return (
                <Link key={s.id} to={`/session/${s.id}`} className="row-card">
                  <span className="ri"><Icon name={ART_ICON[s.scenario] || 'flask'} size={20} /></span>
                  <div className="rb">
                    <div className="rt">{s.title}<span className={'pill-status ' + cls}><span className="d" />{label}</span></div>
                    <div className="rs">{s.prompt}</div>
                  </div>
                  <div className="rmeta">
                    {s.artifacts?.length > 0 && <span><Icon name="sparkles" size={13} style={{ verticalAlign: '-2px', marginRight: 3 }} />{s.artifacts.length} 产物</span>}
                    <span>{relTime(s.updatedAt)}</span>
                  </div>
                  <div className="ract">
                    <button className="iconbtn danger" title="删除" onClick={e => del(e, s)}><Icon name="trash" size={16} /></button>
                    <Icon name="chevRight" size={16} style={{ color: 'var(--ink-faint)' }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
