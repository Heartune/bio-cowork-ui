import { useEffect, useRef, useState } from 'react'
import './Dropdown.css'

/* 通用下拉/弹出层：点击触发，点外部或 Esc 关闭。
   用法：
     <Dropdown placement="top" trigger={(open)=> <button>…</button>}>
       {(close)=> <div className="menu-body">…</div>}
     </Dropdown>
*/
export default function Dropdown({ trigger, children, placement = 'bottom', align = 'left', menuStyle }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className="dd-wrap" ref={wrapRef}>
      <div onClick={() => setOpen(o => !o)}>{trigger(open)}</div>
      {open && (
        <div className={`dd-menu dd-${placement} dd-align-${align}`} style={menuStyle} role="menu">
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}
