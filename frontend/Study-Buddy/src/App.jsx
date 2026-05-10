import { Routes, Route } from 'react-router-dom'
import LoginPage from './Pages/loginPage.jsx'
import RegisterPage from './Pages/registerPage.jsx'
import  Dashboard  from './Pages/dashboardPage.jsx'
import BuddyConnectionsPage from './Pages/buddyConnectionsPage.jsx'
import MatchingPage from './Pages/matchingPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/matches" element={<MatchingPage />} />
      <Route path="/connections" element={<BuddyConnectionsPage />} />
    </Routes>
  )
}

export default App
