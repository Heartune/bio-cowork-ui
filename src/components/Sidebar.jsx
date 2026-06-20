import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from '../lib/Icon.jsx'
import { useStore } from '../lib/store.jsx'
import './Sidebar.css'

const NAV = [
  { to: '/', icon: 'plus', label: '新建分析', end: true, spark: 'sparkles' },
  { to: '/research', icon: 'folder', label: '我的研究' },
  { to: '/reports', icon: 'chart', label: '图表与报告' },
  { to: '/skills', icon: 'star', label: '技能库' },
  { to: '/scheduled', icon: 'clock', label: '定时随访' },
  { to: '/data', icon: 'database', label: '数据源', tag: '本地' },
  { to: '/settings', icon: 'sliders', label: '自定义' },
]

function statusClass(s) {
  if (s === 'done') return 'ok'
  if (s === 'running' || s === 'planning' || s === 'awaiting-plan') return 'run'
  return 'warn'
}

export default function Sidebar() {
  const { state, toast } = useStore()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const recents = state.sessions.slice(0, 4)
  const close = () => setOpen(false)

  return (
    <>
      <button className="sb-toggle" onClick={() => setOpen(o => !o)} aria-label="菜单">
        <Icon name={open ? 'x' : 'menu'} size={20} />
      </button>
      {open && <div className="sb-scrim" onClick={close} />}

      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand-row">
          <button className="icon-btn" title="收起侧栏（演示占位）" onClick={() => toast('演示原型：侧栏收起仅占位')}>
            <Icon name="menu" size={18} />
          </button>
          <NavLink to="/" className="brand-pill" onClick={close}>
            <span className="dot"><Icon name="pulse" size={12} strokeWidth={2.2} /></span>
            医研协作台
          </NavLink>
          <button className="icon-btn" title="开发者视图（演示占位）" onClick={() => toast('演示原型：开发者视图仅占位')}>
            <Icon name="code" size={18} />
          </button>
        </div>

        <nav className="nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={close}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Icon name={n.icon} size={17} className="ic" />
              {n.label}
              {n.tag && <span className="tag">{n.tag}</span>}
              {n.spark && loc.pathname === '/' && <Icon name={n.spark} size={15} className="spark" />}
            </NavLink>
          ))}
        </nav>

        <div className="sb-label">最近 <span className="count">{state.sessions.length}</span></div>
        {recents.map(s => {
          const cls = statusClass(s.status)
          const live = s.status === 'running' || s.status === 'planning'
          const tail = s.status === 'done' ? '已完成'
            : s.status === 'awaiting-approval' ? '待确认'
            : s.status === 'awaiting-plan' ? '待批准计划'
            : s.status === 'paused' ? '已暂停'
            : s.status === 'running' ? '进行中' : '草拟中'
          return (
            <NavLink key={s.id} to={`/session/${s.id}`} onClick={close} className={'recent ' + cls} title={s.prompt}>
              {live ? <span className="live" /> : <Icon name={cls === 'ok' ? 'checkCircle' : 'warn'} size={15} className="st" />}
              <span className="txt">{s.title} · {tail}</span>
            </NavLink>
          )
        })}

        <div className="sb-spacer" />

        <div className="sb-foot">
          <NavLink to="/skills" onClick={close} className="nav-item">
            <Icon name="help" size={17} className="ic" />
            帮助与教程
          </NavLink>
          <button className="user" onClick={() => toast('账户：本地版 · 数据全程不出域')}>
            <span className="avatar">研</span>
            <div>
              <div className="nm">研究者</div>
              <div className="plan"><span className="pin" />本地版 · 数据不出域</div>
            </div>
            <Icon name="chevDown" size={15} style={{ marginLeft: 'auto', color: 'var(--ink-faint)' }} />
          </button>
        </div>
      </aside>
    </>
  )
}
