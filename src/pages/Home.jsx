import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../lib/Icon.jsx'
import Dropdown from '../components/Dropdown.jsx'
import { useStore } from '../lib/store.jsx'
import { inferScenario } from '../lib/scenarios.js'
import './Home.css'

const MODES = [
  { key: '澄清式', desc: '先追问终点/分组/字段，生成《需求确认单》再动手', icon: 'chat', rec: true },
  { key: '直接执行', desc: '需求已明确时直接跑（关键步骤仍会请你确认）', icon: 'arrowRight' },
  { key: '仅讲解', desc: '只解释方法与思路，不读取或修改数据', icon: 'info' },
]
const MODELS = [
  { key: 'Opus 4.8', desc: '推理最强，适合建模与统计推断', icon: 'star' },
  { key: 'Sonnet 4.6', desc: '速度与质量平衡，日常分析够用', icon: 'compare' },
  { key: 'Haiku 4.5', desc: '最快，适合画图/整理这类轻任务', icon: 'bolt' },
]
const TASKS = [
  { icon: 'curve', title: '画一条生存曲线', sub: '按分组对比 OS / PFS，自动标注中位生存与生存率',
    fill: '帮我画一条生存曲线：按治疗方案分组，比较总生存 OS，并标注各组中位生存期和 12/24 月生存率。' },
  { icon: 'table', title: '生成基线特征表', sub: '按组统计基线分布与缺失，输出可放进论文/汇报',
    fill: '帮我生成这批队列的基线特征表（Table 1）：按分组列出年龄、性别、分期等的分布与缺失情况。' },
  { icon: 'compare', title: '比较两组疗效差异', sub: 'log-rank 检验 + Cox 回归，给出可读的 HR 与 p 值解释',
    fill: '帮我比较两组疗效差异：做 log-rank 检验，并用 Cox 回归看哪些因素影响预后、影响多大（输出 HR 的人话解释）。' },
  { icon: 'search', title: '从随访数据里找线索', sub: '先描述性概览，再提示值得检验的方向（不替你下结论）',
    fill: '帮我从这份随访数据里找线索：哪些变量可能和预后相关？先给描述性概览，再提示值得进一步检验的方向。' },
]

