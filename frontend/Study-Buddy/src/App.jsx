import { Routes, Route } from 'react-router-dom'
import LoginPage from './Pages/loginPage.jsx'
import RegisterPage from './Pages/registerPage.jsx'
import ProfileSetupPage from './Pages/ProfileSetupPage.jsx'
import StudyPreferencesPage from './Pages/StudyPreferencesPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/study-preferences" element={<StudyPreferencesPage />} />
    </Routes>
  )
}

export default App