import { useEffect, useRef, useCallback } from 'react'
import { uid } from './store.jsx'

/* ============================================================
   执行引擎：把剧本 steps 按真实节奏「播放」进会话事件流。
   状态机：
     planning        → （拟定计划）→ awaiting-plan
     awaiting-plan    → 用户批准 → running
     running          → 逐条发事件；遇到需确认的 approval → awaiting-approval
     awaiting-approval→ 用户 允许/拒绝 → running / paused
     paused           → 用户继续 → running
     running          → 步骤耗尽 → done
   唯一被模拟的就是这条执行流；其余（会话、设置、产物）都是真实持久化的。
   ============================================================ */

const DELAY = { reasoning: 1100, narrate: 950, subtask: 500, summary: 1200, artifact: 1300, approvalEmit: 600, approvalAuto: 750, planReady: 1000, finalize: 200 }

function isGated(step, settings) {
  if (step.risk === 'delete') return true               // 删除永远需要明确同意
  if (!settings.redlines?.confirmKeySteps) return false  // 红线关掉则不拦
  return settings.permissionMode === 'ask'
}

function makeEvent(step) {
  const base = { id: uid('e') }
  if (step.t === 'tool') return { ...base, kind: 'tool', tool: step.tool, title: step.title, cmd: step.cmd, output: step.output, dur: step.dur || 1000, state: 'running' }
  if (step.t === 'subtask') return { ...base, kind: 'subtask', title: step.title, state: 'done' }
  if (step.t === 'reasoning') return { ...base, kind: 'reasoning', text: step.text }
  if (step.t === 'narrate') return { ...base, kind: 'narrate', text: step.text }
  if (step.t === 'summary') return { ...base, kind: 'summary', text: step.text, bullets: step.bullets || [] }
  return { ...base, kind: step.t, ...step }
}

export function useRunEngine({ session, scenario, settings, updateSession }) {
  const id = session?.id
  const guard = useRef(null) // { key, timer }

  useEffect(() => {
    if (!session || !scenario) return
    const steps = scenario.steps
    const status = session.status
    const events = session.events || []
    const step = session.step ?? 0
    const last = events[events.length - 1]

    let key = `idle:${status}:${step}:${events.length}`
    let delay = 0
    let action = null

    if (status === 'planning') {
      key = `plan:${id}`
      delay = DELAY.planReady
      action = () => updateSession(id, { status: 'awaiting-plan' })
    } else if (status === 'running') {
      if (last && last.kind === 'tool' && last.state === 'running') {
        // 完成正在运行的工具调用
        key = `toolfin:${last.id}`
        delay = last.dur || 1000
        action = () => updateSession(id, s => ({
          events: s.events.map(e => e.id === last.id ? { ...e, state: 'done' } : e),
        }))
      } else if (step >= steps.length) {
        key = `done:${id}`
        delay = DELAY.finalize
        action = () => updateSession(id, { status: 'done', phase: 'done' })
      } else {
        const cur = steps[step]
        if (cur.t === 'approval') {
          if (isGated(cur, settings)) {
            key = `apprq:${id}:${step}`
            delay = DELAY.approvalEmit
            action = () => updateSession(id, s => ({
              status: 'awaiting-approval',
              step: step + 1,
              events: [...s.events, { id: uid('e'), kind: 'approval', title: cur.title, detail: cur.detail, risk: cur.risk, state: 'pending' }],
            }))
          } else {
            key = `appauto:${id}:${step}`
            delay = DELAY.approvalAuto
            action = () => updateSession(id, s => ({
              step: step + 1,
              events: [...s.events, { id: uid('e'), kind: 'approval', title: cur.title, detail: cur.detail, risk: cur.risk, state: 'approved', auto: true }],
            }))
          }
        } else if (cur.t === 'artifact') {
          key = `art:${id}:${step}`
          delay = DELAY.artifact
          action = () => updateSession(id, s => {
            const art = { id: uid('art'), type: cur.artType, title: cur.title, summary: cur.summary, kind: cur.kind, createdAt: Date.now() }
            return {
              step: step + 1,
              artifacts: [...(s.artifacts || []), art],
              events: [...s.events, { id: uid('e'), kind: 'artifact', artifactId: art.id, artType: cur.artType, title: cur.title }],
            }
          })
        } else {
          key = `emit:${id}:${step}`
          delay = DELAY[cur.t] ?? 900
          if (cur.t === 'tool') delay = 480
          action = () => updateSession(id, s => ({
            step: step + 1,
            events: [...s.events, makeEvent(cur)],
          }))
        }
      }
    }

    if (!action) { guard.current = null; return }
    if (guard.current && guard.current.key === key) return // 已有同一动作在排队
    if (guard.current) clearTimeout(guard.current.timer)
    const timer = setTimeout(() => { guard.current = null; action() }, delay)
    guard.current = { key, timer }
    return () => { clearTimeout(timer); if (guard.current && guard.current.timer === timer) guard.current = null }
  }, [session, scenario, settings, id, updateSession])

  /* ---------- 用户控制 ---------- */
  const approvePlan = useCallback(() => {
    updateSession(id, { status: 'running', phase: 'run', step: 0 })
  }, [id, updateSession])

  const allow = useCallback(() => {
    updateSession(id, s => ({
      status: 'running',
      events: s.events.map(e => (e.kind === 'approval' && e.state === 'pending') ? { ...e, state: 'approved' } : e),
    }))
  }, [id, updateSession])

  const deny = useCallback(() => {
    updateSession(id, s => ({
      status: 'paused',
      events: [
        ...s.events.map(e => (e.kind === 'approval' && e.state === 'pending') ? { ...e, state: 'denied' } : e),
        { id: uid('e'), kind: 'narrate', text: '好的，已按你的选择停止这一步。你可以在下方说明要怎么调整，我再继续。' },
      ],
    }))
  }, [id, updateSession])

  const pause = useCallback(() => {
    updateSession(id, s => (s.status === 'running' ? { status: 'paused' } : {}))
  }, [id, updateSession])

  const resume = useCallback(() => {
    updateSession(id, s => (s.status === 'paused' ? { status: 'running' } : {}))
  }, [id, updateSession])

  const steer = useCallback((text) => {
    if (!text?.trim()) return
    updateSession(id, s => ({
      events: [
        ...s.events,
        { id: uid('e'), kind: 'steer', text: text.trim() },
        { id: uid('e'), kind: 'reasoning', text: '收到你的补充，我会在接下来的步骤里把它考虑进去。' },
      ],
    }))
  }, [id, updateSession])

  return { approvePlan, allow, deny, pause, resume, steer }
}
