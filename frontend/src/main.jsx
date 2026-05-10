import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react';
import { sessionClient, profileClient, matchingClient } from './clients/apolloClients.jsx';
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ApolloProvider client={sessionClient}>
        <ApolloProvider client={profileClient}>
          <ApolloProvider client={matchingClient}>
            <App />
          </ApolloProvider>
        </ApolloProvider>
      </ApolloProvider>
    </AuthProvider>
  </StrictMode>,
)
