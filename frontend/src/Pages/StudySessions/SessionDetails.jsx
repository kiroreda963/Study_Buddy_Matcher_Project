import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Mail,
  User,
  Info,
  Edit2,
} from "lucide-react";
import { sessionClient, authClient } from "../../clients/apolloClients";
import {
  GET_STUDY_SESSION_BY_ID,
  GET_OTHER_USER,
  DELETE_STUDY_SESSION,
} from "../../graphql/operations";
import { useAuth } from "../../context/AuthContext";
import "./SessionDetails.css";

const ParticipantName = ({ userId }) => {
  const { data, loading, error } = useQuery(GET_OTHER_USER, {
    client: authClient,
    variables: { userId },
  });

  if (loading) return <span className="loading-name">Loading...</span>;
  if (error)
    return <span className="error-name">User {userId.substring(0, 4)}</span>;

  return (
    <span>
      {data?.getUserProfile?.name || `User ${userId.substring(0, 4)}`}
    </span>
  );
};

const SessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, error } = useQuery(GET_STUDY_SESSION_BY_ID, {
    client: sessionClient,
    variables: { id },
    fetchPolicy: "network-only",
  });
  const [deleteSession] = useMutation(DELETE_STUDY_SESSION, {
    client: sessionClient,
  });

  const handleCancelSession = async () => {
    const confirmed = window.confirm(
      "Cancel this study session? This will remove it for everyone.",
    );
    if (!confirmed) return;
    try {
      await deleteSession({ variables: { id } });
      navigate("/study-sessions");
    } catch (err) {
      alert(err?.message || "Could not cancel session.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const timestamp = Number(dateStr);
    const date = !isNaN(timestamp)
      ? new Date(timestamp)
      : new Date(dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
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

  if (loading)
    return (
      <div className="session-details-container">
        Loading session details...
      </div>
    );
  if (error)
    return (
      <div className="session-details-container">Error: {error.message}</div>
    );

  const session = data?.studySession;
  if (!session)
    return <div className="session-details-container">Session not found.</div>;

  const isAuthor = user && session.authorId === user.id;

  return (
    <div className="session-details-container">
      <div className="session-details-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="back-link" onClick={() => navigate(-1)} style={{ margin: 0 }}>
          <ArrowLeft size={18} /> Back to Sessions
        </button>
        {isAuthor && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button 
              className="edit-session-btn" 
              onClick={() => navigate(`/edit-session/${id}`)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem', 
                backgroundColor: 'var(--primary-color, #2196f3)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <Edit2 size={16} /> Edit Session
            </button>
            <button
              onClick={handleCancelSession}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Cancel Session
            </button>
          </div>
        )}
      </div>

      <header className="session-details-header">
        <div className="header-icon">
          <Info size={32} color="var(--primary-color, #2196f3)" />
        </div>
        <h1>{session.topic}</h1>
      </header>

      <div className="details-grid">
        <div className="detail-section">
          <label>Date & Time</label>
          <div className="value">
            <Calendar size={20} />
            <span>
              {formatDate(session.date)} at {formatTime(session.date)}
            </span>
          </div>
        </div>

        <div className="detail-section">
          <label>Duration</label>
          <div className="value">
            <Clock size={20} />
            <span>{session.duration} hours</span>
          </div>
        </div>

        <div className="detail-section">
          <label>Location / Type</label>
          <div className="value">
            <MapPin size={20} />
            <span>
              {session.sessionType === "ONLINE"
                ? "Online Session"
                : "In-Person Session"}
            </span>
          </div>
        </div>

        <div className="detail-section">
          <label>Contact Info</label>
          <div className="contact-info-list">
            {session.contactInfo.map((info, index) => (
              <span key={index} className="contact-badge">
                <Mail
                  size={14}
                  style={{ marginRight: "4px", verticalAlign: "middle" }}
                />
                {info}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="participants-list">
        <h2>
          <Users
            size={24}
            style={{ marginRight: "8px", verticalAlign: "bottom" }}
          />
          Participants ({session.participants.length})
        </h2>
        <div className="participants-grid">
          {session.participants.map((participantId, index) => (
            <div key={index} className="participant-item">
              <User size={16} />
              <ParticipantName userId={participantId} />
            </div>
          ))}
          {session.participants.length === 0 && <p>No participants yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
