import { Routes, Route } from "react-router-dom";
import LoginPage from "./Pages/loginPage.jsx";
import RegisterPage from "./Pages/registerPage.jsx";
import Dashboard from "./Pages/dashboardPage.jsx";
import MatchDetails from "./Pages/matchDetailsPage.jsx";
import AvailabilityPage from "./Pages/AvailabilityPage.jsx";
import NotificationPage from "./Pages/NotificationPage.jsx";
import BuddyConnectionsPage from "./Pages/buddyConnectionsPage.jsx";
import MatchingPage from "./Pages/matchingPage.jsx";
import ProfileSetupPage from "./Pages/profileSetupPage.jsx";
import StudyPreferencesPage from "./Pages/StudyPreferencesPage.jsx";
import CreateSession from "./Pages/CreateSession/CreateSession.jsx";
import StudySessions from "./Pages/StudySessions/StudySessions.jsx";
import SessionDetails from "./Pages/StudySessions/SessionDetails.jsx";
import UserActivity from "./Pages/UserActivity/UserActivity.jsx";
import EditStudySession from "./Pages/CreateSession/EditStudySession.jsx";
import LandingPage from "./Pages/LandingPage.jsx";
import NotFoundPage from "./Pages/NotFoundPage.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/match/:matchId"
        element={
          <ProtectedRoute>
            <MatchDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/availability"
        element={
          <ProtectedRoute>
            <AvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <MatchingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connections"
        element={
          <ProtectedRoute>
            <BuddyConnectionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-preferences"
        element={
          <ProtectedRoute>
            <StudyPreferencesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-session"
        element={
          <ProtectedRoute>
            <CreateSession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-sessions"
        element={
          <ProtectedRoute>
            <StudySessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/session/:id"
        element={
          <ProtectedRoute>
            <SessionDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-session/:id"
        element={
          <ProtectedRoute>
            <EditStudySession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-activity"
        element={
          <ProtectedRoute>
            <UserActivity />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
