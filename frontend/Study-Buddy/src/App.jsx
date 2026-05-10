import { Routes, Route } from 'react-router-dom'
import LoginPage from './Pages/loginPage.jsx'
import RegisterPage from './Pages/registerPage.jsx'
import AvailabilityPage from './Pages/AvailabilityPage.jsx'
import NotificationPage from './Pages/NotificationPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/availability" element={<AvailabilityPage />} />
      <Route path="/notifications" element={<NotificationPage />} />
    </Routes>
  )
}

export default App