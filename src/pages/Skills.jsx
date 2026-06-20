import { useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useStore } from '../lib/store.jsx'
import './common.css'

const SKILLS = [
  { id: 'viz', icon: 'chart', name: '临床可视化', planned: false,
    desc: '生存曲线、森林图、基线表的成图规范——配色、坐标、风险人数表、论文可用的版式。',
    tags: ['3 技能', '可直接出图'] },
  { id: 'model', icon: 'brain', name: '临床建模', planned: false,
    desc: '生存分析（KM / log-rank / Cox）、逻辑回归的方法选择、默认参数与前提假定检查。',
    tags: ['4 技能', '含假定检验'] },
  { id: 'intake', icon: 'shieldCheck', name: '数据体检与脱敏校验', planned: false,
    desc: '读取前先查缺失、异常值、编码与字段类型，并校验是否含可识别信息。',
    tags: ['2 技能', '本地执行'] },
  { id: 'report', icon: 'fileText', name: '可追溯报告', planned: false,
    desc: '自动撰写方法 / 结果 / 处理日志，HR 与 p 值附人话解释，可放进论文初稿或科室汇报。',
    tags: ['1 技能', '导出 .md'] },
  { id: 'mcp', icon: 'plug', name: '院内数据连接器', planned: true,
    desc: '通过自定义 Tool / MCP 连接 REDCap 或院内脱敏库，按需取数、读后即用、可设权限。',
    tags: ['连接器', '规划中'] },
  { id: 'lit', icon: 'search', name: '文献佐证', planned: true,
    desc: '为结论联网检索相关研究做参考（需在「自定义」中开启联网，默认关闭以保数据安全）。',
    tags: ['子代理', '需联网'] },
]

export default function Skills() {
  const { toast } = useStore()
  const [on, setOn] = useState({ viz: true, model: true, intake: true, report: true, mcp: false, lit: false })
  const toggle = (s) => {
    if (s.planned) { toast('「' + s.name + '」规划中：敬请期待', { warn: true }); return }
    setOn(o => ({ ...o, [s.id]: !o[s.id] }))
    toast((on[s.id] ? '已停用：' : '已启用：') + s.name)
  }

  return (
    <div className="page">
      <div className="page-head reveal">
        <h1>技能库</h1>
        <p>技能把「某类临床作业怎么做」打包成可复用的指引——像插件一样组合技能、连接器与子代理。启用后，新建分析时 Claude 会自动按这些规范来做。</p>
      </div>

      <div className="grid-cards reveal d1">
        {SKILLS.map(s => (
          <div key={s.id} className="item-card" style={{ opacity: s.planned ? .8 : 1 }}>
            <span className="ci"><Icon name={s.icon} size={22} /></span>
            <h3>{s.name}</h3>
            <p>{s.desc}</p>
            <div className="ctags">{s.tags.map(t => <span className="ctag" key={t}>{t}</span>)}</div>
            <div className="cfoot">
              {s.planned
                ? <span className="pill-status off"><span className="d" />规划中</span>
                : <span className={'pill-status ' + (on[s.id] ? 'ok' : 'off')}><span className="d" />{on[s.id] ? '已启用' : '已停用'}</span>}
              <button className={'switch' + (!s.planned && on[s.id] ? ' on' : '')} onClick={() => toggle(s)} aria-label="启用开关" style={{ marginLeft: 'auto' }} disabled={s.planned} />
            </div>
          </div>
        ))}
      </div>

      <div className="set-section reveal d3" style={{ marginTop: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ width: 38, height: 38, flex: '0 0 38px', borderRadius: 10, background: 'var(--coral-wash)', border: '1px solid #eccab9', color: 'var(--coral)', display: 'grid', placeItems: 'center' }}><Icon name="star" size={18} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>编写你自己的技能</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>把你科室的统计规范、图表偏好、报告模板写成技能，团队共享、长期复用。（演示原型，编辑器规划中）</div>
          </div>
          <button className="btn" style={{ marginLeft: 'auto', alignSelf: 'center' }} onClick={() => toast('技能编辑器规划中')}><Icon name="plus" size={15} className="ic" />新建技能</button>
        </div>
      </div>
    </div>
  )
}
