/* 统一的线性图标组件（描边 1.8，编辑感）。
   用法：<Icon name="pulse" size={18} /> */
const P = {
  pulse:    <path d="M2 12h4l2-6 4 12 2-6h8" strokeLinecap="round" strokeLinejoin="round" />,
  pulseLg:  <path d="M2 13h4l2-7 4 14 2.5-9H22" strokeLinecap="round" strokeLinejoin="round" />,
  plus:     <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
  sparkles: <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />,
  folder:   <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 7l2-3h14l2 3" /></>,
  chart:    <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" strokeLinecap="round" />,
  star:     <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16.5 7.1 18.2 8 12.7l-4-3.9 5.5-.8L12 3z" strokeLinejoin="round" />,
  clock:    <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" strokeLinecap="round" /></>,
  database: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
  sliders:  <><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /><circle cx="9" cy="7" r="2.4" fill="var(--bg)" /><circle cx="15" cy="12" r="2.4" fill="var(--bg)" /><circle cx="8" cy="17" r="2.4" fill="var(--bg)" /></>,
  help:     <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 16.5h.01" strokeLinecap="round" /></>,
  warn:     <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a1.8 1.8 0 0 0 1.6 2.7h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0z" strokeLinejoin="round" />,
  check:    <path d="M5 12.5l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" /></>,
  chevDown: <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  chevRight:<path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  arrowRight:<path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  arrowUp:  <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />,
  mic:      <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" /></>,
  menu:     <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />,
  code:     <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />,
  expand:   <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />,
  curve:    <path d="M4 4v16h16M7 16c2-6 5-9 13-10" strokeLinecap="round" strokeLinejoin="round" />,
  table:    <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M9 4v16" strokeLinecap="round" /></>,
  compare:  <path d="M9 4v16M15 4v16M5 9h8M11 15h8" strokeLinecap="round" />,
  search:   <><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" strokeLinecap="round" /></>,
  file:     <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></>,
  fileText: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h6" strokeLinecap="round" /></>,
  csv:      <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 14h2M8 17h5M12 14h2" strokeLinecap="round" /></>,
  image:    <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" strokeLinecap="round" strokeLinejoin="round" /></>,
  brain:    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  chat:     <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  info:     <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></>,
  shield:   <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" strokeLinejoin="round" />,
  shieldCheck: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></>,
  lock:     <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  eye:      <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  play:     <path d="M7 5l12 7-12 7z" strokeLinejoin="round" />,
  pause:    <path d="M8 5v14M16 5v14" strokeLinecap="round" />,
  stop:     <rect x="6" y="6" width="12" height="12" rx="2" />,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" strokeLinecap="round" strokeLinejoin="round" /></>,
  branch:   <><circle cx="6" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="8" r="2.4" /><path d="M6 8.4v7.2M6 12h6a4 4 0 0 0 4-4" strokeLinecap="round" /></>,
  dots:     <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" />,
  copy:     <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
  send:     <path d="M4 12l16-7-7 16-2-7-7-2z" strokeLinejoin="round" />,
  user:     <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" /></>,
  bell:     <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" /></>,
  refresh:  <path d="M4 12a8 8 0 0 1 13.5-5.8L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.5 5.8L4 16M4 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />,
  link:     <><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 1 0-5.6-5.6L11 7" strokeLinecap="round" /><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 1 0 5.6 5.6L13 17" strokeLinecap="round" /></>,
  plug:     <><path d="M9 3v6M15 3v6" strokeLinecap="round" /><path d="M7 9h10v3a5 5 0 0 1-10 0z" /><path d="M12 17v4" strokeLinecap="round" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" /></>,
  trash:    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" strokeLinecap="round" strokeLinejoin="round" />,
  edit:     <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3z M14 6l3 3" strokeLinecap="round" strokeLinejoin="round" />,
  x:        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />,
  back:     <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />,
  flask:    <path d="M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.4 2.2h11.2A1.5 1.5 0 0 0 19 19l-5-10V3M8 14h8" strokeLinecap="round" strokeLinejoin="round" />,
  filter:   <path d="M3 5h18l-7 8v6l-4 2v-8z" strokeLinejoin="round" />,
  grid:     <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  bolt:     <path d="M13 3L5 13h5l-1 8 8-10h-5z" strokeLinejoin="round" />,
}

export default function Icon({ name, size = 18, className, style, strokeWidth = 1.8 }) {
  const inner = P[name]
  if (!inner) return null
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      width={size} height={size} className={className}
      style={{ flex: `0 0 ${size}px`, ...style }} aria-hidden="true"
    >
      {inner}
    </svg>
  )
}
