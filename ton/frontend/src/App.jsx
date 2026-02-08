import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import DashboardPage from './pages/DashboardPage'
import RecommendationsPage from './pages/RecommendationsPage'
import AnalyzePage from './pages/AnalyzePage'
import MyContestsPage from './pages/MyContestsPage'
import ProfilePage from './pages/ProfilePage'
import TimelinePage from './pages/TimelinePage'
import SchedulePage from './pages/SchedulePage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/contests" element={<MyContestsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/timeline" element={<TimelinePage />} />
      </Routes>
    </Layout>
  )
}

export default App
