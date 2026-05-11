import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { User, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import {
  sessionClient,
  profileClient,
  authClient,
} from "../../clients/apolloClients";
import {
  GET_ME,
  GET_PROFILE_PREFERENCES,
  UPDATE_PREFERENCES,
  GET_STUDY_SESSIONS,
} from "../../../../src/graphql/operations";
import SessionCard from "../Shared/SessionCard";
import "./UserProfile.css";
import { useAuth } from "../../context/AuthContext";

const UserProfile = ({ onBack }) => {
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [pastIndex, setPastIndex] = useState(0);

  const { user } = useAuth();

  // Queries
  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_ME, { client: authClient });
  const {
    data: prefData,
    loading: prefLoading,
    error: prefError,
  } = useQuery(GET_PROFILE_PREFERENCES, { client: profileClient });
  const {
    data: sessionData,
    loading: sessionLoading,
    error: sessionError,
  } = useQuery(GET_STUDY_SESSIONS, { client: sessionClient });

  // Mutations
  const [updatePrefs] = useMutation(UPDATE_PREFERENCES, {
    client: profileClient,
    refetchQueries: [{ query: GET_PROFILE_PREFERENCES, client: profileClient }],
  });

  // State for forms
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [prefForm, setPrefForm] = useState({
    studyPace: "",
    groupSize: "",
    studyMode: "",
    studyStyle: "",
  });

  // Update form state when data loads
  useEffect(() => {
    const targetUser = userData?.me || user;
    if (targetUser) {
      setProfileForm((prev) => ({
        ...prev,
        name: targetUser.name || prev.name,
        email: targetUser.email || prev.email,
      }));
    }
  }, [userData, user]);

  useEffect(() => {
    if (prefData?.getProfile?.preferences) {
      const p = prefData.getProfile.preferences;
      setPrefForm({
        studyPace: p.studyPace || "",
        groupSize: p.groupSize || "",
        studyMode: p.studyMode || "online",
        studyStyle: p.studyStyle || "Quiet Study",
      });
    }
  }, [prefData]);

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const timestamp = Number(dateStr);
    return !isNaN(timestamp)
      ? new Date(timestamp)
      : new Date(dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr);
  };

  const pastSessions = useMemo(() => {
    if (!sessionData?.studySessions || !user) return [];
    const now = new Date();
    return sessionData.studySessions
      .filter((s) => {
        const isParticipant = s.participants.includes(user.id);
        const isAuthor = s.authorId === user.id;
        const isPast = parseDate(s.date) < now;
        return (isAuthor || isParticipant) && isPast;
      })
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [sessionData, user]);

  const handleNext = () => {
    setPastIndex((prev) => Math.min(prev + 1, pastSessions.length - 3));
  };

  const handlePrev = () => {
    setPastIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
  };

  const handlePrefSubmit = (e) => {
    e.preventDefault();
    updatePrefs({
      variables: {
        preferences: {
          studyPace: prefForm.studyPace,
          studyMode: prefForm.studyMode,
          groupSize: prefForm.groupSize,
          studyStyle: prefForm.studyStyle,
        },
      },
    });
    setIsEditingPreferences(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const timestamp = Number(dateStr);
    const date = !isNaN(timestamp)
      ? new Date(timestamp)
      : new Date(dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr);

    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const timestamp = Number(dateStr);
    const date = !isNaN(timestamp)
      ? new Date(timestamp)
      : new Date(dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr);

    if (isNaN(date.getTime())) return "Invalid Time";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (userLoading || prefLoading)
    return <div className="user-profile-container">Loading profile...</div>;
  if (prefError)
    return (
      <div className="user-profile-container">
        Error loading preferences: {prefError.message}
      </div>
    );

  return (
    <div className="user-profile-container">
      <button
        className="secondary-btn mb-4"
        onClick={onBack}
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <header className="section-header">
        <h1>User Profile & Activity</h1>
        <p>Manage your profile</p>
      </header>

      <section className="profile-card">
        <div className="profile-content">
          <div className="avatar-section">
            <div className="avatar-placeholder">
              <User />
            </div>
          </div>

          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <div className="preferences-grid">
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  disabled={true}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled={true}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="profile-actions"></div>
          </form>
        </div>
      </section>

      <section className="preferences-card">
        <div className="preferences-title-section">
          <h2>Study Preferences</h2>
          <button
            className="edit-btn"
            onClick={() =>
              isEditingPreferences
                ? handlePrefSubmit({ preventDefault: () => {} })
                : setIsEditingPreferences(true)
            }
          >
            {isEditingPreferences ? "Save" : "Edit"}
          </button>
        </div>

        <form className="preferences-grid" onSubmit={handlePrefSubmit}>
          <div className="form-field">
            <label>preferred study pace</label>
            <input
              type="text"
              value={prefForm.studyPace}
              disabled={!isEditingPreferences}
              onChange={(e) =>
                setPrefForm({ ...prefForm, studyPace: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>preferred group size</label>
            <input
              type="text"
              value={prefForm.groupSize}
              disabled={!isEditingPreferences}
              onChange={(e) =>
                setPrefForm({ ...prefForm, groupSize: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>preferred study mode</label>
            <select
              value={prefForm.studyMode}
              disabled={!isEditingPreferences}
              onChange={(e) =>
                setPrefForm({ ...prefForm, studyMode: e.target.value })
              }
            >
              <option value="online">online</option>
              <option value="in_person">in-person</option>
            </select>
          </div>
          <div className="form-field">
            <label>preferred study style</label>
            <select
              value={prefForm.studyStyle}
              disabled={!isEditingPreferences}
              onChange={(e) =>
                setPrefForm({ ...prefForm, studyStyle: e.target.value })
              }
            >
              <option value="Quiet Study">Quiet Study</option>
              <option value="Group Discussion">Group Discussion</option>
              <option value="Problem Solving">Problem Solving</option>
            </select>
          </div>
        </form>
      </section>

      <section>
        <h2 className="past-sessions-title">Past Sessions</h2>
        <div className="carousel-container" style={{ marginBottom: "3rem" }}>
          <button
            className="nav-arrow"
            onClick={handlePrev}
            disabled={pastIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="carousel-viewport">
            <div
              className="carousel-track"
              style={{
                transform: `translateX(-${pastIndex * (33.333 + 1.5)}%)`,
              }}
            >
              {pastSessions.length > 0 ? (
                pastSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isCreator={session.authorId === user?.id}
                    isUpcoming={false}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                ))
              ) : (
                <p>No past sessions found.</p>
              )}
            </div>
          </div>

          <button
            className="nav-arrow"
            onClick={handleNext}
            disabled={pastIndex >= pastSessions.length - 3}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default UserProfile;
