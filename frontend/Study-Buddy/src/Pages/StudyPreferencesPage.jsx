import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { ApolloProvider } from '@apollo/client/react';
import { profileClient } from '../clients/apolloClients';
import { useAuth } from '../context/AuthContext';
import { GET_PROFILE, UPDATE_PREFERENCES } from '../graphql/operations';

const STUDY_PACE_OPTIONS = [
  { value: 'slow', label: 'Slow' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'fast', label: 'Fast' },
];

const STUDY_MODE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'in-person', label: 'In-Person' },
];

const GROUP_SIZE_OPTIONS = [
  { value: 'solo', label: 'Solo (1)' },
  { value: 'small', label: 'Small (2–4)' },
  { value: 'large', label: 'Large (5+)' },
];

const STUDY_STYLE_OPTIONS = [
  { value: 'notes', label: 'Writing Notes' },
  { value: 'listening', label: 'Listening' },
  { value: 'discussion', label: 'Discussing Out Loud' },
  { value: 'quiet', label: 'Studying Quietly' },
  { value: 'other', label: 'Other' },
];

function StudyPreferencesInner() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  const [studyPace, setStudyPace] = useState('');
  const [studyMode, setStudyMode] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [studyStyle, setStudyStyle] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { loading: profileLoading, data: profileData, error: profileError } = useQuery(GET_PROFILE, {
  fetchPolicy: 'network-only',
});

useEffect(() => {
  if (profileError?.message?.toLowerCase().includes('unauthorized')) {
    logout();
    navigate('/login');
  }
}, [profileError]);

useEffect(() => {
  if (profileData?.getProfile?.preferences) {
    const prefs = profileData.getProfile.preferences;
    setStudyPace(prefs.studyPace || '');
    setStudyMode(prefs.studyMode || '');
    setGroupSize(prefs.groupSize || '');
    setStudyStyle(prefs.studyStyle || '');
  }
}, [profileData]);

  const [updatePreferences] = useMutation(UPDATE_PREFERENCES);

  const handleSave = async () => {
    setError('');
    setSaveStatus('');
    setSaving(true);
    try {
      await updatePreferences({
        variables: {
          preferences: {
            studyPace: studyPace || null,
            studyMode: studyMode || null,
            groupSize: groupSize || null,
            studyStyle: studyStyle || null,
          },
        },
      });
      setSaveStatus('Study preferences saved!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setError('Failed to save preferences: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Nunito, sans-serif', color: '#888' }}>
        Loading your preferences…
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sp-page { min-height: 100vh; background: #f5f5f5; font-family: 'Nunito', sans-serif; display: flex; flex-direction: column; }
        .sp-header { background: white; padding: 18px 40px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .sp-brand { font-size: 1.5rem; font-weight: 800; color: #4ADE80; }
        .sp-logout { background: none; border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 6px 14px; font-size: 0.8125rem; color: #555; cursor: pointer; font-family: 'Nunito', sans-serif; }
        .sp-body { flex: 1; display: flex; justify-content: center; padding: 48px 24px 80px; }
        .sp-card { background: white; border-radius: 16px; box-shadow: 0 2px 24px rgba(0,0,0,0.07); padding: 48px 56px; width: 100%; max-width: 640px; border: 1px solid #e2e8f0; animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .sp-title { font-size: 2rem; font-weight: 800; color: #4ADE80; text-align: center; margin-bottom: 36px; }
        .sp-group { margin-bottom: 24px; }
        .sp-label { display: block; font-size: 0.875rem; font-weight: 600; color: #555; margin-bottom: 8px; }
        .sp-select { width: 100%; padding: 12px 40px 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Nunito', sans-serif; font-size: 0.9375rem; color: #1a1a1a; background: white; outline: none; appearance: none; -webkit-appearance: none; cursor: pointer; transition: border-color 0.18s, box-shadow 0.18s; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a0aec0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
        .sp-select:focus { border-color: #4ADE80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
        .sp-btn { display: block; width: 100%; padding: 14px; background: #4ADE80; color: white; font-family: 'Nunito', sans-serif; font-size: 0.9375rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: none; border-radius: 50px; cursor: pointer; margin-top: 8px; transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s; box-shadow: 0 4px 14px rgba(74,222,128,0.35); }
        .sp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(74,222,128,0.45); background: #22c55e; }
        .sp-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .sp-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.875rem; margin-bottom: 20px; font-weight: 600; }
        .sp-alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .sp-alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .sp-nav { text-align: center; margin-top: 24px; font-size: 0.875rem; color: #a0aec0; }
        .sp-nav a { color: #16a34a; font-weight: 600; text-decoration: none; }
        .sp-nav a:hover { text-decoration: underline; }
        .sp-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) { .sp-card { padding: 32px 20px; } .sp-header { padding: 18px 20px; } }
      `}</style>

      <div className="sp-page">
        <header className="sp-header">
          <span className="sp-brand">Learn Together</span>
          <button className="sp-logout" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </header>

        <main className="sp-body">
          <div className="sp-card">
            <h1 className="sp-title">Study Preferences Setup</h1>

            {error && <div className="sp-alert sp-alert-error">{error}</div>}
            {saveStatus && <div className="sp-alert sp-alert-success">{saveStatus}</div>}

            <div className="sp-group">
              <label className="sp-label">Preferred studying pace</label>
              <select className="sp-select" value={studyPace} onChange={(e) => setStudyPace(e.target.value)}>
                <option value="">Select pace --</option>
                {STUDY_PACE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="sp-group">
              <label className="sp-label">Preferred studying mode</label>
              <select className="sp-select" value={studyMode} onChange={(e) => setStudyMode(e.target.value)}>
                <option value="">Select mode --</option>
                {STUDY_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="sp-group">
              <label className="sp-label">Preferred group size</label>
              <select className="sp-select" value={groupSize} onChange={(e) => setGroupSize(e.target.value)}>
                <option value="">Select group size --</option>
                {GROUP_SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="sp-group">
              <label className="sp-label">Preferred study style</label>
              <select className="sp-select" value={studyStyle} onChange={(e) => setStudyStyle(e.target.value)}>
                <option value="">Select study style --</option>
                {STUDY_STYLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <button className="sp-btn" onClick={handleSave} disabled={saving}>
              {saving && <span className="sp-spinner" />}
              {saving ? 'Saving…' : 'SAVE'}
            </button>

            <p className="sp-nav">
              <Link to="/profile-setup">← Back to Profile Setup</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function StudyPreferencesPage() {
  return (
    <ApolloProvider client={profileClient}>
      <StudyPreferencesInner />
    </ApolloProvider>
  );
}