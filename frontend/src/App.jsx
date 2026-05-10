import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './Pages/loginPage';
import RegisterPage from './Pages/registerPage';
import CreateSession from './Pages/CreateSession/CreateSession';
import StudySessions from './Pages/StudySessions/StudySessions';
import UserActivity from './Pages/UserActivity/UserActivity';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/create-session" element={<CreateSession />} />
            <Route path="/study-sessions" element={<StudySessions />} />
            <Route path="/user-activity" element={<UserActivity />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
