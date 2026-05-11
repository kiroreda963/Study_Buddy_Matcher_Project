import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const authApiUrl = import.meta.env.VITE_AUTH_API_URI;
const authHttpLink = new HttpLink({ uri: authApiUrl });
export const authClient = new ApolloClient({
  link: authLink.concat(authHttpLink),
  cache: new InMemoryCache(),
});

const sessionApiUrl = import.meta.env.VITE_SESSION_API_URI;
const sessionHttpLink = new HttpLink({ uri: sessionApiUrl });
export const sessionClient = new ApolloClient({
  link: authLink.concat(sessionHttpLink),
  cache: new InMemoryCache(),
});

const profileApiUrl = import.meta.env.VITE_PROFILE_API_URI;
const profileHttpLink = new HttpLink({ uri: profileApiUrl });
export const profileClient = new ApolloClient({
  link: authLink.concat(profileHttpLink),
  cache: new InMemoryCache(),
});

const matchingApiUrl = import.meta.env.VITE_MATCHING_API_URI || "http://localhost:3005/";
const matchingHttpLink = new HttpLink({ uri: matchingApiUrl });
export const matchingClient = new ApolloClient({
  link: authLink.concat(matchingHttpLink),
  cache: new InMemoryCache(),
});

const availabilityApiUrl = import.meta.env.VITE_AVAILABILITY_API_URI || "http://localhost:3006/";
const availabilityHttpLink = new HttpLink({ uri: availabilityApiUrl });
export const availabilityClient = new ApolloClient({
  link: authLink.concat(availabilityHttpLink),
  cache: new InMemoryCache(),
});

const notificationApiUrl = import.meta.env.VITE_NOTIFICATION_API_URI || "http://localhost:3004/";
const notificationHttpLink = new HttpLink({ uri: notificationApiUrl });
export const notificationClient = new ApolloClient({
  link: authLink.concat(notificationHttpLink),
  cache: new InMemoryCache(),
});