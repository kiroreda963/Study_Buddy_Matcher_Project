import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { ChevronDown, User, Check, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  authClient,
  sessionClient,
  profileClient,
  matchingClient,
} from "../../clients/apolloClients";
import {
  GET_TOPICS,
  GET_CONNECTIONS,
  UPDATE_STUDY_SESSION,
  GET_STUDY_SESSION_BY_ID,
  GET_OTHER_USER,
} from "../../graphql/operations";
import "./CreateSession.css";

const BuddyCard = ({ buddyId, isSelected, onClick }) => {
  const { data, loading } = useQuery(GET_OTHER_USER, {
    client: authClient,
    variables: { userId: buddyId },
    skip: !buddyId,
  });

  const buddyName = data?.otherUser?.name || `Buddy ${buddyId.substring(0, 5)}`;
  const university = data?.otherUser?.university;

  return (
    <div
      className={`buddy-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="buddy-status">
        <Check size={14} />
      </div>
      <div className="buddy-avatar">
        <User size={20} />
      </div>
      <div className="buddy-info">
        <div className="buddy-name">{loading ? "Loading..." : buddyName}</div>
        {university && <div className="buddy-university">{university}</div>}
      </div>
    </div>
  );
};

const EditStudySession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    topic: "",
    date: "",
    time: "",
    duration: "",
    sessionType: "ONLINE",
    participants: [],
    contactInfo: "",
  });

  // Queries
  const { data: sessionData, loading: sessionLoading } = useQuery(GET_STUDY_SESSION_BY_ID, {
    client: sessionClient,
    variables: { id },
  });

  const { data: profileData, loading: profileLoading } = useQuery(GET_TOPICS, {
    client: profileClient,
  });

  const { data: matchingData, loading: matchingLoading } = useQuery(
    GET_CONNECTIONS,
    { client: matchingClient },
  );

  // Mutation
  const [updateSession, { loading: updating }] = useMutation(
    UPDATE_STUDY_SESSION,
    {
      client: sessionClient,
      onCompleted: () => {
        alert("Study session updated successfully!");
        navigate(`/session/${id}`);
      },
      onError: (error) => {
        console.error("Error updating session:", error);
        alert("Failed to update study session: " + error.message);
      },
    },
  );

  useEffect(() => {
    if (sessionData?.studySession) {
      const session = sessionData.studySession;

      // Check if user is author
      if (user && session.authorId !== user.id) {
        alert("You are not authorized to edit this session.");
        navigate("/user-activity");
        return;
      }

      // Robust date parsing
      const dateStr = session.date;
      const timestamp = Number(dateStr);
      const sessionDate = !isNaN(timestamp)
        ? new Date(timestamp)
        : new Date(dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr);

      if (!isNaN(sessionDate.getTime())) {
        const datePart = sessionDate.toISOString().split("T")[0];
        const timePart = sessionDate.toTimeString().split(" ")[0].substring(0, 5);

        setFormData({
          topic: session.topic?.trim() || "",
          date: datePart,
          time: timePart,
          duration: session.duration.toString(),
          sessionType: session.sessionType,
          participants: session.participants || [],
          contactInfo: session.contactInfo[0] || "",
        });
      }
    }
  }, [sessionData, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleParticipant = (buddyId) => {
    setFormData((prev) => {
      const participants = [...prev.participants];
      const index = participants.indexOf(buddyId);
      if (index === -1) {
        participants.push(buddyId);
      } else {
        participants.splice(index, 1);
      }
      return { ...prev, participants };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const localDate = new Date(`${formData.date}T${formData.time}:00`);
    const combinedDate = isNaN(localDate.getTime())
      ? null
      : localDate.toISOString();

    if (!combinedDate) {
      alert("Please enter a valid date and time.");
      return;
    }

    updateSession({
      variables: {
        id,
        topic: formData.topic,
        date: combinedDate,
        duration: parseInt(formData.duration),
        sessionType: formData.sessionType,
        contactInfo: [formData.contactInfo],
        participants: formData.participants,
      },
    });
  };

  if (sessionLoading) {
    return <div className="create-session-container">Loading session details...</div>;
  }

  return (
    <div className="create-session-container">
      <div className="create-session-card">
        <button onClick={() => navigate(-1)} className="back-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="create-session-header">
          <h1>Edit study session</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Topic */}
          <div className="form-group">
            <label>Topic:</label>
            <div className="input-wrapper">
              <select
                name="topic"
                className="form-select"
                value={formData.topic}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select a topic...
                </option>
                {profileData?.getProfile?.topics.map((topic) => (
                  <option key={topic.id} value={topic.name}>
                    {topic.name}
                  </option>
                ))}
                {/* Ensure the current session topic is always an option */}
                {formData.topic && !profileData?.getProfile?.topics.some(t => t.name === formData.topic) && (
                  <option value={formData.topic}>{formData.topic}</option>
                )}
                {profileLoading && <option>Loading topics...</option>}
              </select>
              <ChevronDown className="select-icon" size={20} />
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              className="form-input"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Time */}
          <div className="form-group">
            <label>Time:</label>
            <input
              type="time"
              name="time"
              className="form-input"
              value={formData.time}
              onChange={handleChange}
              required
            />
            <div className="helper-text">Hours:Minutes – 24-hour format</div>
          </div>

          {/* Duration */}
          <div className="form-group">
            <label>Duration (minutes):</label>
            <input
              type="number"
              name="duration"
              className="form-input"
              placeholder="Enter duration..."
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>

          {/* Contact Info */}
          <div className="form-group">
            <label>Contact Info:</label>
            <input
              type="text"
              name="contactInfo"
              className="form-input"
              placeholder="e.g. Email or Phone"
              value={formData.contactInfo}
              onChange={handleChange}
              required
            />
          </div>

          {/* Session Type */}
          <div className="form-group">
            <label>Session Type:</label>
            <div className="input-wrapper">
              <select
                name="sessionType"
                className="form-select"
                value={formData.sessionType}
                onChange={handleChange}
                required
              >
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">In Person</option>
              </select>
              <ChevronDown className="select-icon" size={20} />
            </div>
          </div>

          {/* Participants */}
          <div className="form-group">
            <label>Study Buddies:</label>
            <div className="buddy-selection-grid">
              {matchingData?.getConnections.map((conn) => {
                const buddyId =
                  conn.userId1 === user?.id ? conn.userId2 : conn.userId1;
                const isSelected = formData.participants.includes(buddyId);

                return (
                  <BuddyCard
                    key={conn.id}
                    buddyId={buddyId}
                    isSelected={isSelected}
                    onClick={() => toggleParticipant(buddyId)}
                  />
                );
              })}
              {matchingLoading && (
                <div className="loading-text">Loading buddies...</div>
              )}
              {matchingData?.getConnections.length === 0 && (
                <div className="helper-text">
                  No study buddies found. Find some buddies first!
                </div>
              )}
            </div>
            <div className="helper-text">
              Select one or more buddies to invite to this session
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={updating}>
            {updating ? "Updating..." : "Update Session"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditStudySession;
