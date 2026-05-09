import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  User,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { sessionClient, profileClient, userAuthClient } from '../../apollo/clients';
import {
  GET_ME,
  GET_PROFILE_PREFERENCES,
  UPDATE_PREFERENCES,
  GET_STUDY_SESSIONS
} from '../../graphql/operations';
import SessionCard from '../Shared/SessionCard';
import './UserProfile.css';

const UserProfile = ({ onBack }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [pastIndex, setPastIndex] = useState(0);

  // Queries
  const { data: userData, loading: userLoading } = useQuery(GET_ME, { client: userAuthClient });
  const { data: prefData, loading: prefLoading } = useQuery(GET_PROFILE_PREFERENCES, { client: profileClient });
  const { data: sessionData, loading: sessionLoading } = useQuery(GET_STUDY_SESSIONS, { client: sessionClient });

  // Mutations
  const [updatePrefs] = useMutation(UPDATE_PREFERENCES, {
    client: profileClient,
    refetchQueries: [{ query: GET_PROFILE_PREFERENCES, client: profileClient }]
  });

  // State for forms
  const [profileForm, setProfileForm] = useState({
    name: 'Yahya',
    surname: 'Arafa',
    email: 'random@random.com',
    profilePic: 'www.images.com/profile.png'
  });

  const [prefForm, setPrefForm] = useState({
    studyPace: 'Quick',
    groupSize: '3',
    studyMode: 'online',
    studyStyle: 'Quiet Study'
  });

  // Update form state when data loads
  useEffect(() => {
    if (userData?.me) {
      setProfileForm(prev => ({
        ...prev,
        name: userData.me.name.split(' ')[0] || prev.name,
        surname: userData.me.name.split(' ').slice(1).join(' ') || prev.surname,
        email: userData.me.email
      }));
    }
  }, [userData]);

  useEffect(() => {
    if (prefData?.getProfile?.preferences) {
      const p = prefData.getProfile.preferences;
      setPrefForm({
        studyPace: p.studyPace || 'Quick',
        groupSize: p.groupSize || '3',
        studyMode: p.studyMode || 'online',
        studyStyle: p.studyStyle || 'Quiet Study'
      });
    }
  }, [prefData]);

  const pastSessions = useMemo(() => {
    if (!sessionData?.studySessions) return [];
    const now = new Date();
    return sessionData.studySessions
      .filter(s => new Date(s.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sessionData]);

  const handleNext = () => {
    setPastIndex(prev => Math.min(prev + 1, pastSessions.length - 3));
  };

  const handlePrev = () => {
    setPastIndex(prev => Math.max(prev - 1, 0));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsEditingProfile(false);
    // Mutation to update user info would go here
  };

  const handlePrefSubmit = (e) => {
    e.preventDefault();
    updatePrefs({
      variables: {
        preferences: {
          studyPace: prefForm.studyPace,
          studyMode: prefForm.studyMode,
          groupSize: prefForm.groupSize,
          studyStyle: prefForm.studyStyle
        }
      }
    });
    setIsEditingPreferences(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (userLoading || prefLoading) return <div className="user-profile-container">Loading profile...</div>;

  return (
    <div className="user-profile-container">
      <button className="secondary-btn mb-4" onClick={onBack} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  disabled={!isEditingProfile}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Surname</label>
                <input
                  type="text"
                  value={profileForm.surname}
                  disabled={!isEditingProfile}
                  onChange={(e) => setProfileForm({ ...profileForm, surname: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled={!isEditingProfile}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Profile Picture URL</label>
                <input
                  type="text"
                  value={profileForm.profilePic}
                  disabled={!isEditingProfile}
                  onChange={(e) => setProfileForm({ ...profileForm, profilePic: e.target.value })}
                />
              </div>
            </div>

            <div className="profile-actions">
              <button type="button" className="change-password-btn">Change Password</button>
              <button
                type="button"
                className="edit-btn"
                onClick={() => isEditingProfile ? handleProfileSubmit({ preventDefault: () => { } }) : setIsEditingProfile(true)}
              >
                {isEditingProfile ? 'Save' : 'Edit'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="preferences-card">
        <div className="preferences-title-section">
          <h2>Study Preferences</h2>
          <button
            className="edit-btn"
            onClick={() => isEditingPreferences ? handlePrefSubmit({ preventDefault: () => { } }) : setIsEditingPreferences(true)}
          >
            {isEditingPreferences ? 'Save' : 'Edit'}
          </button>
        </div>

        <form className="preferences-grid" onSubmit={handlePrefSubmit}>
          <div className="form-field">
            <label>preferred study pace</label>
            <input
              type="text"
              value={prefForm.studyPace}
              disabled={!isEditingPreferences}
              onChange={(e) => setPrefForm({ ...prefForm, studyPace: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>preferred group size</label>
            <input
              type="text"
              value={prefForm.groupSize}
              disabled={!isEditingPreferences}
              onChange={(e) => setPrefForm({ ...prefForm, groupSize: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>preferred study mode</label>
            <select
              value={prefForm.studyMode}
              disabled={!isEditingPreferences}
              onChange={(e) => setPrefForm({ ...prefForm, studyMode: e.target.value })}
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
              onChange={(e) => setPrefForm({ ...prefForm, studyStyle: e.target.value })}
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
        <div className="carousel-container" style={{ marginBottom: '3rem' }}>
          <button
            className="nav-arrow"
            onClick={handlePrev}
            disabled={pastIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="carousel-viewport">
            <div className="carousel-track" style={{ transform: `translateX(-${pastIndex * (33.333 + 1.5)}%)` }}>
              {pastSessions.length > 0 ? pastSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isCreator={session.authorId === "user-123"} // Placeholder
                  isUpcoming={false}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              )) : <p>No past sessions found.</p>}
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
