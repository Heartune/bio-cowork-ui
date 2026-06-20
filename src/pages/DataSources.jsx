import { useEffect, useRef, useState } from 'react'
import Icon from '../lib/Icon.jsx'
import { useStore } from '../lib/store.jsx'
import { SAMPLE_ROWS } from '../lib/clinicalData.js'
import './common.css'

export default function DataSources() {
  const { state, addDataSource, deleteDataSource, toast } = useStore()
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null) // 被预览的数据源
  const locals = state.dataSources.filter(d => d.type === 'local')
  const connectors = state.dataSources.filter(d => d.type === 'mcp')

  // 真·本地读取：仅在浏览器内解析行列，绝不外发（呼应「数据不出域」）
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    let rows = null, cols = null, note = '本地读取 · 不上传'
    if (/\.csv$/i.test(file.name)) {
      try {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(l => l.trim().length)
        rows = Math.max(lines.length - 1, 0)
        cols = (lines[0] || '').split(',').length
        note = '本地解析 · 数据未离开本机'
      } catch { /* 忽略 */ }
    } else {
      note = 'Excel · 本地读取（行列待解析）'
    }
    addDataSource({ name: file.name.replace(/\.[^.]+$/, ''), file: file.name, rows, cols, note })
    toast('已在本机读取《' + file.name + '》· 数据未上传')
    e.target.value = ''
  }

  useEffect(() => {
    if (!preview) return
    const onKey = (e) => { if (e.key === 'Escape') setPreview(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview])

  return (
    <div className="page">
      <div className="page-head reveal">
        <h1>数据源</h1>
        <p>连接本地 CSV / Excel，或院内脱敏库。所有数据只在本机读取与处理，全程不出域——这是 BioCowork 的第一条红线。</p>
      </div>

      <div className="toolbar reveal d1">
        <span className="badge"><Icon name="lock" size={13} className="ic" />数据本地不出域</span>
        <div className="spacer" />
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={onFile} />
        <button className="btn primary" onClick={() => fileRef.current?.click()}><Icon name="plus" size={15} className="ic" />添加本地文件</button>
      </div>

      <div className="group-label reveal d1"><Icon name="folder" size={13} />本地数据<span className="n">· {locals.length}</span><span className="ln" /></div>
      <div className="list reveal d2">
        {locals.map(d => (
          <div key={d.id} className="row-card" style={{ cursor: 'default' }}>
            <span className="ri"><Icon name="csv" size={20} /></span>
            <div className="rb">
              <div className="rt">{d.name}<span className="pill-status ok"><span className="d" />就绪</span></div>
              <div className="rs">{d.file} · {d.note}</div>
            </div>
            <div className="rmeta">
              {d.rows != null && <span>{d.rows} 行 × {d.cols} 列</span>}
            </div>
            <div className="ract">
              <button className="iconbtn" title="本机预览前几行" onClick={() => setPreview(d)}><Icon name="eye" size={16} /></button>
              <button className="iconbtn danger" title="移除" onClick={() => { deleteDataSource(d.id); toast('已从列表移除（本机文件不受影响）') }}><Icon name="trash" size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="group-label reveal d3"><Icon name="plug" size={13} />连接器 · 院内数据<span className="ln" /></div>
      <div className="list reveal d3">
        {connectors.map(d => (
          <div key={d.id} className="row-card" style={{ cursor: 'default', opacity: .85 }}>
            <span className="ri" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--ink-soft)' }}><Icon name="database" size={20} /></span>
            <div className="rb">
              <div className="rt">{d.name}<span className="pill-status plan"><span className="d" />规划中</span></div>
              <div className="rs">{d.file} · {d.note}</div>
            </div>
            <div className="ract">
              <button className="btn" onClick={() => toast('连接院内库需自定义 Tool / MCP，可设权限与脱敏规则（规划中）')}><Icon name="link" size={15} className="ic" />连接</button>
            </div>
          </div>
        ))}
        <button className="row-card" onClick={() => toast('添加连接器：通过 MCP 接入 REDCap / 院内脱敏库（规划中）')} style={{ borderStyle: 'dashed', background: 'transparent', justifyContent: 'center', color: 'var(--ink-soft)' }}>
          <Icon name="plus" size={17} /> 添加连接器（MCP）
        </button>
      </div>

      {preview && (
        <div className="modal-scrim" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="mh">
              <span className="mi"><Icon name="csv" size={20} /></span>
              <div className="mt">
                <div className="t">{preview.file}</div>
                <div className="s">本机预览 · 前 {SAMPLE_ROWS.rows.length} 行（共 {preview.rows ?? '—'} 行）· 数据未离开本机</div>
              </div>
              <span className="badge"><Icon name="lock" size={13} className="ic" />本地</span>
              <button className="iconbtn" onClick={() => setPreview(null)}><Icon name="x" size={18} /></button>
            </div>
            <div className="mbody">
              <div style={{ overflowX: 'auto' }}>
                <table className="dtable" style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr>{SAMPLE_ROWS.cols.map(c => <th key={c} style={{ textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 11.5 }}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {SAMPLE_ROWS.rows.map((r, i) => (
                      <tr key={i}>{r.map((v, j) => (
                        <td key={j} style={{ textAlign: 'left', fontVariantNumeric: 'tabular-nums', color: v === '' ? 'var(--coral)' : undefined }}>
                          {v === '' ? 'NA' : String(v)}
                        </td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
                合成演示数据。空缺值（如 PD-L1）以 <span style={{ color: 'var(--coral)' }}>NA</span> 标出——Claude 在体检阶段会先统计缺失，再决定如何处理。
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
