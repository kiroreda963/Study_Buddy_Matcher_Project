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