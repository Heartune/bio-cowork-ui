import Icon from '../lib/Icon.jsx'
import { useStore } from '../lib/store.jsx'
import './common.css'

export default function Settings() {
  const { state, setSettings, setRedline, resetAll, toast } = useStore()
  const s = state.settings

  const Switch = ({ on, onClick, locked }) => (
    <button className={'switch' + (on ? ' on' : '')} onClick={locked ? undefined : onClick} disabled={locked} aria-label="开关" style={locked ? { opacity: .7, cursor: 'not-allowed' } : null} />
  )

  return (
    <div className="page">
      <div className="page-head reveal">
        <h1>自定义</h1>
        <p>这些设置会作用到每一次新建分析——包括 Claude 怎么称呼你、何时停下来征求同意、能否联网，以及三条贯穿全程的产品红线。</p>
      </div>

      {/* 全局指令 */}
      <div className="reveal d1">
        <div className="section-eyebrow"><Icon name="chat" size={15} className="ic" />全局指令</div>
        <div className="set-section">
          <div className="set-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div className="sl">
              <div className="st">告诉 Claude 关于你和你的偏好</div>
              <div className="sd">每次分析都会带上这段说明——你的角色、希望的解释口吻、图表与报告风格等。</div>
            </div>
            <textarea className="set-textarea" value={s.globalInstructions}
              onChange={e => setSettings({ globalInstructions: e.target.value })} rows={4} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="muted" style={{ fontSize: 11.5 }}><Icon name="checkCircle" size={12} style={{ verticalAlign: '-2px', color: 'var(--teal)' }} /> 自动保存到本机</span>
            </div>
          </div>
        </div>
      </div>

      {/* 执行与权限 */}
      <div className="reveal d2">
        <div className="section-eyebrow"><Icon name="shield" size={15} className="ic" />执行与权限</div>
        <div className="set-section">
          <div className="set-row">
            <div className="sl">
              <div className="st">权限模式</div>
              <div className="sd">「先问再做」会在写盘等关键步骤暂停征求你同意；「自动执行」更快，但删除文件永远仍需确认。</div>
            </div>
            <div className="sc">
              <div className="seg">
                <button className={s.permissionMode === 'ask' ? 'on' : ''} onClick={() => { setSettings({ permissionMode: 'ask' }); toast('已切换：先问再做') }}>先问再做</button>
                <button className={s.permissionMode === 'act' ? 'on' : ''} onClick={() => { setSettings({ permissionMode: 'act' }); toast('已切换：自动执行（删除仍需确认）') }}>自动执行</button>
              </div>
            </div>
          </div>
          <div className="set-row">
            <div className="sl">
              <div className="st">联网访问</div>
              <div className="sd">默认关闭以最大化数据安全。开启后可用于文献佐证等需要外部信息的技能。</div>
            </div>
            <div className="sc">
              <div className="seg">
                {[['off', '断网'], ['ask', '每次询问'], ['on', '允许']].map(([k, l]) => (
                  <button key={k} className={s.internetAccess === k ? 'on' : ''} onClick={() => { setSettings({ internetAccess: k }); toast('联网访问：' + l) }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="set-row">
            <div className="sl">
              <div className="st">默认模型</div>
              <div className="sd">新建分析时的默认选择，可在每次分析中临时更改。</div>
            </div>
            <div className="sc">
              <select className="set-textarea" style={{ minHeight: 0, padding: '8px 12px', width: 'auto' }} value={s.defaultModel} onChange={e => setSettings({ defaultModel: e.target.value })}>
                <option>Opus 4.8</option><option>Sonnet 4.6</option><option>Haiku 4.5</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 产品红线 */}
      <div className="reveal d3">
        <div className="section-eyebrow"><Icon name="shieldCheck" size={15} className="ic" />产品红线</div>
        <div className="set-section">
          <div className="set-row">
            <div className="sl"><div className="st"><Icon name="lock" size={15} style={{ color: 'var(--teal-deep)' }} />数据本地不出域</div>
              <div className="sd">所有数据只在本机读取与处理，绝不上传。这是核心红线，不可关闭。</div></div>
            <div className="sc"><Switch on={true} locked /></div>
          </div>
          <div className="set-row">
            <div className="sl"><div className="st"><Icon name="trash" size={15} style={{ color: 'var(--teal-deep)' }} />永不自动删除文件</div>
              <div className="sd">删除任何文件前都会弹出确认，需你明确「允许」。不可关闭。</div></div>
            <div className="sc"><Switch on={true} locked /></div>
          </div>
          <div className="set-row">
            <div className="sl"><div className="st"><Icon name="checkCircle" size={15} style={{ color: 'var(--teal-deep)' }} />关键步骤人工确认</div>
              <div className="sd">写盘等关键步骤前暂停征求你同意（关闭后等同「自动执行」模式）。</div></div>
            <div className="sc"><Switch on={s.redlines.confirmKeySteps} onClick={() => setRedline('confirmKeySteps', !s.redlines.confirmKeySteps)} /></div>
          </div>
          <div className="set-row">
            <div className="sl"><div className="st"><Icon name="eye" size={15} style={{ color: 'var(--teal-deep)' }} />输出医生可读</div>
              <div className="sd">HR、p 值等统计量始终附「人话」解释，避免只给冷冰冰的数字。</div></div>
            <div className="sc"><Switch on={s.redlines.doctorReadable} onClick={() => setRedline('doctorReadable', !s.redlines.doctorReadable)} /></div>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="reveal d4">
        <div className="section-eyebrow"><Icon name="database" size={15} className="ic" />本机数据</div>
        <div className="set-section">
          <div className="set-row">
            <div className="sl"><div className="st">重置演示数据</div>
              <div className="sd">清空本机保存的会话、定时与设置，恢复到初始示例。此操作不可撤销。</div></div>
            <div className="sc">
              <button className="btn danger" onClick={() => { if (confirm('确定要清空本机所有会话与设置、恢复初始示例吗？')) { resetAll(); toast('已重置为初始演示数据') } }}>
                <Icon name="refresh" size={15} className="ic" />重置
              </button>
            </div>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 20 }}>
          BioCowork · 医研协作台 v0.2 — 单机前端原型，所有状态保存在本浏览器 localStorage。
        </p>
      </div>
    </div>
  )
}
