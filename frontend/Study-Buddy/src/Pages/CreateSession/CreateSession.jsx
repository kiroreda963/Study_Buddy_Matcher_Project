import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ChevronDown, User, Check } from "lucide-react";
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
  CREATE_STUDY_SESSION,
  GET_OTHER_USER,
  CREATE_INVITATION,
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

const CreateSession = () => {
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
  const { data: profileData, loading: profileLoading } = useQuery(GET_TOPICS, {
    client: profileClient,
  });
  const { data: matchingData, loading: matchingLoading } = useQuery(
    GET_CONNECTIONS,
    { client: matchingClient },
  );

  // Invitation Mutation
  const [createInvitation] = useMutation(CREATE_INVITATION, {
    client: sessionClient,
  });

  // Mutation
  const [createSession, { loading: creating }] = useMutation(
    CREATE_STUDY_SESSION,
    {
      client: sessionClient,
      onCompleted: (data) => {
        const sessionId = data.createStudySession.id;
        
        // Invite participants
        if (formData.participants.length > 0) {
          formData.participants.forEach((buddyId) => {
            createInvitation({
              variables: { inviteeId: buddyId, sessionId },
            }).catch(err => console.error("Failed to invite buddy:", buddyId, err));
          });
        }

        alert("Study session created successfully!");
        setFormData({
          topic: "",
          date: "",
          time: "",
          duration: "",
          sessionType: "ONLINE",
          participants: [],
          contactInfo: "",
        });
      },
      onError: (error) => {
        console.error("Error creating session:", error);
        alert("Failed to create study session: " + error.message);
      },
    },
  );

  const { user } = useAuth();

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

    // Combine date and time and convert to ISO string
    const localDate = new Date(`${formData.date}T${formData.time}:00`);
    const combinedDate = isNaN(localDate.getTime())
      ? null
      : localDate.toISOString();

    if (!combinedDate) {
      alert("Please enter a valid date and time.");
      return;
    }

    createSession({
      variables: {
        topic: formData.topic,
        date: combinedDate,
        duration: parseInt(formData.duration),
        sessionType: formData.sessionType,
        contactInfo: [formData.contactInfo],
        participants: [user?.id], // Only the creator is added directly
      },
    });
  };

  return (
    <div className="create-session-container">
      <div className="create-session-card">
        <div className="create-session-header">
          <h1>Create a study session</h1>
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
              placeholder="DD/MM/YYYY"
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
              placeholder="HH:MM"
              value={formData.time}
              onChange={handleChange}
              required
            />
            <div className="helper-text">Hours:Minutes – 24-hour format</div>
          </div>

          {/* Duration */}
          <div className="form-group">
            <label>Duration:</label>
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
                // Find the buddy ID (the one that isn't the current user)
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
              Select one or more buddies to invite. They will receive an invitation to join this session.
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={creating}>
            {creating ? "Creating..." : "Create Session"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSession;
