import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Icon from '../lib/Icon.jsx'
import { useStore } from '../lib/store.jsx'
import { getScenario } from '../lib/scenarios.js'
import { useRunEngine } from '../lib/runEngine.js'
import { computeUsage } from '../lib/contextUsage.js'
import { buildCompactionEvent } from '../lib/compactionSummary.js'
import StreamEvent from '../components/workspace/StreamEvent.jsx'
import PlanCard from '../components/workspace/PlanCard.jsx'
import ArtifactPanel from '../components/workspace/ArtifactPanel.jsx'
import './Session.css'

const STATUS = {
  planning: { cls: 'run', label: '拟定计划中', dot: true },
  'awaiting-plan': { cls: 'wait', label: '待你批准计划' },
  running: { cls: 'run', label: '执行中', dot: true },
  'awaiting-approval': { cls: 'wait', label: '等待你确认' },
  paused: { cls: 'pause', label: '已暂停' },
  done: { cls: 'done', label: '已完成' },
}

export default function Session() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, getSession, updateSession, toast } = useStore()
  const session = getSession(id)

  const scenario = useMemo(
    () => session ? getScenario(session) : null,
    [session?.scenario, session?.mode, session?.dataset]
  )
  const engine = useRunEngine({ session, scenario, settings: state.settings, updateSession })

  const [tab, setTab] = useState('art')
  const [selectedArt, setSelectedArt] = useState(null)
  const [steerText, setSteerText] = useState('')
  const [mobileSide, setMobileSide] = useState(false)
  const streamRef = useRef(null)
  const prevArtCount = useRef(session?.artifacts?.length || 0)
  const prevEvCount = useRef(session?.events?.length || 0)
  const compactGuard = useRef(-1)

  // 上下文用量（模拟）：平时灰 → ≥75% 预警建议手动压缩 → ≥95% 自动兜底
  const usage = useMemo(() => computeUsage(session), [session?.events, session?.prompt])

  const doCompact = useCallback((auto = false) => {
    const ev = buildCompactionEvent(session, { auto })
    updateSession(id, s => ({ events: [...s.events, ev] }))
    toast(
      auto ? '对话较长，已自动压缩上下文 · 关键结论与数字已逐字保留'
           : '已压缩上下文 · 关键结论与数字已逐字保留',
      auto ? { warn: true } : {}
    )
  }, [session, id, updateSession, toast])

  // 自动兜底：用量摸到临界且没人手动压时，自动插一张摘要卡（按事件数去重，避免连发）
  useEffect(() => {
    if (!session || usage.level !== 'critical') return
    const n = session.events?.length || 0
    if (compactGuard.current === n) return
    compactGuard.current = n
    doCompact(true)
  }, [usage.level, session?.events?.length, session, doCompact])

  // 新产物出现：自动选中并切到「产物」页
  useEffect(() => {
    const arts = session?.artifacts || []
    if (arts.length > prevArtCount.current) {
      setSelectedArt(arts[arts.length - 1].id)
      setTab('art')
    }
    prevArtCount.current = arts.length
    if (!selectedArt && arts.length) setSelectedArt(arts[arts.length - 1].id)
  }, [session?.artifacts?.length])

  // 新事件：把执行流滚到底
  useEffect(() => {
    const evs = session?.events || []
    if (evs.length !== prevEvCount.current) {
      prevEvCount.current = evs.length
      const el = streamRef.current
      if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
    }
  }, [session?.events?.length, session?.status])

  if (!session) {
    return (
      <div className="page" style={{ paddingTop: 60 }}>
        <div className="page-head"><h1>会话不存在</h1><p>它可能已被删除。</p></div>
        <Link to="/" className="btn primary"><Icon name="plus" size={15} className="ic" />新建分析</Link>
      </div>
    )
  }

  const st = STATUS[session.status] || STATUS.running
  const total = scenario?.steps.length || 1
  const progress = session.status === 'done' ? 1 : Math.min((session.step || 0) / total, 0.98)
  const isActive = session.status === 'running' || session.status === 'planning'
  const pendingApproval = session.events?.some(e => e.kind === 'approval' && e.state === 'pending')

  const onSteer = () => {
    const v = steerText.trim()
    if (!v) return
    engine.steer(v)
    setSteerText('')
    if (session.status === 'paused') engine.resume()
  }
  const onSteerKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onSteer() } }

  const steerPlaceholder = session.status === 'awaiting-plan'
    ? '需要纠正或补充需求？直接说，我会据此调整计划…'
    : session.status === 'done'
    ? '想继续追问、或换个角度再分析？告诉我…'
    : session.status === 'paused'
    ? '说明你想怎么调整，我会接着做…'
    : '想中途补充或纠个方向？随时打断我…'

  return (
    <div className="ws">
      {/* 顶部条 */}
      <div className="ws-bar">
        <button className="back" onClick={() => nav(-1)} title="返回"><Icon name="back" size={18} /></button>
        <div>
          <div className="wtitle">{session.title}</div>
        </div>
        <div className="meta-chips">
          <span className="chip" style={{ color: 'var(--teal-deep)', background: 'var(--teal-wash)', borderColor: 'var(--teal-line)' }} title="数据全程本地处理，不出域"><Icon name="lock" size={13} className="ic" style={{ color: 'var(--teal-deep)' }} />本地不出域</span>
          <span className="chip"><Icon name="database" size={13} className="ic" />{session.dataset}</span>
          <span className="chip"><Icon name="brain" size={13} className="ic" />{session.mode}</span>
          <span className="chip">{session.model}</span>
        </div>
        <div className="ws-controls">
          <span className={'status-chip ' + st.cls}><span className="d" />{st.label}</span>
          <button
            className={'ctx-meter ' + usage.level}
            title={`上下文用量约 ${Math.round(usage.pct * 100)}%（模拟）` + (usage.level === 'ok' ? '' : ' · 点击压缩，关键结论与数字会逐字保留')}
            onClick={() => usage.level !== 'ok' && doCompact(false)}
            disabled={usage.level === 'ok'}
          >
            <span className="ring" style={{ '--p': usage.pct }} />
            <span className="ctx-num">{Math.round(usage.pct * 100)}%</span>
          </button>
          {session.status === 'running' && (
            <button className="btn ghost" onClick={engine.pause} title="暂停"><Icon name="pause" size={15} className="ic" />暂停</button>
          )}
          {session.status === 'paused' && (
            <button className="btn" onClick={engine.resume}><Icon name="play" size={15} className="ic" />继续</button>
          )}
          {session.status === 'done' && (
            <button className="btn" onClick={() => { setTab('art'); toast('报告与图表已在右侧 · 可下载到 ./outputs') }}><Icon name="download" size={15} className="ic" />查看产物</button>
          )}
          <button className="back ws-mobile-btn" onClick={() => setMobileSide(s => !s)} title="产物/文件"><Icon name="sparkles" size={17} /></button>
        </div>
      </div>

      {/* 进度条 */}
      <div className={'ws-progress' + (session.status === 'planning' ? ' indet' : '')}>
        <div className="fill" style={{ width: session.status === 'planning' ? undefined : `${progress * 100}%` }} />
      </div>

      <div className="ws-body">
        {/* 左：执行流 */}
        <div className="ws-stream" ref={streamRef}>
          <div className="ws-stream-inner">
            <div className="user-msg">
              <div className="who">你 · {session.mode}</div>
              {session.prompt}
            </div>

            {session.status === 'planning' && (
              <div className="working"><span className="dots"><i /><i /><i /></span> 正在分析你的请求并拟定计划…</div>
            )}

            {session.status === 'awaiting-plan' && scenario && (
              <PlanCard plan={scenario.plan} mode={session.mode} onApprove={engine.approvePlan} />
            )}

            {session.events?.map(ev => (
              <StreamEvent key={ev.id} ev={ev}
                onAllow={engine.allow} onDeny={engine.deny}
                onOpenArtifact={(aid) => { setSelectedArt(aid); setTab('art'); setMobileSide(true) }} />
            ))}

            {session.status === 'running' && !pendingApproval && (
              <div className="working"><span className="dots"><i /><i /><i /></span> Claude 正在工作…</div>
            )}
            {session.status === 'paused' && (
              <div className="working" style={{ color: 'var(--ink-faint)' }}><Icon name="pause" size={15} /> 已暂停 · 在下方补充后点「继续」，或直接发送让我接着做</div>
            )}
          </div>

          {/* 上下文预警（≥75% 且尚未到自动线时出现） */}
          {usage.level === 'warn' && (
            <div className="ctx-warn">
              <Icon name="warn" size={16} className="ic" />
              <div className="cw-text">
                <b>对话有点长了</b>，再继续可能影响后续质量。建议现在压缩一下——我会把
                <b>研究问题、方法、以及工具算出的每个数字</b>都逐字保留，只收拢中间过程。
              </div>
              <button className="btn primary cw-btn" onClick={() => doCompact(false)}>
                <Icon name="refresh" size={15} className="ic" />一键压缩
              </button>
            </div>
          )}

          {/* 操纵 / 补充输入 */}
          <div className="steer-box">
            <div className="steer-inner">
              <textarea rows={1} value={steerText} placeholder={steerPlaceholder}
                onChange={e => setSteerText(e.target.value)} onKeyDown={onSteerKey} />
              <button className="send" disabled={!steerText.trim()} onClick={onSteer} title="发送">
                <Icon name="arrowUp" size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="steer-hint"><Icon name="info" size={13} />随时可以打断或补充 · <span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> 发送 · 数据全程本地处理</div>
          </div>
        </div>

        {/* 右：产物 / 文件 / 计划 */}
        <aside className={'ws-side' + (mobileSide ? ' mobile-open' : '')}>
          <ArtifactPanel
            session={session} scenario={scenario}
            tab={tab} setTab={setTab}
            selectedArt={selectedArt} onSelect={setSelectedArt}
            progress={progress}
          />
        </aside>
      </div>
    </div>
  )
}
