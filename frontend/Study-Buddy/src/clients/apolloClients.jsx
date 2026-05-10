// src/clients/apolloClients.jsx
const authApiUrl = import.meta.env.VITE_AUTH_API_URI;
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
} from "@apollo/client";

const httpLink = new HttpLink({
  uri: authApiUrl,
});

export const authClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});