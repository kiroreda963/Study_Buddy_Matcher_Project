import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowLeft
} from 'lucide-react';
import { sessionClient } from '../../apollo/clients';
import { GET_STUDY_SESSIONS, JOIN_STUDY_SESSION, LEAVE_STUDY_SESSION } from '../../graphql/operations';
import CreateSession from '../CreateSession/CreateSession';
import './StudySessions.css';

const StudySessions = () => {
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [upcomingIndex, setUpcomingIndex] = useState(0);
  const [pastIndex, setPastIndex] = useState(0);

  // Mock current user ID for demonstration (usually should come from auth context)
  // VERY IMPORTANT
  const currentUserId = "user-123";

  const { data, loading, error, refetch } = useQuery(GET_STUDY_SESSIONS, {
    client: sessionClient,
    fetchPolicy: 'network-only'
  });

  const [joinSession] = useMutation(JOIN_STUDY_SESSION, {
    client: sessionClient,
    onCompleted: () => refetch()
  });

  const [leaveSession] = useMutation(LEAVE_STUDY_SESSION, {
    client: sessionClient,
    onCompleted: () => refetch()
  });

  const sessions = data?.studySessions || [];

  const { upcoming, past, stats } = useMemo(() => {
    const now = new Date();
    const up = [];
    const ps = [];
    let createdCount = 0;

    sessions.forEach(s => {
      const sessionDate = new Date(s.date);
      if (sessionDate >= now) {
        up.push(s);
      } else {
        ps.push(s);
      }
      if (s.authorId === currentUserId) {
        createdCount++;
      }
    });

    // Sort upcoming by date ascending
    up.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Sort past by date descending
    ps.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      upcoming: up,
      past: ps,
      stats: {
        upcoming: up.length,
        past: ps.length,
        created: createdCount
      }
    };
  }, [sessions, currentUserId]);

  const handleNext = (type) => {
    if (type === 'upcoming') {
      setUpcomingIndex(prev => Math.min(prev + 1, upcoming.length - 1));
    } else {
      setPastIndex(prev => Math.min(prev + 1, past.length - 1));
    }
  };

  const handlePrev = (type) => {
    if (type === 'upcoming') {
      setUpcomingIndex(prev => Math.max(prev - 1, 0));
    } else {
      setPastIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) return <div className="study-sessions-container">Loading sessions...</div>;
  if (error) return <div className="study-sessions-container">Error: {error.message}</div>;

  if (showCreateSession) {
    return (
      <div className="study-sessions-container">
        <button className="secondary-btn mb-4" onClick={() => {
          setShowCreateSession(false);
          refetch();
        }} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Sessions
        </button>
        <CreateSession onComplete={() => {
          setShowCreateSession(false);
          refetch();
        }} />
      </div>
    );
  }

  return (
    <div className="study-sessions-container">
      <header className="header">
        <div className="header-text">
          <h1>Study Sessions</h1>
          <p>View and manage your study sessions</p>
        </div>
        <button className="create-btn" onClick={() => setShowCreateSession(true)}>
          <Plus size={20} /> Create Session
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">Upcoming</span>
          <div className="stat-value-container">
            <Calendar className="stat-icon upcoming" />
            <span className="stat-value">{stats.upcoming}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-title">Past</span>
          <div className="stat-value-container">
            <Clock className="stat-icon past" />
            <span className="stat-value">{stats.past}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-title">Created By You</span>
          <div className="stat-value-container">
            <User className="stat-icon created" />
            <span className="stat-value">{stats.created}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Upcoming Sessions</h2>
        <div className="carousel-container">
          <button
            className="nav-arrow"
            onClick={() => handlePrev('upcoming')}
            disabled={upcomingIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="carousel-viewport">
            <div className="carousel-track" style={{ transform: `translateX(-${upcomingIndex * (33.333 + 1.5)}%)` }}>
              {upcoming.length > 0 ? upcoming.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isCreator={session.authorId === currentUserId}
                  isUpcoming={true}
                  onJoin={() => joinSession({ variables: { sessionId: session.id } })}
                  onLeave={() => leaveSession({ variables: { sessionId: session.id } })}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              )) : <p>No upcoming sessions found.</p>}
            </div>
          </div>

          <button
            className="nav-arrow"
            onClick={() => handleNext('upcoming')}
            disabled={upcomingIndex >= upcoming.length - 3}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      <section>
        <h2 className="section-title">Past Sessions</h2>
        <div className="carousel-container">
          <button
            className="nav-arrow"
            onClick={() => handlePrev('past')}
            disabled={pastIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="carousel-viewport">
            <div className="carousel-track" style={{ transform: `translateX(-${pastIndex * (33.333 + 1.5)}%)` }}>
              {past.length > 0 ? past.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isCreator={session.authorId === currentUserId}
                  isUpcoming={false}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              )) : <p>No past sessions found.</p>}
            </div>
          </div>

          <button
            className="nav-arrow"
            onClick={() => handleNext('past')}
            disabled={pastIndex >= past.length - 3}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>
    </div>
  );
};

const SessionCard = ({ session, isCreator, isUpcoming, onLeave, formatDate, formatTime }) => {
  return (
    <div className={`session-card ${session.isActive ? 'active' : ''}`}>
      {isCreator && (
        <div className="creator-tag">
          <User size={12} /> Creator
        </div>
      )}
      <h3 className="session-topic">{session.topic}</h3>

      <div className="session-details">
        <div className="detail-item">
          <Calendar />
          <span>{formatDate(session.date)}</span>
        </div>
        <div className="detail-item">
          <Clock />
          <span>{formatTime(session.date)} ({session.duration} hours)</span>
        </div>
        <div className="detail-item">
          <MapPin />
          <span>{session.sessionType === 'ONLINE' ? 'Online' : 'In-Person Session'}</span>
        </div>
        <div className="detail-item">
          <Users />
          <span>{session.participants.length} participants</span>
        </div>
      </div>

      <div className="card-actions">
        <button className="view-details-btn">View Details</button>
        {isUpcoming && isCreator && (
          <button className="secondary-btn">Edit</button>
        )}
        {isUpcoming && !isCreator && (
          <button className="secondary-btn" onClick={onLeave}>Leave</button>
        )}
      </div>
    </div>
  );
};

export default StudySessions;
