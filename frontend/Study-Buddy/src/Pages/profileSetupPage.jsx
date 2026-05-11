import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { ApolloProvider } from '@apollo/client/react';
import { profileClient } from '../clients/apolloClients';
import { useAuth } from '../context/AuthContext';
import {
  GET_PROFILE,
  CREATE_OR_UPDATE_PROFILE,
  ADD_COURSE,
  REMOVE_COURSE,
  ADD_TOPIC,
  REMOVE_TOPIC,
} from '../graphql/operations';

const COMMON_COURSES = [
  'Introduction to Programming',
  'Data Structures and Algorithms',
  'Object-Oriented Programming',
  'Database Systems',
  'Operating Systems',
  'Computer Networks',
  'Software Engineering',
  'Web Development',
  'Mobile Application Development',
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Computer Vision',
  'Natural Language Processing',
  'Cybersecurity',
  'Cloud Computing',
  'Distributed Systems',
  'Computer Architecture',
  'Compiler Design',
  'Theory of Computation',
  'Discrete Mathematics',
  'Linear Algebra',
  'Calculus I',
  'Calculus II',
  'Probability and Statistics',
  'Numerical Methods',
  'Digital Logic Design',
  'Embedded Systems',
  'Human-Computer Interaction',
  'Project Management',
  'Data Science',
  'Big Data Analytics',
  'Blockchain Technology',
  'Internet of Things',
  'Game Development',
  'Graphics and Visualization',
  'Parallel Computing',
  'Information Security',
  'Software Testing',
  'Agile Development',
  'Microprocessors',
  'Signal Processing',
  'Communication Systems',
  'Control Systems',
  'Engineering Mathematics',
  'Physics I',
  'Physics II',
  'Chemistry',
  'Biology',
  'Technical Writing',
  'Business Communication',
  'Economics',
  'Accounting',
  'Marketing',
  'Management',
  'Entrepreneurship',
  'Research Methods',
  'Ethics in Technology',
  'Graduation Project I',
  'Graduation Project II',
];

