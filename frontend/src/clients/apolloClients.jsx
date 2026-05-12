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

const apiHost = import.meta.env.VITE_API_HOST;
const buildApiUrl = (fallback, port) =>
  apiHost ? `http://${apiHost}:${port}/graphql` : fallback;

const authApiUrl = buildApiUrl(import.meta.env.VITE_AUTH_API_URI, 3001);
const authHttpLink = new HttpLink({ uri: authApiUrl });
export const authClient = new ApolloClient({
  link: authLink.concat(authHttpLink),
  cache: new InMemoryCache(),
});

const sessionApiUrl = buildApiUrl(import.meta.env.VITE_SESSION_API_URI, 3002);
const sessionHttpLink = new HttpLink({ uri: sessionApiUrl });
export const sessionClient = new ApolloClient({
  link: authLink.concat(sessionHttpLink),
  cache: new InMemoryCache(),
});

const profileApiUrl = buildApiUrl(import.meta.env.VITE_PROFILE_API_URI, 3003);
const profileHttpLink = new HttpLink({ uri: profileApiUrl });
export const profileClient = new ApolloClient({
  link: authLink.concat(profileHttpLink),
  cache: new InMemoryCache(),
});

const matchingApiUrl = buildApiUrl(import.meta.env.VITE_MATCHING_API_URI, 3005);
const matchingHttpLink = new HttpLink({ uri: matchingApiUrl });
export const matchingClient = new ApolloClient({
  link: authLink.concat(matchingHttpLink),
  cache: new InMemoryCache(),
});

const availabilityApiUrl = buildApiUrl(import.meta.env.VITE_AVAILABILITY_API_URI, 3006);
const availabilityHttpLink = new HttpLink({ uri: availabilityApiUrl });
export const availabilityClient = new ApolloClient({
  link: authLink.concat(availabilityHttpLink),
  cache: new InMemoryCache(),
});

const notificationApiUrl = buildApiUrl(import.meta.env.VITE_NOTIFICATION_API_URI, 3004);
const notificationHttpLink = new HttpLink({ uri: notificationApiUrl });
export const notificationClient = new ApolloClient({
  link: authLink.concat(notificationHttpLink),
  cache: new InMemoryCache(),
});


