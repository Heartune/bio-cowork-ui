import Icon from '../../lib/Icon.jsx'
import ArtifactView, { ART_META } from '../ArtifactView.jsx'
import { useStore } from '../../lib/store.jsx'
import { exportArtifact } from '../../lib/exporters.js'

const OUTPUT_FILES = {
  km: [['km_os_by_arm.svg', '矢量图'], ['km_summary.csv', '汇总表']],
  table1: [['table1_baseline.csv', '基线表']],
  forest: [['cox_forest.svg', '矢量图'], ['cox_table.csv', '模型表']],
  report: [['analysis_report.md', '报告']],
}

export default function ArtifactPanel({ session, scenario, tab, setTab, selectedArt, onSelect, progress }) {
  const { toast } = useStore()
  const arts = session.artifacts || []
  const sel = arts.find(a => a.id === selectedArt) || arts[arts.length - 1]
  const plan = scenario?.plan

  // 工作区文件：只读数据 + 产物派生的输出
  const outFiles = []
  arts.forEach(a => (OUTPUT_FILES[a.type] || []).forEach(([fn, kind]) => {
    if (!outFiles.some(f => f.name === fn)) outFiles.push({ name: fn, kind })
  }))

  const doneCount = session.status === 'done' ? plan?.steps.length : Math.round((progress || 0) * (plan?.steps.length || 0))

  return (
    <>
      <div className="side-tabs">
        <button className={'side-tab' + (tab === 'art' ? ' active' : '')} onClick={() => setTab('art')}>
          <Icon name="sparkles" size={15} />产物{arts.length > 0 && <span className="cnt">{arts.length}</span>}
        </button>
        <button className={'side-tab' + (tab === 'files' ? ' active' : '')} onClick={() => setTab('files')}>
          <Icon name="folder" size={15} />文件
        </button>
        <button className={'side-tab' + (tab === 'plan' ? ' active' : '')} onClick={() => setTab('plan')}>
          <Icon name="brain" size={15} />计划
        </button>
      </div>

      <div className="side-content">
        {tab === 'art' && (
          arts.length === 0 ? (
            <div className="side-empty">
              <Icon name="sparkles" size={34} className="ic" />
              <div>产物会在这里出现</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>图、表、报告生成后可在此预览与下载</div>
            </div>
          ) : (
            <>
              <div className="art-chips">
                {arts.map(a => {
                  const meta = ART_META[a.type] || { icon: 'file' }
                  return (
                    <button key={a.id} className={'art-chip' + (a.id === sel?.id ? ' active' : '')} onClick={() => onSelect(a.id)}>
                      <Icon name={meta.icon} size={14} />{a.title.length > 12 ? a.title.slice(0, 12) + '…' : a.title}
                    </button>
                  )
                })}
              </div>
              {sel && (
                <div className="art-preview">
                  <div className="apv-bar">
                    <Icon name={(ART_META[sel.type] || {}).icon || 'file'} size={16} style={{ color: 'var(--teal-deep)' }} />
                    <span className="apv-title">{sel.title}</span>
                    <button className="round" title="下载到本机" onClick={() => { exportArtifact(sel.type, session.scenario); toast('已导出《' + sel.title + '》到本机下载目录（数据不出域）') }} style={{ width: 30, height: 30 }}>
                      <Icon name="download" size={15} />
                    </button>
                    <button className="round" title="复制摘要" onClick={() => toast('已复制结果摘要到剪贴板')} style={{ width: 30, height: 30 }}>
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                  <ArtifactView artType={sel.type} scenario={session.scenario} date={sel.createdAt} />
                </div>
              )}
            </>
          )
        )}

        {tab === 'files' && (
          <div className="filetree">
            <div className="ft-grp"><Icon name="lock" size={13} />./data（只读 · 不出域）</div>
            <div className="file-row">
              <Icon name="csv" size={17} className="fc" />
              <span className="fn">{session.dataset?.includes('.csv') ? session.dataset : 'synthetic_lung_cancer.csv'}</span>
              <span className="ro">只读</span>
            </div>
            <div className="ft-grp"><Icon name="folder" size={13} />./outputs（本次生成）</div>
            {outFiles.length === 0 ? (
              <div className="muted" style={{ fontSize: 12, padding: '6px 10px' }}>尚无输出文件。执行到写盘步骤并经你确认后会出现在这里。</div>
            ) : outFiles.map(f => (
              <div className="file-row" key={f.name}>
                <Icon name={f.name.endsWith('.md') ? 'fileText' : f.name.endsWith('.svg') ? 'image' : 'csv'} size={17} className="fc" />
                <span className="fn">{f.name}</span>
                <span className="fmeta">{f.kind}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'plan' && plan && (
          <div>
            <div className="section-eyebrow"><Icon name="brain" size={15} className="ic" />{plan.title}</div>
            <ol className="plan-steps">
              {plan.steps.map((s, i) => <li key={i} className={i < doneCount ? 'done' : ''}>{s}</li>)}
            </ol>
            <div className="ft-grp" style={{ marginTop: 18 }}><Icon name="info" size={13} />前提与设定</div>
            <ul className="assume" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {plan.assumptions.map((a, i) => (
                <li key={i} style={{ display: 'flex', gap: 9, fontSize: 12.5, alignItems: 'flex-start', background: 'var(--bg-panel)', border: '1px solid var(--line-soft)', borderRadius: 9, padding: '8px 11px' }}>
                  <Icon name="checkCircle" size={14} style={{ color: 'var(--teal)', marginTop: 2 }} />{a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