export default function Home() {
  const { state, createSession, toast } = useStore()
  const nav = useNavigate()
  const taRef = useRef(null)
  const [text, setText] = useState('')
  const localSources = state.dataSources.filter(d => d.status === 'ready')
  const [dataset, setDataset] = useState(localSources[0]?.name || '选择文件夹或工作区')
  const [mode, setMode] = useState('澄清式')
  const [model, setModel] = useState(state.settings.defaultModel || 'Opus 4.8')

  const fill = (t) => { setText(t); taRef.current?.focus() }

  const start = () => {
    const v = text.trim()
    if (!v) return
    const scenario = inferScenario(v)
    const titleMap = { km: '生存曲线分析', table1: '基线特征表', cox: 'Cox 多因素分析', explore: '探索性线索分析' }
    const id = createSession({
      title: titleMap[scenario] || '新分析',
      prompt: v, dataset, mode, model, scenario,
      project: dataset.includes('肺癌') ? '肺癌随访队列' : '未归档',
      status: 'planning', phase: 'plan', step: 0,
    })
    toast('已创建分析会话 · 正在拟定计划')
    nav(`/session/${id}`)
  }

  const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); start() } }

  return (
    <>
      <div className="topbar">
        <a onClick={() => toast('更新日志：v0.2 — 完整工作台、可追溯报告与定时随访')}>
          <span className="dotnew" />更新日志 · v0.2
        </a>
      </div>

      <div className="home-stage">
        <div className="home-pad" />

        <div className="reveal" style={{ width: '100%' }}>
          <div className="hero">
            <span className="mark"><Icon name="pulseLg" size={26} strokeWidth={1.7} /></span>
            <div>
              <h1>把这批数据，<em>一起弄明白</em></h1>
              <div className="eyebrow under"><span className="line" />临床研究伙伴 · <span className="en">for clinicians</span></div>
            </div>
          </div>
        </div>

        <div className="composer reveal d1">
          <textarea ref={taRef} rows={3} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
            placeholder={'今天想分析什么？用大白话描述你的数据和问题就好。\n例如：“帮我看看这批肺癌病人不同治疗方案的生存情况”'} />
          <div className="composer-row">
            <button className="round" title="附加本地数据文件" onClick={() => toast('附加本地文件：CSV / Excel，仅在本机读取，不上传')}>
              <Icon name="plus" size={16} />
            </button>
            <div className="spacer" />
            <span className="hint"><span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> 发送</span>
            <button className="round" title="语音描述（演示占位）" onClick={() => toast('语音输入仅占位（演示原型）')}>
              <Icon name="mic" size={15} />
            </button>
            <button className="send" disabled={!text.trim()} title="开始" onClick={start}>
              <Icon name="arrowUp" size={17} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="controls reveal d2">
          <Dropdown placement="bottom" trigger={() => (
            <button className="ctrl"><Icon name="database" size={15} /><span>{dataset}</span><Icon name="chevDown" size={13} className="chev" /></button>
          )}>
            {(close) => (
              <>
                {localSources.map(d => (
                  <button key={d.id} className={'mi' + (d.name === dataset ? ' sel' : '')} onClick={() => { setDataset(d.name); close(); toast('已选择数据集：' + d.name + '（本地读取，不上传）') }}>
                    <Icon name="file" size={16} className="ic" />
                    <div><div className="mt">{d.name}</div><div className="ms">{d.file} · {d.rows} 例</div></div>
                  </button>
                ))}
                <button className="mi" onClick={() => { close(); toast('附加本地文件：CSV / Excel，仅在本机读取，不上传') }}>
                  <Icon name="plus" size={16} className="ic" />
                  <div><div className="mt">附加本地文件…</div><div className="ms">CSV / Excel，仅在本机读取，不上传</div></div>
                </button>
                <div className="menu-sep" />
                <button className="mi" onClick={() => { close(); toast('连接院内脱敏库需自定义 Tool / MCP（规划中）') }}>
                  <Icon name="database" size={16} className="ic" />
                  <div><div className="mt">连接院内脱敏库</div><div className="ms">需自定义 Tool / MCP（规划中）</div></div>
                </button>
              </>
            )}
          </Dropdown>

          <Dropdown placement="bottom" trigger={() => (
            <button className="ctrl"><Icon name="brain" size={15} /><span className="strong">{mode}</span><Icon name="chevDown" size={13} className="chev" /></button>
          )}>
            {(close) => MODES.map(m => (
              <button key={m.key} className={'mi' + (m.key === mode ? ' sel' : '')} onClick={() => { setMode(m.key); close() }}>
                <Icon name={m.icon} size={16} className="ic" />
                <div><div className="mt">{m.key}{m.rec && '（推荐）'}</div><div className="ms">{m.desc}</div></div>
              </button>
            ))}
          </Dropdown>

          <Dropdown placement="bottom" align="right" trigger={() => (
            <button className="ctrl right"><span className="strong">{model}</span><Icon name="chevDown" size={13} className="chev" /></button>
          )}>
            {(close) => MODELS.map(m => (
              <button key={m.key} className={'mi' + (m.key === model ? ' sel' : '')} onClick={() => { setModel(m.key); close() }}>
                <Icon name={m.icon} size={16} className="ic" />
                <div><div className="mt">{m.key}</div><div className="ms">{m.desc}</div></div>
              </button>
            ))}
          </Dropdown>
        </div>

        <div className="promise reveal d3">
          <span className="badge"><Icon name="shieldCheck" size={13} className="ic" />数据本地不出域</span>
          <span className="badge"><Icon name="checkCircle" size={13} className="ic" />关键步骤人工确认</span>
          <span className="muted">不确定怎么问？<a onClick={() => fill(TASKS[0].fill)}>从一个示例开始 →</a></span>
        </div>

        <div className="tasks reveal d4">
          <div className="tasks-head"><Icon name="expand" size={15} className="ic" />从一个常见任务开始</div>
          {TASKS.map(t => (
            <button key={t.title} className="task" onClick={() => fill(t.fill)}>
              <span className="ti"><Icon name={t.icon} size={20} /></span>
              <div className="body">
                <div className="t-title">{t.title}</div>
                <div className="t-sub">{t.sub}</div>
              </div>
              <Icon name="arrowRight" size={18} className="arrow" strokeWidth={2} />
            </button>
          ))}
        </div>

        <div className="redlines reveal d5">
          <span><Icon name="eye" size={16} className="ic" />医生可读：HR/p 都给人话解释</span>
          <span><Icon name="checkCircle" size={16} className="ic" />关键步骤人工确认</span>
          <span><Icon name="lock" size={16} className="ic" />数据本地处理，不出域</span>
        </div>
      </div>
    </>
  )
}
