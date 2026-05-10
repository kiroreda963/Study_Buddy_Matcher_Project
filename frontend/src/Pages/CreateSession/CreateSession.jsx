import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ChevronDown } from 'lucide-react';
import { sessionClient, profileClient, matchingClient } from '../../clients/apolloClients';
import { GET_TOPICS, GET_CONNECTIONS, CREATE_STUDY_SESSION } from '../../graphql/operations';
import './CreateSession.css';

const CreateSession = () => {
  const [formData, setFormData] = useState({
    topic: '',
    date: '',
    time: '',
    duration: '',
    sessionType: 'ONLINE',
    participants: [],
    contactInfo: ''
  });


  // Queries
  const { data: profileData, loading: profileLoading } = useQuery(GET_TOPICS, { client: profileClient });
  const { data: matchingData, loading: matchingLoading } = useQuery(GET_CONNECTIONS, { client: matchingClient });

  // Mutation
  const [createSession, { loading: creating }] = useMutation(CREATE_STUDY_SESSION, {
    client: sessionClient,
    onCompleted: () => {
      alert('Study session created successfully!');
      setFormData({
        topic: '',
        date: '',
        time: '',
        duration: '',
        sessionType: 'ONLINE',
        participants: [],
        contactInfo: ''
      });
    },
    onError: (error) => {
      console.error('Error creating session:', error);
      alert('Failed to create study session: ' + error.message);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParticipantChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, participants: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Combine date and time and convert to ISO string
    const localDate = new Date(`${formData.date}T${formData.time}:00`);
    const combinedDate = isNaN(localDate.getTime()) ? null : localDate.toISOString();

    if (!combinedDate) {
      alert('Please enter a valid date and time.');
      return;
    }

    createSession({
      variables: {
        topic: formData.topic,
        date: combinedDate,
        duration: parseInt(formData.duration),
        sessionType: formData.sessionType,
        contactInfo: [formData.contactInfo],
        participants: formData.participants
      }
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
                <option value="" disabled>Select a topic...</option>
                {profileData?.getProfile?.topics.map(topic => (
                  <option key={topic.id} value={topic.name}>{topic.name}</option>
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
            <label>Participants:</label>
            <div className="input-wrapper">
              <select
                multiple
                name="participants"
                className="form-select"
                value={formData.participants}
                onChange={handleParticipantChange}
                style={{ height: 'auto', minHeight: '100px' }}
              >
                {matchingData?.getConnections.map(conn => {
                  // Assuming userId2 is the buddy if the current user is userId1
                  // For now just show the other ID
                  const buddyId = conn.userId2;
                  return (
                    <option key={conn.id} value={buddyId}>
                      Buddy {buddyId.substring(0, 8)}...
                    </option>
                  );
                })}
                {matchingLoading && <option>Loading buddies...</option>}
              </select>
            </div>
            <div className="helper-text">Choose from your study buddies</div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSession;
