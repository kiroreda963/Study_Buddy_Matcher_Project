// src/clients/apolloClients.jsx
const authApiUrl = import.meta.env.VITE_AUTH_API_URI;
const profileApiUrl = import.meta.env.VITE_PROFILE_SERVICE_URL;

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = new HttpLink({
  uri: authApiUrl,
});

export const authClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

const profileHttpLink = new HttpLink({
  uri: profileApiUrl,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const profileClient = new ApolloClient({
  link: authLink.concat(profileHttpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
    },
    watchQuery: {
      fetchPolicy: 'network-only',
    },
  },
});