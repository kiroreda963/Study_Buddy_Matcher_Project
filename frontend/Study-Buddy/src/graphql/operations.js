import { gql } from '@apollo/client';

export const GET_PROFILE = gql`
  query GetProfile {
    getProfile {
      id
      userId
      university
      academicYear
      courses {
        id
        name
      }
      topics {
        id
        name
      }
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

export const CREATE_OR_UPDATE_PROFILE = gql`
  mutation CreateOrUpdateProfile($university: String, $academicYear: String) {
    createOrUpdateProfile(university: $university, academicYear: $academicYear) {
      id
      university
      academicYear
      courses { id name }
      topics { id name }
      preferences {
        studyPace
        studyMode
        groupSize
        studyStyle
      }
    }
  }
`;

export const ADD_COURSE = gql`
  mutation AddCourse($courseName: String!) {
    addCourse(courseName: $courseName) {
      id
      courses { id name }
    }
  }
`;

export const REMOVE_COURSE = gql`
  mutation RemoveCourse($courseId: String!) {
    removeCourse(courseId: $courseId) {
      id
      courses { id name }
    }
  }
`;

export const ADD_TOPIC = gql`
  mutation AddTopic($topicName: String!) {
    addTopic(topicName: $topicName) {
      id
      topics { id name }
    }
  }
`;

export const REMOVE_TOPIC = gql`
  mutation RemoveTopic($topicId: String!) {
    removeTopic(topicId: $topicId) {
      id
      topics { id name }
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


export const GET_OTHER_USER = gql`
  query GetOtherUser($userId: ID!) {
    otherUser(userId: $userId) {
      id
      name
      university
    }
  }
`;
export const GET_STUDY_SESSION_BY_ID = gql`
  query GetStudySession($id: ID!) {
    studySession(id: $id) {
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
export const UPDATE_STUDY_SESSION = gql`
  mutation UpdateStudySession(
    $id: ID!
    $topic: String
    $date: String
    $duration: Int
    $sessionType: SessionType
    $contactInfo: [String!]
    $participants: [String!]
  ) {
    updateStudySession(
      id: $id
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
      duration
      sessionType
      contactInfo
      participants
    }
  }
`;
