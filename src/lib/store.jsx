import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { seedSessions, seedScheduled, seedDataSources, defaultSettings } from './seed.js'

/* ============================================================
   全局状态：localStorage 持久化。
   这是让 BioCowork 成为「真实可用工具」的地基——会话、设置、
   定时随访、数据源都会被记住；唯一被脚本化模拟的是 Agent 的执行流。
   ============================================================ */

const KEY = 'biocowork-v2'
const StoreCtx = createContext(null)

export const uid = (p = 'id') =>
  p + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      // 合并默认设置，向前兼容新增字段
      data.settings = { ...defaultSettings, ...(data.settings || {}) }
      data.settings.redlines = { ...defaultSettings.redlines, ...(data.settings.redlines || {}) }
      return data
    }
  } catch (e) { /* 损坏则重置 */ }
  return {
    sessions: seedSessions(),
    scheduled: seedScheduled(),
    dataSources: seedDataSources(),
    settings: defaultSettings,
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [toasts, setToasts] = useState([])
  const toastTimers = useRef({})

  // 持久化（防抖）
  const saveTimer = useRef(null)
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* 容量上限：忽略 */ }
    }, 150)
    return () => clearTimeout(saveTimer.current)
  }, [state])

  /* ---------- toast ---------- */
  const toast = useCallback((msg, opts = {}) => {
    const id = uid('t')
    setToasts(t => [...t, { id, msg, warn: !!opts.warn }])
    toastTimers.current[id] = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, opts.duration || 2800)
  }, [])

  /* ---------- sessions ---------- */
  const createSession = useCallback((partial) => {
    const id = uid('s')
    const now = Date.now()
    const session = {
      id, createdAt: now, updatedAt: now,
      status: 'planning', events: [], artifacts: [],
      project: partial.project || '未归档',
      ...partial,
    }
    setState(s => ({ ...s, sessions: [session, ...s.sessions] }))
    return id
  }, [])

  const updateSession = useCallback((id, patch) => {
    setState(s => ({
      ...s,
      sessions: s.sessions.map(x =>
        x.id === id
          ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch), updatedAt: Date.now() }
          : x),
    }))
  }, [])

  const deleteSession = useCallback((id) => {
    setState(s => ({ ...s, sessions: s.sessions.filter(x => x.id !== id) }))
  }, [])

  const getSession = useCallback((id) => state.sessions.find(x => x.id === id), [state.sessions])

  /* ---------- settings ---------- */
  const setSettings = useCallback((patch) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...(typeof patch === 'function' ? patch(s.settings) : patch) } }))
  }, [])
  const setRedline = useCallback((key, val) => {
    setState(s => ({ ...s, settings: { ...s.settings, redlines: { ...s.settings.redlines, [key]: val } } }))
  }, [])

  /* ---------- scheduled ---------- */
  const addScheduled = useCallback((task) => {
    setState(s => ({ ...s, scheduled: [{ id: uid('sch'), enabled: true, ...task }, ...s.scheduled] }))
  }, [])
  const updateScheduled = useCallback((id, patch) => {
    setState(s => ({ ...s, scheduled: s.scheduled.map(x => x.id === id ? { ...x, ...patch } : x) }))
  }, [])
  const deleteScheduled = useCallback((id) => {
    setState(s => ({ ...s, scheduled: s.scheduled.filter(x => x.id !== id) }))
  }, [])

  /* ---------- data sources ---------- */
  const addDataSource = useCallback((ds) => {
    const item = { id: uid('ds'), status: 'ready', type: 'local', ...ds }
    setState(s => ({ ...s, dataSources: [item, ...s.dataSources] }))
    return item
  }, [])
  const deleteDataSource = useCallback((id) => {
    setState(s => ({ ...s, dataSources: s.dataSources.filter(x => x.id !== id) }))
  }, [])

  const resetAll = useCallback(() => {
    localStorage.removeItem(KEY)
    setState({
      sessions: seedSessions(), scheduled: seedScheduled(),
      dataSources: seedDataSources(), settings: defaultSettings,
    })
  }, [])

  const value = useMemo(() => ({
    state, toast,
    createSession, updateSession, deleteSession, getSession,
    setSettings, setRedline,
    addScheduled, updateScheduled, deleteScheduled,
    addDataSource, deleteDataSource,
    resetAll,
  }), [state, toast, createSession, updateSession, deleteSession, getSession,
    setSettings, setRedline, addScheduled, updateScheduled, deleteScheduled,
    addDataSource, deleteDataSource, resetAll])

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={'toast' + (t.warn ? ' warn' : '')}>
            <span dangerouslySetInnerHTML={{ __html: t.msg.replace(/《([^》]+)》/g, '<b>《$1》</b>') }} />
          </div>
        ))}
      </div>
    </StoreCtx.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}

/* ---------- 时间格式化小工具 ---------- */
export function relTime(ts) {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const day = Math.floor(h / 24)
  if (day < 30) return `${day} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

export function clockTime(ts) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
