import Icon from '../../lib/Icon.jsx'
import { ART_META } from '../ArtifactView.jsx'

const TOOL_LABEL = { shell: 'SHELL', python: 'PYTHON', read: 'READ', write: 'WRITE' }

/* 渲染单条执行流事件 */
export default function StreamEvent({ ev, onAllow, onDeny, onOpenArtifact }) {
  switch (ev.kind) {
    case 'narrate':
      return (
        <div className="ev narrate">
          <span className="ava"><Icon name="pulse" size={16} strokeWidth={2} /></span>
          <div className="ebody">{ev.text}</div>
        </div>
      )

    case 'reasoning':
      return (
        <div className="ev reasoning">
          <div className="ebody">{ev.text}</div>
        </div>
      )

    case 'steer':
      return (
        <div className="ev steer">
          <div className="who">你的补充</div>
          {ev.text}
        </div>
      )

    case 'subtask':
      return (
        <div className="ev subtask">
          <span className="dot"><Icon name="check" size={13} strokeWidth={2.4} /></span>
          <span className="st-title">{ev.title}</span>
          <span className="ln" />
        </div>
      )

    case 'tool': {
      const running = ev.state === 'running'
      return (
        <div className="ev">
          <span className="ava"><Icon name="terminal" size={15} /></span>
          <div className="ebody">
            <div className={'tool-card' + (running ? ' is-running' : '')}>
              <div className="th">
                <span className={'tg ' + ev.tool}>{TOOL_LABEL[ev.tool] || ev.tool}</span>
                <span className="tt">{ev.title}</span>
                <span className={'ts' + (running ? ' running' : '')}>
                  {running ? <><span className="spin" /> 运行中…</> : <><Icon name="check" size={12} strokeWidth={2.4} /> 完成</>}
                </span>
              </div>
              <div className="cmd"><span className="prompt">$ </span>{ev.cmd}</div>
              {!running && ev.output && <div className="out">{ev.output}</div>}
            </div>
          </div>
        </div>
      )
    }

    case 'approval': {
      const cls = ev.state === 'approved' ? ' approved' : ev.state === 'denied' ? ' denied' : ''
      const riskLabel = ev.risk === 'delete' ? '删除文件' : ev.risk === 'network' ? '联网访问' : '写入文件'
      return (
        <div className="ev">
          <span className="ava"><Icon name="shield" size={15} /></span>
          <div className="ebody">
            <div className={'approval-card' + cls}>
              <div className="ah">
                <Icon name={ev.state === 'approved' ? 'shieldCheck' : ev.state === 'denied' ? 'x' : 'shield'} size={16} className="ic" />
                需要你确认 · {riskLabel}
              </div>
              <div className="adetail">{ev.detail || ev.title}</div>
              {ev.state === 'pending' ? (
                <div className="arow">
                  <button className="btn primary" onClick={onAllow}><Icon name="check" size={15} className="ic" />允许</button>
                  <button className="btn danger" onClick={onDeny}><Icon name="x" size={15} className="ic" />不允许</button>
                  <span className="ahint">红线：关键步骤人工确认</span>
                </div>
              ) : (
                <div className="resolved">
                  <Icon name={ev.state === 'approved' ? 'checkCircle' : 'x'} size={14} />
                  {ev.state === 'approved' ? (ev.auto ? '已自动批准（自动执行模式）' : '你已允许') : '你已拒绝，已停止这一步'}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    case 'artifact': {
      const meta = ART_META[ev.artType] || { icon: 'file', label: '产物', kind: '产物' }
      return (
        <div className="ev">
          <span className="ava"><Icon name="sparkles" size={15} /></span>
          <div className="ebody">
            <button className="artifact-ev" onClick={() => onOpenArtifact?.(ev.artifactId)}>
              <span className="ai"><Icon name={meta.icon} size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="at">{ev.title}</div>
                <div className="as">产物已生成 · 点击在右侧查看</div>
              </div>
              <span className="akind">{meta.kind}</span>
            </button>
          </div>
        </div>
      )
    }

    case 'summary':
      return (
        <div className="ev">
          <span className="ava"><Icon name="checkCircle" size={15} /></span>
          <div className="ebody">
            <div className="summary-card">
              <div className="sh"><Icon name="checkCircle" size={17} />小结</div>
              <p>{ev.text}</p>
              {ev.bullets?.length > 0 && <ul>{ev.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
