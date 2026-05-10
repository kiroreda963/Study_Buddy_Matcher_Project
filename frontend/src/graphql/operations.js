import { gql } from '@apollo/client';

export const GET_TOPICS = gql`
  query GetTopics {
    getProfile {
      topics {
        id
        name
      }
    }
  }
`;

export const GET_CONNECTIONS = gql`
  query GetConnections {
    getConnections {
      id
      userId1
      userId2
    }
  }
`;

export const CREATE_STUDY_SESSION = gql`
  mutation CreateStudySession(
    $topic: String!
    $date: String!
    $duration: Int!
    $sessionType: SessionType!
    $contactInfo: [String!]!
    $participants: [String!]
  ) {
    createStudySession(
      topic: $topic
      date: $date
      duration: $duration
      sessionType: $sessionType
      contactInfo: $contactInfo
      participants: $participants
    ) {
      id
      topic
      date
    }
  }
`;

export const GET_STUDY_SESSIONS = gql`
  query GetStudySessions {
    studySessions {
      id
      authorId
      topic
      date
      duration
      sessionType
      contactInfo
      participants
    }
  }
`;

export const JOIN_STUDY_SESSION = gql`
  mutation JoinStudySession($sessionId: ID!) {
    joinStudySession(sessionId: $sessionId) {
      id
      participants
    }
  }
`;

export const LEAVE_STUDY_SESSION = gql`
  mutation LeaveStudySession($sessionId: ID!) {
    leaveStudySession(sessionId: $sessionId) {
      id
      participants
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
    }
  }
`;

export const GET_PROFILE_PREFERENCES = gql`
  query GetProfilePreferences {
    getProfile {
      id
      preferences {
        id
        studyPace
        studyMode
        groupSize
        studyStyle
      }
    }
  }
`;

export const UPDATE_PREFERENCES = gql`
  mutation UpdatePreferences($preferences: StudyPreferenceInput!) {
    updatePreferences(preferences: $preferences) {
      id
      preferences {
        id
        studyPace
        studyMode
        groupSize
        studyStyle
      }
    }
  }
`;
