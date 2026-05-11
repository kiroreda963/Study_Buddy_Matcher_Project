import { Calendar, Clock, MapPin, Users, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SessionCard = ({ session, isCreator, isUpcoming, onLeave, formatDate, formatTime }) => {
  const navigate = useNavigate();
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
          <Calendar size={16} />
          <span>{formatDate(session.date)}</span>
        </div>
        <div className="detail-item">
          <Clock size={16} />
          <span>{formatTime(session.date)} ({session.duration} hours)</span>
        </div>
        <div className="detail-item">
          <MapPin size={16} />
          <span>{session.sessionType === 'ONLINE' ? 'Online' : 'In-Person Session'}</span>
        </div>
        <div className="detail-item">
          <Users size={16} />
          <span>{session.participants.length} participants</span>
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="view-details-btn"
          onClick={() => navigate(`/session/${session.id}`)}
        >
          View Details
        </button>
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

export default SessionCard;
