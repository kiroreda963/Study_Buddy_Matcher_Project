import { Routes, Route } from 'react-router-dom'
import LoginPage from './Pages/loginPage.jsx'
import RegisterPage from './Pages/registerPage.jsx'
import  Dashboard  from './Pages/dashboardPage.jsx'
import MatchDetails from './Pages/matchDetailsPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/match/:matchId" element={<MatchDetails />} />
    </Routes>
  )
}

export default App