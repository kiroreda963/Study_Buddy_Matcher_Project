import { Routes, Route } from 'react-router-dom'
import LoginPage from './Pages/loginPage.jsx'
import RegisterPage from './Pages/registerPage.jsx'
import  Dashboard  from './Pages/dashboardPage.jsx'
import MatchDetails from './Pages/matchDetailsPage.jsx'
import AvailabilityPage from './Pages/AvailabilityPage.jsx'
import NotificationPage from './Pages/NotificationPage.jsx'
import BuddyConnectionsPage from './Pages/buddyConnectionsPage.jsx'
import MatchingPage from './Pages/matchingPage.jsx'
import ProfileSetupPage from './Pages/ProfileSetupPage.jsx'
import StudyPreferencesPage from './Pages/StudyPreferencesPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/match/:matchId" element={<MatchDetails />} />
      <Route path="/availability" element={<AvailabilityPage />} />
      <Route path="/notifications" element={<NotificationPage />} />
      <Route path="/matches" element={<MatchingPage />} />
      <Route path="/connections" element={<BuddyConnectionsPage />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/study-preferences" element={<StudyPreferencesPage />} />
    </Routes>
  )
}

export default App
