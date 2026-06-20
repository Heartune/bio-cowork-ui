import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Home from './pages/Home.jsx'
import Session from './pages/Session.jsx'
import Research from './pages/Research.jsx'
import Reports from './pages/Reports.jsx'
import Skills from './pages/Skills.jsx'
import Scheduled from './pages/Scheduled.jsx'
import DataSources from './pages/DataSources.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="/research" element={<Research />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/scheduled" element={<Scheduled />} />
          <Route path="/data" element={<DataSources />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