function ProfileSetupInner() {
  const navigate = useNavigate();
  const { token, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) navigate('/login');
  }, [token, loading, navigate]);

  const [university, setUniversity] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [courseInput, setCourseInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const courseInputRef = useRef(null);
  const topicInputRef = useRef(null);
  const suggestionsRef = useRef(null);

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
    if (profileData?.getProfile) {
      const p = profileData.getProfile;
      setUniversity(p.university || '');
      setAcademicYear(p.academicYear || '');
      setCourses(p.courses || []);
      setTopics(p.topics || []);
    }
  }, [profileData]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          courseInputRef.current && !courseInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = courseInput.trim().length > 0
    ? COMMON_COURSES.filter(course =>
        course.toLowerCase().includes(courseInput.toLowerCase()) &&
        !courses.some(c => c.name.toLowerCase() === course.toLowerCase())
      ).slice(0, 6)
    : [];

  const [createOrUpdateProfile] = useMutation(CREATE_OR_UPDATE_PROFILE);
  const [addCourse] = useMutation(ADD_COURSE);
  const [removeCourse] = useMutation(REMOVE_COURSE);
  const [addTopic] = useMutation(ADD_TOPIC);
  const [removeTopic] = useMutation(REMOVE_TOPIC);

  const doAddCourse = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (courses.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in your courses.`);
      setTimeout(() => setError(''), 3000);
      setCourseInput('');
      return;
    }
    setCourseInput('');
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    try {
      const { data } = await addCourse({ variables: { courseName: trimmed } });
      setCourses(data.addCourse.courses);
    } catch (err) {
      setError('Failed to add course: ' + err.message);
    }
  };

  const handleCourseInputChange = (e) => {
    setCourseInput(e.target.value);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
  };

  const handleCourseKeyDown = async (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    } else if ((e.key === 'Enter' || e.key === ',') && courseInput.trim()) {
      e.preventDefault();
      if (activeSuggestion >= 0 && filteredSuggestions[activeSuggestion]) {
        await doAddCourse(filteredSuggestions[activeSuggestion]);
      } else {
        await doAddCourse(courseInput);
      }
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    await doAddCourse(suggestion);
    courseInputRef.current?.focus();
  };

  const handleRemoveCourse = async (courseId) => {
    try {
      const { data } = await removeCourse({ variables: { courseId } });
      setCourses(data.removeCourse.courses);
    } catch (err) {
      setError('Failed to remove course: ' + err.message);
    }
  };

  const handleTopicKeyDown = async (e) => {
    if ((e.key === 'Enter' || e.key === ',') && topicInput.trim()) {
      e.preventDefault();
      const name = topicInput.trim().replace(/,$/, '');
      if (!name) return;
      if (topics.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        setError(`"${name}" is already in your topics.`);
        setTimeout(() => setError(''), 3000);
        setTopicInput('');
        return;
      }
      setTopicInput('');
      try {
        const { data } = await addTopic({ variables: { topicName: name } });
        setTopics(data.addTopic.topics);
      } catch (err) {
        setError('Failed to add topic: ' + err.message);
      }
    }
  };

  const handleRemoveTopic = async (topicId) => {
    try {
      const { data } = await removeTopic({ variables: { topicId } });
      setTopics(data.removeTopic.topics);
    } catch (err) {
      setError('Failed to remove topic: ' + err.message);
    }
  };

  const handleSave = async () => {
    setError('');
    setSaveStatus('');
    setSaving(true);
    try {
      await createOrUpdateProfile({ variables: { university, academicYear } });
      setSaveStatus('Profile saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setError('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Nunito, sans-serif', color: '#888' }}>
        Loading your profile…
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .ps-page { min-height: 100vh; background: #f5f5f5; font-family: 'Nunito', sans-serif; display: flex; flex-direction: column; }
        .ps-header { background: white; padding: 18px 40px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .ps-brand { font-size: 1.5rem; font-weight: 800; color: #4ADE80; }
        .ps-logout { background: none; border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 6px 14px; font-size: 0.8125rem; color: #555; cursor: pointer; font-family: 'Nunito', sans-serif; }
        .ps-body { flex: 1; display: flex; justify-content: center; padding: 48px 24px 80px; }
        .ps-card { background: white; border-radius: 16px; box-shadow: 0 2px 24px rgba(0,0,0,0.07); padding: 48px 56px; width: 100%; max-width: 640px; border: 1px solid #e2e8f0; animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .ps-title { font-size: 2rem; font-weight: 800; color: #4ADE80; text-align: center; margin-bottom: 36px; }
        .ps-group { margin-bottom: 24px; }
        .ps-label { display: block; font-size: 0.875rem; font-weight: 600; color: #555; margin-bottom: 8px; }
        .ps-input { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Nunito', sans-serif; font-size: 0.9375rem; color: #1a1a1a; background: white; outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
        .ps-input:focus { border-color: #4ADE80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
        .ps-input::placeholder { color: #a0aec0; }
        .ps-tags-wrap { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; min-height: 50px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; cursor: text; transition: border-color 0.18s, box-shadow 0.18s; background: white; }
        .ps-tags-wrap:focus-within { border-color: #4ADE80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
        .ps-tag { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; color: #16a34a; border-radius: 20px; padding: 4px 10px 4px 12px; font-size: 0.8125rem; font-weight: 600; }
        .ps-tag-remove { background: none; border: none; cursor: pointer; color: #16a34a; font-size: 1rem; line-height: 1; padding: 0; opacity: 0.7; transition: opacity 0.15s; }
        .ps-tag-remove:hover { opacity: 1; }
        .ps-tags-input { border: none; outline: none; font-family: 'Nunito', sans-serif; font-size: 0.9375rem; color: #1a1a1a; background: transparent; min-width: 140px; flex: 1; }
        .ps-tags-input::placeholder { color: #a0aec0; }
        .ps-hint { font-size: 0.75rem; color: #a0aec0; margin-top: 5px; }
        .ps-autocomplete-wrap { position: relative; }
        .ps-suggestions { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); z-index: 100; overflow: hidden; }
        .ps-suggestion-item { padding: 10px 14px; font-size: 0.9rem; font-family: 'Nunito', sans-serif; color: #1a1a1a; cursor: pointer; transition: background 0.12s; display: flex; align-items: center; gap: 8px; }
        .ps-suggestion-item:hover, .ps-suggestion-item.active { background: #f0fdf4; color: #16a34a; }
        .ps-suggestion-icon { font-size: 0.75rem; opacity: 0.5; }
        .ps-btn { display: block; width: 100%; padding: 14px; background: #4ADE80; color: white; font-family: 'Nunito', sans-serif; font-size: 0.9375rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: none; border-radius: 50px; cursor: pointer; margin-top: 8px; transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s; box-shadow: 0 4px 14px rgba(74,222,128,0.35); }
        .ps-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(74,222,128,0.45); background: #22c55e; }
        .ps-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .ps-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.875rem; margin-bottom: 20px; font-weight: 600; }
        .ps-alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .ps-alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .ps-nav { text-align: center; margin-top: 24px; font-size: 0.875rem; color: #a0aec0; }
        .ps-nav a { color: #16a34a; font-weight: 600; text-decoration: none; margin-left: 4px; }
        .ps-nav a:hover { text-decoration: underline; }
        .ps-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) { .ps-card { padding: 32px 20px; } .ps-header { padding: 18px 20px; } }
      `}</style>

      <div className="ps-page">
        <header className="ps-header">
          <span className="ps-brand">Learn Together</span>
          <button className="ps-logout" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </header>

        <main className="ps-body">
          <div className="ps-card">
            <h1 className="ps-title">Profile Setup</h1>

            {error && <div className="ps-alert ps-alert-error">{error}</div>}
            {saveStatus && <div className="ps-alert ps-alert-success">{saveStatus}</div>}

            <div className="ps-group">
              <label className="ps-label">What University do you study at?</label>
              <input className="ps-input" type="text" placeholder="Enter your University's name" value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>

            <div className="ps-group">
              <label className="ps-label">What academic year are you in?</label>
              <input className="ps-input" type="text" placeholder="e.g. Year 3, Sophomore, Junior…" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
            </div>

            {/* Courses with autocomplete */}
            <div className="ps-group">
              <label className="ps-label">What courses are you currently taking?</label>
              <div className="ps-autocomplete-wrap">
                <div className="ps-tags-wrap" onClick={() => courseInputRef.current?.focus()}>
                  {courses.map((c) => (
                    <span key={c.id} className="ps-tag">
                      {c.name}
                      <button className="ps-tag-remove" onClick={(e) => { e.stopPropagation(); handleRemoveCourse(c.id); }}>×</button>
                    </span>
                  ))}
                  <input
                    ref={courseInputRef}
                    className="ps-tags-input"
                    type="text"
                    placeholder={courses.length === 0 ? 'Search or type a course…' : 'Add another…'}
                    value={courseInput}
                    onChange={handleCourseInputChange}
                    onKeyDown={handleCourseKeyDown}
                    onFocus={() => courseInput.trim() && setShowSuggestions(true)}
                    autoComplete="off"
                  />
                </div>

                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="ps-suggestions" ref={suggestionsRef}>
                    {filteredSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className={`ps-suggestion-item${index === activeSuggestion ? ' active' : ''}`}
                        onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
                      >
                        <span className="ps-suggestion-icon">📚</span>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="ps-hint">Type to search courses, or press Enter to add a custom one.</p>
            </div>

            {/* Topics */}
            <div className="ps-group">
              <label className="ps-label">What topics are you interested in studying?</label>
              <div className="ps-tags-wrap" onClick={() => topicInputRef.current?.focus()}>
                {topics.map((t) => (
                  <span key={t.id} className="ps-tag">
                    {t.name}
                    <button className="ps-tag-remove" onClick={(e) => { e.stopPropagation(); handleRemoveTopic(t.id); }}>×</button>
                  </span>
                ))}
                <input
                  ref={topicInputRef}
                  className="ps-tags-input"
                  type="text"
                  placeholder={topics.length === 0 ? 'Type a topic and press Enter…' : 'Add another…'}
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleTopicKeyDown}
                />
              </div>
              <p className="ps-hint">Press Enter or comma to add a topic.</p>
            </div>

            <button className="ps-btn" onClick={handleSave} disabled={saving}>
              {saving && <span className="ps-spinner" />}
              {saving ? 'Saving…' : 'SAVE'}
            </button>

            <p className="ps-nav">
              Next step:<Link to="/study-preferences">Set up Study Preferences →</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function ProfileSetupPage() {
  return (
    <ApolloProvider client={profileClient}>
      <ProfileSetupInner />
    </ApolloProvider>
  );
}