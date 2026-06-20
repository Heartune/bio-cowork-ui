import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useStore, relTime } from '../lib/store.jsx'
import './common.css'

const CADENCE = { daily: '每天', weekly: '每周', monthly: '每月' }
const DAY = 86400000
const NEXT = { daily: DAY, weekly: 7 * DAY, monthly: 30 * DAY }

export default function Scheduled() {
  const { state, addScheduled, updateScheduled, deleteScheduled, toast } = useStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', dataset: state.dataSources[0]?.name || '', cadence: 'weekly', detail: '' })

  const submit = () => {
    if (!form.title.trim()) { toast('给这个定时任务起个名字', { warn: true }); return }
    addScheduled({
      title: form.title.trim(), dataset: form.dataset, cadence: form.cadence,
      detail: form.detail.trim() || '到点自动重跑分析并提示我复核',
      lastRun: null, nextRun: Date.now() + NEXT[form.cadence],
    })
    setForm({ title: '', dataset: state.dataSources[0]?.name || '', cadence: 'weekly', detail: '' })
    setAdding(false)
    toast('已创建定时随访：' + form.title.trim())
  }

  return (
    <div className="page">
      <div className="page-head reveal">
        <h1>定时随访</h1>
        <p>让分析按节奏自动重跑——随访数据更新后，到点重算一遍并提示你复核新事件。结果只在本机生成，不会自动外发。</p>
      </div>

      <div className="toolbar reveal d1">
        <span className="badge"><Icon name="clock" size={13} className="ic" />{state.scheduled.filter(s => s.enabled).length} 个进行中</span>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setAdding(a => !a)}>
          <Icon name={adding ? 'x' : 'plus'} size={15} className="ic" />{adding ? '取消' : '新建定时'}
        </button>
      </div>

      {adding && (
        <div className="set-section reveal" style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>任务名称</div>
              <input className="set-textarea" style={{ minHeight: 0, padding: '10px 14px' }} value={form.title} placeholder="例如：每周刷新生存曲线" onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>数据集</div>
                <select className="set-textarea" style={{ minHeight: 0, padding: '10px 14px' }} value={form.dataset} onChange={e => setForm(f => ({ ...f, dataset: e.target.value }))}>
                  {state.dataSources.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>频率</div>
                <div className="seg" style={{ height: 42 }}>
                  {Object.entries(CADENCE).map(([k, l]) => (
                    <button key={k} className={form.cadence === k ? 'on' : ''} onClick={() => setForm(f => ({ ...f, cadence: k }))}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>说明（可选）</div>
              <input className="set-textarea" style={{ minHeight: 0, padding: '10px 14px' }} value={form.detail} placeholder="到点要做什么、提醒你看什么" onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />
            </div>
            <div><button className="btn primary" onClick={submit}><Icon name="check" size={15} className="ic" />创建</button></div>
          </div>
        </div>
      )}

      {state.scheduled.length === 0 ? (
        <div className="empty-state reveal d2">
          <div className="eic"><Icon name="clock" size={30} /></div>
          <h3>还没有定时任务</h3>
          <p>为反复要做的分析设个节奏，到点自动重跑并提示你复核。</p>
        </div>
      ) : (
        <div className="list reveal d2">
          {state.scheduled.map(s => (
            <div key={s.id} className="row-card" style={{ cursor: 'default' }}>
              <span className="ri" style={{ background: s.enabled ? 'var(--teal-wash)' : 'var(--bg-2)', borderColor: s.enabled ? 'var(--teal-line)' : 'var(--line)' }}>
                <Icon name="clock" size={20} />
              </span>
              <div className="rb">
                <div className="rt">{s.title}
                  <span className={'pill-status ' + (s.enabled ? 'run' : 'off')}><span className="d" />{s.enabled ? CADENCE[s.cadence] : '已暂停'}</span>
                </div>
                <div className="rs">{s.detail} · {s.dataset}</div>
              </div>
              <div className="rmeta" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span>{s.enabled ? `下次 ${relTime(s.nextRun)}` : '未排程'}</span>
                <span style={{ fontSize: 11 }}>{s.lastRun ? `上次 ${relTime(s.lastRun)}` : '尚未运行'}</span>
              </div>
              <div className="ract">
                <button className={'switch' + (s.enabled ? ' on' : '')} onClick={() => { updateScheduled(s.id, { enabled: !s.enabled }); toast(s.enabled ? '已暂停：' + s.title : '已启用：' + s.title) }} aria-label="启用" />
                <button className="iconbtn" title="立即运行一次" onClick={() => { updateScheduled(s.id, { lastRun: Date.now() }); toast('已触发一次运行 · 完成后会在《我的研究》提示复核') }}><Icon name="play" size={16} /></button>
                <button className="iconbtn danger" title="删除" onClick={() => { deleteScheduled(s.id); toast('已删除定时：' + s.title) }}><Icon name="trash" size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
